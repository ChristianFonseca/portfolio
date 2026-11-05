// Forma de cada proyecto en el mosaico de la landing. Vive aquí (y no en el
// componente) porque el editor del admin la usa para avisar cuál se ve grande.
//  - lg (3 columnas): con 3+ proyectos el primero ocupa 2×2 y los dos siguientes la
//    columna derecha; después van filas de 3. Si la última fila queda con 1 tarjeta,
//    esa ocupa la fila entera ("full"); si quedan 2, la primera ocupa dos ("wide").
//  - md (2 columnas): la destacada ocupa una fila y, si sobra una suelta al final,
//    también.
export type Tile = { featured: boolean; lg: "normal" | "wide" | "full"; mdFull: boolean }

export function tileOf(i: number, n: number): Tile {
  const featured = n >= 3 && i === 0
  const head = n >= 3 ? 3 : 0
  const rem = (n - head) % 3
  let lg: Tile["lg"] = "normal"
  if (i >= head && rem === 1 && i === n - 1) lg = "full"
  if (i >= head && rem === 2 && i === n - 2) lg = "wide"
  const mdCount = n >= 3 ? n - 1 : n
  const mdFull = featured || (mdCount % 2 === 1 && i === n - 1)
  return { featured, lg, mdFull }
}

// Etiqueta para el admin: null si la tarjeta es normal
export function tileLabel(tile: Tile): string | null {
  if (tile.featured) return "Destacado: se ve grande"
  if (tile.lg === "full") return "Ocupa la fila entera"
  if (tile.lg === "wide") return "Tarjeta ancha"
  return null
}
