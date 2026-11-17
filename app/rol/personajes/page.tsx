import type { Metadata } from "next";
import { CharacterSearch } from "@/components/character-search";
import { RolSectionHero } from "@/components/rol-section-hero";

export const metadata: Metadata = {
  title: "Archivo de personajes",
};

export default function CharactersPage() {
  return (
    <>
      <RolSectionHero
        section="personajes"
        eyebrow="ARCHIVO DE ROL / PERSONAJES"
        title={<>Rostros de <em>la historia</em></>}
        description="Explorá las fichas documentadas de quienes marcaron el destino de ImperiumAO. Buscá por nombre o recorré las categorías históricas."
      />
      <section className="site-container character-section">
        <CharacterSearch />
      </section>
    </>
  );
}
