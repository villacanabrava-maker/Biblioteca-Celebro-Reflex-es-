-- 0010_seeds_versoes_base
-- Registra as versões técnicas mínimas necessárias para que o Pipeline Documental
-- possa criar execuções com proveniência/versionamento desde o primeiro documento.
-- Não cria conceitos taxonômicos nem escolhe modelos de IA.

insert into taxonomia.versoes (
  numero_versao,
  descricao,
  estado,
  ativado_em
)
values (
  '1.0',
  'Taxonomia Mestre v1.0 — versão base canônica definida pelo Dicionário Mestre de Dados e Taxonomia.',
  'ativa',
  now()
)
on conflict (numero_versao) do nothing;

insert into sistema.versoes_pipeline (
  numero_versao,
  descricao,
  hash_configuracao,
  estado,
  ativado_em
)
values (
  '1.0',
  'Pipeline Documental v1.0 — configuração base canônica para processamento versionado e idempotente.',
  'c1a57497ee66838c9879cbbf98570b70ce10ecb3347232485a29051cf5dcc2b1',
  'ativa',
  now()
)
on conflict (numero_versao) do nothing;
