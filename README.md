# ლუკა & მარიამი — Wedding Invitation

Georgian-language digital wedding invitation built as a static GitHub Pages site with Supabase guest submission storage.

## Files

- `index.html` — invitation, guest form, agenda
- `css/styles.css` — Georgian/autumn styling
- `js/config.js` — Supabase public configuration
- `js/app.js` — UI + submission logic
- `supabase/schema.sql` — database table + RLS policy

## Supabase setup

1. Create a Supabase project.
2. Go to **SQL Editor**.
3. Paste and run `supabase/schema.sql`.
4. Go to **Project Settings -> API**.
5. Copy the Project URL and publishable key (or legacy anon key).
6. Paste both into `js/config.js`.

Never put a `service_role` or secret key in frontend code.

The SQL intentionally grants anonymous users INSERT only. No public SELECT policy is created, so website visitors cannot fetch the guest list.

## Local test

From the project directory:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Push to GitHub

Create an empty repository, e.g. `luka-mariam-wedding`, then:

```bash
git init
git add .
git commit -m "Create wedding invitation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/luka-mariam-wedding.git
git push -u origin main
```

## Enable GitHub Pages

In GitHub:

1. Open repository **Settings**.
2. Open **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose branch `main` and folder `/ (root)`.
5. Save.

Your URL will normally be:

`https://YOUR_USERNAME.github.io/luka-mariam-wedding/`

## Guest data

In Supabase, open **Table Editor -> guest_submissions** to view submissions.

Fields:
- first_name
- last_name
- companion_first_name
- companion_last_name
- created_at

Names are stored exactly as guests enter them; there is no Excel list or spelling validation.
