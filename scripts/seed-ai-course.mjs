import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const AI_SUBJECT = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  name: "How AI Systems Work",
  description:
    "A structured AI course covering model foundations, prompting, retrieval, evaluation, and practical product design.",
  icon: "🤖",
};

const MODULES = [
  {
    id: "ai-foundations",
    title: "Foundations",
    description: "Core mental models for what large language models are doing under the hood.",
  },
  {
    id: "ai-prompting",
    title: "Prompting",
    description: "How developers steer behavior at inference time.",
  },
  {
    id: "ai-model-internals",
    title: "Model Internals",
    description: "Training objectives, embeddings, and tool-augmented reasoning.",
  },
  {
    id: "ai-knowledge-safety",
    title: "Knowledge and Safety",
    description: "Multimodal inputs, retrieval systems, and evaluation guardrails.",
  },
  {
    id: "ai-advanced-practice",
    title: "Advanced Practice",
    description: "Customization, product design, and realistic limits of current AI systems.",
  },
];

const EXISTING_LESSONS = [
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    title: "How LLMs Actually Work",
    orderIndex: 1,
    moduleId: "ai-foundations",
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-012345678902",
    title: "Prompt Engineering",
    orderIndex: 2,
    moduleId: "ai-prompting",
  },
];

const NEW_LESSONS = [
  {
    id: "e5f60718-c9da-1234-ef01-234567899004",
    title: "Training Data, Loss, and Alignment",
    description: "See how models are trained, why loss matters, and what alignment does and does not solve.",
    orderIndex: 3,
    moduleId: "ai-model-internals",
    facts: [
      {
        content: "Pretraining usually teaches a language model by predicting the next token across a very large text corpus.",
        explanation:
          "The model is exposed to massive amounts of internet, book, and code-like text, then learns statistical patterns by repeatedly guessing the next token and adjusting its weights.",
        strictness: "medium",
      },
      {
        content: "Training loss is a measure of prediction error, and gradient descent updates the model to reduce average loss over time.",
        explanation:
          "Loss is not a human-friendly score, but it is the optimization target. Lower loss generally means better token prediction on the training objective, not guaranteed real-world usefulness.",
        strictness: "medium",
      },
      {
        content: "Frequent patterns in the training data shape model behavior more strongly than rare edge cases.",
        explanation:
          "If a concept or style appears many times, the model gets more gradient signal from it. Rare situations are learned less reliably unless they are intentionally overrepresented later.",
        strictness: "medium",
      },
      {
        content: "Instruction tuning happens after pretraining and teaches the model to follow task-oriented prompts in a chat format.",
        explanation:
          "Base pretraining makes the model good at continuation. Instruction tuning adds examples of questions, commands, and desired assistant-style responses.",
        strictness: "medium",
      },
      {
        content: "Alignment methods such as RLHF or RLAIF optimize for preferred behavior, not just raw next-token likelihood.",
        explanation:
          "These methods add a second training stage where responses are ranked or rewarded. That can make the assistant more helpful and polite, but it does not magically make it fully correct.",
        strictness: "medium",
      },
      {
        content: "Alignment improves usability, but it does not guarantee truthfulness, safety, or consistent reasoning on every prompt.",
        explanation:
          "A well-aligned model can still hallucinate, miss edge cases, or produce risky outputs. Product teams still need retrieval, validation, permissions, and evaluation around the model.",
        strictness: "medium",
      },
    ],
  },
  {
    id: "f6071829-d0eb-2345-f012-3456789a9005",
    title: "Embeddings and Vector Search",
    description: "Learn how semantic search works and why chunking and retrieval design matter as much as the model.",
    orderIndex: 4,
    moduleId: "ai-model-internals",
    facts: [
      {
        content: "Embeddings convert text into high-dimensional numeric vectors so semantic similarity can be compared mathematically.",
        explanation:
          "Instead of comparing raw words, you compare coordinates in vector space. Text with related meaning often lands closer together than text with unrelated meaning.",
        strictness: "medium",
      },
      {
        content: "Cosine similarity is a common way to compare two embeddings because it measures how aligned their directions are.",
        explanation:
          "Two vectors can have different magnitudes but still point in similar directions. Cosine similarity focuses on that directional closeness, which is often useful for semantic matching.",
        strictness: "high",
      },
      {
        content: "Embeddings are useful for search, clustering, classification, recommendations, and retrieval pipelines.",
        explanation:
          "Once information is in vector form, nearest-neighbor methods can find related items efficiently. That same representation helps with many downstream tasks beyond search.",
        strictness: "medium",
      },
      {
        content: "Chunking strategy changes retrieval quality because the model can only retrieve and reason over the text chunks you created.",
        explanation:
          "Chunks that are too large hide precise details, while chunks that are too small lose context. Good chunking preserves meaning while staying retrieval-friendly.",
        strictness: "medium",
      },
      {
        content: "A vector database stores embeddings with metadata so nearest-neighbor search can retrieve relevant chunks quickly.",
        explanation:
          "The metadata matters because real apps usually need filters such as document type, owner, or freshness in addition to raw semantic similarity.",
        strictness: "medium",
      },
      {
        content: "Strong retrieval quality depends on chunking, metadata filters, and query rewriting, not just on the embedding model itself.",
        explanation:
          "Teams often blame the model first, but poor indexing decisions, weak metadata, or bad query formulation can hurt retrieval just as much.",
        strictness: "medium",
      },
    ],
  },
  {
    id: "0718293a-e1fc-3456-a123-456789ab9006",
    title: "Tool Use and Agents",
    description: "Understand when a model should call tools, how agent loops work, and why constraints matter.",
    orderIndex: 5,
    moduleId: "ai-model-internals",
    facts: [
      {
        content: "Tool calling lets a model ask the application to run external functions instead of inventing an answer from text alone.",
        explanation:
          "Examples include looking up a database record, sending an email, checking inventory, or creating a calendar event. The model chooses the tool and the app executes it.",
        strictness: "medium",
      },
      {
        content: "An agent loop usually follows a repeated pattern of observe, plan, act, inspect the result, and continue if needed.",
        explanation:
          "The model uses fresh tool outputs as new context. That lets it chain multiple steps, but each step can also add more latency and more opportunities for error.",
        strictness: "medium",
      },
      {
        content: "Tools expand model capability by providing fresh data and deterministic actions that the base model cannot safely do on its own.",
        explanation:
          "Without tools, a model can only reason from its context window and training distribution. With tools, it can fetch current information or take real-world actions.",
        strictness: "medium",
      },
      {
        content: "Agent systems can fail through bad arguments, repeated loops, brittle plans, or incorrect assumptions about tool outputs.",
        explanation:
          "Most agent bugs are not magical. They come from ordinary software problems like bad schemas, missing retries, weak constraints, or low-quality intermediate state.",
        strictness: "medium",
      },
      {
        content: "Risky tools should be constrained with schemas, permissions, confirmation steps, and clear stopping rules.",
        explanation:
          "The model should not have unrestricted power. Real systems narrow the available actions and require approval before anything costly, destructive, or irreversible happens.",
        strictness: "medium",
      },
      {
        content: "For many products, a simple workflow with one or two tool calls is more reliable than a fully open-ended agent loop.",
        explanation:
          "Open-ended autonomy sounds powerful, but it also increases latency, unpredictability, and debugging cost. Many teams get better outcomes from smaller controlled flows.",
        strictness: "medium",
      },
    ],
  },
  {
    id: "18293a4b-f20d-4567-b234-56789abc9007",
    title: "Multimodal AI Systems",
    description: "Cover how modern systems combine text, images, audio, and streaming interaction in one product experience.",
    orderIndex: 6,
    moduleId: "ai-knowledge-safety",
    facts: [
      {
        content: "Multimodal AI systems process more than text, such as images, audio, video, or a mixture of modalities in one interaction.",
        explanation:
          "The user experience feels unified, but under the hood the system still needs representations that let the model reason across different input types.",
        strictness: "medium",
      },
      {
        content: "Different modalities are converted into tokens or latent representations that the model can use inside a shared context.",
        explanation:
          "The details differ across architectures, but the core idea is that images, text, and audio must be transformed into a machine-readable sequence or space the model can process.",
        strictness: "medium",
      },
      {
        content: "Many voice systems still work as a pipeline of speech-to-text, reasoning, and text-to-speech rather than one single end-to-end model.",
        explanation:
          "That pipeline is practical and modular, but it also means latency can stack up across multiple components instead of coming from only one place.",
        strictness: "medium",
      },
      {
        content: "Perceived latency in multimodal apps is strongly affected by streaming the first token or first audio chunk quickly.",
        explanation:
          "Users tolerate a response better when they see or hear the system start promptly. Even if total completion time is similar, faster time-to-first-signal improves UX.",
        strictness: "medium",
      },
      {
        content: "Multimodal evaluation must measure timing and interaction quality, not only factual correctness.",
        explanation:
          "A voice answer can be technically correct and still feel bad if it arrives late, interrupts the user, or uses the wrong mode for the task.",
        strictness: "medium",
      },
      {
        content: "Good product design respects the strengths of each modality instead of forcing speech, text, or visuals into situations where they fit poorly.",
        explanation:
          "Voice is strong for hands-free interaction, but weak for dense tables or long enumerations. The interface should choose the mode that actually helps the user think.",
        strictness: "medium",
      },
    ],
  },
  {
    id: "293a4b5c-031e-5678-c345-6789abcd9008",
    title: "RAG and Knowledge Systems",
    description: "Learn when retrieval-augmented generation helps, where it breaks, and when structured lookups are better.",
    orderIndex: 7,
    moduleId: "ai-knowledge-safety",
    facts: [
      {
        content: "Retrieval-augmented generation retrieves external documents and places the relevant context into the model prompt before generation.",
        explanation:
          "RAG is a system pattern, not a new reasoning law. It helps the model ground answers in fresh or domain-specific information.",
        strictness: "medium",
      },
      {
        content: "RAG is most useful when the underlying model can reason well but the needed facts are too specific, private, or fast-changing to rely on training alone.",
        explanation:
        orderIndex: 8,
        strictness: "medium",
      },
      {
        content: "A typical RAG pipeline includes ingestion, chunking, embedding, indexing, retrieval, optional reranking, and final generation.",
        explanation:
        orderIndex: 9,
        strictness: "medium",
      },
      {
        content: "Grounded answers are stronger when the app encourages or requires the model to cite, quote, or reference the retrieved evidence.",
        explanation:
        orderIndex: 10,
        strictness: "medium",
      },
      {
        content: "RAG can fail because of missed retrieval, irrelevant context, stale documents, or chunking that separates the needed evidence.",
        explanation:
        orderIndex: 11,
        strictness: "medium",
      },
      {
        content: "For precise fields like prices, balances, or IDs, a structured database or API lookup is often better than relying on RAG alone.",
        explanation:
          "RAG is strong for unstructured knowledge, but exact values are better fetched from authoritative systems with deterministic schemas.",
        strictness: "high",
      },
    ],
  },
  {
    id: "3a4b5c6d-142f-6789-d456-789abcde9009",
    title: "Evaluation, Guardrails, and Safety",
    description: "Build the discipline to test AI behavior, ship regressions less often, and add real application-layer safety.",
    orderIndex: 9,
    moduleId: "ai-knowledge-safety",
    facts: [
      {
        content: "Offline evaluation sets should reflect real user tasks, not only easy or synthetic examples that flatter the model.",
        explanation:
          "A benchmark can look strong while the product still fails in production. Good evals resemble the messy distribution of actual user requests.",
        strictness: "medium",
      },
      {
        content: "Regression suites are necessary because prompt edits, model swaps, and retrieval changes can silently break behavior that used to work.",
        explanation:
          "AI systems are unusually easy to regress because many components interact. Stable test sets help teams notice when quality moved in the wrong direction.",
        strictness: "medium",
      },
      {
        content: "Guardrails belong at the application layer and should validate inputs, outputs, and tool results rather than relying on prompt wording alone.",
        explanation:
          "A policy prompt can help, but it is not a security boundary. Real safety comes from code-level checks, schemas, permissions, and monitoring.",
        strictness: "medium",
      },
      {
        content: "High-risk domains need human review when the cost of a wrong answer is large, even if the model is usually good.",
        explanation:
          "Medical, legal, financial, or security-sensitive workflows need escalation paths. The right product decision is often to slow down or ask for review.",
        strictness: "medium",
      },
      {
        content: "Safety work requires tradeoff measurement across quality, latency, cost, false positives, and false negatives.",
        explanation:
          "A stricter system can be safer but too annoying. A looser system can feel great until it fails badly. Teams need explicit metrics for these tradeoffs.",
        strictness: "medium",
      },
      {
        content: "The safest AI products treat prompts as one layer in a broader system of evals, permissions, logging, and fallback behavior.",
        explanation:
          "Prompting matters, but the durable safety improvements usually come from system design choices outside the prompt itself.",
        strictness: "medium",
      },
    ],
  },
  {
    id: "4b5c6d7e-2530-789a-e567-89abcdef9010",
    title: "Fine-Tuning and Customization",
    description: "Separate the cases where prompting is enough from the cases where extra training data creates real leverage.",
    orderIndex: 10,
    moduleId: "ai-advanced-practice",
    facts: [
      {
        content: "Fine-tuning changes model behavior through additional training, while prompting only changes the context given at inference time.",
        explanation:
          "Both can improve outputs, but they operate at different layers. Prompting is faster to iterate, while fine-tuning changes the learned mapping itself.",
        strictness: "medium",
      },
      {
        content: "Fine-tuning is especially useful for consistent style, specialized classification, and structured extraction tasks that repeat often.",
        explanation:
          "When the desired behavior is stable and narrow, examples can teach the model a cleaner decision boundary than a huge prompt can.",
        strictness: "medium",
      },
      {
        content: "Fine-tuning does not replace retrieval when the core problem is access to changing facts or external knowledge.",
        explanation:
          "If the information changes every day, training a model on yesterday's facts is the wrong fix. Retrieval or API access is the better system pattern.",
        strictness: "medium",
      },
      {
        content: "Parameter-efficient methods such as LoRA adapt a smaller set of weights, making customization cheaper than full fine-tuning.",
        explanation:
          "These methods reduce compute and storage cost while still letting teams specialize behavior. They are often a practical middle ground.",
        strictness: "medium",
      },
      {
        content: "Dataset quality matters more than raw dataset size when customizing a model for a narrow behavior.",
        explanation:
          "A small set of clean, representative examples can beat a large noisy set. Bad examples teach bad behavior very efficiently.",
        strictness: "medium",
      },
      {
        content: "A fine-tuned model should be evaluated against the baseline on held-out examples before it replaces the simpler prompt-only version.",
        explanation:
          "Customization adds maintenance cost. Teams should verify that the fine-tuned model actually improves the target task enough to justify that cost.",
        strictness: "medium",
      },
    ],
  },
  {
    id: "5c6d7e8f-3641-89ab-f678-9abcdef09011",
    title: "AI Product Design and Human-in-the-Loop",
    description: "Design interfaces, workflows, and feedback loops that make AI feel useful instead of mysterious or reckless.",
    orderIndex: 11,
    moduleId: "ai-advanced-practice",
    facts: [
      {
        content: "Strong AI products set clear expectations about what the system can do, where it is uncertain, and what the user should verify.",
        explanation:
          "Users make better decisions when the interface communicates capability honestly. Ambiguity around confidence or authority leads to misuse.",
        strictness: "medium",
      },
      {
        content: "In many interfaces, a fast partially helpful response creates a better experience than a perfect answer that arrives too late.",
        explanation:
          "Latency is part of product quality, not a separate concern. Users often prefer a system that keeps momentum over one that disappears for too long.",
        strictness: "medium",
      },
      {
        content: "Human-in-the-loop review is mandatory when the consequences of a bad AI action are expensive, irreversible, or hard to detect.",
        explanation:
          "Approval flows and review queues are not signs of weakness. They are how responsible systems handle risk without giving up all of AI's leverage.",
        strictness: "medium",
      },
      {
        content: "Good AI UX makes it easy for users to correct the system, not just to accept or reject a final answer.",
        explanation:
          "Correction creates better outcomes in the moment and also creates better feedback data for the product team later.",
        strictness: "medium",
      },
      {
        content: "User corrections, escalations, and abandon points are some of the highest-value signals for improving an AI product.",
        explanation:
          "Those events show where the model or workflow breaks trust. They often teach more than aggregate accuracy alone.",
        strictness: "medium",
      },
      {
        content: "The best AI features are built around a user's real job-to-be-done, not around showing off model novelty.",
        explanation:
          "If the feature does not solve a meaningful task faster, more clearly, or more reliably, then the AI layer is probably not the point.",
        strictness: "medium",
      },
    ],
  },
  {
    id: "6d7e8f90-4752-9abc-a789-abcdef019012",
    title: "Limits, Failure Modes, and Future Directions",
    description: "End with a realistic view of where current AI systems fail and where durable product advantage actually comes from.",
    orderIndex: 12,
    moduleId: "ai-advanced-practice",
    facts: [
      {
        content: "Large language models are pattern learners, not guaranteed truth engines with an internal database of verified facts.",
        explanation:
          "They can sound authoritative because they are good at language, but fluent wording is not the same thing as guaranteed correctness.",
        strictness: "medium",
      },
      {
        content: "Hallucinations become more likely when a task requires exact facts and the model lacks grounded evidence in the prompt or external tools.",
        explanation:
          "The model will often still answer because it is optimized to continue usefully. Without evidence, that helpfulness pressure can turn into confident guessing.",
        strictness: "medium",
      },
      {
        content: "Benchmark gains do not always translate into product quality gains because real apps also depend on latency, UX, data quality, and system design.",
        explanation:
          "A stronger model is helpful, but products rarely succeed on model quality alone. The surrounding workflow often determines whether users trust it.",
        strictness: "medium",
      },
      {
        content: "Longer context windows help with larger inputs, but they do not eliminate distraction, forgetting, or weak retrieval choices inside the context.",
        explanation:
          "More context is not the same as better focus. The system still has to put the right information in the right form where the model can use it well.",
        strictness: "medium",
      },
      {
        content: "Smaller specialized models can outperform larger general models on narrow tasks when the domain, latency target, and evaluation set are well chosen.",
        explanation:
          "Bigger is not automatically better. A well-matched model for a constrained workflow can win on speed, cost, and even quality for that use case.",
        strictness: "medium",
      },
      {
        content: "The durable advantage in AI products usually comes from system design, proprietary data, evaluation discipline, and UX, not only from model brand or size.",
        explanation:
          "Frontier models matter, but they are accessible to many teams. The harder part to copy is the product system wrapped around them.",
        strictness: "medium",
      },
    ],
  },
];

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function buildSummary() {
  const moduleMap = new Map(MODULES.map((module) => [module.id, module]));
  const lessons = [...EXISTING_LESSONS, ...NEW_LESSONS];

  return MODULES.map((module) => {
    const moduleLessons = lessons
      .filter((lesson) => lesson.moduleId === module.id)
      .sort((left, right) => left.orderIndex - right.orderIndex)
      .map((lesson) => ({
        title: lesson.title,
        orderIndex: lesson.orderIndex,
        factCount: "facts" in lesson ? lesson.facts.length : 6,
      }));

    return {
      title: moduleMap.get(module.id)?.title ?? module.id,
      description: module.description,
      lessonCount: moduleLessons.length,
      lessons: moduleLessons,
    };
  }).filter((module) => module.lessonCount > 0);
}

function printSummary() {
  const summary = buildSummary();
  const totalLessons = EXISTING_LESSONS.length + NEW_LESSONS.length;
  const totalFacts = NEW_LESSONS.reduce((count, lesson) => count + lesson.facts.length, EXISTING_LESSONS.length * 6);

  console.log(`Subject: ${AI_SUBJECT.name}`);
  console.log(`Modules: ${summary.length}`);
  console.log(`Lessons: ${totalLessons}`);
  console.log(`Approx facts: ${totalFacts}`);
  console.log("");

  for (const module of summary) {
    console.log(`${module.title} (${module.lessonCount} lessons)`);
    for (const lesson of module.lessons) {
      console.log(`  ${lesson.orderIndex}. ${lesson.title} (${lesson.factCount} facts)`);
    }
    console.log("");
  }
}

async function ensureSubject(supabase, userId) {
  const { data, error } = await supabase.from("subjects").select("id").eq("id", AI_SUBJECT.id).maybeSingle();
  if (error) {
    throw error;
  }

  if (data) {
    return;
  }

  const { error: insertError } = await supabase.from("subjects").insert({
    id: AI_SUBJECT.id,
    name: AI_SUBJECT.name,
    description: AI_SUBJECT.description,
    icon: AI_SUBJECT.icon,
    is_community: false,
    created_by: userId,
  });

  if (insertError) {
    throw insertError;
  }
}

async function maybeResetLesson(supabase, lessonId, userId, force) {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, created_by")
    .eq("id", lessonId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return { action: "insert" };
  }

  if (!force) {
    return { action: "skip", title: data.title };
  }

  if (data.created_by !== userId) {
    return { action: "skip", title: data.title };
  }

  const { error: deleteError } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (deleteError) {
    throw deleteError;
  }

  return { action: "recreate", title: data.title };
}

async function insertLessonWithFacts(supabase, lesson, userId) {
  const { error: lessonError } = await supabase.from("lessons").insert({
    id: lesson.id,
    subject_id: AI_SUBJECT.id,
    title: lesson.title,
    description: lesson.description,
    order_index: lesson.orderIndex,
    is_community: false,
    created_by: userId,
  });

  if (lessonError) {
    throw lessonError;
  }

  const factRows = lesson.facts.map((fact, index) => ({
    lesson_id: lesson.id,
    content: fact.content,
    explanation: fact.explanation,
    strictness: fact.strictness,
    order_index: index + 1,
    tags: null,
  }));

  const { error: factError } = await supabase.from("facts").insert(factRows);
  if (!factError) {
    return;
  }

  await supabase.from("lessons").delete().eq("id", lesson.id);
  throw factError;
}

async function verifySeed(supabase) {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, lessons(id, title, order_index, facts(id))")
    .eq("id", AI_SUBJECT.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const lessons = (data?.lessons ?? []).slice().sort((left, right) => left.order_index - right.order_index);
  return {
    subjectName: data?.name ?? AI_SUBJECT.name,
    lessonCount: lessons.length,
    lessons: lessons.map((lesson) => ({
      title: lesson.title,
      orderIndex: lesson.order_index,
      factCount: lesson.facts?.length ?? 0,
    })),
  };
}

async function main() {
  loadEnvLocal();

  if (process.argv.includes("--dry-run")) {
    printSummary();
    return;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const email = readArg("--email") ?? process.env.SUPABASE_EMAIL;
  const password = readArg("--password") ?? process.env.SUPABASE_PASSWORD;
  const force = process.argv.includes("--force");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (!email || !password) {
    throw new Error("Missing Supabase login credentials. Provide --email/--password or SUPABASE_EMAIL/SUPABASE_PASSWORD.");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    throw authError;
  }

  const userId = authData.user?.id;
  if (!userId) {
    throw new Error("Sign-in succeeded but no user id was returned.");
  }

  await ensureSubject(supabase, userId);

  const results = [];
  for (const lesson of NEW_LESSONS) {
    const status = await maybeResetLesson(supabase, lesson.id, userId, force);

    if (status.action === "skip") {
      results.push({ title: lesson.title, action: "skipped" });
      continue;
    }

    await insertLessonWithFacts(supabase, lesson, userId);
    results.push({ title: lesson.title, action: status.action === "recreate" ? "recreated" : "inserted" });
  }

  const verification = await verifySeed(supabase);

  console.log(JSON.stringify({
    subject: verification.subjectName,
    results,
    lessonCount: verification.lessonCount,
    lessons: verification.lessons,
  }, null, 2));

  await supabase.auth.signOut();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});