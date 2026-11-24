/**
 * Convierte las tablas GFM en fichas de lectura para las hojas estrechas del
 * lector de imágenes. No modifica los Markdown de origen.
 *
 * El buscador y el renderizador DEBEN usar esta misma normalización para que
 * los índices de coincidencias sigan apuntando a la misma hoja.
 */
export function prepareBookMarkdown(markdown: string): string {
  const lines = markdown.split(/\r?\n/u);
  const output: string[] = [];

  const isRow = (line: string): boolean => /^\s*\|.*\|\s*$/u.test(line);
  const cellsOf = (line: string): string[] =>
    line.trim().replace(/^\|/u, "").replace(/\|$/u, "")
      .split(/(?<!\\)\|/u)
      .map((cell) => cell.trim().replace(/\\\|/gu, "|"));
  const isSeparator = (line: string, count: number): boolean => {
    if (!isRow(line)) return false;
    const cells = cellsOf(line);
    return cells.length === count && cells.every((cell) => /^:?-{3,}:?$/u.test(cell));
  };

  for (let i = 0; i < lines.length; i++) {
    const headerLine = lines[i];
    if (!isRow(headerLine)) {
      output.push(headerLine);
      continue;
    }
    const headers = cellsOf(headerLine);
    if (headers.length < 2 || i + 1 >= lines.length || !isSeparator(lines[i + 1], headers.length)) {
      output.push(headerLine);
      continue;
    }

    // Una línea en blanco garantiza que el bloque no se una al párrafo previo.
    if (output.length && output[output.length - 1].trim()) output.push("");
    i += 1; // Saltear la regla de separación de Markdown.
    while (i + 1 < lines.length && isRow(lines[i + 1])) {
      const values = cellsOf(lines[++i]);
      // Si una fila está mal formada, conservar su contenido en vez de perderlo.
      if (values.length !== headers.length) {
        output.push(values.join(" · "));
        output.push("");
        continue;
      }
      const record = values.map((value, index) => `${headers[index]}: ${value || "—"}`);
      output.push(record.join(". "));
      output.push("");
    }
  }
  return output.join("\n");
}
