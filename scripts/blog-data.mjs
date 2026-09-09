// Metadatos de los posts del blog (bilingüe). El cuerpo vive en scripts/blog/<file>.md,
// con EN primero, un delimitador <!--===ES===--> en su propia línea, y luego ES.
// Fuente única para scripts/seed-blog.mjs. published_at define el orden en /blog.
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const DELIM = "<!--===ES===-->"

function loadBody(file) {
  const raw = readFileSync(join(here, "blog", file), "utf8")
  const idx = raw.indexOf(DELIM)
  if (idx === -1) throw new Error(`Falta el delimitador ${DELIM} en ${file}`)
  const body = raw.slice(0, idx).trim()
  const body_es = raw.slice(idx + DELIM.length).trim()
  if (!body || !body_es) throw new Error(`Cuerpo EN o ES vacío en ${file}`)
  return { body, body_es }
}

// Cada entrada: slug, title(+_es), excerpt(+_es), tags[], published_at, file.
const META = [
  {
    slug: "rag-that-cites-your-data",
    file: "rag.md",
    title: "RAG that cites your data: grounding answers you can audit",
    title_es: "RAG que cita tus datos: respuestas ancladas y auditables",
    excerpt:
      "A general model answers from memory — useless for your facts. Here's how to ground every answer in your own data with retrieval-augmented generation, and make the model cite what it used.",
    excerpt_es:
      "Un modelo general responde de memoria: inútil para tus datos. Así anclo cada respuesta en tus propios datos con RAG y hago que el modelo cite lo que usó.",
    tags: ["RAG", "LLM", "pgvector", "PostgreSQL", "AI"],
    published_at: "2026-07-15T13:00:00Z",
  },
  {
    slug: "llms-propose-code-disposes",
    file: "guardrails.md",
    title: "LLMs propose, deterministic code disposes: guardrails for agentic systems",
    title_es: "Los LLM proponen, el código determinista decide: guardrails para sistemas agénticos",
    excerpt:
      "The moment a model can act, you need an answer for when it's wrong — or hijacked by prompt injection. My rule: let the model be creative, let deterministic code be in charge.",
    excerpt_es:
      "En cuanto un modelo puede actuar, necesitas una respuesta para cuando se equivoca o lo secuestra una inyección de prompts. Mi regla: que el modelo sea creativo y que el código determinista mande.",
    tags: ["LLM", "Agents", "Security", "Zod", "AI"],
    published_at: "2026-07-29T13:00:00Z",
  },
  {
    slug: "photo-to-structured-data",
    file: "extraction.md",
    title: "From photo to structured data you can trust",
    title_es: "De la foto a datos estructurados en los que puedes confiar",
    excerpt:
      "OCR was never the hard part. Turning a photo of a form into validated, trustworthy data — and knowing when not to trust it — is. A schema-first pipeline with validation and a human in the loop.",
    excerpt_es:
      "El OCR nunca fue lo difícil. Convertir la foto de un formulario en datos validados y confiables, y saber cuándo no confiar, sí lo es. Un pipeline con esquema primero, validación y un humano en el flujo.",
    tags: ["AI", "Multimodal", "Document AI", "Zod", "Data"],
    published_at: "2026-08-06T13:00:00Z",
  },
  {
    slug: "reproducible-resumable-ml",
    file: "reproducible-ml.md",
    title: "Reproducible, resumable, honest: the plumbing behind ML results that hold up",
    title_es: "Reproducible, reanudable, honesto: la plomería detrás de resultados de ML que se sostienen",
    excerpt:
      "A run you can't resume or reproduce isn't an experiment — it's an anecdote. Checkpoint the whole training state, make resume the default, and report honest metrics over flattering ones.",
    excerpt_es:
      "Una corrida que no puedes reanudar ni reproducir no es un experimento: es una anécdota. Guarda todo el estado del entrenamiento, haz que reanudar sea el default y reporta métricas honestas antes que halagadoras.",
    tags: ["Machine Learning", "PyTorch", "MLOps", "Reproducibility"],
    published_at: "2026-08-15T13:00:00Z",
  },
  {
    slug: "multi-cloud-worth-it",
    file: "multicloud.md",
    title: "Multi-cloud data architecture: worth it, if you couple on purpose",
    title_es: "Arquitectura de datos multi-cloud: vale la pena, si te acoplas a propósito",
    excerpt:
      "Multi-cloud is sold as resilience and becomes three half-learned platforms. It pays off when your data is portable, governance is unified, and every vendor coupling is a deliberate choice.",
    excerpt_es:
      "El multi-cloud se vende como resiliencia y termina en tres plataformas a medio aprender. Rinde cuando tus datos son portables, el gobierno está unificado y cada acoplamiento al proveedor es una decisión deliberada.",
    tags: ["Cloud", "Data Engineering", "Architecture", "Terraform", "Governance"],
    published_at: "2026-08-23T13:00:00Z",
  },
  {
    slug: "anatomy-of-a-real-rce",
    file: "rce-cloudflare.md",
    title: "Anatomy of a real RCE: patching CVE-2025-55182 and hardening with Cloudflare",
    title_es: "Anatomía de un RCE real: parchear CVE-2025-55182 y endurecer con Cloudflare",
    excerpt:
      "A production Next.js app I run got hit by a real remote code execution that read its environment. The honest write-up: detection, patch, secrets rotation, and layered defense at the edge.",
    excerpt_es:
      "Una app Next.js en producción que administro sufrió un RCE real que leyó su entorno. La crónica honesta: detección, parche, rotación de secretos y defensa en capas en el borde.",
    tags: ["Security", "Next.js", "Cloudflare", "RCE", "DevOps"],
    published_at: "2026-09-07T13:00:00Z",
  },
]

export const posts = META.map((m) => {
  const { body, body_es } = loadBody(m.file)
  const { file, ...rest } = m
  return { ...rest, body, body_es }
})
