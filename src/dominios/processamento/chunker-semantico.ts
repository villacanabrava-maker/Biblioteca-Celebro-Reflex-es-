export interface SecaoCandidata {
  ordem: number;
  nivel: number;
  titulo: string;
  tipoSecao: string;
  conteudo: string;
}

export interface FragmentoCandidato {
  ordem: number;
  ordemSecao: number;
  conteudo: string;
  totalPalavras: number;
  totalCaracteres: number;
  totalTokensEstimado: number;
  posicaoInicioChar: number;
  posicaoFimChar: number;
}

export interface ResultadoChunkingSemantico {
  secoes: SecaoCandidata[];
  fragmentos: FragmentoCandidato[];
}

const PADROES_SECAO = [
  /^(?:#+\s+|cap[ií]tulo\s+\d+|parte\s+\d+|se[çc][aã]o\s+\d+|ensaio\s+\d+|pr[oó]logo|ep[ií]logo|introdu[çc][aã]o|conclus[aã]o)(.*)$/im,
  /^[A-ZÁÀÂÃÉÈÊÍÏÓÒÔÕÚÜÇ\s]{4,60}$/m, // Títulos em caixa alta isolados
];

/**
 * Segmenta um texto contínuo em seções estruturais e fragmentos reflexivos atômicos
 * sem interromper raciocínios ou cortar sentenças ao meio.
 */
export function executarChunkingSemantico(
  textoCompleto: string,
  tituloPadrao: string = "Seção Principal",
  alvoPalavrasPorFragmento: number = 380,
  minPalavrasPorFragmento: number = 100
): ResultadoChunkingSemantico {
  const linhas = textoCompleto.split("\n");
  const secoes: SecaoCandidata[] = [];

  let secaoAtualTitulo = tituloPadrao;
  let secaoAtualLinhas: string[] = [];
  let ordemSecao = 1;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    const ehCabecalho =
      linha.length > 3 &&
      linha.length < 90 &&
      PADROES_SECAO.some((padrao) => padrao.test(linha));

    if (ehCabecalho && secaoAtualLinhas.length > 0) {
      // Salva seção anterior
      const textoSecao = secaoAtualLinhas.join("\n").trim();
      if (textoSecao.length > 50) {
        secoes.push({
          ordem: ordemSecao++,
          nivel: 1,
          titulo: secaoAtualTitulo,
          tipoSecao: "capitulo",
          conteudo: textoSecao,
        });
      }
      secaoAtualTitulo = linha.replace(/^#+\s*/, "");
      secaoAtualLinhas = [];
    } else {
      secaoAtualLinhas.push(linhas[i]);
    }
  }

  // Adiciona a última seção
  if (secaoAtualLinhas.length > 0) {
    const textoSecao = secaoAtualLinhas.join("\n").trim();
    if (textoSecao.length > 0) {
      secoes.push({
        ordem: ordemSecao++,
        nivel: 1,
        titulo: secaoAtualTitulo,
        tipoSecao: "capitulo",
        conteudo: textoSecao,
      });
    }
  }

  // Fallback caso nenhuma seção tenha sido isolada
  if (secoes.length === 0) {
    secoes.push({
      ordem: 1,
      nivel: 1,
      titulo: tituloPadrao,
      tipoSecao: "geral",
      conteudo: textoCompleto,
    });
  }

  // 2. Fragmentação por parágrafos com respeito semântico
  const fragmentos: FragmentoCandidato[] = [];
  let ordemFragmentoGlobal = 1;
  let posicaoCharAtual = 0;

  for (const secao of secoes) {
    const paragrafos = secao.conteudo
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let bufferFragmento: string[] = [];
    let contagemPalavrasBuffer = 0;
    let inicioCharFragmento = posicaoCharAtual;

    for (const paragrafo of paragrafos) {
      const palavrasParagrafo = paragrafo.split(/\s+/).filter(Boolean).length;

      // Se adicionar este parágrafo excede o limite e já temos um fragmento sólido
      if (
        contagemPalavrasBuffer + palavrasParagrafo > alvoPalavrasPorFragmento &&
        contagemPalavrasBuffer >= minPalavrasPorFragmento
      ) {
        const conteudo = bufferFragmento.join("\n\n").trim();
        const chars = conteudo.length;

        fragmentos.push({
          ordem: ordemFragmentoGlobal++,
          ordemSecao: secao.ordem,
          conteudo,
          totalPalavras: contagemPalavrasBuffer,
          totalCaracteres: chars,
          totalTokensEstimado: Math.ceil(chars / 3.8),
          posicaoInicioChar: inicioCharFragmento,
          posicaoFimChar: inicioCharFragmento + chars,
        });

        bufferFragmento = [paragrafo];
        contagemPalavrasBuffer = palavrasParagrafo;
        inicioCharFragmento += chars + 2;
      } else {
        bufferFragmento.push(paragrafo);
        contagemPalavrasBuffer += palavrasParagrafo;
      }
    }

    // Salva o último fragmento residual da seção
    if (bufferFragmento.length > 0) {
      const conteudo = bufferFragmento.join("\n\n").trim();
      const chars = conteudo.length;

      fragmentos.push({
        ordem: ordemFragmentoGlobal++,
        ordemSecao: secao.ordem,
        conteudo,
        totalPalavras: contagemPalavrasBuffer,
        totalCaracteres: chars,
        totalTokensEstimado: Math.ceil(chars / 3.8),
        posicaoInicioChar: inicioCharFragmento,
        posicaoFimChar: inicioCharFragmento + chars,
      });

      posicaoCharAtual = inicioCharFragmento + chars + 2;
    }
  }

  return { secoes, fragmentos };
}
