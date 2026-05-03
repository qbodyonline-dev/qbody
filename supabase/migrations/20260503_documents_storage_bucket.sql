-- ═══════════════════════════════════════════════════════════
-- Documents storage bucket
-- Создаём bucket "documents" на уровне SQL, чтобы не зависеть
-- от runtime-вызова supabase.storage.createBucket() (который
-- может падать молча из-за глобальных настроек проекта).
-- Идемпотентная миграция — безопасно прогонять много раз.
-- ═══════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- private bucket; доступ только через signed URLs
  52428800, -- 50 MB (лимит проекта Supabase)
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'application/epub+zip',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS политики на storage.objects для bucket 'documents'.
-- Все операции через API идут от service_role (обходит RLS).
-- Загрузка с клиента происходит через signed upload URL — токен
-- уже даёт авторизацию, RLS не требуется.
-- Скачивание — тоже через signed URL.
-- Поэтому достаточно явно запретить прямой доступ.

DROP POLICY IF EXISTS "documents_no_public_read" ON storage.objects;
DROP POLICY IF EXISTS "documents_no_public_write" ON storage.objects;

-- Никто кроме service_role не может читать/писать напрямую.
-- (Эти политики ничего не разрешают — они просто декларативно
-- закрепляют запрет; RLS включён в storage.objects по умолчанию.)
