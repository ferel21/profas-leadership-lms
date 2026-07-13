const baseUrl = new URL(process.env.BASE_URL || "http://127.0.0.1:3000");
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname);
if (!isLocal && process.env.LOAD_TEST_CONFIRM !== "I_UNDERSTAND") {
  throw new Error("Refusing to load-test a non-local target without LOAD_TEST_CONFIRM=I_UNDERSTAND.");
}

const totalRequests = Math.max(1, Number(process.env.LOAD_TEST_REQUESTS || 60));
const concurrency = Math.max(1, Math.min(totalRequests, Number(process.env.LOAD_TEST_CONCURRENCY || 8)));
const timeoutMs = Math.max(1000, Number(process.env.LOAD_TEST_TIMEOUT_MS || 10000));
const maxP95Ms = Math.max(1, Number(process.env.LOAD_TEST_P95_MS || 1500));
const maxErrorRate = Math.min(1, Math.max(0, Number(process.env.LOAD_TEST_MAX_ERROR_RATE || 0.01)));
const endpoints = ["/", "/program", "/api/courses", "/privasi", "/api/health"];
const results = [];
let cursor = 0;

// Warm the Next.js/Prisma path once so the measured window represents steady
// state rather than compilation, first-render, or cache population latency.
for (const path of endpoints) {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
  });
  await response.arrayBuffer();
  if (response.status < 200 || response.status >= 400) {
    throw new Error(`Warmup failed for ${path}: HTTP ${response.status}`);
  }
}

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= totalRequests) return;
    const path = endpoints[index % endpoints.length];
    const started = performance.now();
    try {
      const response = await fetch(new URL(path, baseUrl), {
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      });
      results[index] = {
        index,
        path,
        status: response.status,
        latencyMs: Math.round((performance.now() - started) * 100) / 100,
        ok: response.status >= 200 && response.status < 400,
      };
      await response.arrayBuffer();
    } catch (error) {
      results[index] = {
        index,
        path,
        status: 0,
        latencyMs: Math.round((performance.now() - started) * 100) / 100,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

const started = performance.now();
await Promise.all(Array.from({ length: concurrency }, worker));
const latencies = results.map(result => result.latencyMs).sort((a, b) => a - b);
const percentile = (value) => latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * value) - 1)] || 0;
const failed = results.filter(result => !result.ok);
const byEndpoint = Object.fromEntries(endpoints.map(path => {
  const endpointResults = results.filter(result => result.path === path);
  const endpointLatencies = endpointResults.map(result => result.latencyMs).sort((a, b) => a - b);
  return [path, {
    requests: endpointResults.length,
    errors: endpointResults.filter(result => !result.ok).length,
    p95: endpointLatencies[Math.min(endpointLatencies.length - 1, Math.ceil(endpointLatencies.length * 0.95) - 1)] || 0,
    max: endpointLatencies[endpointLatencies.length - 1] || 0,
  }];
}));
const summary = {
  target: baseUrl.origin,
  totalRequests,
  concurrency,
  elapsedMs: Math.round((performance.now() - started) * 100) / 100,
  errors: failed.length,
  errorRate: failed.length / totalRequests,
  latencyMs: {
    p50: percentile(0.5),
    p95: percentile(0.95),
    max: latencies[latencies.length - 1] || 0,
  },
  thresholds: { maxP95Ms, maxErrorRate },
  endpoints,
  byEndpoint,
};
console.log(JSON.stringify({ summary, failures: failed.slice(0, 20) }, null, 2));

if (summary.errorRate > maxErrorRate || summary.latencyMs.p95 > maxP95Ms) {
  console.error("Load test failed threshold gate.");
  process.exitCode = 1;
}
