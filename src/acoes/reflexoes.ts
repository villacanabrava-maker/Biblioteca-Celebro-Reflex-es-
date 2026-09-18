"use server";

import { revalidatePath } from "next/cache";
import dns from "node:dns/promises";
import net from "node:net";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";
import { detectarConflitosEMontarDossie } from "@/dominios/reflexoes/detector-conflitos";
import { gerarPlanoReflexao } from "@/dominios/reflexoes/planejador-reflexao";
import { redigirReflexao } from "@/dominios/reflexoes/redator-reflexao";
import { auditarVersaoReflexao } from "@/dominios/auditoria/auditor-independente";
import { extrairTextoDeBuffer } from "@/dominios/processamento/extrator-texto";
import { obterClienteOpenAI } from "@/ia/cliente";
import type {
  ResumoReflexao,
  EntradaReflexao,
  PlanoReflexao,
  VersaoReflexao,
  CitacaoEvidencia,
  FormatoReflexao,
  TipoOrigemExterna,
  ConflitoDetectado,
  DossieContextual,
  FonteReflexaoPreparada,
} from "@/tipos/reflexoes";
import type { RelatorioAuditoria } from "@/tipos/auditoria";

/**
 * Obtém a lista de todas as reflexões do usuário com métricas da última versão.
 */
export async function obterResumoReflexoes(): Promise<ResumoReflexao[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_reflexoes_resumo")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("atualizado_em", { ascending: false });

  if (error) {
    console.error("Erro ao obter resumo de reflexões:", error);
    return [];
  }

  return (data as ResumoReflexao[]) || [];
}

/**
 * Obtém os dados completos de uma reflexão (entrada, plano, versões, citações, auditoria).
 */
export async function obterReflexaoCompleta(entradaId: string): Promise<{
  entrada: EntradaReflexao | null;
  plano: PlanoReflexao | null;
  versoes: (VersaoReflexao & {
    citacoes: CitacaoEvidencia[];
    auditoria?: RelatorioAuditoria | null;
  })[];
}> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Entrada
  const { data: entrada } = await admin
    .schema("reflexoes")
    .from("entradas")
    .select("*")
    .eq("id", entradaId)
    .eq("usuario_id", usuarioId)
    .single();

  if (!entrada) {
    return { entrada: null, plano: null, versoes: [] };
  }

  // 2. Plano mais recente
  const { data: plano } = await admin
    .schema("reflexoes")
    .from("planos_reflexao")
    .select("*")
    .eq("entrada_id", entradaId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Versões
  const { data: versoes } = await admin
    .schema("reflexoes")
    .from("versoes_reflexao")
    .select("*")
    .eq("entrada_id", entradaId)
    .order("numero_versao", { ascending: false });

  const versoesCompletas = [];

  for (const v of versoes || []) {
    // Citações da versão
    const { data: citacoes } = await admin
      .schema("reflexoes")
      .from("citacoes_evidencias")
      .select("*")
      .eq("versao_reflexao_id", v.id);

    // Relatório de Auditoria da versão
    const { data: relatorio } = await admin
      .schema("auditoria")
      .from("relatorios_auditoria")
      .select("*")
      .eq("versao_reflexao_id", v.id)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    versoesCompletas.push({
      ...v,
      citacoes: citacoes || [],
      auditoria: relatorio || null,
    });
  }

  return {
    entrada: entrada as EntradaReflexao,
    plano: (plano as PlanoReflexao) || null,
    versoes: versoesCompletas as any,
  };
}

/**
 * Extrai uma fonte documental já enviada ao bucket privado de Reflexões.
 * O caminho precisa pertencer ao próprio usuário autenticado.
 */
export async function extrairFonteDocumentoTemporaria({
  storageCaminho,
  arquivoNomeOriginal,
  arquivoMimeType,
}: {
  storageCaminho: string;
  arquivoNomeOriginal: string;
  arquivoMimeType: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  if (!storageCaminho.startsWith(`${usuarioId}/`)) {
    throw new Error("Fonte documental inválida para o usuário autenticado.");
  }

  const { data, error } = await admin.storage
    .from("fontes-reflexoes")
    .download(storageCaminho);

  if (error || !data) {
    throw new Error(`Não foi possível ler o documento enviado: ${error?.message || "arquivo indisponível"}`);
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const resultado = await extrairTextoDeBuffer(buffer, arquivoMimeType, arquivoNomeOriginal);

  if (!resultado.textoCompleto.trim()) {
    throw new Error("O documento foi enviado, mas nenhum texto legível pôde ser extraído.");
  }

  return {
    texto: resultado.textoCompleto,
    totalPaginas: resultado.totalPaginas,
    totalPalavras: resultado.totalPalavras,
    totalCaracteres: resultado.totalCaracteres,
    metadados: resultado.metadadosArquivo,
  };
}

/**
 * Prepara uma obra da Biblioteca como fonte principal de uma nova reflexão.
 * A obra é preservada por referência canônica (obraId); para a análise inicial,
 * montamos uma amostra representativa e distribuída dos fragmentos já processados.
 */
export async function prepararFonteBibliotecaTemporaria(obraId: string): Promise<FonteReflexaoPreparada> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: obra, error: erroObra } = await admin
    .from("v_obras_detalhadas")
    .select("id, titulo, autor_nome, estado_processamento, total_paginas")
    .eq("id", obraId)
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (erroObra || !obra) {
    throw new Error("A obra selecionada não foi encontrada na sua Biblioteca.");
  }

  if (obra.estado_processamento !== "processado") {
    throw new Error("Esta obra precisa estar processada antes de ser usada como fonte de reflexão.");
  }

  const { data: fragmentos, error: erroFragmentos } = await admin
    .from("v_fragmentos_detalhados")
    .select("id, ordem, conteudo, secao_titulo")
    .eq("obra_id", obraId)
    .eq("usuario_id", usuarioId)
    .order("ordem", { ascending: true });

  if (erroFragmentos) {
    throw new Error(`Não foi possível preparar os fragmentos da obra: ${erroFragmentos.message}`);
  }

  if (!fragmentos?.length) {
    throw new Error("A obra está processada, mas ainda não possui fragmentos disponíveis.");
  }

  const limiteAmostra = Math.min(12, fragmentos.length);
  const indices =
    limiteAmostra === 1
      ? [0]
      : Array.from({ length: limiteAmostra }, (_, indice) =>
          Math.round((indice * (fragmentos.length - 1)) / (limiteAmostra - 1))
        );

  const selecionados = Array.from(new Set(indices))
    .map((indice) => fragmentos[indice])
    .filter(Boolean);

  const cabecalho = [
    `Obra selecionada da Biblioteca: ${obra.titulo}`,
    obra.autor_nome ? `Autor: ${obra.autor_nome}` : null,
    `Fragmentos processados na obra: ${fragmentos.length}`,
  ]
    .filter(Boolean)
    .join("\n");

  const corpo = selecionados
    .map((fragmento, indice) => {
      const secao = fragmento.secao_titulo ? ` · ${fragmento.secao_titulo}` : "";
      return `[Trecho representativo ${indice + 1}${secao}]\n${fragmento.conteudo}`;
    })
    .join("\n\n---\n\n");

  const conteudoRepresentativo = `${cabecalho}\n\n${corpo}`.slice(0, 24_000);

  return {
    tipo: "biblioteca",
    titulo: obra.titulo,
    autorNome: obra.autor_nome || undefined,
    obraId: obra.id,
    conteudoExtraido: conteudoRepresentativo,
    conteudoConfirmado: conteudoRepresentativo,
    metadados: {
      totalPaginas: obra.total_paginas || null,
      totalFragmentos: fragmentos.length,
      fragmentosAmostrados: selecionados.length,
      estrategiaContexto: "amostragem_uniforme_de_fragmentos_processados",
    },
  };
}

/**
 * Transcreve um áudio já enviado ao bucket privado de fontes de Reflexões.
 * O arquivo original permanece preservado no Storage; apenas a transcrição
 * retorna para revisão pelo autor.
 */
export async function transcreverFonteAudioTemporaria({
  storageCaminho,
  arquivoNomeOriginal,
  arquivoMimeType,
}: {
  storageCaminho: string;
  arquivoNomeOriginal: string;
  arquivoMimeType: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  if (!storageCaminho.startsWith(`${usuarioId}/`)) {
    throw new Error("Fonte de áudio inválida para o usuário autenticado.");
  }

  if (!arquivoMimeType.toLowerCase().startsWith("audio/")) {
    throw new Error("O arquivo informado não é um áudio compatível.");
  }

  const { data, error } = await admin.storage
    .from("fontes-reflexoes")
    .download(storageCaminho);

  if (error || !data) {
    throw new Error(`Não foi possível ler o áudio enviado: ${error?.message || "arquivo indisponível"}`);
  }

  const limiteTranscricao = 25 * 1024 * 1024;
  if (data.size > limiteTranscricao) {
    throw new Error("A gravação excede o limite de 25 MB da transcrição. Grave um trecho menor.");
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const arquivo = new File([buffer], arquivoNomeOriginal, {
    type: arquivoMimeType || "audio/webm",
  });

  const openai = obterClienteOpenAI();

  const resposta = await (openai.audio.transcriptions.create as any)({
    file: arquivo,
    model: "gpt-transcribe",
    prompt:
      "Transcreva fielmente a fala. Preserve nomes próprios, termos conceituais e pontuação natural. Não resuma e não acrescente conteúdo.",
  });

  const texto = String(resposta?.text || "").trim();
  if (!texto) {
    throw new Error("O áudio foi recebido, mas nenhuma fala pôde ser transcrita.");
  }

  return {
    texto,
    idiomas: Array.isArray(resposta?.languages) ? resposta.languages : [],
    totalCaracteres: texto.length,
    totalPalavras: texto.split(/\s+/).filter(Boolean).length,
  };
}

function enderecoEhPrivadoOuReservado(endereco: string): boolean {
  const versao = net.isIP(endereco);

  if (versao === 4) {
    const partes = endereco.split(".").map(Number);
    const [a, b] = partes;

    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  if (versao === 6) {
    const normalizado = endereco.toLowerCase();
    return (
      normalizado === "::" ||
      normalizado === "::1" ||
      normalizado.startsWith("fc") ||
      normalizado.startsWith("fd") ||
      /^fe[89ab]/.test(normalizado) ||
      normalizado.startsWith("::ffff:127.") ||
      normalizado.startsWith("::ffff:10.") ||
      normalizado.startsWith("::ffff:192.168.") ||
      /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(normalizado)
    );
  }

  return false;
}

async function validarUrlExternaSegura(valor: string): Promise<URL> {
  let url: URL;

  try {
    url = new URL(valor);
  } catch {
    throw new Error("Informe uma URL válida, incluindo https://");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("A fonte por link precisa usar HTTP ou HTTPS.");
  }

  if (url.username || url.password) {
    throw new Error("URLs com credenciais embutidas não são permitidas.");
  }

  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("A URL usa uma porta não permitida para leitura de artigos.");
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Endereços locais ou internos não podem ser usados como fonte.");
  }

  if (net.isIP(host)) {
    if (enderecoEhPrivadoOuReservado(host)) {
      throw new Error("Endereços IP privados ou reservados não podem ser usados como fonte.");
    }
    return url;
  }

  const resolvidos = await dns.lookup(host, { all: true, verbatim: true });
  if (!resolvidos.length) {
    throw new Error("Não foi possível resolver o endereço informado.");
  }

  if (resolvidos.some((registro) => enderecoEhPrivadoOuReservado(registro.address))) {
    throw new Error("O endereço informado resolve para uma rede privada ou reservada.");
  }

  return url;
}

/**
 * Extrai o conteúdo principal de um artigo/link público.
 * Redirecionamentos são validados individualmente para impedir acesso a redes internas.
 */
export async function extrairFonteLinkTemporaria(urlInformada: string) {
  const LIMITE_HTML_BYTES = 5 * 1024 * 1024;
  const MAX_REDIRECIONAMENTOS = 4;
  let atual = await validarUrlExternaSegura(urlInformada.trim());

  for (let tentativa = 0; tentativa <= MAX_REDIRECIONAMENTOS; tentativa++) {
    const resposta = await fetch(atual, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.2",
        "User-Agent": "Rflex01-Reader/1.0 (+https://reflex-01.vercel.app)",
      },
    });

    if (resposta.status >= 300 && resposta.status < 400) {
      const destino = resposta.headers.get("location");
      if (!destino) {
        throw new Error("O link redirecionou sem informar um destino válido.");
      }
      if (tentativa === MAX_REDIRECIONAMENTOS) {
        throw new Error("O link excedeu o limite seguro de redirecionamentos.");
      }

      atual = await validarUrlExternaSegura(new URL(destino, atual).toString());
      continue;
    }

    if (!resposta.ok) {
      throw new Error(`Não foi possível acessar o link (HTTP ${resposta.status}).`);
    }

    const tipoConteudo = (resposta.headers.get("content-type") || "").toLowerCase();
    if (
      tipoConteudo &&
      !tipoConteudo.includes("text/html") &&
      !tipoConteudo.includes("application/xhtml+xml") &&
      !tipoConteudo.includes("text/plain")
    ) {
      throw new Error("O link não aponta para uma página textual compatível.");
    }

    const tamanhoDeclarado = Number(resposta.headers.get("content-length") || "0");
    if (tamanhoDeclarado > LIMITE_HTML_BYTES) {
      throw new Error("A página é grande demais para ser usada diretamente como fonte.");
    }

    const bytes = await resposta.arrayBuffer();
    if (bytes.byteLength > LIMITE_HTML_BYTES) {
      throw new Error("A página excedeu o limite de 5 MB para extração.");
    }

    const html = Buffer.from(bytes).toString("utf-8");
    const dom = new JSDOM(html, { url: atual.toString() });
    const artigo = new Readability(dom.window.document).parse();

    const texto =
      artigo?.textContent
        ?.replace(/\u00a0/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim() || "";

    if (!texto || texto.length < 80) {
      throw new Error("Não foi possível identificar conteúdo textual suficiente nessa página.");
    }

    return {
      urlFinal: atual.toString(),
      titulo: artigo?.title?.trim() || dom.window.document.title?.trim() || undefined,
      autor: artigo?.byline?.trim() || undefined,
      siteName: artigo?.siteName?.trim() || undefined,
      resumo: artigo?.excerpt?.trim() || undefined,
      texto,
      totalCaracteres: texto.length,
      totalPalavras: texto.split(/\s+/).filter(Boolean).length,
    };
  }

  throw new Error("Não foi possível concluir a leitura do link.");
}

async function registrarFonteCanonica({
  entradaId,
  usuarioId,
  fonte,
}: {
  entradaId: string;
  usuarioId: string;
  fonte: FonteReflexaoPreparada;
}) {
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .schema("reflexoes")
    .from("fontes_entrada")
    .insert({
      entrada_id: entradaId,
      usuario_id: usuarioId,
      tipo_fonte: fonte.tipo,
      titulo: fonte.titulo?.trim() || null,
      autor_nome: fonte.autorNome?.trim() || null,
      url_origem: fonte.urlOrigem?.trim() || null,
      obra_id: fonte.obraId || null,
      storage_bucket: fonte.storageBucket || null,
      storage_caminho: fonte.storageCaminho || null,
      arquivo_nome_original: fonte.arquivoNomeOriginal || null,
      arquivo_mime_type: fonte.arquivoMimeType || null,
      arquivo_tamanho_bytes: fonte.arquivoTamanhoBytes ?? null,
      hash_sha256: fonte.hashSha256 || null,
      conteudo_extraido: fonte.conteudoExtraido,
      conteudo_confirmado: fonte.conteudoConfirmado?.trim() || null,
      metadados: fonte.metadados || {},
      estado: "pronta",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Falha ao registrar a fonte da reflexão: ${error?.message || "erro desconhecido"}`);
  }

  return data.id as string;
}

/**
 * Inicia a esteira metodológica de reflexão:
 * 1. Salva estímulo externo e comentário do autor.
 * 2. Consulta memórias, regras e detecta tensões dialéticas e oportunidades conceituais.
 */
export async function iniciarEsteiraReflexao({
  reflexaoExterna,
  tipoOrigemExterna = "texto",
  comentarioAutor,
  temaCentral,
  titulo,
  formatoDesejado = "ensaio",
  fonte,
}: {
  reflexaoExterna: string;
  tipoOrigemExterna?: TipoOrigemExterna;
  comentarioAutor: string;
  temaCentral?: string;
  titulo?: string;
  formatoDesejado?: FormatoReflexao;
  fonte?: FonteReflexaoPreparada;
}): Promise<{
  sucesso: boolean;
  entradaId: string;
  conflitos: ConflitoDetectado[];
  dossie: DossieContextual;
}> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const tema = (temaCentral || titulo || reflexaoExterna.slice(0, 60)).trim();
  const tit = (titulo || `Reflexão sobre ${tema}`).trim();

  // 1. Detectar tensões cognitivas e montar dossiê de memórias
  const { conflitos, dossie } = await detectarConflitosEMontarDossie({
    usuarioId,
    reflexaoExterna,
    comentarioAutor,
    temaCentral: tema,
  });

  // 2. Salvar entrada de reflexão com o dossiê e conflitos
  const { data: entrada, error } = await admin
    .schema("reflexoes")
    .from("entradas")
    .insert({
      usuario_id: usuarioId,
      titulo: tit,
      tema_central: tema,
      provocacao_inicial: reflexaoExterna,
      reflexao_externa: reflexaoExterna,
      tipo_origem_externa: tipoOrigemExterna,
      comentario_autor: comentarioAutor,
      dossie_contexto: dossie,
      conflitos_detectados: conflitos,
      formato_desejado: formatoDesejado,
      estado: "criada",
    })
    .select()
    .single();

  if (error || !entrada) {
    throw new Error(`Falha ao iniciar esteira de reflexão: ${error?.message}`);
  }

  const fonteCanonica: FonteReflexaoPreparada = fonte || {
    tipo:
      tipoOrigemExterna === "documento"
        ? "documento"
        : tipoOrigemExterna === "audio_transcricao"
        ? "audio"
        : tipoOrigemExterna === "artigo"
        ? "link"
        : "texto",
    conteudoExtraido: reflexaoExterna,
    conteudoConfirmado: reflexaoExterna,
  };

  try {
    await registrarFonteCanonica({
      entradaId: entrada.id,
      usuarioId,
      fonte: {
        ...fonteCanonica,
        conteudoConfirmado:
          fonteCanonica.conteudoConfirmado?.trim() || reflexaoExterna.trim(),
      },
    });
  } catch (erroFonte) {
    await admin
      .schema("reflexoes")
      .from("entradas")
      .delete()
      .eq("id", entrada.id)
      .eq("usuario_id", usuarioId);

    throw erroFonte;
  }

  try {
    revalidatePath("/reflexoes");
  } catch {}

  return {
    sucesso: true,
    entradaId: entrada.id,
    conflitos,
    dossie,
  };
}

/**
 * Persiste a curadoria de memórias feita pelo autor antes da geração do plano.
 * Mantém conceitos, regras e conflitos do dossiê original e altera somente os
 * fragmentos selecionados.
 */
export async function atualizarDossieReflexao({
  entradaId,
  fragmentosIds,
}: {
  entradaId: string;
  fragmentosIds: string[];
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: entrada, error: erroEntrada } = await admin
    .schema("reflexoes")
    .from("entradas")
    .select("dossie_contexto")
    .eq("id", entradaId)
    .eq("usuario_id", usuarioId)
    .single();

  if (erroEntrada || !entrada) {
    throw new Error("Entrada de reflexão não encontrada para atualizar o dossiê.");
  }

  const dossieAtual = (entrada.dossie_contexto as DossieContextual | null) || {
    fragmentos_selecionados: [],
    conceitos_chave: [],
    regras_sugeridas: [],
  };

  const idsSelecionados = new Set(fragmentosIds);
  const fragmentosSelecionados = (dossieAtual.fragmentos_selecionados || []).filter((fragmento) =>
    idsSelecionados.has(fragmento.id)
  );

  const novoDossie: DossieContextual = {
    ...dossieAtual,
    fragmentos_selecionados: fragmentosSelecionados,
  };

  const { error: erroAtualizacao } = await admin
    .schema("reflexoes")
    .from("entradas")
    .update({ dossie_contexto: novoDossie })
    .eq("id", entradaId)
    .eq("usuario_id", usuarioId);

  if (erroAtualizacao) {
    throw new Error(`Falha ao atualizar o dossiê da reflexão: ${erroAtualizacao.message}`);
  }

  return { sucesso: true, totalFragmentos: fragmentosSelecionados.length };
}

/**
 * Cria uma nova entrada de reflexão e dispara o planejamento cognitivo com IA.
 */
export async function criarNovaReflexao({
  titulo,
  temaCentral,
  provocacaoInicial,
  objetivoComunicativo,
  publicoAlvo,
  formatoDesejado = "ensaio",
  restricoesEspecificas,
}: {
  titulo: string;
  temaCentral: string;
  provocacaoInicial: string;
  objetivoComunicativo?: string;
  publicoAlvo?: string;
  formatoDesejado?: FormatoReflexao;
  restricoesEspecificas?: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: entrada, error: errEntrada } = await admin
    .schema("reflexoes")
    .from("entradas")
    .insert({
      usuario_id: usuarioId,
      titulo: titulo.trim(),
      tema_central: temaCentral.trim(),
      provocacao_inicial: provocacaoInicial.trim(),
      reflexao_externa: provocacaoInicial.trim(),
      objetivo_comunicativo: objetivoComunicativo?.trim() || null,
      publico_alvo: publicoAlvo?.trim() || null,
      formato_desejado: formatoDesejado,
      restricoes_especificas: restricoesEspecificas?.trim() || null,
      estado: "criada",
    })
    .select()
    .single();

  if (errEntrada || !entrada) {
    throw new Error(`Falha ao criar entrada de reflexão: ${errEntrada?.message}`);
  }

  try {
    const plano = await gerarPlanoReflexao({
      entradaId: entrada.id,
      usuarioId,
      titulo: entrada.titulo,
      temaCentral: entrada.tema_central,
      provocacaoInicial: entrada.provocacao_inicial,
      objetivoComunicativo: entrada.objetivo_comunicativo,
      publicoAlvo: entrada.publico_alvo,
      formatoDesejado: entrada.formato_desejado,
      restricoesEspecificas: entrada.restricoes_especificas,
    });

    try {
      revalidatePath("/reflexoes");
    } catch {}

    return { sucesso: true, entradaId: entrada.id, planoId: plano.id };
  } catch (err: any) {
    console.error("Erro no planejamento automático:", err);
    return { sucesso: true, entradaId: entrada.id, planoId: null, aviso: err.message };
  }
}

/**
 * Gera o plano metodológico da reflexão com base na entrada e seu dossiê.
 */
export async function gerarPlanoParaEntrada(entradaId: string) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: entrada, error } = await admin
    .schema("reflexoes")
    .from("entradas")
    .select("*")
    .eq("id", entradaId)
    .eq("usuario_id", usuarioId)
    .single();

  if (error || !entrada) {
    throw new Error("Entrada de reflexão não encontrada.");
  }

  const plano = await gerarPlanoReflexao({
    entradaId: entrada.id,
    usuarioId,
    titulo: entrada.titulo,
    temaCentral: entrada.tema_central,
    provocacaoInicial: entrada.provocacao_inicial,
    reflexaoExterna: entrada.reflexao_externa,
    comentarioAutor: entrada.comentario_autor,
    objetivoComunicativo: entrada.objetivo_comunicativo,
    publicoAlvo: entrada.publico_alvo,
    formatoDesejado: entrada.formato_desejado,
    restricoesEspecificas: entrada.restricoes_especificas,
  });

  try {
    revalidatePath(`/reflexoes/${entradaId}`);
    revalidatePath("/reflexoes");
  } catch {}

  return { sucesso: true, plano };
}

/**
 * Aprova o plano de reflexão e aciona o motor de redação autoral e auditoria imediata.
 */
export async function acionarRedacaoReflexao({
  entradaId,
  planoId,
}: {
  entradaId: string;
  planoId: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Atualizar estado do plano para aprovado_pelo_autor
  await admin
    .schema("reflexoes")
    .from("planos_reflexao")
    .update({ estado: "aprovado_pelo_autor" })
    .eq("id", planoId);

  // 2. Redigir reflexão completa
  const versao = await redigirReflexao({
    entradaId,
    planoId,
    usuarioId,
  });

  // 3. Executar Auditoria Crítica Independente
  const auditoria = await auditarVersaoReflexao({
    versaoId: versao.id,
    usuarioId,
  });

  try {
    revalidatePath(`/reflexoes/${entradaId}`);
    revalidatePath("/reflexoes");
  } catch {}

  return { sucesso: true, versaoId: versao.id, auditoriaId: auditoria.id };
}

/**
 * Incorpora a reflexão aprovada como Obra Autoral na Biblioteca,
 * alimentando permanentemente o Cérebro Autoral.
 */
export async function incorporarReflexaoMemoria({
  entradaId,
  versaoId,
}: {
  entradaId: string;
  versaoId: string;
}) {
  return incorporarReflexaoComoObra({ entradaId, versaoId });
}

/**
 * Salva as notas de revisão e o parecer final do autor sobre uma versão gerada.
 */
export async function registrarRevisaoAutor({
  versaoId,
  entradaId,
  comentarioGeral,
  ajustesSolicitados = [],
  aprovado,
}: {
  versaoId: string;
  entradaId: string;
  comentarioGeral?: string;
  ajustesSolicitados?: string[];
  aprovado: boolean;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { error } = await admin
    .schema("reflexoes")
    .from("revisoes_autor")
    .insert({
      versao_reflexao_id: versaoId,
      usuario_id: usuarioId,
      comentario_geral: comentarioGeral || null,
      ajustes_solicitados: ajustesSolicitados,
      aprovado,
    });

  if (error) {
    throw new Error(`Falha ao registrar revisão: ${error.message}`);
  }

  // Se aprovado pelo autor, marcar versão e entrada como aprovadas
  if (aprovado) {
    await admin
      .schema("reflexoes")
      .from("versoes_reflexao")
      .update({ estado: "aprovado" })
      .eq("id", versaoId);

    await admin
      .schema("reflexoes")
      .from("entradas")
      .update({ estado: "concluida" })
      .eq("id", entradaId);
  }

  try {
    revalidatePath(`/reflexoes/${entradaId}`);
    revalidatePath("/reflexoes");
  } catch {}

  return { sucesso: true };
}

/**
 * Promove uma reflexão formalmente aprovada pelo autor a uma nova obra autoral
 * na Biblioteca, gerando arquivo Markdown no Storage e ativando o pipeline.
 */
export async function incorporarReflexaoComoObra({
  entradaId,
  versaoId,
}: {
  entradaId: string;
  versaoId: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Chamar a RPC segura de incorporação com validação de aprovado_autor
  const { data: obraId, error } = await admin.rpc("incorporar_reflexao_como_obra", {
    p_entrada_id: entradaId,
    p_versao_id: versaoId,
    p_usuario_id: usuarioId,
  });

  if (error) {
    console.error("Erro ao incorporar reflexão como obra:", error);
    throw new Error(`Falha na incorporação da reflexão: ${error.message}`);
  }

  // 2. Gravar o conteúdo textual em Markdown no Supabase Storage
  try {
    const { data: versao } = await admin
      .schema("reflexoes")
      .from("versoes_reflexao")
      .select("conteudo_markdown, numero_versao")
      .eq("id", versaoId)
      .single();

    if (versao?.conteudo_markdown) {
      const caminhoStorage = `reflexoes/${usuarioId}/${entradaId}.md`;
      await admin.storage
        .from("originais-biblioteca")
        .upload(caminhoStorage, Buffer.from(versao.conteudo_markdown, "utf-8"), {
          contentType: "text/markdown; charset=utf-8",
          upsert: true,
        });
    }
  } catch (err) {
    console.warn("Aviso ao persistir arquivo markdown no storage:", err);
  }

  try {
    revalidatePath("/biblioteca");
    revalidatePath(`/reflexoes/${entradaId}`);
    revalidatePath("/reflexoes");
  } catch {}

  return { sucesso: true, obraId: obraId as string };
}

/**
 * Verificador determinístico de antialucinação e integridade de evidências
 * conforme Seção 61 do Documento Mestre v2.0.
 */
export async function verificarCitacoesRedacao({
  entradaId,
  versaoId: _versaoId,
  redacaoTexto,
}: {
  entradaId: string;
  versaoId: string;
  redacaoTexto: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Obter os fragmentos mobilizados no dossiê de contexto
  const { data: contexto } = await admin
    .schema("reflexoes")
    .from("contextos")
    .select("fragmentos")
    .eq("entrada_id", entradaId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fragmentosDossie = (contexto?.fragmentos as any[]) || [];

  // 2. Extrair potenciais citações no texto (trechos entre aspas)
  const padraoAspas = /"([^"]{15,})"/g;
  const correspondencias = [...redacaoTexto.matchAll(padraoAspas)];

  const citacoesParaSalvar: any[] = [];

  for (const match of correspondencias) {
    const trechoCitado = match[1];

    // Verificar se existe em algum fragmento real do usuário
    const fragmentoCorrespondente = fragmentosDossie.find(
      (f: any) =>
        f.conteudo &&
        f.conteudo.toLowerCase().includes(trechoCitado.toLowerCase().slice(0, 30))
    );

    citacoesParaSalvar.push({
      entrada_id: entradaId,
      usuario_id: usuarioId,
      redacao_versao: 1,
      fragmento_id: fragmentoCorrespondente?.id || null,
      texto_citado: trechoCitado,
      texto_original: fragmentoCorrespondente?.conteudo || null,
      alinhamento_valido: !!fragmentoCorrespondente,
      tipo_fonte:
        fragmentoCorrespondente?.papel_fonte === "externa"
          ? "referencia_externa"
          : "autoral",
    });
  }

  if (citacoesParaSalvar.length > 0) {
    await admin
      .schema("reflexoes")
      .from("citacoes_verificadas")
      .insert(citacoesParaSalvar);
  }

  return {
    totalCitacoes: citacoesParaSalvar.length,
    validas: citacoesParaSalvar.filter((c) => c.alinhamento_valido).length,
    invalidas: citacoesParaSalvar.filter((c) => !c.alinhamento_valido).length,
  };
}
