import type { Metadata } from "next";
import chronology from "@/content/rol/chronology/cronologia.json";
import { ChronologyTimeline } from "@/components/chronology-timeline";

export const metadata: Metadata = {
  title: "Cronología histórica",
  description:
    "Recorré los acontecimientos históricos de ImperiumAO, del Primer Imperio a la Nueva Era, con referencias a Emperadores de la Ceniza.",
  robots: { index: false, follow: false }, // Borrador: habilitar tras aprobación editorial.
};

export default function ChronologyPage() {
  return (
    <ChronologyTimeline
      events={chronology.acontecimientosHistoricos}
      cutDescription={chronology.metadatos.corteHistorico}
      revisionStatus={chronology.metadatos.estado}
    />
  );
}
