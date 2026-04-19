/* ═══════════════════════════════════════════════════════════
   CONN — Supabase Client (Service Role)
   ═══════════════════════════════════════════════════════════ */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️  Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.');
  console.error('   Set them in your .env file (local) or Vercel dashboard (production).');
}

// Use service_role key — bypasses Row Level Security
// NEVER expose this key to the client/browser
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
