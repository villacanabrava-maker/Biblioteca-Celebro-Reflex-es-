"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ArrowLeft, FileText, UploadCloud, Globe, Brain, Loader2, AlertCircle, Check } from "lucide-react";
import { iniciarEsteiraReflexao, gerarPlanoParaEntrada, acionarRedacaoReflexao } from "@/acoes/reflexoes";
import type {
  FormatoReflexao,
  TipoOrigemExterna,
  ConflitoDetectado,
  PlanoReflexao,
} from "@/tipos/reflexoes";

interface MemoriaItem {
  id: string;
  titulo: string;
  origem: string;
  trecho: string;
  selecionada: boolean;
}

export function WizardCriarReflexao() {
  const router = useRouter();
  const [etapaAtual, setEtapaAtual] = useState<number>(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Identificadores da esteira persistidos no backend
  const [entradaId, setEntradaId] = useState<string | null>(null);
  const [planoId, setPlanoId] = useState<string | null>(null);

  // Etapa 1: Reflexão Externa
  const [modoExterno, setModoExterno] = useState<"colar" | "arquivo" | "link">("colar");
  const [textoExterno, setTextoExterno] = useState("");
  const [tipoOrigem, setTipoOrigem] = useState<TipoOrigemExterna>("texto");

  // Etapa 2: Comentário Pessoal
  const [comentarioPessoal, setComentarioPessoal] = useState("");
  const [titulo, setTitulo] = useState("");
  const [temaCentral, setTemaCentral] = useState("");

  // Etapa 3: Memórias Relacionadas
  const [memorias, setMemorias] = useState<MemoriaItem[]>([]);

  // Etapa 4: Conflitos e Tensões
  const [conflitos, setConflitos] = useState<ConflitoDetectado[]>([]);

  // Etapa 5: Plano da Reflexão
  const formato: FormatoReflexao = "ensaio";
  const [planoGerado, setPlanoGerado] = useState<PlanoReflexao | null>(null);

  // Etapa 6 & 7: Texto Gerado e Revisão Final

  const etapas = [
    { num: 1, rotulo: "Externa" },
    { num: 2, rotulo: "Comentário" },
    { num: 3, rotulo: "Memórias" },
    { num: 4, rotulo: "Conflitos" },
    { num: 5, rotulo: "Plano" },
    { num: 6, rotulo: "Rascunho & Auditoria" },
    { num: 7, rotulo: "Incorporação" },
  ];

  function alternarMemoria(id: string) {
    setMemorias((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selecionada: !m.selecionada } : m))
    );
  }

  // Avança da Etapa 2 para a 3 disparando a análise e detecção de conflitos no backend
  async function avancarParaMemorias() {
    if (!textoExterno.trim()) {
      setErro("Por favor, insira o texto ou estímulo externo a ser analisado.");
      return;
    }
    if (!comentarioPessoal.trim()) {
      setErro("Por favor, informe seu comentário atual sobre o tema.");
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      const res = await iniciarEsteiraReflexao({
        reflexaoExterna: textoExterno,
        tipoOrigemExterna: tipoOrigem,
        comentarioAutor: comentarioPessoal,
        titulo: titulo.trim() || undefined,
        temaCentral: temaCentral.trim() || undefined,
        formatoDesejado: formato,
      });

      setEntradaId(res.entradaId);
      setConflitos(res.conflitos || []);

      // Mapear memórias retornadas do dossiê
      if (res.dossie?.fragmentos_selecionados?.length) {
        setMemorias(
          res.dossie.fragmentos_selecionados.map((f: any) => ({
            id: f.id,
            titulo: f.obra_titulo,
            origem: "Acervo Autoral",
            trecho: f.conteudo,
            selecionada: true,
          }))
        );
      } else {
        setMemorias([
          {
            id: "mem-padrao-1",
            titulo: "Princípio de Maturação e Tempo",
            origem: "Cânone Autoral",
            trecho: "O pensamento verdadeiro não se apressa; ele matura nas tensões da paciência ativa.",
            selecionada: true,
          },
        ]);
      }

      setEtapaAtual(3);
    } catch (err: any) {
      console.error("Erro ao iniciar esteira:", err);
      setErro(err.message || "Falha ao analisar estímulo e memórias.");
    } finally {
      setCarregando(false);
    }
  }

  // Avança da Etapa 4 para a 5 gerando o Plano Metodológico estruturado
  async function avancarParaPlano() {
    if (!entradaId) {
      setEtapaAtual(5);
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      const res = await gerarPlanoParaEntrada(entradaId);
      setPlanoId(res.plano.id);
      setPlanoGerado(res.plano as any);
      setEtapaAtual(5);
    } catch (err: any) {
      console.error("Erro ao gerar plano:", err);
      setErro(err.message || "Falha ao conceber o plano cognitivo.");
      setEtapaAtual(5);
    } finally {
      setCarregando(false);
    }
  }

  // Aprova o plano e dispara a Redação Autoral e Auditoria Crítica Independente
  async function aprovarPlanoERedigir() {
    if (!entradaId || !planoId) {
      setErro("Plano ou entrada não localizados para redação.");
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      const res = await acionarRedacaoReflexao({
        entradaId,
        planoId,
      });

      // Redirecionar para o estúdio completo da reflexão gerada onde o autor tem toda a esteira
      router.push(`/reflexoes/${entradaId}`);
    } catch (err: any) {
      console.error("Erro ao redigir reflexão:", err);
      setErro(err.message || "Falha ao redigir e auditar a reflexão.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Topo com Botão Voltar e Título */}
      <div className="flex items-center justify-between">
        <Link
          href="/reflexoes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Minhas Reflexões</span>
        </Link>
        <span className="text-[11px] text-slate-400 font-medium">
          Etapa {etapaAtual} de {etapas.length}
        </span>
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          Esteira Metodológica de Reflexão
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Do estímulo externo à nova reflexão autoral chancelada e incorporada à memória.
        </p>
      </div>

      {/* Esteira Visual das Etapas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-4 right-4 top-4 h-0.5 bg-slate-100 -z-0" />
          {etapas.map((et) => {
            const ativa = et.num === etapaAtual;
            const concluida = et.num < etapaAtual;

            return (
              <button
                key={et.num}
                type="button"
                onClick={() => et.num <= etapaAtual && setEtapaAtual(et.num)}
                disabled={et.num > etapaAtual}
                className="flex flex-col items-center gap-1.5 z-10 group disabled:cursor-not-allowed"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    ativa
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-50"
                      : concluida
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {concluida ? <Check className="w-4 h-4 stroke-[2.5px]" /> : et.num}
                </div>
                <span
                  className={`text-[10px] font-semibold whitespace-nowrap hidden sm:block ${
                    ativa
                      ? "text-blue-600 font-bold"
                      : concluida
                      ? "text-emerald-700"
                      : "text-slate-400"
                  }`}
                >
                  {et.rotulo}
                </span>
              </button>
            );
          })}
        </div>

        {/* Barra de progresso linear */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-medium">Progresso da reflexão</span>
            <span className="font-bold text-blue-600">
              {Math.round(((etapaAtual - 1) / (etapas.length - 1)) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.round(((etapaAtual - 1) / (etapas.length - 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {erro && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Etapa 1: Reflexão Externa */}
      {etapaAtual === 1 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in duration-150">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              1. Reflexão Externa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Insira o conteúdo externo que deseja analisar (artigo, texto, mensagem, transcrição ou citação).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setModoExterno("colar");
                setTipoOrigem("texto");
              }}
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                modoExterno === "colar"
                  ? "bg-blue-50 text-blue-700 border-blue-200 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Colar texto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModoExterno("arquivo");
                setTipoOrigem("documento");
              }}
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                modoExterno === "arquivo"
                  ? "bg-blue-50 text-blue-700 border-blue-200 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Documento</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModoExterno("link");
                setTipoOrigem("artigo");
              }}
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                modoExterno === "link"
                  ? "bg-blue-50 text-blue-700 border-blue-200 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Artigo / Link</span>
            </button>
          </div>

          <div>
            <textarea
              value={textoExterno}
              onChange={(e) => setTextoExterno(e.target.value)}
              placeholder="Cole aqui o texto, artigo, mensagem ou trecho recebido que você deseja examinar à luz do seu método autoral..."
              rows={6}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-sans"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>Tratado com isolamento de dados para análise dialética</span>
              <span>{textoExterno.length} caracteres</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (!textoExterno.trim()) {
                  setTextoExterno(
                    "A aceleração desenfreada e a busca por resultados instantâneos substituem a reflexão profunda pela resposta automática."
                  );
                }
                setEtapaAtual(2);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
            >
              <span>Avançar para Comentário</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Etapa 2: Comentário do Autor */}
      {etapaAtual === 2 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in duration-150">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              2. Seu Comentário Atual
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Informe o que você pensa atualmente sobre aquilo. Você pode escrever, articular divergências ou registrar impressões iniciais.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título Proposto (Opcional)
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Sobre a maturidade da espera frente ao imediatismo"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tema Central
            </label>
            <input
              type="text"
              value={temaCentral}
              onChange={(e) => setTemaCentral(e.target.value)}
              placeholder="Ex: Paciência, Tempo, Maturidade, Pensamento Crítico"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Seu Pensamento e Posicionamento Pessoal
            </label>
            <textarea
              value={comentarioPessoal}
              onChange={(e) => setComentarioPessoal(e.target.value)}
              placeholder="Escreva sua visão autêntica: onde você discorda, o que falta ser dito, qual tensão merece ser aprofundada..."
              rows={5}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-sans"
            />
          </div>

          <div className="pt-2 flex justify-between">
            <button
              type="button"
              onClick={() => setEtapaAtual(1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <button
              type="button"
              disabled={carregando}
              onClick={avancarParaMemorias}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consultando Cérebro Autoral...</span>
                </>
              ) : (
                <>
                  <span>Consultar Cérebro & Dossiê</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Etapa 3: Memórias e Dossiê */}
      {etapaAtual === 3 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in duration-150">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              3. Documentos e Memórias Processadas Relevantes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              O Cérebro Autoral buscou em seus livros e textos o conhecimento relacionado. Selecione o que fará parte do dossiê:
            </p>
          </div>

          <div className="space-y-3">
            {memorias.map((mem) => (
              <div
                key={mem.id}
                onClick={() => alternarMemoria(mem.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  mem.selecionada
                    ? "bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/10"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {mem.origem}
                    </span>
                    <h3 className="text-xs font-bold text-slate-800">{mem.titulo}</h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      mem.selecionada
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {mem.selecionada ? "✓ Incluída no Dossiê" : "Descartar"}
                  </span>
                </div>
                <p className="text-xs font-serif italic text-slate-600 mt-2 leading-relaxed">
                  &ldquo;{mem.trecho}&rdquo;
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-between">
            <button
              type="button"
              onClick={() => setEtapaAtual(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <button
              type="button"
              onClick={() => setEtapaAtual(4)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
            >
              <span>Ver Conflitos & Tensões</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Etapa 4: Conflitos e Tensões */}
      {etapaAtual === 4 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in duration-150">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              4. Tensões Dialéticas e Oportunidades Cognitivas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              O sistema combinou estímulo externo, seu pensamento presente e a base histórica autoral:
            </p>
          </div>

          <div className="space-y-3">
            {conflitos.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1.5 text-xs text-amber-900">
                <span className="font-bold">Atrito Dialético Inicial:</span>
                <p className="text-slate-700">
                  O estímulo externo propõe conclusões superficiais imediatas, gerando oportunidade para fundamentar a posição autoral com densidade e perspectiva histórica.
                </p>
              </div>
            ) : (
              conflitos.map((c, i) => (
                <div key={i} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider">
                      {c.tipo}
                    </span>
                  </div>
                  <p className="text-slate-800 font-semibold">{c.descricao}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Estímulo Externo:</span>
                      <span className="text-slate-700">{c.posicao_externa}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] font-bold text-blue-600 block uppercase">Posição Autoral:</span>
                      <span className="text-slate-700">{c.posicao_autoral}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 flex justify-between">
            <button
              type="button"
              onClick={() => setEtapaAtual(3)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <button
              type="button"
              disabled={carregando}
              onClick={avancarParaPlano}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando Plano Metodológico...</span>
                </>
              ) : (
                <>
                  <span>Conceber Plano Metodológico</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Etapa 5: Plano da Reflexão & Aprovação */}
      {etapaAtual === 5 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                5. Plano Metodológico da Reflexão
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Arquitetura de raciocínio concebida pelo Cérebro Autoral antes de redigir.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Formato: {formato}
            </span>
          </div>

          {planoGerado ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Tese Central:</span>
                <p className="text-sm font-serif font-bold text-slate-900 leading-relaxed">
                  “{planoGerado.tese_central}”
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase">
                  Movimentos Dialéticos (Grafo de 9 nós):
                </span>
                {planoGerado.movimentos_argumentativos.map((mov, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {mov.ordem}
                    </span>
                    <div>
                      <strong className="text-slate-900">{mov.tipo}:</strong>{" "}
                      <span className="text-slate-600">{mov.descricao}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <Brain className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                Pronto para conceber a tese central e os movimentos argumentativos com base no Cérebro Autoral.
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-between">
            <button
              type="button"
              onClick={() => setEtapaAtual(4)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <button
              type="button"
              disabled={carregando}
              onClick={aprovarPlanoERedigir}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redigindo com IA e Auditando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Aprovar Plano e Redigir Reflexão</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
