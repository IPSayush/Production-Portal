# 🏭 PRODUCTION PORTAL — MASTER SETUP GUIDE

> This guide explains **everything** you need to deploy, configure, and manage user accounts for the Production Portal application. Follow each section step by step.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [How to Deploy This Project & Environment Variables](#2-how-to-deploy-this-project--environment-variables)
   - [Prerequisites](#prerequisites)
   - [Step 1 — Clone the Repository](#step-1--clone-the-repository)
   - [Step 2 — Backend Setup & Environment Variables](#step-2--backend-setup--environment-variables)
   - [Step 3 — Frontend Setup & Environment Variables](#step-3--frontend-setup--environment-variables)
   - [Step 4 — Run Locally (Development)](#step-4--run-locally-development)
   - [Step 5 — Deploy Backend (Vercel)](#step-5--deploy-backend-vercel)
   - [Step 6 — Deploy Frontend (Cloudflare Pages)](#step-6--deploy-frontend-cloudflare-pages)
   - [Step 7 — Post-Deployment Verification](#step-7--post-deployment-verification)
3. [How to Manage the Manager's ID & Password](#3-how-to-manage-the-managers-id--password)
4. [How to Manage the Viewer's ID & Password](#4-how-to-manage-the-viewers-id--password)
5. [How to Add a New Viewer or Manager](#5-how-to-add-a-new-viewer-or-manager)

---

## 1. Project Overview

The Production Portal is a **MERN-stack** (MongoDB, Express, React, Node.js) web application with two user roles:

| Role | What They Can Do |
|------|-----------------|
| **Manager** | Create/edit/delete production sheets, add/edit/delete rows, change sheet status, full read-write access |
| **Viewer** | Read-only access to all sheets and rows. Only one device session is allowed at a time (single-device enforcement) |

**Architecture:**
- **Backend** — Node.js + Express API, deployed on **Vercel** (serverless functions)
- **Frontend** — React + Vite SPA, deployed on **Cloudflare Pages**
- **Database** — MongoDB Atlas (cloud-hosted MongoDB)
- **Image Storage** — Cloudinary (for sheet cover images)
- **Authentication** — JWT tokens with bcrypt-hashed passwords

---

## 2. How to Deploy This Project & Environment Variables

### Prerequisites

Before you begin, make sure you have:

- ✅ **Node.js 18+** installed — [Download here](https://nodejs.org/)
- ✅ **npm** (comes with Node.js)
- ✅ **Git** installed — [Download here](https://git-scm.com/)
- ✅ A **MongoDB Atlas** account (free tier works) — [Sign up here](https://www.mongodb.com/atlas)
- ✅ A **Cloudinary** account (free tier works) — [Sign up here](https://cloudinary.com/)
- ✅ A **Vercel** account (for backend hosting) — [Sign up here](https://vercel.com/)
- ✅ A **Cloudflare** account (for frontend hosting) — [Sign up here](https://dash.cloudflare.com/sign-up)

---

### Step 1 — Clone the Repository

```bash
git clone <your-repo-url>
cd Production-Portal
```

The project has two folders:
```
Production-Portal/
├── backend/       ← Express API server
├── frontend/      ← React SPA (Vite)
├── README.md
└── MASTERSETUP.md ← This file
```

---

### Step 2 — Backend Setup & Environment Variables

#### 2.1 — Navigate to the backend folder

```bash
cd backend
```

#### 2.2 — Create the `.env` file

Copy the example file and edit it:

```bash
cp .env.example .env
```

Now open `.env` and fill in the values:

```env
# ─── Database ───
# Your MongoDB Atlas connection string
# Get it from: MongoDB Atlas → Cluster → Connect → Drivers → Copy Connection String
# Replace <password> with your actual database user password
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/production-portal?retryWrites=true&w=majority

# ─── Authentication ───
# IMPORTANT: Generate a strong random secret for production!
# Run this command in your terminal to generate one:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=paste-your-generated-secret-here

# ─── Server ───
# Port for local development (Vercel ignores this in production)
PORT=5000

# ─── CORS ───
# Set this to your deployed frontend URL (required for production!)
FRONTEND_URL=https://your-frontend.pages.dev

# ─── Seed Users ───
# Set to 'true' to auto-create default users on first startup
# Set to 'false' after your users are created to prevent re-seeding
SEED_ENABLED=true

# Passwords for the default seeded users (change these to strong passwords!)
SEED_MANAGER_PASSWORD=your-strong-manager-password
SEED_VIEWER1_PASSWORD=your-strong-viewer1-password
SEED_VIEWER2_PASSWORD=your-strong-viewer2-password
```

#### 2.3 — Backend Environment Variables Explained

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ Yes | MongoDB connection string. Use MongoDB Atlas for production. |
| `JWT_SECRET` | ✅ Yes | Secret key used to sign JWT tokens. **Must be a long random string** in production. Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `PORT` | ❌ Optional | Port for local development. Defaults to `5000`. Vercel ignores this. |
| `FRONTEND_URL` | ✅ Yes (production) | The full URL of your deployed frontend (e.g., `https://your-app.pages.dev`). Used for CORS. |
| `SEED_ENABLED` | ❌ Optional | Set to `true` to auto-create default users on startup. Set to `false` to disable. Defaults to `true`. |
| `SEED_MANAGER_PASSWORD` | ⚠️ If seeding | Password for the default Manager account. |
| `SEED_VIEWER1_PASSWORD` | ⚠️ If seeding | Password for the first default Viewer account. |
| `SEED_VIEWER2_PASSWORD` | ⚠️ If seeding | Password for the second default Viewer account. |

#### 2.4 — Install backend dependencies

```bash
npm install
```

---

### Step 3 — Frontend Setup & Environment Variables

#### 3.1 — Navigate to the frontend folder

```bash
cd ../frontend
```

#### 3.2 — Create the `.env` file

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
# ─── Backend API URL ───
# For local development:
VITE_API_URL=http://localhost:5000/api
# For production, change this to your deployed backend URL:
# VITE_API_URL=https://your-backend.vercel.app/api

# ─── Cloudinary (Image Upload) ───
# Get these from your Cloudinary Dashboard (https://cloudinary.com/console)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

#### 3.3 — Frontend Environment Variables Explained

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ Yes | Full URL to your backend API (with `/api` at the end). For local: `http://localhost:5000/api`. For production: `https://your-backend.vercel.app/api` |
| `VITE_CLOUDINARY_CLOUD_NAME` | ✅ Yes | Your Cloudinary cloud name. Find it on your [Cloudinary Dashboard](https://cloudinary.com/console). |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | ✅ Yes | An **unsigned** upload preset name. Create it in Cloudinary → Settings → Upload → Upload Presets → Add Unsigned Preset. |

#### 3.4 — How to Set Up Cloudinary (for image upload)

1. Go to [cloudinary.com](https://cloudinary.com/) and sign up / log in.
2. From the **Dashboard**, note your **Cloud Name** (e.g., `dknczos12`).
3. Go to **Settings** → **Upload** → scroll to **Upload Presets**.
4. Click **Add Upload Preset**.
5. Set **Signing Mode** to **Unsigned**.
6. Set the **Folder** to `production-portal/sheets` (optional but recommended).
7. Save the preset and note its name (e.g., `production_portal_sheets`).
8. Put the Cloud Name and Preset Name in your frontend `.env` file.

#### 3.5 — Install frontend dependencies

```bash
npm install
```

---

### Step 4 — Run Locally (Development)

Open **two separate terminals**:

**Terminal 1 — Start the Backend:**
```bash
cd backend
npm run dev
```
The backend will start at `http://localhost:5000`. On first run (if `SEED_ENABLED=true`), it will automatically create the default users in your database.

**Terminal 2 — Start the Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will start at `http://localhost:5173`. The Vite dev server automatically proxies `/api` requests to `http://localhost:5000`.

Now open `http://localhost:5173` in your browser to use the app.

---

### Step 5 — Deploy Backend (Vercel)

The backend is pre-configured for Vercel with `vercel.json` and `api/index.js` (serverless function handler).

#### 5.1 — Install Vercel CLI (if not already)

```bash
npm install -g vercel
```

#### 5.2 — Deploy

```bash
cd backend
vercel
```

Follow the prompts. On first deploy, link to a new project.

#### 5.3 — Set Environment Variables on Vercel

Go to your Vercel Dashboard → Project → Settings → Environment Variables. Add:

| Name | Value |
|------|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Your generated JWT secret |
| `FRONTEND_URL` | Your frontend production URL (e.g., `https://your-app.pages.dev`) |
| `SEED_ENABLED` | `true` (for first deploy only, then set to `false`) |
| `SEED_MANAGER_PASSWORD` | Your chosen manager password |
| `SEED_VIEWER1_PASSWORD` | Your chosen viewer 1 password |
| `SEED_VIEWER2_PASSWORD` | Your chosen viewer 2 password |

> ⚠️ **Important:** After the first successful deployment (users are created), change `SEED_ENABLED` to `false` and redeploy. This prevents the seeding logic from running on every cold start.

#### 5.4 — Production Deploy

```bash
vercel --prod
```

Note the production URL (e.g., `https://your-backend.vercel.app`).

---

### Step 6 — Deploy Frontend (Cloudflare Pages)

#### 6.1 — Connect your repo to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**.
2. Select your GitHub/GitLab repo.
3. Configure the build settings:

| Setting | Value |
|---------|-------|
| **Framework preset** | None |
| **Root directory** | `frontend` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

4. Add **Environment Variables**:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://your-backend.vercel.app/api` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Your Cloudinary unsigned upload preset |

5. Click **Save and Deploy**.

> **Note:** The `public/_redirects` file (if present) ensures SPA routing works correctly on Cloudflare Pages. All routes will serve `index.html`.

---

### Step 7 — Post-Deployment Verification

1. **Check Backend Health:**
   Open `https://your-backend.vercel.app/api/health` in a browser. You should see:
   ```json
   { "status": "ok", "database": "connected", "timestamp": "..." }
   ```

2. **Update CORS:** Make sure `FRONTEND_URL` on Vercel matches your actual Cloudflare Pages URL. If the URL changes, update the env variable and redeploy the backend.

3. **Test Login:** Open your frontend URL → click Manager or Viewer → log in with the seeded credentials.

4. **Disable Seeding:** Once you confirm logins work, go to Vercel → Environment Variables → set `SEED_ENABLED=false` → redeploy.

---

## 3. How to Manage the Manager's ID & Password

### Default Manager Account (Created by Seed)

When the app starts for the first time with `SEED_ENABLED=true`, it creates this manager account:

| Field | Value |
|-------|-------|
| **User ID** | `9569374626` |
| **Name** | Ayush |
| **Role** | `manager` |
| **Password** | Set by `SEED_MANAGER_PASSWORD` in backend `.env` |

### How Login Works for Manager

1. The manager goes to the app → Landing Page → clicks **"Manager Login"**.
2. Enters their **User ID** (e.g., `9569374626`) and **Password**.
3. The backend checks the credentials against the database.
4. On success, a **JWT token** is issued (valid for 365 days).
5. The manager has full access: create/edit/delete sheets, add/edit/delete rows, change statuses.

### How to Change the Manager's Password

There is **no UI** to change passwords. You must do it through the database or by re-seeding.

#### Method 1: Re-Seed with a New Password (Recommended for fresh setup)

1. **Delete** the existing manager user from MongoDB:
   - Open **MongoDB Atlas** → your cluster → **Browse Collections** → `production-portal` database → `users` collection.
   - Find the document where `userId` is `9569374626` and **delete** it.
2. **Update** the `SEED_MANAGER_PASSWORD` in your backend `.env` (or Vercel environment variable) to the new desired password.
3. Make sure `SEED_ENABLED=true`.
4. **Restart/Redeploy** the backend. The seed script will recreate the manager with the new password.
5. Set `SEED_ENABLED=false` again after the user is created.

#### Method 2: Directly Update in MongoDB (For advanced users)

1. Generate a bcrypt hash of your new password. Run this in Node.js:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_NEW_PASSWORD', 10).then(h => console.log(h));"
   ```
2. Copy the output hash (starts with `$2a$`).
3. In **MongoDB Atlas** → `users` collection → find the manager document (`userId: "9569374626"`).
4. Click **Edit** → replace the `password` field value with the bcrypt hash you generated.
5. Click **Update**.
6. The manager can now log in with the new password.

### How to Change the Manager's User ID

1. Delete the existing manager user from MongoDB (as described above).
2. Edit the seed file at `backend/src/seed.js`:
   - Find the object with `role: 'manager'` and change the `userId` to your desired ID.
   - Optionally change the `name` field too.
3. Set `SEED_ENABLED=true`, restart/redeploy, then set it back to `false`.

> ⚠️ **Important:** The User ID is what the manager types in the login form. It can be any string (phone number, employee ID, etc.).

---

## 4. How to Manage the Viewer's ID & Password

### Default Viewer Accounts (Created by Seed)

When the app starts with `SEED_ENABLED=true`, it creates these viewer accounts:

| # | User ID | Name | Password Env Variable |
|---|---------|------|-----------------------|
| 1 | `6280348611` | Akash | `SEED_VIEWER1_PASSWORD` |
| 2 | `8302220000` | Prateek | `SEED_VIEWER2_PASSWORD` |

### How Login Works for Viewer

1. The viewer goes to the app → Landing Page → clicks **"Viewer Login"**.
2. Enters their **User ID** and **Password**.
3. The backend validates credentials and creates a **unique session ID**.
4. This session ID is stored on the user's document in the database.
5. **Single-Device Enforcement:** If the same viewer logs in on another device, the previous session is invalidated. The old device will get a "Session expired" error and be logged out automatically.

### How to Change a Viewer's Password

Same methods as the Manager (see Section 3 above), but:

- For **Viewer 1 (Akash):** Update `SEED_VIEWER1_PASSWORD` and delete the user with `userId: "6280348611"` from MongoDB, then re-seed.
- For **Viewer 2 (Prateek):** Update `SEED_VIEWER2_PASSWORD` and delete the user with `userId: "8302220000"` from MongoDB, then re-seed.

Or use the **MongoDB direct update method** with bcrypt hash (same as Method 2 in Section 3).

### How to Force-Logout a Viewer

If a viewer is stuck with a session issue:

1. Go to **MongoDB Atlas** → `users` collection.
2. Find the viewer's document.
3. Set `currentSessionId` to `null`.
4. The viewer will need to log in again.

---

## 5. How to Add a New Viewer or Manager

### Method 1: Add to the Seed Script (Recommended)

This is the simplest way to add new users.

#### Step 1 — Edit the seed file

Open `backend/src/seed.js` and add a new entry to the `defaultUsers` array:

**To add a new Viewer:**
```javascript
const defaultUsers = [
  // ... existing users ...
  
  // ↓ ADD THIS BLOCK ↓
  {
    userId: '1234567890',            // The User ID they'll use to log in
    passwordEnv: 'SEED_VIEWER3_PASSWORD', // Env variable name for their password
    fallbackPassword: 'dev-only-pw',     // Fallback only used if env var is missing
    role: 'viewer',                      // Set to 'viewer' for read-only access
    name: 'New Person Name',             // Display name shown in the app
  },
];
```

**To add a new Manager:**
```javascript
{
  userId: '9876543210',
  passwordEnv: 'SEED_MANAGER2_PASSWORD',
  fallbackPassword: 'dev-only-pw',
  role: 'manager',                       // Set to 'manager' for full access
  name: 'New Manager Name',
},
```

#### Step 2 — Add the password environment variable

Add the matching env variable in your backend `.env` file (and on Vercel):

```env
SEED_VIEWER3_PASSWORD=their-strong-password
```
or
```env
SEED_MANAGER2_PASSWORD=their-strong-password
```

#### Step 3 — Enable seeding and restart

1. Set `SEED_ENABLED=true` in `.env` (or on Vercel).
2. Restart the backend (locally) or redeploy (Vercel).
3. The seed script will **only create users that don't already exist** — it won't overwrite or duplicate existing users.
4. Set `SEED_ENABLED=false` again after the new users are created.

---

### Method 2: Directly Insert into MongoDB (For advanced users)

If you don't want to modify the seed script:

#### Step 1 — Generate a bcrypt password hash

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('THE_PASSWORD', 10).then(h => console.log(h));"
```

Copy the output hash.

#### Step 2 — Insert the document into MongoDB

Go to **MongoDB Atlas** → **Browse Collections** → `production-portal` database → `users` collection → **Insert Document**.

**For a new Viewer:**
```json
{
  "userId": "1234567890",
  "password": "$2a$10$...your_bcrypt_hash_here...",
  "role": "viewer",
  "name": "New Person Name",
  "currentSessionId": null
}
```

**For a new Manager:**
```json
{
  "userId": "9876543210",
  "password": "$2a$10$...your_bcrypt_hash_here...",
  "role": "manager",
  "name": "New Manager Name",
  "currentSessionId": null
}
```

> **Note:** The `userId` must be **unique** across all users. The `role` must be exactly `"manager"` or `"viewer"` — no other values are allowed.

---

## Quick Reference: Default Seeded Users

| Role | Name | User ID | Password Env Variable |
|------|------|---------|-----------------------|
| Manager | Ayush | `9569374626` | `SEED_MANAGER_PASSWORD` |
| Viewer | Akash | `6280348611` | `SEED_VIEWER1_PASSWORD` |
| Viewer | Prateek | `8302220000` | `SEED_VIEWER2_PASSWORD` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Database connection failed" | Check your `MONGO_URI` is correct. Make sure your IP is whitelisted in MongoDB Atlas (Network Access → Add IP → Allow from Anywhere for Vercel). |
| CORS errors in browser | Make sure `FRONTEND_URL` in backend `.env` / Vercel matches your exact frontend URL. |
| "Invalid credentials" on login | Verify the User ID and password match what was seeded. Check if the user exists in the `users` collection in MongoDB. |
| "Session expired" for viewer | Another device logged in with the same viewer account, or `currentSessionId` was cleared. Log in again. |
| Images not uploading | Verify `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` are correct. Make sure the upload preset is set to **Unsigned**. |
| Seed users not created | Check `SEED_ENABLED=true` in the backend env. Check the console/logs for "Seeded user: ..." messages. |
| "Too many requests" error | The API has rate limiting: 100 requests per 15 min globally, and 10 login attempts per 15 min. Wait 15 minutes. |

---

> **Security Reminder:** Never commit your `.env` files to Git. The `.gitignore` file already excludes them. Always use strong passwords and a unique `JWT_SECRET` in production.
