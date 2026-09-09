# Security Hardening Prompt (para Claude) — Cloudflare + Bitwarden Secrets Manager

> **Cómo usar este prompt (sesión nueva de Claude):** si el usuario pide "asegurar/endurecer el deploy",
> poner el proyecto "detrás de Cloudflare", configurar WAF/Access/origin-lock, o gestionar secretos con
> **Bitwarden**, ADOPTA este archivo como tus instrucciones operativas y ejecútalo. No inventes pasos:
> sigue el orden, respeta el reparto **[USER]/[CLAUDE]**, y **verifica cada capa antes de la siguiente**.
> Antes de tocar nada, lee §2 (datos a recabar) y §7 (¿VPS compartido?). Pregunta al usuario solo lo que
> §2 pide. Pídele que haga los pasos **[USER]** (dashboards/DNS/cuentas, sin acceso tuyo) y hazle
> confirmar cada uno antes de continuar los pasos **[CLAUDE]** que dependen de ellos.
>
> **Para Claude:** este archivo es un runbook para endurecer un proyecto web (borde con **Cloudflare**
> §1-§8, y **gestión de secretos con Bitwarden Secrets Manager** §9). Cuando el usuario lo pida (o tras
> un incidente), sigue este orden. Marca claramente qué haces **tú [CLAUDE]** (servidor/nginx/Docker/
> código) y qué debe hacer **el usuario [USER]** (dashboards, DNS del registrador, cuentas). Verifica
> cada capa antes de pasar a la siguiente.
>
> **Orden general recomendado:** (1) **parchear/endurecer la app y el contenedor** (lo más importante),
> (2) rotar secretos filtrados, (3) **Bitwarden Secrets Manager** §9, (4) endurecer host/SSH,
> (5) **Cloudflare** §1-§8. El borde es la última capa, nunca la primera.

## 0. Contexto que lo originó
Creado tras un incidente real (2026-09): RCE por deserialización de React Server Components en
**Next.js 15.5.4 (CVE-2025-55182 / "React2Shell")** que exfiltró `process.env`. La lección clave:
**el arreglo #1 siempre es parchear/endurecer la app; Cloudflare es una CAPA, no un sustituto.**
Un RCE en proceso puede leer lo que la app tiene en memoria pase lo que pase.

---

## 1. ¿Vale la pena Cloudflare? ¿Free o Pro?
- **Casi siempre: Free.** Cubre un portfolio/app pequeña sobradamente.
- **Free incluye:** DDoS ilimitado, WAF managed ruleset (subset high-impact/CVEs), **5 custom rules**,
  1 regla de rate-limit, Bot Fight Mode, SSL, **Cloudflare Access (Zero Trust, gratis ≤50 usuarios,
  independiente del plan)**, **Authenticated Origin Pulls** (origin-lock).
- **Pro ($20/mes, ~$240/año) agrega:** WAF Managed + **OWASP completo**, Super Bot Fight Mode,
  Polish/Mirage (imágenes), 20 custom/page rules, analytics con retención, SLA, soporte.
- **Recomendación por defecto: quédate en Free.** Pro solo se justifica si el proyecto tiene
  **usuarios reales / login público / datos sensibles / pagos / ataques sostenidos** que la custom
  rule + Bot Fight no frenen, o necesidad de OWASP completo. Para estático/portfolio, Pro es
  redundante (p. ej. Polish no aplica si ya sirves WebP).

---

## 2. Datos a recabar del usuario antes de empezar
- Dominio y **dónde está el DNS hoy** (`nslookup -type=ns <dominio>` → si es del registrador tipo
  `*.dns-parking.com`/Hostinger, habrá que migrar nameservers a Cloudflare).
- IP del origen (VPS) y si el servidor es **compartido con otros proyectos/vhosts** (crítico: ver §7).
- Qué hostnames van por CF (ej. `app.dominio`, `admin.dominio`).
- Stack del origen (nginx/caddy/otro) y si hay un **panel admin** que deba ir tras Access.

---

## 3. Flujo de configuración (en orden; no saltarse la verificación)

### 3.1 Activar Cloudflare [USER]
1. dash.cloudflare.com → **Add a site** → dominio → plan **Free** → importa DNS.
2. Copia los **2 nameservers** de CF → cámbialos en el **registrador** (Hostinger, etc.).
3. Espera "Active". **[CLAUDE] verificar:** `curl -sI https://<dominio> | grep -iE 'server: cloudflare|cf-ray'`
   y `nslookup -type=ns <dominio>` → deben ser `*.ns.cloudflare.com`.

### 3.2 TLS mode [USER]
- SSL/TLS → Overview → **Full (strict)** (el origen debe tener cert válido, p. ej. Let's Encrypt/certbot).
  Nunca "Flexible" (CF↔origen iría en HTTP → inseguro y loops).

### 3.3 Restaurar IP real del visitante [CLAUDE] — **imprescindible si hay rate-limit por IP**
Detrás de CF, `$remote_addr` = IP de Cloudflare → rompe rate-limits y logs. Arreglar en nginx:
```nginx
# /etc/nginx/snippets/cloudflare-realip.conf  (generar desde los rangos oficiales)
# curl -s https://www.cloudflare.com/ips-v4  y  ips-v6
set_real_ip_from <cada CIDR v4/v6 de CF>;
real_ip_header CF-Connecting-IP;
```
Incluir SOLO en los server blocks del proyecto. `nginx -t && systemctl reload nginx`.
**Verificar:** hacer un request y confirmar en el access.log que sale la IP real, no `172.x/104.x`.

### 3.4 Origin-lock (que no evadan el WAF/Access por IP directa) [USER + CLAUDE, coordinado]
⚠️ **GOTCHA:** el origin-lock por **IP** (`allow <CIDR CF>; deny all;`) **NO funciona con `real_ip`**,
porque `real_ip` reescribe `$remote_addr` a la IP del cliente ANTES del módulo access → **403 a todos**.
→ Usar **Authenticated Origin Pulls (mTLS)**, no allow/deny por IP.

Pasos (orden importa, o se cae el sitio):
1. **[CLAUDE]** descargar el CA de CF y dejar snippet *staged sin incluir*:
   ```bash
   curl -s -o /etc/nginx/snippets/cloudflare-origin-pull-ca.pem \
     https://developers.cloudflare.com/ssl/static/authenticated_origin_pull_ca.pem
   # snippet cloudflare-mtls.conf:
   #   ssl_client_certificate /etc/nginx/snippets/cloudflare-origin-pull-ca.pem;
   #   ssl_verify_client on;
   ```
2. **[USER]** CF → SSL/TLS → **Origin Server** → activar **Authenticated Origin Pulls → toggle Global**.
   (Global = cert compartido de CF, firmado por `origin-pull.cloudflare.net`, que coincide con ese CA.
   Bloquea escáneres directos a la IP. Para máxima fuerza: zone-level con cert propio, más trabajo.)
3. **[CLAUDE], SOLO tras confirmar el toggle:** incluir `cloudflare-mtls.conf` en los server blocks
   443 del proyecto → `nginx -t` → reload. **Poner auto-revert** por si el toggle no estaba.
4. **Verificar:** vía CF = 200; directo a la IP = **400** (`--resolve <host>:443:<IP>`), sin cert.

### 3.5 WAF [USER]
- Security → WAF → **Managed rules**: confirmar el "Cloudflare Free Managed Ruleset" desplegado.
- Security → WAF → **Custom rules** (Free: 5). Regla útil contra RCE por Server-Action/RSC en apps
  cuyo público solo hace POST a `/api/`:
  ```
  (http.host eq "<dominio-publico>" and http.request.method eq "POST"
   and not starts_with(http.request.uri.path, "/api/"))  →  Block
  ```
  (No afecta admin en otro host detrás de Access.)
- Security → **Bots** → activar **Bot Fight Mode**.

### 3.6 Rate limiting [USER]
- Security → WAF → **Rate limiting rules** (Free: 1): p. ej. path `contains /api/`, >20 req/min por IP → Block.

### 3.7 Cloudflare Access para admin/paneles internos [USER]
- Zero Trust (one.dash.cloudflare.com) → primera vez pide "team name".
- Access → Applications → **Self-hosted** → hostname `admin.<dominio>`.
- **Policy: Action Allow, Include → Emails → <correos permitidos ESPECÍFICOS>.**
  ⚠️ **GOTCHA:** que NO quede "Everyone/All authenticated users" (dejaría entrar a cualquiera con OTP).
- Login: One-time PIN (email) por defecto; opcional Google.
- **Verificar en incógnito:** admin → gate de CF (email→OTP) antes de la app; con otro correo → rechaza.
- Nota: tras Access, el admin **no se puede curl-ear directo** (da 302 al login de CF).

---

## 4. Verificación end-to-end (comandos [CLAUDE])
```bash
# proxying activo
curl -sI https://<dominio> | grep -iE 'server: cloudflare|cf-ray'
# origin-lock: directo a la IP debe fallar
curl -s -o /dev/null -w '%{http_code}\n' --resolve <host>:443:<IP> https://<host>   # espera 400
# vía CF sigue OK
curl -s -o /dev/null -w '%{http_code}\n' https://<dominio>                          # espera 200
# IP real en logs del origen (no 172.x/104.x)
grep <marcador> /var/log/nginx/access.log | tail -1
# admin tras Access
curl -s -o /dev/null -w '%{http_code}\n' https://admin.<dominio>/login              # espera 302 (a CF)
```
Y en el dashboard: **Security → Analytics → Traffic/Events** (NO "DNS by data center", que es ruido de
bots y poco relevante). Buscar `Mitigated`, `Events` del WAF, y en logs del origen confirmar que los
POST-exploit rebotan inofensivos (**y que NO reaparezca el error clase RCE del CVE parcheado**).

---

## 5. Gotchas aprendidos (no repetir)
1. **Origin-lock por IP + real_ip = 403 a todos.** Usar mTLS (Authenticated Origin Pulls), no allow/deny.
2. **Coordinar el toggle de CF antes de exigir el cert en nginx**, o el sitio da 403. Auto-revert siempre.
3. **La "landing OK" engaña** si la app tiene fallback estático: puede verse bien con la DB caída.
   Probar SIEMPRE una ruta que requiera DB sin fallback (login/admin) para validar de verdad.
4. **Access policy debe restringir a emails específicos**, no "Everyone".
5. **DNS by data center** ≈ ruido de bots/crawlers; para seguridad mirar Traffic/Events.

---

## 6. Qué NO resuelve Cloudflare (recordárselo al usuario)
- Un **RCE/vuln en la app** → se arregla parcheando la app (Cloudflare solo dificulta llegar).
- **Secretos en memoria del proceso** → un RCE los lee igual; mitigar con gestor de secretos + parche.
- Por eso: **primero parche/hardening del app y del contenedor**, después Cloudflare como capa.

---

## 7. Servidor COMPARTIDO con varios proyectos (¡crítico!)
Si el VPS/nginx sirve **varios dominios/vhosts** (otros proyectos):
- **NO** hacer firewall de todo el box a IPs de CF (rompería los vhosts que no estén tras CF).
- Aplicar real_ip + mTLS **solo en los server blocks del proyecto** en cuestión.
- Revisar puertos publicados a `0.0.0.0` por otros contenedores (`ss -tlnp`); re-bindear a `127.0.0.1`
  los que deban ir solo por nginx. **Ojo:** Docker escribe iptables directo y **hace bypass de UFW**
  en puertos publicados → el control real es el `127.0.0.1:` en cada compose, no UFW.

---

## 8. Resumen del reparto de trabajo
- **[USER] (dashboard/registrador, Claude no tiene acceso):** activar CF + mover NS, TLS Full(strict),
  toggle Authenticated Origin Pulls, WAF managed+custom+rate-limit, Bot Fight Mode, Access app+policy.
  (Alternativa: dar a Claude un **API token de CF acotado** para configurar WAF/Access/SSL por API.)
- **[CLAUDE] (servidor/código):** real_ip en nginx, mTLS (CA + ssl_verify_client) por vhost, verificación
  end-to-end, y siempre **parche/hardening de la app primero**.

---

## 9. Bitwarden Secrets Manager (bws) — secretos fuera del `.env` plano

### 9.1 Cuándo usarlo y su límite honesto
- **Usar cuando:** quieres sacar los secretos de la app de un `.env` plano / `docker-compose` /
  `docker inspect`; y ganar **rotación, revocación y bitácora de accesos** centralizadas.
- **Límite honesto (dilo al usuario):** un **RCE en proceso puede leer los secretos igual** (se inyectan
  como env al proceso de la app). Reduce la exposición **en reposo** y el radio (queda **un** token
  revocable/auditado en vez de todas las claves). No sustituye parchear la app ni el WAF de borde.

### 9.2 Setup [USER] (dashboard de Bitwarden)
1. Habilitar **Secrets Manager**.
2. Crear un **proyecto** (ej. `<proyecto>`).
3. Crear una **machine account** con acceso **SOLO LECTURA** a ese proyecto → generar **access token**.
4. Cargar los secretos con los **nombres EXACTOS** que lee la app (`SESSION_SECRET`, `DATABASE_URL`,
   `GEMINI_API_KEY`, `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`, etc.).
5. ⚠️ Los **valores** deben ser los de **producción/contenedor**, no los de dev. En especial
   `DATABASE_URL` con el host de la **red del contenedor** (ej. `pg-dev:5432`), NO el túnel local
   (`127.0.0.1:15432`).

### 9.3 Integración [CLAUDE] (servidor/Docker)
- Guardar token+project id en `/root/<proyecto>-bws.env` (root, `chmod 600`):
  ```
  BWS_ACCESS_TOKEN=...
  BWS_PROJECT_ID=...
  ```
- Dockerfile: instalar bws (releases `github.com/bitwarden/sdk-sm`, tag `bws-vX.Y.Z`; **musl** para
  Alpine, **gnu** para glibc) y arrancar con `bws run`:
  ```dockerfile
  FROM alpine:3.20 AS bws
  RUN apk add --no-cache curl unzip
  ARG BWS_VERSION=2.1.0
  RUN curl -sL -o /tmp/bws.zip "https://github.com/bitwarden/sdk-sm/releases/download/bws-v${BWS_VERSION}/bws-x86_64-unknown-linux-musl-${BWS_VERSION}.zip" \
   && unzip -o /tmp/bws.zip -d /usr/local/bin && chmod +x /usr/local/bin/bws
  # ... en el stage runner:
  COPY --from=bws /usr/local/bin/bws /usr/local/bin/bws
  ENV HOME=/tmp   # bws escribe estado aquí (compatible con read_only + tmpfs /tmp)
  CMD ["sh","-c","exec bws run --project-id \"$BWS_PROJECT_ID\" -- node server.js"]
  ```
- docker-compose: **quitar `env_file: .env`** (secretos); pasar SOLO el token con
  `env_file: /root/<proyecto>-bws.env`. Mantener envs NO secretas (ej. `UPLOADS_DIR`) en `environment:`.
- Si el contenedor es `read_only: true`: `HOME=/tmp` + tmpfs `/tmp` para que bws escriba su estado.
- Tras verificar que arranca, **retirar el `.env` plano** del server (Bitwarden = fuente de verdad);
  conservar backups `root:600` para recovery.

### 9.4 Gotchas (no repetir)
1. **`DATABASE_URL` con host del contenedor** (`pg-dev:5432`), NO el túnel local (`127.0.0.1:15432`).
   Síntoma clásico: landing OK (cae al fallback estático) pero login da **"Error interno"**
   (`ECONNREFUSED 127.0.0.1:15432`). **Probar siempre una ruta que requiera DB sin fallback.**
2. **Token read-only → Claude NO puede editar secretos**; los edita el USER en la UI de Bitwarden.
3. **`bws run` PISA las env ya definidas** (no se puede override desde compose) → el valor correcto va
   en Bitwarden, no en el compose.
4. **bws corre como padre (PID1) y ejecuta la app como hijo**; los secretos quedan en el env del
   proceso de la app, no en `docker exec env` (bien: no aparecen en `docker inspect`).

### 9.5 Verificación [CLAUDE]
```bash
# validar token + listar NOMBRES de secretos (sin valores)
BWS_ACCESS_TOKEN=... ./bws secret list <project_id> --output json   # confirmar nombres/6 esperados
# el env base del contenedor NO debe tener secretos; solo el token
docker exec <cont> env | grep -c DATABASE_URL      # 0
docker exec <cont> env | grep -c BWS_ACCESS_TOKEN  # 1
# tras el deploy: 0 fallbacks / 0 errores de conexión desde el restart
docker logs --since 120s <cont> 2>&1 | grep -c ECONNREFUSED   # 0
# prueba definitiva: credenciales reales (host+password) contra la DB por TCP
docker run --rm --network <net-db> -e PGURL="$url" postgres:16-alpine \
  sh -c 'psql "$PGURL" -tAc "select 1"'
```
Nota: el host no suele tener `unzip`/`node` (viven en contenedores) → usar `python3` para descomprimir/
parsear, o hacerlo dentro de un contenedor.

### 9.6 Reparto
- **[USER]:** habilitar SM, crear proyecto + machine account **read-only** + token, cargar secretos con
  nombres/valores de producción, y **editar secretos** cuando haga falta (token de Claude es read-only).
- **[CLAUDE]:** colocar el token en el host (root:600), Dockerfile+compose para `bws run`, retirar el
  `.env` plano, verificación end-to-end.
