import Link from "next/link";
import { FileCheck2, BookOpen, Sparkles, Layers, ArrowRight, Clock, Search, ChevronRight } from "lucide-react";
import { obterListaDocumentosProcessados } from "@/acoes/processamento";
import { obterPerfilUsuarioAtual } from "@/infraestrutura/auth/usuario-atual";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Documentos Processados | Cérebro Autoral",
  description: "Auditoria e visualização completa de todos os materiais extraídos pelo pipeline de IA.",
};

export default async function DocumentosProcessadosPage() {
  const [documentos, perfil] = await Promise.all([
    obterListaDocumentosProcessados(),
    obterPerfilUsuarioAtual(),
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>Extração Documental Canônica</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Documentos Processados
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Representação computacional e materiais extraídos de cada obra do seu acervo.
          </p>
        </div>

        <Link
          href="/biblioteca"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all self-start sm:self-auto"
        >
          <BookOpen className="w-4 h-4" />
          <span>Ver Biblioteca</span>
        </Link>
      </div>

      {/* 2. Grid de Documentos Processados */}
      {documentos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto my-12">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <FileCheck2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Nenhum documento processado ainda</h3>
            <p className="text-xs text-slate-500 mt-1">
              Envie um livro ou PDF na Biblioteca e inicie o processamento com IA para visualizar os materiais extraídos.
            </p>
          </div>
          <Link
            href="/biblioteca"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/30 transition-all"
          >
            <span>Ir para a Biblioteca</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                    {doc.obra_tipo}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                    {doc.estado_publicacao}
                  </span>
                </div>

                {/* Título da Obra */}
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {doc.titulo_processado}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Por <span className="text-slate-700 font-medium">{doc.autor_nome}</span> &middot;{" "}
                    {doc.autoria === "autoral" ? "Núcleo Autoral" : "Referência Externa"}
                  </p>
                </div>

                {/* Métricas Extraídas */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-mono block">Seções</span>
                    <span className="text-xs font-bold text-slate-800">{doc.total_secoes}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-mono block">Fragmentos</span>
                    <span className="text-xs font-bold text-slate-800">{doc.total_fragmentos}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-mono block">Palavras</span>
                    <span className="text-xs font-bold text-slate-800">
                      {doc.total_palavras > 1000 ? `${Math.round(doc.total_palavras / 1000)}k` : doc.total_palavras}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Abertura */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(doc.criado_em).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                <Link
                  href={`/documentos-processados/${doc.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 group/link transition-colors"
                >
                  <span>Inspecionar Extração</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
