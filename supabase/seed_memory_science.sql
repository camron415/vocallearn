-- VocalLearn Seed Data: Memory Science
-- Run this in Supabase SQL Editor AFTER seed.sql (Finance Basics)

-- ============================================
-- Subject: Memory Science
-- ============================================
INSERT INTO subjects (id, name, description, icon, is_community)
VALUES (
  'd4e5f6a7-b8c9-0123-def0-123456789abc',
  'Memory Science',
  'The science of how memory works — from Ebbinghaus to modern neuroscience. Learn the research that VocalLearn itself is built on.',
  '🧠',
  false
);

-- ============================================
-- Lesson 1: Memory Science – The First 90 Years (1885–1972)
-- ============================================
INSERT INTO lessons (id, subject_id, title, description, order_index)
VALUES (
  'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
  'd4e5f6a7-b8c9-0123-def0-123456789abc',
  'Memory Science – The First 90 Years',
  'Five discoveries from 1885 to 1972 that changed how we understand memory. Ebbinghaus, Bartlett, Atkinson & Shiffrin, Tulving, and Craik & Lockhart.',
  1
);

-- Facts for Lesson 1
-- Ordered to build the timeline progressively
INSERT INTO facts (lesson_id, content, explanation, strictness, order_index, tags) VALUES

-- Fact 1: Ebbinghaus (high — specific year and percentage)
(
  'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
  'In 1885, Hermann Ebbinghaus discovered the Forgetting Curve — we lose about 50% of new information within the first hour without review.',
  'Ebbinghaus memorized thousands of nonsense syllables on himself and precisely tracked how quickly he forgot them. His Forgetting Curve shows rapid initial decay that flattens with spaced review. This is why VocalLearn reviews facts before you forget them.',
  'high',
  1,
  ARRAY['ebbinghaus', 'forgetting-curve', '1885', 'timeline']
),

-- Fact 2: Bartlett (medium — year and core idea)
(
  'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
  'In 1932, Frederic Bartlett showed that memory is reconstructive, not a recording — we rebuild memories each time we recall them, filling in gaps with our own assumptions.',
  'Bartlett had people read a Native American folk tale called "War of the Ghosts" and retell it later. Details shifted to match the readers'' own cultural expectations. Memory is an active reconstruction, not a playback.',
  'medium',
  2,
  ARRAY['bartlett', 'reconstructive-memory', '1932', 'timeline']
),

-- Fact 3: Atkinson & Shiffrin — three-stage model (high — year and three stages)
(
  'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
  'In 1968, Atkinson and Shiffrin proposed the three-stage memory model: sensory memory (milliseconds), short-term memory (about 7 chunks for 15–30 seconds), and long-term memory (practically limitless).',
  'This modal model was a landmark: it gave researchers a clear structure to work with. Short-term memory is the bottleneck — everything entering long-term memory must pass through it. The "7 chunks" limit (Miller''s Law) is why learning in small groups is more effective.',
  'high',
  3,
  ARRAY['atkinson-shiffrin', 'three-stage-model', '1968', 'short-term-memory', 'timeline']
),

-- Fact 4: Tulving (medium — year and three types)
(
  'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
  'In 1972, Endel Tulving split long-term memory into three types: episodic memory (personal experiences), semantic memory (facts and knowledge), and procedural memory (skills and habits).',
  'Tulving noticed that amnesia patients could lose one type while keeping another — a patient might forget their own wedding (episodic) but still know how to ride a bike (procedural). This showed long-term memory is not one thing but several systems.',
  'medium',
  4,
  ARRAY['tulving', 'episodic-memory', 'semantic-memory', 'procedural-memory', '1972', 'timeline']
),

-- Fact 5: Craik & Lockhart — depth of processing (medium — year and core principle)
(
  'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
  'Also in 1972, Craik and Lockhart showed that the deeper you process information — connecting it to meaning, explaining it, teaching it — the better you remember it. Shallow processing (just repeating words) leads to weak memory.',
  'This is the scientific basis for the production effect: speaking or writing explanations in your own words forces deep processing. Highlighting a textbook is shallow processing. Explaining it to a friend is deep. VocalLearn is built on this insight.',
  'medium',
  5,
  ARRAY['craik-lockhart', 'depth-of-processing', '1972', 'production-effect', 'timeline']
),

-- Fact 6: The overall timeline (low — big picture synthesis)
(
  'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
  'The memory science timeline: 1885 Ebbinghaus forgetting curve, 1932 Bartlett reconstructive memory, 1968 Atkinson & Shiffrin three-stage model, 1972 Tulving three types of long-term memory, 1972 Craik & Lockhart depth of processing.',
  'Being able to recall the full timeline in order is a sign you''ve built connected knowledge, not just isolated facts. Spaced repetition works best when facts are networked with each other.',
  'low',
  6,
  ARRAY['timeline', 'synthesis', 'overview']
),

-- Fact 7: Ebbinghaus practical implication (low — application)
(
  'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
  'The practical implication of the Forgetting Curve: reviewing material at spaced intervals — after 1 day, 3 days, 1 week, then monthly — dramatically slows forgetting and moves information into long-term memory.',
  'Without review, you forget 70–80% within a week. With spaced review, you can retain over 90% long-term with only a fraction of the study time. This is the entire premise of spaced repetition systems like VocalLearn.',
  'low',
  7,
  ARRAY['ebbinghaus', 'spaced-repetition', 'application']
),

-- Fact 8: Short-term memory limits (medium — specific numbers)
(
  'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
  'Short-term memory holds about 7 chunks of information for 15 to 30 seconds without rehearsal. A chunk is a meaningful unit — a word, a digit, or even a concept you already understand.',
  'Miller''s Law (1956) established the 7±2 limit. Chunking is why phone numbers are grouped in sets of 3-4 digits. Expert chess players see the board as ~5 chunks (patterns) while beginners see 30+ individual pieces.',
  'medium',
  8,
  ARRAY['short-term-memory', 'chunking', 'miller', 'capacity']
),

-- Fact 9: Reconstructive memory implication (low — application)
(
  'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
  'Because memory is reconstructive (Bartlett), eyewitness testimony is unreliable — memories change each time we recall them, especially under suggestion or stress.',
  'This has major implications in law, education, and therapy. Every time you remember something, you are slightly rewriting it. The good news: this same reconstructive quality means you can use active recall to strengthen and correct memories.',
  'low',
  9,
  ARRAY['bartlett', 'reconstructive-memory', 'application']
),

-- Fact 10: Production effect (medium — key principle for VocalLearn)
(
  'e5f6a7b8-c9d0-1234-ef01-23456789abcd',
  'The production effect: information you speak out loud or write in your own words is remembered significantly better than information you read silently. Speaking forces active engagement with the material.',
  'MacLeod et al. (2010) confirmed that reading aloud produces 10–25% better recall than silent reading. Speaking your own explanation (not just repeating words) activates depth of processing. This is why VocalLearn asks you to explain facts out loud.',
  'medium',
  10,
  ARRAY['production-effect', 'active-recall', 'depth-of-processing', 'application']
);
