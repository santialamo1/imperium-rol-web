
"use client";

import dynamic from "next/dynamic";
import type { RoleBook } from "@/lib/books";

const PdfReader = dynamic(
  () =>
    import("./pdf-reader").then(
      (module) => module.PdfReader
    ),
  {
    ssr: false,
    loading: () => (
      <div className="reader-placeholder">
        <span className="loader-medallion">✥</span>
        <p>Preparando el lector de la biblioteca…</p>
      </div>
    ),
  }
);

export function BookReader({
  book,
}: {
  book: RoleBook;
}) {
  return <PdfReader book={book} />;
}
