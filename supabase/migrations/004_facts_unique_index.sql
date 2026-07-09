-- Migration 004: Unique constraint on facts (lesson_id, order_index)
-- Prevents duplicate fact rows if a seed file is applied more than once.
-- Run AFTER fix_duplicate_facts.sql (constraint will fail if duplicates still exist).

ALTER TABLE facts
  ADD CONSTRAINT facts_lesson_order_unique UNIQUE (lesson_id, order_index);
