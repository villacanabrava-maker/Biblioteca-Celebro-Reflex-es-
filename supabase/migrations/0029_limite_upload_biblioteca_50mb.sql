-- ==============================================================================
-- MIGRATION 0029: LIMITE DE UPLOAD DA BIBLIOTECA EM 50 MB
-- ============================================================================== 

UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'originais-biblioteca';
