# CareerInk — GitHub & Vercel Deployment Guide

## Architecture Overview

```
GitHub Repository
├── backend/          → Deploy on Railway / Render (Python FastAPI)
└── frontend/         → Deploy on Vercel (Next.js)
```

---

## PART 1: GitHub Repository Setup

### Step 1 — Create the Repository

1. Go to [github.com](https://github.com) and sign in
2. Click **"+"** (top right) → **"New repository"**
3. Fill in:
   - **Repository name:** `careerink`
   - **Description:** `AI-Powered IT Career Transition Platform`
   - **Visibility:** Private (recommended) or Public
   - **Do NOT** check "Add a README file" (we'll push our own)
4. Click **"Create repository"**

### Step 2 — Initialize Git and Push Code

Open your terminal and run these commands:

```bash
# Navigate to the project root
cd /path/to/careerink

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "feat: initial CareerInk 2-agent MVP

- Agent 1: CV NLP pipeline + 48-question psychological assessment
- Agent 2: Career matching algorithm (40/25/20/15 weights) + LLM justifications
- 50 pre-built IT career profiles
- Next.js frontend with CareerInk brand design
- PDF report generation
- LangGraph orchestration for both agents"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/careerink.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 3 — Verify Repository Structure

Your GitHub repo should show:
```
careerink/
├── backend/
│   ├── agents/agent1/  (graph.py, nodes.py, state.py)
│   ├── agents/agent2/  (graph.py, nodes.py, state.py)
│   ├── data/           (career_profiles.py, questions.py, skill_taxonomy.py)
│   ├── services/       (cv_parser.py, matcher.py, pdf_generator.py, deploy_ai.py)
│   ├── main.py
│   ├── requirements.txt
│   └── Procfile
├── frontend/
│   ├── src/app/        (all pages)
│   ├── src/components/ (all components)
│   ├── src/lib/        (store, api)
│   ├── package.json
│   └── next.config.mjs
├── .gitignore
└── vercel.json
```

---

## PART 2: Backend Deployment on Railway

> Railway is the recommended platform for the Python FastAPI backend. Free tier available.

### Step 4 — Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `careerink` repository
4. Railway will detect it — click **"Configure"**
5. Set the **Root Directory** to `backend`
6. Railway auto-detects `requirements.txt` and `Procfile`

### Step 5 — Configure Backend Environment Variables

In Railway dashboard → your project → **"Variables"** tab, add:

```
CLIENT_ID         = your_deploy_ai_client_id
CLIENT_SECRET     = your_deploy_ai_client_secret
ORG_ID            = your_deploy_ai_org_id
AUTH_URL          = https://api-auth.deploy.ai/oauth2/token
API_URL           = https://core-api.deploy.ai
```

### Step 6 — Get Backend URL

After deployment, Railway gives you a URL like:
```
https://careerink-backend-production.up.railway.app
```

**Save this URL — you'll need it for the frontend.**

Test it:
```bash
curl https://your-railway-url.up.railway.app/health
# Should return: {"status":"ok","service":"CareerInk API","version":"2.0.0"}
```

---

## PART 3: Frontend Deployment on Vercel

### Step 7 — Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Find your `careerink` repository → click **"Import"**

### Step 8 — Configure Vercel Build Settings

In the import configuration screen:

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` |

### Step 9 — Set Environment Variables

In **"Environment Variables"** section, add:

```
NEXT_PUBLIC_API_URL = https://your-railway-url.up.railway.app
```

*(Replace with your actual Railway backend URL from Step 6)*

### Step 10 — Deploy

Click **"Deploy"**. Vercel will:
1. Clone your repository
2. Install dependencies (`npm install` in `frontend/`)
3. Build the Next.js app (`npm run build`)
4. Deploy to a global CDN

Your app will be live at: `https://careerink.vercel.app` (or similar)

---

## PART 4: Custom Domain (careerink.io)

### Step 11 — Add Custom Domain on Vercel

1. In Vercel dashboard → your project → **"Settings"** → **"Domains"**
2. Type `careerink.io` and click **"Add"**
3. Also add `www.careerink.io`

### Step 12 — Configure DNS

In your domain registrar (where you bought careerink.io), add these DNS records:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

DNS propagation takes 15 minutes to 48 hours.

---

## PART 5: Continuous Deployment (CD)

Once set up, every push to `main` branch automatically redeploys:

```bash
# Make a change
git add .
git commit -m "fix: update career matching algorithm"
git push origin main

# Vercel & Railway automatically redeploy within 2-3 minutes
```

---

## PART 6: Alternative Backend Platforms

If you prefer alternatives to Railway:

### Option A: Render

1. Go to [render.com](https://render.com) → **"New"** → **"Web Service"**
2. Connect GitHub → select `careerink` repo
3. Root Directory: `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables (same as Step 5)

### Option B: Heroku

```bash
cd backend
heroku create careerink-api
heroku config:set CLIENT_ID=... CLIENT_SECRET=... ORG_ID=...
heroku config:set AUTH_URL=https://api-auth.deploy.ai/oauth2/token
heroku config:set API_URL=https://core-api.deploy.ai
git subtree push --prefix backend heroku main
```

### Option C: AWS (Production)

For production scale, consider:
- **Backend:** AWS ECS / Fargate with ECR
- **Frontend:** Vercel (keep) or AWS Amplify
- **Database:** AWS RDS (for storing sessions/opt-ins)

---

## PART 7: Environment Summary

| Component | Platform | URL Pattern |
|---|---|---|
| Frontend (Next.js) | Vercel | `https://careerink.vercel.app` |
| Backend (FastAPI) | Railway | `https://careerink-api.up.railway.app` |
| Custom Domain | Vercel | `https://careerink.io` |

---

## PART 8: Post-Deployment Checklist

- [ ] Backend `/health` endpoint returns 200
- [ ] CV analysis works with a test CV (500+ chars)
- [ ] Assessment questions load and scoring works
- [ ] Career matching returns 3-5 results
- [ ] PDF download works (<10 seconds)
- [ ] Email opt-in saves successfully
- [ ] Logo displays correctly
- [ ] Mobile layout looks good
- [ ] Progress bar moves through all 6 steps

---

## Troubleshooting

**Frontend shows blank page after deploy:**
- Check Vercel build logs → `npm run build` must succeed
- Verify `NEXT_PUBLIC_API_URL` env var is set correctly

**API calls fail (CORS errors):**
- Backend CORS is set to `allow_origins=["*"]` for MVP
- For production: restrict to `["https://careerink.io", "https://careerink.vercel.app"]`

**PDF generation times out:**
- Vercel has a 30s serverless function limit; PDF generation runs on the backend (Railway) which has no limit

**Railway cold starts (first request slow):**
- Upgrade to Railway Pro to keep the instance warm
- Or use Render's "Always On" feature

---

*Guide prepared for CareerInk v2.0 — 2026-02-28*
