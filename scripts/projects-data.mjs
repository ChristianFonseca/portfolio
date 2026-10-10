// Datos de los proyectos reales (bilingüe). Fuente única compartida por
// scripts/seed-projects.mjs (DB) y el actualizador de static-data.json.

export const projectsEn = [
  {
    title: "Furtale",
    description:
      "A full-stack platform for managing pet health records. Owners keep their pets' profiles, photos, voice-note journals and veterinary documents in one place, get vaccination and appointment reminders by email, share records read-only with a vet, and query an AI assistant grounded in each pet's real medical history.",
    image: "",
    repoUrl: "",
    liveUrl: "https://furtale.pet",
    tech: ["TypeScript", "Next.js", "React", "Python", "FastAPI", "PostgreSQL", "pgvector", "Anthropic Claude", "Google Gemini", "Whisper", "S3 / MinIO", "Docker", "Cloudflare", "Resend"],
    bullets: [
      "RAG assistant over each pet's records (pgvector + Claude) with tool-use retrieval, so answers cite the pet's actual reports instead of generic advice.",
      "Snap-a-photo report digitization: Gemini extracts structured lab values and metadata from veterinary documents.",
      "Voice journal with real-time dictation (Web Speech / native iOS speech) and self-hosted Whisper transcription as the accurate fallback.",
      "Vaccination protocols and calendar events with locale-aware transactional email reminders sent through Resend.",
      "Hardened edge: Cloudflare WAF and rate limiting, admin panel on a separate hostname behind Cloudflare Access (email OTP), and the origin locked down with Authenticated Origin Pulls (mTLS) so direct-to-IP traffic is rejected.",
      "Ships as an Android (TWA) and iOS (Capacitor) app over the same live web codebase; fully bilingual ES/EN.",
    ],
  },
  {
    title: "Andes Finance",
    description:
      "A multi-country financial reporting and consolidation platform for a corporate finance office (CFO). Local entities submit standardized P&L data through a multi-tier approval workflow that consolidates into group-level reports with derived metrics like EBITDA and budget-vs-actuals.",
    image: "",
    repoUrl: "",
    liveUrl: "",
    tech: ["TypeScript", "Next.js", "React", "Node.js", "Prisma", "PostgreSQL", "Auth.js", "Azure AD SSO", "Keycloak", "Material UI", "Zod", "ExcelJS", "PDFKit", "Docker"],
    bullets: [
      "Monthly close workflow: per-country P&L ingestion, validation and a multi-tier approval chain with draft/reject/resubmit states.",
      "Multi-country consolidation into group-level reports per fiscal period, with period lifecycle management (open to closed to consolidated).",
      "Financial metrics: EBITDA and other derived P&L lines, budget-vs-actual and period-over-period comparison.",
      "Granular RBAC and multi-tenancy scoped by country, separating admin/config from financial data access.",
      "Full audit logging aligned to ISO 27001, in-app notifications and Excel/PDF report exports.",
    ],
  },
  {
    title: "Klipsum",
    description:
      "An AI tool that turns videos into structured documentation. Upload an mp4 or paste a YouTube link and Gemini produces a document with time-stamped sections, extracted screenshots and a mindmap, exportable to Word.",
    image: "",
    repoUrl: "",
    liveUrl: "",
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "FastAPI", "Python", "PostgreSQL", "Google Gemini", "YouTube Data API", "OpenCV", "python-docx", "Stripe", "Docker"],
    bullets: [
      "Two sources: mp4 upload or a YouTube URL analyzed natively by Gemini — the video is never downloaded.",
      "Six documentation tones (technical, tutorial, meeting, voiceover, research, marketing) with optional chapters and quotes.",
      "Structured outputs: timestamped sections, auto-extracted screenshots (OpenCV), a mindmap and a generated DOCX.",
      "Auth, roles and billing: Argon2 + JWT, admin/paid/free tiers, free-trial minutes and Stripe checkout.",
      "Admin governance: hot-reloadable prompts, per-job token and USD tracking, PII redaction and ISO 27001-aligned controls.",
    ],
  },
  {
    title: "OrchestrAI",
    description:
      "A visual multi-LLM debate orchestrator: Claude, GPT, Gemini and Grok answer the same question, critique each other over rounds and converge on one sourced answer. In agents mode, nodes can search the web, read project documents and run code in a sandbox before opining, under per-node budgets and human approval gates. Built as a full product: Next.js flow editor, FastAPI async DAG engine, PostgreSQL, Stripe billing with plans and credits, and an MCP server so external agents such as Claude Code can run flows.",
    image: "",
    repoUrl: "",
    liveUrl: "",
    tech: ["Python", "TypeScript", "FastAPI", "Next.js", "React", "React Flow", "Tailwind CSS", "SQLAlchemy", "Alembic", "PostgreSQL", "Stripe", "Docker", "MCP", "Auth.js", "SSE", "Anthropic", "OpenAI", "Google Gemini", "xAI Grok"],
    bullets: [
      "Built an async DAG execution engine (one asyncio task per node, k-of-n partial failure, per-node timeouts, retries and cancellation) that streams node status and cost over SSE and recomputes run totals after every node and agent step.",
      "Implemented a single tool-use loop across Anthropic, OpenAI (Chat Completions and Responses API) and Gemini function calling, with parameter fallbacks and thought-signature replay, plus 6 built-in tools and external MCP servers.",
      "Designed agents mode with a Docker code sandbox (no network, read-only root, memory/pid limits), per-agent USD budgets, step caps, human approval gates and web search routed to each provider's cheapest grounding-capable model.",
      "Shipped 81 validated flow templates (research proposals, MBA, conversational debates), 27 bilingual expert personas and an AI flow builder that turns a plain-text description into a validated, auto-laid-out graph.",
      "Implemented SaaS auth and billing: Argon2id, 15-minute JWTs with rotating refresh tokens and reuse detection, data-driven RBAC, audit log, plans with monthly credits, Stripe subscriptions and BYOK provider keys, mapped to ISO/IEC 27001 controls.",
      "Exposed the product as an MCP server with admin-issued scoped API keys so Claude Code or Cursor can list, generate, run and await flows and read their reports; backed by 21 test files with 146 passing cases.",
    ],
  },
  {
    title: "MAT",
    description:
      "MAT (Multi-Agent Trading) is a self-hosted, AI-driven trading platform where specialized LLM agents — technical, fundamental, macro, sentiment, risk and allocation — collaborate to analyze markets and propose trades across FX, equities, ETFs, crypto and commodities, while deterministic, versioned code enforces every risk limit, position size and execution. The principle: LLMs propose, deterministic code disposes.",
    image: "",
    repoUrl: "",
    liveUrl: "",
    tech: ["Python", "FastAPI", "Next.js", "React", "TypeScript", "PostgreSQL", "pgvector", "SQLAlchemy", "Redis", "arq", "Anthropic Claude", "OpenTelemetry", "Docker", "Caddy"],
    bullets: [
      "Multi-agent pipeline of ~15 LLM agents (orchestrator, analysts, a 3-way risk debate, allocation, decision, memory, monitor, reporter) loaded as installable plugins.",
      "Deterministic guardrails as final authority: every agent computes features in reproducible, tested code and falls back to a deterministic path if the LLM is unavailable — risk limits and sizing can never be widened by model reasoning or prompt injection.",
      "Paper and live trading modes with human-in-the-loop approval, kill switch, Decimal money math, UTC-only timestamps and full step-by-step provenance on every cycle.",
      "Deterministic backtesting engine that reuses the live runtime with point-in-time data and record/replay, surfacing LLM look-ahead-bias warnings.",
      "Production platform: JWT/RBAC/2FA auth, pgvector-backed memory, OpenTelemetry observability with LLM cost tracking, and a Next.js dashboard generated from the API's OpenAPI schema.",
    ],
  },
  {
    title: "CrabAir",
    description:
      "A VS Code extension that turns Claude Code's activity into a live animation: a little airplane piloted by Claude's crab mascot takes off, cruises and lands in real time as Claude works. The extension embeds a local \"control tower\" server that turns each Claude Code hook event into an animated scene inside the editor.",
    image: "",
    repoUrl: "https://github.com/ChristianFonseca/crabair",
    liveUrl: "https://marketplace.visualstudio.com/items?itemName=ChristianFonseca.crabair",
    tech: ["JavaScript", "Node.js", "VS Code Extension API", "HTTP server", "Server-Sent Events", "Webview", "SVG", "CSS animation", "Claude Code hooks", "Anthropic Claude"],
    bullets: [
      "Real-time flight reacting to Claude Code: taxi on a new session, takeoff on prompt submit, cruising while working, and automatic landing after Claude's turn ends (cancels if you type again).",
      "A towed banner shows exactly what Claude is doing right now (reading a file, running a command, asking a question), and each delegated subagent takes off as its own escort plane.",
      "The extension itself is the 'control tower': a dependency-free Node HTTP server that normalizes each hook event and pushes it to VS Code webviews via postMessage and to browsers via Server-Sent Events.",
      "One-click install/uninstall of global Claude Code hooks into ~/.claude/settings.json (with backup), a status-bar toggle, and rendering in the sidebar, a panel or a second monitor at localhost:4747.",
      "Extras: day/night mode, optional engine sound, turbulence on tool failure, a wait-time mini-game with unlockable plane skins, and a post-flight summary of the session.",
    ],
  },
  {
    title: "Atalaya",
    description:
      "A personal monitoring and security platform, currently used only on my own infrastructure: the VPS that hosts my web projects and my local PC. It alerts only when something needs action, and it replaced four overlapping monitors whose 100 alerts in one week were all noise. A privileged Bash agent with no network collects host facts every minute, and an unprivileged Node.js/TypeScript hub evaluates 68 kinds of checks, analyzes Cloudflare traffic and tracks off-site backups.",
    image: "",
    repoUrl: "",
    liveUrl: "",
    tech: ["TypeScript", "Node.js", "SQLite", "Bash", "Docker", "Docker Compose", "systemd", "Zod", "YAML", "Cloudflare", "Cloudflare GraphQL API", "Telegram Bot API", "healthchecks.io", "Claude Code", "nginx", "rclone", "Cloudflare R2", "PowerShell"],
    bullets: [
      "Audited the existing monitoring before writing code: of 100 alerts sent in one week, none matched a real incident, and two unscoped rules produced 68% of them.",
      "Split privilege by design. A root Bash agent with no network writes facts to a spool. The Node.js hub reads that spool through a read-only mount and runs as non-root, on a read-only filesystem, with all capabilities dropped and no Docker socket.",
      "Built an alert engine with stable fingerprints, per-rule cooldowns, automatic resolution, flapping grouping and expiring silences with mandatory reasons. It also has a false-positive budget that demotes noisy rules but never integrity checks.",
      "Integrated Cloudflare REST and GraphQL analytics into a 0–100 zone security score whose every deduction comes with its fix, an offline world map of attack origins, and a split of app 5xx errors from restarts.",
      "Added a read-only AI reviewer (Claude) that treats attacker-written paths and User-Agents as possible prompt injection. It proposes fixes that run only from a whitelist of 6 idempotent scripts.",
      "Monitored encrypted off-site Postgres backups: freshness, weekly and monthly tiers, restore tests, and whether the bucket lock really blocks deletion by the server's own token.",
    ],
  },
  {
    title: "VSC Splitter",
    description:
      "A Windows desktop app for developers who keep many VS Code windows open across several monitors. It shows the monitors as they are physically arranged, lets you split each screen into custom zones and drag windows into them, then moves and resizes every window in one click and restores the arrangement after restarts. Built in C# with WPF on .NET 10, using Win32 and DWM APIs for pixel-exact placement.",
    image: "",
    images: ["/projects/vsc-splitter/01-editor-4-monitores.webp", "/projects/vsc-splitter/02-zonas-a-medida.webp"],
    repoUrl: "https://github.com/ChristianFonseca/monitor_screen_splitter",
    liveUrl: "",
    tech: ["C#", ".NET 10", "WPF", "Win32 API", "DWM API", "DisplayConfig API", "xUnit", "System.Text.Json", "Windows Forms", "PowerShell"],
    bullets: [
      "Built a visual editor that mirrors the real monitor arrangement, with 14 layout presets, custom grids up to 12×12, draggable boundaries, merged zones, gaps and margins.",
      "Implemented pixel-exact window placement by measuring each window's invisible resize borders through the DWM frame bounds, so neighbouring windows line up without gaps or overlaps.",
      "Designed integer track math in which adjacent zones share rounded boundaries, keeping tiling exact for any proportions, gaps and margins, and covered it with unit tests on odd monitor sizes.",
      "Made profiles survive restarts: windows are identified by the folder name parsed from VS Code titles, closed windows keep their zone as placeholders, and reappearing windows are placed automatically.",
      "Added recovery tools: capturing the current arrangement by overlap matching, reopening missing folders from VS Code's own storage.json, tray mode and start with Windows.",
      "Wrote 56 automated tests, including an integration test that moves a real window and checks its visible frame to the pixel.",
    ],
  },
]

export const projectsEs = [
  {
    title: "Furtale",
    description:
      "Plataforma full-stack para gestionar historiales de salud de mascotas. Los dueños mantienen perfiles, fotos, bitácoras con notas de voz y documentos veterinarios en un solo lugar, reciben recordatorios de vacunas y citas por correo, comparten el historial en modo lectura con su veterinario y consultan a un asistente de IA anclado al historial médico real de cada mascota.",
    image: "",
    repoUrl: "",
    liveUrl: "https://furtale.pet",
    tech: ["TypeScript", "Next.js", "React", "Python", "FastAPI", "PostgreSQL", "pgvector", "Anthropic Claude", "Google Gemini", "Whisper", "S3 / MinIO", "Docker", "Cloudflare", "Resend"],
    bullets: [
      "Asistente RAG sobre el historial de cada mascota (pgvector + Claude) con recuperación vía tool-use: las respuestas citan los informes reales, no consejos genéricos.",
      "Digitalización de informes desde una foto: Gemini extrae valores de laboratorio y metadatos estructurados de documentos veterinarios.",
      "Bitácora de voz con dictado en tiempo real (Web Speech / dictado nativo en iOS) y transcripción con Whisper autoalojado como respaldo de precisión.",
      "Protocolos de vacunación y eventos de calendario con recordatorios transaccionales por correo, según el idioma del usuario, enviados con Resend.",
      "Borde endurecido: WAF y rate limiting de Cloudflare, panel de administración en un hostname separado detrás de Cloudflare Access (OTP por correo), y origen bloqueado con Authenticated Origin Pulls (mTLS) que rechaza el tráfico directo a la IP.",
      "Se distribuye como app de Android (TWA) y iOS (Capacitor) sobre el mismo código web en vivo; completamente bilingüe ES/EN.",
    ],
  },
  {
    title: "Andes Finance",
    description:
      "Una plataforma de reporte y consolidación financiera multipaís para una oficina financiera corporativa (CFO). Las entidades locales cargan datos de P&L estandarizados a través de un flujo de aprobación de varios niveles que consolida en reportes a nivel de grupo con métricas derivadas como EBITDA y presupuesto vs. real.",
    image: "",
    repoUrl: "",
    liveUrl: "",
    tech: ["TypeScript", "Next.js", "React", "Node.js", "Prisma", "PostgreSQL", "Auth.js", "Azure AD SSO", "Keycloak", "Material UI", "Zod", "ExcelJS", "PDFKit", "Docker"],
    bullets: [
      "Flujo de cierre mensual: ingesta de P&L por país, validación y una cadena de aprobación de varios niveles con estados borrador/rechazo/reenvío.",
      "Consolidación multipaís en reportes a nivel de grupo por período fiscal, con gestión del ciclo del período (abierto a cerrado a consolidado).",
      "Métricas financieras: EBITDA y otras líneas de P&L derivadas, comparación presupuesto vs. real y período contra período.",
      "RBAC granular y multi-tenencia por país, separando administración/configuración del acceso a los datos financieros.",
      "Log de auditoría completo alineado a ISO 27001, notificaciones en la app y exportación de reportes en Excel/PDF.",
    ],
  },
  {
    title: "Klipsum",
    description:
      "Una herramienta de IA que convierte videos en documentación estructurada. Sube un mp4 o pega un enlace de YouTube y Gemini produce un documento con secciones marcadas por tiempo, capturas extraídas y un mapa mental, exportable a Word.",
    image: "",
    repoUrl: "",
    liveUrl: "",
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "FastAPI", "Python", "PostgreSQL", "Google Gemini", "YouTube Data API", "OpenCV", "python-docx", "Stripe", "Docker"],
    bullets: [
      "Dos fuentes: subida de mp4 o una URL de YouTube analizada de forma nativa por Gemini — el video nunca se descarga.",
      "Seis tonos de documentación (técnico, tutorial, reunión, voz en off, investigación, marketing) con capítulos y citas opcionales.",
      "Salidas estructuradas: secciones con marca de tiempo, capturas extraídas automáticamente (OpenCV), un mapa mental y un DOCX generado.",
      "Autenticación, roles y facturación: Argon2 + JWT, niveles admin/pago/gratis, minutos de prueba y checkout con Stripe.",
      "Gobernanza de administración: prompts recargables en caliente, seguimiento de tokens y USD por trabajo, redacción de PII y controles alineados a ISO 27001.",
    ],
  },
  {
    title: "OrchestrAI",
    description:
      "Orquestador visual de debates entre LLMs: Claude, GPT, Gemini y Grok responden la misma pregunta, se critican entre sí por rondas y convergen en una sola respuesta con fuentes. En modo agentes, los nodos pueden buscar en la web, leer documentos del proyecto y ejecutar código en un sandbox antes de opinar, con presupuestos por nodo y puertas de aprobación humana. Construido como producto completo: editor de flujos en Next.js, motor DAG asíncrono en FastAPI, PostgreSQL, cobros con Stripe (planes y créditos) y un servidor MCP para que agentes externos como Claude Code ejecuten flujos.",
    image: "",
    repoUrl: "",
    liveUrl: "",
    tech: ["Python", "TypeScript", "FastAPI", "Next.js", "React", "React Flow", "Tailwind CSS", "SQLAlchemy", "Alembic", "PostgreSQL", "Stripe", "Docker", "MCP", "Auth.js", "SSE", "Anthropic", "OpenAI", "Google Gemini", "xAI Grok"],
    bullets: [
      "Construí un motor de ejecución DAG asíncrono (una tarea asyncio por nodo, fallo parcial k-de-n, timeouts por nodo, reintentos y cancelación) que transmite estado y costo por SSE y recalcula los totales tras cada nodo y cada paso de agente.",
      "Implementé un único bucle de uso de herramientas sobre Anthropic, OpenAI (Chat Completions y Responses API) y el function calling de Gemini, con degradación de parámetros y reenvío de firmas de razonamiento, más 6 herramientas integradas y servidores MCP externos.",
      "Diseñé el modo agentes con un sandbox Docker para código (sin red, raíz de solo lectura, límites de memoria y procesos), presupuestos en USD por agente, tope de pasos, puertas de aprobación humana y búsqueda web enrutada al modelo más barato con grounding de cada proveedor.",
      "Publiqué 81 plantillas de flujo validadas (propuestas de investigación, MBA, debates conversacionales), 27 expertos bilingües y un generador con IA que convierte una descripción en texto en un grafo validado y ordenado automáticamente.",
      "Implementé autenticación y cobros de SaaS: Argon2id, JWT de 15 minutos con tokens de refresco rotativos y detección de reutilización, RBAC basado en datos, bitácora de auditoría, planes con créditos mensuales, suscripciones con Stripe y claves propias (BYOK), mapeados a controles ISO/IEC 27001.",
      "Expuse el producto como servidor MCP con claves de API con permisos por ámbito emitidas por el administrador, para que Claude Code o Cursor listen, generen, ejecuten y esperen flujos y lean sus informes; respaldado por 21 archivos de prueba con 146 casos en verde.",
    ],
  },
  {
    title: "MAT",
    description:
      "MAT (Multi-Agent Trading) es una plataforma de trading autoalojada e impulsada por IA donde agentes LLM especializados —técnico, fundamental, macro, sentimiento, riesgo y asignación— colaboran para analizar los mercados y proponer operaciones en divisas, acciones, ETFs, cripto y materias primas, mientras código determinista y versionado impone cada límite de riesgo, tamaño de posición y ejecución. El principio: los LLMs proponen, el código determinista dispone.",
    image: "",
    repoUrl: "",
    liveUrl: "",
    tech: ["Python", "FastAPI", "Next.js", "React", "TypeScript", "PostgreSQL", "pgvector", "SQLAlchemy", "Redis", "arq", "Anthropic Claude", "OpenTelemetry", "Docker", "Caddy"],
    bullets: [
      "Pipeline multiagente de ~15 agentes LLM (orquestador, analistas, un debate de riesgo a 3 voces, asignación, decisión, memoria, monitor y reporte) cargados como plugins instalables.",
      "Guardarraíles deterministas como autoridad final: cada agente calcula sus features en código reproducible y probado, y cae a una ruta determinista si el LLM no está disponible — los límites de riesgo y el sizing nunca pueden ampliarse por el razonamiento del modelo ni por inyección de prompts.",
      "Modos de trading en papel y en vivo con aprobación humana en el flujo, kill switch, aritmética monetaria con Decimal, marcas de tiempo solo en UTC y trazabilidad paso a paso en cada ciclo.",
      "Motor de backtesting determinista que reutiliza el runtime en vivo con datos point-in-time y modos record/replay, señalando advertencias de sesgo de anticipación (look-ahead) del LLM.",
      "Plataforma de producción: autenticación JWT/RBAC/2FA, memoria con pgvector, observabilidad OpenTelemetry con seguimiento de costos de LLM y un dashboard en Next.js generado desde el esquema OpenAPI de la API.",
    ],
  },
  {
    title: "CrabAir",
    description:
      "Una extensión de VS Code que convierte la actividad de Claude Code en una animación en vivo: un avioncito pilotado por el cangrejo mascota de Claude despega, vuela y aterriza en tiempo real según lo que hace Claude. La extensión integra un servidor local de \"torre de control\" que convierte cada evento de los hooks de Claude Code en una escena animada dentro del editor.",
    image: "",
    repoUrl: "https://github.com/ChristianFonseca/crabair",
    liveUrl: "https://marketplace.visualstudio.com/items?itemName=ChristianFonseca.crabair",
    tech: ["JavaScript", "Node.js", "VS Code Extension API", "HTTP server", "Server-Sent Events", "Webview", "SVG", "CSS animation", "Claude Code hooks", "Anthropic Claude"],
    bullets: [
      "Vuelo en tiempo real según Claude Code: taxi al iniciar una sesión, despegue al enviar un prompt, crucero mientras trabaja y aterrizaje automático cuando termina el turno de Claude (se cancela si vuelves a escribir).",
      "Un banner remolcado muestra exactamente qué está haciendo Claude ahora (leer un archivo, correr un comando, hacer una pregunta), y cada subagente delegado despega como su propio avión de escolta.",
      "La extensión misma es la 'torre de control': un servidor HTTP en Node sin dependencias que normaliza cada evento de hook y lo envía a los webviews de VS Code vía postMessage y a los navegadores vía Server-Sent Events.",
      "Instalación/desinstalación con un clic de los hooks globales de Claude Code en ~/.claude/settings.json (con respaldo), un botón en la barra de estado, y renderizado en la barra lateral, un panel o un segundo monitor en localhost:4747.",
      "Extras: modo día/noche, sonido de motor opcional, turbulencia ante fallos de herramientas, un minijuego para la espera con skins de avión desbloqueables y un resumen post-vuelo de la sesión.",
    ],
  },
  {
    title: "Atalaya",
    description:
      "Plataforma personal de monitoreo y seguridad que hoy uso solo en mi propia infraestructura: el VPS donde alojo mis proyectos web y mi PC local. Avisa solo cuando algo requiere acción, y reemplazó cuatro monitores solapados cuyas 100 alertas en una semana fueron todas ruido. Un agente en Bash con privilegios y sin red recolecta hechos del host cada minuto, y un hub en Node.js/TypeScript sin privilegios evalúa 68 tipos de chequeo, analiza el tráfico de Cloudflare y vigila los backups externos.",
    image: "",
    repoUrl: "",
    liveUrl: "",
    tech: ["TypeScript", "Node.js", "SQLite", "Bash", "Docker", "Docker Compose", "systemd", "Zod", "YAML", "Cloudflare", "Cloudflare GraphQL API", "Telegram Bot API", "healthchecks.io", "Claude Code", "nginx", "rclone", "Cloudflare R2", "PowerShell"],
    bullets: [
      "Audité el monitoreo existente antes de escribir código: de 100 alertas enviadas en una semana, ninguna correspondió a un incidente real, y dos reglas sin acotar produjeron el 68 %.",
      "Separé los privilegios desde el diseño. Un agente en Bash con root y sin red escribe hechos en un spool. El hub en Node.js lee ese spool montado en solo lectura, sin root, con sistema de archivos de solo lectura, sin capabilities y sin el socket de Docker.",
      "Construí un motor de alertas con huellas estables, enfriamiento por regla, resolución automática, agrupación de intermitencias y silencios con vencimiento y motivo obligatorio. Tiene además un presupuesto de falsos positivos que degrada las reglas ruidosas, nunca las de integridad.",
      "Integré la analítica REST y GraphQL de Cloudflare en una nota de seguridad de 0 a 100 por zona, donde cada descuento trae su arreglo, un mapa mundial sin conexión del origen de los ataques y una separación de los 5xx de la app frente a los reinicios.",
      "Añadí un revisor con IA (Claude) de solo lectura que trata las rutas y los User-Agent escritos por atacantes como posible inyección de prompts. Propone reparaciones que solo se ejecutan desde una lista blanca de 6 scripts idempotentes.",
      "Vigilé los backups cifrados de Postgres fuera del servidor: frescura, niveles semanal y mensual, pruebas de restauración y si el bloqueo del bucket de verdad impide borrar con el token del propio servidor.",
    ],
  },
  {
    title: "VSC Splitter",
    description:
      "Aplicación de escritorio para Windows pensada para quienes trabajan con muchas ventanas de VS Code en varios monitores. Muestra los monitores con su disposición real, permite dividir cada pantalla en zonas a medida y arrastrar las ventanas a ellas, y luego las mueve y redimensiona con un clic, recuperando la distribución tras los reinicios. Desarrollada en C# con WPF sobre .NET 10 y las API Win32 y DWM para una colocación exacta al píxel.",
    image: "",
    images: ["/projects/vsc-splitter/01-editor-4-monitores.webp", "/projects/vsc-splitter/02-zonas-a-medida.webp"],
    repoUrl: "https://github.com/ChristianFonseca/monitor_screen_splitter",
    liveUrl: "",
    tech: ["C#", ".NET 10", "WPF", "Win32 API", "DWM API", "DisplayConfig API", "xUnit", "System.Text.Json", "Windows Forms", "PowerShell"],
    bullets: [
      "Construí un editor visual que replica la disposición real de los monitores, con 14 plantillas, cuadrículas de hasta 12×12, bordes arrastrables, zonas unidas, espaciado y márgenes.",
      "Implementé una colocación exacta al píxel midiendo los bordes invisibles de cada ventana mediante los límites de marco de DWM, para que las ventanas vecinas queden alineadas sin huecos ni solapes.",
      "Diseñé un cálculo entero de filas y columnas en el que las zonas contiguas comparten bordes redondeados, lo que mantiene la división exacta con cualquier proporción, espaciado o margen; lo cubrí con pruebas unitarias en tamaños de monitor impares.",
      "Hice que los perfiles sobrevivan a los reinicios: identifico cada ventana por el nombre de su carpeta en el título de VS Code, conservo su zona cuando se cierra y la recoloco automáticamente cuando reaparece.",
      "Añadí herramientas de recuperación: captura de la distribución actual por solapamiento, reapertura de carpetas faltantes a partir del storage.json de VS Code, modo bandeja e inicio con Windows.",
      "Escribí 56 pruebas automatizadas, incluida una prueba de integración que mueve una ventana real y verifica su marco visible al píxel.",
    ],
  },
]

export const projectsData = { en: { items: projectsEn }, es: { items: projectsEs } }
