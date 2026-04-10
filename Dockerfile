# CareerLink API — use when Railway "Root Directory" is the repo root (monorepo).
# If Root Directory is set to `backend`, Railway uses backend/Dockerfile instead.
FROM node:20-alpine
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ .

ENV NODE_ENV=production
CMD ["node", "server.js"]
