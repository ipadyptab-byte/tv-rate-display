# Deploy to Render

## Quick Deploy
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ipadyptab-byte/tv-rate-display)

## Manual Setup

1. Go to https://render.com and sign up/login
2. Click **New +** → **Web Service**
3. Connect your GitHub repo: `ipadyptab-byte/tv-rate-display`
4. Configure:
   - **Name**: `tv-rate-display`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: Node
   - **Build Command**: `npm run build && npm run build:render`
   - **Start Command**: `npm run start:render`
5. Add Environment Variables:
   - `NEON_DATABASE_URL` = your Neon database URL
   - `EXTERNAL_RATES_URL` = your rates API URL
6. Click **Create Web Service**

## Environment Variables Required

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `NEON_DATABASE_URL` | From Neon dashboard |
| `EXTERNAL_RATES_URL` | Your rates API endpoint |

## Health Check
After deployment, visit: `https://your-render-url.onrender.com/api/health`

## Cron Jobs (Optional)
Render free tier doesn't have cron jobs like Vercel. Instead, the server auto-syncs every 60 seconds (in server/index.ts). This is fine for Render.

## Both Vercel + Render
Both platforms share the same Neon database, so rates stay in sync. Use whichever URL works better for you.