
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";

const container =
  "mx-auto w-[calc(100%_-_36px)] max-w-[1320px] min-[801px]:w-[calc(100%_-_76px)]";

const subnavLink = `
  relative inline-flex h-[72px] shrink-0
  items-center justify-center
  whitespace-nowrap px-[14px]
  font-(family-name:--font-rol-display)
  text-[11px] font-bold uppercase tracking-[0.11em]
  text-[#bea98b] [text-shadow:0_2px_3px_#000]
  transition-[color,background-color] duration-200
  after:pointer-events-none after:absolute
  after:bottom-[13px] after:inset-x-[14px]
  after:h-px after:origin-center
  after:content-['']
  after:scale-x-0 after:bg-[#b9874b]
  after:transition-transform after:duration-200
  hover:bg-[#9b62300e] hover:text-[#f0d2a0]
  hover:after:scale-x-100
  focus-visible:outline-2
  focus-visible:outline-offset-[-5px]
  focus-visible:outline-[#dcac70]
  max-[800px]:h-[62px]
  max-[800px]:px-[9px]
  max-[800px]:text-[10px]
  max-[800px]:tracking-[0.06em]
  max-[550px]:h-[48px]
  max-[550px]:px-[5px]
  max-[550px]:text-[9px]
  max-[550px]:tracking-[0.04em]
  max-[400px]:px-[3px]
  max-[400px]:text-[8px]
  max-[550px]:after:bottom-[5px]
  max-[550px]:after:inset-x-[5px]
`;

const subnavActive = `
  bg-[#9b623014] text-[#f3d5a4]
  [text-shadow:0_0_14px_#b07a3d50]
  after:scale-x-100 after:bg-[#dda965]
`;

const sections = [
  {
    label: "Inicio",
    href: "/rol",
  },
  {
    label: "Biblioteca",
    href: "/rol/libros",
  },
  {
    label: "Personajes",
    href: "/rol/personajes",
  },
  {
    label: "Cronología",
    href: "/rol/cronologia",
  },
] as const;

export function SiteShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div
      className="
        relative isolate w-full min-w-0
        bg-[#0b0908]
        bg-[radial-gradient(ellipse_at_50%_1400px,#1d130d,transparent_800px)]
        font-(family-name:--font-rol-body)
        text-[#e8ded0]
      "
    >
      {/* ==========================================
          SUBNAVEGACIÓN DE ROL
      ========================================== */}

      <nav
        aria-label="Secciones de Rol"
        className="
          relative z-20
          border-y border-[#654124]
          bg-[#160e0a]
          bg-[radial-gradient(ellipse_at_38%_0%,#79452124,transparent_55%),linear-gradient(180deg,#26170f_0%,#17100b_52%,#100b09_100%)]
          shadow-[inset_0_1px_0_#c18b4830,inset_0_-1px_0_#321d12,0_4px_15px_#0006]
        "
      >
        {/* Línea metálica superior */}
        <span
          aria-hidden="true"
          className="
            pointer-events-none absolute
            inset-x-0 top-0 h-px
            bg-[linear-gradient(90deg,transparent,#a6794055_18%,#c0915370_50%,#a6794055_82%,transparent)]
          "
        />

        <div
          className={`
            ${container}
            flex min-h-18
            items-center justify-between gap-4
            max-[800px]:min-h-15.5
            max-[550px]:flex-col
            max-[550px]:gap-0
          `}
        >
          {/* Identidad del Archivo de Rol */}
          <Link
            href="/rol"
            aria-label="Ir al inicio del Archivo de Rol"
            className="
              group inline-flex shrink-0
              items-center gap-3
              focus-visible:outline-2
              focus-visible:outline-offset-4
              focus-visible:outline-[#dcac70]
              max-[800px]:gap-2
              max-[550px]:self-center
              max-[550px]:py-2
            "
          >
            <span
              aria-hidden="true"
              className="
                relative grid size-10 shrink-0
                place-items-center
                border border-[#835a32]
                bg-[radial-gradient(circle_at_50%_15%,#65402466,#21150e_75%)]
                text-[#d7a35b]
                shadow-[inset_0_0_0_1px_#d6a15b20,0_2px_8px_#0008]
                transition-[border-color,color,filter]
                duration-200
                group-hover:border-[#c59151]
                group-hover:text-[#f0cd91]
                max-[800px]:size-9
                max-[550px]:size-8
              "
            >
              <BookOpen
                size={21}
                strokeWidth={1.7}
              />
            </span>

            <span
              className="
                flex items-center gap-3
                max-[800px]:gap-2
              "
            >
              <span
                aria-hidden="true"
                className="
                  h-6.25 w-px
                  bg-[linear-gradient(180deg,transparent,#a4763e,transparent)]
                "
              />

              <span
                className="
                  font-(family-name:--font-rol-display)
                  text-[15px] font-semibold
                  tracking-widest
                  text-[#e9cda1]
                  [text-shadow:0_2px_4px_#000]
                  transition-colors duration-200
                  group-hover:text-[#f8dfb4]
                  max-[800px]:text-[12px]
                  max-[800px]:tracking-[0.04em]
                "
              >
                ARCHIVO DE ROL
              </span>
            </span>
          </Link>

          {/* Separador central en escritorio */}
          <span
            aria-hidden="true"
            className="
              mx-3 hidden h-px min-w-6 flex-1
              bg-[linear-gradient(90deg,transparent,#835a344d_24%,#835a344d_76%,transparent)]
              min-[1100px]:block
            "
          />

          {/* Enlaces */}
          <div
            className="
              flex shrink-0 items-center gap-2
              max-[800px]:gap-1
              max-[550px]:grid
              max-[550px]:w-full
              max-[550px]:grid-cols-4
              max-[550px]:gap-0
              max-[550px]:border-t
              max-[550px]:border-[#65412470]
            "
          >
            {sections.map((section) => {
              const active =
                section.href === "/rol"
                  ? pathname === "/rol"
                  : pathname.startsWith(section.href);

              return (
                <Link
                  key={section.href}
                  href={section.href}
                  aria-current={
                    active ? "page" : undefined
                  }
                  className={`
                    ${subnavLink}
                    ${active ? subnavActive : ""}
                  `}
                >
                  {section.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ==========================================
          CONTENIDO DEL ARCHIVO DE ROL
      ========================================== */}

      <div id="rol-content" className="min-w-0">
        {children}
      </div>
    </div>
  );
}
