// Exercise the real API handler with a stub database; no real entries are made.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(path, dependencies = {}) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = {
    exports: {}, Request, Response, URL,
    require: (name) => {
      if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
      return dependencies[name];
    },
  };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

const phone = load("../lib/phone.ts");
const calls = [];
const route = load("../app/api/registration/route.ts", {
  "../../../lib/phone": phone,
  "../../../lib/registration": {
    configured: () => true,
    databaseRpc: async (name, body) => { calls.push({ name, body }); return "accepted"; },
  },
});

async function submit(number) {
  return route.POST(new Request("http://localhost/api/registration", {
    method: "POST",
    headers: { Origin: "http://localhost", "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test Player", phone: number, available: true, requestId: crypto.randomUUID() }),
  }));
}

const pattern = new RegExp(`^(?:${phone.PHONE_PATTERN})$`);
for (const [input, saved] of [
  ["0811234567", "+264811234567"],
  ["+264811234567", "+264811234567"],
  ["+41764801248", "+41764801248"],
]) {
  assert.ok(pattern.test(input));
  assert.deepEqual(await (await submit(input)).json(), { status: "accepted" });
  assert.equal(calls.at(-1).name, "register_participant");
  assert.equal(calls.at(-1).body.p_phone, saved);
}
assert.equal(calls[0].body.p_phone, calls[1].body.p_phone, "Local and international forms must share a duplicate key");
const validCalls = calls.length;
for (const input of ["081123456", "08112345678", "081ABC4567", "811234567", "", null, 811234567]) {
  if (typeof input === "string") assert.equal(pattern.test(input), false);
  const response = await submit(input);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { status: "invalid" });
}
assert.equal(calls.length, validCalls, "Invalid numbers must not reach the database");
console.log("Passed: local 081 and international submissions, canonical duplicate keys, and invalid number rejection.");
