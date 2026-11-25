import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  BookOpen,
  ScrollText,
  Shield,
  UsersRound,
  HeartHandshake,
  Scale,
  Swords,
} from "lucide-react";

import { characters, getCharacter } from "@/lib/characters";
import { translateFamilyLabel } from "@/lib/character-labels";

const displayFont = "font-(family-name:--font-rol-display)";

const bodyFont = "font-(family-name:--font-rol-body)";

const container =
  "mx-auto w-[calc(100%_-_36px)] max-w-[1320px] min-[801px]:w-[calc(100%_-_76px)]";

const sectionKicker = `
  text-xs font-black
  uppercase tracking-[0.22em]
  text-[#d6aa68]
`;

const panelClasses = `
  border border-[#745334]
  bg-[#21170f]
  px-[23px] py-[25px]
  shadow-[inset_0_0_0_5px_#120e0a]
`;

const panelHeading = `
  mb-[9px] flex items-center gap-[11px]
  border-b border-[#644728]
  pb-4
  text-[22px] font-normal
  text-[#e7bd80]
`;

const proseHeading = `
  mb-[15px] flex items-center gap-[10px]
  text-[27px] font-normal
  text-[#4f341e]
`;

const proseParagraph = `
  mb-[17px]
  text-[17px] leading-[1.88]
  text-[#3a2c1e]
  max-[550px]:text-[15px]
`;

function Fact({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div
      className="
        border-b border-[#3d2c1b]
        py-3 last:border-b-0
      "
    >
      <dt
        className="
          mb-1.25
          text-[10px] font-extrabold
          uppercase tracking-[0.14em]
          text-[#ae8b61]
        "
      >
        {label}
      </dt>

      <dd
        className={`
          ${bodyFont}
          m-0 text-[13px] leading-[1.55]
          text-[#e8d7b9]
        `}
      >
        {value}
      </dd>
    </div>
  );
}

export function generateStaticParams() {
  return characters.map((character) => ({
    slug: character.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const character = getCharacter(slug);

  return {
    title: character
      ? `${character.name} · Ficha histórica`
      : "Ficha no encontrada",
  };
}

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const c = getCharacter(slug);

  if (!c) {
    notFound();
  }

  const familyText = Object.values(c.family).join(" ").toLowerCase();

  const relatives = characters
    .filter(
      (other) =>
        other.slug !== c.slug &&
        other.name.length > 5 &&
        familyText.includes(other.name.toLowerCase()),
    )
    .slice(0, 8);

  return (
    <>
      {/* ==========================================
          NAVEGACIÓN SUPERIOR
      ========================================== */}

      <div
        className={`
          ${container}
          flex min-h-18
          items-center justify-between
          gap-3.75
          text-[11px] tracking-widest
          text-[#9d825c]
          max-[550px]:min-h-14.75
          max-[550px]:text-[10px]
        `}
      >
        <Link
          href="/rol/personajes"
          className="
            inline-flex items-center gap-2.25
            text-[#d1a66d]
            transition-colors duration-200
            hover:text-[#ffd39a]
          "
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Volver al archivo de personajes
        </Link>

        <span className="max-[550px]:hidden">
          ARCHIVO / {c.name.toUpperCase()}
        </span>
      </div>

      {/* ==========================================
          ENCABEZADO DEL PERSONAJE
      ========================================== */}

      <header
        className="
          relative
          border-y border-[#553a26]
          bg-[#20140e]
          bg-[radial-gradient(ellipse_at_40%_10%,#50301e,transparent_62%),linear-gradient(#20140e,#0f0b09)]
        "
      >
        <div
          className={`
            ${container}
            flex items-center gap-11
            py-11.75
            max-[550px]:gap-4.5
            max-[550px]:py-8.25
          `}
        >
          {/* Emblema identificatorio */}
          <div
            aria-hidden="true"
            className="
              relative flex
              h-43 w-38.75
              shrink-0 flex-col
              items-center justify-center
              gap-0.75
              border-2 border-[#946b3b]
              bg-[radial-gradient(ellipse_at_50%_35%,#735033,#160e0c_75%)]
              text-[#d8ad74]
              shadow-[inset_0_0_0_8px_#281b13,inset_0_0_0_9px_#80603b]
              max-[550px]:h-27.5
              max-[550px]:w-22.5
            "
          >
            <span
              className="
                text-[62px] leading-none
                max-[550px]:text-[40px]
              "
            >
              ✥
            </span>

            <strong
              className={`
                ${displayFont}
                text-[30px] font-normal
                max-[550px]:text-lg
              `}
            >
              {c.name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part.charAt(0))
                .join("")}
            </strong>
          </div>

          {/* Datos principales */}
          <div className="min-w-0">
            <span
              className={`
                ${displayFont}
                ${sectionKicker}
                max-[550px]:text-[9px]
              `}
            >
              EXPEDIENTE HISTÓRICO · N.º {String(c.id).padStart(2, "0")}
            </span>

            <h1
              className={`
                ${displayFont}
                my-4.25 mb-3
                text-[clamp(37px,4.4vw,62px)]
                font-bold leading-[1.1]
                text-[#f4deba]
                max-[550px]:text-[30px]
              `}
            >
              {c.name}
            </h1>

            <p
              className={`
                ${bodyFont}
                text-[13px] text-[#bca383]
                max-[550px]:text-[11px]
                max-[550px]:leading-normal
              `}
            >
              {c.category}
              {c.race ? ` · ${c.race}` : ""}
              {c.className ? ` · ${c.className}` : ""}
            </p>
          </div>
        </div>
      </header>

      {/* ==========================================
          CUERPO DEL EXPEDIENTE
      ========================================== */}

      <div
        className={`
          ${container}
          grid grid-cols-[315px_minmax(0,1fr)]
          items-start gap-9
          pt-13.75 pb-27.5
          max-[800px]:grid-cols-1
          max-[800px]:pt-7.5
        `}
      >
        {/* ========================================
            PANEL LATERAL DE INFORMACIÓN
        ======================================== */}

        <aside
          className="
            flex flex-col gap-4.75
            max-[800px]:grid
            max-[800px]:grid-cols-2
            max-[550px]:grid-cols-1
          "
        >
          {/* Identidad */}
          <section className={panelClasses}>
            <h2
              className={`
                ${displayFont}
                ${panelHeading}
              `}
            >
              <Shield
                size={19}
                className="shrink-0 text-[#ae8247]"
                aria-hidden="true"
              />
              Identidad
            </h2>

            <dl>
              <Fact label="Raza" value={c.race} />

              <Fact label="Clase / arquetipo" value={c.className} />

              <Fact label="Altura" value={c.height} />

              <Fact label="Peso" value={c.weight} />

              <Fact label="Contextura" value={c.build} />

              <Fact label="Cabello" value={c.hair} />

              <Fact label="Ojos" value={c.eyes} />
            </dl>
          </section>

          {/* Capacidades */}
          <section className={panelClasses}>
            <h2
              className={`
                ${displayFont}
                ${panelHeading}
              `}
            >
              <Swords
                size={19}
                className="shrink-0 text-[#ae8247]"
                aria-hidden="true"
              />
              Capacidades
            </h2>

            <dl>
              <Fact label="Combate" value={c.combat} />

              <Fact label="Diplomacia" value={c.diplomacy} />

              <Fact label="Estrategia" value={c.strategy} />

              <Fact label="Cuentas / oro" value={c.economy} />
            </dl>
          </section>

          {/* Valores */}
          <section className={panelClasses}>
            <h2
              className={`
                ${displayFont}
                ${panelHeading}
              `}
            >
              <Scale
                size={19}
                className="shrink-0 text-[#ae8247]"
                aria-hidden="true"
              />
              Valores
            </h2>

            <dl>
              <Fact label="Traicionaría sus valores" value={c.betrayValues} />

              <Fact label="Traicionaría sus aliados" value={c.betrayAllies} />

              <Fact label="Se sacrificaría" value={c.selfSacrifice} />
            </dl>
          </section>
        </aside>

        {/* ========================================
            PERGAMINO HISTÓRICO
        ======================================== */}

        <article
          className={`
            ${bodyFont}
            min-w-0
            border-10 border-[#4b2b17]
            bg-[#d8c29c]
            bg-[radial-gradient(ellipse_at_50%_0%,#f3e5c7,transparent_650px),repeating-linear-gradient(15deg,transparent_0_3px,#78512606_4px_6px)]
            px-[clamp(25px,4vw,70px)]
            pt-12 pb-15
            text-[#332519]
            outline outline-[#98734a]
            shadow-[0_0_0_1px_#1d130c,0_30px_65px_#0008,inset_0_0_45px_#85623b5a]
            max-[800px]:px-6.75
            max-[800px]:py-8.75
            max-[550px]:border-[7px]
            max-[550px]:px-4.75
            max-[550px]:py-7.5
          `}
        >
          {/* Encabezado del pergamino */}
          <div
            className="
              mb-7.5 border-b
              border-[#9a7756]
              pb-8.75 text-center
            "
          >
            <span
              className={`
                ${displayFont}
                text-[10px] font-black
                tracking-[0.22em]
                text-[#816342]
              `}
            >
              EL REGISTRO DE UNA VIDA
            </span>

            <h2
              className={`
                ${displayFont}
                my-4.25 mb-2.5
                text-[40px] font-normal
                leading-[1.12]
                max-[550px]:text-[33px]
              `}
            >
              Historia y <em className="text-[#85502e]">legado</em>
            </h2>

            <div
              aria-hidden="true"
              className="
                text-[30px] text-[#956d3e]
              "
            >
              ✥
            </div>
          </div>

          {/* Personalidad */}
          {c.personality && (
            <section
              className="
                my-6.25 mb-8.75
                border-l-[3px] border-[#98683d]
                bg-[#c2a77960]
                px-5.75 py-4.75
              "
            >
              <h3
                className={`
                  ${displayFont}
                  ${proseHeading}
                `}
              >
                <HeartHandshake
                  size={18}
                  className="shrink-0 text-[#935f35]"
                  aria-hidden="true"
                />
                Personalidad
              </h3>

              <p className={`${bodyFont} ${proseParagraph} mb-0`}>
                {c.personality}
              </p>
            </section>
          )}

          {/* Crónica histórica */}
          <section className="my-6.25 mb-8.75">
            <h3
              className={`
                ${displayFont}
                ${proseHeading}
              `}
            >
              <ScrollText
                size={19}
                className="shrink-0 text-[#935f35]"
                aria-hidden="true"
              />
              Crónica histórica
            </h3>

            {c.history.map((paragraph, index) => (
              <p
                key={index}
                className={`
                  ${bodyFont}
                  ${proseParagraph}
                `}
              >
                {paragraph}
              </p>
            ))}
          </section>

          {/* Familia y vínculos */}
          {Object.keys(c.family).length > 0 && (
            <section
              className="
                my-6.25 mb-8.75
                border-t border-[#977555]
                pt-6.5
              "
            >
              <h3
                className={`
                  ${displayFont}
                  ${proseHeading}
                `}
              >
                <UsersRound
                  size={19}
                  className="shrink-0 text-[#935f35]"
                  aria-hidden="true"
                />
                Familia y vínculos
              </h3>

              <dl>
                {Object.entries(c.family).map(([name, value]) => (
                  <div
                    key={name}
                    className="
                        grid grid-cols-[150px_minmax(0,1fr)]
                        gap-3
                        border-b border-[#9d79533f]
                        py-2.5
                        max-[550px]:grid-cols-1
                        max-[550px]:gap-1
                      "
                  >
                    <dt
                      className="
                          text-[13px] font-bold
                          text-[#64452c]
                        "
                    >
                      {translateFamilyLabel(name)}
                    </dt>

                    <dd
                      className={`
                          ${bodyFont}
                          m-0 text-[15px]
                          leading-normal
                        `}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Fichas vinculadas */}
          {relatives.length > 0 && (
            <section
              className="
                border-t border-[#977555]
                pt-6.25
              "
            >
              <h3
                className={`
                  ${displayFont}
                  ${proseHeading}
                `}
              >
                Otras fichas vinculadas
              </h3>

              <div className="flex flex-wrap gap-2">
                {relatives.map((relative) => (
                  <Link
                    key={relative.slug}
                    href={`/rol/personajes/${relative.slug}`}
                    className="
                      inline-flex items-center
                      gap-2 border border-[#997147]
                      bg-[#9a714328]
                      px-3 py-2.25
                      text-xs font-bold
                      text-[#59391d]
                      transition-colors duration-200
                      hover:bg-[#ac8757]
                    "
                  >
                    {relative.name}

                    <span aria-hidden="true" className="opacity-70">
                      ↗
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ========================================
              FUENTE HISTÓRICA
          ======================================== */}

          <div
            className="
              mt-10 flex items-start gap-3.75
              border-t border-[#977555]
              pt-6.25
              text-[#674a30]
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

              <p
                className={`
                  ${bodyFont}
                  my-1.75 text-sm
                `}
              >
                {c.source || "Fichas oficiales de personajes de ImperiumAO"}
              </p>

              <small
                className="
                  block text-[11px]
                  leading-[1.6]
                "
              >
                Los datos de este expediente proceden del archivo de fichas
                oficiales, con referencia al inicio de 1439.
              </small>
            </div>
          </div>

          {/* ========================================
              VOLVER AL ARCHIVO
          ======================================== */}

          <div className="mt-8.75">
            <Link
              href="/rol/personajes"
              className={`
                ${displayFont}
                inline-flex min-h-12.5
                items-center justify-center
                gap-2.75
                border border-[#8c6840]
                bg-[#c2a37566]
                px-5.25 py-3
                text-center text-xs
                font-black tracking-[0.035em]
                text-[#3f2818]
                transition-colors duration-200
                hover:bg-[#b48f5a]
              `}
            >
              <ArrowLeft size={17} aria-hidden="true" />
              VOLVER A PERSONAJES
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
