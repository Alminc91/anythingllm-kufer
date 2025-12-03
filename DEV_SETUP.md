# AnythingLLM Local Development Setup

## Prerequisites
- Node.js 18+
- npm/yarn
- SQLite (for Prisma)

## 1. Backend Server Setup

```bash
cd /home/srvadmin/KI_Apps_Pipelines/Apps/anythingllm/server

# Install dependencies
yarn install

# Fix SSL certificate issues (if needed)
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Initialize database (first time only)
npx prisma generate
npx prisma db push

# Start backend server (runs on port 3001)
yarn dev
```

## 2. Frontend Setup

### Configure API Proxy

Edit `frontend/vite.config.js` and add the proxy configuration:

```javascript
server: {
  port: 3002,  // Use 3002 to avoid conflicts with other services
  host: "localhost",
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true,
      secure: false,
    },
  },
},
```

### Start Frontend

```bash
cd /home/srvadmin/KI_Apps_Pipelines/Apps/anythingllm/frontend

# Install dependencies
yarn install

# Start frontend (runs on configured port, e.g., 3002)
yarn dev
```

## 3. Access the Application

- Frontend: http://localhost:3002
- Backend API: http://localhost:3001/api

## Common Issues

### SSL Certificate Errors
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Database Tables Not Found
```bash
cd server
npx prisma db push
```

### Port Already in Use
Change the port in `frontend/vite.config.js`:
```javascript
server: {
  port: 3002,  // Change to available port
}
```

### API Returns 404
Make sure routes are accessed via `/api/` prefix (e.g., `/api/system/health`)

## Environment Variables

Copy the example env file:
```bash
cp server/.env.example server/.env
```

Key variables:
- `SERVER_PORT=3001` - Backend port
- `JWT_SECRET` - Generate a secure random string
- `STORAGE_DIR` - Where files are stored

## Running Both Services

Open two terminals:

**Terminal 1 - Backend:**
```bash
cd /home/srvadmin/KI_Apps_Pipelines/Apps/anythingllm/server
export NODE_TLS_REJECT_UNAUTHORIZED=0
yarn dev
```

**Terminal 2 - Frontend:**
```bash
cd /home/srvadmin/KI_Apps_Pipelines/Apps/anythingllm/frontend
yarn dev
```

## See Also
- [BUILD.md](BUILD.md) - Docker build instructions
- [DEV.md](DEV.md) - Additional development notes
