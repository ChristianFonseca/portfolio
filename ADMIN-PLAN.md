# Plan admin — septiembre 2026

Cuatro frentes pedidos el 2026-09-10. Este archivo es el checklist vivo: lo voy marcando (`[x]`) a medida que cada punto queda **hecho y verificado**. No se commitea salvo que se pida.

## Datos que sustentan las decisiones

| Métrica | Valor medido |
|---|---|
| Tráfico (media diaria, últimos 5 días, Cloudflare) | ~1.500 requests · ~150 page views · ~100 visitantes únicos |
| Base de datos hoy | 8,5 MB total (sections 256 kB, posts 136 kB, chat_questions 48 kB) |
| Disco VPS | 150 GB libres de 193 GB |
| Uso real del chat | 14 preguntas desde julio; 1 en los últimos 30 días |
| Base de conocimiento del chat | ~15,3K chars ≈ 3,8K tokens; con reglas y contexto extra ≈ 4,4K tokens por mensaje |
| pgvector | **no instalado** en pg-dev; no hay embeddings en el código |

---

## 1. Admin: formulario de "crear" al costado

**Diagnóstico.** Artículos ([posts-manager.tsx:79](components/admin/posts-manager.tsx#L79)) y Usuarios ([users-manager.tsx:112](components/admin/users-manager.tsx#L112)) usan `lg:grid-cols-[1fr_340px]`: el formulario "Nuevo artículo" / "Crear usuario" vive en una columna lateral fija de 340 px junto a la lista. En pantallas anchas la lista queda estrecha y el formulario flota desalineado.

**Solución.** Botón `+ Nuevo artículo` / `+ Nuevo usuario` en la cabecera de la página que abre un **Dialog** (mismo patrón modal que ya usa el sitio); la lista ocupa todo el ancho. El formulario conserva su lógica (título → slug automático, validaciones, toast).

- [x] Posts: cabecera con botón + Dialog; lista a ancho completo; toast y errores intactos (commit `29a3f56`)
- [x] Usuarios: ídem (crear usuario, incl. aviso de contraseña que "no se vuelve a mostrar")
- [x] Verificación técnica: `tsc` en 0; build en VPS OK; `/login` del admin responde 200 sin errores en logs (desplegado 2026-09-10)
- [ ] **Christian:** abrir Blog y Usuarios en el admin, pulsar `+ Nuevo`, crear un borrador de prueba y borrarlo; mirar en móvil y escritorio (no tengo sesión de admin para hacerlo yo)

Tamaño: pequeño (1 sesión corta).

---

## 2. Bitácora general (IP + qué se hace en la página)

### Veredicto sobre el movimiento del mouse: **no** (raw)
- Coste: a 10 muestras/s y visitas de ~90 s son ~900 puntos/visita ≈ 14 kB; × 150 visitas/día ≈ 2 MB/día ≈ 0,7–2 GB/año en Postgres (con overhead). El disco lo aguanta, **pero**:
  - no aporta nada sin un visor de heatmaps que habría que construir;
  - multiplica los POST al origen (cada visitante enviando lotes cada pocos segundos);
  - es biometría de comportamiento: convierte el sitio en un tracker y exigiría aviso de privacidad explícito.
- **Alternativa barata y útil:** *heatmap de clics* (solo x,y normalizados + selector del elemento) si se quiere ver "dónde hacen clic". Opcional, ~50 bytes por clic.

### Qué sí registrar (≈ 1–3 kB por visita → < 0,5 MB/día)
| Evento | Datos |
|---|---|
| `pageview` | ruta, locale, referrer, país (header `CF-IPCountry`), UA recortado, viewport, tema |
| `section_view` | qué sección del landing se vio y cuánto tiempo (IntersectionObserver) |
| `click` | objetivos clave: proyecto abierto (cuál), post del blog, CTA contacto, chat, redes, descarga CV |
| `scroll` | profundidad máxima por página |
| `session_end` | duración total (enviado con `sendBeacon` en `pagehide`) |
| `chat` / `contact` | uso de chat (ya se guarda la pregunta) y envíos de contacto (éxito/fallo, sin el contenido) |
| `admin` | **quién hizo qué** en el admin: login ok/fallido, guardar sección, crear/editar/publicar/borrar post, cambiar config/modelo, subir imagen, usuarios. Hoy no existe nada de esto salvo `section_revisions`. |

### IP
- Se guarda **IP en claro** (`inet`) + país + `ip_hash` (mismo HMAC que el chat), como pediste.
- **Retención automática: 90 días** (configurable en Configuración). La purga corre dentro del endpoint de ingesta de forma oportunista (1 de cada ~100 requests), sin cron ni infraestructura nueva.
- Sin cookies: id de sesión aleatorio en `sessionStorage` (por pestaña). Sin consentimiento previo, pero **recomiendo** una línea en el footer/aviso: "Registramos IP y eventos de uso con fines de seguridad; retención 90 días".

### Diseño técnico
- Tabla `activity_events`: `id bigserial, ts timestamptz, kind text, path text, locale text, session_id text, ip inet, ip_hash text, country text, ua text, referrer text, actor text (email admin), props jsonb`. Índices: `(ts desc)`, `(kind, ts desc)`, `(session_id)`, `(ip, ts desc)`.
- `lib/request-ip.ts`: **un solo** helper de IP (hoy hay 3 copias) + país desde `CF-IPCountry`.
- `lib/rate-limit.ts`: limitador en memoria compartido (hoy hay 2 copias, una sin poda).
- `POST /api/events`: Zod, máx. 50 eventos/lote y 32 kB, rate limit por IP, descarta bots obvios por UA.
- `<ActivityTracker />` cliente **solo en el sitio público** (no en admin): cola en memoria, flush cada 15 s y en `pagehide` vía `navigator.sendBeacon`. Respeta `Do Not Track` (no envía).
- `lib/activity.ts`: `logAdminEvent()` invocado desde las server actions y rutas del admin.
- Página **Admin → Bitácora**: tiles (visitas hoy/7d, países top, páginas top, proyectos más abiertos), tabla filtrable por tipo/fecha/IP/sesión con paginación, vista de una sesión (línea de tiempo de sus eventos). Exportar CSV del filtro actual.
- Migración idempotente `scripts/migrate-activity.mjs` (mismo procedimiento que los seeds: contenedor efímero en `pg-shared`).

- [x] Migración `visitor_events` (Analytics) + `admin_audit` (Bitácora) + `activity_retention_days`/`audit_retention_days` en `settings` — `scripts/migrate-activity.mjs`, **aplicada en producción** 2026-09-10 (commit `8b58ae5`)
- [x] `lib/request-ip.ts` (IP/país/UA/hash únicos, CF-aware) y `lib/rate-limit.ts`; refactorizadas las 3 copias de IP (chat, contacto, login) y las 2 de rate limit
- [x] `POST /api/events`: Zod, ≤50 eventos y ≤32 KB por lote, 120 lotes/10 min por IP, descarta bots por UA y respeta DNT/GPC; purga oportunista (~1 % de lotes)
- [x] `<ActivityTracker />` en el layout raíz, solo sitio público (no admin): pageview, `section` (tiempo a la vista), `click` (coordenadas ‰ + elemento + `data-track`), `scroll`, `leave`; flush cada 15 s y `sendBeacon` al salir; `x-session-id` en chat y contacto
- [x] `logAudit()` en login ok/fail/limitado, logout, secciones (guardar/visibilidad/orden), posts (crear/guardar/publicar/despublicar/borrar), config chat, modelo y respaldo, catálogo, incidente, KB, traducción, upload, usuarios (crear/borrar/rol/contraseña), exportaciones y purgas
- [x] Eventos `chat` (modelo usado, fallback) y `contact` (ok/fallo) desde sus rutas
- [x] **Analytics** (`/analytics`, editores y admin): 7 tiles, top páginas/países/referrers/dispositivos/idioma/elementos clicados, tiempo por sección, **heatmap de clics** por ruta y dispositivo, tabla filtrable (tipo/país/IP/sesión/ruta), línea de tiempo por sesión, paginación y CSV
- [x] **Bitácora** (`/audit`, solo admin): tiles (24 h, 7 d, logins fallidos, personas activas), acciones del periodo, filtros (actor/acción/IP/ok), tabla con detalle JSON, paginación y CSV. Ambos módulos en el menú **debajo de Preguntas**
- [x] Retención configurable en Configuración (visitantes 7–365 d, bitácora 30–730 d) + botón "Aplicar retención ahora"
- [x] Verificación técnica en producción: lote real → 204 y 6 filas (5 + chat enlazado por sesión) con IP y país (`US`, header `CF-IPCountry` llega); bot UA y DNT → 204 sin guardar; payload inválido 400; 40 KB → 413; login fallido → fila `login.fail` con email intentado; `/analytics`, `/audit` y `/analytics/export` redirigen a `/login` sin sesión; WAF no bloquea `/api/events`; sin errores en logs; `tsc` 0
- [x] Aviso de privacidad en el footer (EN/ES, sin cookies, retención 90 días) — visible en producción
- [ ] **Christian:** navegar el sitio desde el móvil y el escritorio y abrir Admin → Analytics (deberías ver tus sesiones, secciones, clics y el heatmap de `/`); abrir Bitácora y ver tu propio `login.ok`; en 24 h revisar el tamaño de `visitor_events` (esperado < 1 MB/día) y probar "Aplicar retención ahora"

Tamaño: el mayor de los cuatro (2–3 sesiones).

---

## 3. Modelos Gemini: actualizar disponibles y bloquear deprecados

**Diagnóstico.** No hay SDK (fetch directo a `v1beta`). La lista del selector está **hardcodeada** en [lib/settings.ts:5-10](lib/settings.ts#L5-L10) (incluye ids que quizá no existan), el campo libre acepta cualquier id, no se valida contra la API, y si el modelo deja de existir el chat público devuelve un 502 genérico **sin fallback**. Un solo `gemini_model` sirve a chat y traducción.

**Solución.**
- Botón **"Actualizar modelos disponibles"** en Configuración → llama a `GET /v1beta/models` (con la `GEMINI_API_KEY` actual), filtra los que soportan `generateContent` y son familia Gemini (excluye embedding/imagen/veo), y guarda el catálogo en `settings.gemini_models_catalog` con fecha. El selector pasa a mostrar el catálogo real (nombre, límite de tokens de entrada/salida).
- **Bloqueo de deprecados:** un modelo se marca ⛔ y no se puede seleccionar si (a) ya no aparece en el catálogo, (b) su descripción contiene *deprecated/discontinued/legacy*, o (c) está en una denylist mínima de familias retiradas. El campo libre solo acepta ids presentes en el catálogo.
- **Modelo de respaldo** (`gemini_fallback_model`, por defecto `gemini-2.5-flash-lite`): si Gemini responde 404/400 por modelo inexistente, chat y traducción reintentan una vez con el respaldo, y se registra un evento `admin`/alerta para que salga un **banner en el admin**: "El modelo X no está disponible; se usó Y".
- Botón **"Probar modelo"**: llamada mínima a `countTokens` con el modelo elegido → muestra OK/latencia o el error real.
- Aviso automático en el dashboard del admin si el modelo seleccionado no está en el último catálogo.

- [x] `refreshGeminiModels()` (server action) + persistencia del catálogo con fecha (`lib/gemini.ts`, commit `e0b436f`)
- [x] Selector basado en catálogo con estado actual/⛔ deprecado y bloqueo; validación server-side en `setGeminiModel` y `setGeminiFallbackModel` (rechaza deprecados y los que no están en el catálogo)
- [x] Modelo de respaldo + reintento único en chat y traducción + incidente guardado en `settings.gemini_model_incident`
- [x] "Probar modelo" con `countTokens` (latencia o error real de la API)
- [x] Banner en todo el admin (layout) cuando hubo fallback o el modelo actual está deprecado/ausente, con "Descartar aviso"
- [x] Verificación técnica: `tsc` en 0; build y despliegue OK; chat en producción responde con el modelo configurado (2 preguntas reales, sin errores en logs)
- [ ] **Christian:** en Configuración pulsar "Actualizar modelos disponibles" y confirmar que aparece el catálogo real con límites de tokens; probar "Probar modelo"; opcional: elegir un id inexistente antes de actualizar y comprobar que al guardar se bloquea

Tamaño: medio (1 sesión).

---

## 4. ¿La información de la página se usa en el chat? ¿Es RAG?

**Respuesta corta: sí se usa, pero no es RAG.** El chat mete **toda** la base de conocimiento en el system prompt en cada mensaje (*context stuffing*), construida desde las filas de `sections` ([lib/chat/knowledge.ts](lib/chat/knowledge.ts)) y cacheada con `unstable_cache` etiqueta `content`. Se refresca sola cuando guardas una sección o la config del chat desde el admin. No hay embeddings ni pgvector (la etiqueta "RAG" del admin es solo un nombre).

**Huecos reales encontrados:**
1. **FAQ excluida** y **blog excluido** de la base de conocimiento.
2. Solo se usa el contenido **EN** (a un visitante en ES se le responde traduciendo); aceptable, pero las secciones ES no aportan.
3. **Secciones ocultas** (`visible=false`) sí entran al prompt.
4. Guardar un **post** no refresca la base (`revalidateTag("posts")` no toca `content`).
5. Cambios hechos fuera del admin (seeds por script) no se ven hasta reiniciar el contenedor: por eso hoy reinicio tras cada seed.

**¿Conviene hacer RAG de verdad (pgvector)?** No por ahora. La base entera son ~4,4K tokens; sumando el blog completo llegaría a ~11K tokens por mensaje, muy por debajo del contexto de Gemini Flash-Lite y a un coste de ~$0,001 por mensaje con 1 pregunta al mes. La recuperación por embeddings solo gana cuando el corpus no cabe cómodo (> 30–50K tokens) o el volumen de preguntas hace que el coste importe. Meter pgvector añadiría una extensión en la DB, un pipeline de embeddings y un modo de fallo nuevo para **peor** precisión que darle al modelo todo el contexto. Lo dejo documentado como paso futuro si el blog crece mucho.

**Solución.**
- Botón **"Actualizar base de conocimiento"** en Configuración → `revalidateTag("content")` + reconstrucción inmediata; muestra **última construcción, fuentes incluidas y tamaño (chars/tokens estimados)**.
- Incluir **FAQ** y **blog** (título, extracto y cuerpo recortado a ~2.500 chars por post, solo publicados) en la base; respetar `visible`; que guardar/publicar un post también refresque `content`.
- **Vista previa** de la base de conocimiento en el admin (texto exacto que recibe el modelo) para depurar respuestas.
- Registrar en la bitácora cada reconstrucción (quién y cuándo).

- [x] Botón "Actualizar base de conocimiento" + última construcción, tamaño (chars/≈tokens) y tabla de fuentes (`components/admin/knowledge-panel.tsx`)
- [x] FAQ + blog (publicados, cuerpo aplanado a 2.500 chars) en `knowledge.ts`; respeta `visible`; la cache lleva tags `content` **y** `posts`, así que guardar/publicar un post también la refresca. Extra: corregido bug de Skills que llegaba como "[object Object]"
- [x] Vista previa del texto exacto que recibe el modelo (desplegable en el panel)
- [x] Verificación: chat EN cita el post del RCE con su URL; chat ES lista los 7 artículos; sin errores en logs; `tsc` en 0. Tamaño estimado ≈ 9K tokens (el panel muestra el valor exacto)
- [ ] **Christian:** abrir Configuración → "Base de conocimiento del chat" y confirmar tamaño y fuentes; editar un texto de una sección, guardar y preguntar al chat para ver el cambio sin reiniciar

Tamaño: medio (1 sesión).

---

## Orden propuesto y despliegue

1. **#1 UI** (rápido, visible) → 2. **#3 Modelos** y **#4 Base de conocimiento** (ambos tocan la página de Configuración; van juntos) → 3. **#2 Bitácora** (el más grande; incluye migración de DB).

Cada bloque: `tsc` → commit (sin trailer) → bundle → ff-merge en VPS → migración/seed si aplica → `docker compose up -d --build` → verificación en origen y en público → marcar `[x]` aquí.

## Decisiones tomadas (2026-09-10, aprobado por Christian)

| Decisión | Valor |
|---|---|
| IP en claro con retención 90 días | **Sí** |
| Heatmap de clics (x,y por clic) | **Sí** — vive en el módulo **Analytics** |
| Módulos nuevos en el admin | **Analytics** (visitantes: page views, secciones, clics + heatmap, scroll, sesiones, IPs/países) y **Bitácora** (quién hizo qué en el admin, con IP). Ambos **debajo de Preguntas** en el menú |
| Modelo de respaldo | `gemini-2.5-flash-lite` |
| Blog completo en la base de conocimiento | **Sí**, recortado a ~2.500 chars por post |
| Línea de aviso de privacidad en el footer | **Sí** |
