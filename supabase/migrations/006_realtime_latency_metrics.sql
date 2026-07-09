ALTER TABLE session_interactions
  ADD COLUMN IF NOT EXISTS realtime_first_audio_ms INT,
  ADD COLUMN IF NOT EXISTS realtime_response_done_ms INT;
