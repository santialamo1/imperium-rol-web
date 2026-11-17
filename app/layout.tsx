import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata = {
 title: {default:'Archivo de Rol | ImperiumAO',template:'%s | ImperiumAO'},
 description:'Biblioteca oficial de los libros Emperadores de la Ceniza y archivo histórico de personajes de ImperiumAO.',
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="es"><body>{children}</body></html>;
}
