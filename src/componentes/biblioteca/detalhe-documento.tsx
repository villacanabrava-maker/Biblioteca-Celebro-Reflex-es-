"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  BookOpen,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  Download,
  Edit3,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Layers,
  HardDrive,
  Hash,
  Tag,
  User,
  Loader2,
  Send,
  Cpu,
  Zap,
  X,
  ChevronRight,
} from "lucide-react";
import type { ObraDetalhada } from "@/tipos/biblioteca";
import {
  obterUrlDownloadOriginal,
  excluirObra,
  salvarAnotacoesObra,
} from "@/acoes/biblioteca";
import { iniciarProcessamentoObra } from "@/acoes/processamento";

interface Props {
  obra: ObraDetalhada;
  fragmentos: Array<{
    id: string;
    indice_sequencial: number;
    conteudo_texto: string;
    total_tokens: number;
  }>;
}

export function DetalheDocumentoComponente({ obra, fragmentos }: Props) {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<"resumo" | "conteudo" | "processar" | "anotacoes">("resumo");
  const [copiado, setCopiado] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erroProcessamento, setErroProcessamento] = useState<string | null>(null);
  const [processamentoConcluido, setProcessamentoConcluido] = useState(false);
  const [buscaFragmento, setBuscaFragmento] = useState("");

  // Anotações do autor
  const metadados = (obra.metadados as Record<string, any>) || {};
  const [anotacoes, setAnotacoes] = useState<string>(metadados.anotacoes_autor || "");
  const [salvandoAnotacoes, setSalvandoAnotacoes] = useState(false);
  const [anotacoesSalvas, setAnotacoesSalvas] = useState(false);

  const estaProcessado = obra.estado_processamento === "processado" || processamentoConcluido;
  const estaPendente = !estaProcessado && obra.estado_processamento !== "em_processamento";

  // Download do arquivo
  async function lidarDownload() {
    if (!obra.arquivo_caminho) return;
    try {
      setBaixando(true);
      const url = await obterUrlDownloadOriginal(obra.arquivo_caminho);
      window.open(url, "_blank");
    } catch (err) {
      alert("Erro ao gerar link para download.");
    } finally {
      setBaixando(false);
    }
  }

  // Iniciar processamento com IA
  async function lidarProcessar() {
    const versaoId = obra.versao_id || obra.id;
    if (!versaoId) {
      setErroProcessamento("ID da versão não encontrado. Tente novamente.");
      return;
    }
    try {
      setProcessando(true);
      setErroProcessamento(null);
      const resultado = await iniciarProcessamentoObra(versaoId);
      if (resultado && !resultado.sucesso) {
        setErroProcessamento((resultado as any).erro || "Erro ao processar. Tente novamente.");
        return;
      }
      setProcessamentoConcluido(true);
      setAbaAtiva("conteudo");
    } catch (err: any) {
      setErroProcessamento(err.message || "Erro ao processar. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  // Excluir obra
  async function lidarExcluir() {
    if (!confirm(`Tem certeza que deseja excluir "${obra.titulo}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      setExcluindo(true);
      await excluirObra(obra.id);
      router.push("/biblioteca");
    } catch (err: any) {
      alert(`Falha ao excluir: ${err.message}`);
      setExcluindo(false);
    }
  }

  // Copiar Hash SHA-256
  function copiarHash() {
    if (!obra.hash_sha256) return;
    navigator.clipboard.writeText(obra.hash_sha256);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  // Salvar anotações
  async function lidarSalvarAnotacoes() {
    try {
      setSalvandoAnotacoes(true);
      await salvarAnotacoesObra(obra.id, anotacoes);
      setAnotacoesSalvas(true);
      setTimeout(() => setAnotacoesSalvas(false), 2500);
    } catch (err: any) {
      alert(`Erro ao salvar anotações: ${err.message}`);
    } finally {
      setSalvandoAnotacoes(false);
    }
  }

  // Busca de fragmentos
  const fragmentosFiltrados = useMemo(() => {
    if (!buscaFragmento.trim()) return fragmentos;
    const termo = buscaFragmento.toLowerCase();
    return fragmentos.filter((f) => f.conteudo_texto.toLowerCase().includes(termo));
  }, [fragmentos, buscaFragmento]);

  // Capa estilizada com gradiente
  const coresCapa = [
    "from-amber-700 to-amber-900",
    "from-blue-700 to-indigo-950",
    "from-emerald-700 to-teal-950",
    "from-slate-700 to-slate-900",
  ];
  const indiceCor =
    Math.abs(obra.titulo.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) %
    coresCapa.length;
  const gradienteCapa = coresCapa[indiceCor];

  const paginasEstimadas =
    obra.total_paginas || Math.max(1, Math.round((obra.arquivo_tamanho_bytes || 50000) / 2500));
  const tamanhoMB = obra.arquivo_tamanho_bytes
    ? `${(obra.arquivo_tamanho_bytes / (1024 * 1024)).toFixed(2)} MB`
    : "—";

  const tagsPadrao = [
    { nome: "Esperança", cor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { nome: "Família", cor: "bg-amber-50 text-amber-700 border-amber-200" },
    { nome: "Amadurecimento", cor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { nome: "Propósito", cor: "bg-purple-50 text-purple-700 border-purple-200" },
    { nome: "Natureza", cor: "bg-teal-50 text-teal-700 border-teal-200" },
    { nome: "Autoconhecimento", cor: "bg-sky-50 text-sky-700 border-sky-200" },
  ];

  // Abas — se pendente, mostra "Processar" em destaque
  const abas = [
    { id: "resumo", rotulo: "Resumo" },
    { id: "conteudo", rotulo: `Conteúdo${fragmentos.length > 0 ? ` (${fragmentos.length})` : ""}` },
    ...(!estaProcessado ? [{ id: "processar", rotulo: "⚡ Processar com IA", destaque: true }] : []),
    { id: "anotacoes", rotulo: "Anotações" },
  ] as { id: string; rotulo: string; destaque?: boolean }[];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200 pb-24">
      {/* Topo / Voltar */}
      <div className="flex items-center justify-between">
        <Link
          href="/biblioteca"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Biblioteca</span>
        </Link>

        <button
          onClick={lidarExcluir}
          disabled={excluindo}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {excluindo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Excluir
        </button>
      </div>

      {/* Cartão Superior com Capa e Detalhes */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start gap-6">
        {/* Capa */}
        <div
          className={`w-28 h-40 sm:w-36 sm:h-52 rounded-2xl bg-gradient-to-br ${gradienteCapa} p-4 flex flex-col justify-between text-white shadow-md shrink-0 relative overflow-hidden`}
        >
          <div className="absolute inset-y-0 left-0 w-2.5 bg-black/20" />
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
            {obra.tipo}
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-serif font-bold leading-tight line-clamp-4">
              {obra.titulo}
            </h2>
            <p className="text-[11px] opacity-80 mt-1 truncate">{obra.autor_nome}</p>
          </div>
          <div className="flex items-center justify-between text-[9px] opacity-75">
            <span>{obra.ano_publicacao || "2026"}</span>
            <BookOpen className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Informações Centrais */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
              {obra.tipo}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {obra.natureza === "autoral" ? "Núcleo Autoral" : "Influência Externa"}
            </span>
            {estaProcessado ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Processado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Pendente de análise
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            {obra.titulo}
          </h1>

          {obra.subtitulo && (
            <p className="text-xs sm:text-sm text-slate-500 italic">{obra.subtitulo}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {obra.autor_nome}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {obra.ano_publicacao || "2026"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {paginasEstimadas} páginas
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              {tamanhoMB}
            </span>
          </div>

          {/* Atalho de Processamento no topo (se pendente) */}
          {estaPendente && !processamentoConcluido && (
            <div className="pt-1">
              <button
                onClick={lidarProcessar}
                disabled={processando}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-60"
              >
                {processando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Processando...</>
                ) : (
                  <><Zap className="w-4 h-4" />Processar com IA agora</>
                )}
              </button>
            </div>
          )}

          {processamentoConcluido && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Processamento concluído com sucesso!
              </span>
            </div>
          )}

          {obra.descricao && (
            <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100 italic">
              &ldquo;{obra.descricao}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Abas de Navegação */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {abas.map((aba) => {
          const ativo = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                ativo
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : aba.destaque
                  ? "text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>

      {/* Aba Resumo */}
      {abaAtiva === "resumo" && (
        <div className="space-y-5">
          {/* Resumo da IA */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Resumo gerado pela IA</h3>
              </div>
              <button
                type="button"
                onClick={() => alert("Solicitação de nova síntese enviada à IA.")}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerar
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {obra.descricao ||
                "Este livro aborda temas como esperança, família, propósito e amadurecimento, a partir da jornada de quem enfrenta desafios e descobre o valor das pequenas coisas. A obra convida o leitor a refletir sobre suas próprias escolhas e o que realmente importa na vida."}
            </p>
          </div>

          {/* Metadados */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Metadados do documento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Autor</span>
                  <span className="font-semibold text-slate-800">{obra.autor_nome}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Categoria</span>
                  <span className="font-semibold text-slate-800 capitalize">{obra.tipo} autoral</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Data de upload</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(obra.criado_em).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <HardDrive className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Tamanho</span>
                  <span className="font-semibold text-slate-800">{tamanhoMB}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 col-span-full">
                <Hash className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-slate-400 block text-[11px]">Hash SHA-256 (Verificação)</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[11px] text-slate-600 truncate block">
                      {obra.hash_sha256 ? `${obra.hash_sha256.substring(0, 24)}...` : "Não calculado"}
                    </span>
                    {obra.hash_sha256 && (
                      <button
                        onClick={copiarHash}
                        className="text-blue-600 hover:text-blue-700 p-0.5 rounded"
                        title="Copiar Hash SHA-256"
                      >
                        {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Temas Relacionados */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Temas relacionados</h3>
            <div className="flex flex-wrap gap-2">
              {tagsPadrao.map((tag) => (
                <span
                  key={tag.nome}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${tag.cor}`}
                >
                  {tag.nome}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Aba Conteúdo */}
      {abaAtiva === "conteudo" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">
              Conteúdo Extraído &mdash; {fragmentos.length} fragmentos
            </h3>
            {fragmentos.length > 0 && (
              <div className="relative max-w-xs w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={buscaFragmento}
                  onChange={(e) => setBuscaFragmento(e.target.value)}
                  placeholder="Buscar nos fragmentos..."
                  className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                {buscaFragmento && (
                  <button onClick={() => setBuscaFragmento("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {buscaFragmento && (
            <p className="text-xs text-slate-500">
              {fragmentosFiltrados.length} de {fragmentos.length} fragmentos correspondem à busca
            </p>
          )}

          {fragmentos.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Cpu className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">
                Nenhum fragmento extraído. Processe este documento com IA para segmentá-lo.
              </p>
              {estaPendente && (
                <button
                  onClick={() => setAbaAtiva("processar" as any)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Ir para Processamento
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {fragmentosFiltrados.map((f) => {
                const texto = f.conteudo_texto;
                const termoBusca = buscaFragmento.toLowerCase();
                const idx = termoBusca ? texto.toLowerCase().indexOf(termoBusca) : -1;

                return (
                  <div
                    key={f.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Fragmento #{f.indice_sequencial + 1}</span>
                      <span>{f.total_tokens} tokens</span>
                    </div>
                    <p className="leading-relaxed font-serif whitespace-pre-wrap">
                      {idx >= 0 ? (
                        <>
                          {texto.slice(0, idx)}
                          <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">
                            {texto.slice(idx, idx + termoBusca.length)}
                          </mark>
                          {texto.slice(idx + termoBusca.length)}
                        </>
                      ) : (
                        texto
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Aba Processar com IA */}
      {abaAtiva === "processar" && (
        <div className="bg-white border border-amber-200 rounded-3xl p-8 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center mx-auto">
            <Cpu className="w-8 h-8 text-blue-600" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Processar com Inteligência Artificial</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              O sistema irá extrair o texto, segmentar em fragmentos semânticos, gerar embeddings vetoriais e indexar o conteúdo no seu Cérebro Autoral.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-xs text-center">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <p className="font-semibold text-slate-700">Extração</p>
              <p className="text-slate-400">Texto puro</p>
            </div>
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto">
                <Layers className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="font-semibold text-slate-700">Chunking</p>
              <p className="text-slate-400">Semântico</p>
            </div>
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="font-semibold text-slate-700">Vetores</p>
              <p className="text-slate-400">1536 dim</p>
            </div>
          </div>

          {erroProcessamento && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 text-left">
              {erroProcessamento}
            </div>
          )}

          {processamentoConcluido ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                Processamento concluído com sucesso!
              </div>
              <div>
                <button
                  onClick={() => setAbaAtiva("conteudo")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  Ver fragmentos gerados <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={lidarProcessar}
              disabled={processando}
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/25 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando... isso pode levar alguns segundos
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Iniciar processamento com IA
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Aba Anotações */}
      {abaAtiva === "anotacoes" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Anotações do Autor</h3>
              <p className="text-xs text-slate-500">
                Suas impressões pessoais, notas marginais e ideias sobre esta obra.
              </p>
            </div>
            {anotacoesSalvas && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Salvo!
              </span>
            )}
          </div>

          <textarea
            value={anotacoes}
            onChange={(e) => setAnotacoes(e.target.value)}
            placeholder="Escreva aqui suas reflexões, anotações de estudo ou comentários sobre este livro..."
            rows={8}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-sans"
          />

          <div className="flex justify-end">
            <button
              onClick={lidarSalvarAnotacoes}
              disabled={salvandoAnotacoes}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {salvandoAnotacoes ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Salvar Anotações</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra Flutuante de Ações na Base */}
      <div className="fixed bottom-20 md:bottom-6 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-3 flex items-center gap-3 max-w-lg w-full backdrop-blur-md">
          <button
            onClick={lidarDownload}
            disabled={baixando || !obra.arquivo_caminho}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            {baixando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Baixar Original
          </button>

          {estaPendente && (
            <button
              onClick={lidarProcessar}
              disabled={processando}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-60"
            >
              {processando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Processar IA
            </button>
          )}

          <button
            onClick={() => setAbaAtiva("anotacoes")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <Edit3 className="w-4 h-4" />
            Anotar
          </button>
        </div>
      </div>
    </div>
  );
}
