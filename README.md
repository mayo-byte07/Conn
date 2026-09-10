<div align="center">

<img src="https://img.shields.io/badge/Conn-Link%20in%20Bio%20Platform-a855f7?style=for-the-badge&logo=lightning&logoColor=white" alt="Conn" />

# ⚡ Conn.

### The premium link-in-bio platform for modern creators.

**One link. Infinite possibilities.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-conn--delta.vercel.app-a855f7?style=flat-square&logo=vercel)](https://conn-delta.vercel.app)
[![Version](https://img.shields.io/badge/Version-1.2.0-4ade80?style=flat-square)](https://github.com/mayo-byte07/Conn/releases)
[![License](https://img.shields.io/badge/License-MIT-38bdf8?style=flat-square)](LICENSE)
[![Built with](https://img.shields.io/badge/Built%20with-Node.js%20%2B%20Supabase-f97316?style=flat-square&logo=nodedotjs)](https://nodejs.org)

<br/>

</div>

---

## 📚 Table of Contents

- [What is Conn?](#-what-is-conn)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start-local-development)
- [Deploy to Vercel](#-deploy-to-vercel)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Roadmap](#️-roadmap)
- [Releases](#-releases)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Contact](#-contact)
- [License](#-license)

---

## 📌 What is Conn?

**Conn** is a full-stack SaaS link-in-bio platform — a premium alternative to Linktree built from scratch. Create a stunning, fully customizable page that houses all your links, social profiles, and content in one place.

> Share one link. Connect everywhere.

---

## ✨ Features

### 🎨 26+ Premium Themes
From dark aesthetics to animated gradient meshes — Midnight, Neon Cyber, Aurora Borealis, Holographic, Cosmic Nebula, and more. One-click switching, live preview.

### 🔗 Link Management
Add, edit, delete, toggle, and drag-to-reorder links from a beautiful admin dashboard. Set featured links, track clicks, and organize your content.

### 📊 Real-Time Analytics
Track total clicks, view your top-performing links, and understand your audience — all from the dashboard.

### 💳 Subscription Plans
Three tiers with Razorpay payment integration — upgrade seamlessly from Free → Plus → Professional.

### 🔐 Secure Auth
JWT-based authentication with httpOnly cookies. No sessions stored in memory — works flawlessly on serverless platforms like Vercel.

### 🔑 Google Authentication
Secure Google Sign In / Sign Up integration using Google Identity Services and `google-auth-library`. Existing users can continue with Google using the same email, while new users get automatic account creation and profile initialization.

### 🌐 Public Profile URLs
Every user gets a shareable public page at `/u/username` with a unique aesthetic, social icons, and their curated links.

### 🔍 SEO Optimized
JSON-LD structured data (SoftwareApplication + Person schemas), dynamic meta tags per user, sitemap.xml, robots.txt, Open Graph and Twitter cards.

### 📱 Mobile-First
Pixel-perfect on every screen size. Designed for the mobile creators your audience actually is.

---

## 🗂 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | JWT + httpOnly Cookies + Google OAuth |
| **Payments** | Razorpay |
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **Hosting** | Vercel |
| **Analytics** | Custom click tracking |


---

## 🚀 Quick Start (Local Development)

### 📋 Prerequisites Check

Ensure you have the required tools installed. Open your terminal or command prompt and run:

- **Node.js** (v18+): `node -v`
- **npm** (v9+): `npm -v`
- **Git**: `git --version`
- A [Supabase](https://supabase.com) account (free tier is sufficient)

### 1. Clone the repository

```bash
git clone https://github.com/mayo-byte07/Conn.git
cd Conn
```

### 2. Install dependencies

The installation process is similar across operating systems:

**Linux / macOS / Windows:**
```bash
npm install
```
*(Windows Users: Conn uses `bcryptjs`, a pure JavaScript implementation, so you do not need Python or Visual Studio Build Tools to compile native modules!)*

```bash
npm install google-auth-library
```

### 3. Set up Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Dashboard → SQL Editor**
3. Paste and run the contents of [`scripts/setup-db.sql`](scripts/setup-db.sql)
4. Go to **Settings → API** and copy your **Project URL** and **service_role** key

### 4. Configure environment variables

Create a `.env` file in the root directory:

**Linux / macOS:**
```bash
cp .env.example .env 
nano .env
```

**Windows:**
```powershell
New-Item -ItemType File -Name ".env"
notepad .env
```

> ⚠️ **IMPORTANT:** `JWT_SECRET` is **required**. The server will exit immediately if it's missing.

Add the following to your `.env` file:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-random-secret-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

> 💡 **Tip:** Generate a secure JWT secret by running:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 5. 🔐 Google OAuth Setup

To enable Google Authentication locally and in production:

1. Go to the Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Create an OAuth Client ID
   * Application Type: Web Application
3. Add the following Authorized JavaScript Origins:

```txt
http://localhost:3000
https://conn-delta.vercel.app
```

4. Copy the generated Client ID and add it to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

> ⚠️ **Warning:** Do not expose any Google Client Secret publicly. Only the Client ID is required for this implementation.

### 6. Start the server

```bash
npm start
```
Visit `http://localhost:3000` to see your local instance running! 🎉

### 7. (Optional) Seed existing data

If you have local JSON data files from a previous version, you can migrate them:
```bash
npm run seed
```

---

## ☁️ Deploy to Vercel

### 1. Push to GitHub

```bash
git add -A
git commit -m "Initial deploy"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Go to **Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your service_role secret key |
| `JWT_SECRET` | Your JWT secret string |
| `NODE_ENV` | `production` |
| `RAZORPAY_KEY_ID` | Your Razorpay key (if using payments) |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |

4. Click **Deploy** ✅

> The [`vercel.json`](vercel.json) config is already included — Vercel will automatically route all traffic through Express.

---

## 📁 Project Structure

```
Conn/
├── server.js              # Express server — all API routes
├── db.js                  # Supabase client singleton
├── vercel.json            # Vercel serverless config
├── package.json
│
├── public/                # Static frontend files
│   ├── home.html          # Landing page
│   ├── index.html         # Public profile / link-in-bio page
│   ├── admin.html         # Admin dashboard
│   ├── login.html         # Sign in page
│   ├── signup.html        # Sign up page
│   ├── robots.txt         # SEO crawler config
│   ├── sitemap.xml        # XML sitemap
│   │
│   ├── features/          # Feature landing pages
│   │   ├── link-in-bio.html
│   │   ├── social-media.html
│   │   ├── grow.html
│   │   ├── monetize.html
│   │   └── analytics.html
│   │
│   ├── css/               # Stylesheets
│   │   ├── style.css      # Global styles
│   │   ├── home.css       # Landing page styles
│   │   ├── themes.css     # All 26+ theme definitions
│   │   ├── features.css   # Feature page styles
│   │   └── auth.css       # Auth page styles
│   │
│   └── js/                # Client-side JavaScript
│       ├── app.js         # Public profile page logic
│       ├── admin.js       # Dashboard logic
│       ├── auth.js        # Login / signup logic
│       ├── home.js        # Landing page interactions
│       └── features.js    # Feature pages shared logic
│
├── scripts/
│   ├── setup-db.sql       # SQL to create all Supabase tables
│   └── seed-db.js         # Migrate local JSON data → Supabase
│
└── data/
    └── subscriptions.json # Plan configuration (static)
```

---

## 🛣️ API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/logout` | Sign out |
| `GET` | `/api/auth/check` | Check session |
| `GET` | `/api/auth/check-username/:username` | Check username availability |
| `POST` | `/api/auth/google` | Authenticate user using Google OAuth |
| `GET` | `/api/auth/google-client-id` | Get Google Client ID for frontend initialization |

### Profile & Links
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profile` | Get authenticated user's profile |
| `PUT` | `/api/profile` | Update profile |
| `GET` | `/api/links` | Get all links |
| `POST` | `/api/links` | Add a link |
| `PUT` | `/api/links/:id` | Update a link |
| `DELETE` | `/api/links/:id` | Delete a link |
| `PUT` | `/api/links-reorder` | Reorder links |

### Public Profile
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/u/:username/profile` | Public profile data |
| `GET` | `/api/u/:username/links` | Public links |
| `GET` | `/api/u/:username/settings` | Public settings (theme etc) |
| `POST` | `/api/u/:username/links/:id/click` | Track link click |

### Settings & Subscription
| Method | Endpoint | Description |
|---|---|---|
| `GET/PUT` | `/api/settings` | Get / update settings |
| `GET` | `/api/subscription` | Current subscription |
| `GET` | `/api/plan-limits` | Get plan limits & usage |
| `POST` | `/api/payment/create-order` | Create Razorpay order |
| `POST` | `/api/payment/verify` | Verify payment |

---

## 🗺️ Roadmap

- [ ] Custom domain support
- [ ] Email link scheduling
- [ ] Team collaboration
- [ ] Embeddable widgets
- [ ] Detailed geographic analytics
- [ ] Password-protected links
- [ ] Link expiry dates

---

## 📜 Releases

| Version | What's new |
|---|---|
| [v1.2.0](https://github.com/mayo-byte07/Conn/releases/tag/v1.2.0) | ☁️ Supabase cloud DB, JWT auth, SEO, Vercel fix |
| [v1.1.0](https://github.com/mayo-byte07/Conn/releases/tag/v1.1.0) | 👥 Multi-user SaaS, subscriptions, 26+ themes |
| [v1.0.0](https://github.com/mayo-byte07/Conn/releases/tag/v1.0.0) | 🚀 Initial launch |

---

## 🛠 Troubleshooting

### Port already in use
If port `3000` is already occupied, stop the existing process or use a different port.

### Supabase connection issues
Verify that:
- `SUPABASE_URL` is correct
- `SUPABASE_SERVICE_KEY` is valid
- Database tables were created successfully

### JWT errors

---

## 🤝 Contributing

We welcome contributions! Please check our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on how to contribute, especially for GSSoC 2026 participants.

---

## 💖 Thanks to Contributors

A huge thank you to everyone who has helped improve Conn!

<a href="https://github.com/mayo-byte07/Conn/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=mayo-byte07/Conn" alt="Contributors Graph" />
</a>

---
## 📬 Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/mayo-byte07/Conn/issues)
- **GitHub Discussions**: [Ask questions or discuss ideas](https://github.com/mayo-byte07/Conn/discussions)
- **Email**: aethercode.society@gmail.com
- **Twitter/X**: [@AetherCodeSoc](https://twitter.com/AetherCodeSoc)

---

## 📄 License

MIT License © 2026 [AetherCode Society](https://github.com/mayo-byte07)

---

<div align="center">

Built with ⚡ by **AetherCode Society**

[Live Demo](https://conn-delta.vercel.app) • [Report Bug](https://github.com/mayo-byte07/Conn/issues) • [Request Feature](https://github.com/mayo-byte07/Conn/issues)

</div>
