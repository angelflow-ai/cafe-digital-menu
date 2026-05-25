# The Infusion Saga - Deployment Guide

## Quick Start (Local)

```bash
# Install all dependencies
npm run install:all

# Run both server & client
npm run dev

# Or run separately
npm run server  # Terminal 1
npm run client  # Terminal 2
```

**Access:**
- Customer App: http://localhost:5173
- Admin Panel: http://localhost:5173/admin (admin@theinfusionsaga.com / infusion-admin)
- API: http://localhost:4000/api

---

## Production Setup

### Step 1: Frontend on Netlify

1. **Build the client:**
   ```bash
   npm run build --prefix client
   ```

2. **Create Netlify account** and connect GitHub repo (or deploy manually)

3. **Set build command:** `npm run build --prefix client`
4. **Set publish directory:** `client/dist`

5. **Add Environment Variable:**
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url.com/api`

6. **Deploy** (auto-deploys on push to main)

---

### Step 2: Backend on Render/Railway/Heroku

#### Option A: Render (Recommended)

1. Create account on [render.com](https://render.com)
2. Create **New > Web Service**
3. Connect GitHub repo
4. **Build Command:** `npm install && npm install --prefix server`
5. **Start Command:** `cd server && npm start`
6. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=4000
   MONGODB_URI=<your-mongodb-uri>
   SESSION_SECRET=<generate-random-string>
   ADMIN_EMAIL=admin@theinfusionsaga.com
   ADMIN_PASSWORD=<strong-password>
   CLIENT_ORIGIN=https://your-frontend.netlify.app
   ```
7. Deploy!

#### Option B: Railway

1. Create account on [railway.app](https://railway.app)
2. Import GitHub repo
3. Add **Node.js** service
4. Set root directory to `server`
5. Add same environment variables
6. Deploy!

---

## Environment Variables Reference

### Client (.env for development)
```
VITE_API_URL=http://localhost:4000/api
```

### Server (.env)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
PORT=4000
SESSION_SECRET=very-secret-key
ADMIN_EMAIL=admin@theinfusionsaga.com
ADMIN_PASSWORD=secure-password
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

---

## MongoDB Setup

1. Create free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user with strong password
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
4. Add to backend environment variables

---

## Verify Everything Works

### Local Test:
```bash
curl http://localhost:4000/api/categories
curl http://localhost:4000/api/menu
```

### Production Test:
```bash
curl https://your-backend.onrender.com/api/categories
```

### Features to Test:
- ✅ Customer app loads menu
- ✅ Admin login works
- ✅ Create order on customer app
- ✅ View order in admin panel
- ✅ Update order status → SMS sends (if configured)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Check `CLIENT_ORIGIN` in backend |
| API 401 errors | Check session cookies, admin login required |
| Menu not loading | Verify `VITE_API_URL` points to correct backend |
| MongoDB connection fails | Check connection string and IP whitelist |

---

## SMS Integration (Optional - Future)

When ready, add Twilio:
1. Create Twilio account
2. Add to server `.env`: `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_PHONE`
3. Update order status handler to send SMS

---

## Support

For issues, check:
- Server logs: `npm run server`
- Browser console: F12
- Network tab: Check API responses
