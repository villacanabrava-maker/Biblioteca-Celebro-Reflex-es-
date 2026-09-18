-- ==============================================================================
-- MIGRATION 0022: ORIGEM DA BIBLIOTECA NA ESTEIRA DE REFLEXOES
-- Permite registrar explicitamente que a materia-prima principal veio de uma
-- obra canonica da Biblioteca.
-- ==============================================================================

ALTER TABLE reflexoes.entradas
  DROP CONSTRAINT IF EXISTS entradas_tipo_origem_externa_check;

ALTER TABLE reflexoes.entradas
  ADD CONSTRAINT entradas_tipo_origem_externa_check
  CHECK (
    tipo_origem_externa IS NULL
    OR tipo_origem_externa = ANY (
      ARRAY[
        'texto'::text,
        'artigo'::text,
        'mensagem'::text,
        'documento'::text,
        'audio_transcricao'::text,
        'biblioteca'::text,
        'observacao'::text
      ]
    )
  );
