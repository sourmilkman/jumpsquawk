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

The GitHub Pages build cannot safely contain `OPENAI_API_KEY`. On Android, the installed PWA works for demo mode and local progress immediately. For live voice, run or deploy the included Express gateway privately, then set its HTTPS URL in Settings.

## Useful Commands

```bash
npm run test
npm run lint
npm run build
```
