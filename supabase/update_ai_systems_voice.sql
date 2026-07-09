-- Live course cleanup for: seed_ai_systems.sql
-- Apply after removing lesson 3 with supabase/remove_ai_production_lesson.sql

UPDATE subjects
SET description = 'From tokens and prompting to retrieval and evaluation, this course gives you a clear mental model of how modern AI systems actually work.'
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

UPDATE lessons
SET description = 'Learn the core mechanics behind language models: tokens, next-token prediction, attention, context windows, and the knobs developers actually control.'
WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

UPDATE lessons
SET description = 'Learn how developers actually steer model behavior with system prompts, examples, reasoning scaffolds, and runtime context.'
WHERE id = 'c3d4e5f6-a7b8-9012-cdef-012345678902';

UPDATE facts SET
	content = 'LLMs process tokens, not raw words. Tokens are short chunks of text, so one word can split into multiple pieces.',
	explanation = 'That is why models can struggle with odd spellings, letter counting, or very long prompts. The unit they read is smaller and stranger than a human word.'
WHERE lesson_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901' AND order_index = 1;

UPDATE facts SET
	content = 'A language model generates text by predicting the next token from the tokens before it, one step at a time.',
	explanation = 'That loop sounds simple, but at scale it forces the model to learn patterns about language, facts, and tone. The same process also explains why models can sound confident while being wrong.'
WHERE lesson_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901' AND order_index = 2;

UPDATE facts SET
	content = 'Attention lets the model look back at any earlier token in the current context and weigh what matters most for the next prediction.',
	explanation = 'Instead of compressing the whole past into one fuzzy memory, a transformer can re-check the earlier parts that matter right now. That is the key architectural jump behind modern LLMs.'
WHERE lesson_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901' AND order_index = 3;

UPDATE facts SET
	content = 'The context window is the total token budget the model can use for the current exchange, including both your input and the model''s reply.',
	explanation = 'When that budget fills up, old context falls out. That is why long chats, giant prompts, and stateless architectures all have real limits.'
WHERE lesson_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901' AND order_index = 4;

UPDATE facts SET
	content = 'Training and inference are different stages: training changes the model''s weights, while inference is just using the trained model on a new prompt.',
	explanation = 'When you prompt a model, you are steering it, not retraining it. That is why context, examples, and system rules matter so much in real products.'
WHERE lesson_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901' AND order_index = 5;

UPDATE facts SET
	content = 'Temperature controls how much randomness the model uses when choosing the next token. Lower values are steadier; higher values are more varied.',
	explanation = 'For tutoring and scoring, you usually want some variation without losing control. Temperature is one of the simplest ways to tune that tradeoff.'
WHERE lesson_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901' AND order_index = 6;

UPDATE facts SET
	content = 'In chat APIs, the system message sets the durable rules, the user message carries the learner input, and assistant messages hold prior model turns.',
	explanation = 'If you want consistent behavior, start with the rule layer first. The model can only follow structure that you actually provide.'
WHERE lesson_id = 'c3d4e5f6-a7b8-9012-cdef-012345678902' AND order_index = 1;

UPDATE facts SET
	content = 'Good persona prompts describe behaviors, constraints, and tone in concrete terms, not just adjectives like friendly or smart.',
	explanation = 'Telling a model to be concise, ask one follow-up, and avoid lists is far more reliable than vague style words.'
WHERE lesson_id = 'c3d4e5f6-a7b8-9012-cdef-012345678902' AND order_index = 2;

UPDATE facts SET
	content = 'Few-shot prompting gives the model example inputs and outputs, which is often more reliable than describing the format in prose.',
	explanation = 'Models copy patterns well. Showing the shape you want usually beats explaining it abstractly.'
WHERE lesson_id = 'c3d4e5f6-a7b8-9012-cdef-012345678902' AND order_index = 3;

UPDATE facts SET
	content = 'Reasoning prompts improve hard tasks by making the model work through intermediate steps before the final answer.',
	explanation = 'The extra scratch work does not guarantee truth, but it often reduces shallow mistakes on multi-step tasks.'
WHERE lesson_id = 'c3d4e5f6-a7b8-9012-cdef-012345678902' AND order_index = 4;

UPDATE facts SET
	content = 'Dynamic context injection turns one prompt template into a personalized system by filling in the current fact, mastery state, and recent interaction history at runtime.',
	explanation = 'That is how one tutor prompt can still sound tailored to the learner. The variables carry the personalization.'
WHERE lesson_id = 'c3d4e5f6-a7b8-9012-cdef-012345678902' AND order_index = 5;

UPDATE facts SET
	content = 'Prompt injection happens when user-supplied text tries to override the developer''s instructions, so risky apps need strict boundaries between user content and system rules.',
	explanation = 'The more power the model has to act, the more dangerous this becomes. Good systems separate user text, validate outputs, and narrow what the model can do.'
WHERE lesson_id = 'c3d4e5f6-a7b8-9012-cdef-012345678902' AND order_index = 6;
