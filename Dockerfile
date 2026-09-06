FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 BUILD_STANDALONE=1
RUN pnpm build

# Bitwarden Secrets Manager CLI (build musl para Alpine)
FROM alpine:3.20 AS bws
RUN apk add --no-cache curl unzip
ARG BWS_VERSION=2.1.0
RUN curl -sL -o /tmp/bws.zip "https://github.com/bitwarden/sdk-sm/releases/download/bws-v${BWS_VERSION}/bws-x86_64-unknown-linux-musl-${BWS_VERSION}.zip" \
 && unzip -o /tmp/bws.zip -d /usr/local/bin && chmod +x /usr/local/bin/bws && /usr/local/bin/bws --version

FROM node:22-alpine AS runner
WORKDIR /app
# HOME=/tmp: bws escribe su estado ahi (tmpfs escribible bajo read_only)
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    HOME=/tmp
COPY --from=bws /usr/local/bin/bws /usr/local/bin/bws
COPY --chown=node:node --from=build /app/.next/standalone ./
COPY --chown=node:node --from=build /app/.next/static ./.next/static
COPY --chown=node:node --from=build /app/public ./public
RUN mkdir -p /app/.next/cache && chown node:node /app/.next/cache
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
# Los secretos se inyectan en runtime desde Bitwarden Secrets Manager (bws run),
# no viven en la imagen ni en el compose. Solo BWS_ACCESS_TOKEN/PROJECT_ID llegan por env.
CMD ["sh","-c","exec bws run --project-id \"$BWS_PROJECT_ID\" -- node server.js"]
