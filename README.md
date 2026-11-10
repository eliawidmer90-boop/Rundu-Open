# Rundu Open 2026

A small Next.js website with plain CSS and a prepared Supabase registration system. Nothing has been published. Online registration is disabled by default.

## Open the local preview

On this computer, run `.\start-preview.cmd` in the VS Code terminal (or double-click the file). It uses the portable Node.js copy downloaded for the initial checks if Node is not installed. Open http://localhost:3000 once it says Ready. Temporary files can be removed by Windows, so installing Node.js LTS is recommended for ongoing work.

For a normal setup on any computer:

1. Install the current **Node.js LTS** from https://nodejs.org if `node --version` does not work. Restart the VS Code terminal afterwards.
2. Open this project folder in VS Code. In its terminal run:

   ```powershell
   npm install
   npm run dev
   ```

3. Visit http://localhost:3000. Keep the terminal running; press Ctrl+C to stop it.

Before publishing, run `npm run typecheck` and `npm run build`. After building, `npm start` serves the production version locally.

With that production preview running and registration disabled, `node scripts/check-preview.mjs` checks required page content, contact URLs, disabled form markup and rejection of submissions.

## Where to make changes

| File | Purpose |
| --- | --- |
| `app/page.tsx` | Page sections, tournament wording, navigation, contact links and court illustration |
| `app/globals.css` | Colours at `:root`, typography, spacing, layout and phone rules at the bottom |
| `app/layout.tsx` | Browser tab title, description and shared page shell |
| `app/RegistrationForm.tsx` | Form fields, disabled state, submission and feedback |
| `app/api/registration/route.ts` | Server endpoint that validates input and talks to Supabase |
| `lib/registration.ts` | Server database connection and registration status |
| `supabase/schema.sql` | Permanent tables and database rules; apply once to Supabase |
| `supabase/checks.sql` | Database checks for a separate empty test project |
| `.env.example` | Names of settings, with no real secrets |
| `docs/SETUP.md` | Account setup, testing, GitHub and Vercel instructions |

The browser displays the page and form. It sends registrations to the Next.js server. The server calls a Supabase database function, which checks the deadline and capacity and saves the entry in one transaction. Only a successful saved response is shown as confirmed. The registration form shows available spots out of 16 and a registered-player count, refreshed every 30 seconds. For existing databases, apply `supabase/migrations/20261110_registration_counts.sql` to enable these counts. You view or delete entries privately in Supabase's Table Editor (`registrations`); visitors cannot read participant names or phone numbers. Removing an entry frees a spot if registration is still open before the deadline.

The unique WhatsApp number prevents accidental repeat entries. The request ID also protects retries after a lost response. Different people sharing one WhatsApp number should contact Elia. There is no phone ownership verification or automated bot protection yet; review these before promoting registration widely.

Future brackets, fixtures and results can be added as new components and tables. No invented entrants or results are included.

## Text and styling tips

Edit a sentence in `app/page.tsx`, save, and watch the preview update. `className` connects an element to rules in `globals.css`. Change `--green`, `--paper` or `--lime` at the top of that file to change the palette. CSS grid creates the columns; the `@media` rules stack them on smaller screens. Fonts use Google Fonts with local Arial fallbacks if unavailable.

## Still to confirm

- Match rules and format.
- Prize money, if any.
- Daily start times.
- Payment arrangements.
- Domain ownership and later connection of `runduopen.info`.

See [the setup guide](docs/SETUP.md) for the next steps. Do not enable online registration until the database and submission checks pass.
