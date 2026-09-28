// Valida projects-data.mjs y la copia de respaldo contra el esquema real del sitio.
// Uso: node --import ./video/tools/test/register.mjs video/tools/test/validate-projects.mjs
const { localizedSchema } = await import("../../../lib/content/schemas.ts")
const { projectsData } = await import("../../../scripts/projects-data.mjs")
const staticData = (await import("../../../lib/content/static-data.json", { with: { type: "json" } })).default
const sec = staticData.sections.find((s) => s.slug === "public-projects")
for (const [name, data] of [["projects-data.mjs", projectsData], ["static-data.json", sec.data]]) {
  const r = localizedSchema("projects").safeParse(data)
  console.log(`${r.success ? "OK   " : "FALLO"} ${name}: ${r.success ? `${data.en.items.length} proyectos EN / ${data.es.items.length} ES válidos` : JSON.stringify(r.error.issues.slice(0, 3))}`)
  if (!r.success) process.exitCode = 1
}
