
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

// Ubicación definitiva de los cinco libros Markdown.
// Esta carpeta está fuera de public.
const BOOKS_DIRECTORY = path.join(
  process.cwd(),
  "content",
  "rol",
  "books",
  "libros",
);

// Libro V: capítulos autorizados para publicación.
// Agregar aquí los IDs sin la extensión .md.
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
    typeof entry.title === "string" &&
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

  // Orden exacto del manifest.json.
  const entries = data.sections
    .filter(isManifestEntry)
    .sort((a, b) => a.index - b.index)
    .filter((entry) =>
      availableFiles.has(entry.file),
    )
    .filter(
      (entry) =>
        bookSlug !== "libro-v" ||
        PUBLISHED_BOOK_V.has(
          entry.file.replace(/\.md$/i, ""),
        ),
    );

  // En los libros I-IV evitamos activar el PDF
  // silenciosamente cuando faltan los Markdown.
  if (
    bookSlug !== "libro-v" &&
    entries.length === 0
  ) {
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

  // Solo se permiten archivos registrados
  // y autorizados en el índice.
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
