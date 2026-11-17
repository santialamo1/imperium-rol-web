import characterData from './characters.json';
export type Character = {
 id:number; name:string; slug:string; category:string; race:string|null; className:string|null;
 height:string|null; weight:string|null; build:string|null; hair:string|null; eyes:string|null;
 combat:string|null; diplomacy:string|null; strategy:string|null; economy:string|null;
 personality:string|null; betrayValues:string|null; betrayAllies:string|null; selfSacrifice:string|null;
 family:Record<string,string>; history:string[]; source:string;
};
export const characters:Character[] = characterData as Character[];
export const categories=[...new Set(characters.map(c=>c.category))];
export const races=[...new Set(characters.map(c=>c.race).filter((r):r is string=>Boolean(r)))].sort((a,b)=>a.localeCompare(b,'es'));
export function getCharacter(slug:string){return characters.find(c=>c.slug===slug);}
