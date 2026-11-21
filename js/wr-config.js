/* Public connection details for the WriteRiff forms (beta sign-up, contact, unsubscribe).
 * These are the dev Supabase project's PUBLIC address and PUBLISHABLE key, the same values already built into the
 * app and the account-callback page. They are safe to publish: what visitors can do is limited by the database's
 * row-level security (insert-only into beta_signups, contact_messages, and email_unsubscribes, no reading).
 * The tables are live on the dev project via the app repo's supabase/migrations/202611200501_website_forms_dev.sql
 * and later migrations. NEVER put a secret / service_role key here. */
window.WR_CONFIG = {
  supabaseUrl: 'https://rnehrjdaruejuueztngc.supabase.co',
  supabaseKey: 'sb_publishable_0HAwNWLF4Vy8m-84HymXsw_jIAR6V73',
  contactEmail: 'hello@writeriff.com'
};
