// Namibia is UTC+02:00. An explicit offset makes the deadline unambiguous everywhere.
export const DEADLINE = "2026-11-20T00:00:00+02:00";
export type RegistrationStatus =
  "not-open" | "open" | "full" | "closed" | "unavailable";

export function configured() {
  return (
    process.env.REGISTRATION_ENABLED === "true" &&
    !!process.env.SUPABASE_URL &&
    !!process.env.SUPABASE_SECRET_KEY
  );
}

// Called only by server code; the secret key must never reach the browser.
export async function databaseRpc(
  name: string,
  body: Record<string, unknown> = {},
) {
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/rpc/${name}`,
    {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        // Supabase secret keys are API keys, not JWT bearer tokens.
        apikey: process.env.SUPABASE_SECRET_KEY!,
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) throw new Error("Database request failed");
  return response.json();
}

export async function registrationStatus(): Promise<RegistrationStatus> {
  if (!configured()) return "not-open";
  if (Date.now() >= Date.parse(DEADLINE)) return "closed";
  try {
    return await databaseRpc("registration_status");
  } catch {
    return "unavailable";
  }
}
