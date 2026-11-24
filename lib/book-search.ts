import { fromMarkdown } from "mdast-util-from-markdown";
import { getBookChapter, getBookChapters } from "@/lib/book-chapters";
import { prepareBookMarkdown } from "@/lib/book-markdown";

export type BookSearchHit = {
  chapterId: string;
  chapterTitle: string;
  occurrence: number;
  excerpt: string;
};

export type BookSearchResponse = {
  query: string;
  results: BookSearchHit[];
  truncated: boolean;
};

export const MAX_BOOK_SEARCH_RESULTS = 200;

type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
};

function visibleNodeText(node: MarkdownNode): string {

  if (node.type === "image" || node.type === "imageReference") return "";

  if (node.type === "break") return "";
  if (node.type === "code") return `${node.value ?? ""}\n`;

  if (typeof node.value === "string") return node.value;
  return node.children?.map(visibleNodeText).join("") ?? "";
}

function markdownVisibleText(markdown: string): string {
  const tree = fromMarkdown(prepareBookMarkdown(markdown));
  return visibleNodeText(tree);
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("es");
}


function normalizeWithOffsets(text: string) {
  let normalized = "";
  const offsets: number[] = [];
  let offset = 0;
  for (const character of text) {
    const value = fold(character);
    for (let i = 0; i < value.length; i++) {
      normalized += value[i];
      offsets.push(offset);
    }
    offset += character.length;
  }
  return { normalized, offsets };
}

function excerptAt(
  text: string,
  offsets: number[],
  start: number,
  length: number,
): string {
  const from = offsets[start] ?? 0;
  const until = (offsets[start + length] ?? text.length);
  const before = Math.max(0, from - 58);
  const after = Math.min(text.length, until + 70);
  const excerpt = text.slice(before, after).replace(/\s+/g, " ").trim();
  return `${before > 0 ? "…" : ""}${excerpt}${after < text.length ? "…" : ""}`;
}

export async function searchInsideBook(
  slug: string,
  query: string,
): Promise<BookSearchResponse> {
  const normalizedQuery = fold(query.trim());
  const chapters = await getBookChapters(slug);
  const results: BookSearchHit[] = [];
  let truncated = false;

  for (const chapter of chapters) {
    const full = await getBookChapter(slug, chapter.id);
    if (!full) continue;
    const text = markdownVisibleText(full.markdown.trim() || `## ${full.title}`);
    const { normalized, offsets } = normalizeWithOffsets(text);
    let offset = 0;
    let occurrence = 0;
    while (offset < normalized.length) {
      const position = normalized.indexOf(normalizedQuery, offset);
      if (position === -1) break;
      if (results.length === MAX_BOOK_SEARCH_RESULTS) {
        truncated = true;
        break;
      }
      results.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        occurrence,
        excerpt: excerptAt(text, offsets, position, normalizedQuery.length),
      });
      occurrence++;
      offset = position + normalizedQuery.length;
    }
    if (truncated) break;
  }
  return { query, results, truncated };
}
