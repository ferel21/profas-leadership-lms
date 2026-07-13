import fs from "node:fs";
import path from "node:path";

const buildDir = path.resolve(".next");
const manifestPath = path.join(buildDir, "app-build-manifest.json");
if (!fs.existsSync(manifestPath)) {
  throw new Error("Performance budget membutuhkan build production. Jalankan npm run build terlebih dahulu.");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const assetSize = file => {
  const absolute = path.join(buildDir, file);
  return fs.existsSync(absolute) ? fs.statSync(absolute).size : 0;
};
const routeAssets = route => new Set(manifest.pages[route] || []);
const layoutAssets = routeAssets("/layout");
const routeSizeKb = route => {
  const files = new Set([...layoutAssets, ...routeAssets(route)]);
  return Math.round([...files].reduce((sum, file) => sum + assetSize(file), 0) / 1024);
};

const budgets = [
  ["landing", "/page", Number(process.env.PERF_LANDING_KB || 1200)],
  ["course player", "/belajar/[slug]/page", Number(process.env.PERF_PLAYER_KB || 1300)],
  ["dashboard", "/dashboard/page", Number(process.env.PERF_DASHBOARD_KB || 1800)],
];

console.log("Performance budget (uncompressed build assets):");
let failed = false;
for (const [name, route, budget] of budgets) {
  const actual = routeSizeKb(route);
  const status = actual <= budget ? "PASS" : "FAIL";
  console.log(`- ${status} ${name}: ${actual} KB / ${budget} KB`);
  if (actual > budget) failed = true;
}

const staticChunks = path.join(buildDir, "static", "chunks");
const largestChunk = fs.existsSync(staticChunks)
  ? fs.readdirSync(staticChunks).filter(file => file.endsWith(".js")).map(file => ({ file, bytes: assetSize(path.join("static", "chunks", file)) })).sort((a, b) => b.bytes - a.bytes)[0]
  : null;
if (largestChunk) {
  console.log(`- Largest top-level JS chunk: ${Math.round(largestChunk.bytes / 1024)} KB (${largestChunk.file})`);
}

if (failed) process.exitCode = 1;
