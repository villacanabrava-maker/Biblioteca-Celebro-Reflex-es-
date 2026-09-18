-- ==============================================================================
-- MIGRATION 0021: FONTES CANONICAS DA ESTEIRA DE REFLEXAO
-- Rflex01
-- Separa a materia-prima da reflexao da propria entrada, preservando proveniencia
-- para texto, documento, link, audio e obras da Biblioteca.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS reflexoes.fontes_entrada (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrada_id uuid NOT NULL REFERENCES reflexoes.entradas(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_fonte text NOT NULL CHECK (
    tipo_fonte = ANY (ARRAY['texto'::text,'documento'::text,'link'::text,'audio'::text,'biblioteca'::text])
  ),
  titulo text,
  autor_nome text,
  url_origem text,
  obra_id uuid REFERENCES biblioteca.obras(id) ON DELETE SET NULL,
  storage_bucket text,
  storage_caminho text,
  arquivo_nome_original text,
  arquivo_mime_type text,
  arquivo_tamanho_bytes bigint CHECK (arquivo_tamanho_bytes IS NULL OR arquivo_tamanho_bytes >= 0),
  hash_sha256 text,
  conteudo_extraido text NOT NULL DEFAULT '',
  conteudo_confirmado text,
  estado text NOT NULL DEFAULT 'pronta'
    CHECK (estado = ANY (ARRAY['pronta'::text,'falha'::text])),
  erro_processamento text,
  metadados jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fontes_entrada_entrada
  ON reflexoes.fontes_entrada(entrada_id);

CREATE INDEX IF NOT EXISTS idx_fontes_entrada_usuario
  ON reflexoes.fontes_entrada(usuario_id);

CREATE INDEX IF NOT EXISTS idx_fontes_entrada_tipo
  ON reflexoes.fontes_entrada(tipo_fonte);

CREATE INDEX IF NOT EXISTS idx_fontes_entrada_obra
  ON reflexoes.fontes_entrada(obra_id)
  WHERE obra_id IS NOT NULL;

ALTER TABLE reflexoes.fontes_entrada ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_fontes_entrada_usuario ON reflexoes.fontes_entrada;
CREATE POLICY p_fontes_entrada_usuario
ON reflexoes.fontes_entrada
FOR ALL
TO authenticated
USING (usuario_id = (SELECT auth.uid()))
WITH CHECK (usuario_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS p_fontes_entrada_service ON reflexoes.fontes_entrada;
CREATE POLICY p_fontes_entrada_service
ON reflexoes.fontes_entrada
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_fontes_entrada_atualizado_em ON reflexoes.fontes_entrada;
CREATE TRIGGER trg_fontes_entrada_atualizado_em
BEFORE UPDATE ON reflexoes.fontes_entrada
FOR EACH ROW
EXECUTE FUNCTION sistema.atualizar_coluna_atualizado_em();

-- Bucket privado unico para materias-primas de reflexoes.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'fontes-reflexoes',
  'fontes-reflexoes',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'audio/webm',
    'audio/wav',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Upload de fontes de reflexao pelo proprietario" ON storage.objects;
CREATE POLICY "Upload de fontes de reflexao pelo proprietario"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fontes-reflexoes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Leitura de fontes de reflexao pelo proprietario" ON storage.objects;
CREATE POLICY "Leitura de fontes de reflexao pelo proprietario"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'fontes-reflexoes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Atualizacao de fontes de reflexao pelo proprietario" ON storage.objects;
CREATE POLICY "Atualizacao de fontes de reflexao pelo proprietario"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'fontes-reflexoes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
  bucket_id = 'fontes-reflexoes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Exclusao de fontes de reflexao pelo proprietario" ON storage.objects;
CREATE POLICY "Exclusao de fontes de reflexao pelo proprietario"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'fontes-reflexoes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Service role gerencia fontes de reflexao" ON storage.objects;
CREATE POLICY "Service role gerencia fontes de reflexao"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'fontes-reflexoes')
WITH CHECK (bucket_id = 'fontes-reflexoes');

GRANT SELECT, INSERT, UPDATE, DELETE
ON reflexoes.fontes_entrada
TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
