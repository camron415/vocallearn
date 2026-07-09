-- VocalLearn Seed Data: Memory Science – Lesson 2
-- Run this in Supabase SQL Editor AFTER seed_memory_science.sql (Lesson 1).
-- Lesson 1 UUID reference: e5f6a7b8-c9d0-1234-ef01-23456789abcd
-- Subject UUID reference:  d4e5f6a7-b8c9-0123-def0-123456789abc

-- ============================================
-- Lesson 2: The Modern Mind (1957–Present)
-- ============================================
INSERT INTO lessons (id, subject_id, title, description, order_index)
VALUES (
  'f6a7b8c9-d0e1-2345-f012-3456789abcde',
  'd4e5f6a7-b8c9-0123-def0-123456789abc',
  'The Modern Mind — Memory Science from 1957 to Today',
  'From the patient who could not form new memories to sleep science and the testing effect — how modern research revealed that memory is an active, reconstructable system, not a recording.',
  2
);

-- Facts for Lesson 2
-- Arc: H.M. (1957) → Working Memory (1974) → False Memories (1974) →
--      Reconsolidation (2000) → Testing Effect (2006) → Desirable Difficulties (1994) →
--      Interleaving → Sleep & Consolidation → Elaborative Interrogation → Synthesis
INSERT INTO facts (lesson_id, content, explanation, strictness, order_index, tags) VALUES

-- Fact 1: H.M. / Hippocampus — 1957 (high — year + specific outcome)
(
  'f6a7b8c9-d0e1-2345-f012-3456789abcde',
  'In 1957, surgeons removed patient H.M.''s hippocampi to treat his epilepsy. He could no longer form any new long-term memories, proving the hippocampus is the brain''s gateway for encoding new episodic memories.',
  'Henry Molaison (H.M.) became the most studied patient in neuroscience history. He retained memories from before the surgery and could still learn new motor skills (procedural memory), but every new experience evaporated within minutes. His case confirmed Tulving''s distinction between memory types and localized episodic memory formation to the hippocampus — bridging neuroscience and psychology for the first time.',
  'high',
  1,
  ARRAY['hippocampus', 'HM', 'henry-molaison', '1957', 'episodic-memory', 'timeline']
),

-- Fact 2: Working Memory — Baddeley & Hitch, 1974 (medium — components)
(
  'f6a7b8c9-d0e1-2345-f012-3456789abcde',
  'In 1974, Baddeley and Hitch replaced the simple short-term memory box with the working memory model — an active mental workspace with three components: the central executive (attention and control), the phonological loop (verbal information), and the visuospatial sketchpad (visual and spatial information).',
  'This was a major upgrade on the three-stage model you learned in Lesson 1. Working memory is not a passive waiting room — it''s where active thinking, reading, and reasoning happen. It explains why you can hold a conversation while walking but cannot mentally solve a math problem at the same time: both tasks compete for the central executive. A fourth component, the episodic buffer, was added by Baddeley in 2000 to handle integration across systems.',
  'medium',
  2,
  ARRAY['working-memory', 'baddeley', 'hitch', '1974', 'central-executive', 'phonological-loop', 'visuospatial-sketchpad', 'timeline']
),

-- Fact 3: False Memories — Loftus, 1974 (medium — mechanism + example)
(
  'f6a7b8c9-d0e1-2345-f012-3456789abcde',
  'In 1974, Elizabeth Loftus showed that leading questions can implant false memories. When people were asked how fast cars were going when they "smashed" versus "contacted," they later remembered seeing broken glass that was never in the video.',
  'This is Bartlett''s reconstructive memory in action — but with deliberate external manipulation. The word used in the question changed both the speed estimate and what people "remembered" seeing. Loftus later showed she could implant entirely fabricated childhood memories in adults with a few leading questions. The implications shook the legal system: police questioning, eyewitness testimony, and even therapy can create confident, vivid false memories.',
  'medium',
  3,
  ARRAY['loftus', 'false-memory', 'misinformation-effect', '1974', 'reconstructive-memory', 'timeline']
),

-- Fact 4: Memory Reconsolidation — Nader et al., 2000 (medium — mechanism)
(
  'f6a7b8c9-d0e1-2345-f012-3456789abcde',
  'Memory reconsolidation: each time you recall a memory, it briefly becomes chemically unstable and can be updated or distorted before being stored again. Recalling is not replaying — it is rewriting.',
  'Nader, Schafe, and LeDoux (2000) showed that blocking protein synthesis in rats right after a memory was triggered erased that memory permanently. This explains why memories drift with each retelling, why eyewitness accounts shift over time, and why rote repetition without variation can gradually distort what you memorize. The upside: therapists can use this window to gradually update traumatic memories by recalling them in safe, calming contexts.',
  'medium',
  4,
  ARRAY['reconsolidation', 'nader', 'memory-updating', 'timeline']
),

-- Fact 5: Testing Effect — Roediger & Karpicke, 2006 (medium — effect size + mechanism)
(
  'f6a7b8c9-d0e1-2345-f012-3456789abcde',
  'The testing effect: retrieving information from memory strengthens it far more than re-studying the same material. In Roediger and Karpicke''s 2006 study, students who took one retrieval test remembered significantly more a week later than students who re-studied the material four times.',
  'Testing isn''t just measurement — it is practice. Every retrieval attempt, even a failed one, strengthens the neural pathway for that memory. This is why VocalLearn asks you to recall facts out loud rather than just re-read them. Passive review feels productive but creates shallow, short-lived retention. Even when retrieval feels hard and you almost can''t remember, the act of struggling to retrieve is exactly what makes the memory durable.',
  'medium',
  5,
  ARRAY['testing-effect', 'retrieval-practice', 'roediger', 'karpicke', '2006', 'timeline']
),

-- Fact 6: Desirable Difficulties — Bjork, 1994 (medium — core principle)
(
  'f6a7b8c9-d0e1-2345-f012-3456789abcde',
  'Robert Bjork''s desirable difficulties principle (1994): learning strategies that feel harder — spaced practice, retrieval testing, interleaving — produce dramatically better long-term retention than massed practice, even though they feel less productive in the moment.',
  'The difficulty is "desirable" because it forces the brain to work harder at retrieval, building stronger, more durable memory traces. The inverse is equally important: strategies that feel smooth and easy — re-reading, highlighting, massed practice — feel like learning but produce rapid forgetting. Fluency during study is not a reliable signal of durable learning. This principle unifies spaced repetition, the testing effect, and interleaving into one framework.',
  'medium',
  6,
  ARRAY['desirable-difficulties', 'bjork', '1994', 'spaced-practice', 'learning-strategy', 'timeline']
),

-- Fact 7: Interleaving (low — application of desirable difficulties)
(
  'f6a7b8c9-d0e1-2345-f012-3456789abcde',
  'Interleaving means practicing different topics or problem types in a mixed order rather than finishing one type before moving to the next. It feels harder than blocked practice but leads to significantly better long-term retention and the ability to apply knowledge in new situations.',
  'In a classic study, students who practiced math problems in interleaved order (ABCABC) scored 43% higher on a delayed test than students who practiced in blocks (AAABBBCCC), even though the blocked group felt more confident during practice. Interleaving forces the brain to identify which concept applies rather than just execute a pattern it just saw — building genuine discrimination and flexible understanding. This is why VocalLearn mixes fact types within a session.',
  'low',
  7,
  ARRAY['interleaving', 'bjork', 'desirable-difficulties', 'learning-strategy', 'application']
),

-- Fact 8: Sleep & Memory Consolidation (medium — mechanism + practical rule)
(
  'f6a7b8c9-d0e1-2345-f012-3456789abcde',
  'Sleep is when the hippocampus replays the day''s experiences and transfers memories to the neocortex for long-term storage — a process called consolidation. Sleeping within 24 hours of learning dramatically reduces forgetting, well beyond what the Forgetting Curve alone predicts.',
  'Walker (2017) and Stickgold showed that the hippocampus acts as a short-term buffer during the day, then during sleep — especially REM sleep — it replays memories while the neocortex gradually absorbs them for permanent storage. A full night''s sleep after studying is worth an additional study session. Conversely, pulling an all-nighter before an exam impairs both the consolidation of what you already learned and the encoding of anything new you try to study.',
  'medium',
  8,
  ARRAY['sleep', 'consolidation', 'hippocampus', 'neocortex', 'walker', 'stickgold', 'application']
),

-- Fact 9: Elaborative Interrogation (low — extends depth of processing from L1)
(
  'f6a7b8c9-d0e1-2345-f012-3456789abcde',
  'Elaborative interrogation: asking "why is this true?" while learning, and connecting new facts to things you already know, produces significantly better retention than simply re-reading or repeating a fact. Generating meaning is the mechanism behind depth of processing.',
  'Pressley et al. (1987) showed that generating "why" explanations for facts — even obvious ones — improved recall by 50–70% compared to passive reading. This is the practical engine behind Craik and Lockhart''s depth of processing (Lesson 1): the "depth" is created by meaning connections, not just repetition. This is why VocalLearn asks you to explain facts in your own words rather than repeat them verbatim — you are generating meaning, not just echoing sounds.',
  'low',
  9,
  ARRAY['elaborative-interrogation', 'depth-of-processing', 'pressley', 'why-questioning', 'application']
),

-- Fact 10: Synthesis — the active mind (low — closes the arc)
(
  'f6a7b8c9-d0e1-2345-f012-3456789abcde',
  'Modern memory science''s central insight: memory is not a recording device but an active, reconstructable system shaped by attention, depth of processing, sleep, spaced retrieval, and emotional state. Every major finding — from Ebbinghaus to the testing effect — points to the same conclusion: passive exposure is the weakest form of learning.',
  'The full arc from Lessons 1 and 2: Ebbinghaus showed memory decays without review. Bartlett showed it rebuilds itself each time. Atkinson and Shiffrin gave it structure. Tulving divided it into types. Craik and Lockhart showed depth matters. H.M. grounded it in the hippocampus. Baddeley made working memory an active workspace. Loftus showed it can be manipulated. Reconsolidation explained why it changes. The testing effect showed retrieval beats re-study. Bjork unified it all: make learning actively difficult in the right ways, and memory becomes durable.',
  'low',
  10,
  ARRAY['synthesis', 'active-learning', 'overview', 'curriculum-close']
);
