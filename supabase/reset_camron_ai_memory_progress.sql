-- Reset Camron's AI Systems + Memory Science learning state.
-- Run in the Supabase SQL Editor with elevated privileges.
-- This fully clears review timers and lesson completions for those two subjects.

BEGIN;

DELETE FROM user_fact_progress
WHERE user_id = '133d105a-179b-4c96-9150-0b2efc534ce1'
  AND fact_id IN (
    SELECT id
    FROM facts
    WHERE lesson_id IN (
      'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      'c3d4e5f6-a7b8-9012-cdef-012345678902',
      'e5f60718-c9da-1234-ef01-234567899004',
      'f6071829-d0eb-2345-f012-3456789a9005',
      '0718293a-e1fc-3456-a123-456789ab9006',
      '18293a4b-f20d-4567-b234-56789abc9007',
      '293a4b5c-031e-5678-c345-6789abcd9008',
      '3a4b5c6d-142f-6789-d456-789abcde9009',
      '4b5c6d7e-2530-789a-e567-89abcdef9010',
      '5c6d7e8f-3641-89ab-f678-9abcdef09011',
      '6d7e8f90-4752-9abc-a789-abcdef019012',
      'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
      'f6a7b8c9-d0e1-2345-f012-3456789abcde'
    )
  );

DELETE FROM lesson_completions
WHERE user_id = '133d105a-179b-4c96-9150-0b2efc534ce1'
  AND lesson_id IN (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'c3d4e5f6-a7b8-9012-cdef-012345678902',
    'e5f60718-c9da-1234-ef01-234567899004',
    'f6071829-d0eb-2345-f012-3456789a9005',
    '0718293a-e1fc-3456-a123-456789ab9006',
    '18293a4b-f20d-4567-b234-56789abc9007',
    '293a4b5c-031e-5678-c345-6789abcd9008',
    '3a4b5c6d-142f-6789-d456-789abcde9009',
    '4b5c6d7e-2530-789a-e567-89abcdef9010',
    '5c6d7e8f-3641-89ab-f678-9abcdef09011',
    '6d7e8f90-4752-9abc-a789-abcdef019012',
    'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
    'f6a7b8c9-d0e1-2345-f012-3456789abcde'
  );

DELETE FROM leaderboard_entries
WHERE user_id = '133d105a-179b-4c96-9150-0b2efc534ce1'
  AND subject_id IN (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'd4e5f6a7-b8c9-0123-def0-123456789abc'
  );

COMMIT;