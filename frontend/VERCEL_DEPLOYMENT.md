# Vercel Deployment Guide

## Quick Deploy to Vercel

### 1. Push to GitHub

```bash
cd /path/to/ev-charging-system/frontend
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Using Vercel Dashboard**
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. Click "Deploy"

**Option B: Using Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel
```

### 3. Configure Environment Variables

After deployment, go to your project settings:

1. **Settings** → **Environment Variables**
2. Add variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://YOUR_USERNAME.pythonanywhere.com/api`
   - **Environment**: Production, Preview, Development
3. Click **Save**
4. **Redeploy** your application

### 4. Update vercel.json (Already Done)

The `vercel.json` has been updated to:
```json
{
    "env": {
        "NEXT_PUBLIC_API_URL": "https://YOUR_USERNAME.pythonanywhere.com/api"
    }
}
```

**Important**: Replace `YOUR_USERNAME` with your actual PythonAnywhere username before deploying.

### 5. Update Backend CORS

After deploying to Vercel, update your backend's `.env` file on PythonAnywhere:

```env
FRONTEND_URL=https://your-app.vercel.app
```

Then reload your PythonAnywhere web app.

## Your URLs

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://YOUR_USERNAME.pythonanywhere.com/api`

## Deployment Flow

```
Local Development → GitHub → Vercel (Frontend)
                            ↓
                    PythonAnywhere (Backend)
```

## Testing Deployment

1. Visit your Vercel URL
2. Try logging in with: `op_nagdhunga` / `pass123`
3. Test starting and ending a session

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches your Vercel URL
- Reload PythonAnywhere web app after changing `.env`

### API Connection Failed
- Check `NEXT_PUBLIC_API_URL` environment variable in Vercel
- Verify backend is running on PythonAnywhere
- Check PythonAnywhere error logs

### Environment Variables Not Working
- Redeploy after adding environment variables
- Check variable names are exact (case-sensitive)
- Ensure variables are set for correct environment (Production)

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:
- **main branch** → Production deployment
- **other branches** → Preview deployments

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update backend `FRONTEND_URL` to your custom domain
