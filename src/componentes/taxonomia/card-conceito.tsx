import type { ConceitoTaxonomico } from "@/tipos/taxonomia";

interface Props {
  conceito: ConceitoTaxonomico;
}

const CORES_DOMINIO: Record<string, string> = {
  intelectual: "border-blue-200 bg-blue-50 text-blue-700",
  axiologico: "border-amber-200 bg-amber-50 text-amber-700",
  reflexivo: "border-violet-200 bg-violet-50 text-violet-700",
  narrativo: "border-emerald-200 bg-emerald-50 text-emerald-700",
  temporal: "border-orange-200 bg-orange-50 text-orange-700",
  retorico: "border-rose-200 bg-rose-50 text-rose-700",
  linguistico: "border-cyan-200 bg-cyan-50 text-cyan-700",
  estrutural: "border-slate-200 bg-slate-100 text-slate-700",
  autoral: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

export function CardConceito({ conceito }: Props) {
  const estiloBadge =
    CORES_DOMINIO[conceito.dominio] || "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <article className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${estiloBadge}`}
          >
            {conceito.dominio}
          </span>
          <span className="text-xs text-slate-500">
            {conceito.total_fragmentos > 0
              ? `${conceito.total_fragmentos} ocorrências`
              : "Sem ocorrências"}
          </span>
        </div>

        <h3 className="line-clamp-1 font-serif text-lg font-bold text-slate-900">
          {conceito.termo_preferencial}
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
          {conceito.definicao}
        </p>
      </div>

      {conceito.termos_sinonimos && conceito.termos_sinonimos.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">
            Sinônimos e variações
          </span>
          <div className="flex flex-wrap gap-1.5">
            {conceito.termos_sinonimos.map((termo) => (
              <span
                key={termo.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
              >
                {termo.termo}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
