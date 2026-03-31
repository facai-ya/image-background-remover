# Image Background Remover

A simple web app to remove image backgrounds using AI.

## Deploy to Vercel (Recommended)

1. Click the button below:
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/facai-ya/image-background-remover)

2. Add environment variable:
   - `REMOVE_BG_API_KEY` = your API key from https://remove.bg/api

## Deploy to Cloudflare Pages

1. Connect GitHub repository in Cloudflare Dashboard → Pages
2. Build settings:
   - Build command: `npm run build`
   - Build output directory: `.next`
3. Add environment variable:
   - `REMOVE_BG_API_KEY` = `8U73faZpDg7PghtR3t9bCdhc`

## Local Development

```bash
npm install
npm run dev
```

## API Key

Get your free API key at: https://remove.bg/api
