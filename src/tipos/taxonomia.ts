/**
 * Tipos canônicos do domínio da Taxonomia Semântica
 * Idioma: Português do Brasil
 */

export type DominioTaxonomico =
  | "intelectual"
  | "axiologico"
  | "reflexivo"
  | "narrativo"
  | "entidades"
  | "temporal"
  | "retorico"
  | "linguistico"
  | "estrutural"
  | "autoral";

export type TipoTermo =
  | "preferencial"
  | "alternativo"
  | "sinonimo"
  | "historico"
  | "oculto_busca";

export type EstadoConceitoTaxonomico =
  | "ativo"
  | "revisao"
  | "rejeitado"
  | "obsoleto";

export type OrigemConceitoTaxonomico = "curadoria" | "ia" | "importacao";

export type EstadoRelacaoTaxonomica = "ativo" | "revisao" | "rejeitado";

export type TipoRelacaoOntologica =
  | "mais_amplo"
  | "mais_especifico"
  | "relacionado"
  | "contrasta_com"
  | "deriva_de"
  | "evolui_para"
  | "associado_a";

export interface TermoSinonimo {
  id: string;
  termo: string;
  tipo: TipoTermo;
}

export interface ConceitoTaxonomico {
  id: string;
  usuario_id: string;
  codigo: string;
  termo_preferencial: string;
  definicao: string;
  dominio: DominioTaxonomico;
  estado: EstadoConceitoTaxonomico;
  origem: OrigemConceitoTaxonomico;
  confianca: number;
  criado_em: string;
  total_fragmentos: number;
  total_reflexoes: number;
  termos_sinonimos: TermoSinonimo[];
}

export interface ArestaGrafoTaxonomia {
  relacao_id: string;
  usuario_id: string;
  tipo_relacao: TipoRelacaoOntologica;
  confianca: number;
  origem: "curadoria" | "ia" | "importacao";
  estado: EstadoRelacaoTaxonomica;
  origem_id: string;
  origem_termo: string;
  origem_dominio: DominioTaxonomico;
  destino_id: string;
  destino_termo: string;
  destino_dominio: DominioTaxonomico;
}


export type TipoOrigemAnaliseTaxonomica = "documento" | "reflexao";
export type EstadoAnaliseTaxonomica = "em_execucao" | "concluida" | "falha";

export interface AnaliseTaxonomica {
  id: string;
  usuario_id: string;
  tipo_origem: TipoOrigemAnaliseTaxonomica;
  documento_processado_id?: string | null;
  versao_reflexao_id?: string | null;
  pipeline_versao: string;
  estado: EstadoAnaliseTaxonomica;
  total_conceitos_propostos: number;
  total_conceitos_reutilizados: number;
  resultado: Record<string, unknown>;
  erro_mensagem?: string | null;
  criado_em: string;
  atualizado_em: string;
  concluido_em?: string | null;
}
