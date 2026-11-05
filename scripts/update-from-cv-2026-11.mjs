// Cambios del CV actualizado (noviembre 2026), idempotente: se puede correr varias veces.
//  - Experiencia: nuevo puesto actual en Entel (Senior MLOps Engineer), arriba del todo.
//  - Consultoría: Coderio terminó en octubre de 2026 (deja de ser puesto actual).
//  - Investigación (UTEC): el logro de clasificación de resonancias con Deep Learning.
//  - FAQ de industrias: añade telecomunicaciones (Entel).
// Antes de tocar una sección guarda una revisión en section_revisions, igual que el admin.
// Uso: DATABASE_URL=... node scripts/update-from-cv-2026-11.mjs   (base de datos)
//      node scripts/update-from-cv-2026-11.mjs --static          (lib/content/static-data.json)

const ENTEL = {
  en: {
    role: "Senior MLOps Engineer",
    org: "Entel",
    period: "May 2025 - Present",
    current: true,
    bullets: [
      "Led the Guardian Agents squad, overseeing availability and operational health of ML models across AWS and OCI.",
      "Led end-to-end deployment of Sinfonía, an in-house transcription and insights engine, across staging and production.",
      "Designed and implemented DevOps and LLMOps practices for Sinfonía's transcription, analytics, and AI insights platform.",
    ],
    tech: ["Python", "Docker", "Agents", "LLM", "OpenAI", "Bedrock", "Next.js", "AWS", "OCI"],
  },
  es: {
    role: "Ingeniero Senior de MLOps",
    org: "Entel",
    period: "Mayo 2025 - Presente",
    current: true,
    bullets: [
      "Lideré el squad Guardian Agents, a cargo de la disponibilidad y la salud operativa de los modelos de ML en AWS y OCI.",
      "Lideré el despliegue de extremo a extremo de Sinfonía, un motor propio de transcripción e insights, en staging y producción.",
      "Diseñé e implementé prácticas de DevOps y LLMOps para la plataforma de transcripción, analítica e insights de IA de Sinfonía.",
    ],
    tech: ["Python", "Docker", "Agents", "LLM", "OpenAI", "Bedrock", "Next.js", "AWS", "OCI"],
  },
}

const CODERIO_PERIOD = { en: "October 2025 - October 2026", es: "Octubre 2025 - Octubre 2026" }

const UTEC_MRI = {
  en: "Analyzed multimodal brain MRI to classify ischemic stroke, hemorrhagic stroke, and brain tumors using Deep Learning.",
  es: "Analicé resonancias magnéticas cerebrales multimodales para clasificar ictus isquémicos, ictus hemorrágicos y tumores cerebrales con Deep Learning.",
}
const UTEC_MRI_MARK = { en: "MRI", es: "resonancia" }

const FAQ_INDUSTRIES = {
  en: ["insurance (Rimac), ", "insurance (Rimac), telecommunications (Entel), "],
  es: ["seguros (Rimac), ", "seguros (Rimac), telecomunicaciones (Entel), "],
}

// Cada parche recibe { en, es } y devuelve la lista de cambios hechos (vacía si ya estaba)
const PATCHES = {
  experience(data) {
    const done = []
    for (const loc of ["en", "es"]) {
      const items = data[loc]?.items
      if (!items || items.some((i) => i.org === "Entel")) continue
      items.unshift(structuredClone(ENTEL[loc]))
      done.push(`${loc}: Entel añadido`)
    }
    return done
  },
  teaching(data) {
    const done = []
    for (const loc of ["en", "es"]) {
      const item = data[loc]?.items?.find((i) => i.org === "Coderio")
      if (!item || (item.period === CODERIO_PERIOD[loc] && item.current === false)) continue
      item.period = CODERIO_PERIOD[loc]
      item.current = false
      done.push(`${loc}: Coderio terminado`)
    }
    return done
  },
  "research-projects"(data) {
    const done = []
    for (const loc of ["en", "es"]) {
      const item = data[loc]?.items?.find((i) => /UTEC|Ingeniería y Tecnología/.test(i.institution ?? ""))
      if (!item || item.bullets.some((b) => b.includes(UTEC_MRI_MARK[loc]))) continue
      // en el CV va justo después de la interfaz en C++
      const at = item.bullets.findIndex((b) => b.includes("C++"))
      item.bullets.splice(at >= 0 ? at + 1 : item.bullets.length, 0, UTEC_MRI[loc])
      done.push(`${loc}: logro de resonancias en UTEC`)
    }
    return done
  },
  faq(data) {
    const done = []
    for (const loc of ["en", "es"]) {
      const [from, to] = FAQ_INDUSTRIES[loc]
      const item = data[loc]?.items?.find((i) => i.answer.includes(from) && !i.answer.includes("Entel"))
      if (!item) continue
      item.answer = item.answer.replace(from, to)
      done.push(`${loc}: Entel en la FAQ de industrias`)
    }
    return done
  },
}

if (process.argv.includes("--static")) {
  const { readFileSync, writeFileSync } = await import("node:fs")
  const { fileURLToPath } = await import("node:url")
  const file = fileURLToPath(new URL("../lib/content/static-data.json", import.meta.url))
  const raw = readFileSync(file, "utf8")
  const json = JSON.parse(raw)
  for (const [slug, patch] of Object.entries(PATCHES)) {
    const section = json.sections.find((s) => s.slug === slug)
    const done = section ? patch(section.data) : []
    console.log(`${slug}: ${done.length ? done.join("; ") : "sin cambios"}`)
  }
  writeFileSync(file, JSON.stringify(json, null, 2) + (raw.endsWith("\n") ? "\n" : ""))
} else {
  const { default: postgres } = await import("postgres")
  const { DATABASE_URL } = process.env
  if (!DATABASE_URL) {
    console.error("Falta DATABASE_URL")
    process.exit(1)
  }
  const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 })
  for (const [slug, patch] of Object.entries(PATCHES)) {
    const rows = await sql`select id, data from sections where slug = ${slug}`
    if (!rows.length) {
      console.log(`${slug}: no existe, se omite`)
      continue
    }
    const { id, data } = rows[0]
    const next = structuredClone(data)
    const done = patch(next)
    if (!done.length) {
      console.log(`${slug}: sin cambios`)
      continue
    }
    await sql.begin(async (tx) => {
      await tx`insert into section_revisions (section_id, data, saved_by) values (${id}, ${tx.json(data)}, 'script:update-from-cv')`
      await tx`update sections set data = ${tx.json(next)}, updated_at = now() where id = ${id}`
    })
    console.log(`${slug}: ${done.join("; ")} (revisión previa guardada)`)
  }
  await sql.end()
}
