import { Metadata } from "next";
import { Compass } from "lucide-react";
import { obterConceitos, obterGrafoTaxonomia } from "@/acoes/taxonomia";
import { PainelTaxonomia } from "@/componentes/taxonomia/painel-taxonomia";

export const metadata: Metadata = {
  title: "Taxonomia | Rflex01",
  description: "Mapa de ideias, conceitos canônicos e relações semânticas do acervo autoral.",
};

export const dynamic = "force-dynamic";

export default async function PaginaTaxonomia() {
  const [conceitos, arestas] = await Promise.all([
    obterConceitos(),
    obterGrafoTaxonomia(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
          <Compass className="h-4 w-4" />
          <span>Mapa de ideias</span>
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Taxonomia
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
          Explore os conceitos do seu acervo e as relações semânticas registradas entre eles.
        </p>
      </div>

      <PainelTaxonomia
        conceitosIniciais={conceitos}
        arestasIniciais={arestas}
      />
    </div>
  );
}
