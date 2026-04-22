require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const supabase = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'conn-secret-key-change-in-production';


// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ─── JWT Auth Helpers ───

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, userName: user.name, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  res.cookie('conn_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
}

function getAuthUser(req) {
  const token = req.cookies?.conn_token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ─── Auth Middleware ───

function requireAuth(req, res, next) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.auth = user;
  next();
}


// ─── Username Helpers ───

function generateUsername(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30) || 'user';
}

function isUsernameValid(username) {
  return /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(username) || /^[a-z0-9]{3,30}$/.test(username);
}

async function isUsernameTaken(username) {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  return !!data;
}

async function ensureUniqueUsername(baseName) {
  let username = generateUsername(baseName);
  if (!(await isUsernameTaken(username))) return username;
  for (let i = 1; i < 1000; i++) {
    const candidate = `${username}-${i}`;
    if (!(await isUsernameTaken(candidate))) return candidate;
  }
  return `${username}-${Date.now()}`;
}

// ─── Contact Form Rate Limiter ───
const contactRateLimits = new Map();

function isContactRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 5;

  if (!contactRateLimits.has(ip)) {
    contactRateLimits.set(ip, []);
  }
  const timestamps = contactRateLimits.get(ip).filter(t => now - t < windowMs);
  contactRateLimits.set(ip, timestamps);

  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  return false;
}

// ─── Init default data for new user ───

async function initUserData(userId, userName) {
  // Create profile if not exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existingProfile) {
    await supabase.from('user_profiles').insert({
      user_id: userId,
      name: userName || 'Your Name',
      bio: '',
      avatar: '',
      socials: {
        twitter: '', instagram: '', github: '',
        linkedin: '', youtube: '', tiktok: '', email: ''
      }
    });
  }

  // Create settings if not exists
  const { data: existingSettings } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existingSettings) {
    await supabase.from('user_settings').insert({
      user_id: userId,
      page_title: 'Conn.',
      meta_description: 'All my links in one place. Connect with me across the web.',
      show_verified_badge: false,
      show_footer: true,
      custom_css: '',
      selected_theme: 'midnight'
    });
  }
}

// ──────────────────── PAGE ROUTES ────────────────────

// Page routes must be defined BEFORE express.static
// (otherwise express.static auto-serves index.html for /)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/me', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Public profile page by username
app.get('/u/:username', async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('username', req.params.username.toLowerCase())
    .maybeSingle();

  if (!user) {
    return res.status(404).sendFile(path.join(__dirname, 'public', 'home.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/login', (req, res) => {
  const user = getAuthUser(req);
  if (user) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  const user = getAuthUser(req);
  if (user) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Feature pages
app.get('/features/link-in-bio', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'features', 'link-in-bio.html'));
});
app.get('/features/social-media', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'features', 'social-media.html'));
});
app.get('/features/grow', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'features', 'grow.html'));
});
app.get('/features/monetize', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'features', 'monetize.html'));
});
app.get('/features/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'features', 'analytics.html'));
});

app.get('/team', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'team.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

// ──────────────────── AUTH ROUTES ────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, username } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Username handling
    let finalUsername;
    if (username) {
      finalUsername = username.toLowerCase().trim();
      if (!isUsernameValid(finalUsername)) {
        return res.status(400).json({ error: 'Username must be 3-30 characters, lowercase letters, numbers, and hyphens only.' });
      }
      if (await isUsernameTaken(finalUsername)) {
        return res.status(409).json({ error: 'This username is already taken.' });
      }
    } else {
      finalUsername = await ensureUniqueUsername(name);
    }

    // Check if email exists
    const { data: exists } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (exists) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = uuidv4();

    const { error: insertError } = await supabase.from('users').insert({
      id: newUserId,
      name,
      email: email.toLowerCase(),
      username: finalUsername,
      password: hashedPassword,
      subscription_plan: 'free',
      subscription_billing: 'monthly',
      subscribed_at: new Date().toISOString()
    });

    if (insertError) {
      console.error('Register insert error:', insertError);
      return res.status(500).json({ error: 'Server error. Please try again.' });
    }

    // Initialize user data (profile, settings)
    await initUserData(newUserId, name);

    // Generate JWT and set cookie
    const token = generateToken({ id: newUserId, name, username: finalUsername });
    setAuthCookie(res, token);

    res.status(201).json({ id: newUserId, name, email: email.toLowerCase(), username: finalUsername });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({ id: user.id, name: user.name, username: user.username });
    setAuthCookie(res, token);

    res.json({ id: user.id, name: user.name, email: user.email, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('conn_token', { path: '/' });
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  const user = getAuthUser(req);
  if (user) {
    res.json({
      authenticated: true,
      name: user.userName,
      username: user.username
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Check username availability
app.get('/api/auth/check-username/:username', async (req, res) => {
  const username = req.params.username.toLowerCase().trim();
  if (!isUsernameValid(username)) {
    return res.json({ available: false, reason: 'Invalid format. Use 3-30 lowercase letters, numbers, and hyphens.' });
  }
  if (await isUsernameTaken(username)) {
    return res.json({ available: false, reason: 'This username is already taken.' });
  }
  res.json({ available: true });
});

// ──────────────────── PROFILE ROUTES (Authenticated) ────────────────────

app.get('/api/profile', requireAuth, async (req, res) => {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', req.auth.userId)
    .maybeSingle();

  if (!profile) {
    return res.json({
      name: 'Your Name', bio: '', avatar: '',
      socials: { twitter: '', instagram: '', github: '', linkedin: '', youtube: '', tiktok: '', email: '' }
    });
  }

  res.json({
    name: profile.name,
    bio: profile.bio,
    avatar: profile.avatar,
    socials: profile.socials || {}
  });
});

app.put('/api/profile', requireAuth, async (req, res) => {
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', req.auth.userId)
    .maybeSingle();

  const updates = {
    name: req.body.name ?? existing?.name ?? 'Your Name',
    bio: req.body.bio ?? existing?.bio ?? '',
    avatar: req.body.avatar ?? existing?.avatar ?? '',
    socials: req.body.socials ?? existing?.socials ?? {}
  };

  if (existing) {
    await supabase.from('user_profiles')
      .update(updates)
      .eq('user_id', req.auth.userId);
  } else {
    await supabase.from('user_profiles')
      .insert({ user_id: req.auth.userId, ...updates });
  }

  res.json(updates);
});

// ──────────────────── LINKS ROUTES (Authenticated) ────────────────────

app.get('/api/links', requireAuth, async (req, res) => {
  const { data: links } = await supabase
    .from('user_links')
    .select('*')
    .eq('user_id', req.auth.userId)
    .order('display_order', { ascending: true });

  // Map to client-expected format
  const mapped = (links || []).map(l => ({
    id: l.id,
    title: l.title,
    url: l.url,
    icon: l.icon,
    clicks: l.clicks,
    active: l.active,
    order: l.display_order,
    style: l.style
  }));

  res.json(mapped);
});

app.post('/api/links', requireAuth, async (req, res) => {
  const { count } = await supabase
    .from('user_links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.auth.userId);

  const newLinkId = uuidv4();
  const { error } = await supabase.from('user_links').insert({
    id: newLinkId,
    user_id: req.auth.userId,
    title: req.body.title || 'New Link',
    url: req.body.url || 'https://',
    icon: req.body.icon || 'link',
    clicks: 0,
    active: true,
    display_order: count || 0,
    style: req.body.style || 'default'
  });

  if (error) {
    console.error('Link insert error:', error);
    return res.status(500).json({ error: 'Failed to create link.' });
  }

  res.status(201).json({
    id: newLinkId,
    title: req.body.title || 'New Link',
    url: req.body.url || 'https://',
    icon: req.body.icon || 'link',
    clicks: 0,
    active: true,
    order: count || 0,
    style: req.body.style || 'default'
  });
});

app.put('/api/links/:id', requireAuth, async (req, res) => {
  const { data: existing } = await supabase
    .from('user_links')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.auth.userId)
    .maybeSingle();

  if (!existing) return res.status(404).json({ error: 'Link not found' });

  const updates = {};
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.url !== undefined) updates.url = req.body.url;
  if (req.body.icon !== undefined) updates.icon = req.body.icon;
  if (req.body.active !== undefined) updates.active = req.body.active;
  if (req.body.order !== undefined) updates.display_order = req.body.order;
  if (req.body.style !== undefined) updates.style = req.body.style;

  await supabase.from('user_links')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.auth.userId);

  res.json({ ...existing, ...updates, order: updates.display_order ?? existing.display_order });
});

app.delete('/api/links/:id', requireAuth, async (req, res) => {
  const { data: existing } = await supabase
    .from('user_links')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', req.auth.userId)
    .maybeSingle();

  if (!existing) return res.status(404).json({ error: 'Link not found' });

  await supabase.from('user_links')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.auth.userId);

  // Reorder remaining links
  const { data: remainingLinks } = await supabase
    .from('user_links')
    .select('id')
    .eq('user_id', req.auth.userId)
    .order('display_order', { ascending: true });

  if (remainingLinks) {
    for (let i = 0; i < remainingLinks.length; i++) {
      await supabase.from('user_links')
        .update({ display_order: i })
        .eq('id', remainingLinks[i].id);
    }
  }

  res.json({ success: true });
});

// Reorder links
app.put('/api/links-reorder', requireAuth, async (req, res) => {
  const { orderedIds } = req.body;
  if (!orderedIds) return res.status(400).json({ error: 'orderedIds required' });

  // Update each link's order
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('user_links')
      .update({ display_order: i })
      .eq('id', orderedIds[i])
      .eq('user_id', req.auth.userId);
  }

  const { data: links } = await supabase
    .from('user_links')
    .select('*')
    .eq('user_id', req.auth.userId)
    .order('display_order', { ascending: true });

  const mapped = (links || []).map(l => ({
    id: l.id, title: l.title, url: l.url, icon: l.icon,
    clicks: l.clicks, active: l.active, order: l.display_order, style: l.style
  }));

  res.json(mapped);
});

// Track clicks (public — find link by ID across all users)
app.post('/api/links/:id/click', async (req, res) => {
  const { data: link } = await supabase
    .from('user_links')
    .select('id, clicks')
    .eq('id', req.params.id)
    .maybeSingle();

  if (!link) return res.status(404).json({ error: 'Link not found' });

  const newClicks = (link.clicks || 0) + 1;
  await supabase.from('user_links')
    .update({ clicks: newClicks })
    .eq('id', req.params.id);

  res.json({ clicks: newClicks });
});

// Analytics (authenticated)
app.get('/api/analytics', requireAuth, async (req, res) => {
  const { data: links } = await supabase
    .from('user_links')
    .select('*')
    .eq('user_id', req.auth.userId);

  const allLinks = links || [];
  const totalClicks = allLinks.reduce((sum, l) => sum + (l.clicks || 0), 0);
  const topLinks = [...allLinks]
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 5)
    .map(l => ({ id: l.id, title: l.title, url: l.url, clicks: l.clicks }));

  res.json({ totalClicks, totalLinks: allLinks.length, topLinks });
});

// ──────────────────── SETTINGS ROUTES (Authenticated) ────────────────────

app.get('/api/settings', requireAuth, async (req, res) => {
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', req.auth.userId)
    .maybeSingle();

  if (!settings) {
    return res.json({
      pageTitle: 'Conn.',
      metaDescription: 'All my links in one place. Connect with me across the web.',
      showVerifiedBadge: false,
      showFooter: true,
      customCSS: '',
      selectedTheme: 'midnight'
    });
  }

  // Map DB column names to camelCase for client compatibility
  res.json({
    pageTitle: settings.page_title,
    metaDescription: settings.meta_description,
    showVerifiedBadge: settings.show_verified_badge,
    showFooter: settings.show_footer,
    customCSS: settings.custom_css,
    selectedTheme: settings.selected_theme
  });
});

app.put('/api/settings', requireAuth, async (req, res) => {
  const { data: current } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', req.auth.userId)
    .maybeSingle();

  // Build updates from request (camelCase from client → snake_case for DB)
  const updates = {
    page_title: req.body.pageTitle ?? current?.page_title ?? 'Conn.',
    meta_description: req.body.metaDescription ?? current?.meta_description ?? '',
    show_verified_badge: req.body.showVerifiedBadge ?? current?.show_verified_badge ?? false,
    show_footer: req.body.showFooter ?? current?.show_footer ?? true,
    custom_css: req.body.customCSS ?? current?.custom_css ?? '',
    selected_theme: req.body.selectedTheme ?? current?.selected_theme ?? 'midnight'
  };

  if (current) {
    await supabase.from('user_settings')
      .update(updates)
      .eq('user_id', req.auth.userId);
  } else {
    await supabase.from('user_settings')
      .insert({ user_id: req.auth.userId, ...updates });
  }

  // Return camelCase for client
  res.json({
    pageTitle: updates.page_title,
    metaDescription: updates.meta_description,
    showVerifiedBadge: updates.show_verified_badge,
    showFooter: updates.show_footer,
    customCSS: updates.custom_css,
    selectedTheme: updates.selected_theme
  });
});



// ──────────────────── PUBLIC PROFILE ROUTES ────────────────────

// Public profile
app.get('/api/u/:username/profile', async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('username', req.params.username.toLowerCase())
    .maybeSingle();

  if (!user) return res.status(404).json({ error: 'User not found' });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  res.json({
    name: profile?.name || 'User',
    bio: profile?.bio || '',
    avatar: profile?.avatar || '',
    socials: profile?.socials || {}
  });
});

// Public links
app.get('/api/u/:username/links', async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('username', req.params.username.toLowerCase())
    .maybeSingle();

  if (!user) return res.status(404).json({ error: 'User not found' });

  const { data: links } = await supabase
    .from('user_links')
    .select('id, title, url, icon, style, display_order')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('display_order', { ascending: true });

  const publicLinks = (links || []).map(l => ({
    id: l.id, title: l.title, url: l.url, icon: l.icon, style: l.style, order: l.display_order
  }));

  res.json(publicLinks);
});

// Public settings (theme etc)
app.get('/api/u/:username/settings', async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('username', req.params.username.toLowerCase())
    .maybeSingle();

  if (!user) return res.status(404).json({ error: 'User not found' });

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  res.json({
    pageTitle: settings?.page_title || 'Conn.',
    selectedTheme: settings?.selected_theme || 'midnight',
    showVerifiedBadge: settings?.show_verified_badge || false,
    showFooter: settings?.show_footer !== false,
    customCSS: settings?.custom_css || ''
  });
});

// Track clicks on public profile
app.post('/api/u/:username/links/:id/click', async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('username', req.params.username.toLowerCase())
    .maybeSingle();

  if (!user) return res.status(404).json({ error: 'User not found' });

  const { data: link } = await supabase
    .from('user_links')
    .select('id, clicks')
    .eq('id', req.params.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!link) return res.status(404).json({ error: 'Link not found' });

  const newClicks = (link.clicks || 0) + 1;
  await supabase.from('user_links')
    .update({ clicks: newClicks })
    .eq('id', req.params.id);

  res.json({ clicks: newClicks });
});

// ──────────────────── CONTACT FORM ROUTE ────────────────────

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (name.length > 100 || email.length > 200 || message.length > 5000) {
    return res.status(400).json({ error: 'Input too long.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';
  if (isContactRateLimited(clientIP)) {
    return res.status(429).json({ error: 'Too many messages. Please try again later.' });
  }

  const { error } = await supabase.from('contacts').insert({
    id: uuidv4(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
    ip: clientIP
  });

  if (error) {
    console.error('Contact insert error:', error);
    return res.status(500).json({ error: 'Failed to send message.' });
  }

  res.status(201).json({ success: true, message: 'Message sent successfully!' });
});

// ──────────────────── START SERVER ────────────────────

// Only start listener when not running on Vercel (Vercel uses serverless, not a listener)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n  ✨ Conn is running!`);
    console.log(`  🏠 Landing page:  http://localhost:${PORT}`);
    console.log(`  🌐 Profile page:  http://localhost:${PORT}/me`);
    console.log(`  👤 Public pages:  http://localhost:${PORT}/u/<username>`);
    console.log(`  ⚙️  Admin panel:  http://localhost:${PORT}/admin`);
    console.log(`  🔐 Login:         http://localhost:${PORT}/login`);
    console.log(`  📡 API:           http://localhost:${PORT}/api\n`);
  });
}

// Export for Vercel serverless
module.exports = app;
