FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm install --no-audit --no-fund --fetch-retries=5 --fetch-timeout=600000
COPY apps/web apps/web
RUN npm run build -w @smartfashion/web
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static apps/web/.next/static
COPY --from=build /app/apps/web/public apps/web/public
CMD ["node","apps/web/server.js"]
