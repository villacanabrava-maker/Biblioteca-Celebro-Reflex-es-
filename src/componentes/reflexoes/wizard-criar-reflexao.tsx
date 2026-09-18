"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ArrowRight, ArrowLeft, FileText, UploadCloud, Globe, Brain, Loader2, AlertCircle, Check, BookOpen, Mic } from "lucide-react";
import {
  iniciarEsteiraReflexao,
  atualizarDossieReflexao,
  gerarPlanoParaEntrada,
  acionarRedacaoReflexao,
  extrairFonteDocumentoTemporaria,
  extrairFonteLinkTemporaria,
  prepararFonteBibliotecaTemporaria,
  transcreverFonteAudioTemporaria,
  removerFontesTemporariasReflexao,
} from "@/acoes/reflexoes";
import { GravadorAudio } from "@/componentes/comum/gravador-audio";
import {
  calcularHashSha256,
  iniciarUploadTus,
  obterTokenAutenticadoBrowser,
} from "@/infraestrutura/storage/cliente-tus";
import type {
  FormatoReflexao,
  TipoOrigemExterna,
  ConflitoDetectado,
  PlanoReflexao,
  FonteReflexaoPreparada,
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
  const searchParams = useSearchParams();
  const fonteIdInicial = searchParams.get("fonteId");
  const fonteBibliotecaCarregadaRef = useRef<string | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<number>(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Identificadores da esteira persistidos no backend
  const [entradaId, setEntradaId] = useState<string | null>(null);
  const [planoId, setPlanoId] = useState<string | null>(null);

  // Etapa 1: Reflexão Externa
  const [modoExterno, setModoExterno] = useState<"colar" | "arquivo" | "link" | "audio" | "biblioteca">("colar");
  const [textoExterno, setTextoExterno] = useState("");
  const [tipoOrigem, setTipoOrigem] = useState<TipoOrigemExterna>("texto");
  const inputDocumentoRef = useRef<HTMLInputElement>(null);
  const [arquivoFonte, setArquivoFonte] = useState<File | null>(null);
  const [arquivoAudioFonte, setArquivoAudioFonte] = useState<File | null>(null);
  const [fontePreparada, setFontePreparada] = useState<FonteReflexaoPreparada | null>(null);
  const [tituloFonte, setTituloFonte] = useState("");
  const [autorFonte, setAutorFonte] = useState("");
  const [urlFonte, setUrlFonte] = useState("");
  const [processandoFonte, setProcessandoFonte] = useState(false);
  const [progressoFonte, setProgressoFonte] = useState(0);

  useEffect(() => {
    if (!fonteIdInicial || fonteBibliotecaCarregadaRef.current === fonteIdInicial) return;

    fonteBibliotecaCarregadaRef.current = fonteIdInicial;

    void (async () => {
      try {
        setProcessandoFonte(true);
        setErro(null);

        const fonte = await prepararFonteBibliotecaTemporaria(fonteIdInicial);
        setModoExterno("biblioteca");
        setTipoOrigem("biblioteca");
        setFontePreparada(fonte);
        setTituloFonte(fonte.titulo || "");
        setAutorFonte(fonte.autorNome || "");
        setTextoExterno(fonte.conteudoConfirmado || fonte.conteudoExtraido);
      } catch (err: unknown) {
        const mensagem =
          err instanceof Error ? err.message : "Não foi possível carregar a obra selecionada.";
        setErro(mensagem);
        fonteBibliotecaCarregadaRef.current = null;
      } finally {
        setProcessandoFonte(false);
      }
    })();
  }, [fonteIdInicial]);

  // Etapa 2: Comentário Pessoal
  const [comentarioPessoal, setComentarioPessoal] = useState("");
  const [titulo, setTitulo] = useState("");
  const [fonteComentarioAudio, setFonteComentarioAudio] = useState<FonteReflexaoPreparada | null>(null);
  const [processandoComentarioAudio, setProcessandoComentarioAudio] = useState(false);
  const [progressoComentarioAudio, setProgressoComentarioAudio] = useState(0);

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

  async function descartarFonteTemporaria(fonte: FonteReflexaoPreparada | null) {
    if (entradaId || !fonte?.storageCaminho) return;

    try {
      await removerFontesTemporariasReflexao([fonte.storageCaminho]);
    } catch (erroLimpeza) {
      console.error("Falha ao remover fonte temporária de Reflexões:", erroLimpeza);
    }
  }

  async function prepararDocumentoComoFonte(file: File) {
    await descartarFonteTemporaria(fontePreparada);

    const limiteBytes = 50 * 1024 * 1024;
    const extensao = file.name.split(".").pop()?.toLowerCase();
    const extensoesPermitidas = new Set(["pdf", "docx", "txt", "md"]);

    if (!extensao || !extensoesPermitidas.has(extensao)) {
      setErro("Documento não suportado. Use PDF, DOCX, TXT ou Markdown.");
      return;
    }

    if (file.size > limiteBytes) {
      setErro("A fonte da reflexão pode ter no máximo 50 MB.");
      return;
    }

    let caminhoUpload: string | null = null;

    try {
      setProcessandoFonte(true);
      setErro(null);
      setProgressoFonte(0);
      setArquivoFonte(file);

      const auth = await obterTokenAutenticadoBrowser();
      const hashSha256 = await calcularHashSha256(file);
      const timestamp = Date.now();
      const nomeSanitizado = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const caminho = `${auth.usuarioId}/${timestamp}/documento/${nomeSanitizado}`;
      caminhoUpload = caminho;

      await new Promise<void>((resolve, reject) => {
        iniciarUploadTus({
          arquivo: file,
          caminhoDestino: caminho,
          bucket: "fontes-reflexoes",
          tokenAutenticacao: auth.token,
          aoProgredir: (porcentagem) => setProgressoFonte(porcentagem),
          aoSucesso: () => resolve(),
          aoErro: (erroUpload) => reject(erroUpload),
        }).catch(reject);
      });

      const extracao = await extrairFonteDocumentoTemporaria({
        storageCaminho: caminho,
        arquivoNomeOriginal: file.name,
        arquivoMimeType: file.type || "application/octet-stream",
      });

      const tituloSugerido = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
      if (!tituloFonte.trim()) setTituloFonte(tituloSugerido);

      setTextoExterno(extracao.texto);
      setTipoOrigem("documento");
      setFontePreparada({
        tipo: "documento",
        titulo: tituloFonte.trim() || tituloSugerido,
        autorNome: autorFonte.trim() || undefined,
        storageBucket: "fontes-reflexoes",
        storageCaminho: caminho,
        arquivoNomeOriginal: file.name,
        arquivoMimeType: file.type || "application/octet-stream",
        arquivoTamanhoBytes: file.size,
        hashSha256,
        conteudoExtraido: extracao.texto,
        conteudoConfirmado: extracao.texto,
        metadados: {
          totalPaginas: extracao.totalPaginas,
          totalPalavras: extracao.totalPalavras,
          totalCaracteres: extracao.totalCaracteres,
          ...extracao.metadados,
        },
      });
    } catch (err: unknown) {
      if (caminhoUpload) {
        try {
          await removerFontesTemporariasReflexao([caminhoUpload]);
        } catch (erroLimpeza) {
          console.error("Falha ao compensar upload documental temporário:", erroLimpeza);
        }
      }

      const mensagem = err instanceof Error ? err.message : "Falha ao preparar o documento.";
      console.error("Erro ao preparar fonte documental:", err);
      setErro(mensagem);
      setArquivoFonte(null);
      setFontePreparada(null);
      setTextoExterno("");
    } finally {
      setProcessandoFonte(false);
    }
  }

  function lidarSelecaoDocumento(evento: ChangeEvent<HTMLInputElement>) {
    const file = evento.target.files?.[0];
    if (file) void prepararDocumentoComoFonte(file);
  }

  async function prepararAudioComoFonte(file: File | null) {
    await descartarFonteTemporaria(fontePreparada);

    setArquivoAudioFonte(file);
    setFontePreparada(null);
    setTextoExterno("");

    if (!file) return;

    const limiteTranscricao = 24 * 1024 * 1024;
    if (file.size > limiteTranscricao) {
      setErro("A gravação excedeu 24 MB. Grave um trecho menor para transcrever com segurança.");
      setArquivoAudioFonte(null);
      return;
    }

    let caminhoUpload: string | null = null;

    try {
      setProcessandoFonte(true);
      setErro(null);
      setProgressoFonte(0);

      const auth = await obterTokenAutenticadoBrowser();
      const hashSha256 = await calcularHashSha256(file);
      const timestamp = Date.now();
      const nomeSanitizado = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const caminho = `${auth.usuarioId}/${timestamp}/audio/${nomeSanitizado}`;
      caminhoUpload = caminho;

      await new Promise<void>((resolve, reject) => {
        iniciarUploadTus({
          arquivo: file,
          caminhoDestino: caminho,
          bucket: "fontes-reflexoes",
          tokenAutenticacao: auth.token,
          aoProgredir: (porcentagem) => setProgressoFonte(porcentagem),
          aoSucesso: () => resolve(),
          aoErro: (erroUpload) => reject(erroUpload),
        }).catch(reject);
      });

      const transcricao = await transcreverFonteAudioTemporaria({
        storageCaminho: caminho,
        arquivoNomeOriginal: file.name,
        arquivoMimeType: file.type || "audio/webm",
      });

      const tituloSugerido =
        tituloFonte.trim() || `Gravação de ${new Date().toLocaleDateString("pt-BR")}`;

      setTituloFonte(tituloSugerido);
      setTipoOrigem("audio_transcricao");
      setTextoExterno(transcricao.texto);
      setFontePreparada({
        tipo: "audio",
        titulo: tituloSugerido,
        autorNome: autorFonte.trim() || undefined,
        storageBucket: "fontes-reflexoes",
        storageCaminho: caminho,
        arquivoNomeOriginal: file.name,
        arquivoMimeType: file.type || "audio/webm",
        arquivoTamanhoBytes: file.size,
        hashSha256,
        conteudoExtraido: transcricao.texto,
        conteudoConfirmado: transcricao.texto,
        metadados: {
          idiomas: transcricao.idiomas,
          totalCaracteres: transcricao.totalCaracteres,
          totalPalavras: transcricao.totalPalavras,
          origem: "gravacao_microfone",
        },
      });
    } catch (err: unknown) {
      if (caminhoUpload) {
        try {
          await removerFontesTemporariasReflexao([caminhoUpload]);
        } catch (erroLimpeza) {
          console.error("Falha ao compensar upload de áudio temporário:", erroLimpeza);
        }
      }

      const mensagem = err instanceof Error ? err.message : "Falha ao preparar a gravação.";
      console.error("Erro ao preparar fonte de áudio:", err);
      setErro(mensagem);
      setArquivoAudioFonte(null);
      setFontePreparada(null);
      setTextoExterno("");
      setProgressoFonte(0);
    } finally {
      setProcessandoFonte(false);
    }
  }

  async function prepararAudioComentario(file: File | null) {
    await descartarFonteTemporaria(fonteComentarioAudio);

    setFonteComentarioAudio(null);
    if (!file) return;

    const limiteTranscricao = 24 * 1024 * 1024;
    if (file.size > limiteTranscricao) {
      setErro("O comentário gravado excedeu 24 MB. Grave um trecho menor.");
      return;
    }

    let caminhoUpload: string | null = null;

    try {
      setProcessandoComentarioAudio(true);
      setProgressoComentarioAudio(0);
      setErro(null);

      const auth = await obterTokenAutenticadoBrowser();
      const hashSha256 = await calcularHashSha256(file);
      const timestamp = Date.now();
      const nomeSanitizado = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const caminho = `${auth.usuarioId}/${timestamp}/comentario/${nomeSanitizado}`;
      caminhoUpload = caminho;

      await new Promise<void>((resolve, reject) => {
        iniciarUploadTus({
          arquivo: file,
          caminhoDestino: caminho,
          bucket: "fontes-reflexoes",
          tokenAutenticacao: auth.token,
          aoProgredir: (porcentagem) => setProgressoComentarioAudio(porcentagem),
          aoSucesso: () => resolve(),
          aoErro: (erroUpload) => reject(erroUpload),
        }).catch(reject);
      });

      const transcricao = await transcreverFonteAudioTemporaria({
        storageCaminho: caminho,
        arquivoNomeOriginal: file.name,
        arquivoMimeType: file.type || "audio/webm",
      });

      setComentarioPessoal(transcricao.texto);
      setFonteComentarioAudio({
        tipo: "audio",
        titulo: "Comentário do autor",
        storageBucket: "fontes-reflexoes",
        storageCaminho: caminho,
        arquivoNomeOriginal: file.name,
        arquivoMimeType: file.type || "audio/webm",
        arquivoTamanhoBytes: file.size,
        hashSha256,
        conteudoExtraido: transcricao.texto,
        conteudoConfirmado: transcricao.texto,
        metadados: {
          papel: "comentario_autor",
          idiomas: transcricao.idiomas,
          totalCaracteres: transcricao.totalCaracteres,
          totalPalavras: transcricao.totalPalavras,
          origem: "gravacao_microfone",
        },
      });
    } catch (err: unknown) {
      if (caminhoUpload) {
        try {
          await removerFontesTemporariasReflexao([caminhoUpload]);
        } catch (erroLimpeza) {
          console.error("Falha ao compensar áudio temporário do comentário:", erroLimpeza);
        }
      }

      const mensagem = err instanceof Error ? err.message : "Falha ao transcrever o comentário.";
      console.error("Erro ao preparar comentário em áudio:", err);
      setErro(mensagem);
      setFonteComentarioAudio(null);
      setProgressoComentarioAudio(0);
    } finally {
      setProcessandoComentarioAudio(false);
    }
  }

  async function prepararLinkComoFonte() {
    if (!urlFonte.trim()) {
      setErro("Informe o endereço do artigo ou página que deseja usar como fonte.");
      return;
    }

    try {
      setProcessandoFonte(true);
      setErro(null);

      const extracao = await extrairFonteLinkTemporaria(urlFonte.trim());

      const tituloResolvido = tituloFonte.trim() || extracao.titulo || "";
      const autorResolvido = autorFonte.trim() || extracao.autor || "";

      setTituloFonte(tituloResolvido);
      setAutorFonte(autorResolvido);
      setTextoExterno(extracao.texto);
      setTipoOrigem("artigo");
      setFontePreparada({
        tipo: "link",
        titulo: tituloResolvido || undefined,
        autorNome: autorResolvido || undefined,
        urlOrigem: extracao.urlFinal,
        conteudoExtraido: extracao.texto,
        conteudoConfirmado: extracao.texto,
        metadados: {
          siteName: extracao.siteName || null,
          resumo: extracao.resumo || null,
          totalCaracteres: extracao.totalCaracteres,
          totalPalavras: extracao.totalPalavras,
        },
      });
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : "Falha ao extrair o conteúdo do link.";
      console.error("Erro ao preparar fonte por link:", err);
      setErro(mensagem);
      setFontePreparada(null);
      setTextoExterno("");
    } finally {
      setProcessandoFonte(false);
    }
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

      const fonteAtual: FonteReflexaoPreparada = fontePreparada
        ? {
            ...fontePreparada,
            titulo: tituloFonte.trim() || fontePreparada.titulo,
            autorNome: autorFonte.trim() || fontePreparada.autorNome,
            conteudoConfirmado: textoExterno,
          }
        : {
            tipo: "texto",
            titulo: tituloFonte.trim() || undefined,
            autorNome: autorFonte.trim() || undefined,
            conteudoExtraido: textoExterno,
            conteudoConfirmado: textoExterno,
          };

      const res = await iniciarEsteiraReflexao({
        reflexaoExterna: textoExterno,
        tipoOrigemExterna: tipoOrigem,
        comentarioAutor: comentarioPessoal,
        titulo: titulo.trim() || undefined,
        formatoDesejado: formato,
        fonte: fonteAtual,
        fontesAdicionais: fonteComentarioAudio
          ? [
              {
                ...fonteComentarioAudio,
                conteudoConfirmado: comentarioPessoal,
              },
            ]
          : [],
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
        setMemorias([]);
      }

      setEtapaAtual(3);
    } catch (err: any) {
      console.error("Erro ao iniciar esteira:", err);

      const caminhosTemporarios = [
        fontePreparada?.storageCaminho,
        fonteComentarioAudio?.storageCaminho,
      ].filter((caminho): caminho is string => Boolean(caminho));

      if (caminhosTemporarios.length > 0) {
        try {
          await removerFontesTemporariasReflexao(caminhosTemporarios);
        } catch (erroLimpeza) {
          console.error("Falha ao limpar fontes após erro na esteira:", erroLimpeza);
        }

        setFontePreparada(null);
        setFonteComentarioAudio(null);
        setArquivoFonte(null);
        setArquivoAudioFonte(null);
        setProgressoFonte(0);
        setProgressoComentarioAudio(0);
      }

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

      await atualizarDossieReflexao({
        entradaId,
        fragmentosIds: memorias.filter((memoria) => memoria.selecionada).map((memoria) => memoria.id),
      });

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

      await acionarRedacaoReflexao({
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
            <p className="text-sm text-slate-500 mt-1 leading-6">
              Insira o conteúdo externo que deseja analisar (artigo, texto, mensagem, transcrição ou citação).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => {
                setModoExterno("colar");
                setTipoOrigem("texto");
                setArquivoFonte(null);
                setFontePreparada(null);
                setTextoExterno("");
                setUrlFonte("");
                setTituloFonte("");
                setAutorFonte("");
                setProgressoFonte(0);
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
                setUrlFonte("");
                setArquivoFonte(null);
                setFontePreparada(null);
                setTextoExterno("");
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
                setArquivoFonte(null);
                setFontePreparada(null);
                setTextoExterno("");
                setUrlFonte("");
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

            <button
              type="button"
              onClick={() => {
                setModoExterno("audio");
                setTipoOrigem("audio_transcricao");
                setArquivoFonte(null);
                setArquivoAudioFonte(null);
                setFontePreparada(null);
                setTextoExterno("");
                setUrlFonte("");
              }}
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                modoExterno === "audio"
                  ? "bg-blue-50 text-blue-700 border-blue-200 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Gravar áudio</span>
            </button>
          </div>

          {modoExterno === "biblioteca" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Fonte da Biblioteca selecionada
                    </span>
                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      {tituloFonte || "Obra selecionada"}
                    </h3>
                    {autorFonte && (
                      <p className="mt-1 text-sm text-slate-600">Por {autorFonte}</p>
                    )}
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      A obra permanece referenciada pela Biblioteca. Para a análise inicial,
                      o sistema usa uma amostra distribuída dos fragmentos processados.
                    </p>
                  </div>
                  <BookOpen className="h-6 w-6 shrink-0 text-blue-600" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Contexto representativo da obra
                </label>
                <textarea
                  value={textoExterno}
                  readOnly
                  rows={8}
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-serif text-sm leading-7 text-slate-700"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setModoExterno("colar");
                  setTipoOrigem("texto");
                  setFontePreparada(null);
                  setTextoExterno("");
                  setTituloFonte("");
                  setAutorFonte("");
                  setUrlFonte("");
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Escolher outra fonte
              </button>
            </div>
          ) : modoExterno === "audio" ? (
            <div className="space-y-4">
              <GravadorAudio
                desabilitado={processandoFonte}
                onArquivoPronto={(arquivo) => void prepararAudioComoFonte(arquivo)}
              />

              {arquivoAudioFonte && (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                  {(arquivoAudioFonte.size / 1024 / 1024).toFixed(2)} MB
                  {processandoFonte
                    ? ` · Enviando/transcrevendo ${progressoFonte}%`
                    : fontePreparada?.tipo === "audio"
                    ? " · Transcrição pronta para revisão"
                    : " · Aguardando transcrição"}
                </div>
              )}

              {fontePreparada?.tipo === "audio" && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={tituloFonte}
                      onChange={(e) => setTituloFonte(e.target.value)}
                      placeholder="Título da gravação (opcional)"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={autorFonte}
                      onChange={(e) => setAutorFonte(e.target.value)}
                      placeholder="Autor / origem (opcional)"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Transcrição — revise antes de continuar
                    </label>
                    <textarea
                      value={textoExterno}
                      onChange={(e) => setTextoExterno(e.target.value)}
                      rows={8}
                      className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3.5 text-sm leading-6 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      O áudio original permanece preservado; suas correções ficam registradas como transcrição confirmada.
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : modoExterno === "arquivo" ? (
            <div className="space-y-4">
              <input
                ref={inputDocumentoRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={lidarSelecaoDocumento}
                className="hidden"
              />

              {!arquivoFonte ? (
                <button
                  type="button"
                  onClick={() => inputDocumentoRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-7 text-center hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
                >
                  <UploadCloud className="mx-auto h-7 w-7 text-blue-600" />
                  <span className="mt-2 block text-sm font-bold text-slate-900">
                    Selecionar documento
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    PDF, DOCX, TXT ou Markdown · até 50 MB
                  </span>
                </button>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{arquivoFonte.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {(arquivoFonte.size / 1024 / 1024).toFixed(2)} MB
                        {processandoFonte ? ` · Enviando/extraindo ${progressoFonte}%` : " · Texto extraído e pronto para revisão"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setArquivoFonte(null);
                        setFontePreparada(null);
                        setTextoExterno("");
                        setProgressoFonte(0);
                        inputDocumentoRef.current?.click();
                      }}
                      className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Trocar
                    </button>
                  </div>
                </div>
              )}

              {arquivoFonte && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={tituloFonte}
                    onChange={(e) => setTituloFonte(e.target.value)}
                    placeholder="Título da fonte (opcional)"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={autorFonte}
                    onChange={(e) => setAutorFonte(e.target.value)}
                    placeholder="Autor / origem (opcional)"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {textoExterno && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Texto extraído — revise antes de continuar
                  </label>
                  <textarea
                    value={textoExterno}
                    onChange={(e) => setTextoExterno(e.target.value)}
                    rows={8}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm leading-6 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y font-sans"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    O original permanece preservado; suas correções ficam registradas como conteúdo confirmado.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {modoExterno === "link" && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    value={urlFonte}
                    onChange={(e) => {
                      setUrlFonte(e.target.value);
                      setFontePreparada(null);
                      setTextoExterno("");
                    }}
                    placeholder="https://exemplo.com/artigo"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void prepararLinkComoFonte()}
                    disabled={processandoFonte || !urlFonte.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-black disabled:opacity-50"
                  >
                    {processandoFonte ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Globe className="h-4 w-4" />
                    )}
                    {processandoFonte ? "Extraindo..." : "Extrair artigo"}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={tituloFonte}
                  onChange={(e) => setTituloFonte(e.target.value)}
                  placeholder="Título da fonte (opcional)"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={autorFonte}
                  onChange={(e) => setAutorFonte(e.target.value)}
                  placeholder="Autor / origem (opcional)"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <textarea
                value={textoExterno}
                onChange={(e) => setTextoExterno(e.target.value)}
                placeholder={
                  modoExterno === "link"
                    ? "O conteúdo principal do artigo aparecerá aqui para revisão."
                    : "Cole aqui o texto, artigo, mensagem ou trecho recebido que deseja examinar..."
                }
                rows={modoExterno === "link" ? 8 : 6}
                disabled={modoExterno === "link" && !fontePreparada}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-sm leading-6 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y font-sans disabled:bg-slate-50 disabled:text-slate-400"
              />
              <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
                <span>Fonte preservada com proveniência na entrada da reflexão</span>
                <span>{textoExterno.length} caracteres</span>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (processandoFonte) {
                  setErro("Aguarde a preparação da fonte terminar.");
                  return;
                }
                if (modoExterno === "link" && fontePreparada?.tipo !== "link") {
                  setErro("Extraia o artigo pelo link antes de continuar.");
                  return;
                }
                if (modoExterno === "audio" && fontePreparada?.tipo !== "audio") {
                  setErro("Finalize a gravação e aguarde a transcrição antes de continuar.");
                  return;
                }
                if (!textoExterno.trim()) {
                  setErro(
                    modoExterno === "arquivo"
                      ? "Selecione um documento e aguarde a extração do texto."
                      : modoExterno === "biblioteca"
                      ? "Não foi possível preparar a obra selecionada."
                      : "Insira uma fonte real antes de continuar."
                  );
                  return;
                }
                setErro(null);
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
            <p className="text-sm text-slate-500 mt-1 leading-6">
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
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
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-sm leading-6 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y font-sans"
            />
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Ou grave seu comentário</p>
              <p className="mt-1 text-xs text-slate-500">
                A transcrição substituirá o texto acima para você revisar antes de consultar o Cérebro.
              </p>
            </div>

            <GravadorAudio
              desabilitado={processandoComentarioAudio || carregando}
              onArquivoPronto={(arquivo) => void prepararAudioComentario(arquivo)}
            />

            {processandoComentarioAudio && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
                Enviando e transcrevendo comentário · {progressoComentarioAudio}%
              </div>
            )}

            {fonteComentarioAudio && !processandoComentarioAudio && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                Comentário transcrito. Revise o texto acima antes de continuar.
              </div>
            )}
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
            <p className="text-sm text-slate-500 mt-1 leading-6">
              O Cérebro Autoral comparou este tema com seus fragmentos processados e trouxe as memórias autorais mais próximas. Selecione o que fará parte do dossiê:
            </p>
          </div>

          <div className="space-y-3">
            {memorias.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center">
                <p className="text-sm font-semibold text-slate-800">Nenhuma memória relacionada foi encontrada.</p>
                <p className="mt-1 text-xs text-slate-500">
                  Você pode continuar. O plano será gerado sem citar memórias que não estejam no seu acervo.
                </p>
              </div>
            )}
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
                    <h3 className="text-sm font-bold text-slate-800">{mem.titulo}</h3>
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
                <p className="text-sm sm:text-base font-serif italic text-slate-700 mt-3 leading-7">
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
            <p className="text-sm text-slate-500 mt-1 leading-6">
              O sistema combinou estímulo externo, seu pensamento presente e a base histórica autoral:
            </p>
          </div>

          <div className="space-y-3">
            {conflitos.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2 text-sm text-amber-900">
                <span className="font-bold">Atrito Dialético Inicial:</span>
                <p className="text-slate-700">
                  O estímulo externo propõe conclusões superficiais imediatas, gerando oportunidade para fundamentar a posição autoral com densidade e perspectiva histórica.
                </p>
              </div>
            ) : (
              conflitos.map((c, i) => (
                <div key={i} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider">
                      {c.tipo}
                    </span>
                  </div>
                  <p className="text-slate-800 font-semibold">{c.descricao}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-1">
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
              <p className="text-sm text-slate-500 mt-1 leading-6">
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
