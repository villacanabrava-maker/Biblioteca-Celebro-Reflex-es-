import type {
  AlteracaoEdicaoAutor,
  DiffEdicaoAutor,
} from "@/tipos/reflexoes";

type TipoTrecho = "mantido" | "adicionado" | "removido";

interface TrechoDiff {
  tipo: TipoTrecho;
  texto: string;
}

const MAX_UNIDADES_DETALHADAS = 3000;
const MAX_BLOCOS = 1800;

function contarPalavras(texto: string): number {
  return (
    texto.match(/[\p{L}\p{M}\p{N}_]+(?:['’][\p{L}\p{M}\p{N}_]+)*/gu) || []
  ).length;
}

function normalizarEspaco(token: string): string {
  if (!/^\s+$/u.test(token)) return token;
  return token.includes("\n") || token.includes("\r") ? "\n" : " ";
}

function tokenizarPalavras(texto: string): string[] {
  const tokens =
    texto.match(/\s+|[\p{L}\p{M}\p{N}_]+(?:['’][\p{L}\p{M}\p{N}_]+)*|[^\s\p{L}\p{M}\p{N}_]+/gu) || [];

  return tokens.map(normalizarEspaco);
}

function segmentarBlocos(texto: string): string[] {
  const paragrafos = texto
    .split(/\n{2,}/u)
    .map((bloco) => bloco.trim())
    .filter(Boolean);

  if (paragrafos.length > 1 && paragrafos.length <= MAX_BLOCOS) {
    return paragrafos;
  }

  const palavras = texto.trim().split(/\s+/u).filter(Boolean);
  const blocos: string[] = [];
  const tamanhoBloco = 80;

  for (let indice = 0; indice < palavras.length; indice += tamanhoBloco) {
    blocos.push(palavras.slice(indice, indice + tamanhoBloco).join(" "));
    if (blocos.length >= MAX_BLOCOS) break;
  }

  return blocos;
}

function juntarTrechoAnterior(trechos: TrechoDiff[], tipo: TipoTrecho, texto: string) {
  if (!texto) return;

  const ultimo = trechos[trechos.length - 1];
  if (ultimo?.tipo === tipo) {
    ultimo.texto += texto;
    return;
  }

  trechos.push({ tipo, texto });
}

function diferenciarUnidades(antes: string[], depois: string[]): TrechoDiff[] {
  const linhas = antes.length + 1;
  const colunas = depois.length + 1;
  const matriz = Array.from({ length: linhas }, () => new Uint16Array(colunas));

  for (let i = antes.length - 1; i >= 0; i--) {
    const atual = matriz[i];
    const proxima = matriz[i + 1];

    for (let j = depois.length - 1; j >= 0; j--) {
      atual[j] =
        antes[i] === depois[j]
          ? proxima[j + 1] + 1
          : Math.max(proxima[j], atual[j + 1]);
    }
  }

  const trechos: TrechoDiff[] = [];
  let i = 0;
  let j = 0;

  while (i < antes.length && j < depois.length) {
    if (antes[i] === depois[j]) {
      juntarTrechoAnterior(trechos, "mantido", antes[i]);
      i++;
      j++;
      continue;
    }

    if (matriz[i + 1][j] >= matriz[i][j + 1]) {
      juntarTrechoAnterior(trechos, "removido", antes[i]);
      i++;
    } else {
      juntarTrechoAnterior(trechos, "adicionado", depois[j]);
      j++;
    }
  }

  while (i < antes.length) {
    juntarTrechoAnterior(trechos, "removido", antes[i]);
    i++;
  }

  while (j < depois.length) {
    juntarTrechoAnterior(trechos, "adicionado", depois[j]);
    j++;
  }

  return trechos;
}

function normalizarTrechosPorBloco(trechos: TrechoDiff[]): TrechoDiff[] {
  return trechos.map((trecho) => {
    if (trecho.tipo === "mantido") {
      return { ...trecho, texto: trecho.texto };
    }

    return {
      ...trecho,
      texto: trecho.texto.trim(),
    };
  });
}

function consolidarAlteracoes(trechos: TrechoDiff[]): AlteracaoEdicaoAutor[] {
  const alteracoes: AlteracaoEdicaoAutor[] = [];
  let removido = "";
  let adicionado = "";

  function finalizar() {
    const antes = removido.trim();
    const depois = adicionado.trim();

    removido = "";
    adicionado = "";

    if (!antes && !depois) return;
    if (antes === depois) return;

    const tipo: AlteracaoEdicaoAutor["tipo"] =
      antes && depois ? "substituicao" : antes ? "remocao" : "adicao";

    alteracoes.push({
      tipo,
      antes,
      depois,
      palavras_removidas: contarPalavras(antes),
      palavras_adicionadas: contarPalavras(depois),
    });
  }

  for (const trecho of trechos) {
    if (trecho.tipo === "mantido") {
      finalizar();
      continue;
    }

    if (trecho.tipo === "removido") {
      removido += trecho.texto;
    } else {
      adicionado += trecho.texto;
    }
  }

  finalizar();
  return alteracoes;
}

export function calcularDiffEdicaoAutor({
  versaoBaseId,
  versaoEditadaId,
  antes,
  depois,
}: {
  versaoBaseId: string;
  versaoEditadaId: string;
  antes: string;
  depois: string;
}): DiffEdicaoAutor {
  const tokensAntes = tokenizarPalavras(antes);
  const tokensDepois = tokenizarPalavras(depois);

  let estrategia: DiffEdicaoAutor["estrategia"] = "palavra";
  let trechos: TrechoDiff[];

  if (
    tokensAntes.length <= MAX_UNIDADES_DETALHADAS &&
    tokensDepois.length <= MAX_UNIDADES_DETALHADAS
  ) {
    trechos = diferenciarUnidades(tokensAntes, tokensDepois);
  } else {
    estrategia = "bloco";
    const blocosAntes = segmentarBlocos(antes);
    const blocosDepois = segmentarBlocos(depois);
    trechos = normalizarTrechosPorBloco(
      diferenciarUnidades(blocosAntes, blocosDepois)
    );
  }

  const alteracoes = consolidarAlteracoes(trechos);
  const palavrasRemovidas = alteracoes.reduce(
    (total, alteracao) => total + alteracao.palavras_removidas,
    0
  );
  const palavrasAdicionadas = alteracoes.reduce(
    (total, alteracao) => total + alteracao.palavras_adicionadas,
    0
  );
  const totalPalavrasBase = contarPalavras(antes);
  const totalPalavrasEditada = contarPalavras(depois);
  const denominador = Math.max(totalPalavrasBase + totalPalavrasEditada, 1);
  const percentualAlteracao = Math.min(
    100,
    Number(
      (((palavrasRemovidas + palavrasAdicionadas) / denominador) * 100).toFixed(1)
    )
  );

  return {
    versao_base_id: versaoBaseId,
    versao_editada_id: versaoEditadaId,
    estrategia,
    alteracoes,
    total_palavras_base: totalPalavrasBase,
    total_palavras_editada: totalPalavrasEditada,
    palavras_removidas: palavrasRemovidas,
    palavras_adicionadas: palavrasAdicionadas,
    blocos_alterados: alteracoes.length,
    percentual_alteracao: percentualAlteracao,
  };
}
