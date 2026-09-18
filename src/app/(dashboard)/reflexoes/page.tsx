import { Metadata } from "next";

import { obterResumoReflexoes } from "@/acoes/reflexoes";
import { ListaReflexoesModerna } from "@/componentes/reflexoes/lista-reflexoes-moderna";

export const metadata: Metadata = {
  title: "Minhas Reflexões | Memória Reflexiva",
  description:
    "Histórico e organização de todas as reflexões, rascunhos, revisões e textos incorporados à memória autoral.",
};

export const dynamic = "force-dynamic";

export default async function PaginaReflexoes() {
  const reflexoes = await obterResumoReflexoes();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Minhas Reflexões
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Histórico e organização de todas as suas reflexões conectadas ao seu cérebro autoral.
        </p>
      </div>

      {/* Lista com Abas de Status, Busca e Cards */}
      <ListaReflexoesModerna reflexoesIniciais={reflexoes} />
    </div>
  );
}
