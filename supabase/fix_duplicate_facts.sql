-- Fix duplicate facts caused by running seed multiple times before ON CONFLICT was added.
-- Facts use auto-generated UUIDs so ON CONFLICT (id) never fires — each run creates
-- fresh rows. This deletes the duplicates, keeping the oldest row per (lesson_id, order_index).
--
-- Safe to run multiple times. Only targets AI Systems, Finance, and Memory Science lessons.
-- Run this FIRST before running 004_facts_unique_index.sql.

-- ── AI Systems (Lessons 1, 2, 3) ─────────────────────────────────────────────
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY lesson_id, order_index ORDER BY ctid) AS rn
  FROM facts
  WHERE lesson_id IN (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'c3d4e5f6-a7b8-9012-cdef-012345678902',
    'd4e5f6a7-b8c9-0123-def0-123456789903'
  )
)
DELETE FROM facts WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- ── All other lessons (any subject) ──────────────────────────────────────────
-- Catches duplicates in Finance and Memory Science if their seeds were also re-run.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY lesson_id, order_index ORDER BY ctid) AS rn
  FROM facts
)
DELETE FROM facts WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
