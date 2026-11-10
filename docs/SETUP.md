# Setup and everyday use

## 1. Connect a permanent Supabase database

1. Create your own account at https://supabase.com and create a project. Choose a suitable plan yourself; no service has been purchased or connected for you. Keep its database password in a password manager.
2. Open **SQL Editor**, paste `supabase/schema.sql` and run it once. This creates `registrations` and `tournament_settings`. Re-running the initial schema is intentionally not supported; future changes should be new migration files.
3. Find the project URL (`https://your-project.supabase.co`) and, under **Settings > API Keys > Secret keys**, copy the **server-side secret key** beginning `sb_secret_`. Do not use the publishable key or a PostgreSQL connection string. Never paste the secret key into chat, source code, a GitHub issue, or a variable beginning `NEXT_PUBLIC_`. This key has powerful database access.
4. Copy `.env.example` to `.env.local` in the project root. Fill in `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Keep `REGISTRATION_ENABLED=false` while checking setup. `.env.local` is ignored by Git. If you previously used `SUPABASE_SERVICE_ROLE_KEY`, replace that setting with `SUPABASE_SECRET_KEY` and the new secret key.
5. Restart the development server after changing environment variables.

The server sends the secret key in the `apikey` header, not as an `Authorization` bearer token. Secret keys use the same database `service_role` role, so the existing schema and function grants do not need changing. Do not rerun `schema.sql` to switch API keys. With `REGISTRATION_ENABLED=false`, the website skips database requests; its disabled message alone does not verify the connection. Follow the test-project steps below to verify it.

Supabase stores entries outside the website code, so updates and other computers do not erase registrations. On another device, clone the repository and provide the same environment settings privately. Use Supabase's dashboard for secure organiser access, and protect your account with multifactor authentication. Do not give participants your Supabase login or service key.

## 2. Test before opening

Use a separate Supabase test project with the same schema. Do not put test entries in the real tournament database.

- Run `supabase/checks.sql` in the empty test project's SQL Editor. It checks saved entries, retries, duplicate numbers, availability validation, capacity and public access. It rolls back all test data.
- For browser/API tests in the test project, set `tournament_settings.registration_open` to true in Table Editor and set local `REGISTRATION_ENABLED=true`. Restart the server. Test a valid entry, an invalid phone, an unchecked availability box, and a duplicate number. Confirm that successes really appear in Table Editor.
- Submit at least 17 **different** entries simultaneously to the empty test project. Verify exactly 16 saves and a full response for the rest. This live concurrency check remains required; the advisory transaction lock is designed to serialize these calls. Check the UI shows full on refresh.
- Test retrying the identical request ID after a successful save: only one row should exist and the response should still say accepted.
- Test unavailable database credentials: there must be no success confirmation.
- Test the deadline in a test project only, temporarily changing the timestamp in both database functions and `lib/registration.ts` to a near-future time. Before it passes, submit successfully; at and after it, submissions must be closed. Restore the exact production deadline: `2026-11-20T00:00:00+02:00` (22:00 UTC on 19 November).
- Confirm anonymous and authenticated API keys cannot select the registrations table or call the registration functions. No public read policies are provided.
- Check desktop and phone widths, keyboard navigation, labels, WhatsApp and calling links.

For the real project, only after these checks pass, set `tournament_settings.registration_open=true` and `REGISTRATION_ENABLED=true`. Both switches are required. The website shows available spots out of 16 and a registered-player count. The server reads only a database row count for these indicators; names and phone numbers are not returned to visitors. Counts and status refresh every 30 seconds and after a successful registration. If the count cannot be retrieved, the website shows a dash rather than a misleading zero. The database checks its own clock on every submission.

The database's `received_at` records the server save time after the submission obtains its lock. Order by `received_at` ascending, then `id` ascending for the accepted order. Very close simultaneous entries are ordered by the database, not a participant's device clock.

The dashboard's Table Editor is the initial private organiser area. Select `registrations`, sort as above, and keep exports private. Arrange a sensible data deletion date after the tournament. Database durability is separate from backups: review your chosen Supabase plan's backup and availability options.

### View or remove registered players

For an existing database, first run `supabase/migrations/20261110_registration_counts.sql` in Supabase SQL Editor to enable the website's count indicators. This adds a server-only summary function and preserves all entries and settings. Fresh databases using the updated initial schema already include it. Until applied, registration continues to work but counts display a dash.

Sign in to your Supabase project, open **Table Editor**, and select **registrations**. The `participant_name`, `whatsapp`, `available_both_days`, and `received_at` columns show the saved entries. Sort by `received_at` ascending, then `id` ascending for registration order.

To remove a player, carefully verify their name and WhatsApp number, select that row, and use the table's delete action. Deletion permanently removes that entry. If you might need the record, save it privately first. No player has been deleted by these website changes.

Removing one row frees one spot. The public counts update within 30 seconds (or on page reload). Registration reopens automatically after a removal only if the opening switches remain enabled and the deadline has not passed. The removed player can register again; deletion is not a ban. Supabase remains the private organiser backend; there is no public delete endpoint.

## Open registration for 19 November at 24:00

For an existing database, run supabase/migrations/20261110_open_registration.sql in Supabase SQL Editor. This updates the deadline to midnight at the end of Thursday (20 November at 00:00 Namibia time), opens the database switch, and preserves existing entries. Do not rerun the initial schema. Set REGISTRATION_ENABLED=true on the website server and restart or redeploy. The local environment switch has been enabled; the hosted database migration must still be applied and verified.

## 3. GitHub, later

This folder has its own Git repository, independent of Eggs. No remote repository has been created or connected. Before your first commit run `git status` and confirm no credentials are listed.

```powershell
git add .
git commit -m "Create initial Rundu Open website"
```

When ready, create an empty **private** GitHub repository called `rundu-open`. Follow GitHub's instructions to add its remote and push your `main` branch. Never commit `.env.local`. The committed `.env.example` contains only blank placeholders.

## 4. Vercel and domain, later

When you choose to publish, import that private repository into Vercel and select Next.js. Add the three environment variables privately in Vercel settings; keep registration disabled until the production connection has been checked. Use separate test database credentials for preview deployments so previews cannot take real places. Changing environment variables needs a new deployment.

Normal update path: **edit in VS Code → preview and build → commit → push to GitHub → Vercel automatically builds and updates the site**. Supabase data stays in its hosted database throughout.

`runduopen.info` is the intended domain only. First confirm it is registered to you. Later add it to Vercel and follow the specific DNS records Vercel provides. No DNS changes or deployments have been made.

## Production considerations

The form validates on both the server and database. Database table access and function execution are revoked from public visitors; only the server key can call registration functions. The endpoint checks same-origin submissions. This is not a bot prevention system: before widely advertising registration, consider request rate limiting and a challenge such as Turnstile to reduce fake entries. Never log submitted names, phone numbers or credentials. Contact Elia for corrections, cancellations or shared phone numbers; these do not yet have self-service workflows.

Official references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Supabase database functions](https://supabase.com/docs/guides/database/functions), [Supabase row level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
