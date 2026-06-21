# 🌾 AgriFusion

AgriFusion is a full-stack marketplace that connects farmers directly with consumers — cutting out middlemen, giving farmers fairer prices, and giving consumers fresher produce at lower cost. Originally built during the **IgnitionHack 2025** hackathon.

**Live demo:** [agri-fusion.vercel.app](https://agri-fusion.vercel.app)

## What It Does

- 👨‍🌾 Farmers list crops directly and reach a nationwide network of buyers.
- 🛒 Consumers browse and buy straight from the producer — transparent, farmer-set pricing.
- 💬 Built-in real-time chat for farmers and consumers to negotiate and coordinate.
- 🗺️ A map view for discovering nearby farmers/crop locations.
- 💳 Stripe-powered checkout, with multi-farmer carts automatically split into one order per farmer.
- ⚖️ A dispute-resolution flow and an admin dashboard for platform moderation and analytics.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router 7 |
| Backend | Node.js, Express 5 |
| Database | MongoDB / Mongoose |
| Auth | JWT access tokens + rotating refresh tokens, bcrypt password hashing |
| Real-time | Socket.io |
| Payments | Stripe |
| Maps | Leaflet + OpenStreetMap |
| Charts | Chart.js |

## Repository Structure

```
AgriFusion/
├── backend/         # Express API, MongoDB models, auth, Socket.io, Stripe — see backend/README.md
├── frontend/         # React + Vite client app — see frontend/README.md
├── assets/           # india_crop_locations.csv — sample data for the "nearby farmers" map
└── .github/workflows/  # CI configuration
```

See **[`backend/README.md`](./backend/README.md)** and **[`frontend/README.md`](./frontend/README.md)** for setup details specific to each half of the stack.

## Quick Start (run both locally)

### 1. Clone the repo
```bash
git clone https://github.com/simmi-verma/AgriFusion.git
cd AgriFusion
```

### 2. Start the backend
```bash
cd backend
npm install
# create a .env file — see backend/README.md for the full list of variables
npm run dev
```
The API runs on `http://localhost:4000` by default.

### 3. Start the frontend
```bash
cd ../frontend
npm install
# create a .env file — see frontend/README.md for the full list of variables
npm run dev
```
The app runs on `http://localhost:5173` by default and talks to the backend via `VITE_API_BASE_URL`.

### 4. (Optional) Seed demo data
From `backend/`:
```bash
node createAdmin.js     # admin@agrifusion.com / adminsecure123
node seedProducts.js    # farmer@agrifusion.com / password123 + sample listings
node importFarmers.js   # populates the "nearby farmers" map data
```
Change these default credentials before deploying anywhere public.

## Architecture at a Glance

```
React (Vite, Vercel)  ──REST──>  Express API (Render)  ──>  MongoDB
        │                              │
        └────── Socket.io (live chat) ─┘
                              │
                           Stripe (payments)
```

- The frontend and backend are deployed independently (frontend on Vercel, backend on a service like Render), so CORS is explicitly configured with an origin allow-list in `backend/index.js`.
- Auth uses short-lived (15 min) JWT access tokens plus a 7-day refresh token stored in an httpOnly cookie and rotated on each use, so sessions persist without needing the access token to live long enough to be a major security liability if leaked.
- Each authenticated request re-checks the user's status in MongoDB (role, suspension), so admin actions like suspending a user take effect immediately rather than waiting for an existing token to expire.


## Team

Built with ❤️ at IgnitionHack 2025 by a team of passionate developers, including [Rakesh Kushwaha](https://github.com/rakeshkushwaha332).

## License

No license file is currently included in this repository.
