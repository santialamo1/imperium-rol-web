import type { Metadata } from "next";

import Link from "next/link";

import { ArrowRight, BookOpen, ScrollText } from "lucide-react";

import { books } from "@/lib/books";

import { BookCover } from "@/components/book-cover";
import { RolSectionHero } from "@/components/rol-section-hero";
import { RolOrnamentalButton } from "@/components/rol-ornamental-button";

export const metadata: Metadata = {

  title: "Biblioteca oficial",

  description:

    "Explorá los libros oficiales de Emperadores de la Ceniza, la historia de ImperiumAO.",

};

// Tipografías definidas en app/rol/layout.tsx.

const displayFont = "font-(family-name:--font-rol-display)";

const bodyFont = "font-(family-name:--font-rol-body)";

// Ancho de contenido utilizado en la sección de Rol.

const container =

  "mx-auto w-[calc(100%-36px)] max-w-[1320px] md:w-[calc(100%-76px)]";

export default function BooksPage() {

  return (

    <>

      {/* ==========================================

          ENCABEZADO DE LA BIBLIOTECA

      ========================================== */}

      <RolSectionHero
        section="biblioteca"
        eyebrow="ARCHIVO DE ROL / BIBLIOTECA"
        title={<>Crónicas de <em>la Ceniza</em></>}
        description={
          <>Los cinco libros oficiales de Emperadores de la Ceniza. Descubrí los volúmenes que narran la historia de ImperiumAO y seguí la publicación progresiva del quinto libro.</>
        }
      />

      {/* ==========================================

          CATÁLOGO DE LIBROS

      ========================================== */}

      <section

        className={`

          ${container}

          ${bodyFont}

          pt-[60px] pb-[105px]

        `}

      >

        {/* Información de la colección */}

        <div

          className="

            flex items-center justify-between

            gap-5 border-b border-[#5a3c25]

            pb-5

            text-[11px] font-extrabold

            tracking-[0.18em]

            text-[#b89562]

            max-[550px]:flex-col

            max-[550px]:items-start

            max-[550px]:gap-[10px]

          "

        >

          <div className="flex items-center gap-[10px]">

            <BookOpen size={22} aria-hidden="true" />

            <span>COLECCIÓN OFICIAL</span>

          </div>

          <span>{books.length} VOLÚMENES · LIBRO V EN PUBLICACIÓN</span>

        </div>

        {/* Grilla responsive */}

        <div

          className="

            mt-10 grid grid-cols-2

            gap-8

            max-[800px]:grid-cols-1

          "

        >

          {books.map((book) => {

            const isPublishing = book.slug === "libro-v";

            return (

              <article

                key={book.slug}

                className="

                  grid min-h-[330px]

                  grid-cols-[180px_minmax(0,1fr)]

                  items-center gap-[30px]

                  border border-[#5c3922]

                  bg-[radial-gradient(ellipse_at_15%_20%,#4c302042,transparent_60%),linear-gradient(125deg,#201611,#100c0a)]

                  p-7

                  transition-[border-color,transform]

                  duration-200

                  hover:-translate-y-[3px]

                  hover:border-[#b2844a]

                  max-[1180px]:grid-cols-[140px_minmax(0,1fr)]

                  max-[1180px]:gap-5

                  max-[800px]:grid-cols-[160px_minmax(0,1fr)]

                  max-[550px]:min-h-[220px]

                  max-[550px]:grid-cols-[118px_minmax(0,1fr)]

                  max-[550px]:gap-4

                  max-[550px]:p-[18px]

                "

              >

                {/* ==================================

                    PORTADA

                ================================== */}

                {isPublishing ? (

                  <div

                    className="

                      block min-w-0

                      drop-shadow-[9px_14px_9px_#000b]

                    "

                    aria-label={`Libro ${book.roman}: en publicación`}

                  >

                    <BookCover book={book} />

                  </div>

                ) : (

                  <Link

                    href={`/rol/libros/${book.slug}`}

                    aria-label={`Leer ${book.subtitle}`}

                    className="

                      block min-w-0

                      drop-shadow-[9px_14px_9px_#000b]

                      transition-transform duration-200

                      hover:-translate-y-[5px]

                      focus-visible:outline

                      focus-visible:outline-2

                      focus-visible:outline-[#d6aa68]

                    "

                  >

                    <BookCover book={book} />

                  </Link>

                )}

                {/* ==================================

                    INFORMACIÓN DEL VOLUMEN

                ================================== */}

                <div className="min-w-0">

                  <span

                    className={`

                      ${displayFont}

                      text-[11px] font-bold

                      uppercase tracking-[0.15em]

                      text-[#d6aa68]

                      max-[550px]:text-[9px]

                    `}

                  >

                    LIBRO {book.roman} ·{" "}

                    {isPublishing ? "EN PUBLICACIÓN" : "EDICIÓN OFICIAL"}

                  </span>

                  <h2

                    className={`

                      ${displayFont}

                      my-[14px]

                      text-[30px] font-normal

                      leading-[1.12]

                      text-[#ecd4a9]

                      max-[550px]:text-[22px]

                    `}

                  >

                    {book.subtitle}

                  </h2>

                  {isPublishing ? (

                    <>

                      <p

                        className="

                          text-[13px] leading-[1.6]

                          text-[#b3a48f]

                          max-[550px]:text-[11px]

                        "

                      >

                        El quinto volumen se publicará progresivamente, capítulo

                        a capítulo, a medida que sus acontecimientos se

                        desarrollen dentro del juego.

                      </p>

                      <div

                        role="status"

                        className="

                          mt-4 flex w-fit

                          items-center gap-[9px]

                          text-xs text-[#c5a276]

                        "

                      >

                        <ScrollText size={16} aria-hidden="true" />

                        Publicación por capítulos

                      </div>

                    </>

                  ) : (

                    <>

                      <p

                        className="

                          text-[13px] leading-[1.6]

                          text-[#b3a48f]

                          max-[550px]:text-[11px]

                        "

                      >

                        {book.pages.toLocaleString("es-AR")} páginas · Edición

                        íntegra

                      </p>

                      {/* Botón ornamental de lectura: se conserva el diseño aprobado. */}
                      <div className="mt-[22px]">
                        <RolOrnamentalButton
                          href={`/rol/libros/${book.slug}`}
                          size="regular"
                          icon={<ArrowRight aria-hidden="true" />}
                        >
                          LEER LIBRO
                        </RolOrnamentalButton>
                      </div>

                    </>

                  )}

                </div>

              </article>

            );

          })}

        </div>

      </section>

    </>

  );

}
