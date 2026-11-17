
import { NextResponse } from "next/server";
import { getBook } from "@/lib/books";
import { getBookChapter } from "@/lib/book-chapters";

type RouteContext = {
  params: Promise<{ slug: string; id: string }>;
};

// Solo entrega secciones autorizadas por el cargador.
// Los .md originales permanecen fuera de public.
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const { slug, id } = await params;

  if (!getBook(slug)) {
    return NextResponse.json(
      { error: "Libro no encontrado" },
      { status: 404 },
    );
  }

  const chapter = await getBookChapter(slug, id);

  if (!chapter) {
    return NextResponse.json(
      { error: "Sección no disponible" },
      { status: 404 },
    );
  }

  return NextResponse.json(chapter, {
    headers: { "Cache-Control": "no-store" },
  });
}
