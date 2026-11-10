// Isolated checks: no network calls and no changes to stored registrations.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../lib/registration.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function check({ count = 0, status = "open", countFails = false, enabled = true, extra = {}, now = "2026-11-10T00:00:00Z" }) {
  const calls = [];
  const context = {
    exports: {},
    process: { env: {
      REGISTRATION_ENABLED: String(enabled),
      SUPABASE_URL: "https://example.invalid",
      SUPABASE_SECRET_KEY: "test-secret",
    } },
    Date: class extends Date { static now() { return Date.parse(now); } },
    AbortSignal,
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith("/rpc/registration_status")) return Response.json(status);
      if (countFails) throw new Error("Summary unavailable");
      return Response.json({ status, registered: count, ...extra });
    },
  };
  vm.runInNewContext(compiled, context);
  const summary = JSON.parse(JSON.stringify(await context.exports.registrationSummary()));
  const countCall = calls.find(({ url }) => url.endsWith("/rpc/registration_summary"));
  if (enabled) {
    assert.equal(countCall.options.method, "POST");
    assert.equal(countCall.options.body, "{}");
    assert.ok(calls.every(({ url }) => url.includes("/rpc/")));
  } else assert.equal(calls.length, 0);
  assert.deepEqual(Object.keys(summary).sort(), ["available", "capacity", "registered", "status"]);
  return summary;
}

assert.deepEqual(await check({}), { status: "open", registered: 0, available: 16, capacity: 16 });
assert.equal((await check({ count: 16, status: "full" })).available, 0);
// A removed entry is reflected by a fresh count; it does not need a local decrement.
assert.equal((await check({ count: 15 })).available, 1);
assert.equal((await check({ count: 17 })).available, 0);
assert.equal((await check({ countFails: true })).registered, null);
assert.equal((await check({ count: -1 })).registered, null);
assert.equal((await check({ count: "3" })).registered, null);
assert.deepEqual(await check({ count: 1, extra: { participant_name: "Private name", whatsapp: "Private phone" } }), {
  status: "open", registered: 1, available: 15, capacity: 16,
});
assert.equal((await check({ now: "2026-11-19T21:59:59Z" })).status, "open");
assert.equal((await check({ now: "2026-11-19T22:00:00Z" })).status, "closed");
assert.deepEqual(await check({ enabled: false }), {
  status: "not-open", registered: null, available: null, capacity: 16,
});
assert.equal(Date.parse("2026-11-20T00:00:00+02:00"), Date.parse("2026-11-19T22:00:00Z"));
console.log("Passed: counts, capacity, removed entries, fallback, deadline boundary, and private field filtering.");
