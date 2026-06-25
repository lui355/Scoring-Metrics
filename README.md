# Fishbowl Topics

A complete, minimal static web app for running anonymous Fishbowl discussion topic submissions.

## Files

- `index.html` — create a new fishbowl and QR code.
- `submit.html` — public anonymous submission form for participants.
- `admin.html` — facilitator dashboard with realtime topics, close/reopen submissions, QR code, random picker, and big display.
- `js/app.js` — shared Supabase, QR, URL, toast, shuffle, and HTML escaping helpers.
- `sql/supabase.sql` — exact Supabase tables, realtime publication statements, and RLS policies.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run the full contents of `sql/supabase.sql`.
3. In Project Settings → API, copy your Project URL and anon public key.
4. Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` in `js/app.js`.
5. Ensure Realtime is enabled for `fishbowls` and `submissions` if Supabase asks you to confirm table replication.

## GitHub Pages deployment

1. Commit these static files to your repository.
2. Push to GitHub.
3. In GitHub, open Settings → Pages.
4. Set Source to "Deploy from a branch".
5. Choose your branch and root folder, then save.
6. Visit `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/` and create your first bowl.

The app uses relative paths only and requires no framework, bundler, or build step.
