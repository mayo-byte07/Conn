require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Init Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
});

// Middleware
app.use(cors());
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'conn-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  }
}));

// Page routes must be defined BEFORE express.static
// (otherwise express.static auto-serves index.html for /)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/me', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

// Data helpers
const DATA_DIR = path.join(__dirname, 'data');

function readJSON(file) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) return file === 'links.json' || file === 'users.json' ? [] : {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(file, data) {
  const filePath = path.join(DATA_DIR, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ─── Subscription Plan Limits ───
const FREE_THEMES = ['midnight', 'monochrome', 'arctic-frost'];

function getPlanLimits(planId) {
  const limits = {
    free: {
      maxLinks: 5,
      allThemes: false,
      allowedThemes: FREE_THEMES,
      canHideBranding: false,
      canShowVerifiedBadge: false,
      canUseCustomCSS: false,
      canEditSEO: false,
      fullAnalytics: false
    },
    plus: {
      maxLinks: Infinity,
      allThemes: true,
      allowedThemes: null,
      canHideBranding: true,
      canShowVerifiedBadge: true,
      canUseCustomCSS: true,
      canEditSEO: false,
      fullAnalytics: true
    },
    professional: {
      maxLinks: Infinity,
      allThemes: true,
      allowedThemes: null,
      canHideBranding: true,
      canShowVerifiedBadge: true,
      canUseCustomCSS: true,
      canEditSEO: true,
      fullAnalytics: true
    }
  };
  return limits[planId] || limits.free;
}

function getUserPlan(req) {
  if (!req.session.userId) return 'free';
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.session.userId);
  return user?.subscription?.plan || 'free';
}

// ──────────────────── AUTH ROUTES ────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const users = readJSON('users.json');
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      subscription: {
        plan: 'free',
        billing: 'monthly',
        subscribedAt: new Date().toISOString()
      }
    };

    users.push(newUser);
    writeJSON('users.json', users);

    req.session.userId = newUser.id;
    req.session.userName = newUser.name;

    res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const users = readJSON('users.json');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    req.session.userId = user.id;
    req.session.userName = user.name;

    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/auth/check', (req, res) => {
  if (req.session.userId) {
    res.json({ authenticated: true, name: req.session.userName });
  } else {
    res.json({ authenticated: false });
  }
});

// ──────────────────── PROFILE ROUTES ────────────────────

app.get('/api/profile', (req, res) => {
  const profile = readJSON('profile.json');
  res.json(profile);
});

app.put('/api/profile', (req, res) => {
  const current = readJSON('profile.json');
  const updated = { ...current, ...req.body };
  writeJSON('profile.json', updated);
  res.json(updated);
});

// ──────────────────── LINKS ROUTES ────────────────────

app.get('/api/links', (req, res) => {
  const links = readJSON('links.json');
  links.sort((a, b) => a.order - b.order);
  res.json(links);
});

app.post('/api/links', (req, res) => {
  const planId = getUserPlan(req);
  const limits = getPlanLimits(planId);
  const links = readJSON('links.json');

  // Enforce link limit
  if (limits.maxLinks !== Infinity && links.length >= limits.maxLinks) {
    return res.status(403).json({
      error: `Free plan allows up to ${limits.maxLinks} links. Upgrade to Plus for unlimited links.`,
      upgradeRequired: true,
      currentPlan: planId
    });
  }

  const newLink = {
    id: uuidv4(),
    title: req.body.title || 'New Link',
    url: req.body.url || 'https://',
    icon: req.body.icon || 'link',
    clicks: 0,
    active: true,
    order: links.length,
    style: req.body.style || 'default'
  };
  links.push(newLink);
  writeJSON('links.json', links);
  res.status(201).json(newLink);
});

app.put('/api/links/:id', (req, res) => {
  const links = readJSON('links.json');
  const idx = links.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Link not found' });

  links[idx] = { ...links[idx], ...req.body };
  writeJSON('links.json', links);
  res.json(links[idx]);
});

app.delete('/api/links/:id', (req, res) => {
  let links = readJSON('links.json');
  const idx = links.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Link not found' });

  links.splice(idx, 1);
  // Reorder
  links.forEach((link, i) => link.order = i);
  writeJSON('links.json', links);
  res.json({ success: true });
});

// Reorder links
app.put('/api/links-reorder', (req, res) => {
  const { orderedIds } = req.body;
  if (!orderedIds) return res.status(400).json({ error: 'orderedIds required' });

  const links = readJSON('links.json');
  const reordered = orderedIds.map((id, index) => {
    const link = links.find(l => l.id === id);
    if (link) link.order = index;
    return link;
  }).filter(Boolean);

  // Add any links not in the orderedIds list
  links.forEach(link => {
    if (!orderedIds.includes(link.id)) reordered.push(link);
  });

  writeJSON('links.json', reordered);
  res.json(reordered);
});

// Track clicks
app.post('/api/links/:id/click', (req, res) => {
  const links = readJSON('links.json');
  const link = links.find(l => l.id === req.params.id);
  if (!link) return res.status(404).json({ error: 'Link not found' });

  link.clicks = (link.clicks || 0) + 1;
  writeJSON('links.json', links);
  res.json({ clicks: link.clicks });
});

// Analytics
app.get('/api/analytics', (req, res) => {
  const links = readJSON('links.json');
  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
  const topLinks = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5);
  res.json({ totalClicks, totalLinks: links.length, topLinks });
});

// ──────────────────── SUBSCRIPTION ROUTES ────────────────────

// Get all available plans
app.get('/api/plans', (req, res) => {
  const data = readJSON('subscriptions.json');
  res.json(data.plans || []);
});

// Get current user's subscription
app.get('/api/subscription', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json(user.subscription || { plan: 'free', billing: 'monthly', subscribedAt: null });
});

// Subscribe / change plan (only for free plan directly)
app.post('/api/subscribe', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { planId, billing } = req.body;
  if (!planId) return res.status(400).json({ error: 'planId is required' });

  // Without payment, users can only downgrade to free
  if (planId !== 'free') {
    return res.status(400).json({ error: 'Please use the payment flow to upgrade.' });
  }

  const users = readJSON('users.json');
  const idx = users.findIndex(u => u.id === req.session.userId);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  users[idx].subscription = {
    plan: planId,
    billing: billing || 'monthly',
    subscribedAt: new Date().toISOString()
  };

  writeJSON('users.json', users);
  res.json({ success: true, subscription: users[idx].subscription });
});

// Razorpay: Create Order
app.post('/api/payment/create-order', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { planId, billing } = req.body;
  
  const subsData = readJSON('subscriptions.json');
  const plan = (subsData.plans || []).find(p => p.id === planId);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  
  let amount = plan.price;
  if (billing === 'yearly' && plan.yearlyPrice !== null) {
    amount = plan.yearlyPrice;
  }
  
  // Amount in paise
  const amountInPaise = amount * 100;

  try {
    const options = {
      amount: amountInPaise,
      currency: plan.currency || 'INR',
      receipt: `rcpt_${uuidv4()}`
    };
    
    const order = await razorpay.orders.create(options);
    
    // Save order details to DB
    const orders = readJSON('orders.json');
    const newOrder = {
      id: uuidv4(),
      razorpayOrderId: order.id,
      userId: req.session.userId,
      planId,
      billing,
      amount,
      status: 'created',
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    writeJSON('orders.json', orders);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Razorpay: Verify Payment
app.post('/api/payment/verify', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder')
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    // Payment successful!
    const orders = readJSON('orders.json');
    const orderIdx = orders.findIndex(o => o.razorpayOrderId === razorpay_order_id);
    
    if (orderIdx === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[orderIdx];
    order.status = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.paidAt = new Date().toISOString();
    writeJSON('orders.json', orders);

    // Upgrade user
    const users = readJSON('users.json');
    const userIdx = users.findIndex(u => u.id === order.userId);
    if (userIdx !== -1) {
      users[userIdx].subscription = {
        plan: order.planId,
        billing: order.billing || 'monthly',
        subscribedAt: new Date().toISOString()
      };
      writeJSON('users.json', users);
    }

    res.json({ success: true, message: 'Payment verified successfully', subscription: users[userIdx]?.subscription });
  } else {
    // Payment verification failed
    res.status(400).json({ error: 'Invalid payment signature' });
  }
});

// ──────────────────── PLAN LIMITS ROUTE ────────────────────

app.get('/api/plan-limits', (req, res) => {
  const planId = getUserPlan(req);
  const limits = getPlanLimits(planId);
  const links = readJSON('links.json');
  res.json({
    plan: planId,
    limits,
    usage: {
      linksUsed: links.length
    }
  });
});

// ──────────────────── SETTINGS ROUTES ────────────────────

app.get('/api/settings', (req, res) => {
  const settings = readJSON('settings.json');
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const planId = getUserPlan(req);
  const limits = getPlanLimits(planId);
  const current = readJSON('settings.json');
  const updated = { ...current, ...req.body };

  // Enforce plan restrictions on settings
  if (!limits.canHideBranding) {
    updated.showFooter = true;  // force branding on for free
  }
  if (!limits.canShowVerifiedBadge) {
    updated.showVerifiedBadge = false;  // no verified badge on free
  }
  if (!limits.canUseCustomCSS) {
    updated.customCSS = '';  // strip custom CSS for free
  }
  if (!limits.canEditSEO) {
    updated.metaDescription = current.metaDescription;  // keep old SEO, don't allow edit
  }
  // Enforce theme restriction
  if (!limits.allThemes && updated.selectedTheme) {
    if (!limits.allowedThemes.includes(updated.selectedTheme)) {
      updated.selectedTheme = current.selectedTheme;  // revert to current theme
    }
  }

  writeJSON('settings.json', updated);
  res.json(updated);
});


app.listen(PORT, () => {
  console.log(`\n  ✨ Conn is running!`);
  console.log(`  🏠 Landing page:  http://localhost:${PORT}`);
  console.log(`  🌐 Profile page:  http://localhost:${PORT}/me`);
  console.log(`  ⚙️  Admin panel:  http://localhost:${PORT}/admin`);
  console.log(`  🔐 Login:         http://localhost:${PORT}/login`);
  console.log(`  📡 API:           http://localhost:${PORT}/api\n`);
});
