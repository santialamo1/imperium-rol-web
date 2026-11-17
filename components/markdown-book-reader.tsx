"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CSSProperties, TouchEvent } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { RolOrnamentalButton } from "@/components/rol-ornamental-button";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Minus,
  Plus,
} from "lucide-react";
import type { BookChapter, BookChapterSummary } from "@/lib/book-chapters";
type ReaderProps = {
  book: {
    slug: string;
    roman: string;
    subtitle: string;
  };
  chapter: BookChapter;
  chapters: BookChapterSummary[];
};
type Position = {
  section: number;
  page: number;
};
type Flip = {
  direction: "next" | "prev";
  target: Position;
};
type PositionResult = Position | null | undefined;
const prose = `
  font-(family-name:--font-rol-body) text-[#412e20]
  [&_p]:mb-[0.8em] [&_p]:text-justify [&_p]:leading-[1.57]
  [&_p]:[hyphens:auto] [&_p]:[orphans:2] [&_p]:[widows:2]
  [&_h1]:mb-[0.7em] [&_h1]:text-center
  [&_h1]:font-(family-name:--font-rol-display)
  [&_h1]:text-[1.45em] [&_h1]:font-bold
  [&_h1]:leading-[1.3]
  [&_h2]:mb-[0.65em]
  [&_h2]:font-(family-name:--font-rol-display)
  [&_h2]:text-[1.2em] [&_h2]:font-semibold
  [&_h3]:mb-[0.6em] [&_h3]:font-semibold
  [&_h1]:[break-after:avoid-column]
  [&_h2]:[break-after:avoid-column]
  [&_h3]:[break-after:avoid-column]
  [&_blockquote]:mb-[1em]
  [&_blockquote]:border-l-2
  [&_blockquote]:border-[#a38459]
  [&_blockquote]:pl-4 [&_blockquote]:italic
  [&_ul]:mb-[0.8em] [&_ul]:list-disc [&_ul]:pl-5
  [&_ol]:mb-[0.8em] [&_ol]:list-decimal [&_ol]:pl-5
  [&_li]:mb-[0.25em]
  [&_hr]:my-6 [&_hr]:border-[#a38459]
  [&_img]:mx-auto [&_img]:mb-4
  [&_img]:max-h-[300px] [&_img]:w-auto
  [&_img]:max-w-full
`;
function markdownFor(section: BookChapter) {
  return section.markdown.trim() || `## ${section.title}`;
}
function PageLeaf({
  position,
  data,
  side,
  width,
  height,
  contentWidth,
  contentHeight,
  fontSize,
}: {
  position: Position | null | undefined;
  data: Record<number, BookChapter>;
  side: "left" | "right";
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  fontSize: number;
}) {
  const chapter = position ? data[position.section] : undefined;
  const paperStyle: CSSProperties = {
    width,
    height,
    background:
      side === "left"
        ? "linear-gradient(90deg,#e2cca5,#f5e6c8 12%,#f3e5c9 82%,#c5a77e)"
        : "linear-gradient(90deg,#baa080,#f2e2c3 15%,#f5e6c8 87%,#dfc397)",
  };
  return (
    <div
      style={paperStyle}
      className="
        relative shrink-0 overflow-hidden
        border border-[#9c7952]
        shadow-[inset_0_0_28px_#94714d45]
      "
    >
      <div
        aria-hidden="true"
        className={`
          pointer-events-none absolute
          inset-y-0 z-10 w-7
          ${
            side === "left"
              ? "right-0 bg-linear-to-l from-[#56382037] to-transparent"
              : "left-0 bg-linear-to-r from-[#56382037] to-transparent"
          }
        `}
      />
      {chapter && position && (
        <div
          className="
            absolute left-1/2 top-10
            overflow-hidden
          "
          style={{
            width: contentWidth,
            height: contentHeight,
            transform: "translateX(-50%)",
          }}
        >
          <div
            className={prose}
            lang="es"
            style={{
              width: contentWidth,
              height: contentHeight,
              fontSize,
              columnWidth: contentWidth,
              columnGap: 0,
              columnFill: "auto",
              transform: `translate3d(-${position.page * contentWidth}px,0,0)`,
            }}
          >
            <ReactMarkdown>{markdownFor(chapter)}</ReactMarkdown>
          </div>
        </div>
      )}
      {!chapter && position && (
        <div
          className="
            absolute inset-0 flex items-center
            justify-center px-5 text-center
            text-sm text-[#8b6c4a]
          "
        >
          Preparando la siguiente hoja…
        </div>
      )}
    </div>
  );
}
function readSavedPosition(key: string, chapters: BookChapterSummary[]) {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const saved = parsed as Record<string, unknown>;
    const index = chapters.findIndex((entry) => entry.id === saved.id);
    if (index < 0) return null;
    const page =
      typeof saved.page === "number" &&
      Number.isSafeInteger(saved.page) &&
      saved.page >= 0
        ? saved.page
        : 0;
    const fontSize =
      typeof saved.fontSize === "number" &&
      saved.fontSize >= 14 &&
      saved.fontSize <= 22
        ? saved.fontSize
        : 17;
    return {
      position: {
        section: index,
        page,
      },
      fontSize,
    };
  } catch {
    return null;
  }
}
const subscribeToNothing = () => () => {};
const isClientSnapshot = () => true;
const isServerSnapshot = () => false;

// La primera renderización coincide con el servidor. El lector real se
// monta después de hidratar, recuperando el progreso antes de pintar hojas.
export function MarkdownBookReader(props: ReaderProps) {
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    isClientSnapshot,
    isServerSnapshot,
  );

  if (!hydrated) {
    return (
      <div className="border border-[#805630] bg-[#1e140f] px-6 py-12 text-center text-[#e9c590]">
        Preparando el libro…
      </div>
    );
  }

  return (
    <MarkdownBookReaderClient
      key={`${props.book.slug}:${props.chapter.id}`}
      {...props}
    />
  );
}

function MarkdownBookReaderClient({ book, chapter, chapters }: ReaderProps) {
  const initialSection = Math.max(
    0,
    chapters.findIndex((entry) => entry.id === chapter.id),
  );
  const storageKey = `iao-rol-md-continuo:${book.slug}`;
  const [containerWidth, setContainerWidth] = useState(1080);
  // El componente solo se monta en el navegador: lectura segura de
  // localStorage sin setState en useEffect ni desajustes de hidratación.
  const [savedProgress] = useState(() => {
    const directChapterLink = new URLSearchParams(window.location.search).has(
      "capitulo",
    );
    return directChapterLink ? null : readSavedPosition(storageKey, chapters);
  });

  const [fontSize, setFontSize] = useState(savedProgress?.fontSize ?? 17);
  const [requestedPosition, setPosition] = useState<Position>(
    savedProgress?.position ?? { section: initialSection, page: 0 },
  );
  const [documents, setDocuments] = useState<Record<number, BookChapter>>({
    [initialSection]: chapter,
  });
  const [pageCounts, setPageCounts] = useState<Record<number, number>>({});

  // Limita la página visible sin corregir estado dentro de un efecto.
  // Si el tamaño de fuente o el viewport reducen las páginas disponibles,
  // se muestra y guarda la última hoja válida.
  const position = useMemo(() => {
    const count = pageCounts[requestedPosition.section];
    if (!count || requestedPosition.page < count) return requestedPosition;
    return { ...requestedPosition, page: Math.max(0, count - 1) };
  }, [requestedPosition, pageCounts]);
  const [flip, setFlip] = useState<Flip | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const measuresRef = useRef(new Map<number, HTMLDivElement>());
  const documentRef = useRef(documents);
  const inFlightRef = useRef(new Map<number, Promise<void>>());
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchXRef = useRef<number | null>(null);
  const wide = containerWidth >= 850;
  const pageWidth = Math.max(
    240,
    Math.floor(
      Math.min(wide ? 500 : 530, (containerWidth - 32) / (wide ? 2 : 1)),
    ),
  );
  const pageHeight = Math.round(pageWidth * 1.4);
  const contentWidth = pageWidth - (wide ? 68 : 52);
  const contentHeight = pageHeight - 97;
  useEffect(() => {
    documentRef.current = documents;
  }, [documents]);
  // Carga progresiva de secciones.
  const fetchSection = useCallback(
    (index: number): Promise<void> => {
      if (index < 0 || index >= chapters.length || documentRef.current[index]) {
        return Promise.resolve();
      }
      const existing = inFlightRef.current.get(index);
      if (existing) return existing;
      const id = chapters[index].id;
      const request = fetch(
        `/api/rol/books/${encodeURIComponent(
          book.slug,
        )}/chapters/${encodeURIComponent(id)}`,
        { cache: "no-store" },
      )
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return (await response.json()) as BookChapter;
        })
        .then((loaded) => {
          if (loaded.id !== id) {
            throw new Error("Capítulo inesperado");
          }
          setDocuments((current) => {
            if (current[index]) return current;
            const updated = {
              ...current,
              [index]: loaded,
            };
            documentRef.current = updated;
            return updated;
          });
        })
        .catch(() => {
          setLoadError(`No se pudo cargar «${chapters[index].title}».`);
        })
        .finally(() => {
          inFlightRef.current.delete(index);
        });
      inFlightRef.current.set(index, request);
      return request;
    },
    [book.slug, chapters],
  );
  // Precarga de capítulos cercanos. La limpieza de los ya leídos se
  // realiza al completar un giro, no mediante setState directo en un efecto.
  useEffect(() => {
    for (
      let index = position.section - 2;
      index <= position.section + 3;
      index++
    ) {
      void fetchSection(index);
    }
  }, [position.section, fetchSection]);
  // Medición del espacio disponible.
  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;
    const observer = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0]?.contentRect.width ?? 1080);
      if (width > 0) {
        setContainerWidth(width);
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  // Paginación independiente de cada sección,
  // enlazada en una lectura continua.
  useLayoutEffect(() => {
    let frame = 0;
    let cancelled = false;
    const calculate = () => {
      const next: Record<number, number> = {};
      for (const [index, element] of measuresRef.current) {
        next[index] = Math.max(
          1,
          Math.ceil((element.scrollWidth - 1) / contentWidth),
        );
      }
      setPageCounts((current) => {
        const keys = Object.keys(next);
        const unchanged =
          keys.length === Object.keys(current).length &&
          keys.every((key) => current[Number(key)] === next[Number(key)]);
        return unchanged ? current : next;
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(calculate);
    };
    const observer = new ResizeObserver(schedule);
    for (const element of measuresRef.current.values()) {
      observer.observe(element);
    }
    schedule();
    void document.fonts.ready.then(() => {
      if (!cancelled) schedule();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [documents, contentWidth, contentHeight, fontSize]);
  // Progreso guardado por libro.
  useEffect(() => {
    if (!pageCounts[position.section]) {
      return;
    }
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          id: chapters[position.section].id,
          page: position.page,
          fontSize,
        }),
      );
    } catch {
      // El lector continúa funcionando.
    }
  }, [storageKey, chapters, position, pageCounts, fontSize]);
  // Flujo de hojas entre distintas secciones.
  const nextPosition = useCallback(
    (cursor: Position): PositionResult => {
      const count = pageCounts[cursor.section];
      if (!count) return undefined;
      if (cursor.page + 1 < count) {
        return {
          section: cursor.section,
          page: cursor.page + 1,
        };
      }
      if (cursor.section + 1 < chapters.length) {
        return {
          section: cursor.section + 1,
          page: 0,
        };
      }
      return null;
    },
    [pageCounts, chapters.length],
  );
  const previousPosition = useCallback(
    (cursor: Position): PositionResult => {
      if (cursor.page > 0) {
        return {
          section: cursor.section,
          page: cursor.page - 1,
        };
      }
      if (cursor.section === 0) {
        return null;
      }
      const count = pageCounts[cursor.section - 1];
      if (!count) return undefined;
      return {
        section: cursor.section - 1,
        page: count - 1,
      };
    },
    [pageCounts],
  );
  const isMeasured = (cursor: Position | null | undefined) =>
    cursor === null ||
    (cursor !== undefined &&
      Boolean(documents[cursor.section]) &&
      Boolean(pageCounts[cursor.section]));
  const rightPage = wide ? nextPosition(position) : null;
  const forwardOnce = nextPosition(position);
  const forwardTarget =
    wide && forwardOnce ? nextPosition(forwardOnce) : forwardOnce;
  const backwardOnce = previousPosition(position);
  // Si se guardó una página impar (por ejemplo al leer en móvil),
  // retroceder dos hojas puede salirse del inicio del libro.
  // En ese caso damos un paso para llegar a la primera hoja.
  // undefined significa que una sección todavía se está midiendo:
  // no lo confundimos con el inicio real (null).
  const backwardTwo =
    wide && backwardOnce ? previousPosition(backwardOnce) : backwardOnce;
  const backwardTarget =
    wide && backwardTwo === null ? backwardOnce : backwardTwo;
  const canGoNext =
    !flip &&
    isMeasured(position) &&
    forwardTarget !== null &&
    forwardTarget !== undefined &&
    isMeasured(forwardTarget) &&
    (!wide || isMeasured(nextPosition(forwardTarget)));
  const canGoPrevious =
    !flip &&
    backwardTarget !== null &&
    backwardTarget !== undefined &&
    isMeasured(backwardTarget) &&
    (!wide || isMeasured(nextPosition(backwardTarget)));
  const go = useCallback(
    (direction: "next" | "prev") => {
      if (flip) return;
      const cursor = direction === "next" ? forwardTarget : backwardTarget;
      if (!cursor) return;
      if (direction === "next" && !canGoNext) {
        return;
      }
      if (direction === "prev" && !canGoPrevious) {
        return;
      }
      setFlip({
        direction,
        target: cursor,
      });
    },
    [flip, forwardTarget, backwardTarget, canGoNext, canGoPrevious],
  );
  // Giro completo antes de cambiar el contenido.
  useEffect(() => {
    if (!flip || !sheetRef.current) {
      return;
    }
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const animation = sheetRef.current.animate(
      [
        {
          transform: "rotateY(0deg)",
        },
        {
          transform: `rotateY(${flip.direction === "next" ? -180 : 180}deg)`,
        },
      ],
      {
        duration: reduced ? 1 : 510,
        easing: "cubic-bezier(0.42,0,0.25,1)",
        fill: "forwards",
      },
    );
    let cancelled = false;
    void animation.finished
      .then(() => {
        if (cancelled) return;
        setPosition(flip.target);
        setDocuments((current) => {
          const kept = Object.fromEntries(
            Object.entries(current).filter(
              ([key]) => Math.abs(Number(key) - flip.target.section) <= 3,
            ),
          ) as Record<number, BookChapter>;
          return Object.keys(kept).length === Object.keys(current).length
            ? current
            : kept;
        });
        setFlip(null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      animation.cancel();
    };
  }, [flip]);
  // Flechas del teclado.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreen(false);
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go("next");
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go("prev");
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [go]);
  // Gestos táctiles.
  function touchStart(event: TouchEvent<HTMLDivElement>) {
    touchXRef.current = event.touches[0]?.clientX ?? null;
  }
  function touchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchXRef.current;
    const end = event.changedTouches[0]?.clientX;
    touchXRef.current = null;
    if (start === null || end === undefined || Math.abs(end - start) < 65) {
      return;
    }
    go(end < start ? "next" : "prev");
  }
  const leaf = (
    cursor: Position | null | undefined,
    side: "left" | "right",
  ) => (
    <PageLeaf
      position={cursor}
      data={documents}
      side={side}
      width={pageWidth}
      height={pageHeight}
      contentWidth={contentWidth}
      contentHeight={contentHeight}
      fontSize={fontSize}
    />
  );
  const goingForward = flip?.direction === "next";
  const goingBackward = flip?.direction === "prev";
  const targetRight = flip ? nextPosition(flip.target) : null;
  const title = chapters[position.section]?.title ?? chapter.title;
  // Indicador orientativo: la paginación real
  // depende del dispositivo y tamaño de fuente.
  const approximateProgress = Math.min(
    100,
    ((position.section +
      (position.page + 1) / (pageCounts[position.section] || 1)) /
      chapters.length) *
      100,
  );
  const headerTool = `
    grid size-9 place-items-center
    rounded-sm border border-[#85592f]
    bg-[linear-gradient(180deg,#3d291b,#1b110c)]
    text-[#e9c38c]
    shadow-[inset_0_1px_0_#b98b4a33]
    transition-[filter] hover:brightness-125
    focus-visible:outline-2
    focus-visible:outline-[#eac287]
    disabled:cursor-not-allowed
    disabled:opacity-30
  `;
  return (
    <div
      ref={containerRef}
      className={`
        relative w-full
        font-(family-name:--font-rol-body)
        text-[#ead0a7]
        ${
          fullscreen
            ? "fixed inset-0 z-1000 flex flex-col overflow-y-auto bg-[#100b08] p-3 md:p-6"
            : ""
        }
      `}
    >
      {/* ENCABEZADO */}
      <header
        className="
          relative z-30 flex flex-wrap
          items-center justify-between
          gap-4 border border-[#805630]
          bg-[#1e140f] px-4 py-3 md:px-6
        "
      >
        <div className="min-w-0">
          <p
            className="
              font-(family-name:--font-rol-display)
              text-[10px] tracking-[0.17em]
              text-[#b78d58]
            "
          >
            EMPERADORES DE LA CENIZA · LIBRO {book.roman}
          </p>
          <h2
            className="
              mt-1 truncate
              font-(family-name:--font-rol-display)
              text-[clamp(15px,2vw,22px)]
              text-[#e9c590]
            "
          >
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Reducir texto"
            title="Reducir texto"
            disabled={fontSize <= 14 || Boolean(flip)}
            onClick={() => setFontSize((value) => Math.max(14, value - 1))}
            className={headerTool}
          >
            <Minus size={17} aria-hidden="true" />
          </button>
          <span
            className="
              w-9 text-center
              text-xs tabular-nums
            "
          >
            {fontSize}px
          </span>
          <button
            type="button"
            aria-label="Ampliar texto"
            title="Ampliar texto"
            disabled={fontSize >= 22 || Boolean(flip)}
            onClick={() => setFontSize((value) => Math.min(22, value + 1))}
            className={headerTool}
          >
            <Plus size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={
              fullscreen ? "Salir de pantalla completa" : "Pantalla completa"
            }
            title={
              fullscreen ? "Salir de pantalla completa" : "Pantalla completa"
            }
            onClick={() => setFullscreen((value) => !value)}
            className={`${headerTool} ml-2`}
          >
            {fullscreen ? (
              <Minimize size={18} aria-hidden="true" />
            ) : (
              <Maximize size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>
      {/* ESCENARIO DE LECTURA */}
      <div
        className={`
          relative flex justify-center
          overflow-clip border-x
          border-[#805630]
          bg-[radial-gradient(ellipse_at_50%_35%,#66432c,#1c130e_68%)]
          px-2 py-8 md:px-4 md:py-12
          ${fullscreen ? "min-h-0 flex-1 items-center" : ""}
        `}
        onTouchStart={touchStart}
        onTouchEnd={touchEnd}
      >
        {/* Medición oculta de secciones cercanas */}
        <div
          className="
            pointer-events-none absolute
            left-0 top-0 size-0 overflow-hidden invisible
          "
          aria-hidden="true"
        >
          {Object.entries(documents).map(([key, item]) => {
            const index = Number(key);
            return (
              <div
                key={item.id}
                ref={(element) => {
                  if (element) {
                    measuresRef.current.set(index, element);
                  } else {
                    measuresRef.current.delete(index);
                  }
                }}
                className={prose}
                lang="es"
                style={{
                  width: contentWidth,
                  height: contentHeight,
                  fontSize,
                  columnWidth: contentWidth,
                  columnGap: 0,
                  columnFill: "auto",
                }}
              >
                <ReactMarkdown>{markdownFor(item)}</ReactMarkdown>
              </div>
            );
          })}
        </div>
        <div
          className="
            relative shrink-0
            perspective-[2200px]
          "
          style={{
            width: pageWidth * (wide ? 2 : 1),
            height: pageHeight,
          }}
          aria-label="Libro abierto"
        >
          {flip ? (
            <>
              {wide ? (
                <>
                  <div
                    className="
                      absolute left-0 top-0
                    "
                  >
                    {leaf(goingForward ? position : flip.target, "left")}
                  </div>
                  <div
                    className="
                      absolute right-0 top-0
                    "
                  >
                    {leaf(goingForward ? targetRight : rightPage, "right")}
                  </div>
                </>
              ) : (
                <div
                  className="
                    absolute inset-0
                  "
                >
                  {leaf(flip.target, "right")}
                </div>
              )}
              <div
                ref={sheetRef}
                className="
                  absolute top-0
                  transform-3d
                "
                style={{
                  left: wide && goingForward ? pageWidth : 0,
                  width: pageWidth,
                  height: pageHeight,
                  transformOrigin: goingBackward
                    ? "right center"
                    : "left center",
                }}
              >
                <div
                  className="
                    absolute inset-0
                    backface-hidden
                  "
                >
                  {leaf(
                    wide ? (goingForward ? rightPage : position) : position,
                    goingBackward ? "left" : "right",
                  )}
                </div>
                <div
                  className="
                    absolute inset-0
                    backface-hidden
                    transform-[rotateY(180deg)]
                  "
                >
                  {leaf(
                    wide
                      ? goingForward
                        ? flip.target
                        : targetRight
                      : flip.target,
                    goingBackward ? "right" : "left",
                  )}
                </div>
              </div>
            </>
          ) : wide ? (
            <div
              className="
                flex h-full
                shadow-[0_24px_55px_#0009]
              "
            >
              {leaf(position, "left")}
              {leaf(rightPage, "right")}
            </div>
          ) : (
            <div
              className="
                shadow-[0_24px_55px_#0009]
              "
            >
              {leaf(position, "right")}
            </div>
          )}
          {wide && (
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute
                inset-y-0 left-1/2 z-20
                w-1.5 -translate-x-1/2
                bg-linear-to-r
                from-[#41291b66]
                via-[#28180d66]
                to-[#ceae8655]
              "
            />
          )}
        </div>
      </div>
      {/* NAVEGACIÓN ORNAMENTAL */}
      <nav
        aria-label="Navegación del libro"
        className="
          relative z-20 grid
          grid-cols-2
          sm:grid-cols-[minmax(110px,180px)_minmax(0,1fr)_minmax(110px,180px)]
          items-center gap-2
          border border-[#805630]
          bg-[linear-gradient(180deg,#26180f,#140d09)]
          px-2 py-3
          sm:gap-5 sm:px-6 sm:py-4
        "
      >
        <RolOrnamentalButton
          type="button"
          size="compact"
          className="w-full!"
          onClick={() => go("prev")}
          disabled={!canGoPrevious}
          ariaLabel="Pasar a las hojas anteriores"
          icon={<ChevronLeft aria-hidden="true" />}
          iconPosition="left"
        >
          ANTERIOR
        </RolOrnamentalButton>
        <div
          className="
            order-first col-span-2 min-w-0 px-1 text-center
            sm:order-0 sm:col-span-1
          "
        >
          <p
            className="
              mb-1 text-[9px] font-semibold
              tracking-[0.19em]
              text-[#a98556]
              sm:text-[10px]
            "
          >
            AHORA ESTÁS LEYENDO
          </p>
          <p
            aria-live="polite"
            title={title}
            className="
              truncate
              font-(family-name:--font-rol-display)
              text-[12px] leading-[1.45]
              text-[#f0cf98]
              sm:text-[16px]
            "
          >
            {title}
          </p>
          <div
            role="progressbar"
            aria-label="Avance orientativo por secciones del libro"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(approximateProgress)}
            className="
              mx-auto mt-2.25 h-0.75
              w-full max-w-60
              bg-[#644128]
            "
          >
            <div
              className="
                h-full
                bg-[linear-gradient(90deg,#8c5a2d,#e3b675)]
                transition-[width] duration-200
              "
              style={{
                width: `${approximateProgress}%`,
              }}
            />
          </div>
        </div>
        <RolOrnamentalButton
          type="button"
          size="compact"
          className="w-full!"
          onClick={() => go("next")}
          disabled={!canGoNext}
          ariaLabel="Pasar a las hojas siguientes"
          icon={<ChevronRight aria-hidden="true" />}
        >
          SIGUIENTE
        </RolOrnamentalButton>
      </nav>
      {/* ÍNDICE JERÁRQUICO */}
      <footer
        className="
          relative z-30 flex
          items-center justify-center
          border-x border-b
          border-[#805630]
          bg-[#120b08]
          px-4 py-3 sm:py-4
        "
      >
        <details
          className="
            group relative w-full
            max-w-67.5
          "
        >
          <summary
            className="
              flex min-h-10 cursor-pointer
              list-none items-center
              justify-center gap-3
              border-y border-[#7a4d2a]
              bg-[linear-gradient(180deg,#29190f,#130c08)]
              px-4 py-2
              text-[#e2ba83]
              shadow-[inset_0_1px_0_#ab764a29]
              transition-[filter]
              hover:brightness-125
              focus-visible:outline-2
              focus-visible:outline-[#edc188]
              [&::-webkit-details-marker]:hidden
            "
          >
            <BookOpen size={17} aria-hidden="true" />
            <span
              className="
                font-(family-name:--font-rol-display)
                text-[12px] font-semibold
                tracking-[0.08em]
              "
            >
              ÍNDICE DE CAPÍTULOS
            </span>
            <ChevronDown
              size={15}
              aria-hidden="true"
              className="
                transition-transform duration-200
                group-open:rotate-180
              "
            />
          </summary>
          <div
            className="
              absolute bottom-full left-1/2 z-50
              mb-3 max-h-[min(420px,65vh)]
              w-[min(450px,90vw)]
              -translate-x-1/2
              overflow-y-auto overscroll-contain
              border border-[#9c6b3b]
              bg-[#1a110c] p-2
              shadow-[0_25px_60px_#000d]
              [scrollbar-color:#8c6035_#1a110c]
              scrollbar-thin
            "
          >
            <p
              className="
                border-b border-[#5d3d24]
                px-3 py-3 text-center
                font-(family-name:--font-rol-display)
                text-[11px] font-bold
                tracking-[0.14em]
                text-[#c99e69]
              "
            >
              CONTENIDO DEL LIBRO {book.roman}
            </p>
            {chapters.map((item, index) => (
              <Link
                key={item.id}
                href={`/rol/libros/${book.slug}?capitulo=${encodeURIComponent(
                  item.id,
                )}`}
                scroll={false}
                className={`
                  block border-b border-[#51361f]
                  py-2.75 text-[14px]
                  leading-[1.4]
                  transition-colors
                  hover:bg-[#49301c]
                  ${
                    item.type === "parte"
                      ? "mt-2 px-3 font-(family-name:--font-rol-display) font-bold uppercase tracking-[0.04em] text-[#e0bd83]"
                      : item.type === "capitulo"
                        ? "pl-7 pr-3 text-[#cbb092]"
                        : "px-3 text-[#c7a782]"
                  }
                  ${
                    index === position.section
                      ? "bg-[#3b281a] text-[#ffda9c]"
                      : ""
                  }
                `}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </details>
      </footer>
      {loadError && (
        <p
          role="alert"
          className="
            border-x border-b
            border-[#805630]
            bg-[#381a16]
            px-4 py-3
            text-sm text-[#ffd3bd]
          "
        >
          {loadError} Revisá la conexión e intentá volver a abrir el libro.
        </p>
      )}
    </div>
  );
}
