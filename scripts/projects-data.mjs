// Datos de los proyectos reales (bilingüe). Fuente única compartida por
// scripts/seed-projects.mjs (DB) y el actualizador de static-data.json.

export const projectsEn = [
  {
    title: "Furtale",
    description:
      "A full-stack platform for managing pet health records. Owners keep their pets' profiles, photos and veterinary documents in one place, share them read-only with a vet, and query an AI assistant grounded in each pet's real medical history.",
    image: "",
    repoUrl: "",
    liveUrl: "https://furtale.pet",
    tech: ["TypeScript", "Next.js", "React", "Python", "FastAPI", "PostgreSQL", "pgvector", "Anthropic Claude", "Google Gemini", "S3 / MinIO", "Docker"],
    bullets: [
      "AI document extraction: photograph a lab report and Claude auto-fills the structured fields via forced tool use (owner reviews before saving).",
      "Per-pet RAG chat with citations, grounded in that pet's records using local fastembed embeddings stored in PostgreSQL pgvector.",
      "Security-first auth and RBAC: JWT with rotating refresh tokens, Argon2 hashing, brute-force lockout, Google OAuth and an append-only audit log.",
      "Time-limited, revocable read-only sharing with veterinarians; multi-role clinic accounts.",
      "Rich pet management: photos, weight tracking, journal, voice-note transcription, notifications, full EN/ES i18n and dark mode.",
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
    title: "OrchestraIA",
    description:
      "A visual drag-and-drop orchestrator for multi-agent LLM debate. Wire a question into a graph of model nodes — each an AI provider — whose answers flow into orchestrator nodes that debate and synthesize them, converging on a single best answer: the Mixture-of-Agents pattern as a visual graph.",
    image: "",
    repoUrl: "",
    liveUrl: "",
    tech: ["Python", "TypeScript", "FastAPI", "Next.js", "React", "React Flow", "SQLAlchemy", "PostgreSQL", "Anthropic", "OpenAI", "Google Gemini", "xAI Grok", "SSE", "Tailwind CSS"],
    bullets: [
      "Visual debate-graph builder (React Flow) with Input, Model, Orchestrator and Final nodes chainable into deep debate rounds.",
      "Multi-provider fan-out across Anthropic, OpenAI, Google Gemini and xAI Grok, toggled at runtime from an admin panel.",
      "Async DAG execution engine (asyncio.TaskGroup) with per-node timeouts, retries and k-of-n partial-failure tolerance.",
      "Live run streaming over SSE with full token, cost (USD) and latency accounting per node.",
      "Enterprise auth and security: JWT with Argon2id, data-driven RBAC, rate limiting, audit logging and ISO 27001 mapping.",
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
]

export const projectsEs = [
  {
    title: "Furtale",
    description:
      "Una plataforma full-stack para gestionar los registros de salud de las mascotas. Los dueños guardan los perfiles, fotos y documentos veterinarios de sus mascotas en un solo lugar, los comparten en modo solo lectura con un veterinario y consultan a un asistente de IA basado en el historial médico real de cada mascota.",
    image: "",
    repoUrl: "",
    liveUrl: "https://furtale.pet",
    tech: ["TypeScript", "Next.js", "React", "Python", "FastAPI", "PostgreSQL", "pgvector", "Anthropic Claude", "Google Gemini", "S3 / MinIO", "Docker"],
    bullets: [
      "Extracción de documentos con IA: fotografías un informe de laboratorio y Claude completa los campos estructurados mediante uso forzado de herramientas (el dueño revisa antes de guardar).",
      "Chat RAG por mascota con citas, basado en los registros de esa mascota usando embeddings locales fastembed almacenados en PostgreSQL pgvector.",
      "Autenticación y RBAC con enfoque en seguridad: JWT con refresh rotativo, hashing Argon2, bloqueo por fuerza bruta, Google OAuth y un log de auditoría append-only.",
      "Acceso solo lectura, temporal y revocable, para veterinarios; cuentas de clínica multi-rol.",
      "Gestión completa de la mascota: fotos, control de peso, bitácora, transcripción de notas de voz, notificaciones, i18n EN/ES y modo oscuro.",
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
    title: "OrchestraIA",
    description:
      "Un orquestador visual de arrastrar y soltar para el debate multi-agente entre LLMs. Conectas una pregunta a un grafo de nodos de modelo —cada uno un proveedor de IA— cuyas respuestas fluyen hacia nodos orquestadores que las debaten y sintetizan, convergiendo en una única mejor respuesta: el patrón Mixture-of-Agents como un grafo visual.",
    image: "",
    repoUrl: "",
    liveUrl: "",
    tech: ["Python", "TypeScript", "FastAPI", "Next.js", "React", "React Flow", "SQLAlchemy", "PostgreSQL", "Anthropic", "OpenAI", "Google Gemini", "xAI Grok", "SSE", "Tailwind CSS"],
    bullets: [
      "Constructor visual de grafos de debate (React Flow) con nodos Input, Model, Orchestrator y Final encadenables en rondas profundas.",
      "Distribución multi-proveedor entre Anthropic, OpenAI, Google Gemini y xAI Grok, activables en tiempo de ejecución desde un panel de administración.",
      "Motor de ejecución de DAG asíncrono (asyncio.TaskGroup) con timeouts por nodo, reintentos y tolerancia a fallos parciales k-de-n.",
      "Streaming de ejecución en vivo por SSE con contabilidad completa de tokens, costo (USD) y latencia por nodo.",
      "Autenticación y seguridad empresarial: JWT con Argon2id, RBAC basado en datos, rate limiting, log de auditoría y mapeo a ISO 27001.",
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
]

export const projectsData = { en: { items: projectsEn }, es: { items: projectsEs } }
