import {
  configured,
  databaseRpc,
  registrationStatus,
} from "../../../lib/registration";

export async function GET() {
  return Response.json(
    { status: await registrationStatus() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!configured())
    return Response.json({ status: "not-open" }, { status: 503 });
  // Same-origin JSON requests prevent other websites from submitting through a visitor's browser.
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return new Response(null, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json"))
    return new Response(null, { status: 415 });
  try {
    const raw = await request.text();
    if (raw.length > 2048) return new Response(null, { status: 413 });
    const input = JSON.parse(raw);
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const phone = typeof input.phone === "string" ? input.phone.trim() : "";
    if (
      name.length < 2 ||
      name.length > 100 ||
      !/^\+[1-9][0-9]{7,14}$/.test(phone) ||
      input.available !== true ||
      !/^[0-9a-f-]{36}$/i.test(input.requestId ?? "")
    ) {
      return Response.json({ status: "invalid" }, { status: 400 });
    }
    const status = await databaseRpc("register_participant", {
      p_name: name,
      p_phone: phone,
      p_available: true,
      p_request_id: input.requestId,
    });
    return Response.json(
      { status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // A failed response can also mean the save succeeded but the connection was lost.
    // The browser keeps the same request ID so retrying cannot create a second entry.
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
