// Run against a local preview with registration DISABLED: node scripts/check-preview.mjs
import assert from "node:assert/strict";

const base = "http://localhost:3000";
const page = await fetch(base);
assert.equal(page.status, 200);
const html = await page.text();
for (const wording of [
  "Rundu Open 2026",
  "Unofficial Tournament - Just for fun",
  "Kavango River Lodge",
  "19 November 2026",
  "12:00 noon",
  "21 November",
  "22 November",
  "Friday morning",
  "N$20",
  "https://wa.me/41764801248",
  "tel:+264812752517",
]) {
  assert.ok(html.includes(wording), `Missing page content: ${wording}`);
}
assert.match(html, /<fieldset disabled=""/);
assert.ok(html.includes("Online registration is not yet open"));
const status = await fetch(`${base}/api/registration`);
assert.deepEqual(await status.json(), { status: "not-open" });
const submission = await fetch(`${base}/api/registration`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: base },
  body: JSON.stringify({
    name: "Disabled form check",
    phone: "+264811234567",
    available: true,
    requestId: crypto.randomUUID(),
  }),
});
assert.equal(submission.status, 503);
assert.deepEqual(await submission.json(), { status: "not-open" });
console.log(
  "Passed: page content, contact URLs, disabled form, status endpoint and rejected submission.",
);
