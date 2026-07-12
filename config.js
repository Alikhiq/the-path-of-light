/*
  Public runtime config. These are PUBLISHABLE keys — safe to ship in the browser.
  Supabase Row Level Security allows anonymous INSERT into pol_suggestions only.
  To read suggestions, open the Supabase dashboard (table: pol_suggestions).
*/
window.POL_CONFIG = {
  supabaseUrl: "https://vlesitigmpdmufprnwlz.supabase.co",
  supabaseKey: "sb_publishable_jVzJqf6fVo8GH-xkmcHu6g_msZRYD7P",
  suggestionsTable: "pol_suggestions"
};
