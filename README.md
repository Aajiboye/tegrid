# TradeExpertGrid Server

TradeExpertGrid® connects homeowners and businesses with vetted and trusted local skilled professionals (e.g., plumbers, electricians, builders). This repository contains the NestJS server powering the API used by clients and service providers to browse, book, manage job requests, process payments, access training, and get support — all from one interface.

Key features

- Browse and search vetted local professionals
- Real-time booking and job request management
- Payment and payouts integration
- Training and support resources
- Administrative APIs for providers and clients
- Health and monitoring endpoints (suggested)

Quick start (development)

1. Install dependencies:

```bash
npm install
```

2. Create a .env or export environment variables required by the app. At minimum set:

- PORT (optional, defaults to 8080)
- MONGODB_CONNECTION_STRING (required for DB access)

Example .env:

```env
PORT=8080
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/trade_expert_grid
```

3. Start dev server:

```bash
npm run start:dev
```

4. API docs (Swagger): http://localhost:PORT/api-docs

Notes

- The server logs MongoDB connection success or error during startup (look for "MongoDB connected successfully").
- The config loader is in `src/config/config.ts`. Sensitive values (like DB URIs) should be provided via environment variables.
- A `/db-health` endpoint is available to check the Mongoose connection `readyState` for easy monitoring.

Development

- Build: `npm run build`
- Start (production): `npm start`

Contributing

This is a scaffold; feel free to open issues or submit PRs to add features, tests, and CI.
# trade-expert-grid-server

Minimal NestJS server scaffolded by assistant.

Try it:

```bash
npm install
npm run start:dev
# then visit http://localhost:3000
```
