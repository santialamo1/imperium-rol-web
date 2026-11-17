"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { RolSectionHero } from "@/components/rol-section-hero";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock3,
  FilterX,
  Landmark,
  MapPin,
  Search,
  Shield,
  UsersRound,
  X,
} from "lucide-react";

type Era = "Primer Imperio" | "Nueva Era";
type EraFilter = "todas" | Era;

type ChronologySource = {
  libro: string;
  capitulo: string;
  pagina: number | null;
};

export type ChronologyEvent = {
  id: string;
  orden: number;
  anio: number | null;
  periodo: string;
  precisionFecha: string;
  titulo: string;
  descripcion: string;
  consecuencias: string;
  personajes: string[];
  facciones: string[];
  lugares: string[];
  categoria: string;
  fuentes: ChronologySource[];
};

type Props = {
  events: ChronologyEvent[];
  cutDescription: string;
  revisionStatus: string;
};

const displayFont = "font-(family-name:--font-rol-display)";
const bodyFont = "font-(family-name:--font-rol-body)";
const container =
  "mx-auto w-[calc(100%_-_36px)] max-w-[1200px] min-[801px]:w-[calc(100%_-_76px)]";

const categoryLabels: Record<string, string> = {
  fundacion: "Fundaciones",
  sucesion: "Sucesiones",
  guerra: "Guerras",
  politica: "Política",
  alianza: "Alianzas",
  faccion: "Facciones",
  catastrofe: "Catástrofes",
  magia: "Magia",
  exploracion: "Exploración",
};

const categoryOrder = [
  "fundacion",
  "sucesion",
  "guerra",
  "politica",
  "alianza",
  "faccion",
  "catastrofe",
  "magia",
  "exploracion",
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function getEra(event: ChronologyEvent): Era {
  return event.periodo.includes("Primer Imperio")
    ? "Primer Imperio"
    : "Nueva Era";
}

function formatDate(event: ChronologyEvent) {
  if (event.precisionFecha === "intervalo" || event.anio === null) {
    return event.periodo;
  }

  return `Año ${event.anio} · ${getEra(event)}`;
}

function CategoryLabel({ category }: { category: string }) {
  return (
    <span className="inline-flex w-fit items-center border border-[#916438] bg-[#6d452126] px-2.25 py-1.25 text-[10px] font-semibold tracking-[0.04em] text-[#e6bb7d]">
      {categoryLabels[category] ?? category}
    </span>
  );
}

function DetailGroup({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: ReactNode;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h4 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#e0ba84]">
        {icon}
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="border border-[#5d412b] bg-[#241711] px-2.25 py-1.5 text-[13px] leading-[1.3] text-[#cbb292]"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function TimelineEntry({ event }: { event: ChronologyEvent }) {
  return (
    <article id={event.id} className="relative mb-5.5 scroll-mt-24">
      <span
        aria-hidden="true"
        className="absolute -left-6.5 top-6.75 size-2.5 rotate-45 border border-[#e4b575] bg-[#6e411f] shadow-[0_0_11px_#d3974355] sm:-left-11.75 sm:size-3"
      />

      <div className="overflow-hidden border border-[#76502e] bg-[radial-gradient(ellipse_at_10%_0%,#56311c48,transparent_65%),linear-gradient(120deg,#21140e,#140e0b)] shadow-[inset_0_0_0_1px_#bd864719,0_12px_24px_#0004] transition-colors duration-200 hover:border-[#a67945]">
        <div className="px-4.5 pt-5 pb-4.75 sm:px-6.75 sm:pt-6 sm:pb-5.5">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span
              className={`${displayFont} flex items-center gap-2 text-[11px] font-bold tracking-[0.06em] text-[#d2a46b] sm:text-[12px]`}
            >
              <CalendarDays size={16} aria-hidden="true" />
              {formatDate(event)}
            </span>
            <CategoryLabel category={event.categoria} />
          </div>

          <h3
            className={`${displayFont} text-[clamp(18px,2vw,25px)] font-semibold leading-[1.3] text-[#f2d3a3]`}
          >
            {event.titulo}
          </h3>
          <p className="mt-3.25 text-[16px] leading-[1.75] text-[#d2bda1] sm:text-[17px]">
            {event.descripcion}
          </p>
        </div>

        <details className="group border-t border-[#624127]">
          <summary
            className={`${displayFont} flex min-h-13.25 cursor-pointer list-none items-center justify-between gap-3 px-4.5 py-3 text-[11px] font-bold tracking-[0.045em] text-[#d1a56b] transition-colors hover:bg-[#42271755] hover:text-[#f5d09a] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#c99860] sm:px-6.75 [&::-webkit-details-marker]:hidden`}
          >
            CONSECUENCIAS, PERSONAJES Y FUENTES
            <ChevronDown
              aria-hidden="true"
              size={18}
              className="shrink-0 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>

          <div className="space-y-6 border-t border-[#51351f] bg-[#100b09a8] px-4.5 py-6 sm:px-6.75">
            <section>
              <h4 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#e0ba84]">
                <ArrowRight size={15} aria-hidden="true" />
                Consecuencias
              </h4>
              <p className="text-[15px] leading-[1.7] text-[#cfb99b]">
                {event.consecuencias}
              </p>
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              <DetailGroup
                title="Personajes"
                items={event.personajes}
                icon={<UsersRound size={15} aria-hidden="true" />}
              />
              <DetailGroup
                title="Lugares"
                items={event.lugares}
                icon={<MapPin size={15} aria-hidden="true" />}
              />
              <DetailGroup
                title="Pueblos y facciones"
                items={event.facciones}
                icon={<Shield size={15} aria-hidden="true" />}
              />
            </div>

            {event.fuentes.length > 0 && (
              <section className="border-t border-[#5b3d26] pt-5">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#e0ba84]">
                  <BookOpen size={15} aria-hidden="true" />
                  Referencias en Emperadores de la Ceniza
                </h4>
                <ul className="space-y-2.5">
                  {event.fuentes.map((source, index) => (
                    <li
                      key={`${source.libro}-${source.capitulo}-${index}`}
                      className="flex flex-col gap-1 border-l-2 border-[#78502d] pl-3 text-[13px] leading-normal text-[#bea88e]"
                    >
                      <Link
                        href={`/rol/libros/libro-${source.libro.toLowerCase()}`}
                        className="w-fit font-semibold text-[#eac38e] underline-offset-4 transition-colors hover:text-[#ffe1af] hover:underline"
                      >
                        Libro {source.libro}
                      </Link>
                      <span>{source.capitulo}</span>
                      {source.pagina !== null && (
                        <span>Página {source.pagina}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </details>
      </div>
    </article>
  );
}

export function ChronologyTimeline({ events }: Props) {
  const [query, setQuery] = useState("");
  const [era, setEra] = useState<EraFilter>("todas");
  const [category, setCategory] = useState("todas");

  const categories = useMemo(
    () =>
      categoryOrder.filter((item) =>
        events.some((event) => event.categoria === item),
      ),
    [events],
  );

  const filtered = useMemo(() => {
    const search = normalize(query.trim());

    return [...events]
      .sort((a, b) => a.orden - b.orden)
      .filter((event) => {
        if (era !== "todas" && getEra(event) !== era) return false;
        if (category !== "todas" && event.categoria !== category) return false;
        if (!search) return true;

        return normalize(
          [
            event.titulo,
            event.descripcion,
            event.consecuencias,
            event.periodo,
            event.anio?.toString() ?? "",
            ...event.personajes,
            ...event.facciones,
            ...event.lugares,
          ].join(" "),
        ).includes(search);
      });
  }, [events, query, era, category]);

  const groups = useMemo(() => {
    const firstEmpire = filtered.filter(
      (event) => getEra(event) === "Primer Imperio",
    );
    const newEra = filtered.filter((event) => getEra(event) === "Nueva Era");

    return [
      {
        title: "Primer Imperio" as const,
        subtitle: "Los orígenes del poder imperial",
        events: firstEmpire,
      },
      {
        title: "Nueva Era" as const,
        subtitle: "De Banderbill hasta el corte de 1439",
        events: newEra,
      },
    ].filter((group) => group.events.length > 0);
  }, [filtered]);

  const hasFilters =
    query.length > 0 || era !== "todas" || category !== "todas";

  function resetFilters() {
    setQuery("");
    setEra("todas");
    setCategory("todas");
  }

  return (
    <div className={bodyFont}>
      <RolSectionHero
        section="cronologia"
        eyebrow="ARCHIVO DE ROL / CRONOLOGÍA"
        title="Cronología histórica"
        description="Acontecimientos que marcaron el mundo de ImperiumAO, desde el Primer Imperio hasta el final del Libro IV."
      >
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[12px] text-[#e0ba87]">
          <span className="inline-flex items-center gap-2">
            <BookOpen size={16} aria-hidden="true" />
            {events.length} acontecimientos
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 size={16} aria-hidden="true" />
            Dos eras históricas
          </span>
        </div>
      </RolSectionHero>

      <div className={`${container} pb-27.5 pt-11 sm:pt-14.25`}>
        <section
          aria-label="Filtros de la cronología"
          className="
                      relative isolate
                      mx-auto mt-13 mb-15
                      max-[760px]:mt-8.75
                      box-border w-full max-w-247.5

                      border-28 border-solid border-transparent
                      bg-transparent shadow-none

                      px-1.5 py-3

                      [border-image-source:url('/rol/ui/frame-panel.png')]
                      [border-image-slice:230_150_170_150]
                      [border-image-width:1]
                      [border-image-repeat:stretch]

                      before:pointer-events-none
                      before:absolute
                      before:-z-10
                      before:inset-8.5
                      before:content-['']
                      before:bg-[linear-gradient(150deg,#24170f,#120d0a)]
                      before:blur-xl

                      sm:border-40
                      sm:px-3
                      sm:py-4.5
                      sm:before:inset-11

                      lg:border-52
                      lg:px-4
                      lg:py-5
                      lg:before:inset-14
                    "
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label
              htmlFor="chronology-search"
              className={`${displayFont} text-[11px] font-bold tracking-[0.13em] text-[#deb37a]`}
            >
              BUSCAR ACONTECIMIENTOS
            </label>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 text-[12px] text-[#c5a276] transition-colors hover:text-[#ffe0a8]"
              >
                <FilterX size={15} aria-hidden="true" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="mt-3 flex min-h-12 items-center gap-3 border border-[#76512e] bg-[#130d0a] px-3 focus-within:border-[#c7985d]">
            <Search
              size={18}
              className="shrink-0 text-[#c69a61]"
              aria-hidden="true"
            />
            <input
              id="chronology-search"
              type="search"
              placeholder="Buscá por hecho, año, personaje o lugar…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-[#f0d6b0] outline-none placeholder:text-[#957f67]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Borrar búsqueda"
                className="text-[#c69a61] hover:text-[#ffdcaa]"
              >
                <X size={17} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="mt-5">
            <p
              className={`${displayFont} mb-3 text-[10px] font-bold tracking-[0.11em] text-[#ad8a62]`}
            >
              PERÍODO HISTÓRICO
            </p>
            <div
              role="group"
              aria-label="Filtrar por era"
              className="flex flex-wrap gap-2"
            >
              {(["todas", "Primer Imperio", "Nueva Era"] as const).map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={era === option}
                    onClick={() => setEra(option)}
                    className={`border px-3.25 py-2.25 text-[13px] transition-colors ${
                      era === option
                        ? "border-[#c08b4a] bg-[#68402366] text-[#f5d5a3]"
                        : "border-[#624126] text-[#c3a989] hover:border-[#9c6a35] hover:text-[#f0cf9e]"
                    }`}
                  >
                    {option === "todas" ? "Todas las eras" : option}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="mt-5">
            <p
              className={`${displayFont} mb-3 text-[10px] font-bold tracking-[0.11em] text-[#ad8a62]`}
            >
              TIPO DE ACONTECIMIENTO
            </p>
            <div
              role="group"
              aria-label="Filtrar por categoría"
              className="flex flex-wrap gap-2"
            >
              {(["todas", ...categories] as string[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={category === option}
                  onClick={() => setCategory(option)}
                  className={`border px-2.75 py-2 text-[12px] transition-colors ${
                    category === option
                      ? "border-[#c08b4a] bg-[#68402366] text-[#f5d5a3]"
                      : "border-[#624126] text-[#c3a989] hover:border-[#9c6a35] hover:text-[#f0cf9e]"
                  }`}
                >
                  {option === "todas"
                    ? "Todos"
                    : (categoryLabels[option] ?? option)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-[#5d3d24] pb-4">
          <h2
            className={`${displayFont} text-[20px] font-semibold text-[#e9c795] sm:text-[25px]`}
          >
            Registro de acontecimientos
          </h2>
          <p className="text-[13px] text-[#bb9b71]" aria-live="polite">
            {filtered.length} de {events.length} acontecimientos
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center border border-[#624126] bg-[#1c120d] px-5 py-16.25 text-center">
            <Landmark size={38} className="text-[#b98a50]" aria-hidden="true" />
            <h3 className={`${displayFont} mt-4 text-[22px] text-[#f0cf99]`}>
              No se encontraron acontecimientos
            </h3>
            <p className="mt-2 text-[15px] text-[#b89f80]">
              Probá con otro término o cambiá los filtros.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className={`${displayFont} mt-6 border border-[#a87a46] px-5 py-3 text-[11px] font-bold text-[#e6bf88] transition-colors hover:bg-[#4c2d1a]`}
            >
              MOSTRAR TODOS
            </button>
          </div>
        ) : (
          <div>
            {groups.map((group) => (
              <section
                key={group.title}
                aria-label={`Acontecimientos de ${group.title}`}
                className="mb-11"
              >
                <header className="mb-6.25 border-b border-[#80542d] pb-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center border border-[#91643b] bg-[#50301b61] text-[#e2b474]">
                      <Landmark
                        size={21}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <h2
                        className={`${displayFont} text-[clamp(22px,2.8vw,32px)] font-semibold text-[#efd19e]`}
                      >
                        {group.title}
                      </h2>
                      <p className="mt-1 text-[14px] text-[#ac8b67]">
                        {group.subtitle} · {group.events.length} acontecimientos
                      </p>
                    </div>
                  </div>
                </header>

                <div className="relative ml-1.5 pl-6 sm:ml-4.5 sm:pl-10.5">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-1.25 left-0.5 top-1 w-px bg-[linear-gradient(180deg,#d19b5a,#8c562c_60%,#4d301f)] sm:left-px"
                  />
                  {group.events.map((event) => (
                    <TimelineEntry key={event.id} event={event} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-6 border-t border-[#624026] pt-6 text-[13px] leading-[1.75] text-[#a98d6e]">
          <p>
            Fuentes citadas en cada registro: <em>Emperadores de la Ceniza</em>,
            libros I–IV.
          </p>
        </footer>
      </div>
    </div>
  );
}
