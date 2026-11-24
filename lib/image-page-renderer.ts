import "server-only";
import { createCanvas } from "@napi-rs/canvas";
import { fromMarkdown } from "mdast-util-from-markdown";
import { createHash } from "node:crypto";
import { prepareBookMarkdown } from "@/lib/book-markdown";

// Lector oficial: maquetación rasterizada en el servidor.
// No importa React ni envía el texto Markdown al navegador.
const WIDTH = 500;
const HEIGHT = 700;
const SCALE = 2;
const LEFT = 43;
const RIGHT = WIDTH - 43;
const TOP = 54;
const BOTTOM = HEIGHT - 57;
const MAX_CACHE = 4;
const MAX_IMAGE_CACHE = 48;
const imageCache = new Map<string, Promise<Buffer>>();

type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
};
type Block = {
  text: string;
  kind: "heading" | "paragraph" | "code";
  offset: number;
};
type RenderLine = {
  page: number;
  text: string;
  from: number;
  until: number;
  x: number;
  baseline: number;
  size: number;
  bold: boolean;
};
export type ImageLayout = {
  version: string;
  pageCount: number;
  fontSize: number;
  lines: RenderLine[];
  searchableText: string;
};
const cache = new Map<string, ImageLayout>();

function visibleText(node: MdNode): string {
  if (node.type === "image" || node.type === "imageReference") return "";
  if (node.type === "break") return "";
  if (node.type === "code") return `${node.value ?? ""}\n`;
  if (typeof node.value === "string") return node.value;
  return node.children?.map(visibleText).join("") ?? "";
}

// Las secciones en bloques mantienen el mismo orden de texto que la búsqueda
// de libro (mdast): párrafos y títulos no añaden separadores al índice global.
function blocksFromMarkdown(markdown: string): { blocks: Block[]; searchableText: string } {
  const root = fromMarkdown(prepareBookMarkdown(markdown)) as MdNode;
  const blocks: Block[] = [];
  let offset = 0;
  function visit(node: MdNode) {
    if (node.type === "paragraph" || node.type === "heading" || node.type === "code") {
      const text = visibleText(node);
      if (text) {
        blocks.push({ text, kind: node.type, offset });
        offset += text.length;
      }
      return;
    }
    if (node.children) node.children.forEach(visit);
    else if (typeof node.value === "string") offset += visibleText(node).length;
  }
  visit(root);
  return { blocks, searchableText: visibleText(root) };
}

type WrappedLine = { text: string; start: number; end: number };
function wrapWords(text: string, maxWidth: number, font: string): WrappedLine[] {
  const ctx = createCanvas(1, 1).getContext("2d");
  ctx.font = font;
  const lines: WrappedLine[] = [];
  let current = "";
  let start = -1;
  let end = -1;
  let whitespace = "";
  const flush = () => {
    if (current) lines.push({ text: current, start, end });
    current = "";
    start = -1;
    end = -1;
    whitespace = "";
  };
  const tokens = text.matchAll(/\S+|\s+/gu);
  for (const token of tokens) {
    const value = token[0];
    const index = token.index;
    if (/^\s+$/u.test(value)) {
      if (value.includes("\n") && value.includes("\n\n")) flush();
      else whitespace = " ";
      continue;
    }
    const proposal = current ? `${current}${whitespace}${value}` : value;
    if (current && ctx.measureText(proposal).width > maxWidth) flush();
    if (!current) start = index;
    // En caso de palabras extremadamente largas, cortamos entre letras para
    // impedir que salgan del margen (no debería ser común en narrativa).
    if (ctx.measureText(value).width > maxWidth) {
      if (current) flush();
      let chunk = "";
      let chunkStart = index;
      let cursor = index;
      for (const character of value) {
        if (chunk && ctx.measureText(chunk + character).width > maxWidth) {
          lines.push({ text: chunk, start: chunkStart, end: cursor });
          chunk = "";
          chunkStart = cursor;
        }
        chunk += character;
        cursor += character.length;
      }
      if (chunk) lines.push({ text: chunk, start: chunkStart, end: cursor });
      current = "";
      start = -1;
      end = -1;
      whitespace = "";
      continue;
    }
    current = current ? `${current}${whitespace}${value}` : value;
    end = index + value.length;
    whitespace = "";
  }
  flush();
  return lines;
}

export function getImageLayout(markdown: string, fontSize: number): ImageLayout {
  const key = createHash("sha256").update(`${fontSize}\0${markdown}`).digest("hex");
  const cached = cache.get(key);
  if (cached) return cached;
  const { blocks, searchableText } = blocksFromMarkdown(markdown);
  const lines: RenderLine[] = [];
  let page = 0;
  let y = TOP;
  for (const block of blocks) {
    const bold = block.kind === "heading";
    const size = bold ? Math.round(fontSize * 1.31) : fontSize;
    const font = `${bold ? "bold " : ""}${size}px Georgia`;
    const lineHeight = Math.round(size * 1.57);
    const wrapped = wrapWords(block.text, RIGHT - LEFT, font);
    if (bold && y > BOTTOM - lineHeight * 2) {
      page += 1;
      y = TOP;
    }
    for (const segment of wrapped) {
      if (y + lineHeight > BOTTOM) {
        page += 1;
        y = TOP;
      }
      lines.push({
        page,
        text: segment.text,
        from: block.offset + segment.start,
        until: block.offset + segment.end,
        x: LEFT,
        baseline: y + size,
        size,
        bold,
      });
      y += lineHeight;
    }
    y += Math.round(fontSize * (bold ? 0.95 : 0.65));
  }
  const layout: ImageLayout = {
    version: key.slice(0, 20),
    pageCount: Math.max(1, page + 1),
    fontSize,
    lines,
    searchableText,
  };
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
  cache.set(key, layout);
  return layout;
}

function fold(text: string) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
}
function hitOffsets(layout: ImageLayout, query: string, occurrence: number) {
  if (query.length < 2 || query.length > 80 || occurrence < 0 || occurrence > 10000) return null;
  let folded = "";
  const offsets: number[] = [];
  let original = 0;
  for (const char of layout.searchableText) {
    const normalized = fold(char);
    for (const letter of normalized) {
      folded += letter;
      offsets.push(original);
    }
    original += char.length;
  }
  const search = fold(query.trim());
  if (!search) return null;
  let start = 0;
  for (let index = 0; index <= occurrence; index++) {
    const found = folded.indexOf(search, start);
    if (found < 0) return null;
    if (index === occurrence) {
      return {
        from: offsets[found],
        until: offsets[found + search.length] ?? layout.searchableText.length,
      };
    }
    start = found + search.length;
  }
  return null;
}

export function pageForMatch(layout: ImageLayout, query: string, occurrence: number) {
  const hit = hitOffsets(layout, query, occurrence);
  if (!hit) return null;
  const line = layout.lines.find((line) => line.until > hit.from && line.from < hit.until);
  return line?.page ?? null;
}

export function renderImagePage(
  layout: ImageLayout,
  page: number,
  query?: string,
  occurrence?: number,
): Promise<Buffer> {
  // La misma página/versión se rasteriza una sola vez por proceso.
  // Conservamos la promesa para deduplicar peticiones simultáneas.
  const key = `${layout.version}:${page}:${query ?? ""}:${occurrence ?? -1}`;
  const existing = imageCache.get(key);
  if (existing) {
    imageCache.delete(key);
    imageCache.set(key, existing);
    return existing;
  }

  const pending = renderPageUncached(layout, page, query, occurrence);
  imageCache.set(key, pending);
  if (imageCache.size > MAX_IMAGE_CACHE) {
    const oldest = imageCache.keys().next().value;
    if (oldest !== undefined) imageCache.delete(oldest);
  }
  void pending.catch(() => {
    if (imageCache.get(key) === pending) imageCache.delete(key);
  });
  return pending;
}

async function renderPageUncached(
  layout: ImageLayout,
  page: number,
  query?: string,
  occurrence?: number,
): Promise<Buffer> {
  const canvas = createCanvas(WIDTH * SCALE, HEIGHT * SCALE);
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);
  const bg = ctx.createLinearGradient(0, 0, WIDTH, 0);
  bg.addColorStop(0, "#e1c69d");
  bg.addColorStop(0.10, "#f2e1c3");
  bg.addColorStop(0.78, "#f4e5ca");
  bg.addColorStop(1, "#d8bc91");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "rgba(115,74,39,0.08)";
  ctx.fillRect(0, 0, 13, HEIGHT);
  ctx.strokeStyle = "#aa8960";
  ctx.strokeRect(0.5, 0.5, WIDTH - 1, HEIGHT - 1);
  const hit = query && occurrence !== undefined ? hitOffsets(layout, query, occurrence) : null;
  for (const line of layout.lines) {
    if (line.page !== page) continue;
    ctx.font = `${line.bold ? "bold " : ""}${line.size}px Georgia`;
    if (hit && hit.from < line.until && hit.until > line.from) {
      const start = Math.max(line.from, hit.from);
      const end = Math.min(line.until, hit.until);
      // La capa de resaltado se pinta en el servidor, nunca se expone texto HTML.
      const relativeFrom = Math.max(0, start - line.from);
      const relativeUntil = Math.min(line.text.length, Math.max(relativeFrom, end - line.from));
      const left = ctx.measureText(line.text.slice(0, relativeFrom)).width;
      const right = ctx.measureText(line.text.slice(0, relativeUntil)).width;
      ctx.fillStyle = "rgba(211,157,49,0.65)";
      ctx.fillRect(line.x + left - 2, line.baseline - line.size * 0.99, Math.max(8, right - left + 4), line.size * 1.23);
    }
    ctx.fillStyle = "#473321";
    ctx.fillText(line.text, line.x, line.baseline);
  }
  ctx.font = "12px Georgia";
  ctx.textAlign = "center";
  ctx.fillStyle = "#8e7353";
  ctx.fillText(String(page + 1), WIDTH / 2, HEIGHT - 22);
  // WebP de calidad alta: conserva la nitidez y suele transferirse más rápido
  // que PNG en páginas de texto, sin descargar ningún PDF o Markdown.
  return canvas.encode("webp", 92);
}
