# Legal review list: WriteRiff website (writeriff.com)

One row per feature or change with legal angles (shared rule, 2026-11-20). Status: **needs audit**, **audited** (date and where the findings are) or **not applicable**. Before each beta and each launch, a legal audit works through every **needs audit** row. Not legal advice: the owners decide when a lawyer reviews it.

The official Privacy Policy and Terms of Use come from the app repo (`C:\Users\scott\WriteRiff\docs\legal\`, published as `web/privacy` and `web/terms`); change their wording there, never only here.

| Date | Feature | Legal questions | Status |
|---|---|---|---|
| 2026-11-20 | Beta sign-up form with one required, unticked box covering beta emails plus news, special offers and new features | Bundled marketing consent as a condition of joining (fine under US CAN-SPAM; would not count as freely given consent under EU/UK GDPR); no email confirmation (anyone can sign up someone else's address); record of the exact wording agreed to; "never sell or share" promise vs service providers (Supabase, Zoho) | Audited 2026-11-21 (`WriteRiff-Website/docs/audit-2026-11-21.md`, legal section); owner questions open |
| 2026-11-20 | 18+ and US-only beta notices | No age or location check, only notices; Terms say the beta is US-only but also address people elsewhere | Audited 2026-11-21 (same file); owner question open |
| 2026-11-20 | Contact form | Retention "at most 2 years" in the privacy policy has no automatic deletion; copies go to hello@ by email | Audited 2026-11-21 (same file); owner question open |
| 2026-11-20 | Unsubscribe page | Anyone can unsubscribe any address (normal practice, low harm); takes effect immediately; also turns off news on an app account with that email | Audited 2026-11-21 (same file); no change needed |
| 2026-11-20 | Form email alerts to hello@writeriff.com through Zoho ZeptoMail | Privacy policy lists Zoho only for account emails; contact message text and beta details travel by email | Audited 2026-11-21 (same file); privacy wording question for the owners |
| 2026-11-20 | Spam limits that store a hash of the visitor's IP address for about a day | Not mentioned in the privacy policy; a plain hash of an IPv4 address can be reversed by trying every address | Audited 2026-11-21 (same file); privacy wording question for the owners |
| 2026-11-20 | Cloudflare Web Analytics (cookieless) and the intro "already seen" flag in the browser | Privacy page says "nothing is stored on your device", but the site keeps one small flag in the browser for the opening animation (EU ePrivacy would treat this as a stored item; US-only beta) | Audited 2026-11-21 (same file); privacy wording question for the owners |
| 2026-11-20 | Downtime alarm and monthly report (GitHub Actions, Pushover) | No visitor personal data; monthly report includes page addresses and referring sites | Audited 2026-11-21 (same file); listed in DATA-USES.md |
| 2026-11-20 | Photos, fonts and the animation library | Licences allow commercial use (Unsplash License, CC0, SIL OFL 1.1, MIT); notices kept next to the files | Audited 2026-11-21 (same file); LICENSES.md and IMAGE-CREDITS.md |
| 2026-11-20 | Feature claims on the home, Features and Beta pages (critiques, sharing, audiobooks, AI help) | Advertising accuracy: Features and Beta describe critiques and sharing as available, Terms say they arrive later | Audited 2026-11-21 (same file); owner question open |
| 2026-11-20 | Account pages (`account-callback/`, `delete-account/`) | Covered by the app's own legal review (copied from the app repo) | Not applicable here (app repo) |
