# AgriFusion — Backend

REST + real-time API server for AgriFusion, a marketplace that connects farmers directly with consumers. Built with **Express 5**, **MongoDB/Mongoose**, **Socket.io**, and **Stripe**.

## Tech Stack

| Concern | Library |
|---|---|
| HTTP server | Express 5 |
| Database / ODM | MongoDB, Mongoose |
| Auth | JSON Web Tokens (`jsonwebtoken`), `bcrypt` for password hashing |
| Real-time chat | Socket.io |
| Payments | Stripe |
| Validation | express-validator |
| Security headers | Helmet |
| Rate limiting | express-rate-limit |
| CSV ingestion | csv-parser |

## Project Structure

```
backend/
├── index.js                  # App entry point: middleware, CORS, Socket.io, route mounting
├── config/
│   └── db.js                 # Mongoose connection
├── middleware/
│   ├── verifyToken.js        # JWT auth + role-based access control
│   └── rateLimiter.js        # Global + auth-specific rate limiters
├── models/
│   ├── User.js                # Farmers, customers, admins
│   ├── Product.js             # Crop listings
│   ├── Cart.js                 
│   ├── Order.js               
│   ├── Dispute.js             # Order dispute / complaint threads
│   ├── chat.js                 # Chat (conversation) documents
│   ├── Message.js             
│   └── RefreshToken.js        # Refresh tokens with TTL auto-expiry
├── routes/
│   ├── auth.routes.js         # register / login / refresh / logout / me
│   ├── product.routes.js      # CRUD for crop listings
│   ├── cart.routes.js         # cart + checkout (splits multi-farmer carts into per-farmer orders)
│   ├── order.routes.js        # order history (customer + farmer views)
│   ├── payment.routes.js      # Stripe PaymentIntent creation
│   ├── chat.routes.js         # conversations + messages
│   ├── farmer.routes.js       # farmer directory + CSV-based "nearby farmers"
│   └── admin.routes.js        # admin dashboard, disputes, user moderation
├── sockets/
│   └── chatSocket.js          # Socket.io room join/broadcast logic
├── utils/
│   ├── authorize.js           # ownership/admin authorization helper
│   └── csvParser.js           # parses india_crop_locations.csv into farmer coordinates
├── validators/
│   └── index.js               # express-validator chains for register/login/product
├── createAdmin.js             # one-off script: seed an admin account
├── importFarmers.js           # one-off script: import CSV into the Farmer collection
└── seedProducts.js            # one-off script: seed a demo farmer + sample products
```

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Stripe](https://stripe.com) account (test mode keys are fine for local dev)

### Install

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in `backend/`:

```env
# Server
PORT=4000
NODE_ENV=development

# Database
MONGO_URL=mongodb://127.0.0.1:27017/agrifusion

# Auth
JWT_SECRET=your-long-random-secret

# Payments
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx

# CORS — set this to your deployed frontend URL in production
FRONTEND_URL=https://your-frontend.vercel.app
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default `4000`) | Port the API listens on |
| `NODE_ENV` | No | `production` enables stricter CORS, lower rate limits, and secure cookies |
| `MONGO_URL` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign/verify access tokens |
| `STRIPE_SECRET_KEY` | Yes (for checkout) | Stripe secret key |
| `FRONTEND_URL` | Recommended in production | Added to the CORS allow-list |

### Run

```bash
npm run dev     # nodemon, auto-restart on file changes
# or
npm start       # plain node
```

The API will be available at `http://localhost:4000`.

### Seed Data (optional, run once after connecting to a fresh database)

```bash
node createAdmin.js       # creates admin@agrifusion.com / adminsecure123
node seedProducts.js      # creates farmer@agrifusion.com / password123 + 4 sample products
node importFarmers.js     # imports backend/india_crop_locations.csv into the Farmer collection
```

> ⚠️ Change the seeded admin/farmer passwords before deploying anywhere public.

## API Overview

All routes are mounted under `/api`. Most endpoints require an `Authorization: Bearer <token>` header (or the `token` cookie); role-restricted routes are noted below.

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create a customer or farmer account |
| POST | `/login` | — | Returns a 15-min access token + sets an httpOnly refresh-token cookie |
| POST | `/refresh` | refresh cookie | Rotates the refresh token, returns a new access token |
| POST | `/logout` | — | Revokes the refresh token, clears cookies |
| GET | `/me` | ✔ | Returns the logged-in user's profile |

### Products — `/api/products`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List all products |
| POST | `/` | farmer | Create a listing |
| PUT | `/:id` | owner farmer or admin | Edit a listing |
| DELETE | `/:id` | owner farmer or admin | Delete a listing |

### Cart & Checkout — `/api/cart`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | customer | Get current cart |
| POST | `/add/:productId` | customer | Add item to cart |
| POST | `/remove/:productId` | customer | Remove item from cart |
| POST | `/buy` | customer | Verify payment, split cart into per-farmer Orders, clear cart |

### Orders — `/api`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/orders` | customer/admin | Order history for the logged-in customer |
| GET | `/orders/farmer` | farmer | Orders containing the logged-in farmer's products |

### Payments — `/api/payment`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/create-payment-intent` | customer | Creates a Stripe PaymentIntent for the current cart total |

### Chat — `/api/chat`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/conversations` | ✔ | List the user's conversations |
| GET | `/:otherParticipantId` | ✔ | Get/create a chat with another user + message history |
| POST | `/send` | ✔ | Send a message (persists + broadcasts via Socket.io) |
| DELETE | `/:chatId` | ✔ (participant only) | Delete a conversation |

### Farmers — `/api/farmers`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List registered farmers |
| GET | `/nearby` | — | Crop/location data parsed from the bundled CSV (for the map view) |

### Admin & Disputes — `/api`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/disputes/create` | customer/farmer | Open a dispute on an order |
| GET | `/admin/analytics` | admin | Revenue, user counts, listing trends, order data |
| GET | `/admin/users` | admin | List all users |
| POST | `/admin/users/:id/suspend` | admin | Toggle suspension (revokes refresh tokens) |
| POST | `/admin/users/:id/verify-farmer` | admin | Toggle a farmer's verified badge |
| GET | `/admin/disputes` | admin | List dispute threads |
| POST | `/admin/disputes/:id/resolve` | admin | Mark a dispute resolved |
| POST | `/admin/disputes/:id/message` | admin | Reply in a dispute thread |

## Auth Design Notes

- **Access tokens** are short-lived JWTs (15 min) carrying `id`, `name`, and `role`.
- **Refresh tokens** are opaque random strings stored in MongoDB with a TTL index, set as an httpOnly cookie, and rotated on every refresh — so they can be individually revoked (e.g. on admin suspension) without needing a JWT blocklist.
- `verifyToken` re-fetches the user from the database on every request (rather than trusting the JWT payload alone) so suspensions and role changes take effect immediately.

## Known Limitations / Things to Harden Before Production

- Stripe payment verification in `cart.routes.js` is currently gated on the secret key prefix (`sk_test_`) so the demo works without a live Stripe account — in production this check should run for any `paymentIntentId`, not be skipped for live keys.
- `chat.routes.js`'s `/send` endpoint and `chatSocket.js`'s `joinChat` don't verify the caller is an actual participant of the given chat/room.
- Dispute creation trusts `order.customerId` rather than asserting `req.user.id` is the order's owner.

## License

No license file is currently included in this repository.
