import { Metadata } from "next";
import { Brain } from "lucide-react";
import {
  obterDimensoesCerebro,
  obterCaracteristicasDimensao,
  obterRegrasCerebro,
  obterResumoCerebro,
} from "@/acoes/cerebro";
import { PainelCerebro } from "@/componentes/cerebro/painel-cerebro";

export const metadata: Metadata = {
  title: "Cérebro Autoral | Memória Reflexiva",
  description:
    "Modelagem computacional do método, teses, estilo e regras prescritivas e proscritivas do autor.",
};

export const dynamic = "force-dynamic";

export default async function PaginaCerebro() {
  const [resumo, dimensoes, caracteristicas, regras] = await Promise.all([
    obterResumoCerebro(),
    obterDimensoesCerebro(),
    obterCaracteristicasDimensao(),
    obterRegrasCerebro(),
  ]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho Editorial */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-wider mb-1">
            <Brain className="w-4 h-4" />
            <span>Sistema Cognitivo Autoral</span>
          </div>
          <h1 className="font-serif text-3xl font-medium text-neutral-100">
            Cérebro Autoral
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            A reconstrução explícita e auditável de como o autor pensa, argumenta, associa ideias e
            expressa sua voz através dos 3 Planos Fundamentais (Conteúdo, Método e Expressão).
          </p>
        </div>
      </div>

      {/* Painel com Resumo, 18 Dimensões e Regras */}
      <PainelCerebro
        resumo={resumo}
        dimensoes={dimensoes}
        caracteristicas={caracteristicas}
        regras={regras}
      />
    </div>
  );
}
