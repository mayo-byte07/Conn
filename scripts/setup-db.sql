-- ═══════════════════════════════════════════════════════════
-- CONN — Supabase Database Setup
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  subscription_plan TEXT DEFAULT 'free',
  subscription_billing TEXT DEFAULT 'monthly',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Your Name',
  bio TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  socials JSONB DEFAULT '{"twitter":"","instagram":"","github":"","linkedin":"","youtube":"","tiktok":"","email":""}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Link Categories (user-scoped)
CREATE TABLE IF NOT EXISTS link_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#a855f7',
  category_order INTEGER DEFAULT 0,
  collapsed_by_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate category names per user (case-insensitive)
  CONSTRAINT uq_link_categories_user_name UNIQUE (user_id, name)
);

-- 4. User links
CREATE TABLE IF NOT EXISTS user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Link',
  url TEXT DEFAULT 'https://',
  icon TEXT DEFAULT 'link',
  clicks INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  style TEXT DEFAULT 'default',
  -- Nullable category assignment (NULL = Uncategorized)
  category_id UUID NULL REFERENCES link_categories(id) ON DELETE SET NULL,
  scheduled_start TIMESTAMPTZ NULL,
  scheduled_end TIMESTAMPTZ NULL,
  is_scheduled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 4. User settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_title TEXT DEFAULT 'Conn.',
  meta_description TEXT DEFAULT 'All my links in one place. Connect with me across the web.',
  show_verified_badge BOOLEAN DEFAULT false,
  show_footer BOOLEAN DEFAULT true,
  custom_css TEXT DEFAULT '',
  selected_theme TEXT DEFAULT 'midnight',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Contact form submissions
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  ip TEXT DEFAULT 'unknown',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT false
);

-- 6. Payment orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  plan_id TEXT,
  billing TEXT DEFAULT 'monthly',
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'created',
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_link_categories_user_id ON link_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_link_categories_user_order ON link_categories(user_id, category_order);
CREATE INDEX IF NOT EXISTS idx_user_links_category_id ON user_links(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_links_user_id ON user_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);

-- Indexes for link scheduling
CREATE INDEX IF NOT EXISTS idx_scheduled_links 
ON user_links(is_scheduled, scheduled_start, scheduled_end) 
WHERE is_scheduled = TRUE;

CREATE INDEX IF NOT EXISTS idx_active_scheduled_links 
ON user_links(user_id, is_scheduled, active) 
WHERE is_scheduled = TRUE;

-- 8. Enable Row Level Security (optional, supabase best practice)
-- We use service_role key on backend, so RLS doesn't block us,
-- but we enable it to prevent direct anon access from client side.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;


-- Allow service_role full access (backend server uses this key)
-- No RLS policies needed since service_role bypasses RLS by default.

SELECT 'All tables created successfully!' AS status;


CREATE TABLE IF NOT EXISTS comments (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    visitor_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);