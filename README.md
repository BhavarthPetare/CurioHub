# CurioHub

Real-time interest-based chat rooms. Pick your interests, get recommended rooms, and chat live.

- **Client:** React 19, Vite, Tailwind CSS 4, Socket.IO client (`client/`)
- **Server:** Express 5, Socket.IO, Mongoose, JWT auth (`server/`)

## Requirements

- Node.js 20+
- A MongoDB instance, e.g. `docker run -d --name curiohub-mongo -p 27017:27017 mongo:7`

## Setup

```bash
npm run install:all
cp server/.env.example server/.env   # set MONGO_URI and JWT_SECRET
cp client/.env.example client/.env
```

## Run (development)

Two terminals:

```bash
cd server && npm start          # API + sockets on :5000
cd client && npm run dev        # Vite dev server on :5173
```

The server exits at startup if `MONGO_URI` or `JWT_SECRET` is missing, or if MongoDB is unreachable.
Rooms are seeded automatically on first start.

## Production

One Node process serves the API, the WebSocket and the built client.

```bash
npm run build   # clean-installs both apps and builds the client into client/dist
npm start       # starts the server
```

Host environment variables (see `server/.env.example`):

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 32+ random characters (the server refuses weak secrets in production) |
| `TRUST_PROXY` | `1` on hosts behind a load balancer (Render, Railway, Heroku) |
| `PORT` | usually set by the host |

Do **not** set `VITE_API_URL` on the host. With it unset, the client calls the same origin.
Do not build from a machine whose `client/.env` points at `localhost`, or that URL gets baked into the bundle.

Health check: `GET /api/health` returns 200 when the database is connected, 503 otherwise.

Run a single instance: online presence is kept in memory.

## How it works

- A room's name is also a user "interest". Choosing interests drives the **Recommended** list.
- Sockets authenticate with the same JWT as the REST API. The server takes the user's identity from the token, never from client-sent fields.
- Online counts are per distinct user (several tabs count once) and are broadcast via the `roomData` event.
- Messages are limited to 2000 characters and 8 per 5 seconds per connection.
