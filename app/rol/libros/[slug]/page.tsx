import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ScrollText } from "lucide-react";

import { books, getBook } from "@/lib/books";
import { getBookChapters } from "@/lib/book-chapters";
import { ImageBookReader } from "@/components/image-book-reader";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ capitulo?: string | string[] }>;
};

export function generateStaticParams() {
  return books.map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = getBook(slug);
  return { title: book ? `Libro ${book.roman}: ${book.subtitle}` : "Libro no encontrado" };
}

export default async function BookDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const book = getBook(slug);
  if (!book) notFound();

  // La disponibilidad de capítulos se gestiona en lib/book-chapters.ts.
  const chapters = await getBookChapters(slug);
  const requested = (await searchParams).capitulo;
  const requestedId = typeof requested === "string" ? requested : undefined;
  if (requestedId && !chapters.some((chapter) => chapter.id === requestedId)) notFound();

  const isPublishing = slug === "libro-v";

  return (
    <>
      <div className="mx-auto flex w-[calc(100%-36px)] max-w-330 flex-wrap items-center justify-between gap-4 py-7 md:w-[calc(100%-76px)]">
        <Link href="/rol/libros" className="inline-flex items-center gap-2 text-sm text-[#d7ad75] transition-colors hover:text-[#ffe0a5]">
          <ArrowLeft size={17} aria-hidden="true" /> Volver a la biblioteca
        </Link>
        <span className="font-(family-name:--font-rol-display) text-[11px] tracking-[0.12em] text-[#a88c67]">
          EMPERADORES DE LA CENIZA · LIBRO {book.roman}
        </span>
      </div>
      <header className="border-y border-[#68452a] bg-[linear-gradient(180deg,#21150f,#120c09)] py-9 text-center">
        <div className="mx-auto w-[calc(100%-36px)] max-w-280 md:w-[calc(100%-76px)]">
          <span className="font-(family-name:--font-rol-display) text-[11px] tracking-[0.2em] text-[#c89d62]">
            {isPublishing ? "PUBLICACIÓN POR CAPÍTULOS" : "LECTURA DE LA EDICIÓN OFICIAL"}
          </span>
          <h1 className="mt-3 font-(family-name:--font-rol-display) text-[clamp(28px,4vw,52px)] font-semibold text-[#f1d2a2]">
            {book.subtitle}
          </h1>
        </div>
      </header>
      <section className="bg-[radial-gradient(ellipse_at_50%_0%,#352015,#0d0907_75%)] px-3.5 py-10 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          {chapters.length > 0 ? (
            <ImageBookReader
              key={`${slug}:${requestedId ?? "inicio"}`}
              book={{ slug: book.slug, roman: book.roman, subtitle: book.subtitle }}
              chapters={chapters}
              initialChapterId={requestedId ?? chapters[0].id}
              directChapterLink={Boolean(requestedId)}
            />
          ) : (
            <div className="mx-auto max-w-155 border border-[#71502d] bg-[#1a110c] px-8 py-16 text-center text-[#e6c08a]">
              <ScrollText className="mx-auto mb-5" size={40} aria-hidden="true" />
              <h2 className="font-(family-name:--font-rol-display) text-2xl">
                {isPublishing ? "Capítulos en preparación" : "Lectura no disponible"}
              </h2>
              <p className="mt-4 leading-relaxed text-[#bca183]">
                {isPublishing
                  ? "El Libro V se publicará progresivamente."
                  : "No se encontraron capítulos publicados para este volumen."}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
