# Jumpsquawk

Local-first Spanish speaking practice as an installable PWA.

## Run Locally

```bash
npm install
cp .env.example .env
npm run dev
```

Add `OPENAI_API_KEY` to `.env` for live Realtime voice practice. Without a key, the app still runs in demo mode and stores progress locally.

## GitHub Pages

This repo includes `.github/workflows/pages.yml`. Enable GitHub Pages from Actions, push to `main`, and the workflow builds the static PWA with the correct repo base path.

The GitHub Pages build cannot safely contain `OPENAI_API_KEY`. On Android, the installed PWA works for demo mode and local progress immediately. For live voice, point Settings -> Realtime gateway URL at an HTTPS gateway.

## Netlify Realtime Gateway

This repo includes a Netlify Functions gateway at:

- `GET /api/health`
- `POST /api/realtime/session`

Deploy the repo to Netlify, then set these Netlify environment variables in the Netlify dashboard:

```env
OPENAI_API_KEY=sk-...
OPENAI_REALTIME_MODEL=gpt-realtime
OPENAI_REALTIME_VOICE=coral
GATEWAY_ALLOWED_ORIGINS=https://sourmilkman.github.io,http://localhost:5173,http://127.0.0.1:5173
```

After deploy, test:

```bash
curl https://your-netlify-site.netlify.app/api/health
```

Then open the PWA on your phone and set Settings -> Realtime gateway URL to:

```text
https://your-netlify-site.netlify.app
```

Turn Demo mode off. The top bar should say `Live Realtime practice`, and tutor audio should come from OpenAI Realtime rather than the browser's local system voice.

## Useful Commands

```bash
npm run test
npm run lint
npm run build
```
