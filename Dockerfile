# God's Eye View serves its whole /api/* backend from Vite dev-server
# middleware. Only 10 of the 21 proxies also register on
# configurePreviewServer, and the upstream Pinokio launcher calls
# vite.createServer() too — so `vite build && vite preview` would 404 half the
# layers (celestrak, tomtom, firms, overpass, opensky, cctv, gbfs, ...).
# ponytail: the dev server IS the supported runtime; swap to build+preview only
# if upstream moves those proxies onto configurePreviewServer.
FROM node:24-slim

# NODE_ENV pinned so a platform-injected NODE_ENV=production can't make `npm ci`
# skip devDependencies — vite itself lives there.
ENV NODE_ENV=development \
    PUPPETEER_SKIP_DOWNLOAD=1 \
    HOST=0.0.0.0 \
    PORT=4173

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# HOST=0.0.0.0 also flips vite's allowedHosts to true, which is what lets this
# answer on a proxied hostname instead of only localhost.
EXPOSE 4173
CMD ["node", "scripts/serve-container.mjs"]
