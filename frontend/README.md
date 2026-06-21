# AgriFusion — Frontend

The React client for AgriFusion — a marketplace connecting farmers directly with consumers. Built with **React 19**, **Vite**, **Tailwind CSS**, and **React Router 7**.

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React 19 + Vite |
| Routing | react-router-dom v7 |
| Styling | Tailwind CSS |
| HTTP client | Axios (with auth + token-refresh interceptors) |
| Real-time chat | socket.io-client |
| Payments UI | @stripe/react-stripe-js, @stripe/stripe-js |
| Maps | react-leaflet + Leaflet (OpenStreetMap tiles) |
| Charts | chart.js + react-chartjs-2 |
| Icons | lucide-react |

## Project Structure

```
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── vercel.json                # SPA rewrite rule for Vercel deploys
└── src/
    ├── main.jsx                # React root
    ├── App.jsx                 # Router setup, auth state, protected routes
    ├── api.js                   # Axios instance: attaches JWT, auto-refreshes on 401
    └── components/
        ├── Home.jsx
        ├── About.jsx
        ├── Login.jsx / Register.jsx
        ├── Dashboard.jsx                  # Role-aware landing dashboard
        ├── Products.jsx                   # Browse/search crop listings
        ├── MyProducts.jsx / EditProduct.jsx  # Farmer: manage own listings
        ├── Cart.jsx / CheckoutForm.jsx     # Cart + Stripe Elements checkout
        ├── Orders.jsx                       # Order history (customer/farmer views)
        ├── Inbox.jsx / Chat.jsx            # Conversation list + live chat (Socket.io)
        ├── NearbyFarmersMap.jsx            # Leaflet map of farmer/crop locations
        ├── AdminDashboard.jsx              # Admin analytics, user moderation, disputes
        ├── Layout.jsx                       # Nav/shell wrapping all pages
        ├── OnboardingTour.jsx              # First-run guided tour
        ├── Toast.jsx                        # Toast notification provider
        └── shared/                          # Shared UI primitives
```

## Getting Started

### Prerequisites
- Node.js 18+
- The [backend API](../backend) running locally or deployed

### Install

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file in `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
```

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | No (defaults to the deployed Render API) | Base URL for REST calls |
| `VITE_SOCKET_URL` | No (defaults to `http://localhost:4000`) | Socket.io server URL for live chat |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes (for checkout) | Stripe **publishable** key — used client-side, safe to expose |

### Run

```bash
npm run dev        # starts Vite dev server (default: http://localhost:5173)
npm run build       # production build to dist/
npm run preview     # preview the production build locally
npm run lint        # run ESLint
```

## Routing & Access Control

Routes are defined in `App.jsx`. Public pages (`/`, `/about`, `/products`, `/nearby`) are open to everyone; everything else checks `user` and `user.role` before rendering, redirecting to `/login` otherwise:

| Path | Access |
|---|---|
| `/dashboard` | Any logged-in user |
| `/cart` | Customers |
| `/my-products`, `/products/edit/:id` | Farmers |
| `/admin` | Admins |
| `/inbox`, `/chat/:otherParticipantId`, `/orders` | Any logged-in user |

This is a **UX convenience layer only** — the backend independently enforces the same rules on every API call, so these guards aren't the actual security boundary.

## Auth & API Client (`api.js`)

- The access token (JWT) is attached to every request via an Axios request interceptor, read from `localStorage`.
- A response interceptor catches `401`s, calls `/auth/refresh` (which relies on the httpOnly refresh-token cookie), stores the new access token, and retries the original request — so users stay logged in across the 15-minute access-token lifetime without re-entering credentials.
- If the refresh call itself fails, the user is logged out and redirected to `/login`.

## Real-Time Chat

`Chat.jsx` fetches message history over REST, then opens a `socket.io-client` connection, joins a room named after the chat ID, and listens for `message` events broadcast by the backend whenever a new message is sent via `POST /chat/send`.

## Payments

`Cart.jsx` initializes Stripe via `loadStripe(VITE_STRIPE_PUBLISHABLE_KEY)` and wraps `CheckoutForm.jsx` in Stripe's `<Elements>` provider. `CheckoutForm.jsx`:
1. Calls the backend to create a PaymentIntent for the current cart total.
2. Confirms the card payment client-side with `stripe.confirmCardPayment`.
3. On success, calls `/cart/buy` with the `paymentIntentId` so the backend can verify the charge and create the order(s).

> For local testing, use Stripe's test card `4242 4242 4242 4242` with any future expiry date and any CVV.

## Maps

`NearbyFarmersMap.jsx` uses `react-leaflet` with free OpenStreetMap tiles (no API key required) to plot farmer/crop locations fetched from `/farmers/nearby`, and centers on the browser's geolocation when permission is granted.

## License

No license file is currently included in this repository.
