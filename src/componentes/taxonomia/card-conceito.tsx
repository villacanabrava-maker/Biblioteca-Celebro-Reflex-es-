import { Compass, Hash, Sparkles } from "lucide-react";
import type { ConceitoTaxonomico } from "@/tipos/taxonomia";

interface Props {
  conceito: ConceitoTaxonomico;
}

const CORES_DOMINIO: Record<string, string> = {
  intelectual: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  axiologico: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  reflexivo: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  narrativo: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  temporal: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  retorico: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  linguistico: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  estrutural: "border-neutral-500/30 bg-neutral-500/10 text-neutral-300",
  autoral: "border-amber-500/50 bg-amber-500/20 text-amber-200",
};

export function CardConceito({ conceito }: Props) {
  const estiloBadge = CORES_DOMINIO[conceito.dominio] || "border-neutral-700 bg-neutral-800 text-neutral-300";

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all hover:bg-neutral-900/90 hover:shadow-xl hover:shadow-black/40 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border capitalize ${estiloBadge}`}>
            {conceito.dominio}
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            {conceito.total_fragmentos > 0 ? `${conceito.total_fragmentos} ocorrências` : "Novo"}
          </span>
        </div>

        <h3 className="font-serif text-lg font-medium text-neutral-100 line-clamp-1">
          {conceito.termo_preferencial}
        </h3>

        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
          {conceito.definicao}
        </p>
      </div>

      {/* Sinônimos / Termos associados */}
      {conceito.termos_sinonimos && conceito.termos_sinonimos.length > 0 && (
        <div className="pt-3 border-t border-neutral-800/60">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono block mb-1.5">
            Sinônimos & Variações:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {conceito.termos_sinonimos.map((termo) => (
              <span
                key={termo.id}
                className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-400"
              >
                {termo.termo}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
