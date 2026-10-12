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

# Secretos al arrancar, de dos formas mientras dura la migración (infra/PLAN-secretos-implementacion.md):
#  - hasta la fase 5: Bitwarden. El CMD de abajo corre `bws run` con el token del env_file.
#  - desde la fase 5: SOPS + age. El compose arranca como root solo para descifrar
#    (`sops exec-env --same-process --user node …`) y sops baja a «node» antes de `node server.js`.
# Las dos descargas se verifican por SHA-256 (medido desde dos redes el 2026-10-04 y 05):
# un archivo alterado o distinto corta la construcción.

# Bitwarden Secrets Manager CLI (build musl para Alpine)
FROM alpine:3.20 AS bws
RUN apk add --no-cache curl unzip
ARG BWS_VERSION=2.1.0
ARG BWS_SHA256=c1e62be60735e71a82699bb7286043c6cb8b525a70f838d1fc81f10bc83f40b1
RUN curl -fsSL -o /tmp/bws.zip "https://github.com/bitwarden/sdk-sm/releases/download/bws-v${BWS_VERSION}/bws-x86_64-unknown-linux-musl-${BWS_VERSION}.zip" \
 && unzip -o /tmp/bws.zip -d /usr/local/bin \
 && echo "${BWS_SHA256}  /usr/local/bin/bws" | sha256sum -c - \
 && chmod +x /usr/local/bin/bws && /usr/local/bin/bws --version

# SOPS (getsops/sops), el binario publicado para linux/amd64: estático, sirve en Alpine.
FROM alpine:3.20 AS sops
RUN apk add --no-cache curl
ARG SOPS_VERSION=v3.13.3
ARG SOPS_SHA256=e5bec3346a873ae91d871550f3e698c1aad962aff462a080e40f25fde17fef6b
RUN curl -fsSL -o /usr/local/bin/sops "https://github.com/getsops/sops/releases/download/${SOPS_VERSION}/sops-${SOPS_VERSION}.linux.amd64" \
 && echo "${SOPS_SHA256}  /usr/local/bin/sops" | sha256sum -c - \
 && chmod 755 /usr/local/bin/sops

FROM node:22-alpine AS runner
WORKDIR /app
# HOME=/tmp: bws escribe su estado ahi (tmpfs escribible bajo read_only)
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    HOME=/tmp
COPY --from=bws /usr/local/bin/bws /usr/local/bin/bws
COPY --from=sops /usr/local/bin/sops /usr/local/bin/sops
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
