# Stage 1: build the Studio UI (Vite + React). The game runtime itself is never bundled.
FROM node:22-alpine AS studio
WORKDIR /studio
COPY apps/studio/package.json apps/studio/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY apps/studio ./
RUN npm run build

# Stage 2: the Node backend (games, coop rooms, Studio API, headless playtests).
FROM node:22-alpine
# git: every Studio project is its own git repository (version history / undo).
RUN apk add --no-cache git
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY backend ./backend
COPY games ./games
COPY assets ./assets
COPY sim ./sim
COPY templates ./templates
COPY index.html backend-config.js ./
COPY --from=studio /studio/dist ./apps/studio/dist
RUN mkdir -p /app/backend/data && chown -R node:node /app/backend/data
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0 GAMES_DATA_DIR=/app/backend/data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "backend/server.mjs"]
