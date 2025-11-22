# Deployment Guide

## Environment Configuration

### 1. Create `.env` file in `Frontend/` directory:

```env
VITE_API_URL="https://fund-tcba.onrender.com"
```

### 2. Vercel Environment Variables

When deploying to Vercel, add this environment variable in your project settings:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://fund-tcba.onrender.com`
   - **Environments**: Production, Preview, Development

## Build Command

```bash
npm run build
```

## Deployment Checklist

- ✅ All hardcoded localhost URLs replaced with `import.meta.env.VITE_API_URL`
- ✅ Axios configured with `baseURL` and `withCredentials: true`
- ✅ All fetch calls include `credentials: "include"`
- ✅ Console logs removed for production
- ✅ Vercel SPA routing configured (`vercel.json`)
- ✅ Environment variables set up

## CORS Configuration

Ensure your backend (Render) has CORS configured to allow the Render API base:

```javascript
{
  origin: "https://fund-tcba.onrender.com",
  credentials: true
}
```

