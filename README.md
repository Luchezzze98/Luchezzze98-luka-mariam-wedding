/opt/homebrew/Library/Homebrew/cmd/shellenv.sh: line 18: /bin/ps: Operation not permitted
# ლუკა & მარიამი — Wedding Invitation

Georgian-language digital wedding invitation built as a static GitHub Pages site with Supabase RSVP storage.

## Highlights

- responsive, accessible single-page invitation
- live wedding countdown and calendar download
- schedule, venue details, and Google Maps links
- attendance, companion, and dietary-note RSVP fields
- subtle reveal animations with reduced-motion support
- Supabase row-level security with anonymous insert-only access

## Files

- `index.html` — invitation content, schedule, locations, and RSVP form
- `styles.css` — design system, layouts, components, and responsive styling
- `config.js` — Supabase public configuration
- `app.js` — countdown, calendar, UI, validation, and submission logic
- `favicon.svg` — browser icon
- `schema.sql` — database table, migration, indexes, and RLS policy

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Paste and run `schema.sql`. It is safe to run for both a new project and a project using the original schema.
4. Open **Project Settings → API**.
5. Copy the Project URL and publishable key (or legacy anon key).
6. Paste both into `config.js`.

Never put a `service_role` or secret key in frontend code. A publishable or anonymous key is expected to be visible in browser source.

The SQL grants anonymous users `INSERT` only. No public `SELECT` policy is created, so website visitors cannot retrieve the guest list.

## Local test

From the project directory:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Deploy with GitHub Pages

In the repository settings:

1. Open **Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Choose branch `main` and folder `/ (root)`.
4. Save.

The production URL is:

`https://luchezzze98.github.io/Luchezzze98-luka-mariam-wedding/`

## Guest data

In Supabase, open **Table Editor → guest_submissions**. Stored fields are:

- `attendance_status`
- `first_name`
- `last_name`
- `companion_first_name`
- `companion_last_name`
- `dietary_notes`
- `created_at`

Before deploying this version, run the latest `schema.sql` once so the new RSVP columns exist.
