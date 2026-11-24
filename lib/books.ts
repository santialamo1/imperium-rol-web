
export type RoleBook = {
  slug: string;
  roman: string;
  ordinal: string;
  subtitle: string;
  pages: number;
  theme: "ember" | "smoke" | "blood" | "iron" | "ashes";
};

export const books: RoleBook[] = [
  {
    slug: "libro-i",
    roman: "I",
    ordinal: "Primero",
    subtitle: "La Torre y la Bruma",
    pages: 799,
    theme: "ember",
  },
  {
    slug: "libro-ii",
    roman: "II",
    ordinal: "Segundo",
    subtitle: "La Colina y el Muro",
    pages: 900,
    theme: "smoke",
  },
  {
    slug: "libro-iii",
    roman: "III",
    ordinal: "Tercero",
    subtitle: "La Sangre Prestada",
    pages: 891,
    theme: "blood",
  },
  {
    slug: "libro-iv",
    roman: "IV",
    ordinal: "Cuarto",
    subtitle: "El Sexto",
    pages: 866,
    theme: "iron",
  },
  {
    slug: "libro-v",
    roman: "V",
    ordinal: "Quinto",
    subtitle: "La bruma que vuelve",
    pages: 885,
    theme: "ashes",
  },
];

export function getBook(slug: string) {
  return books.find((book) => book.slug === slug);
}
