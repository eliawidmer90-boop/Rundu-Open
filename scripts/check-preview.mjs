// Run against a local preview with registration DISABLED: node scripts/check-preview.mjs
import assert from "node:assert/strict";

const base = process.env.PREVIEW_URL ?? "http://localhost:3000";
const page = await fetch(base);
assert.equal(page.status, 200);
const html = await page.text();
for (const wording of [
  "Rundu Open 2026",
  "Unofficial Tournament - Just for fun",
  "Kavango River Lodge",
  "19 November 2026",
  "24:00 Thursday night",
  "21 November",
  "Saturday only",
  "I can attend Saturday, 21 November 2026.",
  "Friday morning",
  "N$20",
  "Available spots",
  "Registered Players",
  "One open category",
  "all ages and genders play together",
  "tel:+264812752517",
]) {
  assert.ok(html.includes(wording), `Missing page content: ${wording}`);
}
assert.match(html, /<fieldset disabled=""/);
assert.doesNotMatch(html, /https:\/\/wa\.me\/|0041 76 480 12 48/);
assert.doesNotMatch(html, /Sunday|22 November|both days|additional day|16 places|Maximum 16/i);
assert.ok(html.includes("Online registration is not yet open"));
const status = await fetch(`${base}/api/registration`);
assert.deepEqual(await status.json(), {
  status: "not-open", registered: null, available: null, capacity: 8,
});
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
