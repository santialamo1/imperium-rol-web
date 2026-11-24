import { NextRequest, NextResponse } from "next/server";
import { getBookChapter } from "@/lib/book-chapters";
import { getImageLayout, pageForMatch, renderImagePage } from "@/lib/image-page-renderer";

// Ruta del lector oficial: no expone el Markdown ni representa capítulos
// que no estén autorizados por lib/book-chapters.ts.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

type Context = {
  params: Promise<{ slug: string; chapterId: string }>;
};

export async function GET(request: NextRequest, { params }: Context) {
  const { slug, chapterId } = await params;
  if (!/^libro-(i|ii|iii|iv|v)$/.test(slug) || !/^[a-z\d][a-z\d_-]*$/i.test(chapterId)) {
    return NextResponse.json({ error: "Libro o capítulo no válido." }, { status: 404, headers: NO_STORE });
  }

  try {
    const chapter = await getBookChapter(slug, chapterId);
    if (!chapter) {
      return NextResponse.json({ error: "Capítulo no publicado." }, { status: 404, headers: NO_STORE });
    }
    const queryParams = request.nextUrl.searchParams;
    const requestedSize = Number(queryParams.get("size") ?? "17");
    if (![14, 15, 16, 17, 18, 19, 20, 21, 22].includes(requestedSize)) {
      return NextResponse.json({ error: "Tamaño de letra incorrecto." }, { status: 400, headers: NO_STORE });
    }

    const layout = getImageLayout(chapter.markdown, requestedSize);
    const query = (queryParams.get("q") ?? "").trim();
    const occurrenceText = queryParams.get("occurrence") ?? "0";
    const occurrence = Number(occurrenceText);
    const validMatch = query.length >= 2 && query.length <= 80 && Number.isSafeInteger(occurrence) && occurrence >= 0 && occurrence <= 10000;
    if (query && !validMatch) {
      return NextResponse.json({ error: "Coincidencia incorrecta." }, { status: 400, headers: NO_STORE });
    }
    const matchPage = validMatch ? pageForMatch(layout, query, occurrence) : null;
    const rawPage = queryParams.get("page");

    if (rawPage === null) {
      return NextResponse.json({
        id: chapter.id,
        title: chapter.title,
        pages: layout.pageCount,
        fontSize: requestedSize,
        version: layout.version,
        matchPage,
      }, { headers: NO_STORE });
    }

    const page = Number(rawPage);
    if (!Number.isSafeInteger(page) || page < 0 || page >= layout.pageCount) {
      return NextResponse.json({ error: "Hoja fuera del capítulo." }, { status: 404, headers: NO_STORE });
    }
    // Resaltado rasterizado: las coordenadas no se envían al navegador.
    const bytes = await renderImagePage(
      layout,
      page,
      validMatch && matchPage === page ? query : undefined,
      validMatch && matchPage === page ? occurrence : undefined,
    );
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        ...NO_STORE,
        "Cache-Control": "private, max-age=3600",
        "Content-Type": "image/webp",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("Error al generar una hoja del lector oficial:", error);
    return NextResponse.json({ error: "No se pudo generar la hoja." }, { status: 500, headers: NO_STORE });
  }
}
