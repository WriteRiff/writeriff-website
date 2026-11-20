# writeriff.com

The public website for WriteRiff, an app for writing, reading and critiquing fiction. Plain HTML, CSS and JavaScript with no build step, served by GitHub Pages at https://writeriff.com.

- Pages: home, `features/`, `beta/`, `contact/`, `unsubscribe/`, `privacy/`, `terms/`, plus the app's account pages (`account-callback/`, `email/`, `delete-account/`).
- The beta and contact forms save to Supabase using the public publishable key only (`js/wr-config.js`); row-level security allows inserts only.
- The words on `privacy/`, `terms/` and `delete-account/` come from the app repository (wrapped in the site layout); change them there, not here.
- Everything borrowed (photos, fonts, libraries) is listed in `LICENSES.md`; data the site collects is in `DATA-USES.md`.

© 2026 Beckman Studios LLC