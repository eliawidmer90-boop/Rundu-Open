"use client";

import { useEffect, useRef, useState } from "react";
import type { RegistrationSummary } from "../lib/registration";
import { PHONE_PATTERN } from "../lib/phone";

const messages: Record<string, string> = {
  "not-open":
    "Online registration is not yet open. The database connection and registration checks must be completed first.",
  open: "Registration is open. Places are allocated first come, first served.",
  full: "Registration is full. All 8 places have been filled.",
  closed:
    "Registration is closed. The deadline was Thursday night, 19 November 2026, at 24:00.",
  unavailable:
    "We cannot confirm registration status right now. Please try again or contact Elia.",
  accepted:
    "You're registered! Your entry has been saved. Contact Elia for payment arrangements. The match schedule will be announced Friday morning, 20 November.",
  duplicate:
    "A registration already uses this WhatsApp number. Please contact Elia to check or change your entry.",
  invalid:
    "Check your name, WhatsApp number (for example, 0811234567) and availability confirmation.",
};

export default function RegistrationForm({
  initialSummary,
}: {
  initialSummary: RegistrationSummary;
}) {
  const [status, setStatus] = useState<string>(initialSummary.status);
  const [summary, setSummary] = useState(initialSummary);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [available, setAvailable] = useState(false);
  async function refreshSummary() {
    try {
      const response = await fetch("/api/registration", { cache: "no-store" });
      if (!response.ok) throw new Error("Status unavailable");
      const data: RegistrationSummary = await response.json();
      setSummary(data);
      setStatus((previous) => previous === "accepted" ? previous : data.status);
    } catch {
      setSummary((previous) => ({ ...previous, registered: null, available: null }));
      setStatus((previous) => previous === "accepted" ? previous : "unavailable");
    }
  }

  useEffect(() => {
    const timer = setInterval(refreshSummary, 30000);
    return () => clearInterval(timer);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || status !== "open") return;
    setBusy(true);
    setFeedback("");
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          available,
          requestId: requestId.current,
        }),
      });
      const data = await response.json();
      if (["accepted", "full", "closed", "not-open"].includes(data.status))
        setStatus(data.status);
      else setFeedback(messages[data.status] ?? messages.unavailable);
      if (["accepted", "full", "closed", "not-open"].includes(data.status))
        await refreshSummary();
    } catch {
      setFeedback(
        "We could not confirm your entry. Retry with the same details; your request will not be saved twice.",
      );
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || status !== "open";
  return (
    <div className="form-card">
      <dl className="registration-counts" aria-label="Registration places" aria-live="polite">
        <div>
          <dt>Available spots</dt>
          <dd>{summary.available ?? "—"}<small> / {summary.capacity}</small></dd>
        </div>
        <div>
          <dt>Registered Players</dt>
          <dd>{summary.registered ?? "—"}</dd>
        </div>
      </dl>
      {summary.registered === null && (
        <p className="counts-help">Player counts are temporarily unavailable.</p>
      )}
      <h3>Participant details</h3>
      <p className="category-note">One open category — all ages and genders play together.</p>
      <p
        className={`notice ${status === "accepted" ? "success" : ""}`}
        role="status"
      >
        {messages[status]}
      </p>
      <form onSubmit={submit}>
        <fieldset disabled={disabled}>
          <label htmlFor="name">Participant’s name</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
          />
          <label htmlFor="phone">WhatsApp number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            pattern={PHONE_PATTERN}
            title="Enter 10 digits starting with 081, or an international number starting with +."
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0811234567"
            aria-describedby="phone-help"
          />
          <small id="phone-help">
            Use 10 digits starting with 081, for example 0811234567.
            International numbers starting with + are also accepted.
          </small>
          <label className="checkbox">
            <input
              type="checkbox"
              required
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            <span>
              I can attend Saturday, 21 November 2026.
            </span>
          </label>
          <button className="button primary submit" type="submit">
            {busy
              ? "Saving your entry…"
              : status === "accepted"
                ? "Registration saved ✓"
                : status === "open"
                  ? "Register for N$20 →"
                  : "Online registration unavailable"}
          </button>
        </fieldset>
        {feedback && (
          <p role="alert" className="notice">
            {feedback}
          </p>
        )}
      </form>
      <p className="privacy">
        Your WhatsApp number is private and will be used by the organiser for
        tournament communication. It will not appear on this website.
      </p>
    </div>
  );
}
