-- ==============================================================================
-- MIGRATION 0018: OTIMIZACAO DE POLITICAS RLS
-- Rflex01
-- Objetivo: evitar reavaliacao de auth.uid() para cada linha sem alterar a
-- semantica das politicas existentes.
-- ==============================================================================

-- Biblioteca
ALTER POLICY "Usuário gerencia suas próprias obras"
ON biblioteca.obras
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

ALTER POLICY "Usuário gerencia versões de suas próprias obras"
ON biblioteca.versoes_obras
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

-- Processamento
ALTER POLICY "Usuário gerencia seus documentos processados"
ON processamento.documentos_processados
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

ALTER POLICY "Usuário gerencia suas execuções"
ON processamento.execucoes
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

ALTER POLICY "Usuário gerencia seus fragmentos"
ON processamento.fragmentos
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

ALTER POLICY "Usuário gerencia suas seções"
ON processamento.secoes
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

ALTER POLICY "Usuário gerencia suas unidades"
ON processamento.unidades_conhecimento
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

ALTER POLICY "Usuário gerencia seus vetores"
ON processamento.vetores
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

-- Taxonomia
ALTER POLICY "Usuário gerencia conceitos de fragmentos"
ON taxonomia.conceitos_fragmentos
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

-- Cérebro Autoral
ALTER POLICY "Usuário gerencia características do cérebro"
ON cerebro_autoral.caracteristicas
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

ALTER POLICY "Usuário gerencia regras do cérebro"
ON cerebro_autoral.regras
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

ALTER POLICY "Usuário gerencia versões do cérebro"
ON cerebro_autoral.versoes_cerebro
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

ALTER POLICY politica_metodologias_usuario
ON cerebro_autoral.metodologias
USING (usuario_id = (select auth.uid()))
WITH CHECK (usuario_id = (select auth.uid()));

ALTER POLICY politica_propostas_usuario
ON cerebro_autoral.propostas_atualizacao
USING (usuario_id = (select auth.uid()))
WITH CHECK (usuario_id = (select auth.uid()));

ALTER POLICY politica_etapas_metodologia
ON cerebro_autoral.etapas_metodologia
USING (
  EXISTS (
    SELECT 1
    FROM cerebro_autoral.metodologias m
    WHERE m.id = etapas_metodologia.metodologia_id
      AND m.usuario_id = (select auth.uid())
  )
);

-- Reflexões
ALTER POLICY p_entradas_usuario
ON reflexoes.entradas
USING (usuario_id = (select auth.uid()))
WITH CHECK (usuario_id = (select auth.uid()));

ALTER POLICY p_planos_usuario
ON reflexoes.planos_reflexao
USING (usuario_id = (select auth.uid()))
WITH CHECK (usuario_id = (select auth.uid()));

ALTER POLICY p_versoes_usuario
ON reflexoes.versoes_reflexao
USING (usuario_id = (select auth.uid()))
WITH CHECK (usuario_id = (select auth.uid()));

ALTER POLICY p_revisoes_usuario
ON reflexoes.revisoes_autor
USING (usuario_id = (select auth.uid()))
WITH CHECK (usuario_id = (select auth.uid()));

ALTER POLICY politica_contextos_usuario
ON reflexoes.contextos
USING (usuario_id = (select auth.uid()))
WITH CHECK (usuario_id = (select auth.uid()));

ALTER POLICY politica_citacoes_usuario
ON reflexoes.citacoes_verificadas
USING (usuario_id = (select auth.uid()))
WITH CHECK (usuario_id = (select auth.uid()));

ALTER POLICY p_citacoes_usuario
ON reflexoes.citacoes_evidencias
USING (
  EXISTS (
    SELECT 1
    FROM reflexoes.versoes_reflexao v
    WHERE v.id = citacoes_evidencias.versao_reflexao_id
      AND v.usuario_id = (select auth.uid())
  )
);

-- Auditoria
ALTER POLICY p_auditoria_usuario
ON auditoria.relatorios_auditoria
USING (usuario_id = (select auth.uid()))
WITH CHECK (usuario_id = (select auth.uid()));

ALTER POLICY politica_execucoes_ia_usuario
ON auditoria.execucoes_ia
USING (usuario_id = (select auth.uid()))
WITH CHECK (usuario_id = (select auth.uid()));

-- Sistema
ALTER POLICY p_usuarios_proprio_perfil
ON sistema.usuarios
USING (id = (select auth.uid()));

ALTER POLICY p_usuarios_atualizar_proprio
ON sistema.usuarios
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

-- Índice duplicado: preservar o índice original criado em 0006.
DROP INDEX IF EXISTS reflexoes.idx_entradas_reflexoes_usuario_id;
