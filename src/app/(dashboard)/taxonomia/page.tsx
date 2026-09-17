import { Metadata } from "next";
import { Compass } from "lucide-react";
import { obterConceitos, obterGrafoTaxonomia } from "@/acoes/taxonomia";
import { PainelTaxonomia } from "@/componentes/taxonomia/painel-taxonomia";

export const metadata: Metadata = {
  title: "Taxonomia & Ontologia Semântica | Memória Reflexiva",
  description: "Vocabulário controlado, conceitos canônicos e rede ontológica do autor.",
};

export const dynamic = "force-dynamic";

export default async function PaginaTaxonomia() {
  const [conceitos, arestas] = await Promise.all([
    obterConceitos(),
    obterGrafoTaxonomia(),
  ]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho Editorial */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>Ontologia & Vocabulário Controlado</span>
          </div>
          <h1 className="font-serif text-3xl font-medium text-neutral-100">
            Taxonomia Semântica
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Mapeamento rigoroso das ideias, domínios axiológicos, metodológicos e narrativos do autor,
            garantindo que cada reflexão seja fiel aos conceitos originais.
          </p>
        </div>
      </div>

      {/* Painel Interativo de Gestão de Conceitos e Grafo */}
      <PainelTaxonomia
        conceitosIniciais={conceitos}
        arestasIniciais={arestas}
      />
    </div>
  );
}
