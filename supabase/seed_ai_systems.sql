-- VocalLearn Seed Data: How AI Systems Work
-- Bootstrap SQL for the original 3 AI lessons.
-- The expanded multi-hour AI course now lives in scripts/seed-ai-course.mjs
-- because the live backend still uses the legacy curriculum schema without modules.
--
-- UUIDs (stable — use these for cross-references):
--   Subject:  a1b2c3d4-e5f6-7890-abcd-ef1234567890
--   Lesson 1: b2c3d4e5-f6a7-8901-bcde-f12345678901  (How LLMs Actually Work)
--   Lesson 2: c3d4e5f6-a7b8-9012-cdef-012345678902  (Prompt Engineering)

-- ============================================
-- Subject: How AI Systems Work
-- ============================================
INSERT INTO subjects (id, name, description, icon, is_community)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'How AI Systems Work',
  'From tokens and prompting to retrieval and evaluation, this course gives you a clear mental model of how modern AI systems actually work.',
  '🤖',
  false
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Modules: the first structured AI course layout
-- ============================================
INSERT INTO modules (id, subject_id, title, description, order_index)
VALUES
(
  'aa11aa11-1111-4111-8111-111111111111',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Foundations',
  'Core mental models for what large language models are actually doing under the hood.',
  1
),
(
  'bb22bb22-2222-4222-8222-222222222222',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Prompting',
  'How developers shape model behavior with roles, examples, and dynamic context.',
  2
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Lesson 1: How LLMs Actually Work
-- Arc: tokens → attention → layers → training → emergent behavior
-- ============================================================
INSERT INTO lessons (id, subject_id, module_id, title, description, order_index, unlock_threshold)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'aa11aa11-1111-4111-8111-111111111111',
  'How LLMs Actually Work',
  'Learn the core mechanics behind language models: tokens, next-token prediction, attention, context windows, and the knobs developers actually control.',
  1,
  0.7
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO facts (lesson_id, content, explanation, strictness, order_index, tags) VALUES

-- Fact 1: Tokens
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'LLMs process tokens, not raw words. Tokens are short chunks of text, so one word can split into multiple pieces.',
  'That is why models can struggle with odd spellings, letter counting, or very long prompts. The unit they read is smaller and stranger than a human word.',
  'medium',
  1,
  ARRAY['tokens', 'tokenization', 'BPE', 'LLM-basics']
),

-- Fact 2: Next-token prediction
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A language model generates text by predicting the next token from the tokens before it, one step at a time.',
  'That loop sounds simple, but at scale it forces the model to learn patterns about language, facts, and tone. The same process also explains why models can sound confident while being wrong.',
  'medium',
  2,
  ARRAY['next-token-prediction', 'autoregressive', 'hallucination', 'LLM-basics']
),

-- Fact 3: Attention
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Attention lets the model look back at any earlier token in the current context and weigh what matters most for the next prediction.',
  'Instead of compressing the whole past into one fuzzy memory, a transformer can re-check the earlier parts that matter right now. That is the key architectural jump behind modern LLMs.',
  'medium',
  3,
  ARRAY['attention', 'transformer', 'multi-head-attention', 'LLM-basics']
),

-- Fact 4: Context window
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'The context window is the total token budget the model can use for the current exchange, including both your input and the model''s reply.',
  'When that budget fills up, old context falls out. That is why long chats, giant prompts, and stateless architectures all have real limits.',
  'high',
  4,
  ARRAY['context-window', 'stateless', 'Grok', 'token-limit', 'LLM-basics']
),

-- Fact 5: Training vs inference
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Training and inference are different stages: training changes the model''s weights, while inference is just using the trained model on a new prompt.',
  'When you prompt a model, you are steering it, not retraining it. That is why context, examples, and system rules matter so much in real products.',
  'medium',
  5,
  ARRAY['training', 'inference', 'fine-tuning', 'weights', 'LLM-basics']
),

-- Fact 6: Temperature
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Temperature controls how much randomness the model uses when choosing the next token. Lower values are steadier; higher values are more varied.',
  'For tutoring and scoring, you usually want some variation without losing control. Temperature is one of the simplest ways to tune that tradeoff.',
  'medium',
  6,
  ARRAY['temperature', 'sampling', 'deterministic', 'LLM-basics', 'tuning']
) ON CONFLICT (lesson_id, order_index) DO NOTHING;

-- ============================================================
-- Lesson 2: Prompt Engineering
-- Arc: system vs user → role → few-shot → chain-of-thought → context → limits
-- ============================================================
INSERT INTO lessons (id, subject_id, module_id, title, description, order_index, unlock_threshold)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-012345678902',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'bb22bb22-2222-4222-8222-222222222222',
  'Prompt Engineering',
  'Learn how developers actually steer model behavior with system prompts, examples, reasoning scaffolds, and runtime context.',
  2,
  0.7
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO facts (lesson_id, content, explanation, strictness, order_index, tags) VALUES

-- Fact 1: System vs user messages
(
  'c3d4e5f6-a7b8-9012-cdef-012345678902',
  'In chat APIs, the system message sets the durable rules, the user message carries the learner input, and assistant messages hold prior model turns.',
  'If you want consistent behavior, start with the rule layer first. The model can only follow structure that you actually provide.',
  'medium',
  1,
  ARRAY['system-message', 'roles', 'stateless', 'prompt-engineering']
),

-- Fact 2: Persona and tone
(
  'c3d4e5f6-a7b8-9012-cdef-012345678902',
  'Good persona prompts describe behaviors, constraints, and tone in concrete terms, not just adjectives like friendly or smart.',
  'Telling a model to be concise, ask one follow-up, and avoid lists is far more reliable than vague style words.',
  'medium',
  2,
  ARRAY['persona', 'tone', 'behavioral-rules', 'prompt-engineering']
),

-- Fact 3: Few-shot examples
(
  'c3d4e5f6-a7b8-9012-cdef-012345678902',
  'Few-shot prompting gives the model example inputs and outputs, which is often more reliable than describing the format in prose.',
  'Models copy patterns well. Showing the shape you want usually beats explaining it abstractly.',
  'medium',
  3,
  ARRAY['few-shot', 'examples', 'format', 'prompt-engineering']
),

-- Fact 4: Chain-of-thought
(
  'c3d4e5f6-a7b8-9012-cdef-012345678902',
  'Reasoning prompts improve hard tasks by making the model work through intermediate steps before the final answer.',
  'The extra scratch work does not guarantee truth, but it often reduces shallow mistakes on multi-step tasks.',
  'medium',
  4,
  ARRAY['chain-of-thought', 'reasoning', 'step-by-step', 'prompt-engineering']
),

-- Fact 5: Context injection
(
  'c3d4e5f6-a7b8-9012-cdef-012345678902',
  'Dynamic context injection turns one prompt template into a personalized system by filling in the current fact, mastery state, and recent interaction history at runtime.',
  'That is how one tutor prompt can still sound tailored to the learner. The variables carry the personalization.',
  'medium',
  5,
  ARRAY['context-injection', 'personalization', 'runtime', 'prompt-engineering', 'SM-2']
),

-- Fact 6: Prompt injection risk
(
  'c3d4e5f6-a7b8-9012-cdef-012345678902',
  'Prompt injection happens when user-supplied text tries to override the developer''s instructions, so risky apps need strict boundaries between user content and system rules.',
  'The more power the model has to act, the more dangerous this becomes. Good systems separate user text, validate outputs, and narrow what the model can do.',
  'high',
  6,
  ARRAY['prompt-injection', 'security', 'OWASP', 'prompt-engineering', 'sanitization']
) ON CONFLICT (lesson_id, order_index) DO NOTHING;
