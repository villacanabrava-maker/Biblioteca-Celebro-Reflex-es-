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
  estado: string;
  origem: "curadoria" | "ia" | "importacao";
  confianca: number;
  criado_em: string;
  total_fragmentos: number;
  termos_sinonimos: TermoSinonimo[];
}

export interface ArestaGrafoTaxonomia {
  relacao_id: string;
  usuario_id: string;
  tipo_relacao: TipoRelacaoOntologica;
  confianca: number;
  origem_id: string;
  origem_termo: string;
  origem_dominio: DominioTaxonomico;
  destino_id: string;
  destino_termo: string;
  destino_dominio: DominioTaxonomico;
}
