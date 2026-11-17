"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { FormEvent } from "react";

import { Document, Page, pdfjs } from "react-pdf";

import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Maximize,
  Minimize,
  Minus,
  Plus,
  Bookmark,
  BookMarked,
} from "lucide-react";

import type { RoleBook } from "@/lib/books";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

function clamp(page: number, total: number) {
  return Math.max(1, Math.min(total, Math.floor(page)));
}

// Lectura segura del progreso almacenado.
function readStoredPage(key: string): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(key);

    if (value === null) {
      return null;
    }

    const parsed = Number(value);

    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

const toolButton = `
  grid size-[37px] place-items-center
  border border-transparent
  bg-transparent text-[#d5b17e]
  transition-colors duration-200
  hover:border-[#976735]
  hover:bg-[#402819]
  disabled:cursor-not-allowed
  disabled:opacity-40
  max-[550px]:h-[34px]
  max-[550px]:w-[28px]
`;

const turnButton = `
  inline-flex items-center justify-center
  gap-[6px]
  border border-[#785130]
  bg-[#382315]
  px-[14px] py-3
  text-[13px] font-extrabold
  text-[#f0c486]
  transition-colors duration-200
  hover:enabled:bg-[#5b361d]
  disabled:cursor-not-allowed
  disabled:opacity-40
  max-[550px]:px-[9px]
  max-[550px]:py-[9px]
`;

const readerLink = `
  inline-flex items-center gap-[7px]
  text-xs text-[#d4a86c]
  transition-colors duration-200
  hover:text-[#ffe0a6]
`;

function DocumentPlaceholder({ book }: { book: RoleBook }) {
  return (
    <div
      role="status"
      className="
        flex min-h-105
        flex-col items-center
        justify-center gap-3.75
        px-6 text-center
        text-[#ecd2a3]
      "
    >
      <span
        aria-hidden="true"
        className="
          text-[76px] leading-none
          text-[#aa7842]
          motion-safe:animate-pulse
        "
      >
        ✥
      </span>

      <p
        className="
          m-0
          font-(family-name:--font-rol-body)
          text-[23px] text-[#ecd2a3]
        "
      >
        Abriendo el Libro {book.roman}…
      </p>

      <small
        className="
          max-w-92.5
          text-xs leading-[1.6]
          text-[#aa906c]
        "
      >
        Se carga el documento completo, pero solo se dibujan las páginas
        visibles.
      </small>
    </div>
  );
}

function PdfReaderContent({ book }: { book: RoleBook }) {
  const storeKey = `iao-rol-page:${book.slug}`;
  const bookmarkKey = `iao-rol-bookmark:${book.slug}`;

  // Inicialización desde localStorage, sin useEffect.
  const [page, setPage] = useState(() => readStoredPage(storeKey) ?? 1);

  const [pageInput, setPageInput] = useState(() =>
    String(readStoredPage(storeKey) ?? 1),
  );

  const [bookmark, setBookmark] = useState<number | null>(() =>
    readStoredPage(bookmarkKey),
  );

  const [pages, setPages] = useState(0);

  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1300,
  );

  const [stageWidth, setStageWidth] = useState(960);
  const [zoom, setZoom] = useState(1);

  const [turn, setTurn] = useState<"next" | "prev" | null>(null);

  const [fullscreen, setFullscreen] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const turnRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mobile = windowWidth < 800;
  const step = mobile ? 1 : 2;

  // El listener actualiza el ancho cuando ocurre
  // un evento real de redimensionamiento.
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ResizeObserver realiza la medición en su callback.
  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry) {
        setStageWidth(entry.contentRect.width);
      }
    });

    observer.observe(stage);

    return () => observer.disconnect();
  }, []);

  // Este efecto solo sincroniza localStorage.
  useEffect(() => {
    try {
      window.localStorage.setItem(storeKey, String(page));
    } catch {
      // El lector funciona aunque el almacenamiento
      // del navegador esté bloqueado.
    }
  }, [page, storeKey]);

  // Navegación con animación de página.
  const changePage = useCallback(
    (target: number) => {
      if (turn || pages === 0) return;

      const next = clamp(target, pages);

      if (next === page) {
        setPageInput(String(page));
        return;
      }

      if (turnRef.current) {
        clearTimeout(turnRef.current);
      }

      setTurn(next > page ? "next" : "prev");

      turnRef.current = setTimeout(() => {
        setPage(next);
        setPageInput(String(next));
        setTurn(null);
        turnRef.current = null;
      }, 430);
    },
    [turn, pages, page],
  );

  // Limpieza del timeout al desmontar el lector.
  useEffect(() => {
    return () => {
      if (turnRef.current) {
        clearTimeout(turnRef.current);
      }
    };
  }, []);

  // Atajos de teclado.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFullscreen(false);
      }

      const active = document.activeElement;

      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        changePage(page + step);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        changePage(page - step);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [changePage, page, step]);

  // Dimensiones del documento.
  const maxWidth = mobile ? 660 : 1200;

  const renderWidth = Math.max(
    210,
    Math.min(
      mobile ? 570 : 530,
      Math.floor(
        (Math.min(stageWidth, maxWidth) - (mobile ? 40 : 64)) /
          (mobile ? 1 : 2),
      ) * zoom,
    ),
  );

  const progressPage = pages ? Math.min(pages, page + step - 1) : 0;

  // Guardar o quitar marcador.
  function toggleBookmark() {
    const next = bookmark === page ? null : page;

    setBookmark(next);

    try {
      if (next !== null) {
        window.localStorage.setItem(bookmarkKey, String(next));
      } else {
        window.localStorage.removeItem(bookmarkKey);
      }
    } catch {
      // No impedimos la navegación si falla storage.
    }
  }

  // Ir a una página ingresada manualmente.
  function goToInput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next = Number(pageInput);

    if (pages > 0 && Number.isSafeInteger(next) && next >= 1 && next <= pages) {
      changePage(next);
    } else {
      setPageInput(String(page));
    }
  }

  // La carga se realiza desde react-pdf.
  function handleDocumentLoad(numPages: number) {
    setPages(numPages);

    const safePage = clamp(page, numPages);

    if (safePage !== page) {
      setPage(safePage);
    }

    setPageInput(String(safePage));
  }

  return (
    <div
      className={`
        relative border border-[#684126]
        bg-[#140e0b]
        font-(family-name:--font-rol-body)
        text-[#ecd2a3]
        shadow-[0_20px_70px_#000c]
        ${
          fullscreen
            ? "fixed inset-0 z-999 flex flex-col overflow-auto bg-[#100b09]"
            : ""
        }
      `}
    >
      {/* ==========================================
          BARRA SUPERIOR
      ========================================== */}

      <div
        className="
          flex h-19.5 shrink-0
          items-center justify-between
          gap-5
          border-b border-[#82542f]
          bg-[linear-gradient(180deg,#322016,#160f0b)]
          px-6.75
          max-[550px]:h-15.75
          max-[550px]:gap-2
          max-[550px]:px-3.75
        "
      >
        {/* Nombre del volumen */}
        <div
          className="
            flex min-w-0 items-center gap-4
            text-[#dbb073]
          "
        >
          <BookOpen
            size={22}
            className="
              shrink-0
              max-[550px]:hidden
            "
            aria-hidden="true"
          />

          <div
            className="
              flex min-w-0 flex-col gap-1
            "
          >
            <strong
              className="
                font-(family-name:--font-rol-display)
                text-xl font-normal
                text-[#f2d09a]
                max-[550px]:text-base
              "
            >
              Libro {book.roman}
            </strong>

            <span
              className="
                truncate text-[11px]
                text-[#ac916e]
                max-[550px]:text-[10px]
              "
            >
              {book.subtitle}
            </span>
          </div>
        </div>

        {/* Herramientas */}
        <div
          className="
            flex shrink-0 items-center
            gap-1
          "
        >
          <button
            type="button"
            className={toolButton}
            onClick={() =>
              setZoom((current) =>
                Math.max(0.7, Math.round((current - 0.1) * 10) / 10),
              )
            }
            disabled={zoom <= 0.7}
            title="Alejar"
            aria-label="Alejar"
          >
            <Minus size={18} aria-hidden="true" />
          </button>

          <span
            className="
              w-9.75 text-center
              text-[11px] text-[#d7bd90]
              max-[550px]:w-8.75
            "
          >
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            className={toolButton}
            onClick={() =>
              setZoom((current) =>
                Math.min(1.4, Math.round((current + 0.1) * 10) / 10),
              )
            }
            disabled={zoom >= 1.4}
            title="Acercar"
            aria-label="Acercar"
          >
            <Plus size={18} aria-hidden="true" />
          </button>

          <span
            aria-hidden="true"
            className="
              mx-2.5 h-6 w-px
              bg-[#765130]
              max-[550px]:mx-0.75
            "
          />

          <button
            type="button"
            className={toolButton}
            onClick={toggleBookmark}
            title={bookmark === page ? "Quitar marcador" : "Marcar esta página"}
            aria-label={
              bookmark === page ? "Quitar marcador" : "Guardar marcador"
            }
            aria-pressed={bookmark === page}
          >
            {bookmark === page ? (
              <BookMarked size={19} aria-hidden="true" />
            ) : (
              <Bookmark size={19} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className={toolButton}
            onClick={() => setFullscreen((current) => !current)}
            title={fullscreen ? "Salir de pantalla completa" : "Ampliar lector"}
            aria-label={
              fullscreen ? "Salir de pantalla completa" : "Pantalla completa"
            }
          >
            {fullscreen ? (
              <Minimize size={19} aria-hidden="true" />
            ) : (
              <Maximize size={19} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* ==========================================
          ESCENARIO DE LECTURA
      ========================================== */}

      <div
        ref={stageRef}
        className={`
          relative flex
          items-center justify-center
          overflow-auto
          border-b-2 border-[#9b6740]
          bg-[#301b12]
          bg-[radial-gradient(ellipse_at_50%_25%,#71513d99,transparent_60%),repeating-linear-gradient(92deg,#27170f_0_7px,#312016_12px_16px,#24140f_21px_27px)]
          px-7 py-11.25
          max-[800px]:px-5
          max-[800px]:py-8
          max-[550px]:px-4.5
          max-[550px]:py-7
          ${
            fullscreen
              ? "min-h-0 flex-1"
              : "min-h-190 max-[800px]:min-h-130 max-[550px]:min-h-100"
          }
        `}
      >
        {/* Marco interior */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute inset-4.5
            border border-[#9e774b88]
            max-[800px]:inset-2.5
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute
            top-[20%] left-1/2
            h-125 w-175
            -translate-x-1/2
            bg-[radial-gradient(ellipse,#f6bc6633,transparent_70%)]
          "
        />

        {/* Viñeta */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute inset-0
            shadow-[inset_0_0_110px_50px_#0c0808b8]
          "
        />

        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute top-1/2 left-7
            -translate-y-1/2
            font-serif text-[75px]
            text-[#a57b4e66]
            max-[800px]:hidden
          "
        >
          ✧
        </span>

        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute top-1/2 right-7
            -translate-y-1/2
            font-serif text-[75px]
            text-[#a57b4e66]
            max-[800px]:hidden
          "
        >
          ✧
        </span>

        <Document
          file={book.file}
          onLoadSuccess={({ numPages }) => handleDocumentLoad(numPages)}
          className="
            relative z-10
            w-max max-w-full
          "
          loading={<DocumentPlaceholder book={book} />}
          error={
            <div
              className="
                flex min-h-105
                flex-col items-center
                justify-center gap-3.75
                px-6 text-center
                text-[#ecd2a3]
              "
            >
              <p
                className="
                  font-(family-name:--font-rol-body)
                  text-[23px]
                "
              >
                El documento no pudo cargarse.
              </p>

              <a
                href={book.file}
                target="_blank"
                rel="noreferrer"
                className="
                  inline-flex items-center gap-2
                  text-[#f0c07e]
                  transition-colors
                  hover:text-[#ffe0a6]
                "
              >
                Abrir el PDF directamente
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            </div>
          }
        >
          {pages > 0 && (
            <div
              className="
                flex items-stretch
                justify-center
                perspective-[1400px]
                drop-shadow-[0_26px_24px_#000b]
              "
            >
              {/* Página izquierda: escritorio */}
              {!mobile && (
                <div
                  className={`
                    relative flex min-w-0
                    origin-center
                    items-start justify-center
                    overflow-hidden
                    rounded-l-lg
                    border-r-2 border-[#9b876d]
                    bg-[#f5f1e9]
                    shadow-[inset_-14px_0_22px_#38261927]
                    transition-[transform,filter]
                    duration-420
                    ease-in-out
                    [&_.react-pdf__Page__canvas]:block
                    ${
                      turn === "prev"
                        ? "transform-[rotateY(65deg)] brightness-75"
                        : ""
                    }
                  `}
                >
                  <Page
                    pageNumber={page}
                    width={renderWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div
                        className="
                          flex min-h-125
                          min-w-67.5
                          items-center justify-center
                          bg-[#f1e6cf]
                          font-serif text-lg
                          text-[#6b533f]
                        "
                      >
                        Cargando página…
                      </div>
                    }
                  />
                </div>
              )}

              {/* Página derecha o página única en móvil */}
              <div
                className={`
                  relative flex min-w-0
                  origin-center
                  items-start justify-center
                  overflow-hidden
                  bg-[#f5f1e9]
                  transition-[transform,filter]
                  duration-420
                  ease-in-out
                  [&_.react-pdf__Page__canvas]:block
                  ${
                    mobile
                      ? "rounded-md shadow-[0_0_5px_#0008]"
                      : "rounded-r-lg shadow-[inset_14px_0_22px_#38261927]"
                  }
                  ${
                    turn === "next"
                      ? "transform-[rotateY(-65deg)] brightness-[0.78]"
                      : ""
                  }
                  ${
                    mobile && turn === "prev"
                      ? "transform-[rotateY(45deg)]"
                      : ""
                  }
                `}
              >
                {mobile || page + 1 <= pages ? (
                  <Page
                    pageNumber={mobile ? page : page + 1}
                    width={renderWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div
                        className="
                          flex min-h-125
                          min-w-67.5
                          items-center justify-center
                          bg-[#f1e6cf]
                          font-serif text-lg
                          text-[#6b533f]
                        "
                      >
                        Cargando página…
                      </div>
                    }
                  />
                ) : (
                  <div
                    className="
                      aspect-[1/1.415]
                      shrink-0
                      bg-[linear-gradient(95deg,#dfd3be,#f3eee5_8%)]
                    "
                    style={{
                      width: renderWidth,
                    }}
                    aria-label="Página final en blanco"
                  />
                )}
              </div>
            </div>
          )}
        </Document>
      </div>

      {/* ==========================================
          CONTROLES DE NAVEGACIÓN
      ========================================== */}

      <div
        className="
          flex min-h-22
          shrink-0 items-center
          justify-between gap-4
          border-b border-[#533720]
          bg-[#231710]
          px-6 py-3
          max-[550px]:gap-1.25
          max-[550px]:px-3
        "
      >
        <button
          type="button"
          className={turnButton}
          onClick={() => changePage(page - step)}
          disabled={page <= 1 || Boolean(turn) || !pages}
        >
          <ChevronLeft size={21} aria-hidden="true" />

          <span className="max-[550px]:hidden">Anterior</span>
        </button>

        <div
          className="
            w-70 max-w-[43%]
            text-center
            max-[550px]:max-w-none
            max-[550px]:flex-1
          "
        >
          <span
            className="
              text-[11px] font-extrabold
              tracking-[0.11em]
              text-[#e1bf89]
              max-[550px]:text-[10px]
            "
          >
            {mobile
              ? `PÁGINA ${page}`
              : `PÁGINAS ${page}${
                  page < pages ? ` – ${Math.min(pages, page + 1)}` : ""
                }`}{" "}
            <small
              className="
                text-[11px]
                text-[#9e8665]
              "
            >
              / {pages || book.pages}
            </small>
          </span>

          <progress
            value={progressPage}
            max={pages || 1}
            aria-label="Progreso de lectura"
            className="
              mt-3 block h-1 w-full
              appearance-none
              overflow-hidden border-0
              bg-[#5d3d26]
              [&::-webkit-progress-bar]:bg-[#5d3d26]
              [&::-webkit-progress-value]:bg-linear-to-r
              [&::-webkit-progress-value]:from-[#9b6b36]
              [&::-webkit-progress-value]:to-[#e3af60]
              [&::-moz-progress-bar]:bg-[#d9a45a]
            "
          />
        </div>

        <button
          type="button"
          className={turnButton}
          onClick={() => changePage(page + step)}
          disabled={page >= pages || Boolean(turn) || !pages}
        >
          <span className="max-[550px]:hidden">Siguiente</span>

          <ChevronRight size={21} aria-hidden="true" />
        </button>
      </div>

      {/* ==========================================
          ACCIONES ADICIONALES
      ========================================== */}

      <div
        className="
          flex shrink-0 flex-wrap
          items-center justify-between
          gap-x-5.5 gap-y-3.25
          border-b border-[#422b1c]
          bg-[#170f0b]
          px-6.25 py-4.5
          max-[550px]:justify-center
          max-[550px]:px-3
        "
      >
        {/* Ir a página */}
        <form
          onSubmit={goToInput}
          className="
            flex items-center gap-2.25
          "
        >
          <label
            htmlFor={`jump-page-${book.slug}`}
            className="
              text-[10px]
              font-extrabold tracking-[0.09em]
              text-[#b29064]
            "
          >
            IR A PÁGINA
          </label>

          <input
            id={`jump-page-${book.slug}`}
            type="number"
            min={1}
            max={pages || book.pages}
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            className="
              w-18
              border border-[#815630]
              bg-[#24180f]
              px-2 py-1.75
              text-center text-[13px]
              text-[#e7c18a]
              outline-none
              focus:border-[#d6a66c]
            "
          />

          <button
            type="submit"
            className="
              inline-flex items-center gap-1
              bg-[#3b271a]
              px-3 py-2.25
              text-[11px] font-extrabold
              text-[#e4bb7c]
              transition-colors
              hover:bg-[#54351f]
            "
          >
            IR
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </form>

        {/* Marcador guardado */}
        {bookmark !== null && (
          <button
            type="button"
            onClick={() => changePage(bookmark)}
            className={readerLink}
          >
            <BookMarked size={17} aria-hidden="true" />
            Ir al marcador (p. {bookmark})
          </button>
        )}

        {/* Enlaces del documento */}
        <div
          className="
            flex items-center gap-4.75
            max-[550px]:w-full
            max-[550px]:justify-center
          "
        >
          <a
            href={book.file}
            target="_blank"
            rel="noreferrer"
            className={readerLink}
          >
            <ExternalLink size={16} aria-hidden="true" />
            Vista PDF
          </a>

          <a href={book.file} download className={readerLink}>
            <Download size={16} aria-hidden="true" />
            Descargar PDF
          </a>
        </div>
      </div>

      {/* AYUDA */}
      {!fullscreen && (
        <p
          className="
            m-0 bg-[#120c09]
            px-3.75 pt-4.25
            pb-5.5
            text-center text-[11px]
            leading-[1.6]
            text-[#9d8b73]
          "
        >
          Podés pasar las páginas con las flechas del teclado. Tu progreso y
          marcador se guardan en este navegador.{" "}
          <span className="max-[800px]:hidden">
            En celulares se muestra una página por vez.
          </span>
        </p>
      )}
    </div>
  );
}

// Se reinicializa el estado si cambia el volumen.
export function PdfReader({ book }: { book: RoleBook }) {
  return <PdfReaderContent key={book.slug} book={book} />;
}
