# PythonAnywhere Deployment Guide

## Prerequisites

1. **PythonAnywhere Account**: Sign up at https://www.pythonanywhere.com
2. **Account Type**: Free tier works, but paid accounts get better performance
3. **Python Version**: Python 3.10 or higher

## Step-by-Step Deployment

### 1. Upload Your Code

**Option A: Using Git (Recommended)**
```bash
# On PythonAnywhere Bash console
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO/backend
```

**Option B: Upload Files**
- Use PythonAnywhere's "Files" tab
- Upload all backend files to `/home/YOUR_USERNAME/ev-charging-backend/`

### 2. Create Virtual Environment

```bash
# In PythonAnywhere Bash console
cd ~/ev-charging-backend
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Set Up Environment Variables

Create `.env` file in your backend directory:

```bash
nano .env
```

Add the following (replace with your values):

```env
# Database - Use SQLite for free tier
DATABASE_URL=

# JWT Secret - Generate a strong random key
JWT_SECRET_KEY=your-super-secret-random-key-here

# Flask
FLASK_ENV=production
FLASK_DEBUG=False

# CORS - Your Vercel frontend URL
FRONTEND_URL=https://your-app.vercel.app
```

**Generate a secure JWT secret:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 4. Initialize Database

```bash
# In PythonAnywhere Bash console
source venv/bin/activate
python seed_users.py
python seed_vehicle_models.py  # Optional: seed vehicle data
```

### 5. Configure Web App

1. Go to **Web** tab in PythonAnywhere
2. Click **Add a new web app**
3. Choose **Manual configuration**
4. Select **Python 3.10**

### 6. Configure WSGI File

1. In the **Web** tab, click on the WSGI configuration file link
2. Delete all content and replace with the content from `wsgi.py` (see below)
3. Update paths to match your username

### 7. Set Virtual Environment Path

In the **Web** tab:
- **Virtualenv** section: `/home/YOUR_USERNAME/ev-charging-backend/venv`

### 8. Configure Static Files (Optional)

Not needed for API-only backend, but if you add static files:
- URL: `/static/`
- Directory: `/home/YOUR_USERNAME/ev-charging-backend/static/`

### 9. Reload Web App

Click the green **Reload** button in the Web tab

## Testing Your Deployment

### Test the API

```bash
# Test health endpoint
curl https://YOUR_USERNAME.pythonanywhere.com/api/login

# Test login
curl -X POST https://YOUR_USERNAME.pythonanywhere.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"op_nagdhunga","password":"pass123"}'
```

### Your API URL

Your backend will be available at:
```
https://YOUR_USERNAME.pythonanywhere.com/api
```

## Update Frontend Configuration

Update your frontend's API URL:

**In Vercel Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://YOUR_USERNAME.pythonanywhere.com/api
```

**Or in `lib/api.ts`:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://YOUR_USERNAME.pythonanywhere.com/api';
```

## Troubleshooting

### Check Error Logs

1. Go to **Web** tab
2. Click on **Error log** link
3. Check for any errors

### Common Issues

**1. Import Errors**
- Make sure virtual environment is activated
- Check that all dependencies are installed: `pip list`

**2. Database Errors**
- Ensure database file has write permissions
- Check that `db.create_all()` ran successfully

**3. CORS Errors**
- Verify `FRONTEND_URL` in `.env` matches your Vercel URL
- Check CORS configuration in `app.py`

**4. 502 Bad Gateway**
- Check WSGI file configuration
- Verify paths are correct
- Check error logs

### Viewing Logs

```bash
# In Bash console
tail -f /var/log/YOUR_USERNAME.pythonanywhere.com.error.log
tail -f /var/log/YOUR_USERNAME.pythonanywhere.com.server.log
```

## Database Management

### SQLite (Free Tier)

Database file location: `/home/YOUR_USERNAME/ev-charging-backend/charging_station.db`

**Backup database:**
```bash
cp charging_station.db charging_station.db.backup
```

**Access database:**
```bash
sqlite3 charging_station.db
.tables
SELECT * FROM user;
.quit
```

### MySQL (Paid Tier)

If you upgrade to a paid account, you can use MySQL:

1. Create MySQL database in PythonAnywhere
2. Update `.env`:
   ```
   DATABASE_URL=mysql://YOUR_USERNAME:PASSWORD@YOUR_USERNAME.mysql.pythonanywhere-services.com/YOUR_USERNAME$dbname
   ```
3. Install MySQL driver:
   ```bash
   pip install mysqlclient
   ```

## Maintenance

### Update Code

```bash
cd ~/ev-charging-backend
git pull origin main
source venv/bin/activate
pip install -r requirements.txt  # If requirements changed
# Reload web app from Web tab
```

### Monitor Usage

- Check **Web** tab for request statistics
- Free tier: 100,000 requests/day
- Monitor CPU seconds usage

## Security Checklist

- ✅ Change `JWT_SECRET_KEY` from default
- ✅ Set `FLASK_DEBUG=False` in production
- ✅ Use HTTPS (automatic on PythonAnywhere)
- ✅ Configure CORS to only allow your frontend domain
- ✅ Keep dependencies updated
- ✅ Regular database backups

## Free Tier Limitations

- **CPU seconds**: 100 seconds/day
- **Disk space**: 512 MB
- **Bandwidth**: Limited
- **Always-on tasks**: Not available
- **Custom domains**: Not available (use pythonanywhere.com subdomain)

For production use, consider upgrading to a paid plan.

## Support

- PythonAnywhere Forums: https://www.pythonanywhere.com/forums/
- Documentation: https://help.pythonanywhere.com/
- Contact: support@pythonanywhere.com
