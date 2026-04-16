# Image Background Remover

Remove image backgrounds instantly. Upload an image, get a transparent PNG back.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + TypeScript
- **Backend**: Cloudflare Workers (API proxy)
- **Image Processing**: Remove.bg API

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Workers URL

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### 3. Start Workers (local)

```bash
npx wrangler dev --local
```

### 4. Start Next.js

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy Workers

```bash
# Login to Cloudflare
npx wrangler login

# Set API key (get from remove.bg)
npx wrangler secret put REMOVE_BG_API_KEY

# Deploy
npx wrangler deploy
```

Note the Workers URL (e.g., `bg-remover-api.<username>.workers.dev`).

### Deploy Frontend (Cloudflare Pages)

1. Push to GitHub
2. Connect repo to [Cloudflare Pages](https://pages.cloudflare.com)
3. Build command: `npm run build`
4. Output directory: `out`
5. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-workers-url.workers.dev`

## Get Remove.bg API Key

Sign up at [remove.bg](https://www.remove.bg) to get your API key. Free tier includes 50 requests/month.
