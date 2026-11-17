export type RoleBook = {
  slug: string;
  roman: string;
  ordinal: string;
  subtitle: string;
  pages: number;
  file: string;
  theme: 'ember' | 'smoke' | 'blood' | 'iron' | 'ashes';
};

export const books: RoleBook[] = [
  {slug:'libro-i',roman:'I',ordinal:'Primero',subtitle:'La Torre y la Bruma',pages:789,file:'/rol/books/libro-1.pdf',theme:'ember'},
  {slug:'libro-ii',roman:'II',ordinal:'Segundo',subtitle:'La Colina y el Muro',pages:898,file:'/rol/books/libro-2.pdf',theme:'smoke'},
  {slug:'libro-iii',roman:'III',ordinal:'Tercero',subtitle:'La Sangre Prestada',pages:878,file:'/rol/books/libro-3.pdf',theme:'blood'},
  {slug:'libro-iv',roman:'IV',ordinal:'Cuarto',subtitle:'El Sexto',pages:850,file:'/rol/books/libro-4.pdf',theme:'iron'},
  {slug:'libro-v',roman:'V',ordinal:'Quinto',subtitle:'La bruma que vuelve',pages:885,file:'/rol/books/libro-5.pdf',theme:'ashes'},
];
export function getBook(slug:string){return books.find(book=>book.slug===slug);}
