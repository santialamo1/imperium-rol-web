import Image from "next/image";
import type { RoleBook } from "@/lib/books";

const bookCoverImages: Record<string, string> = {
  "libro-i": "/rol/images/covers/libro-1.png",
  "libro-ii": "/rol/images/covers/libro-2.png",
  "libro-iii": "/rol/images/covers/libro-3.png",
  "libro-iv": "/rol/images/covers/libro-4.png",
  "libro-v": "/rol/images/covers/libro-5.png",
};

type BookCoverProps = {
  book: RoleBook;
  small?: boolean;
};

export function BookCover({ book, small = false }: BookCoverProps) {
  const coverSrc = bookCoverImages[book.slug];

  if (!coverSrc) {
    return null;
  }

  return (
    <div className="relative block w-full min-w-0 bg-transparent leading-none">
      <Image
        src={coverSrc}
        alt={`Libro ${book.roman}: ${book.subtitle}`}
        width={1024}
        height={1536}
        sizes={
          small
            ? "(max-width: 600px) 35vw, 130px"
            : "(max-width: 540px) 46vw, (max-width: 760px) 30vw, (max-width: 1200px) 22vw, 220px"
        }
        className="block h-auto w-full object-contain"
      />
    </div>
  );
}
