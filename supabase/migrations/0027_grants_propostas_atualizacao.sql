-- ==============================================================================
-- MIGRATION 0027: GRANTS DA FILA DE APRENDIZADO AUTORAL
-- Rflex01
--
-- A tabela cerebro_autoral.propostas_atualizacao possui RLS e e acessada
-- exclusivamente pelo backend via service_role. A criacao historica da tabela
-- nao concedeu os privilegios de tabela ao role, causando "permission denied"
-- nas Server Actions do Cerebro.
--
-- Nao concedemos acesso direto a authenticated/anon: a decisao do autor
-- continua passando pelas Server Actions, que validam ownership e estado.
-- ==============================================================================

REVOKE ALL ON TABLE cerebro_autoral.propostas_atualizacao FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE cerebro_autoral.propostas_atualizacao
  TO service_role;

NOTIFY pgrst, 'reload schema';
