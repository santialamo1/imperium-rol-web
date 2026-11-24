"use client";
/* eslint-disable @next/next/no-img-element -- Las hojas WebP provienen de nuestra propia API de lectura. */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CSSProperties, FormEvent, TouchEvent } from "react";
import Link from "next/link";
import { RolOrnamentalButton } from "@/components/rol-ornamental-button";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Maximize,
  Minimize,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { BookChapterSummary } from "@/lib/book-chapters";

type Props = {
  book: { slug: string; roman: string; subtitle: string };
  chapters: BookChapterSummary[];
  initialChapterId: string;
  directChapterLink?: boolean;
};
type Position = { section: number; page: number };
type PageMeta = {
  id: string;
  title: string;
  pages: number;
  fontSize: number;
  version: string;
  matchPage: number | null;
};
type SearchHit = {
  chapterId: string;
  chapterTitle: string;
  occurrence: number;
  excerpt: string;
};
type SearchReply = {
  query: string;
  results: SearchHit[];
  truncated: boolean;
  error?: string;
};
type Match = {
  section: number;
  query: string;
  occurrence: number;
};
type Flip = {
  from: Position;
  to: Position;
  direction: "next" | "prev";
  phase: "preparing" | "animating";
};

const EMPTY_SUBSCRIBE = () => () => {};
const CLIENT = () => true;
const SERVER = () => false;
const MIN_SIZE = 14;
const MAX_SIZE = 22;

function savedPosition(key: string, legacyKey: string, chapters: BookChapterSummary[]) {
  try {
    const current = window.localStorage.getItem(key);
    const previous = current ?? window.localStorage.getItem(legacyKey);
    if (!previous) return null;
    const value: unknown = JSON.parse(previous);
    if (!value || typeof value !== "object") return null;
    const item = value as Record<string, unknown>;
    const section = chapters.findIndex((chapter) => chapter.id === item.id);
    if (section < 0) return null;
    const fontSize = typeof item.fontSize === "number" && Number.isInteger(item.fontSize)
      ? Math.max(MIN_SIZE, Math.min(MAX_SIZE, item.fontSize)) : 17;
    // Las páginas HTML anteriores tenían otra distribución; recuperamos el capítulo
    // pero NO un número de hoja incompatible con las páginas WebP.
    const page = current && typeof item.page === "number" && Number.isSafeInteger(item.page)
      ? Math.max(0, item.page) : 0;
    return { position: { section, page }, fontSize };
  } catch {
    return null;
  }
}

function Paper({ src, label, side }: {
  src: string | null;
  label: string;
  side: "left" | "right";
}) {
  const style: CSSProperties = {
    background: side === "left"
      ? "linear-gradient(90deg,#e2cca5,#f5e6c8 12%,#f3e5c9 82%,#c5a77e)"
      : "linear-gradient(90deg,#baa080,#f2e2c3 15%,#f5e6c8 87%,#dfc397)",
  };
  return (
    <div style={style} className="relative size-full overflow-hidden border border-[#9c7952] shadow-[inset_0_0_28px_#94714d45]">
      {src ? (
        <img src={src} alt={label} draggable={false}
          className="pointer-events-none block size-full select-none" style={{ objectFit: "fill" }} />
      ) : null}
      <div aria-hidden="true" className={`pointer-events-none absolute inset-y-0 z-10 w-4 ${
        side === "left" ? "right-0 bg-linear-to-l from-[#56382037] to-transparent" : "left-0 bg-linear-to-r from-[#56382037] to-transparent"
      }`} />
    </div>
  );
}

export function ImageBookReader(props: Props) {
  const hydrated = useSyncExternalStore(EMPTY_SUBSCRIBE, CLIENT, SERVER);
  if (!hydrated) {
    return <div className="border border-[#805630] bg-[#1e140f] px-6 py-12 text-center text-[#e9c590]">Preparando el libro…</div>;
  }
  return <ImageBookReaderClient {...props} />;
}

function ImageBookReaderClient({ book, chapters, initialChapterId, directChapterLink = false }: Props) {
  const initialSection = Math.max(0, chapters.findIndex((chapter) => chapter.id === initialChapterId));
  const storageKey = `iao-rol-image-continuo:${book.slug}`;
  const [restored] = useState(() => directChapterLink ? null : savedPosition(
    storageKey, `iao-rol-md-continuo:${book.slug}`, chapters,
  ));
  const [size, setSize] = useState(restored?.fontSize ?? 17);
  const [position, setPosition] = useState<Position>(restored?.position ?? { section: initialSection, page: 0 });
  const [containerWidth, setContainerWidth] = useState(1080);
  const [metas, setMetas] = useState<Record<string, PageMeta>>({});
  const [flip, setFlip] = useState<Flip | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [jumpBusy, setJumpBusy] = useState(false);
  const [returnPosition, setReturnPosition] = useState<Position | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const touchXRef = useRef<number | null>(null);
  const turnsRef = useRef(0);
  const cacheRef = useRef(new Map<string, Promise<void>>());
  const inflightMetaRef = useRef(new Map<string, Promise<PageMeta>>());
  const searchAbortRef = useRef<AbortController | null>(null);

  const wide = containerWidth >= 850;
  const pageWidth = Math.max(240, Math.floor(Math.min(wide ? 500 : 530, (containerWidth - 32) / (wide ? 2 : 1))));
  const pageHeight = Math.round(pageWidth * 1.4);
  const step = wide ? 2 : 1;
  const keyFor = useCallback((section: number, fontSize: number) => `${section}:${fontSize}`, []);
  const metaFor = useCallback((section: number) => metas[keyFor(section, size)], [metas, keyFor, size]);
  const currentMeta = metaFor(position.section);
  const first = wide ? Math.floor(position.page / 2) * 2 : position.page;
  const visiblePage = currentMeta ? Math.max(0, Math.min(first, currentMeta.pages - 1)) : first;
  const current = useMemo<Position>(
    () => ({ section: position.section, page: visiblePage }),
    [position.section, visiblePage],
  );

  const apiFor = useCallback((section: number, fontSize: number) => {
    const id = chapters[section]?.id;
    return id
      ? `/api/rol/books/${encodeURIComponent(book.slug)}/images/${encodeURIComponent(id)}?size=${fontSize}`
      : null;
  }, [chapters, book.slug]);

  const fetchMeta = useCallback((section: number, fontSize: number): Promise<PageMeta> => {
    const id = chapters[section]?.id;
    const url = apiFor(section, fontSize);
    if (!id || !url) return Promise.reject(new Error("Capítulo inexistente."));
    const key = keyFor(section, fontSize);
    const already = metas[key];
    if (already) return Promise.resolve(already);
    const running = inflightMetaRef.current.get(key);
    if (running) return running;
    const pending = fetch(url, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as PageMeta & { error?: string };
        if (!response.ok || !Number.isSafeInteger(data.pages) || data.pages < 1 || !data.version) {
          throw new Error(data.error ?? "No se pudo cargar la paginación del capítulo.");
        }
        return data;
      })
      .then((data) => {
        setMetas((prev) => ({ ...prev, [key]: data }));
        return data;
      })
      .finally(() => inflightMetaRef.current.delete(key));
    inflightMetaRef.current.set(key, pending);
    return pending;
  }, [apiFor, chapters, keyFor, metas]);

  // Cargamos únicamente la paginación (sin Markdown), del capítulo actual y vecinos.
  useEffect(() => {
    for (let section = position.section - 1; section <= position.section + 1; section++) {
      if (section < 0 || section >= chapters.length) continue;
      void fetchMeta(section, size).catch((cause: unknown) => {
        if (section === position.section) setReaderError(cause instanceof Error ? cause.message : "Error al cargar el capítulo.");
      });
    }
  }, [chapters.length, position.section, size, fetchMeta]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0]?.contentRect.width ?? 1080);
      if (width > 0) setContainerWidth(width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);
  useEffect(() => () => searchAbortRef.current?.abort(), []);

  const srcFor = useCallback((cursor: Position | null): string | null => {
    if (!cursor) return null;
    const info = metaFor(cursor.section);
    const base = apiFor(cursor.section, size);
    if (!base || !info || cursor.page < 0 || cursor.page >= info.pages) return null;
    const active = match?.section === cursor.section ? match : null;
    const extra = active ? `&q=${encodeURIComponent(active.query)}&occurrence=${active.occurrence}` : "";
    return `${base}&page=${cursor.page}&v=${info.version}${extra}`;
  }, [metaFor, apiFor, size, match]);

  const preload = useCallback((url: string): Promise<void> => {
    const stored = cacheRef.current;
    const previous = stored.get(url);
    if (previous) return previous;
    const pending = new Promise<void>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        if (image.decode) void image.decode().then(resolve, resolve);
        else resolve();
      };
      image.onerror = () => reject(new Error("No se pudo preparar una imagen."));
      image.src = url;
    });
    stored.set(url, pending);
    if (stored.size > 80) {
      const firstKey = stored.keys().next().value;
      if (firstKey) stored.delete(firstKey);
    }
    void pending.catch(() => { if (stored.get(url) === pending) stored.delete(url); });
    return pending;
  }, []);

  const rightOf = useCallback((cursor: Position): Position | null => {
    const info = metaFor(cursor.section);
    if (!info || cursor.page + 1 >= info.pages) return null;
    return { section: cursor.section, page: cursor.page + 1 };
  }, [metaFor]);

  const destination = useCallback((direction: "next" | "prev", cursor: Position): Position | null => {
    const info = metaFor(cursor.section);
    if (!info) return null;
    const page = (wide ? Math.floor(cursor.page / 2) * 2 : cursor.page) + (direction === "next" ? step : -step);
    if (page >= 0 && page < info.pages) return { section: cursor.section, page };
    const section = cursor.section + (direction === "next" ? 1 : -1);
    const other = metaFor(section);
    if (section < 0 || section >= chapters.length || !other) return null;
    return { section, page: direction === "next" ? 0 : wide ? Math.floor((other.pages - 1) / 2) * 2 : other.pages - 1 };
  }, [chapters.length, metaFor, step, wide]);

  const next = destination("next", current);
  const previous = destination("prev", current);
  const canNext = Boolean(currentMeta && next && !flip && !jumpBusy);
  const canPrevious = Boolean(currentMeta && previous && !flip && !jumpBusy);

  // Hoja actual + próximas y anteriores, sin solicitar el libro completo.
  useEffect(() => {
    if (!currentMeta) return;
    const cursors: (Position | null)[] = [current, rightOf(current)];
    const upcoming = destination("next", current);
    const earlier = destination("prev", current);
    for (const cursor of [upcoming, earlier]) {
      if (cursor) cursors.push(cursor, rightOf(cursor));
    }
    for (const cursor of cursors) {
      const url = srcFor(cursor);
      if (url) void preload(url).catch(() => undefined);
    }
  }, [current, currentMeta, rightOf, destination, srcFor, preload]);

  const cancelTurn = () => { turnsRef.current += 1; setFlip(null); };
  function move(direction: "next" | "prev") {
    if (flip || jumpBusy) return;
    const target = direction === "next" ? next : previous;
    if (!target) return;
    const pending: Flip = { from: current, to: target, direction, phase: "preparing" };
    const token = ++turnsRef.current;
    setReaderError(null);
    setFlip(pending);
    const all = [current, rightOf(current), target, rightOf(target)];
    const urls = all.map(srcFor).filter((url): url is string => Boolean(url));
    void Promise.all([...new Set(urls)].map(preload)).then(() => {
      if (turnsRef.current === token) setFlip({ ...pending, phase: "animating" });
    }).catch(() => {
      if (turnsRef.current === token) {
        setReaderError("No se pudo cargar una hoja. Intentá nuevamente.");
        setFlip(null);
      }
    });
  }

  useEffect(() => {
    if (flip?.phase !== "animating" || !sheetRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animation = sheetRef.current.animate(
      [{ transform: "rotateY(0deg)" }, { transform: `rotateY(${flip.direction === "next" ? -180 : 180}deg)` }],
      { duration: reduced ? 1 : 510, easing: "cubic-bezier(0.42,0,0.25,1)", fill: "forwards" },
    );
    let cancelled = false;
    void animation.finished.then(() => {
      if (cancelled) return;
      setPosition(flip.to);
      setMatch(null); // El resaltado se quita una vez terminado el giro.
      setFlip(null);
    }).catch(() => undefined);
    return () => { cancelled = true; animation.cancel(); };
  }, [flip]);

  // La navegación por búsqueda NO sobrescribe el progreso de lectura personal.
  useEffect(() => {
    if (returnPosition || jumpBusy || !currentMeta || !chapters[position.section]) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({
        id: chapters[position.section].id,
        page: Math.min(position.page, currentMeta.pages - 1),
        fontSize: size,
      }));
    } catch { /* El lector sigue funcionando aunque el almacenamiento esté deshabilitado. */ }
  }, [returnPosition, jumpBusy, currentMeta, position, chapters, storageKey, size]);

  const searchGroups = useMemo(() => {
    const groups: { id: string; title: string; matches: SearchHit[] }[] = [];
    for (const hit of searchResults) {
      const last = groups[groups.length - 1];
      if (last && last.id === hit.chapterId) last.matches.push(hit);
      else groups.push({ id: hit.chapterId, title: hit.chapterTitle, matches: [hit] });
    }
    return groups;
  }, [searchResults]);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchText.trim();
    if (query.length < 2 || query.length > 80) {
      setSearchError("Escribí entre 2 y 80 caracteres.");
      return;
    }
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearchBusy(true);
    setSearchError(null);
    setSearchResults([]);
    setSubmitted("");
    try {
      const response = await fetch(`/api/rol/books/${encodeURIComponent(book.slug)}/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal, cache: "no-store",
      });
      const data = await response.json() as SearchReply;
      if (!response.ok || data.error) throw new Error(data.error ?? "No se pudo completar la búsqueda.");
      if (controller.signal.aborted) return;
      setSearchResults(data.results);
      setTruncated(data.truncated);
      setSubmitted(data.query);
    } catch (cause) {
      if (!controller.signal.aborted) setSearchError(cause instanceof Error ? cause.message : "Error de búsqueda.");
    } finally {
      if (searchAbortRef.current === controller) {
        searchAbortRef.current = null;
        setSearchBusy(false);
      }
    }
  }

  function goToHit(hit: SearchHit) {
    const section = chapters.findIndex((chapter) => chapter.id === hit.chapterId);
    if (section < 0 || !submitted) return;
    cancelTurn();
    setReaderError(null);
    setJumpBusy(true);
    setReturnPosition((currentSaved) => currentSaved ?? current);
    setSearchOpen(false);
    setMatch({ section, query: submitted, occurrence: hit.occurrence });
  }

  // Consultamos únicamente la ubicación de la coincidencia: el servidor
  // nunca responde el Markdown ni envía un número de hoja fijo entre tamaños.
  useEffect(() => {
    if (!match) return;
    const url = apiFor(match.section, size);
    if (!url) return;
    const controller = new AbortController();
    const extra = `&q=${encodeURIComponent(match.query)}&occurrence=${match.occurrence}`;
    void (async () => {
      try {
        const response = await fetch(`${url}${extra}`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json() as PageMeta & { error?: string };
        if (!response.ok || result.matchPage === null || !Number.isSafeInteger(result.matchPage)) {
          throw new Error(result.error || "No se pudo ubicar esa coincidencia.");
        }
        if (controller.signal.aborted) return;
        const key = keyFor(match.section, size);
        setMetas((old) => ({ ...old, [key]: result }));
        const selectedPage = wide ? Math.floor(result.matchPage / 2) * 2 : result.matchPage;
        setPosition({ section: match.section, page: selectedPage });
        setReaderError(null);
      } catch (cause) {
        if (!controller.signal.aborted) setReaderError(cause instanceof Error ? cause.message : "No se pudo abrir la coincidencia.");
      } finally {
        if (!controller.signal.aborted) setJumpBusy(false);
      }
    })();
    return () => controller.abort();
  }, [match, size, wide, apiFor, keyFor]);

  function returnToReading() {
    if (!returnPosition) return;
    cancelTurn();
    setMatch(null);
    setJumpBusy(false);
    setPosition(returnPosition);
    setReturnPosition(null);
    setReaderError(null);
    setSearchOpen(false);
  }

  function changeSize(direction: number) {
    const updated = Math.max(MIN_SIZE, Math.min(MAX_SIZE, size + direction));
    if (updated === size) return;
    cancelTurn();
    if (match) setJumpBusy(true);
    setSize(updated);
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (searchOpen) setSearchOpen(false);
        else setFullscreen(false);
        return;
      }
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)) return;
      if (event.key === "ArrowRight") { event.preventDefault(); move("next"); }
      if (event.key === "ArrowLeft") { event.preventDefault(); move("prev"); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchXRef.current = event.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const previous = touchXRef.current;
    const nextX = event.changedTouches[0]?.clientX;
    touchXRef.current = null;
    if (previous === null || nextX === undefined || Math.abs(nextX - previous) < 65) return;
    move(nextX < previous ? "next" : "prev");
  }

  const picture = (cursor: Position | null, side: "left" | "right") => <Paper
    src={srcFor(cursor)}
    label={cursor ? `Hoja ${cursor.page + 1} del capítulo «${chapters[cursor.section]?.title ?? ""}»` : "Hoja en blanco"}
    side={side}
  />;
  const turning = flip?.phase === "animating";
  const forward = flip?.direction === "next";
  const frameCurrent = turning && flip ? flip.from : current;
  const targetRight = turning && flip ? rightOf(flip.to) : null;
  const rightPage = rightOf(frameCurrent);
  const title = chapters[position.section]?.title ?? "Libro";
  const approximateProgress = Math.min(100, ((position.section + (visiblePage + 1) / (currentMeta?.pages ?? 1)) / chapters.length) * 100);
  const tool = "grid size-9 place-items-center rounded-sm border border-[#85592f] bg-[linear-gradient(180deg,#3d291b,#1b110c)] text-[#e9c38c] shadow-[inset_0_1px_0_#b98b4a33] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-[#eac287] disabled:opacity-30";

  return (
    <div
      ref={containerRef}
      data-rol-reader="imagenes-servidor"
      className={`relative w-full select-none print:hidden [-webkit-user-select:none] [-webkit-touch-callout:none] font-(family-name:--font-rol-body) text-[#ead0a7] ${fullscreen ? "fixed inset-0 z-[1000] flex flex-col overflow-y-auto bg-[#100b08] p-3 md:p-6" : ""}`}
      onContextMenu={(event) => { if (!(event.target instanceof HTMLInputElement)) event.preventDefault(); }}
      onCopy={(event) => { if (!(event.target instanceof HTMLInputElement)) event.preventDefault(); }}
      onCut={(event) => { if (!(event.target instanceof HTMLInputElement)) event.preventDefault(); }}
      onDragStart={(event) => event.preventDefault()}
    >
      <header className="relative z-30 flex flex-wrap items-center justify-between gap-4 border border-[#805630] bg-[#1e140f] px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="font-(family-name:--font-rol-display) text-[10px] tracking-[0.17em] text-[#b78d58]">
            EMPERADORES DE LA CENIZA · LIBRO {book.roman}
          </p>
          <h2 className="mt-1 truncate font-(family-name:--font-rol-display) text-[clamp(15px,2vw,22px)] text-[#e9c590]">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Buscar en este libro" title="Buscar en este libro" aria-expanded={searchOpen} aria-controls="iao-image-search" onClick={() => setSearchOpen((value) => !value)} className={tool}>
            <Search size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Reducir texto" title="Reducir texto" disabled={size <= MIN_SIZE || Boolean(flip)} onClick={() => changeSize(-1)} className={tool}>
            <Minus size={17} aria-hidden="true" />
          </button>
          <span className="w-9 text-center text-xs tabular-nums">{size}px</span>
          <button type="button" aria-label="Ampliar texto" title="Ampliar texto" disabled={size >= MAX_SIZE || Boolean(flip)} onClick={() => changeSize(1)} className={tool}>
            <Plus size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"} title={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"} onClick={() => setFullscreen((value) => !value)} className={`${tool} ml-2`}>
            {fullscreen ? <Minimize size={17} aria-hidden="true" /> : <Maximize size={17} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {searchOpen && (
        <section id="iao-image-search" aria-label="Buscar texto en el libro" className="relative z-40 border-x border-b border-[#805630] bg-[linear-gradient(180deg,#28190f,#140d09)] px-4 py-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-(family-name:--font-rol-display) text-xs font-semibold tracking-[0.12em] text-[#dfb981]">BUSCAR EN EL LIBRO {book.roman}</p>
              <button type="button" aria-label="Cerrar búsqueda" onClick={() => setSearchOpen(false)} className="rounded p-2 text-[#cba572] hover:bg-[#49301e]"><X size={18} /></button>
            </div>
            <form onSubmit={(event) => void search(event)} className="flex flex-col gap-2 sm:flex-row">
              <input ref={searchInputRef} type="search" minLength={2} maxLength={80} value={searchText} onChange={(event) => setSearchText(event.target.value)}
                placeholder="Personaje, lugar o frase…" aria-label="Palabra o frase que querés encontrar en este libro" autoComplete="off"
                className="min-h-11 min-w-0 flex-1 rounded-sm border border-[#8b6339] bg-[#100b08] px-3 py-2 text-sm text-[#f2d9ad] outline-none placeholder:text-[#a38465] focus:border-[#e0b36e] select-text [-webkit-user-select:text]" />
              <button type="submit" disabled={searchBusy || searchText.trim().length < 2} className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#996a3b] bg-[#4a301b] px-5 text-sm font-semibold text-[#f1d0a1] hover:enabled:bg-[#634022] disabled:opacity-50">
                <Search size={16} /> {searchBusy ? "Buscando…" : "Buscar"}
              </button>
            </form>
            {searchError && <p role="alert" className="mt-3 text-sm text-[#ffd2b5]">{searchError}</p>}
            {submitted && !searchBusy && (
              <div className="mt-4">
                <p role="status" className="mb-3 text-xs text-[#d7b58b]">{searchResults.length > 0
                  ? `${searchResults.length}${truncated ? " o más" : ""} coincidencias de «${submitted}» en este libro`
                  : `No se encontraron coincidencias de «${submitted}» en este libro.`}
                  {truncated && " · Mostrando las primeras 200; usá una búsqueda más específica."}</p>
                {searchResults.length > 0 && (
                  <div className="max-h-[min(440px,55vh)] overflow-y-auto overscroll-contain border border-[#624228] bg-[#150e0a] [scrollbar-color:#886038_#150e0a]">
                    {searchGroups.map((group) => (
                      <div key={group.id}>
                        <div className="sticky top-0 z-20 bg-[#150e0a] px-2 pt-2">
                          <h3 className="border-b border-[#644329] bg-[#25180f] px-3 py-2 font-(family-name:--font-rol-display) text-xs font-semibold text-[#e2b985]">
                            {group.title} · {group.matches.length} {group.matches.length === 1 ? "coincidencia" : "coincidencias"}
                          </h3>
                        </div>
                        <div className="px-2">
                          {group.matches.map((hit) => (
                            <button type="button" key={`${hit.chapterId}:${hit.occurrence}`} onClick={() => goToHit(hit)}
                              className="flex w-full items-center justify-between gap-4 border-b border-[#49311e] px-3 py-3 text-left hover:bg-[#46301e] focus-visible:outline-2 focus-visible:outline-[#edc188]">
                              <span className="text-sm leading-relaxed text-[#d5b994]">{hit.excerpt}</span>
                              <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-[#e8bb79]">Ir al texto <ChevronRight size={15} className="inline" /></span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {(returnPosition || jumpBusy || readerError) && (
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-x border-b border-[#805630] bg-[#32200f] px-4 py-2 text-xs text-[#eed2a2] md:px-6">
          <span>{jumpBusy ? "Localizando coincidencia…" : readerError ?? (match ? `Coincidencia localizada · hoja ${visiblePage + 1} del capítulo` : "Navegación por búsqueda")}</span>
          {returnPosition && (
            <button type="button" onClick={returnToReading} className="inline-flex items-center gap-2 text-[#f3cb91] underline underline-offset-2 hover:text-white">
              <ArrowLeft size={15} /> Volver a mi lectura
            </button>
          )}
        </div>
      )}

      <div className="relative z-10 flex min-h-[320px] items-center justify-center overflow-hidden border-x border-[#805630] bg-[radial-gradient(ellipse_at_50%_40%,#543824,#24170f_75%)] px-2 py-8 md:px-6 md:py-12"
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="relative mx-auto bg-[#3d291b] p-2 shadow-[0_25px_65px_#0009]" style={{ width: pageWidth * (wide ? 2 : 1) + 16 }}>
          <div className="relative perspective-[2200px]" aria-label="Libro abierto, páginas convertidas en imágenes"
            style={{ width: pageWidth * (wide ? 2 : 1), height: pageHeight }}>
            {currentMeta ? (
              <>
                <div className="absolute inset-0 z-0 flex">
                  <div className={wide ? "h-full w-1/2" : "h-full w-full"}>
                    {picture(turning && flip && (wide && !forward || !wide) ? flip.to : current, "left")}
                  </div>
                  {wide && (
                    <div className="h-full w-1/2">
                      {picture(turning && flip && forward ? targetRight : rightPage, "right")}
                    </div>
                  )}
                </div>
                {turning && flip && (
                  <div ref={sheetRef} className="absolute top-0 z-20 transform-3d" style={{
                    left: wide && forward ? pageWidth : 0,
                    width: pageWidth,
                    height: pageHeight,
                    transformOrigin: forward ? "left center" : "right center",
                  }}>
                    <div className="absolute inset-0 backface-hidden">
                      {picture(wide ? (forward ? rightOf(flip.from) : flip.from) : flip.from, forward ? "right" : "left")}
                    </div>
                    <div className="absolute inset-0 backface-hidden transform-[rotateY(180deg)]">
                      {picture(wide ? (forward ? flip.to : rightOf(flip.to)) : flip.to, forward ? "left" : "right")}
                    </div>
                  </div>
                )}
                {wide && <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-1.5 -translate-x-1/2 bg-linear-to-r from-[#41291b66] via-[#28180d66] to-[#ceae8655]" />}
              </>
            ) : (
              <div className="flex size-full items-center justify-center gap-2 bg-[#eddbbb] text-sm text-[#66492d]">
                <LoaderCircle size={17} className="animate-spin" /> Preparando páginas…
              </div>
            )}
          </div>
        </div>
      </div>

      <nav aria-label="Navegación del libro" className="relative z-20 grid grid-cols-2 items-center gap-2 border border-[#805630] bg-[linear-gradient(180deg,#26180f,#140d09)] px-2 py-3 sm:grid-cols-[minmax(110px,180px)_minmax(0,1fr)_minmax(110px,180px)] sm:gap-5 sm:px-6 sm:py-4">
        <RolOrnamentalButton type="button" size="compact" className="!w-full" onClick={() => move("prev")} disabled={!canPrevious} ariaLabel="Pasar a las hojas anteriores" icon={<ChevronLeft aria-hidden="true" />} iconPosition="left">
          ANTERIOR
        </RolOrnamentalButton>
        <div className="order-first col-span-2 min-w-0 px-1 text-center sm:order-none sm:col-span-1">
          <p className="mb-1 text-[9px] font-semibold tracking-[0.19em] text-[#a98556] sm:text-[10px]">AHORA ESTÁS LEYENDO</p>
          <p aria-live="polite" title={title} className="truncate font-(family-name:--font-rol-display) text-[12px] leading-[1.45] text-[#f0cf98] sm:text-[16px]">{title}</p>
          <div role="progressbar" aria-label="Avance orientativo por secciones del libro" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(approximateProgress)}
            className="mx-auto mt-2.5 h-0.75 w-full max-w-60 bg-[#644128]">
            <div className="h-full bg-[linear-gradient(90deg,#8c5a2d,#e3b675)] transition-[width] duration-200" style={{ width: `${approximateProgress}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-[#bba07d]">{currentMeta
            ? `Hoja ${visiblePage + 1}${wide && visiblePage + 1 < currentMeta.pages ? `–${visiblePage + 2}` : ""} de ${currentMeta.pages}`
            : "Calculando hojas…"}</p>
        </div>
        <RolOrnamentalButton type="button" size="compact" className="!w-full" onClick={() => move("next")} disabled={!canNext} ariaLabel="Pasar a las hojas siguientes" icon={<ChevronRight aria-hidden="true" />}>
          SIGUIENTE
        </RolOrnamentalButton>
      </nav>

      <footer className="relative z-30 flex items-center justify-center border-x border-b border-[#805630] bg-[#120b08] px-4 py-3 sm:py-4">
        <details className="group relative w-full max-w-[280px]">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center gap-3 border-y border-[#7a4d2a] bg-[linear-gradient(180deg,#29190f,#130c08)] px-4 py-2 text-[#e2ba83] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-[#edc188] [&::-webkit-details-marker]:hidden">
            <BookOpen size={17} /><span className="font-(family-name:--font-rol-display) text-[12px] font-semibold tracking-[0.08em]">ÍNDICE DE CAPÍTULOS</span>
            <ChevronDown size={15} className="transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="absolute bottom-full left-1/2 z-50 mb-3 max-h-[min(420px,65vh)] w-[min(450px,90vw)] -translate-x-1/2 overflow-y-auto overscroll-contain border border-[#9c6b3b] bg-[#1a110c] p-2 shadow-[0_25px_60px_#000d]">
            <p className="border-b border-[#5d3d24] px-3 py-3 text-center font-(family-name:--font-rol-display) text-[11px] font-bold tracking-[0.14em] text-[#c99e69]">CONTENIDO DEL LIBRO {book.roman}</p>
            {chapters.map((item, index) => (
              <Link key={item.id} href={`/rol/libros/${book.slug}?capitulo=${encodeURIComponent(item.id)}`} scroll={false}
                className={`block border-b border-[#51361f] py-3 text-[14px] leading-[1.4] hover:bg-[#49301c] ${
                  (item as BookChapterSummary & { type?: string }).type === "parte"
                    ? "mt-2 px-3 font-(family-name:--font-rol-display) font-bold uppercase tracking-[0.04em] text-[#e0bd83]"
                    : (item as BookChapterSummary & { type?: string }).type === "capitulo"
                      ? "pl-7 pr-3 text-[#cbb092]" : "px-3 text-[#c7a782]"
                } ${index === position.section ? "bg-[#3b281a] text-[#ffda9c]" : ""}`}>
                {item.title}
              </Link>
            ))}
          </div>
        </details>
      </footer>
    </div>
  );
}
