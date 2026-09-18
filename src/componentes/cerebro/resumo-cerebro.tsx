import { Brain, ShieldCheck, Ban, Sparkles } from "lucide-react";
import type { ResumoCerebro } from "@/tipos/cerebro";

interface Props {
  resumo: ResumoCerebro;
}

export function ResumoCerebroComponente({ resumo }: Props) {
  const confiancaFormatada = Math.round((resumo.confianca_media_geral || 0) * 100);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Características Ativas */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider">Características</span>
          <Brain className="w-5 h-5 text-amber-400" />
        </div>
        <div className="text-3xl font-serif text-neutral-100">
          {resumo.total_caracteristicas}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-2 font-mono">
          <span className="text-amber-300 font-medium">
            {resumo.total_nucleo_autoral} autoria pura
          </span>
          {resumo.total_influencias_externas > 0 && (
            <span>• {resumo.total_influencias_externas} influências</span>
          )}
        </div>
      </div>

      {/* Regras Prescritivas */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider">Regras Prescritivas</span>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-3xl font-serif text-neutral-100">
          {resumo.total_regras}
        </div>
        <div className="text-[11px] text-neutral-500 mt-2">
          Diretrizes ativas de raciocínio e escrita
        </div>
      </div>

      {/* Anti-regras (Proscritivas) */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/40 transition-colors">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider">Anti-regras</span>
          <Ban className="w-5 h-5 text-rose-400" />
        </div>
        <div className="text-3xl font-serif text-neutral-100">
          {resumo.total_anti_regras}
        </div>
        <div className="text-[11px] text-rose-400/80 mt-2 font-mono">
          Vetos e proscrições absolutas
        </div>
      </div>

      {/* Confiança Média */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider">Confiança Média</span>
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>
        <div className="text-3xl font-serif text-neutral-100">
          {confiancaFormatada}%
        </div>
        <div className="text-[11px] text-neutral-500 mt-2">
          Baseada no rigor das evidências
        </div>
      </div>
    </div>
  );
}
