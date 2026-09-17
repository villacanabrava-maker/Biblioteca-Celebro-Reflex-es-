import { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { obterResumoReflexoes } from "@/acoes/reflexoes";
import { ListaReflexoes } from "@/componentes/reflexoes/lista-reflexoes";

export const metadata: Metadata = {
  title: "Estúdio de Reflexões | Memória Reflexiva",
  description:
    "Geração de novas reflexões com arquitetura prévia de raciocínio, voz autoral e auditoria crítica independente.",
};

export const dynamic = "force-dynamic";

export default async function PaginaReflexoes() {
  const reflexoes = await obterResumoReflexoes();

  return (
    <div className="space-y-6">
      {/* Cabeçalho Editorial */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Ateliê Criativo & Epistêmico</span>
          </div>
          <h1 className="font-serif text-3xl font-medium text-neutral-100">
            Estúdio de Reflexões
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Produza novos ensaios e reflexões que pensam como você: com planejamento cognitivo prévio,
            respeito à taxonomia, proveniência estrita de fontes e auditoria crítica independente.
          </p>
        </div>
      </div>

      {/* Lista com Métricas, Filtros e Modal */}
      <ListaReflexoes reflexoesIniciais={reflexoes} />
    </div>
  );
}
