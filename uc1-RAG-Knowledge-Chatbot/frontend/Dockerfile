FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* env vars at build time, not runtime -- these need to point
# at wherever the browser (not other containers) can reach the backend.
ARG VITE_API_BASE=http://localhost:8001
ARG VITE_APP_API_KEY=dev-local-key
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_APP_API_KEY=$VITE_APP_API_KEY

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
