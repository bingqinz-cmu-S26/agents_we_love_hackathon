# Presence — Meditation Companion

**Context over amnesia, for inner life.**

A personal meditation companion for the [Agents You Love Hackathon](https://luma.com/b7chd233). Presence remembers how you feel, how your body responds (rPPG), and the full **calm stack** that works for you — guide, music, scent, and lighting.

## Stack

| Layer | Tech |
|---|---|
| Memory | **HydraDB** (`add_memory`, `recall_preferences`) |
| Agent LLM | **Nebius Token Factory** (OpenAI-compatible) |
| Frontend | React + Vite + Tailwind |
| Backend | Express (API proxy for keys) |
| Vitals | Webcam + demo rPPG simulation (vitallens.js compatible) |

## Quick start

```bash
cp .env.example .env
# Add HYDRA_DB_API_KEY and NEBIUS_API_KEY

npm install
npm run dev
```

Open http://localhost:5173

- API: http://localhost:3001
- Promo code for HydraDB credits: `HYDRA2026`
- Submission portal code: `MEMORY2026`

## Demo script (for judges)

1. **Onboard** — pick guide tone → profile saved to HydraDB
2. **Session 1** — chat: *"Pretty anxious, can't stop thinking about tomorrow"*
3. Agent recalls (or suggests) calm stack → say **"Yes"**
4. Complete 3-min session → post emotion check-in → **Memory saved** log
5. **Close tab**, reopen → agent welcomes back and recalls stack without re-asking
6. Toggle **Forget me** to show contrast (no recall)
7. Open **HydraDB logs** panel for execution traces

## Environment variables

See `.env.example`.

Without API keys, the app runs in **local fallback mode** (in-memory memories + template agent replies). Add keys for full HydraDB + Nebius integration.
