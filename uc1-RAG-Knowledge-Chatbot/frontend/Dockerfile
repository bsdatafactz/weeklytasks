# check=skip=SecretsUsedInArgOrEnv
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* env vars at build time, not runtime -- these need to point
# at wherever the browser (not other containers) can reach the backend.
#
# VITE_APP_API_KEY trips BuildKit's SecretsUsedInArgOrEnv check (a keyword match on
# "KEY", not an actual sensitivity assessment) -- it's not a real secret here: Vite
# bakes it into the public JS bundle by design, so it's visible to any browser
# regardless of how it's passed into the build. Real secrets (Azure Foundry/Search
# keys) never go through ARG/ENV -- they reach the backend container only via
# env_file: at runtime. Check deliberately suppressed above, not just ignored.
ARG VITE_API_BASE=http://localhost:8001
ARG VITE_APP_API_KEY=dev-local-key
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_APP_API_KEY=$VITE_APP_API_KEY

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
