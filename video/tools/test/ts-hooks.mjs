// Hook mínimo para correr módulos .ts del repo con el type-stripping de Node:
// resuelve el alias "@/..." y los imports relativos sin extensión a su archivo .ts.
import { existsSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, resolve as resolvePath } from "node:path"

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "../../..")

function asTs(base) {
  for (const cand of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) if (existsSync(cand)) return pathToFileURL(cand).href
  return null
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const url = asTs(resolvePath(ROOT, specifier.slice(2)))
    if (url) return { url, shortCircuit: true }
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.endsWith(".ts") && !/\.[a-z]+$/.test(specifier)) {
    const url = asTs(resolvePath(dirname(fileURLToPath(context.parentURL)), specifier))
    if (url) return { url, shortCircuit: true }
  }
  return next(specifier, context)
}
