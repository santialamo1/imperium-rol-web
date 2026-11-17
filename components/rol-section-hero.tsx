import type { ReactNode } from "react";

type HeroSection = "biblioteca" | "personajes" | "cronologia";

type Props = {
  section: HeroSection;
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
};

const backgrounds: Record<HeroSection, string> = {
  biblioteca: "bg-[url('/rol/images/hero-rol-biblioteca.webp')]",
  personajes: "bg-[url('/rol/images/hero-rol-personajes.webp')]",
  cronologia: "bg-[url('/rol/images/hero-rol-cronologia.webp')]",
};

const container =
  "mx-auto w-[calc(100%_-_36px)] max-w-[1320px] min-[801px]:w-[calc(100%_-_76px)]";

/** Encabezado compartido. No modifica el header global de ImperiumAO. */
export function RolSectionHero({
  section,
  eyebrow,
  title,
  description,
  children,
}: Props) {
  return (
    <header className="relative isolate overflow-hidden border-b border-[#704425] bg-[#160e0a]">
      {/* Ilustración específica de la sección */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-30 bg-cover bg-center bg-no-repeat ${backgrounds[section]}`}
      />
      {/* Filtro compartido que protege la legibilidad sin ocultar la ilustración */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(90deg,#110907c4_0%,#120908b8_34%,#1409088e_67%,#0c080789_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#09060455_0%,transparent_35%,#080604a0_100%)]"
      />
      {/* El polvo suspendido es parte de la misma estética en las tres páginas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#dc9b54_0.8px,transparent_1.1px)] bg-size-[95px_116px] opacity-[0.13]"
      />

      <div
        className={`${container} relative z-10 flex min-h-95 flex-col justify-center py-14.5 max-[760px]:min-h-82.5 max-[760px]:py-12 max-[540px]:min-h-75 max-[540px]:py-10.5`}
      >
        <p className="mb-4.5 font-(family-name:--font-rol-display) text-[11px] font-bold uppercase tracking-[0.21em] text-[#d6a35f] max-[540px]:text-[9px] max-[540px]:tracking-[0.14em]">
          {eyebrow}
        </p>
        <h1 className="max-w-270 font-(family-name:--font-rol-display) text-[clamp(38px,4.8vw,67px)] font-semibold leading-[1.13] tracking-tight text-[#f3dfb9] [text-shadow:0_4px_13px_#000c] [&_em]:font-normal [&_em]:text-[#ce9d57] max-[540px]:text-[clamp(34px,9vw,45px)]">
          {title}
        </h1>
        <p className="mt-6 max-w-205 font-(family-name:--font-rol-body) text-[16px] leading-[1.8] text-[#ddc3a0] [text-shadow:0_2px_8px_#000] max-[540px]:mt-4.5 max-[540px]:text-[14px]">
          {description}
        </p>
        {children && <div className="mt-6.5">{children}</div>}
      </div>
    </header>
  );
}
