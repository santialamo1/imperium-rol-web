"use client";
import {
  Suspense,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownUp,
  ArrowRight,
  BookOpen,
  Check,
  HeartHandshake,
  Scale,
  ScrollText,
  Search,
  Shield,
  Swords,
  UsersRound,
  X,
} from "lucide-react";
import { characters, categories, races } from "@/lib/characters";
import { translateFamilyLabel } from "@/lib/character-labels";
import { RolOrnamentalButton } from "@/components/rol-ornamental-button";
type Character = (typeof characters)[number];
type FactItem = {
  label: string;
  value: string | null | undefined;
};
type SortOrder = "name-asc" | "name-desc" | "id-asc" | "id-desc";
const PAGE_SIZE = 18;
const displayFont = "font-(family-name:--font-rol-display)";
const bodyFont = "font-(family-name:--font-rol-body)";
const raceOptions = ["Todas", ...races];
const sortOptions: {
  value: SortOrder;
  label: string;
}[] = [
  { value: "name-asc", label: "Nombre: A–Z" },
  { value: "name-desc", label: "Nombre: Z–A" },
  { value: "id-asc", label: "Expediente: menor a mayor" },
  { value: "id-desc", label: "Expediente: mayor a menor" },
];
function OrnamentalArrow({
  variant = "row",
  className = "",
}: {
  variant?: "row" | "button" | "inline";
  className?: string;
}) {
  const dimensions =
    variant === "row"
      ? "h-[42px] w-[49px]"
      : variant === "button"
        ? "h-[33px] w-[38px]"
        : "h-[29px] w-[33px]";
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 ${dimensions} ${className}`}
    >
      <Image
        src="/rol/ui/arrow-right.png"
        alt=""
        fill
        sizes="49px"
        className="scale-[1.08] object-contain"
      />
    </span>
  );
}
function OrnamentalChevron({
  open = false,
  prominent = false,
  className = "",
}: {
  open?: boolean;
  prominent?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`
        pointer-events-none relative inline-block shrink-0
        ${prominent ? "h-4.75 w-8" : "h-4.5 w-7"}
        transition-transform duration-200
        ${open ? "rotate-180" : ""}
        ${className}
      `}
    >
      <Image
        src="/rol/ui/chevron-down.png"
        alt=""
        fill
        sizes={prominent ? "32px" : "28px"}
        className="object-contain"
      />
    </span>
  );
}
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}
function compareNames(a: Character, b: Character) {
  return a.name.localeCompare(b.name, "es", {
    sensitivity: "base",
    numeric: true,
  });
}
/* ==========================================
   SELECTOR DE RAZAS
========================================== */
function RaceDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const selectedIndex = Math.max(0, raceOptions.indexOf(value));
  useEffect(() => {
    if (!open) return;
    optionRefs.current[selectedIndex]?.focus({
      preventScroll: true,
    });
    function handleOutside(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [open, selectedIndex]);
  function closeMenu() {
    setOpen(false);
    triggerRef.current?.focus();
  }
  function chooseRace(nextValue: string) {
    onChange(nextValue);
    closeMenu();
  }
  function handleOptionKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowDown":
        nextIndex = (index + 1) % raceOptions.length;
        break;
      case "ArrowUp":
        nextIndex = (index - 1 + raceOptions.length) % raceOptions.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = raceOptions.length - 1;
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        return;
      case "Tab":
        setOpen(false);
        return;
      default:
        return;
    }
    event.preventDefault();
    optionRefs.current[nextIndex]?.focus();
    optionRefs.current[nextIndex]?.scrollIntoView({
      block: "nearest",
    });
  }
  return (
    <div
      ref={rootRef}
      className="
        relative flex h-full min-h-13.75min-w-0 items-center
        border-l border-[#7c5432]
        max-[780px]:min-h-14.5
        max-[780px]:border max-[780px]:border-[#805936]
        max-[780px]:bg-[#1b130f]
      "
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Filtrar por raza: ${value}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((previous) => !previous)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
          if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          }
        }}
        className={`
          ${bodyFont}
          group flex h-full w-full min-w-0 items-center
          gap-2.5 px-4 py-3 text-left
          transition-colors duration-200
          hover:bg-[#70402020]
          focus-visible:outline-2 focus-visible:outline-[#e1b36e]
          max-[1080px]:gap-1.5 max-[1080px]:px-3
          max-[780px]:px-4.25
          ${open ? "bg-[#70402029]" : ""}
        `}
      >
        <span
          className="
            flex min-w-0 flex-1 items-baseline gap-3
            max-[1080px]:gap-2.25
          "
        >
          <span
            className={`
              ${displayFont}
              shrink-0 border-r border-[#74502d]
              pr-3 text-[10px] font-extrabold
              leading-[1.2] tracking-[0.16em]
              text-[#d1a16a] max-[1080px]:pr-2
            `}
          >
            RAZA
          </span>
          <span
            className={`
              ${bodyFont}
              min-w-0 flex-1 truncate
              text-[17px] leading-[1.2]
              text-[#e9d1a6]
              max-[1080px]:text-sm
              max-[780px]:text-base
            `}
          >
            {value}
          </span>
        </span>
        <OrnamentalChevron open={open} prominent />
      </button>
      {open && (
        <div
          className="
            absolute top-full right-0 z-50 mt-2
            w-full min-w-57.5 max-w-[calc(100vw-40px)]
            border border-[#987041] bg-[#1b120e] p-1.25
            shadow-[0_18px_40px_#000e,inset_0_0_0_1px_#e4ac4d19]
          "
        >
          <div
            className={`
              ${displayFont}
              border-b border-[#684529] px-3 py-2.5
              text-center text-[10px] font-bold
              tracking-[0.14em] text-[#c39a67]
            `}
          >
            SELECCIONAR RAZA
          </div>
          <div
            id={menuId}
            role="listbox"
            aria-label="Seleccionar raza"
            className="
              max-h-45 overflow-y-auto overscroll-contain py-1
              [scrollbar-color:#916236_#1a110d]
              scrollbar-thin
            "
          >
            {raceOptions.map((option, index) => {
              const active = option === value;
              return (
                <button
                  key={option}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={active}
                  tabIndex={-1}
                  onClick={() => chooseRace(option)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
                  className={`
                    flex w-full items-center justify-between gap-3
                    border-l-2 px-3 py-2.25 text-left
                    text-[15px] leading-[1.35]
                    transition-colors duration-150
                    focus-visible:border-[#e1b36e]
                    focus-visible:bg-[#56371e]
                    focus-visible:outline-none
                    ${
                      active
                        ? "border-[#e1b36e] bg-[#62402569] text-[#f6d29b]"
                        : "border-transparent text-[#cdb390] hover:border-[#9c6c39] hover:bg-[#422a1b] hover:text-[#f3d29e]"
                    }
                  `}
                >
                  <span>{option}</span>
                  {active && (
                    <Check
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-[#e3b16c]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
/* ==========================================
   SELECTOR DE ORDENAMIENTO
========================================== */
function SortDropdown({
  value,
  onChange,
}: {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const selectedIndex = Math.max(
    0,
    sortOptions.findIndex((option) => option.value === value),
  );
  useEffect(() => {
    if (!open) return;
    optionRefs.current[selectedIndex]?.focus({
      preventScroll: true,
    });
    function handleOutside(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [open, selectedIndex]);
  function closeMenu() {
    setOpen(false);
    triggerRef.current?.focus();
  }
  function chooseSort(nextValue: SortOrder) {
    onChange(nextValue);
    closeMenu();
  }
  function handleOptionKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowDown":
        nextIndex = (index + 1) % sortOptions.length;
        break;
      case "ArrowUp":
        nextIndex = (index - 1 + sortOptions.length) % sortOptions.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = sortOptions.length - 1;
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        return;
      case "Tab":
        setOpen(false);
        return;
      default:
        return;
    }
    event.preventDefault();
    optionRefs.current[nextIndex]?.focus();
  }
  return (
    <div ref={rootRef} className="relative w-full min-[601px]:w-auto">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Ordenar personajes: ${sortOptions[selectedIndex].label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((previous) => !previous)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
          if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          }
        }}
        className={`
          group flex min-h-12.25 w-full min-w-0
          items-center gap-2.5
          border border-[#76502c] bg-[#1b110deb]
          py-2 pl-3.25 pr-2.5 text-left
          transition-colors hover:border-[#ad7b43]
          hover:bg-[#2b1b12]
          focus-visible:outline-2 focus-visible:outline-[#e1b36e]
          ${open ? "border-[#c18d50]" : ""}
        `}
      >
        <ArrowDownUp
          size={16}
          aria-hidden="true"
          className="shrink-0 text-[#c99a5a]"
        />
        <span
          className="
            flex min-w-0 flex-1 items-baseline gap-2.5
          "
        >
          <span
            className={`
              ${displayFont}
              shrink-0 text-[10px] font-bold
              leading-[1.2] tracking-widest
              text-[#bd935d]
            `}
          >
            ORDENAR
          </span>
          <span
            aria-hidden="true"
            className="
              h-4.25 w-px shrink-0 self-center
              bg-[#654323]
            "
          />
          <span
            className={`
              ${bodyFont}
              min-w-0 flex-1 truncate
              text-[15px] leading-[1.2]
              text-[#e8c897]
            `}
          >
            {sortOptions[selectedIndex].label}
          </span>
        </span>
        <OrnamentalChevron open={open} prominent />
      </button>
      {open && (
        <div
          className="
            absolute top-full right-0 z-50 mt-2
            w-[min(355px,calc(100vw-40px))]
            border border-[#987041] bg-[#1b120e] p-1.25
            shadow-[0_18px_40px_#000e,inset_0_0_0_1px_#e4ac4d19]
          "
        >
          <div
            className={`
              ${displayFont}
              border-b border-[#684529] px-3 py-2.5
              text-center text-[10px] font-bold
              tracking-[0.14em] text-[#c39a67]
            `}
          >
            ORDENAR EXPEDIENTES
          </div>
          <div
            id={menuId}
            role="listbox"
            aria-label="Ordenar personajes"
            className="py-1"
          >
            {sortOptions.map((option, index) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={active}
                  tabIndex={-1}
                  onClick={() => chooseSort(option.value)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
                  className={`
                    flex w-full items-center justify-between gap-3
                    border-l-2 px-3 py-2.75
                    text-left text-[15px] leading-[1.35]
                    transition-colors duration-150
                    focus-visible:border-[#e1b36e]
                    focus-visible:bg-[#56371e]
                    focus-visible:outline-none
                    ${
                      active
                        ? "border-[#e1b36e] bg-[#62402569] text-[#f6d29b]"
                        : "border-transparent text-[#cdb390] hover:border-[#9c6c39] hover:bg-[#422a1b] hover:text-[#f3d29e]"
                    }
                  `}
                >
                  <span>{option.label}</span>
                  {active && (
                    <Check
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-[#e3b16c]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
/* ==========================================
   PANELES DEL EXPEDIENTE
========================================== */
function FactPanel({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: FactItem[];
}) {
  const available = items.filter(
    (item) => typeof item.value === "string" && item.value.trim().length > 0,
  );
  if (available.length === 0) return null;
  return (
    <section
      className="
        min-w-0 border border-[#654324] bg-[#160f0be8]
        px-4.25 py-4.75
        shadow-[inset_0_0_18px_#0005]
      "
    >
      <h3
        className={`
          ${displayFont}
          mb-3.5 flex items-center gap-2.25
          text-sm font-bold text-[#e4bd7a]
        `}
      >
        {icon}
        {title}
      </h3>
      <dl className="m-0">
        {available.map(({ label, value }) => (
          <div
            key={label}
            className="
              border-b border-[#6345297d]
              py-2.25 last:border-b-0
            "
          >
            <dt className="text-sm text-[#ab8c69]">{label}</dt>
            <dd
              className={`
                ${bodyFont}
                mt-1 text-[17px] leading-[1.4]
                text-[#efd9b8]
              `}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
/* ==========================================
   ARCHIVO DE PERSONAJES
========================================== */
function CharacterSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [race, setRace] = useState("Todas");
  const [sortOrder, setSortOrder] = useState<SortOrder>("name-asc");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const openedFromList = useRef(false);
  const selectedSlug = searchParams.get("personaje");
  const selected = useMemo(
    () =>
      characters.find((character) => character.slug === selectedSlug) ?? null,
    [selectedSlug],
  );
  const matches = useMemo(() => {
    const normalizedQuery = normalize(deferredQuery);
    const filtered = characters.filter((character) => {
      const matchesCategory =
        category === "Todos" || character.category === category;
      const matchesRace = race === "Todas" || character.race === race;
      const searchableText = normalize(
        [character.name, character.className ?? "", character.race ?? ""].join(
          " ",
        ),
      );
      return (
        matchesCategory &&
        matchesRace &&
        searchableText.includes(normalizedQuery)
      );
    });
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case "name-desc":
          return compareNames(b, a);
        case "id-asc":
          return Number(a.id) - Number(b.id) || compareNames(a, b);
        case "id-desc":
          return Number(b.id) - Number(a.id) || compareNames(a, b);
        default:
          return compareNames(a, b);
      }
    });
    return filtered;
  }, [category, race, deferredQuery, sortOrder]);
  const relatives = useMemo(() => {
    if (!selected) return [];
    const familyText = Object.values(selected.family)
      .join(" ")
      .toLocaleLowerCase("es");
    return characters
      .filter(
        (character) =>
          character.slug !== selected.slug &&
          character.name.length > 5 &&
          familyText.includes(character.name.toLocaleLowerCase("es")),
      )
      .slice(0, 8);
  }, [selected]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) {
      dialog.showModal();
    }
    if (!selected && dialog.open) {
      dialog.close();
    }
  }, [selected]);
  useEffect(() => {
    modalScrollRef.current?.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [selectedSlug]);
  function resetFilters() {
    setQuery("");
    setCategory("Todos");
    setRace("Todas");
    setLimit(PAGE_SIZE);
  }
  function openCharacter(character: Character) {
    openedFromList.current = true;
    const next = new URLSearchParams(searchParams.toString());
    next.set("personaje", character.slug);
    router.push(`/rol/personajes?${next.toString()}`, { scroll: false });
  }
  function openRelative(character: Character) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("personaje", character.slug);
    router.replace(`/rol/personajes?${next.toString()}`, { scroll: false });
  }
  function handleDialogClose() {
    if (!selected) return;
    if (openedFromList.current) {
      openedFromList.current = false;
      router.back();
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.delete("personaje");
    const queryString = next.toString();
    router.replace(
      queryString ? `/rol/personajes?${queryString}` : "/rol/personajes",
      { scroll: false },
    );
  }
  const hasFilters = query || category !== "Todos" || race !== "Todas";
  return (
    <div className={bodyFont}>
      {/* ==========================================
          BUSCADOR
      ========================================== */}
      <div
        className="
          relative isolate z-20
          min-[781px]:h-[clamp(210px,19vw,266px)]
          max-[780px]:grid max-[780px]:grid-cols-1
          max-[780px]:gap-4
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0 z-20
            bg-[url('/rol/ui/frame-search.png')]
            bg-center bg-no-repeat bg-size-[100%_100%]
            min-[781px]:-translate-x-2.5
            max-[780px]:hidden
          "
        />
        <div
          className="
            relative z-30 grid
            grid-cols-[minmax(0,1fr)_260px]
            items-center gap-0
            min-[781px]:absolute
            min-[781px]:inset-x-[9.5%]
            min-[781px]:top-[62%]
            min-[781px]:h-[clamp(58px,5.6vw,78px)]
            min-[781px]:-translate-y-1/2
            max-[1080px]:grid-cols-[minmax(0,1fr)_205px]
            max-[780px]:grid-cols-1 max-[780px]:gap-4
          "
        >
          <div
            className="
              flex h-full min-h-13.75 min-w-0
              items-center gap-4 bg-transparent
              px-4 text-[#d0a263]
              max-[780px]:min-h-14.5
              max-[780px]:border
              max-[780px]:border-[#805936]
              max-[780px]:bg-[#1b130f]
              max-[780px]:px-4.5
              max-[780px]:focus-within:border-[#dcb279]
            "
          >
            <Search size={21} className="shrink-0" aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar personajes"
              placeholder="Buscar por nombre, clase o raza..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(PAGE_SIZE);
              }}
              className="
                min-w-0 flex-1 border-0 bg-transparent
                text-[18px] text-[#f1e1c7] outline-none
                placeholder:text-[#99836b]
                focus:placeholder:text-[#b7a084]
                max-[1080px]:text-[15px]
                max-[780px]:text-[17px]
                [&::-webkit-search-cancel-button]:hidden
              "
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setLimit(PAGE_SIZE);
                }}
                aria-label="Borrar búsqueda"
                className="
                  shrink-0 text-[#b5a28a]
                  transition-colors hover:text-[#f1d4a7]
                "
              >
                <X size={17} aria-hidden="true" />
              </button>
            )}
          </div>
          <RaceDropdown
            value={race}
            onChange={(nextRace) => {
              setRace(nextRace);
              setLimit(PAGE_SIZE);
            }}
          />
        </div>
      </div>
      {/* ==========================================
          CATEGORÍAS
      ========================================== */}
      <nav
        aria-label="Categorías de personajes"
        className="
          relative z-10 mx-auto flex flex-wrap
          items-center justify-center gap-x-4 gap-y-3
          pt-3 pb-8
          max-[540px]:gap-x-2 max-[540px]:gap-y-2
          max-[540px]:pb-6
        "
      >
        {["Todos", ...categories].map((item) => {
          const active = item === category;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCategory(item);
                setLimit(PAGE_SIZE);
              }}
              className={`
                ${displayFont}
                group relative mx-1 inline-flex
                min-h-12 max-w-full items-center justify-center
                border-b-2 px-4 py-3 text-center
                text-[13px] font-semibold leading-[1.35]
                tracking-wide
                transition-[color,background-color,border-color]
                duration-200
                focus-visible:outline-2
                focus-visible:outline-[#c99957]
                max-[540px]:mx-0 max-[540px]:px-3
                max-[540px]:text-[11px]
                ${
                  active
                    ? "border-[#d9a762] bg-[#8c59251f] text-[#f1c98d]"
                    : "border-transparent text-[#b9a083] hover:border-[#76502d] hover:bg-[#6b402014] hover:text-[#e6bf87]"
                }
              `}
            >
              {item}
              {active && (
                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none absolute
                    -bottom-1 left-1/2 size-1.5
                    -translate-x-1/2 rotate-45
                    border border-[#eac17f] bg-[#9b622e]
                    shadow-[0_0_7px_#d58a39]
                  "
                />
              )}
            </button>
          );
        })}
      </nav>
      {/* ==========================================
          REGISTRO DE PERSONAJES
      ========================================== */}
      <section
        aria-label="Registro de los nombres"
        className="
          relative isolate mt-1.5
          max-[1023px]:border
          max-[1023px]:border-[#7a5633]
          max-[1023px]:bg-[#140d0a]
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute
            inset-x-[7.5%] top-33.75 bottom-36.25
            z-0 hidden
            bg-[radial-gradient(ellipse_at_50%_5%,#352016,#130c09_70%,#0d0907)]
            lg:block
          "
        />
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0
            z-30 hidden
            border-solid
            border-transparent
            [border-width:135px_95px_145px_95px]
            [border-image-source:url('/rol/ui/frame-character-list.png')]
            [border-image-slice:200_170_200_170]
            [border-image-width:135px_95px_145px_95px]
            [border-image-repeat:stretch_round]
            lg:block
          "
        />
        <div
          className="
            relative z-10 px-5 pt-6 pb-6
            lg:px-[clamp(115px,9vw,155px)]
            lg:pt-41.25
            lg:pb-43.75
          "
        >
          <header
            className="
              relative z-40 mb-5.5
              flex flex-wrap items-start justify-between
              gap-x-6 gap-y-5
              border-b border-[#74502d] pb-5.75
            "
          >
            <div className="min-w-0">
              <span
                className={`
                  ${displayFont}
                  inline-flex items-center gap-2
                  text-[11px] font-bold uppercase
                  tracking-[0.18em] text-[#c59d63]
                `}
              >
                <ScrollText size={17} aria-hidden="true" />
                REGISTRO DE LOS NOMBRES
              </span>
              <h3
                className={`
                  ${displayFont}
                  mt-3 text-[clamp(26px,3vw,38px)]
                  font-semibold leading-[1.15]
                  text-[#efd3a1]
                `}
              >
                Archivo de personajes
              </h3>
              <p
                aria-live="polite"
                className="
                  mt-3 text-[15px] leading-[1.6]
                  text-[#b99972]
                "
              >
                {matches.length}{" "}
                {matches.length === 1
                  ? "expediente documentado"
                  : "expedientes documentados"}
              </p>
            </div>
            <div
              className="
                flex flex-col items-end gap-3
                max-[600px]:w-full
                max-[600px]:items-start
              "
            >
              <SortDropdown
                value={sortOrder}
                onChange={(nextSort) => {
                  setSortOrder(nextSort);
                  setLimit(PAGE_SIZE);
                }}
              />
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="
                    inline-flex items-center gap-2
                    text-[12px] font-semibold
                    text-[#b99a70]
                    transition-colors hover:text-[#f4d49f]
                  "
                >
                  Limpiar filtros
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          </header>
          {matches.length > 0 ? (
            <>
              <ul
                className="
                  m-0 list-none border-t
                  border-[#553920] p-0
                "
              >
                {matches.slice(0, limit).map((character, index) => (
                  <li
                    key={character.slug}
                    className={`
                      border-b border-[#553920]
                      ${index % 2 === 0 ? "bg-[#21150e42]" : "bg-[#110b0866]"}
                    `}
                  >
                    <button
                      type="button"
                      onClick={() => openCharacter(character)}
                      aria-label={`Consultar ficha de ${character.name}`}
                      className="
                        group grid min-h-23.5 w-full
                        grid-cols-[72px_minmax(0,1fr)_minmax(140px,225px)_49px]
                        items-center gap-4 px-3.5 py-4.25
                        text-left text-[#ead1a5]
                        transition-colors duration-200
                        hover:bg-[#6b402357]
                        focus-visible:outline
                        focus-visible:outline-[#d0a061]
                        max-[1023px]:grid-cols-[64px_minmax(0,1fr)_49px]
                        max-[1023px]:gap-3
                        max-[540px]:grid-cols-[49px_minmax(0,1fr)_42px]
                        max-[540px]:gap-2
                        max-[540px]:px-2
                        max-[540px]:py-3.75
                      "
                    >
                      <div
                        className="
                          flex flex-col items-center justify-center
                          border-r border-[#6a492b] pr-3
                          max-[540px]:pr-2
                        "
                      >
                        <span
                          className={`
                            ${displayFont}
                            text-[9px] font-bold
                            tracking-[0.16em]
                            text-[#9f7d57]
                          `}
                        >
                          EXP.
                        </span>
                        <span
                          className={`
                            ${displayFont}
                            mt-1 text-[22px] leading-none
                            text-[#e8c184]
                            max-[540px]:text-[18px]
                          `}
                        >
                          {String(character.id).padStart(3, "0")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4
                          className={`
                            ${displayFont}
                            text-[18px] font-semibold leading-[1.3]
                            text-[#f0d5a5] transition-colors
                            group-hover:text-[#ffe1a7]
                            max-[540px]:text-[15px]
                          `}
                        >
                          {character.name}
                        </h4>
                        <p
                          className="
                            mt-2 text-[14px] leading-normal
                            text-[#a98d6a]
                            max-[540px]:text-[12px]
                          "
                        >
                          {character.race || "Raza no especificada"}
                          {character.className
                            ? ` · ${character.className}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className="
                          text-right text-[13px] leading-normal
                          text-[#c6a16a]
                          max-[1023px]:col-start-2
                          max-[1023px]:text-left
                          max-[1023px]:text-[12px]
                        "
                      >
                        {character.category}
                      </span>
                      <OrnamentalArrow
                        className="
                          justify-self-end
                          transition-transform duration-200
                          group-hover:translate-x-1
                          max-[1023px]:col-start-3
                          max-[1023px]:row-span-2
                          max-[1023px]:row-start-1
                        "
                      />
                    </button>
                  </li>
                ))}
              </ul>
              {limit < matches.length && (
                <div className="mt-8 flex justify-center">
                  <RolOrnamentalButton
                    type="button"
                    size="wide"
                    onClick={() => setLimit((previous) => previous + PAGE_SIZE)}
                    icon={<ArrowRight aria-hidden="true" />}
                  >
                    MOSTRAR MÁS PERSONAJES
                  </RolOrnamentalButton>
                </div>
              )}
            </>
          ) : (
            <div
              className="
                flex flex-col items-center gap-3
                px-5 py-16.25 text-center
              "
            >
              <ScrollText
                size={44}
                className="text-[#bd9a6f]"
                aria-hidden="true"
              />
              <h2
                className={`
                  ${displayFont}
                  text-[27px] font-semibold
                  text-[#e9d6b6]
                `}
              >
                No se encontraron personajes
              </h2>
              <p className="text-[#a7a094]">
                Probá con otra palabra o cambiá los filtros.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className={`
                  ${displayFont}
                  mt-3 min-h-12 border border-[#947044]
                  bg-[#201810] px-6 py-3
                  text-xs font-bold text-[#e0b981]
                  transition-colors
                  hover:border-[#dbab64]
                  hover:bg-[#322218]
                `}
              >
                VER TODOS
              </button>
            </div>
          )}
        </div>
      </section>
      {/* ==========================================
          MODAL
      ========================================== */}
      <dialog
        ref={dialogRef}
        aria-labelledby="character-modal-title"
        onClose={handleDialogClose}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
        className={`
          ${bodyFont}
          fixed inset-0 m-auto aspect-[1.45]
          w-[min(1220px,calc(100vw-24px),133dvh)]
          max-h-[92dvh] max-w-none
          overflow-hidden border-0 bg-transparent
          p-0 text-[#e9d3ac] shadow-none
          backdrop:bg-[#050403e5]
          backdrop:backdrop-blur-[5px]
          max-[760px]:aspect-auto
          max-[760px]:h-[92dvh]
          max-[760px]:w-[calc(100vw-16px)]
          max-[760px]:border
          max-[760px]:border-[#986436]
          max-[760px]:bg-[#1b110d]
        `}
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-x-[10.5%]
            top-[19%] bottom-[11%] z-0
            rounded-[36px]
            bg-[radial-gradient(ellipse_at_50%_15%,#3b2217,#24150e_70%,#170d09)]
            max-[760px]:hidden
          "
        />
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0 z-30
            bg-[url('/rol/ui/frame-modal.png')]
            bg-center bg-no-repeat bg-size-[100%_100%]
            max-[760px]:hidden
          "
        />
        {selected && (
          <div
            className={`
              ${displayFont}
              pointer-events-none absolute
              left-1/2 top-[13.5%] z-40 w-[43%]
              -translate-x-1/2 -translate-y-1/2
              text-center
              text-[clamp(9px,0.95vw,13px)]
              font-bold uppercase tracking-[0.17em]
              text-[#efc990]
              [text-shadow:0_2px_4px_#000,0_0_12px_#000]
              max-[760px]:top-9.25
              max-[760px]:w-[calc(100%-110px)]
              max-[760px]:text-[10px]
              max-[540px]:tracking-[0.06em]
            `}
          >
            EXPEDIENTE HISTÓRICO · N.º {String(selected.id).padStart(2, "0")}
          </div>
        )}
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-2.25
            z-30 hidden border border-[#a3743e]
            max-[760px]:block
          "
        />
        {selected && (
          <div
            ref={modalScrollRef}
            className="
              absolute inset-x-[11%]
              top-[21%] bottom-[13%] z-20
              min-h-0 overflow-x-hidden overflow-y-auto
              overscroll-contain
              px-[clamp(7px,1vw,16px)] pb-7
              [scrollbar-color:#8e6038_#1c130f]
              scrollbar-thin
              max-[760px]:inset-x-5.25
              max-[760px]:top-19
              max-[760px]:bottom-5.25
              max-[760px]:px-1.75
              max-[540px]:inset-x-3.75
            "
          >
            <header
              className="
                mb-7.5 border-b border-[#765333]
                px-2 pt-2 pb-6.25 text-center
              "
            >
              <h2
                id="character-modal-title"
                className={`
                  ${displayFont}
                  mx-auto mb-3.75 max-w-212.5
                  text-[clamp(27px,3.8vw,48px)]
                  font-semibold leading-[1.15]
                  text-[#f5d8a6] text-balance
                  max-[540px]:text-[27px]
                `}
              >
                {selected.name}
              </h2>
              <p
                className="
                  text-[17px] leading-[1.6]
                  text-[#c4ab89]
                  max-[540px]:text-[14px]
                "
              >
                {selected.category}
                {selected.race ? ` · ${selected.race}` : ""}
                {selected.className ? ` · ${selected.className}` : ""}
              </p>
            </header>
            <div
              className="
                grid
                grid-cols-[minmax(0,0.8fr)_minmax(0,1.45fr)]
                items-start gap-6.5
                max-[760px]:grid-cols-1
                max-[760px]:gap-4
              "
            >
              <aside
                className="
                  flex min-w-0 flex-col gap-3.75
                  max-[760px]:order-2
                  max-[760px]:grid
                  max-[760px]:grid-cols-2
                  max-[540px]:grid-cols-1
                "
              >
                <FactPanel
                  title="Identidad"
                  icon={<Shield size={18} aria-hidden="true" />}
                  items={[
                    { label: "Raza", value: selected.race },
                    {
                      label: "Clase / arquetipo",
                      value: selected.className,
                    },
                    { label: "Altura", value: selected.height },
                    { label: "Peso", value: selected.weight },
                    { label: "Contextura", value: selected.build },
                    { label: "Cabello", value: selected.hair },
                    { label: "Ojos", value: selected.eyes },
                  ]}
                />
                <FactPanel
                  title="Capacidades"
                  icon={<Swords size={18} aria-hidden="true" />}
                  items={[
                    { label: "Combate", value: selected.combat },
                    { label: "Diplomacia", value: selected.diplomacy },
                    { label: "Estrategia", value: selected.strategy },
                    { label: "Cuentas / oro", value: selected.economy },
                  ]}
                />
                <FactPanel
                  title="Valores"
                  icon={<Scale size={18} aria-hidden="true" />}
                  items={[
                    {
                      label: "Traicionaría sus valores",
                      value: selected.betrayValues,
                    },
                    {
                      label: "Traicionaría sus aliados",
                      value: selected.betrayAllies,
                    },
                    {
                      label: "Se sacrificaría",
                      value: selected.selfSacrifice,
                    },
                  ]}
                />
              </aside>
              <article
                className="
                  min-w-0 border-[7px] border-[#654323]
                  bg-[#d8c29c]
                  bg-[radial-gradient(ellipse_at_50%_0%,#f3e5c7,transparent_650px),repeating-linear-gradient(15deg,transparent_0_3px,#78512606_4px_6px)]
                  px-[clamp(18px,2.5vw,34px)] py-8.5
                  text-[#332519]
                  shadow-[inset_0_0_34px_#85623b5a,0_15px_35px_#0007]
                  max-[760px]:order-1
                  max-[540px]:px-4.5
                  max-[540px]:py-6.5
                "
              >
                <div
                  className="
                    mb-7 border-b border-[#9a7756]
                    pb-6.5 text-center
                  "
                >
                  <span
                    className={`
                      ${displayFont}
                      text-[10px] font-bold tracking-[0.18em]
                      text-[#816342]
                    `}
                  >
                    EL REGISTRO DE UNA VIDA
                  </span>
                  <h3
                    className={`
                      ${displayFont}
                      mt-3 text-[clamp(23px,2.5vw,31px)]
                      font-semibold leading-[1.3]
                      text-[#4f341e]
                    `}
                  >
                    Historia y legado
                  </h3>
                  <div
                    aria-hidden="true"
                    className="mt-2 text-[25px] text-[#956d3e]"
                  >
                    ✥
                  </div>
                </div>
                {selected.personality && (
                  <section
                    className="
                      mb-7.5 border-l-[3px]
                      border-[#98683d] bg-[#c2a77960]
                      px-4.75 py-4.5
                    "
                  >
                    <h4
                      className={`
                        ${displayFont}
                        mb-3.25 flex items-center gap-2.5
                        text-[20px] font-semibold text-[#4f341e]
                      `}
                    >
                      <HeartHandshake size={18} aria-hidden="true" />
                      Personalidad
                    </h4>
                    <p className="text-[17px] leading-[1.75] text-[#3a2c1e]">
                      {selected.personality}
                    </p>
                  </section>
                )}
                {selected.history.length > 0 && (
                  <section className="mb-7.5">
                    <h4
                      className={`
                        ${displayFont}
                        mb-3.75 flex items-center gap-2.5
                        text-[21px] font-semibold text-[#4f341e]
                      `}
                    >
                      <ScrollText size={19} aria-hidden="true" />
                      Crónica histórica
                    </h4>
                    <div className="space-y-4.25">
                      {selected.history.map((paragraph, index) => (
                        <p
                          key={index}
                          className="
                            text-[17px] leading-[1.85]
                            text-[#3a2c1e]
                          "
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                )}
                {Object.keys(selected.family).length > 0 && (
                  <section
                    className="
                      mb-7.5 border-t border-[#977555]
                      pt-6.25
                    "
                  >
                    <h4
                      className={`
                        ${displayFont}
                        mb-3.75 flex items-center gap-2.5
                        text-[21px] font-semibold text-[#4f341e]
                      `}
                    >
                      <UsersRound size={19} aria-hidden="true" />
                      Familia y vínculos
                    </h4>
                    <dl>
                      {Object.entries(selected.family).map(([name, value]) => (
                        <div
                          key={name}
                          className="
                              grid
                              grid-cols-[120px_minmax(0,1fr)]
                              gap-3 border-b border-[#9d79533f]
                              py-2.5
                              max-[540px]:grid-cols-1
                              max-[540px]:gap-1
                            "
                        >
                          <dt className="text-[13px] font-bold text-[#64452c]">
                            {translateFamilyLabel(name)}
                          </dt>
                          <dd className="text-[15px] leading-normal text-[#3a2c1e]">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}
                {relatives.length > 0 && (
                  <section
                    className="
                      mb-7.5 border-t border-[#977555]
                      pt-6.25
                    "
                  >
                    <h4
                      className={`
                        ${displayFont}
                        mb-3.75 text-[20px] font-semibold
                        text-[#4f341e]
                      `}
                    >
                      Otras fichas vinculadas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {relatives.map((relative) => (
                        <button
                          key={relative.slug}
                          type="button"
                          onClick={() => openRelative(relative)}
                          className="
                            group inline-flex items-center gap-2.5
                            border border-[#997147]
                            bg-[#9a714328] px-3 py-2.25
                            text-[13px] font-semibold
                            text-[#59391d] transition-colors
                            hover:bg-[#ac8757]
                          "
                        >
                          {relative.name}
                          <OrnamentalArrow
                            variant="inline"
                            className="
                              transition-transform
                              group-hover:translate-x-1
                            "
                          />
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                <div
                  className="
                    flex items-start gap-3
                    border-t border-[#977555]
                    pt-6 text-[#674a30]
                  "
                >
                  <BookOpen size={20} className="shrink-0" aria-hidden="true" />
                  <div>
                    <strong
                      className={`
                        ${displayFont}
                        text-[13px] font-bold
                      `}
                    >
                      Fuente histórica
                    </strong>
                    <p className="mt-1.75 text-[15px] leading-normal">
                      {selected.source || "Emperadores de la Ceniza"}
                    </p>
                  </div>
                </div>
              </article>
            </div>
            <footer
              className="
                mt-6.5 flex justify-center
                border-t border-[#704a2a] pt-6
              "
            >
              <RolOrnamentalButton
                href={`/rol/personajes/${selected.slug}`}
                size="wide"
                icon={<ArrowRight aria-hidden="true" />}
              >
                ABRIR FICHA INDIVIDUAL
              </RolOrnamentalButton>
            </footer>
          </div>
        )}
      </dialog>
    </div>
  );
}
export function CharacterSearch() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-[#bca07c]">
          Cargando archivo de personajes...
        </div>
      }
    >
      <CharacterSearchContent />
    </Suspense>
  );
}
