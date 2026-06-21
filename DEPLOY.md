# Deploy Presence (free demo URL)

Recommended: **[Render](https://render.com)** free Web Service — one URL serves the React app and Express API.

## 1. Push to GitHub

Repo: `https://github.com/bingqinz-cmu-S26/agents_we_love_hackathon`

```bash
git add render.yaml package.json server/index.ts .gitignore
git commit -m "Add Render deploy config"
git push origin main
```

## 2. Create Render service

1. Sign in at [dashboard.render.com](https://dashboard.render.com)
2. **New → Blueprint** (or **Web Service** if Blueprint is unavailable)
3. Connect GitHub → select `agents_we_love_hackathon`
4. Render reads `render.yaml` and creates **presence-meditation**

If using **Web Service** manually:

| Field | Value |
|--------|--------|
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Health Check | `/api/health` |

## 3. Environment variables (Render → Environment)

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `HYDRA_DB_API_KEY` | your Hydra key |
| `HYDRA_TENANT_ID` | `still_meditation_copilot` |
| `NEBIUS_API_KEY` | your Nebius key |
| `NEBIUS_MODEL` | `Qwen/Qwen3-235B-A22B-Instruct-2507` |

`PORT` is set automatically by Render.

## 4. Deploy & test

After deploy finishes:

- App: `https://presence-meditation.onrender.com` (or your assigned URL)
- Health: `https://<your-url>/api/health` → should show `hydradb: true`, `nebius: true`

## Pin demo to an existing HydraDB user

HydraDB memories are keyed by `subTenantId` = the browser `still_user_id`. To use an account that already has data (e.g. `user_65d03571`):

### On Render (all visitors share demo memory)

1. Render Dashboard → your service → **Environment**
2. Add:
   - `DEMO_USER_ID` = `user_65d03571`
   - `DEMO_DISPLAY_NAME` = `Ema` (optional)
3. Redeploy

The app reads these from `/api/health` and binds every new session to that Hydra user. **Do not** click “Load demo history” on production — that wipes and re-seeds memories.

`render.yaml` already includes `DEMO_USER_ID=user_65d03571` after you push the latest code.

### One browser only (console)

On https://agents-we-love-hackathon.onrender.com open DevTools → Console:

```js
localStorage.setItem('still_user_id', 'user_65d03571');
localStorage.setItem('still_profile', JSON.stringify({
  userId: 'user_65d03571',
  displayName: 'Ema',
  spiritualTone: 'spiritual',
  onboardingComplete: true,
}));
location.reload();
```

### Verify Hydra recall

```bash
curl -s -X POST https://agents-we-love-hackathon.onrender.com/api/memory/start-from-memory \
  -H 'Content-Type: application/json' \
  -d '{"userId":"user_65d03571"}' | head -c 500
```

Should return `ok: true` with a `stack` and `recalledSession`.

### Seed NEW mock data (destructive)

Only if you want to **replace** all memories for a user with Jason v2 mock data:

```bash
# Uses local .env HYDRA_DB_API_KEY — same tenant as Render
npx tsx scripts/reset-jason-memories.ts user_65d03571
```

Or on live (clears existing memories first):

```bash
curl -X POST https://agents-we-love-hackathon.onrender.com/api/memory/seed-journey \
  -H 'Content-Type: application/json' \
  -d '{"userId":"user_65d03571"}'
```

**Warning:** `seed-journey` deletes all memories for that userId before seeding.

## Notes

- **Free tier** spins down after ~15 min idle; first visit may take 30–60s to wake.
- Audio uses `public/audio/ocean-loop.mp3` (~1.4MB), not the large m4a.
- Camera / mic need HTTPS (Render provides TLS).

## Alternative: Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Same build/start commands as above
3. Add the same env vars
4. Generate domain in **Settings → Networking**
