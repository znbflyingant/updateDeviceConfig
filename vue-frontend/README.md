# Frontend (Vue) - Usage Guide

## Local Development

```bash
cd vue-frontend
npm install
# optional: create .env.local to override API
# echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env.local
npm run dev
```

## Environment Variables

- `VITE_API_BASE_URL`
  - Development example: `http://localhost:3001/api`
  - Preview example: `https://<your-staging-api>.railway.app/api`
  - Production example: `https://<your-prod-api>.railway.app/api`

Note: only variables prefixed with `VITE_` are exposed to the client. Do not put secrets here.

## Build

```bash
npm run build
```

Outputs to `vue-frontend/dist` (Vercel builds automatically).
