# CivicFix — Civic Issue Reporting System

A modern MERN application for citizens to report local issues and follow them through resolution. The included UI has a landing page, citizen dashboard, complaint workflow, timeline, notifications, search, charts, and responsive layouts. The API provides JWT auth, role-based complaint management, admin status updates, and dashboard summaries.

## Project structure

```text
civic/
|-- frontend/               React and Vite frontend
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   `-- index.css
|   |-- public/
|   |-- .env.example
|   |-- index.html
|   |-- package.json
|   `-- vercel.json
|-- backend/                Express and MongoDB API
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- uploads/
|   |-- .env.example
|   |-- package.json
|   `-- server.js
|-- .gitignore
|-- package.json            Workspace commands
|-- render.yaml             Render deployment
`-- README.md
```

## Run locally

Requirements: Node.js 20+, npm, and MongoDB.

```bash
npm run install:all
copy backend\.env.example backend\.env
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:5000/api`; `GET /api/health` is the health check.

If MongoDB is not running, the API stays online in demo mode and the frontend
remains fully viewable. Start MongoDB or add a MongoDB Atlas URI to `backend/.env`
to enable registration and persistent complaint data.

## API

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET/PUT | `/api/auth/me` | Authenticated |
| GET/POST | `/api/complaints` | Authenticated |
| GET/PUT/DELETE | `/api/complaints/:id` | Owner or admin |
| GET | `/api/complaints/admin/summary` | Admin |

Send the JWT as `Authorization: Bearer <token>`.

Full endpoint documentation is available in `API.md`.

## Tests and sample data

Run backend model tests with `npm test --prefix backend`. To create the standard departments and an optional administrator, configure `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, then run `npm run seed --prefix backend`.

## Production

Build the frontend with `npm run build` and deploy `frontend/dist` to Vercel. Deploy `backend` to Render with `npm start`, provide the variables in `backend/.env.example`, and use a MongoDB Atlas connection string. Set `CLIENT_URL` to the deployed frontend origin.

Use `frontend` as the Vercel root directory and set `VITE_API_URL` to the deployed API URL ending in `/api`. Render reads the root `render.yaml`; configure all variables marked `sync: false` in the Render dashboard.

Never commit `backend/.env`. In production, the API requires `JWT_SECRET`. Configure Cloudinary before enabling image uploads for users.
