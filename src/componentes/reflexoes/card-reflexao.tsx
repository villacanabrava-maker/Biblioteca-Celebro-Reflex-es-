import Link from "next/link";
import { ArrowRight, ShieldCheck, AlertTriangle, Ban, FileText } from "lucide-react";
import type { ResumoReflexao } from "@/tipos/reflexoes";

interface Props {
  reflexao: ResumoReflexao;
}

const CORES_ESTADO: Record<string, string> = {
  criada: "bg-neutral-800/80 text-neutral-300 border-neutral-700",
  planejada: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  em_redacao: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  em_auditoria: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  concluida: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  arquivada: "bg-neutral-800/80 text-neutral-400 border-neutral-700",
};

const CORES_VEREDITO: Record<string, { bg: string; text: string; icone: any }> = {
  aprovado: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-300", icone: ShieldCheck },
  ressalvas: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-300", icone: AlertTriangle },
  rejeitado: { bg: "bg-rose-500/10 border-rose-500/30", text: "text-rose-300", icone: Ban },
};

export function CardReflexao({ reflexao }: Props) {
  const estiloEstado = CORES_ESTADO[reflexao.estado_entrada] || CORES_ESTADO.criada;
  const vereditoInfo = reflexao.ultimo_veredito_auditoria
    ? CORES_VEREDITO[reflexao.ultimo_veredito_auditoria]
    : null;

  const dataAtualizacao = new Date(reflexao.atualizado_em).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:bg-neutral-900/95 group space-y-4">
      <div className="space-y-3">
        {/* Badges Superiores Responsivas */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium font-mono uppercase tracking-wider bg-neutral-950 border border-neutral-800 text-amber-400">
              {reflexao.formato_desejado}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border capitalize ${estiloEstado}`}>
              {reflexao.estado_entrada.replace("_", " ")}
            </span>
          </div>

          <span className="text-[11px] text-neutral-400 font-mono">
            {dataAtualizacao}
          </span>
        </div>

        {/* Título & Tema */}
        <div>
          <h3 className="font-serif text-lg font-medium text-neutral-100 group-hover:text-amber-400 transition-colors line-clamp-1">
            {reflexao.ultimo_titulo_gerado || reflexao.titulo}
          </h3>
          <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
            {reflexao.tema_central}
          </p>
        </div>
      </div>

      {/* Rodapé: Auditoria & Botão de Ação */}
      <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
        {vereditoInfo && reflexao.ultima_pontuacao_auditoria !== null && reflexao.ultima_pontuacao_auditoria !== undefined ? (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${vereditoInfo.bg} ${vereditoInfo.text}`}>
            <vereditoInfo.icone className="w-3.5 h-3.5 shrink-0" />
            <span className="capitalize font-mono text-[11px]">
              {reflexao.ultimo_veredito_auditoria}: {Math.round(reflexao.ultima_pontuacao_auditoria * 100)}%
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>
              {reflexao.total_versoes > 0 ? `${reflexao.total_versoes} versão(ões)` : "Sem versões"}
            </span>
          </div>
        )}

        <Link
          href={`/reflexoes/${reflexao.entrada_id}`}
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium group/link transition-colors focus:outline-none focus:ring-1 focus:ring-amber-400/50 rounded-md px-1.5 py-0.5"
        >
          <span>Abrir Estúdio</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
