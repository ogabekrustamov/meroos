# Meroos frontend — build the Vite SPA, then serve it with nginx.

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# API/WS base default to same-origin relative paths in a production build
# (see src/config.ts). Override with VITE_API_URL / VITE_WS_URL build args if
# the backend lives on a different origin.
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
