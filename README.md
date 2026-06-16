# Production Manager Portal

A MERN stack web application for tracking daily production data. Production Managers can create product sheets and enter data; Viewers have read-only access with single-device session enforcement.

## Tech Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS 3, React Router v6, Axios
- **Backend:** Node.js, Express 4, MongoDB (Mongoose 8), JWT, bcryptjs
- **Hosting:** Cloudflare Pages (frontend) + separate Node backend (Railway, Render, etc.)

## Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

## Quick Start

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
npm install
npm run dev
```

Server runs at `http://localhost:5000`.

### 2. Frontend

```bash
cd client
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

App runs at `http://localhost:5173`.



## Environment Variables

### Server (`server/.env`)

```
MONGO_URI=mongodb://127.0.0.1:27017/production-portal
JWT_SECRET=your-secret-key
PORT=5000
```

### Client (`client/.env`)

```
VITE_API_URL=http://localhost:5000/api
```

For production, set `VITE_API_URL` to your deployed API URL (e.g. `https://your-api.railway.app/api`).

## Deployment

### Frontend (Cloudflare Pages)

1. Build command: `npm run build`
2. Build output directory: `dist`
3. Root directory: `client`
4. Environment variable: `VITE_API_URL` → your production API URL
5. The `public/_redirects` file enables SPA routing on Cloudflare Pages.

### Backend

Deploy the `server/` folder to Railway, Render, Fly.io, or similar. Set `MONGO_URI`, `JWT_SECRET`, and `PORT` in the platform environment.

## API Overview

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Authenticated |
| GET | `/api/auth/me` | Authenticated |
| GET | `/api/sheets` | Authenticated |
| POST | `/api/sheets` | Manager |
| GET | `/api/sheets/:id` | Authenticated |
| PUT | `/api/sheets/:id` | Manager |
| DELETE | `/api/sheets/:id` | Manager (password) |
| POST | `/api/sheets/:sheetId/rows` | Manager |
| PUT | `/api/sheets/:sheetId/rows/:rowId` | Manager |
| DELETE | `/api/sheets/:sheetId/rows/:rowId` | Manager (password) |

## Features

- JWT authentication (30-day expiry)
- Viewer single-device sessions (new login invalidates previous session)
- Password-protected delete for sheets and rows
- 3-step sheet creation wizard with up to 26 custom columns
- Inline editing with batch save on sheet detail page
- Mobile-responsive spreadsheet-style data table
- Role-based routing and UI

## Project Structure

```
portal/
├── server/          # Express API
│   ├── index.js
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── seed.js
├── client/          # React SPA
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   └── api/
│   └── public/
└── README.md
```

## License

Private / internal use.
