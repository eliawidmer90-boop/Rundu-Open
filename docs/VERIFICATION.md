# Initial verification — 10 November 2026

- Production build passed with Next.js 16.4.6 and Node.js 22.23.4.
- TypeScript check passed.
- Dependency installation audit reported zero known vulnerabilities at installation time.
- Local production HTTP checks passed: page returns 200; required tournament wording and both contact URLs are present; form fieldset is disabled; registration status is `not-open`; a direct submission is rejected with HTTP 503 and `not-open`.
- Git repository initialised on `main`; no remote configured. Environment files and dependencies are ignored. No publication or domain changes performed.

## Still unverified

- Desktop and mobile **visual inspection**: the computer-use tool stopped because it could not determine the browser URL reliably. Responsive CSS is implemented, but browser layout and interaction checks remain required. Check at approximately 375px, 768px and 1440px wide; ensure no sideways scrolling, readable text, usable navigation and a visible disabled-registration message.
- Supabase is not connected. No permanent save, real database permissions check, concurrency check or live deadline check has been performed. SQL and the test procedure are in `supabase/` and `docs/SETUP.md`.
- WhatsApp and phone links have the correct destinations in the generated page; no message was sent and no phone call was placed.
- GitHub, Vercel and domain integration are not connected or verified.

Online registration must remain disabled until database checks pass.
