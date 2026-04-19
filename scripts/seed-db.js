/* ═══════════════════════════════════════════════════════════
   CONN — Seed Database from Local JSON Files
   
   Usage: node scripts/seed-db.js
   
   This migrates your local data/users.json and per-user data
   into Supabase. Run once after setting up the database.
   ═══════════════════════════════════════════════════════════ */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');

function readLocalJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function seed() {
  console.log('\n🌱 Starting database seed...\n');

  // 1. Seed users
  const users = readLocalJSON(path.join(DATA_DIR, 'users.json'));
  if (!users || users.length === 0) {
    console.log('  ⚠️  No users found in data/users.json');
    return;
  }

  for (const user of users) {
    console.log(`  👤 Seeding user: ${user.name} (${user.email})`);

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();

    if (existing) {
      console.log(`     → Already exists, skipping.`);
      continue;
    }

    // Insert user
    const { error: userError } = await supabase.from('users').insert({
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      username: user.username || user.name.toLowerCase().replace(/\s+/g, '-'),
      password: user.password,
      subscription_plan: user.subscription?.plan || 'free',
      subscription_billing: user.subscription?.billing || 'monthly',
      subscribed_at: user.subscription?.subscribedAt || user.createdAt,
      created_at: user.createdAt
    });

    if (userError) {
      console.error(`     ❌ Error inserting user:`, userError.message);
      continue;
    }

    // Seed profile
    const userDir = path.join(USERS_DIR, user.id);
    const profile = readLocalJSON(path.join(userDir, 'profile.json'));
    if (profile) {
      await supabase.from('user_profiles').insert({
        user_id: user.id,
        name: profile.name || user.name,
        bio: profile.bio || '',
        avatar: profile.avatar || '',
        socials: profile.socials || {}
      });
      console.log(`     → Profile seeded`);
    }

    // Seed links
    const links = readLocalJSON(path.join(userDir, 'links.json'));
    if (links && links.length > 0) {
      const linkRows = links.map((l, i) => ({
        id: l.id,
        user_id: user.id,
        title: l.title || 'Link',
        url: l.url || 'https://',
        icon: l.icon || 'link',
        clicks: l.clicks || 0,
        active: l.active !== false,
        display_order: l.order ?? i,
        style: l.style || 'default'
      }));

      await supabase.from('user_links').insert(linkRows);
      console.log(`     → ${linkRows.length} links seeded`);
    }

    // Seed settings
    const settings = readLocalJSON(path.join(userDir, 'settings.json'));
    if (settings) {
      await supabase.from('user_settings').insert({
        user_id: user.id,
        page_title: settings.pageTitle || 'Conn.',
        meta_description: settings.metaDescription || '',
        show_verified_badge: settings.showVerifiedBadge || false,
        show_footer: settings.showFooter !== false,
        custom_css: settings.customCSS || '',
        selected_theme: settings.selectedTheme || 'midnight'
      });
      console.log(`     → Settings seeded`);
    }

    console.log(`     ✅ Done`);
  }

  // 2. Seed contacts
  const contacts = readLocalJSON(path.join(DATA_DIR, 'contacts.json'));
  if (contacts && contacts.length > 0) {
    for (const c of contacts) {
      await supabase.from('contacts').insert({
        id: c.id,
        name: c.name,
        email: c.email,
        message: c.message,
        ip: c.ip || 'unknown',
        submitted_at: c.submittedAt,
        read: c.read || false
      });
    }
    console.log(`\n  📩 ${contacts.length} contact(s) seeded`);
  }

  // 3. Seed orders
  const orders = readLocalJSON(path.join(DATA_DIR, 'orders.json'));
  if (orders && orders.length > 0) {
    for (const o of orders) {
      await supabase.from('orders').insert({
        id: o.id,
        razorpay_order_id: o.razorpayOrderId,
        user_id: o.userId,
        plan_id: o.planId,
        billing: o.billing,
        amount: o.amount,
        status: o.status,
        razorpay_payment_id: o.razorpayPaymentId,
        created_at: o.createdAt,
        paid_at: o.paidAt
      });
    }
    console.log(`  💳 ${orders.length} order(s) seeded`);
  }

  console.log('\n✅ Seed complete!\n');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
