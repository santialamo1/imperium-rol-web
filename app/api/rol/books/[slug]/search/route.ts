import { NextRequest, NextResponse } from "next/server";
import { searchInsideBook } from "@/lib/book-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validBookSlugs = new Set([
  "libro-i", "libro-ii", "libro-iii", "libro-iv", "libro-v",
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!validBookSlugs.has(slug)) {
    return NextResponse.json({ error: "Libro no encontrado." }, { status: 404 });
  }

  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (query.length < 2 || query.length > 80) {
    return NextResponse.json(
      { error: "Escribí entre 2 y 80 caracteres para buscar." },
      { status: 400 },
    );
  }

  try {
    const result = await searchInsideBook(slug, query);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo completar la búsqueda." },
      { status: 500 },
    );
  }
}
