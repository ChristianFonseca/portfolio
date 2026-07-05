// Datos de los 4 proyectos reales (bilingüe). Fuente única compartida por
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
]

export const projectsData = { en: { items: projectsEn }, es: { items: projectsEs } }
