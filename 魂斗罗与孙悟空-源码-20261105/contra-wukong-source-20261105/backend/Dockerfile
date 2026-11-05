FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY backend ./backend
COPY games ./games
COPY assets ./assets
COPY index.html backend-config.js ./
RUN mkdir -p /app/backend/data && chown -R node:node /app/backend/data
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0 GAMES_DATA_DIR=/app/backend/data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "backend/server.mjs"]
