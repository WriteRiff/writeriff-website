/* Public connection details for the WriteRiff forms (beta sign-up, contact).
 * These are the dev Supabase project's PUBLIC address and PUBLISHABLE key, the same values already built into the
 * app and the account-callback page. They are safe to publish: what visitors can do is limited by the database's
 * row-level security (insert-only into two tables, no reading). NEVER put a secret / service_role key here.
 * Tables are created by supabase/001_website_forms.sql (not applied yet; until then the forms show a friendly
 * "opening soon" message). */
window.WR_CONFIG = {
  supabaseUrl: 'https://rnehrjdaruejuueztngc.supabase.co',
  supabaseKey: 'sb_publishable_0HAwNWLF4Vy8m-84HymXsw_jIAR6V73',
  contactEmail: 'hello@writeriff.com'
};
