-- Remove the out-of-place AI course lesson "AI in Production Apps".
-- Safe to run in the Supabase SQL Editor.
-- Deletes cascade to facts, progress, lesson completions, and session interactions.

BEGIN;

DELETE FROM lessons
WHERE id = 'd4e5f6a7-b8c9-0123-def0-123456789903'
RETURNING id, title;

COMMIT;