FROM node:24-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --workspace @cashflow/api --workspace @cashflow/contracts --include-workspace-root
COPY tsconfig.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN npm run build

FROM node:24-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/apps/api/package.json apps/api/package.json
COPY --from=build /app/packages/contracts/package.json packages/contracts/package.json
RUN npm ci --omit=dev --workspace @cashflow/api --workspace @cashflow/contracts --ignore-scripts
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY migrations migrations
USER node
EXPOSE 4310
CMD ["node", "apps/api/dist/server.js"]
