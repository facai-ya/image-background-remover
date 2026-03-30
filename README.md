# 🎨 Image Background Remover

AI-powered image background removal tool built with Next.js + Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **API**: Remove.bg API
- **Deployment**: Vercel / Cloudflare Pages

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/facai-ya/image-background-remover.git
cd image-background-remover
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file:

```env
REMOVE_BG_API_KEY=your_remove_bg_api_key
```

Get your API key from [remove.bg](https://remove.bg).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

### 5. Build for production

```bash
npm run build
npm start
```

## Features

- ✅ Drag & drop image upload
- ✅ Support PNG, JPG, WEBP (max 10MB)
- ✅ AI background removal via Remove.bg API
- ✅ Side-by-side comparison
- ✅ One-click download
- ✅ Responsive design

## API Endpoints

### POST `/api/remove-bg`

Remove background from an image.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `image` (file)

**Response:**
- Success: PNG image with transparent background
- Error: `{ error: string }`

## Cost

| Service | Free Tier | Extra |
|---------|-----------|-------|
| Remove.bg | 50/month | $0.05/image |
| Vercel | 100GB bandwidth | $0.04/GB |
| Cloudflare Pages | Unlimited | Free |

## License

MIT