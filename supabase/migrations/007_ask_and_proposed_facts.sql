-- VocalLearn Ask + proposed facts (Phase 0)
-- Run in Supabase SQL Editor AFTER restoring the project if paused.
--
-- Creates:
--   ask_conversations, ask_messages, proposed_facts
--   "From Ask" subject + lesson (destination for approved facts)
--
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT where possible.

-- ============================================
-- Ask conversations
-- ============================================
CREATE TABLE IF NOT EXISTS ask_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ask_conversations_user_updated
  ON ask_conversations (user_id, updated_at DESC);

ALTER TABLE ask_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ask conversations" ON ask_conversations;
CREATE POLICY "Users manage own ask conversations" ON ask_conversations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Ask messages
-- ============================================
CREATE TABLE IF NOT EXISTS ask_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ask_conversations ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ask_messages_conversation_created
  ON ask_messages (conversation_id, created_at ASC);

ALTER TABLE ask_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ask messages" ON ask_messages;
CREATE POLICY "Users manage own ask messages" ON ask_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ask_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ask_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- ============================================
-- Proposed facts (approval queue)
-- ============================================
CREATE TABLE IF NOT EXISTS proposed_facts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  source_conversation_id UUID REFERENCES ask_conversations ON DELETE SET NULL,
  source_message_id UUID REFERENCES ask_messages ON DELETE SET NULL,
  content TEXT NOT NULL,
  explanation TEXT,
  tags TEXT[],
  why_worth_learning TEXT,
  confidence FLOAT NOT NULL DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  dedup_of_fact_id UUID REFERENCES facts ON DELETE SET NULL,
  approved_fact_id UUID REFERENCES facts ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_proposed_facts_user_status
  ON proposed_facts (user_id, status, created_at DESC);

ALTER TABLE proposed_facts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own proposed facts" ON proposed_facts;
CREATE POLICY "Users manage own proposed facts" ON proposed_facts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- From Ask subject + lesson (Practice destination)
-- Fixed UUIDs so the app can find them reliably.
-- ============================================
INSERT INTO subjects (id, name, description, icon, is_community)
VALUES (
  'd0e1f2a3-b4c5-4678-9abc-def012345601',
  'From Ask',
  'Facts you approved from Ask conversations — your personal review deck.',
  '💬',
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

INSERT INTO lessons (id, subject_id, title, description, order_index, is_community)
VALUES (
  'e1f2a3b4-c5d6-4789-abcd-ef0123456702',
  'd0e1f2a3-b4c5-4678-9abc-def012345601',
  'My Ask Facts',
  'Approved facts mined from your Ask chats. Practice these with the normal voice tutor.',
  1,
  false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Allow any authenticated user to add facts into the shared From Ask lesson
DROP POLICY IF EXISTS "Users can insert facts into From Ask lesson" ON facts;
CREATE POLICY "Users can insert facts into From Ask lesson" ON facts
  FOR INSERT TO authenticated
  WITH CHECK (lesson_id = 'e1f2a3b4-c5d6-4789-abcd-ef0123456702');

