import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock3,
  Feather,
  ScrollText,
  Shield,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { books } from "@/lib/books";
import { characters } from "@/lib/characters";
import { BookCover } from "@/components/book-cover";
import { RolOrnamentalButton } from "@/components/rol-ornamental-button";
const displayFont = "font-(family-name:--font-rol-display)";
const bodyFont = "font-(family-name:--font-rol-body)";
const container =
  "mx-auto w-[calc(100%_-_36px)] max-w-[1320px] min-[801px]:w-[calc(100%_-_76px)]";
const portalClasses = [
  "group relative isolate flex flex-col",
  "min-h-[218px] items-center justify-center",
  "px-[35px] pt-[46px] pb-[44px]",
  "text-center text-[#d9b47b]",
  "transition-[transform,filter] duration-200",
  "max-[1120px]:min-h-[208px]",
  "max-[1120px]:px-[33px]",
  "max-[1120px]:pt-[45px]",
  "max-[1120px]:pb-[42px]",
  "max-[540px]:min-h-[188px]",
  "max-[540px]:px-[17px]",
  "max-[540px]:pt-[39px]",
  "max-[540px]:pb-[37px]",
].join(" ");
const sectionEyebrow = [
  displayFont,
  "inline-flex items-center gap-3",
  "text-[11px] font-extrabold",
  "uppercase tracking-[0.23em]",
  "text-[#d9a75f]",
].join(" ");
const sectionTitle = [
  displayFont,
  "my-[14px] text-[clamp(31px,3.2vw,50px)]",
  "font-semibold leading-[1.2]",
  "text-[#f1d2a1]",
  "[text-shadow:0_3px_9px_#000]",
].join(" ");
const portalBackground = (
  <>
    <span
      aria-hidden="true"
      className="
        pointer-events-none absolute
        inset-[13%_9%] z-0
        bg-[radial-gradient(ellipse_at_50%_22%,#4a281b6a,transparent_76%),linear-gradient(145deg,#2d1c15_0%,#170f0b_70%,#120b09_100%)]
        shadow-[inset_0_0_24px_#0302018a]
      "
    />
    <span
      aria-hidden="true"
      className="
        pointer-events-none absolute
        inset-0 z-10
        bg-[url('/rol/ui/frame-panel.png')]
        bg-center bg-no-repeat
        bg-size-[100%_100%]
      "
    />
  </>
);
type PortalItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  comingSoon?: boolean;
};
const portals: PortalItem[] = [
  {
    title: "LIBROS OFICIALES",
    description: "Los cinco volúmenes de Emperadores de la Ceniza",
    icon: BookOpen,
    href: "/rol/libros",
  },
  {
    title: "LIBRO V",
    description: "Una historia que se revelará capítulo a capítulo",
    icon: ScrollText,
    href: "/rol/libros",
  },
  {
    title: "PERSONAJES",
    description: `${characters.length} fichas y registros históricos`,
    icon: UsersRound,
    href: "/rol/personajes",
  },
  {
    title: "CRONOLOGÍA",
    description: `Grandes hechos y acontecimientos de la historia`,
    icon: Clock3,
    href: "/rol/cronologia",
  },
];
const featuredCharacters = Array.from(
  new Map(
    characters.map((character) => [character.category, character] as const),
  ).values(),
).slice(0, 6);
export default function RoleHome() {
  return (
    <>
      {/* HERO PRINCIPAL */}
      <section
        aria-labelledby="rol-home-title"
        className="
          relative isolate min-h-157.5
          overflow-hidden
          border-b border-[#724324]
          bg-[#100b09]
        "
      >
        {/* Fondo principal */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0 -z-30
            bg-[url('/rol/images/hero-archivo-rol.webp')]
            bg-center bg-cover bg-no-repeat
            brightness-125
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0 -z-20
            bg-[linear-gradient(90deg,#100b0938_0%,#100b0915_48%,#100b0938_100%)]
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0 -z-10
            bg-[radial-gradient(ellipse_at_50%_34%,#10080680_0%,#10080645_30%,transparent_62%),linear-gradient(180deg,#0c090629_0%,transparent_46%,#0b08067a_100%)]
          "
        />
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0
            opacity-[0.17]
            bg-[radial-gradient(#f9b866_1px,transparent_1.5px)]
            bg-size-[97px_119px]
          "
        />
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute
            left-[max(12px,calc(50%-755px))]
            top-21.5 h-63.5 w-36.5
            bg-[url('/rol/ui/banner-red.png')]
            bg-contain bg-center bg-no-repeat
            opacity-50
            drop-shadow-[0_15px_22px_#000]
            max-[1120px]:opacity-25
            max-[760px]:hidden
          "
        />
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute
            right-[max(12px,calc(50%-755px))]
            top-21.5 h-63.5 w-36.5
            -scale-x-100
            bg-[url('/rol/ui/banner-red.png')]
            bg-contain bg-center bg-no-repeat
            opacity-50
            drop-shadow-[0_15px_22px_#000]
            max-[1120px]:opacity-25
            max-[760px]:hidden
          "
        />
        <div
          className={`
            ${container}
            relative z-10
            py-16.25
            max-[760px]:pt-17.5
            max-[760px]:pb-11.25
            max-[540px]:pt-13.5
          `}
        >
          <div
            className="
              mx-auto mb-12.5
              max-w-220 text-center
              max-[760px]:mb-8.75
            "
          >
            <div
              className={`
                ${displayFont}
                inline-flex items-center gap-3
                text-[11px] font-extrabold
                tracking-[0.23em] text-[#d9a75f]
                max-[540px]:text-[9px]
                max-[540px]:tracking-[0.17em]
              `}
            >
              <span
                className="
                  h-px w-11
                  bg-linear-to-r
                  from-transparent to-[#bd8545]
                  max-[540px]:w-6.25
                "
              />
              ÁREA DE ROL
              <span
                className="
                  h-px w-11 rotate-180
                  bg-linear-to-r
                  from-transparent to-[#bd8545]
                  max-[540px]:w-6.25
                "
              />
            </div>
            <h1
              id="rol-home-title"
              className={`
                ${displayFont}
                my-5
                text-[clamp(36px,4.7vw,72px)]
                font-semibold leading-[1.14]
                tracking-wide
                text-[#f5d8a1] uppercase
                [text-shadow:0_3px_3px_#000,0_10px_30px_#000]
                max-[540px]:text-[clamp(31px,8vw,46px)]
              `}
            >
              Archivo histórico
              <span className="block text-[#d2a052]">de ImperiumAO</span>
            </h1>
            <p
              className={`
                ${bodyFont}
                mx-auto max-w-172.5
                text-[clamp(16px,1.5vw,20px)]
                italic leading-[1.7]
                text-[#e0c9a4]
                [text-shadow:0_2px_9px_#000]
                max-[540px]:text-sm
              `}
            >
              Crónicas, personajes y testimonios que dieron forma al mundo.
              Descubrí los libros oficiales y los nombres que marcaron su
              historia.
            </p>
          </div>
          <nav
            aria-label="Secciones del archivo de Rol"
            className="
              mx-auto grid grid-cols-4
              items-stretch gap-3.5
              max-[1120px]:max-w-182.5
              max-[1120px]:grid-cols-2
              max-[540px]:gap-2.25
            "
          >
            {portals.map((portal) => {
              const Icon = portal.icon;
              const contents = (
                <>
                  {portalBackground}
                  <Icon
                    aria-hidden="true"
                    size={30}
                    strokeWidth={1.5}
                    className="
                      relative z-20 mb-2.5
                      shrink-0 text-[#d8a85f]
                      max-[540px]:mb-2
                      max-[540px]:size-6.25
                    "
                  />
                  <strong
                    className={`
                      ${displayFont}
                      relative z-20 block max-w-full
                      text-[clamp(12px,1vw,16px)]
                      font-semibold leading-tight
                      tracking-wide
                      text-[#f0ce92] text-balance
                      max-[1120px]:text-[15px]
                      max-[540px]:text-xs
                      max-[540px]:leading-[1.2]
                    `}
                  >
                    {portal.title}
                  </strong>
                  <span
                    className={`
                      ${bodyFont}
                      relative z-20 mt-1.75 block
                      max-w-58.75
                      text-[clamp(12px,0.9vw,14px)]
                      leading-[1.3] text-[#bca487]
                      text-balance
                      max-[1120px]:text-sm
                      max-[540px]:text-xs
                      max-[540px]:leading-tight
                    `}
                  >
                    {portal.description}
                  </span>
                  {portal.comingSoon ? (
                    <small
                      className={`
                        ${displayFont}
                        absolute bottom-6.25 left-1/2
                        z-20 -translate-x-1/2
                        whitespace-nowrap
                        text-[8px] tracking-[0.055em]
                        text-[#ad9270]
                        max-[540px]:bottom-4.25
                        max-[540px]:text-[7px]
                      `}
                    >
                      EN PREPARACIÓN
                    </small>
                  ) : (
                    <ChevronRight
                      aria-hidden="true"
                      size={14}
                      className="
                        absolute bottom-7.5 right-7.75
                        z-20 text-[#ad7740]
                        max-[540px]:bottom-5.25
                        max-[540px]:right-4
                        max-[540px]:size-3
                      "
                    />
                  )}
                </>
              );
              return portal.href ? (
                <Link
                  key={portal.title}
                  href={portal.href}
                  className={`
                    ${portalClasses}
                    hover:-translate-y-1.25
                    hover:brightness-[1.16]
                  `}
                >
                  {contents}
                </Link>
              ) : (
                <div
                  key={portal.title}
                  aria-label={`${portal.title}, en preparación`}
                  className={`
                    ${portalClasses}
                    cursor-default opacity-70
                  `}
                >
                  {contents}
                </div>
              );
            })}
          </nav>
        </div>
      </section>
      {/* BIBLIOTECA OFICIAL */}
      <section
        aria-labelledby="rol-home-books-title"
        className={`
          ${container}
          pt-19.5 pb-20.75
          max-[760px]:pt-15
          max-[760px]:pb-16.25
        `}
      >
        <header
          className="
            mx-auto mb-9 max-w-197.5
            text-center
          "
        >
          <span className={sectionEyebrow}>I · LOS REGISTROS DEL PASADO</span>
          <h2 id="rol-home-books-title" className={sectionTitle}>
            Emperadores de la Ceniza
          </h2>
          <p
            className={`
              ${bodyFont}
              m-0 text-[15px] leading-[1.75]
              text-[#c8b59a]
            `}
          >
            Cinco libros que conforman la historia oficial de ImperiumAO.
          </p>
          <div
            aria-hidden="true"
            className="
              mx-auto mt-2 -mb-3.25
              h-19.75 max-w-137.5
              bg-[url('/rol/ui/divider-imperial.png')]
              bg-center bg-contain bg-no-repeat
            "
          />
        </header>
        <div
          className="
            grid grid-cols-5 items-start
            gap-5.5
            max-[1120px]:gap-3
            max-[760px]:grid-cols-3
            max-[760px]:gap-x-4.25
            max-[760px]:gap-y-7.5
            max-[540px]:grid-cols-2
            max-[540px]:gap-x-3.5
            max-[540px]:gap-y-7
          "
        >
          {books.map((book) => {
            const publishing = book.slug === "libro-v";
            return (
              <article key={book.slug} className="min-w-0 text-center">
                <div
                  className={`
                    mx-auto w-full max-w-55
                    max-[540px]:max-w-42.5
                    ${
                      publishing
                        ? "filter-[drop-shadow(0_0_12px_#ad64274d)_drop-shadow(0_14px_13px_#000b)]"
                        : "drop-shadow-[0_14px_13px_#000b]"
                    }
                  `}
                >
                  {publishing ? (
                    <div aria-label={`Libro ${book.roman}: en publicación`}>
                      <BookCover book={book} />
                    </div>
                  ) : (
                    <Link
                      href={`/rol/libros/${book.slug}`}
                      aria-label={`Leer libro ${book.roman}: ${book.subtitle}`}
                      className="
                        block
                        transition-[transform,filter]
                        duration-240
                        hover:-translate-y-2
                        hover:brightness-[1.13]
                      "
                    >
                      <BookCover book={book} />
                    </Link>
                  )}
                </div>
                <div className="mt-4.25">
                  <span
                    className={`
                      ${bodyFont}
                      block text-[10px] font-extrabold
                      tracking-[0.19em]
                      text-[#b98c55]
                    `}
                  >
                    TOMO {book.roman}
                  </span>
                  <h3
                    className={`
                      ${displayFont}
                      my-2.25 min-h-11.5
                      text-lg font-normal leading-[1.27]
                      text-[#e8d3ae]
                      max-[540px]:text-base
                    `}
                  >
                    {book.subtitle}
                  </h3>
                  <div
                    className="
                      flex min-h-9.5
                      items-center justify-center
                    "
                  >
                    {publishing ? (
                      <span
                        className={`
                          ${displayFont}
                          inline-block
                          border border-[#806032]
                          bg-[#392414]
                          px-2.75 py-1.75
                          text-[9px] font-black
                          tracking-widest
                          text-[#e1b46f]
                        `}
                      >
                        POR CAPÍTULOS
                      </span>
                    ) : (
                      <Link
                        href={`/rol/libros/${book.slug}`}
                        className={`
                          ${bodyFont}
                          inline-flex items-center gap-1.5
                          text-xs font-bold
                          text-[#d9ab6c]
                          transition-colors
                          hover:text-[#ffe0aa]
                        `}
                      >
                        Leer volumen
                        <ArrowRight aria-hidden="true" size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-10.5 flex justify-center">
          <RolOrnamentalButton
            href="/rol/libros"
            size="wide"
            icon={<ArrowRight aria-hidden="true" />}
          >
            EXPLORAR LA BIBLIOTECA
          </RolOrnamentalButton>
        </div>
      </section>
      {/* ARCHIVO DE PERSONAJES */}
      <section
        aria-labelledby="rol-home-characters-title"
        className="
          relative overflow-hidden
          border-y border-[#684023]
          bg-[linear-gradient(160deg,#281910,#120c09_70%)]
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0
            bg-[radial-gradient(ellipse_at_65%_40%,#9d53201e,transparent_55%)]
          "
        />
        <div
          className={`
            ${container}
            relative grid
            grid-cols-[minmax(0,1.45fr)_minmax(265px,0.75fr)]
            items-center gap-16.25
            pt-17.25 pb-18.75
            max-[1120px]:gap-7.5
            max-[760px]:grid-cols-1
            max-[760px]:py-13.75
          `}
        >
          <div>
            <span className={sectionEyebrow}>
              II · EL ARCHIVO DE LOS NOMBRES
            </span>
            <h2 id="rol-home-characters-title" className={sectionTitle}>
              Archivo de personajes
            </h2>
            <p
              className={`
                ${bodyFont}
                mb-6.25 max-w-167.5
                text-[17px] leading-[1.8]
                text-[#c1ae91]
              `}
            >
              Emperadores, gobernantes y otras figuras que dejaron su huella.
              Consultá sus fichas, familias y acontecimientos documentados.
            </p>
            <div
              aria-label="Ejemplos de personajes documentados"
              className="
                mb-6.75
                border-t border-[#71502f]
              "
            >
              {featuredCharacters.map((character) => (
                <Link
                  key={character.slug}
                  href={`/rol/personajes/${character.slug}`}
                  className="
                    grid min-h-12.25
                    grid-cols-[24px_minmax(0,1fr)_minmax(85px,0.65fr)_17px]
                    items-center gap-3
                    border-b border-[#624428]
                    px-3 py-2.5
                    text-[#e4cba5]
                    transition-colors duration-200
                    hover:bg-[#7444222b]
                    hover:text-[#ffdc9e]
                    max-[540px]:grid-cols-[20px_minmax(0,1fr)_17px]
                    max-[540px]:gap-2
                    max-[540px]:px-1.75
                  "
                >
                  <span className="text-[#b78345]">
                    <ScrollText aria-hidden="true" size={17} />
                  </span>
                  <span
                    className={`
                      ${bodyFont}
                      min-w-0 text-lg
                      font-semibold leading-[1.4]
                      max-[540px]:text-[15px]
                    `}
                  >
                    {character.name}
                  </span>
                  <span
                    className={`
                      ${bodyFont}
                      text-right text-[11px]
                      text-[#aa916f]
                      max-[540px]:hidden
                    `}
                  >
                    {character.category}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    size={17}
                    className="text-[#b78345]"
                  />
                </Link>
              ))}
            </div>
            <RolOrnamentalButton
              href="/rol/personajes"
              size="wide"
              icon={<ArrowRight aria-hidden="true" />}
            >
              VER LOS {characters.length} PERSONAJES
            </RolOrnamentalButton>
          </div>
          <aside
            aria-label="Cantidad de fichas documentadas"
            className="
              relative isolate grid
              min-h-101.25 place-items-center
              max-[760px]:min-h-67.5
              max-[760px]:w-full
              max-[760px]:max-w-95
              max-[760px]:justify-self-center
            "
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute
                inset-[12%_9%_13%] z-0
                bg-[radial-gradient(ellipse_at_50%_27%,#63371c45,transparent_65%),linear-gradient(135deg,#2a1911,#110b09_80%)]
                shadow-[inset_0_0_35px_#080403]
              "
            />
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute
                inset-0 z-10
                bg-[url('/rol/ui/frame-panel.png')]
                bg-center bg-no-repeat
                bg-size-[100%_100%]
              "
            />
            <div
              className="
                relative z-20 flex flex-col
                items-center gap-1.5
                text-center text-[#ba884c]
              "
            >
              <div className="relative">
                <Shield aria-hidden="true" size={61} strokeWidth={1} />
                <Feather
                  aria-hidden="true"
                  size={24}
                  strokeWidth={1.3}
                  className="
                    absolute left-1/2 top-4
                    -translate-x-1/2
                    text-[#d6a45f]
                  "
                />
              </div>
              <strong
                className={`
                  ${displayFont}
                  mt-3 text-[83px]
                  font-normal leading-none
                  text-[#f0c787]
                  max-[760px]:text-[60px]
                `}
              >
                {characters.length}
              </strong>
              <span
                className={`
                  ${displayFont}
                  text-base font-bold
                  tracking-[0.17em]
                  text-[#dfb16d]
                `}
              >
                PERSONAJES
              </span>
              <small
                className={`
                  ${displayFont}
                  text-[10px] font-extrabold
                  tracking-[0.25em]
                  text-[#957854]
                `}
              >
                DOCUMENTADOS
              </small>
            </div>
          </aside>
        </div>
      </section>
      {/* LIBRO V */}
      <section
        aria-labelledby="rol-home-serial-title"
        className={`
          ${container}
          pt-18.5 pb-23.25
        `}
      >
        <div
          className="
            relative grid items-center gap-7.25
            grid-cols-[73px_minmax(0,1fr)_auto]
            border border-[#78502b]
            bg-[radial-gradient(ellipse_at_22%_0%,#65402166,transparent_63%),linear-gradient(115deg,#2c1c13,#110c09)]
            px-8.5 py-7.5
            shadow-[inset_0_0_0_1px_#c48b4629,0_10px_25px_#0006]
            max-[1120px]:grid-cols-[65px_minmax(0,1fr)]
            max-[540px]:grid-cols-1
            max-[540px]:gap-3.25
            max-[540px]:px-5.5
            max-[540px]:py-6.5
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none absolute
              inset-2 border border-[#67442555]
            "
          />
          <div
            aria-hidden="true"
            className="
              grid h-17.5 w-17.5
              rotate-[-4deg] place-items-center
              border border-[#8f6035]
              bg-[radial-gradient(#76462669,#20120c)]
              text-[#d5aa6e]
              max-[540px]:size-12
            "
          >
            <ScrollText size={36} strokeWidth={1.3} aria-hidden="true" />
          </div>
          <div className="relative min-w-0">
            <span className={sectionEyebrow}>EL RELATO CONTINÚA</span>
            <h2
              id="rol-home-serial-title"
              className={`
                ${displayFont}
                my-2 text-[30px]
                font-semibold leading-[1.2]
                text-[#f1d2a1]
                [text-shadow:0_3px_9px_#000]
                max-[540px]:text-[25px]
              `}
            >
              Libro V · Publicación por capítulos
            </h2>
            <p
              className={`
                ${bodyFont}
                m-0 max-w-172.5
                text-base leading-[1.75]
                text-[#c7b59a]
              `}
            >
              Los capítulos del quinto libro se incorporarán gradualmente a
              medida que sus acontecimientos se desarrollen dentro del juego.
            </p>
          </div>
          <RolOrnamentalButton
            href="/rol/libros"
            size="regular"
            icon={<ArrowRight aria-hidden="true" />}
            className="relative max-[1120px]:col-start-2 max-[1120px]:justify-self-start max-[540px]:col-auto"
          >
            VER COLECCIÓN
          </RolOrnamentalButton>
        </div>
      </section>
    </>
  );
}
