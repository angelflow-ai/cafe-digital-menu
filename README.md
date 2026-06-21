# The Infusion Saga ☕

A full-stack restaurant ordering web application with real-time order management, customer menu browsing, and admin order control.

## ✨ Features

### Customer App
- ✅ Browse 64+ menu items organized by categories
- ✅ View item details with multiple sizes and dynamic pricing
- ✅ Add items to cart with quantity control
- ✅ Place orders with table number and customer info
- ✅ Real-time menu updates

### Admin Panel
- ✅ Secure login with session authentication
- ✅ View all orders in real-time
- ✅ Update order status (new → preparing → ready → completed)
- ✅ Manage menu items (create, edit, delete)
- ✅ Manage categories
- ✅ Upload and manage product images

### Backend API
- ✅ RESTful API with Express.js
- ✅ Session-based authentication
- ✅ In-memory or MongoDB database support
- ✅ File uploads for menu item photos
- ✅ CORS enabled for cross-origin requests

## 🏗️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express, MongoDB (optional), Multer
- **Styling:** Tailwind CSS with Glass Morphism design
- **Icons:** Lucide React

## 📁 Project Structure

```
create-a-full-stack-restaurant-web/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── main.jsx        # Main app component
│   │   └── styles.css      # Tailwind styles
│   ├── public/
│   │   └── assets/         # Menu item images
│   ├── src/assets/infusion-saga-logo.png  # App logo
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                  # Express backend
│   ├── src/
│   │   ├── index.js        # Server entry point
│   │   ├── db.js           # Database logic
│   │   └── seed.js         # Initial data
│   ├── uploads/            # Uploaded images
│   ├── package.json
│   └── .env.example
├── package.json            # Root workspace
├── netlify.toml            # Netlify deployment config
├── .env.example            # Environment variables template
├── DEPLOY.md               # Detailed deployment guide
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ installed
- npm or yarn

### 1. Install All Dependencies

```bash
npm run install:all
```

This installs dependencies for root, backend, and frontend.

### 2. Run Locally

```bash
npm run dev
```

This starts both server and client simultaneously using `concurrently`.

**Or run them separately:**
```bash
npm run server  # Terminal 1 - Backend on port 4000
npm run client  # Terminal 2 - Frontend on port 5173
```

### 3. Access the Application

- **Customer App:** http://localhost:5173
- **Owner Panel:** http://localhost:5173/owner
- **API Base:** http://localhost:4000/api

### 4. Admin Login

- **Email:** `admin@theinfusionsaga.com`
- **Password:** `infusion-admin`

## 🔌 API Endpoints

### Public Endpoints
```
GET    /api/categories      # Get all menu categories
GET    /api/menu            # Get all menu items
POST   /api/orders          # Create new order
```

### Admin Endpoints (Authentication Required)
```
GET    /api/auth/me         # Check admin session
POST   /api/auth/login      # Login to admin panel
POST   /api/auth/logout     # Logout from admin

GET    /api/orders          # Get all orders
GET    /api/orders/:id      # Get single order
PATCH  /api/orders/:id      # Update order status
DELETE /api/orders/:id      # Delete order

GET    /api/menu/:id        # Get single menu item
POST   /api/menu            # Create/update menu item
DELETE /api/menu/:id        # Delete menu item

POST   /api/categories      # Create category
DELETE /api/categories/:id  # Delete category

POST   /api/uploads         # Upload menu item photo
```

## 🔐 Environment Variables

### Frontend (.env or .env.local in client/)
```
VITE_API_URL=http://localhost:4000
```

### Backend (.env in server/)
```
# Required
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
PORT=4000
SESSION_SECRET=your-super-secret-key

# Admin Credentials
ADMIN_EMAIL=admin@theinfusionsaga.com
ADMIN_PASSWORD=infusion-admin

# CORS Configuration
CLIENT_ORIGIN=http://localhost:5173

# Environment
NODE_ENV=development
```

See `.env.example` files for templates.

## 💾 Database Options

### Option 1: In-Memory (Default, Development)
- No setup required
- Data resets on server restart
- Perfect for development and testing

### Option 2: MongoDB (Production)
1. Create free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user
3. Get connection string
4. Add to `MONGODB_URI` in `.env`
5. Server will auto-seed initial data

## 🌐 Deployment

For complete deployment instructions, see [DEPLOY.md](./DEPLOY.md)

**Quick Deployment:**

1. **Frontend → Netlify**
   - Build: `npm run build --prefix client`
   - Publish: `client/dist` folder
   - Add env: `VITE_API_URL=<backend-url>`

2. **Backend → Render/Railway/Heroku**
   - Connect GitHub repo
   - Set start command: `cd server && npm start`
   - Add environment variables
   - Deploy!

3. **Database → MongoDB Atlas**
   - Create cloud cluster
   - Add to backend env vars

## 🎨 Features in Detail

### Menu Categories
- Hot Drinks (Chai, Coffee, Tea)
- Cold Drinks (Cold Coffee, Mojito, Ice Tea)
- Snacks (Burger, Fries, Maggi, Noodles)
- Desserts (Ice Cream, Brownies)

### Menu Items
64+ items with:
- Multiple size options
- Dynamic pricing per size
- Product images
- Descriptions
- Featured items support

### Order Management
- Track order status in real-time
- Customer name, phone, table number
- Itemized breakdown with pricing
- Status workflow: new → preparing → ready → completed → cancelled

### Admin Dashboard
- One-click status updates
- Real-time order list
- Item management with bulk actions
- Category management

## 🛠️ Available Scripts

```bash
# Root directory
npm run dev          # Start both server & client
npm start            # Alias for npm run dev
npm run server       # Start backend only
npm run client       # Start frontend only
npm run install:all  # Install all dependencies
npm run build        # Build frontend for production

# Client only
cd client && npm run dev      # Dev server
cd client && npm run build    # Production build
cd client && npm run preview  # Preview production build

# Server only
cd server && npm run dev      # Dev server with file watching
cd server && npm start        # Production server
```

## 📱 Image Uploads

Menu item photos are:
- Uploaded to `server/uploads/`
- Served at `http://localhost:4000/uploads/`
- Accessible via API endpoints

## ⚠️ Security Considerations

**Development:**
- Default admin credentials are fine
- In-memory database is OK

**Production:**
- Change default admin credentials immediately
- Use strong, random `SESSION_SECRET`
- Enable HTTPS on both frontend and backend
- Validate and sanitize all inputs
- Implement rate limiting
- Use environment variables for ALL sensitive data
- Enable CORS only for your domain
- Add CSRF protection if needed

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Menu not loading | Check backend is running: `npm run server` |
| API connection refused | Ensure server port 4000 is available |
| Admin login fails | Verify credentials in `.env` |
| CORS errors | Check `CLIENT_ORIGIN` matches frontend URL |
| Orders not saving | Setup MongoDB - without it, data resets on restart |
| Build fails | Run `npm install`, ensure Node.js v16+ |
| Favicon not showing | Hard refresh browser (Ctrl+Shift+R) |

## 🚀 Future Enhancements

- 📱 SMS notifications when order is ready
- 📊 Admin analytics dashboard
- 💳 Payment gateway integration
- 🗺️ Table management system
- ⭐ Customer ratings and reviews
- 🔔 Push notifications
- 👥 Multi-admin support
- 📝 Order history for customers

## 📝 Default Menu Data

Server includes 64 pre-loaded menu items:

**Hot Drinks:** Cutting Chai, Regular Chai, Strong Kadak Chai, Black Tea, Lemon Tea, Masala Chai, Adrak Chai, Elaichi Chai, Ginger Lemon Chai, Tulsi Chai, Honey Lemon Tea, Green Tea, Classic Coffee, Strong Coffee, Hazelnut Coffee, Chocolate Coffee, Vanilla Coffee

**Cold Drinks:** Classic Cold Coffee, Strong Cold Coffee, Hazelnut Cold Coffee, Caramel Cold Coffee, Mocha Cold Coffee, Classic Mojito, Classic Mint Mojito, Green Apple Mojito, Cold Coffee Crush, Ice Crusher, Ice Tea

**Snacks:** Classic Burger, Cheese Burger, French Fries, Cheese Fries, Chilli Potato, Honey Chilli Potato, Maggi, Cheese Maggi, Garlic Noodles, Hakka Noodles, Sandwich

**Desserts:** Classic Ice-Cream, American Nuts Ice-Cream, Brownie Ice-Cream, Butterscotch Ice-Cream

See `server/src/seed.js` for complete menu with prices and images.

## 📞 Support

For issues:
1. Check browser console (F12) for errors
2. Check server terminal logs
3. Verify all environment variables are set
4. See DEPLOY.md for deployment-specific issues
5. Clear browser cookies if admin features not working

## 📄 License

MIT License - Feel free to use and modify!

---

**Made with ☕ by The Infusion Saga Team**
ADMIN_PASSWORD=strong-password
CLIENT_ORIGIN=https://your-domain.com
```

## Notes

The menu seed uses the requested categories and includes the explicitly supplied size-pricing example, `Classic Coffee - Rs. 38 / 48 / 58`. Since no full earlier price list was available in this thread, the remaining seed menu is editable in the admin panel.
