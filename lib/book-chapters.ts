import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type BookChapterSummary = {
  id: string;
  title: string;
  type?: "capitulo" | "parte" | "seccion";
};

export type BookChapter = BookChapterSummary & {
  markdown: string;
};

const BOOK_NUMBERS: Record<string, number> = {
  "libro-i": 1,
  "libro-ii": 2,
  "libro-iii": 3,
  "libro-iv": 4,
  "libro-v": 5,
};

const BOOKS_DIRECTORY = path.join(
  process.cwd(),
  "content",
  "rol",
  "books",
  "libros",
);

// Sin capítulos aprobados, el Libro V no requiere una carpeta física.
const PUBLISHED_BOOK_V = new Set<string>([]);

type ManifestEntry = {
  index: number;
  title: string;
  type: "capitulo" | "parte" | "seccion";
  file: string;
};

function isManifestEntry(
  value: unknown,
): value is ManifestEntry {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    Number.isSafeInteger(entry.index) &&
    (entry.index as number) > 0 &&
    typeof entry.title === "string" &&
    (entry.title as string).trim().length > 0 &&
    typeof entry.file === "string" &&
    /^[^/\\\0]+\.md$/i.test(entry.file) &&
    (
      entry.type === "capitulo" ||
      entry.type === "parte" ||
      entry.type === "seccion"
    )
  );
}

async function loadIndex(bookSlug: string) {
  const bookNumber = BOOK_NUMBERS[bookSlug];

  if (!bookNumber) {
    return null;
  }

  // Los capítulos del Libro V deben aprobarse explícitamente.
  // Si todavía no se aprobó ninguno, las APIs devuelven vacío/404
  // sin depender de que exista su carpeta en el despliegue.
  if (bookSlug === "libro-v" && PUBLISHED_BOOK_V.size === 0) {
    return null;
  }

  let folders;

  try {
    folders = await readdir(
      BOOKS_DIRECTORY,
      { withFileTypes: true },
    );
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code ===
      "ENOENT"
    ) {
      throw new Error(
        `No existe la carpeta de libros Markdown: ${BOOKS_DIRECTORY}`,
      );
    }

    throw error;
  }

  const prefix = new RegExp(
    `^Libro_0*${bookNumber}_`,
    "i",
  );

  const bookFolder = folders.find(
    (entry) =>
      entry.isDirectory() &&
      prefix.test(entry.name),
  );

  if (!bookFolder) {
    throw new Error(
      `No encontré la carpeta Libro_0${bookNumber}_... dentro de ${BOOKS_DIRECTORY}`,
    );
  }

  const directory = path.join(
    BOOKS_DIRECTORY,
    bookFolder.name,
  );

  const manifestPath = path.join(
    directory,
    "manifest.json",
  );

  let raw: string;

  try {
    raw = await readFile(
      manifestPath,
      "utf8",
    );
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code ===
      "ENOENT"
    ) {
      throw new Error(
        `Falta el manifiesto: ${manifestPath}`,
      );
    }

    throw error;
  }

  const manifest: unknown = JSON.parse(raw);

  if (
    !manifest ||
    typeof manifest !== "object"
  ) {
    throw new Error(
      `Manifiesto inválido: ${manifestPath}`,
    );
  }

  const data = manifest as Record<
    string,
    unknown
  >;

  if (
    data.book !== bookNumber ||
    !Array.isArray(data.sections)
  ) {
    throw new Error(
      `El manifiesto no corresponde al ${bookSlug}: ${manifestPath}`,
    );
  }

  const availableFiles = new Set(
    (
      await readdir(directory, {
        withFileTypes: true,
      })
    )
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name),
  );

  // Validar el manifiesto completo: omitir entradas o archivos faltantes
  // silenciosamente podría publicar libros incompletos.
  const entries: ManifestEntry[] = [];
  const seenIndexes = new Set<number>();
  const seenFiles = new Set<string>();

  for (const [position, candidate] of data.sections.entries()) {
    if (!isManifestEntry(candidate)) {
      throw new Error(
        `Entrada ${position + 1} inválida en el manifiesto: ${manifestPath}`,
      );
    }

    if (seenIndexes.has(candidate.index) || seenFiles.has(candidate.file)) {
      throw new Error(
        `Índice o archivo repetido en el manifiesto: ${manifestPath} (${candidate.file})`,
      );
    }
    seenIndexes.add(candidate.index);
    seenFiles.add(candidate.file);

    const isPublished =
      bookSlug !== "libro-v" ||
      PUBLISHED_BOOK_V.has(candidate.file.replace(/\.md$/i, ""));

    if (isPublished && !availableFiles.has(candidate.file)) {
      throw new Error(
        `Falta el capítulo publicado ${candidate.file} indicado en ${manifestPath}`,
      );
    }
    if (isPublished) entries.push(candidate);
  }

  // Orden exacto indicado por los índices del manifiesto.
  entries.sort((a, b) => a.index - b.index);

  if (bookSlug !== "libro-v" && entries.length === 0) {
    throw new Error(
      `No encontré capítulos .md del ${bookSlug} indicados en ${manifestPath}`,
    );
  }

  return {
    directory,
    entries,
  };
}

export async function getBookChapters(
  bookSlug: string,
): Promise<BookChapterSummary[]> {
  const index = await loadIndex(bookSlug);

  if (!index) {
    return [];
  }

  return index.entries.map((entry) => ({
    id: entry.file.replace(/\.md$/i, ""),
    title: entry.title,
    type: entry.type,
  }));
}

export async function getBookChapter(
  bookSlug: string,
  chapterId: string,
): Promise<BookChapter | null> {
  const index = await loadIndex(bookSlug);

  if (!index) {
    return null;
  }

  const entry = index.entries.find(
    (item) =>
      item.file.replace(/\.md$/i, "") ===
      chapterId,
  );

  if (!entry) {
    return null;
  }

  const markdown = (
    await readFile(
      path.join(
        index.directory,
        entry.file,
      ),
      "utf8",
    )
  ).replace(/^\uFEFF/, "");

  return {
    id: chapterId,
    title: entry.title,
    type: entry.type,
    markdown,
  };
}
