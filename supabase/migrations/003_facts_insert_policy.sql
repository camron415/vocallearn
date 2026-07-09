-- Allow authenticated users to insert facts into lessons they created
CREATE POLICY "Creators can insert facts" ON facts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_id
        AND lessons.created_by = auth.uid()
    )
  );

-- Allow lesson creators to delete their own lessons (for rollback on failed fact insert)
CREATE POLICY "Creators can delete own lessons" ON lessons
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);
