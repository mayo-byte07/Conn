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
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3000;
if (!process.env.JWT_SECRET) {
  console.error('');
  console.error('  ⚠️  FATAL: JWT_SECRET environment variable is required.');
  console.error('  Generate a secure secret with:');
  console.error('    node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.error('');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;


//LOGIN limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

//REGISTER limiter
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many accounts created. Please try again later.'
  }
});

//USERNAME CHECK limiter
const usernameCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down.'
  }
});

//GOOGLE AUTH limiter
const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many Google auth attempts. Please try again later.'
  }
});

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

// ─── Input Sanitization Helper ───
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')     // strip HTML tags
    .replace(/[<>]/g, '')        // strip any remaining < or > (broken tags)
    .replace(/\s{2,}/g, ' ')     // collapse multiple spaces
    .trim();
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

// ─── Link Scheduling Processor ───

async function processScheduledLinks() {
  try {
    const now = new Date().toISOString();

    // Get all scheduled links
    const { data: scheduledLinks, error } = await supabase
      .from('user_links')
      .select('*')
      .eq('is_scheduled', true);

    if (error) {
      console.error('Error fetching scheduled links:', error);
      return;
    }

    if (!scheduledLinks || scheduledLinks.length === 0) return;

    for (const link of scheduledLinks) {
      const startDate = link.scheduled_start ? new Date(link.scheduled_start) : null;
      const endDate = link.scheduled_end ? new Date(link.scheduled_end) : null;
      const nowDate = new Date(now);

      let shouldBeActive = link.active;

      // Determine if link should be active based on schedule
      if (startDate && endDate) {
        // Both start and end dates set
        shouldBeActive = nowDate >= startDate && nowDate <= endDate;
      } else if (startDate && !endDate) {
        // Only start date set
        shouldBeActive = nowDate >= startDate;
      } else if (!startDate && endDate) {
        // Only end date set
        shouldBeActive = nowDate <= endDate;
      }

      // Update link if status needs to change
      if (link.active !== shouldBeActive) {
        await supabase
          .from('user_links')
          .update({ active: shouldBeActive })
          .eq('id', link.id);

        console.log(`Link "${link.title}" (${link.id}) ${shouldBeActive ? 'activated' : 'deactivated'} by schedule`);
      }
    }
  } catch (err) {
    console.error('Error processing scheduled links:', err);
  }
}

// Run scheduler every minute
setInterval(processScheduledLinks, 60 * 1000);

// Run once on startup
processScheduledLinks();

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

app.post('/api/auth/register', registerLimiter, async (req, res) => {
  try {
    const { name, email, password, username } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number.' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one special character.' });
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

    return res.status(201).json({
      message: "Registration successful",
      name,
      username: finalUsername
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
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

    return res.json({ message: "Login successful", name: user.name, username: user.username });
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
app.get('/api/auth/check-username/:username', usernameCheckLimiter, async (req, res) => {
  const username = req.params.username.toLowerCase().trim();
  if (!isUsernameValid(username)) {
    return res.json({ available: false, reason: 'Invalid format. Use 3-30 lowercase letters, numbers, and hyphens.' });
  }
  if (await isUsernameTaken(username)) {
    return res.json({ available: false, reason: 'This username is already taken.' });
  }
  res.json({ available: true });
});

// ─── Google OAuth ───

app.get('/api/auth/google-client-id', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.json({ clientId: null });
  }
  res.json({ clientId });
});

app.post('/api/auth/google', googleAuthLimiter, async (req, res) => {
  try {
    const { credential, access_token } = req.body;
    let payload;

    if (credential) {
      // Verify Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } else if (access_token) {
      // Fetch user info using access token
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      payload = await response.json();
    } else {
      return res.status(400).json({ error: 'Google credential or access token is required.' });
    }

    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Invalid Google token.' });
    }

    if (!payload.email_verified) {
      return res.status(401).json({ error: 'Google email not verified.' });
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || email.split('@')[0];

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    let user;

    if (existingUser) {
      // Existing user — login
      user = existingUser;
    } else {
      // New user — register
      const newUserId = uuidv4();
      const username = await ensureUniqueUsername(name);

      // Generate an unguessable random password for Google-only users
      const randomPassword = crypto.randomBytes(64).toString('hex');
      const hashedRandomPassword = await bcrypt.hash(randomPassword, 10);

      const { error: insertError } = await supabase.from('users').insert({
        id: newUserId,
        name,
        email,
        username,
        password: hashedRandomPassword,
        subscription_plan: 'free',
        subscription_billing: 'monthly',
        subscribed_at: new Date().toISOString()
      });

      if (insertError) {
        console.error('Google auth insert error:', insertError);
        return res.status(500).json({ error: 'Failed to create account.' });
      }

      await initUserData(newUserId, name);

      user = { id: newUserId, name, email, username };
    }

    // Generate JWT and set cookie
    const token = generateToken({
      id: user.id,
      name: user.name,
      username: user.username
    });
    setAuthCookie(res, token);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username
    });
  } catch (err) {
    console.error('Google auth error:', err);
    if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token')) {
      return res.status(401).json({ error: 'Google token expired. Please try again.' });
    }
    res.status(500).json({ error: 'Google authentication failed.' });
  }
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

  const socials = req.body.socials ?? existing?.socials ?? {};

  // Validate socials if provided
  if (socials && typeof socials === 'object') {
    // Auto-prefix http/https for platform links if not empty
    const platforms = ['twitter', 'instagram', 'github', 'linkedin', 'youtube', 'tiktok'];
    platforms.forEach(p => {
      if (socials[p] && typeof socials[p] === 'string') {
        socials[p] = socials[p].trim();
        if (socials[p] && !/^https?:\/\//i.test(socials[p])) {
          socials[p] = 'https://' + socials[p];
        }
      }
    });

    // Auto-prefix http/https for email if it doesn't look like an email and isn't empty
    if (socials.email && typeof socials.email === 'string') {
      socials.email = socials.email.trim();
      if (socials.email && !socials.email.includes('@') && !/^https?:\/\//i.test(socials.email)) {
        socials.email = 'https://' + socials.email;
      }
    }

    // Validation patterns
    const patterns = {
      twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i,
      instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/i,
      github: /^https?:\/\/(www\.)?github\.com\/.+/i,
      linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.+/i,
      youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i,
      tiktok: /^https?:\/\/(www\.)?tiktok\.com\/.+/i
    };

    for (const [key, regex] of Object.entries(patterns)) {
      if (socials[key]) {
        if (!regex.test(socials[key])) {
          return res.status(400).json({ error: `Invalid URL for ${key}` });
        }
      }
    }

    if (socials.email) {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(socials.email);
      const isUrl = /^https?:\/\/.+/i.test(socials.email);
      if (!isEmail && !isUrl) {
        return res.status(400).json({ error: 'Email must be a valid email address or a valid URL' });
      }
    }
  }

  const updates = {
    name: req.body.name ?? existing?.name ?? 'Your Name',
    bio: req.body.bio ?? existing?.bio ?? '',
    avatar: req.body.avatar ?? existing?.avatar ?? '',
    socials
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

// ──────────────────── CATEGORIES ROUTES (Authenticated) ────────────────────

app.get('/api/categories', requireAuth, async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('link_categories')
      .select(`
        id, 
        name, 
        icon, 
        color, 
        category_order, 
        collapsed_by_default
      `)
      .eq('user_id', req.auth.userId)
      .order('category_order', { ascending: true });

    if (error) throw error;

    // Count links for each category
    const categoriesWithCount = await Promise.all((categories || []).map(async (cat) => {
      const { count } = await supabase
        .from('user_links')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.auth.userId)
        .eq('category_id', cat.id);

      return {
        ...cat,
        link_count: count || 0
      };
    }));

    res.json(categoriesWithCount);
  } catch (err) {
    console.error('GET /api/categories error:', err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

app.post('/api/categories', requireAuth, async (req, res) => {
  try {
    const name = (req.body?.name ?? '').toString().trim();
    const icon = (req.body?.icon ?? '📁').toString().trim();
    const color = (req.body?.color ?? '#a855f7').toString().trim();
    const collapsed_by_default = !!req.body?.collapsed_by_default;

    if (!name) return res.status(400).json({ error: 'Category name is required' });

    // Get next order
    const { count } = await supabase
      .from('link_categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.auth.userId);

    const nextOrder = count || 0;

    const { data, error } = await supabase
      .from('link_categories')
      .insert({
        user_id: req.auth.userId,
        name,
        icon,
        color,
        category_order: nextOrder,
        collapsed_by_default
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ...data, link_count: 0 });
  } catch (err) {
    console.error('POST /api/categories error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const updates = {};

    if (req.body?.name !== undefined) updates.name = req.body.name?.toString().trim() || '';
    if (req.body?.icon !== undefined) updates.icon = req.body.icon?.toString().trim();
    if (req.body?.color !== undefined) updates.color = req.body.color?.toString().trim();
    if (req.body?.collapsed_by_default !== undefined) updates.collapsed_by_default = !!req.body.collapsed_by_default;

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });
    if (updates.name !== undefined && !updates.name) return res.status(400).json({ error: 'Category name is required' });

    // Verify ownership
    const { data: existing } = await supabase
      .from('link_categories')
      .select('id')
      .eq('id', categoryId)
      .eq('user_id', req.auth.userId)
      .single();

    if (!existing) return res.status(404).json({ error: 'Category not found' });

    const { data, error } = await supabase
      .from('link_categories')
      .update(updates)
      .eq('id', categoryId)
      .eq('user_id', req.auth.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('PUT /api/categories/:id error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Verify ownership
    const { data: existing } = await supabase
      .from('link_categories')
      .select('id')
      .eq('id', categoryId)
      .eq('user_id', req.auth.userId)
      .single();

    if (!existing) return res.status(404).json({ error: 'Category not found' });

    // Atomically delete category + uncategorize links + reorder remaining categories
    await supabase.rpc('delete_category_and_reorder', {
      p_category_id: categoryId,
      p_user_id: req.auth.userId
    });

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/categories/:id error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

app.put('/api/categories/reorder', requireAuth, async (req, res) => {
  try {
    const { orderedCategoryIds } = req.body;
    if (!Array.isArray(orderedCategoryIds)) return res.status(400).json({ error: 'orderedCategoryIds required' });

    // Atomically reorder all categories
    const { error: rpcError } = await supabase.rpc('reorder_categories_by_ids', {
      p_ordered_ids: orderedCategoryIds,
      p_user_id: req.auth.userId
    });

    if (rpcError) throw rpcError;

    const { data: categories, error } = await supabase
      .from('link_categories')
      .select('*')
      .eq('user_id', req.auth.userId)
      .order('category_order', { ascending: true });

    if (error) throw error;
    res.json(categories || []);
  } catch (err) {
    console.error('PUT /api/categories/reorder error:', err);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

// ──────────────────── LINKS ROUTES (Authenticated) ────────────────────

app.get('/api/links', requireAuth, async (req, res) => {
  // Check if this is for admin panel (needs flat array) or public view (needs grouped)
  const grouped = req.query.grouped === 'true';

  // Fetch categories
  const { data: categories } = await supabase
    .from('link_categories')
    .select('id, name, icon, color, category_order, collapsed_by_default')
    .eq('user_id', req.auth.userId)
    .order('category_order', { ascending: true });

  // Fetch links
  const { data: links } = await supabase
    .from('user_links')
    .select('*')
    .eq('user_id', req.auth.userId)
    .order('display_order', { ascending: true });

  const now = new Date();

  // Map links with schedule status
  const mappedLinks = (links || []).map(l => {
    let scheduleStatus = 'none';

    if (l.is_scheduled) {
      const startDate = l.scheduled_start ? new Date(l.scheduled_start) : null;
      const endDate = l.scheduled_end ? new Date(l.scheduled_end) : null;

      if (startDate && now < startDate) {
        scheduleStatus = 'pending';
      } else if (endDate && now > endDate) {
        scheduleStatus = 'expired';
      } else {
        scheduleStatus = 'active';
      }
    }

    return {
      id: l.id,
      title: l.title,
      url: l.url,
      icon: l.icon,
      clicks: l.clicks,
      active: l.active,
      order: l.display_order,
      style: l.style,
      category_id: l.category_id || null,
      is_scheduled: l.is_scheduled || false,
      scheduled_start: l.scheduled_start,
      scheduled_end: l.scheduled_end,
      schedule_status: scheduleStatus
    };
  });

  // If not grouped, return flat array for admin panel
  if (!grouped) {
    return res.json(mappedLinks);
  }

  // Group links by category for public view
  const groupedData = [];

  // Add categories with their links
  for (const cat of categories || []) {
    const categoryLinks = mappedLinks
      .filter(l => l.category_id === cat.id)
      .map(l => ({
        id: l.id,
        title: l.title,
        url: l.url,
        icon: l.icon,
        style: l.style,
        order: l.order
      }));

    if (categoryLinks.length > 0) {
      groupedData.push({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        order: cat.category_order,
        collapsed_by_default: cat.collapsed_by_default,
        links: categoryLinks
      });
    }
  }

  // Add uncategorized links
  const uncategorizedLinks = mappedLinks
    .filter(l => !l.category_id)
    .map(l => ({
      id: l.id,
      title: l.title,
      url: l.url,
      icon: l.icon,
      style: l.style,
      order: l.order
    }));

  if (uncategorizedLinks.length > 0) {
    groupedData.push({
      id: null,
      name: 'Links',
      icon: '🔗',
      color: '#a855f7',
      order: 9999,
      collapsed_by_default: false,
      links: uncategorizedLinks
    });
  }

  res.json({ grouped: groupedData });
});


app.post('/api/links', requireAuth, async (req, res) => {
  const { count } = await supabase
    .from('user_links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.auth.userId);

  // Validate scheduling dates
  const scheduledStart = req.body.scheduled_start ? new Date(req.body.scheduled_start) : null;
  const scheduledEnd = req.body.scheduled_end ? new Date(req.body.scheduled_end) : null;
  const isScheduled = req.body.is_scheduled || false;

  if (isScheduled && scheduledStart && scheduledEnd && scheduledEnd <= scheduledStart) {
    return res.status(400).json({ error: 'End date must be after start date.' });
  }

  // Handle category assignment
  let categoryId = req.body.category_id ?? null;
  if (categoryId === 'uncategorized' || categoryId === '') categoryId = null;

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
    style: req.body.style || 'default',
    category_id: categoryId,
    is_scheduled: isScheduled,
    scheduled_start: scheduledStart ? scheduledStart.toISOString() : null,
    scheduled_end: scheduledEnd ? scheduledEnd.toISOString() : null
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
    style: req.body.style || 'default',
    category_id: categoryId,
    is_scheduled: isScheduled,
    scheduled_start: scheduledStart ? scheduledStart.toISOString() : null,
    scheduled_end: scheduledEnd ? scheduledEnd.toISOString() : null
  });
});

// ──────────────────── BULK OPERATIONS ROUTES (Must be before :id routes) ────────────────────

// Bulk update links (enable/disable multiple links)
app.put('/api/links/bulk-update', requireAuth, async (req, res) => {
  const { linkIds, active } = req.body;

  if (!linkIds || !Array.isArray(linkIds) || linkIds.length === 0) {
    return res.status(400).json({ error: 'linkIds array required' });
  }

  if (active === undefined) {
    return res.status(400).json({ error: 'active field required' });
  }

  try {
    // Update all specified links
    const { error } = await supabase
      .from('user_links')
      .update({ active })
      .in('id', linkIds)
      .eq('user_id', req.auth.userId);

    if (error) throw error;

    res.json({
      success: true,
      updated: linkIds.length,
      active
    });
  } catch (err) {
    console.error('Bulk update error:', err);
    res.status(500).json({ error: 'Failed to update links' });
  }
});

// Bulk delete links
app.delete('/api/links/bulk-delete', requireAuth, async (req, res) => {
  const { linkIds } = req.body;

  if (!linkIds || !Array.isArray(linkIds) || linkIds.length === 0) {
    return res.status(400).json({ error: 'linkIds array required' });
  }

  try {
    // Fetch links before deletion (for undo functionality)
    const { data: linksToDelete } = await supabase
      .from('user_links')
      .select('*')
      .in('id', linkIds)
      .eq('user_id', req.auth.userId);

    // Atomically delete links + reorder remaining
    const { error: rpcError } = await supabase.rpc('delete_links_bulk_and_reorder', {
      p_link_ids: linkIds,
      p_user_id: req.auth.userId
    });

    if (rpcError) throw rpcError;

    res.json({
      success: true,
      deleted: linkIds.length,
      undoData: linksToDelete
    });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ error: 'Failed to delete links' });
  }
});

// ──────────────────── END BULK OPERATIONS ────────────────────

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

  // Handle category assignment
  if (req.body.category_id !== undefined) {
    let categoryId = req.body.category_id;
    if (categoryId === 'uncategorized' || categoryId === '') categoryId = null;
    updates.category_id = categoryId;
  }

  // Handle scheduling updates
  if (req.body.is_scheduled !== undefined) updates.is_scheduled = req.body.is_scheduled;
  if (req.body.scheduled_start !== undefined) {
    updates.scheduled_start = req.body.scheduled_start ? new Date(req.body.scheduled_start).toISOString() : null;
  }
  if (req.body.scheduled_end !== undefined) {
    updates.scheduled_end = req.body.scheduled_end ? new Date(req.body.scheduled_end).toISOString() : null;
  }

  // Validate scheduling dates
  const startDate = updates.scheduled_start || existing.scheduled_start;
  const endDate = updates.scheduled_end || existing.scheduled_end;
  if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({ error: 'End date must be after start date.' });
  }

  await supabase.from('user_links')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.auth.userId);

  res.json({ ...existing, ...updates, order: updates.display_order ?? existing.display_order });
});

app.delete('/api/links/:id', requireAuth, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('user_links')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.auth.userId)
      .maybeSingle();

    if (!existing) return res.status(404).json({ error: 'Link not found' });

    // Atomically delete link + reorder remaining
    const { error: rpcError } = await supabase.rpc('delete_link_and_reorder', {
      p_link_id: req.params.id,
      p_user_id: req.auth.userId
    });

    if (rpcError) throw rpcError;

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/links/:id error:', err);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

// Reorder links
app.put('/api/links-reorder', requireAuth, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!orderedIds) return res.status(400).json({ error: 'orderedIds required' });

    // Atomically reorder all links
    const { error: rpcError } = await supabase.rpc('reorder_links_by_ids', {
      p_ordered_ids: orderedIds,
      p_user_id: req.auth.userId
    });

    if (rpcError) throw rpcError;

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
  } catch (err) {
    console.error('PUT /api/links-reorder error:', err);
    res.status(500).json({ error: 'Failed to reorder links' });
  }
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

  // Fetch categories
  const { data: categories } = await supabase
    .from('link_categories')
    .select('id, name, icon, color, category_order, collapsed_by_default')
    .eq('user_id', user.id)
    .order('category_order', { ascending: true });

  // Fetch links with category_id
  const { data: links } = await supabase
    .from('user_links')
    .select('id, title, url, icon, style, display_order, category_id, is_scheduled, scheduled_start, scheduled_end')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('display_order', { ascending: true });

  // Filter out scheduled links that are not currently active
  const now = new Date();
  const activeLinks = (links || []).filter(l => {
    if (!l.is_scheduled) return true;

    const startDate = l.scheduled_start ? new Date(l.scheduled_start) : null;
    const endDate = l.scheduled_end ? new Date(l.scheduled_end) : null;

    // Check if link is within its scheduled time window
    if (startDate && now < startDate) return false; // Not started yet
    if (endDate && now > endDate) return false; // Already expired

    return true;
  });

  // Group links by category
  const grouped = [];

  // Add categories with their links
  for (const cat of categories || []) {
    const categoryLinks = activeLinks
      .filter(l => l.category_id === cat.id)
      .map(l => ({
        id: l.id,
        title: l.title,
        url: l.url,
        icon: l.icon,
        style: l.style,
        order: l.display_order
      }));

    if (categoryLinks.length > 0) {
      grouped.push({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        order: cat.category_order,
        collapsed_by_default: cat.collapsed_by_default,
        links: categoryLinks
      });
    }
  }

  // Add uncategorized links
  const uncategorizedLinks = activeLinks
    .filter(l => !l.category_id)
    .map(l => ({
      id: l.id,
      title: l.title,
      url: l.url,
      icon: l.icon,
      style: l.style,
      order: l.display_order
    }));

  if (uncategorizedLinks.length > 0) {
    grouped.push({
      id: null,
      name: 'Links',
      icon: '🔗',
      color: '#a855f7',
      order: 9999,
      collapsed_by_default: false,
      links: uncategorizedLinks
    });
  }

  res.json({ grouped });
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

  // Sanitize inputs (strip HTML, collapse whitespace)
  const sanitizedName = sanitizeText(name);
  const sanitizedEmail = sanitizeText(email);
  const sanitizedMessage = sanitizeText(message);

  if (!sanitizedName || !sanitizedEmail || !sanitizedMessage) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (sanitizedName.length > 100 || sanitizedEmail.length > 200 || sanitizedMessage.length > 5000) {
    return res.status(400).json({ error: 'Input too long.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';
  if (isContactRateLimited(clientIP)) {
    return res.status(429).json({ error: 'Too many messages. Please try again later.' });
  }

  const { error } = await supabase.from('contacts').insert({
    id: uuidv4(),
    name: sanitizedName,
    email: sanitizedEmail.toLowerCase(),
    message: sanitizedMessage,
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
