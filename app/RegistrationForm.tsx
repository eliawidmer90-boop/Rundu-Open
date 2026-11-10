"use client";

import { useEffect, useRef, useState } from "react";
import type { RegistrationStatus } from "../lib/registration";

const messages: Record<string, string> = {
  "not-open":
    "Online registration is not yet open. The database connection and registration checks must be completed first.",
  open: "Registration is open. Places are allocated first come, first served.",
  full: "Registration is full. All 16 places have been filled.",
  closed:
    "Registration is closed. The deadline was Thursday, 19 November 2026, at 12:00 noon.",
  unavailable:
    "We cannot confirm registration status right now. Please try again or contact Elia.",
  accepted:
    "You're registered! Your entry has been saved. Contact Elia for payment arrangements. The match schedule will be announced Friday morning, 20 November.",
  duplicate:
    "A registration already uses this WhatsApp number. Please contact Elia to check or change your entry.",
  invalid:
    "Check your name, international WhatsApp number and availability confirmation.",
};

export default function RegistrationForm({
  initialStatus,
}: {
  initialStatus: RegistrationStatus;
}) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (initialStatus === "not-open") return;
    const timer = setInterval(async () => {
      try {
        const response = await fetch("/api/registration", {
          cache: "no-store",
        });
        const data = await response.json();
        setStatus((previous) =>
          previous === "accepted" ? previous : data.status,
        );
      } catch {
        /* Submit still checks the authoritative database state. */
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [initialStatus]);

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
      <h3>Participant details</h3>
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
            pattern="\+[1-9][0-9]{7,14}"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+264…"
            aria-describedby="phone-help"
          />
          <small id="phone-help">
            Include your country code, starting with +, and digits only.
          </small>
          <label className="checkbox">
            <input
              type="checkbox"
              required
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            <span>
              I can attend Saturday, 21 November, and Sunday, 22 November 2026,
              if required.
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
