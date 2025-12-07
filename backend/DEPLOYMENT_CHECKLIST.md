# Quick Deployment Checklist for PythonAnywhere

## Before You Start
- [ ] PythonAnywhere account created
- [ ] Code ready in repository or local files

## Deployment Steps

### 1. Upload Code
- [ ] Clone repository or upload files to `/home/YOUR_USERNAME/ev-charging-backend/`

### 2. Setup Environment
```bash
cd ~/ev-charging-backend
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Environment
- [ ] Create `.env` file (copy from `.env.example`)
- [ ] Generate JWT secret: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`
- [ ] Update `FRONTEND_URL` with your Vercel URL

### 4. Initialize Database
```bash
source venv/bin/activate
python seed_users.py
python seed_vehicle_models.py  # Optional
```

### 5. Configure Web App
- [ ] Go to Web tab → Add new web app
- [ ] Choose Manual configuration → Python 3.10
- [ ] Set Virtualenv: `/home/YOUR_USERNAME/ev-charging-backend/venv`
- [ ] Edit WSGI file (replace YOUR_USERNAME in wsgi.py)
- [ ] Reload web app

### 6. Test Deployment
- [ ] Test login: `curl -X POST https://YOUR_USERNAME.pythonanywhere.com/api/login -H "Content-Type: application/json" -d '{"username":"op_nagdhunga","password":"pass123"}'`
- [ ] Check error logs if issues occur

### 7. Update Frontend
- [ ] Update Vercel environment variable: `NEXT_PUBLIC_API_URL=https://YOUR_USERNAME.pythonanywhere.com/api`
- [ ] Redeploy frontend

## Your URLs
- **Backend API**: `https://YOUR_USERNAME.pythonanywhere.com/api`
- **Frontend**: `https://your-app.vercel.app`

## Default Credentials
- **Operator (Nagdhunga)**: `op_nagdhunga` / `pass123`
- **Operator (Jamune)**: `op_jamune` / `pass123`
- **Manager**: `manager` / `admin123`

## Troubleshooting
- Check error logs in Web tab
- Verify paths in WSGI file
- Ensure virtual environment is activated
- Check `.env` file exists and has correct values
