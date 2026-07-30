import assert from "node:assert/strict";
import test from "node:test";
import { createSignedUploadForm } from "@/utils/direct-upload";

test("signed Supabase uploads use the multipart shape expected by Storage", () => {
  const file = new File([Buffer.from("%PDF-1.7")], "jawaban.pdf", {
    type: "application/pdf",
  });
  const body = createSignedUploadForm(file);

  assert.equal(body.get("cacheControl"), "3600");
  const uploaded = body.get("");
  assert.ok(uploaded instanceof File);
  assert.equal(uploaded.name, "jawaban.pdf");
  assert.equal(uploaded.type, "application/pdf");
  assert.equal(uploaded.size, file.size);
});

