# Data uses: WriteRiff website (writeriff.com)

Every kind of data the website collects or sends. Update the row in the same change that adds, changes or removes a data flow (shared rule, 2026-11-18). Feeds the privacy policy (`site/_shared/privacy-content.html`, copied into each version's `privacy/` page).

Status 2026-11-20: the site isn't live and the tables aren't created yet (`supabase/001_website_forms.sql`, planned).

| Data | Where it's collected | Where it's stored | Outside service that receives it | Why | How long it's kept | Linked to the person? |
|---|---|---|---|---|---|---|
| Beta sign-up: email (required), name and "what do you write" (optional), page signed up on, date/time | Beta form (home page and `beta/`) | Supabase table `beta_signups` (dev project `rnehrjdaruejuueztngc`) | Supabase (database host). Later, the email service used to send beta emails | To email the person about the WriteRiff beta | Until the beta ends or they ask to be removed | Yes (email address) |
| News opt-in (`marketing_opt_in`, unticked by default) on the beta and contact forms (Version A6 on) | Beta form, contact form | Same row as the sign-up / message | Supabase. Later, the email service used for news | Only if ticked: WriteRiff news, promotions and new features. Beta-only sign-ups get beta emails only | Until the person unsubscribes (wording and retention to match the official privacy policy) | Yes (email address) |
| Contact message: name, email, topic, message, date/time | Contact form (`contact/`) | Supabase table `contact_messages` | Supabase | To read and answer questions and suggestions | As long as needed to answer, at most 2 years | Yes (email address) |
| Intro "already seen" flag (`wr-intro-seen`) | Every page (opening animation) | The visitor's own browser (localStorage); never sent anywhere | None | So the opening animation plays only once per visitor | Until the visitor clears their browser data | No |
| Standard web server logs (IP address, browser, page requested) | Every request | Hosting provider (GitHub Pages, once published) | GitHub | Security and keeping the site working (we don't use these) | GitHub's own retention | Not by us |
| Account pages (`account-callback/`, `delete-account/`) | Links in WriteRiff app emails | Nothing stored by the website; the callback page talks directly to Supabase Auth to confirm an email or set a new password | Supabase Auth | Part of the app's account system (covered by the app's own DATA-USES.md) | n/a | (app account) |

Not used: cookies, analytics, advertising or tracking scripts, third-party fonts or embeds. If Cloudflare Web Analytics is added later (recommended in the plan), add a row and a privacy-policy paragraph.
