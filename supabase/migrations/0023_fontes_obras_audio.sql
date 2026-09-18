-- ==============================================================================
-- MIGRATION 0023: FONTES ORIGINAIS DE OBRAS E SUPORTE A AUDIO
-- Rflex01
-- ==============================================================================

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/epub+zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'audio/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav'
]::text[]
WHERE id = 'originais-biblioteca';

CREATE TABLE IF NOT EXISTS biblioteca.fontes_obras (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id uuid NOT NULL REFERENCES biblioteca.obras(id) ON DELETE CASCADE,
  versao_obra_id uuid REFERENCES biblioteca.versoes_obras(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_fonte text NOT NULL CHECK (tipo_fonte IN ('arquivo','audio','texto','link')),
  storage_bucket text,
  storage_caminho text,
  arquivo_nome_original text,
  arquivo_mime_type text,
  arquivo_tamanho_bytes bigint,
  hash_sha256 text,
  conteudo_extraido text,
  conteudo_confirmado text,
  metadados jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fontes_obras_obra
  ON biblioteca.fontes_obras(obra_id);

CREATE INDEX IF NOT EXISTS idx_fontes_obras_versao
  ON biblioteca.fontes_obras(versao_obra_id);

CREATE INDEX IF NOT EXISTS idx_fontes_obras_usuario
  ON biblioteca.fontes_obras(usuario_id);

CREATE INDEX IF NOT EXISTS idx_fontes_obras_tipo
  ON biblioteca.fontes_obras(tipo_fonte);

ALTER TABLE biblioteca.fontes_obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário gerencia fontes de suas obras" ON biblioteca.fontes_obras;
CREATE POLICY "Usuário gerencia fontes de suas obras"
ON biblioteca.fontes_obras
FOR ALL
TO authenticated
USING ((select auth.uid()) = usuario_id)
WITH CHECK ((select auth.uid()) = usuario_id);

DROP POLICY IF EXISTS "Service role gerencia fontes de obras" ON biblioteca.fontes_obras;
CREATE POLICY "Service role gerencia fontes de obras"
ON biblioteca.fontes_obras
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
