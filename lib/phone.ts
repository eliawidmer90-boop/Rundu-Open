// Accept a local 081 number or the existing international format.
export const PHONE_PATTERN = "(?:081[0-9]{7}|\\+[1-9][0-9]{7,14})";

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const phone = value.trim();
  if (/^081[0-9]{7}$/.test(phone)) return `+264${phone.slice(1)}`;
  if (/^\+[1-9][0-9]{7,14}$/.test(phone)) return phone;
  return null;
}
