import type { SectionKind } from "./schemas"

// Especificación de campos que el editor genérico del admin renderiza por tipo de sección.
// "tags" = lista de strings editada como texto separado por comas.
// "bullets" = lista de strings editada como textarea con un ítem por línea.
export type SubFieldSpec = {
  key: string
  label: string
  type: "text" | "textarea" | "tags" | "bullets" | "checkbox" | "image" | "gallery" | "linktags"
  hint?: string
  // Para type "image"/"gallery": proporción del editor de recorte (ancho/alto).
  aspect?: number
  // Campo igual en ambos idiomas (imágenes, URLs, tecnologías): editarlo actualiza
  // EN y ES a la vez y no exige traducción. Los tipos image/gallery ya son compartidos.
  shared?: boolean
}

export type FieldSpec =
  | { key: string; label: string; type: "text" | "textarea" | "image"; hint?: string; aspect?: number; shared?: boolean }
  | { key: string; label: string; type: "tags"; hint?: string; shared?: boolean }
  | { key: string; label: string; type: "items"; itemName: string; titleKey: string; fields: SubFieldSpec[] }

export const kindSpecs: Record<SectionKind, FieldSpec[]> = {
  hero: [
    { key: "name", label: "Nombre", type: "text" },
    { key: "tagline", label: "Tagline", type: "text" },
    { key: "location", label: "Ubicación", type: "text" },
    { key: "photo", label: "Foto de perfil", type: "image", aspect: 1 },
    {
      key: "certs",
      label: "Credenciales",
      type: "items",
      itemName: "credencial",
      titleKey: "label",
      fields: [
        { key: "count", label: "Contador (ej. 13x — opcional)", type: "text" },
        { key: "label", label: "Etiqueta", type: "text" },
      ],
    },
  ],
  about: [{ key: "text", label: "Texto de About Me", type: "textarea" }],
  skills: [
    {
      key: "groups",
      label: "Grupos de skills",
      type: "items",
      itemName: "grupo",
      titleKey: "name",
      fields: [
        { key: "name", label: "Nombre del grupo", type: "text" },
        { key: "color", label: "Color", type: "text", hint: "purple | blue | emerald | yellow | orange | cyan | rose" },
        {
          key: "badges",
          label: "Skills",
          type: "linktags",
          shared: true,
          hint: "cada skill puede tener un enlace opcional (web/docs)",
        },
      ],
    },
    {
      key: "languages",
      label: "Idiomas",
      type: "items",
      itemName: "idioma",
      titleKey: "name",
      fields: [
        { key: "name", label: "Idioma", type: "text" },
        { key: "level", label: "Nivel", type: "text" },
      ],
    },
  ],
  projects: [
    {
      key: "items",
      label: "Proyectos",
      type: "items",
      itemName: "proyecto",
      titleKey: "title",
      fields: [
        { key: "title", label: "Título", type: "text" },
        { key: "description", label: "Descripción", type: "textarea" },
        { key: "images", label: "Fotos (carrusel)", type: "gallery", aspect: 16 / 9 },
        {
          key: "repoUrl",
          label: "Repositorio (GitHub)",
          type: "text",
          shared: true,
          hint: "si lo llenas, muestra el chip 'Open source' con enlace al repo",
        },
        {
          key: "liveUrl",
          label: "Sitio en vivo",
          type: "text",
          shared: true,
          hint: "si lo llenas, muestra el chip 'Live' (ej. https://furtale.pet). Sin sitio ni repo = 'Private'",
        },
        {
          key: "tech",
          label: "Tecnologías",
          type: "tags",
          shared: true,
          hint: "separadas por comas — la primera es la principal",
        },
        { key: "bullets", label: "Detalle (modal)", type: "bullets", hint: "uno por línea — se muestran al abrir el proyecto" },
      ],
    },
  ],
  research: [
    {
      key: "items",
      label: "Proyectos de investigación",
      type: "items",
      itemName: "proyecto",
      titleKey: "title",
      fields: [
        { key: "title", label: "Título", type: "text" },
        { key: "description", label: "Descripción", type: "textarea" },
        { key: "bullets", label: "Logros", type: "bullets", hint: "uno por línea" },
        { key: "tech", label: "Tecnologías", type: "tags", hint: "separadas por comas" },
      ],
    },
  ],
  faq: [
    {
      key: "items",
      label: "Preguntas frecuentes",
      type: "items",
      itemName: "pregunta",
      titleKey: "question",
      fields: [
        { key: "question", label: "Pregunta", type: "text" },
        { key: "answer", label: "Respuesta", type: "textarea" },
      ],
    },
  ],
  experience: [
    {
      key: "items",
      label: "Puestos",
      type: "items",
      itemName: "puesto",
      titleKey: "role",
      fields: [
        { key: "role", label: "Cargo", type: "text" },
        { key: "org", label: "Empresa / Institución", type: "text" },
        { key: "period", label: "Periodo", type: "text", hint: "ej. May 2025 - Present" },
        { key: "current", label: "Puesto actual (badge resaltado)", type: "checkbox" },
        { key: "bullets", label: "Logros", type: "bullets", hint: "uno por línea" },
        { key: "tech", label: "Tecnologías", type: "tags", hint: "separadas por comas" },
      ],
    },
  ],
}
