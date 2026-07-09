import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

export const COURSE = {
  subject: {
    id: "7b0c1d2e-3f40-4567-89ab-cdef01234567",
    name: "Junior Software Interview Foundations",
    description:
      "A practical course for junior frontend and full-stack candidates who need stronger interview language around delivery, APIs, data, quality, and team process.",
    icon: "💼",
  },
  lessons: [
    {
      id: "8c1d2e3f-4051-4678-9abc-def012345678",
      title: "TypeScript Frontend Delivery",
      description:
        "Move from 'I built a React app' to explaining typed UI delivery, state, accessibility, and maintainable frontend decisions like an engineer.",
      orderIndex: 1,
      facts: [
        {
          content:
            "TypeScript adds static type checking to JavaScript, which catches mismatched data shapes earlier and makes refactoring safer.",
          explanation:
            "Think of it like guardrails on a winding road. You still build the feature, but the tooling warns you before a rename or API change turns into a production bug.",
          strictness: "medium",
          tags: ["TypeScript", "static typing", "frontend delivery"],
        },
        {
          content:
            "Types, interfaces, and inference are different tools for expressing clear data contracts without making the code harder to read.",
          explanation:
            "The interview goal is not to sound dogmatic about one keyword. It is to show that you know when to be explicit and when the compiler already has enough information.",
          strictness: "medium",
          tags: ["types vs interfaces", "type inference", "contracts"],
        },
        {
          content:
            "A strong frontend feature keeps one typed contract flowing through component props, form state, API responses, and validation results.",
          explanation:
            "Once one layer drifts from the others, bugs hide in the gaps. Frontend experience sounds more professional when you describe one typed flow instead of isolated screens.",
          strictness: "medium",
          tags: ["typed contracts", "component props", "API responses"],
        },
        {
          content:
            "Loading states, error states, and empty states turn a happy-path demo into a production-ready user flow.",
          explanation:
            "A polished product does not just render data when everything goes right. It also tells the user what is happening, what failed, and what to do when there is nothing to show yet.",
          strictness: "medium",
          tags: ["loading states", "error states", "empty states"],
        },
        {
          content:
            "State should live at the narrowest layer that truly owns it, whether that is a component, a page, or server-backed state managed outside the view.",
          explanation:
            "A modal toggle does not need global state, but shared fetched data usually should not be trapped in one child component. Good answers show that you reason about ownership, not just libraries.",
          strictness: "medium",
          tags: ["state ownership", "local state", "server state"],
        },
        {
          content:
            "Reusable component architecture depends on clear prop boundaries, composition, and separating UI rendering from business rules.",
          explanation:
            "A reusable button is not just a copied style block. It has a stable contract, predictable variants, and does not mix display concerns with unrelated fetching or domain logic.",
          strictness: "medium",
          tags: ["reusable components", "composition", "prop boundaries"],
        },
        {
          content:
            "Responsive and accessible UI means the same feature still works on small screens, keyboards, focus order, labels, and assistive technology.",
          explanation:
            "In interview language, this is not cosmetic polish. It is part of product quality because real users navigate with different screen sizes, inputs, and accessibility needs.",
          strictness: "medium",
          tags: ["accessibility", "responsive UI", "keyboard support"],
        },
        {
          content:
            "React experience translates to Angular through shared ideas like components, routing, shared state or services, and predictable UI contracts even though the syntax changes.",
          explanation:
            "That answer works well in mixed frontend job markets. You are signaling that you understand the underlying engineering model, not just one framework's exact API.",
          strictness: "medium",
          tags: ["React to Angular", "components", "routing"],
        },
      ],
    },
    {
      id: "9d2e3f40-5162-4789-abcd-ef0123456789",
      title: "API Integration and Backend Contracts",
      description:
        "Take the typed thinking from the UI and carry it across API boundaries, validation layers, auth rules, and async workflows.",
      orderIndex: 2,
      facts: [
        {
          content:
            "An API contract is the agreed shape of requests, responses, errors, and validation rules shared between the frontend and backend.",
          explanation:
            "Plain English: an API contract is the shared agreement about what you send and what you get back. Think of it like a restaurant ticket that says exactly what was ordered, what can go wrong, and what should come back to the table so neither side is guessing.",
          strictness: "medium",
          tags: ["API contract", "request response shape", "integration"],
        },
        {
          content:
            "Frontend code handles user flows and rendering, backend code enforces business rules and persistence, and full-stack work connects both without breaking the contract.",
          explanation:
            "Plain English: the frontend is what the user sees and clicks, while the backend is where the lasting rules and saved data live. A simple example is a signup form: the page collects the email and password, but the server decides whether the account can really be created and stores it safely.",
          strictness: "medium",
          tags: ["frontend vs backend", "full-stack responsibilities", "business rules"],
        },
        {
          content:
            "A normal product request flow moves from user action to client validation, server request, server validation, business logic, storage update, response, and UI refresh.",
          explanation:
            "Plain English: one button tap kicks off a chain of steps. Think of it as a relay race: the browser hands the baton to the server, the server hands it to the database, and then the answer runs back to the screen. If something breaks, you want to know which runner dropped the baton.",
          strictness: "medium",
          tags: ["request lifecycle", "client server flow", "UI refresh"],
        },
        {
          content:
            "REST APIs organize work around resources, endpoints, HTTP methods, status codes, and patterns like idempotent updates and pagination.",
          explanation:
            "Plain English: REST is just a common way of asking for data and sending updates over the web. A beginner example is products in a shop: GET fetches products, POST creates a product, PUT updates one product, and pagination means showing page 1, page 2, page 3 instead of dumping everything at once.",
          strictness: "medium",
          tags: ["REST API", "HTTP methods", "status codes"],
        },
        {
          content:
            "Validation belongs on both the client and the server because fast UI feedback helps the user, but the server is the real enforcement point.",
          explanation:
            "Plain English: the page can warn you quickly, but the server is the real gatekeeper. It is like an usher checking your ticket at the door even if the website already tried to stop mistakes earlier.",
          strictness: "medium",
          tags: ["validation", "client validation", "server validation"],
        },
        {
          content:
            "Authentication answers who the user is, while authorization answers what that user is allowed to do.",
          explanation:
            "Plain English: authentication is proving your identity, and authorization is checking your permissions. Logging in with your account is authentication; being allowed to delete another user's post is authorization.",
          strictness: "medium",
          tags: ["authentication vs authorization", "permissions", "security"],
        },
        {
          content:
            "A frontend-friendly backend response is predictable, uses stable field names, returns clear errors, and includes metadata the UI needs for rendering and pagination.",
          explanation:
            "Plain English: a good backend response is easy for the screen to trust. Think of it like receiving neatly labeled boxes instead of random loose items. If the API always returns the same field names and useful error messages, the frontend stays much simpler.",
          strictness: "medium",
          tags: ["backend responses", "stable contracts", "error handling"],
        },
        {
          content:
            "Queues, background jobs, webhooks, retries, and eventual consistency are ways systems finish work that should not block the user's immediate request.",
          explanation:
            "Plain English: some work keeps happening after the user moves on. A good example is ordering food in an app: you tap once, but payment checks, confirmation emails, and restaurant updates may finish a little later behind the scenes.",
          strictness: "medium",
          tags: ["async workflows", "background jobs", "eventual consistency"],
        },
      ],
    },
    {
      id: "ae3f4051-6273-489a-bcde-f0123456789a",
      title: "SQL and Data Modeling for Real Applications",
      description:
        "Follow the request one layer deeper and learn how relational data, queries, keys, and schema changes support real product features.",
      orderIndex: 3,
      facts: [
        {
          content:
            "A relational database stores structured data with explicit relationships, which makes it strong for business systems that need consistency, reporting, and shared truth.",
          explanation:
            "Plain English: a relational database is organized like connected spreadsheets. One table might hold users, another orders, and another products. The power comes from the fact that those tables can point to each other cleanly instead of acting like random notes.",
          strictness: "medium",
          tags: ["relational database", "data consistency", "shared truth"],
        },
        {
          content:
            "Core SQL work is about selecting rows, filtering them, joining related tables, grouping results, ordering output, and safely inserting or updating records.",
          explanation:
            "Plain English: SQL is how you ask the database questions and tell it to change data. A beginner example is asking for all orders from one customer, sorting them by date, or joining orders with products so the UI can show what was purchased.",
          strictness: "medium",
          tags: ["SQL basics", "SELECT WHERE JOIN", "querying data"],
        },
        {
          content:
            "Primary keys define identity for a row, and foreign keys connect one table to another so relationships stay explicit.",
          explanation:
            "Plain English: a primary key is the row's unique ID, and a foreign key is how one table points to another. Think of primary keys as name tags and foreign keys as the arrows that show which records belong together.",
          strictness: "medium",
          tags: ["primary keys", "foreign keys", "table identity"],
        },
        {
          content:
            "One-to-one, one-to-many, and many-to-many relationships describe how records connect, and each pattern shapes both schema design and UI behavior.",
          explanation:
            "Plain English: these relationship names just describe how many records can connect. One user to one profile is one-to-one, one user to many orders is one-to-many, and many users sharing many roles is many-to-many. Once you name the pattern, the schema gets easier to design.",
          strictness: "medium",
          tags: ["table relationships", "one to many", "many to many"],
        },
        {
          content:
            "Normalization reduces duplication by storing each fact in one sensible place so updates do not create conflicting copies.",
          explanation:
            "Plain English: normalization means you avoid copying the same fact into lots of places. It is like keeping one official contact card for a customer instead of rewriting their address into ten different notebooks and hoping every copy stays in sync.",
          strictness: "medium",
          tags: ["normalization", "data integrity", "duplication"],
        },
        {
          content:
            "Indexes speed up reads by helping the database find rows faster, but they also add storage cost and slow some writes.",
          explanation:
            "Plain English: an index helps the database look things up faster. It is like a book index or a phone contacts search. The tradeoff is that every time new data is added or changed, the database has to keep that shortcut updated too.",
          strictness: "medium",
          tags: ["indexes", "query performance", "write tradeoffs"],
        },
        {
          content:
            "Schema design decides how data is modeled, while query design decides how that model is actually retrieved efficiently for real features.",
          explanation:
            "Plain English: schema design is how you arrange the storage shelves, and query design is how you walk the shelves to grab the right items quickly. You need both a sensible layout and a sensible retrieval plan.",
          strictness: "medium",
          tags: ["schema design", "query design", "performance"],
        },
        {
          content:
            "A migration is a tracked database change that lets the schema evolve safely without treating production data as disposable.",
          explanation:
            "Plain English: a migration is a saved step-by-step database change. Instead of saying 'just rebuild everything,' the team writes down how to add the new column or table safely so local, staging, and production stay aligned.",
          strictness: "medium",
          tags: ["migrations", "schema evolution", "production data"],
        },
      ],
    },
    {
      id: "bf405162-7384-49ab-cdef-0123456789ab",
      title: "Testing, Debugging, and Quality Ownership",
      description:
        "Learn how quality-minded engineers verify behavior, isolate bugs, describe root causes, and reduce regressions instead of just patching symptoms.",
      orderIndex: 4,
      facts: [
        {
          content:
            "Testing exists to reduce regressions, increase change confidence, and document the behavior the team expects from a feature.",
          explanation:
            "Think of tests as living safety rails around important behavior. They are not there to impress a dashboard; they are there to make shipping less risky.",
          strictness: "medium",
          tags: ["testing purpose", "regression prevention", "confidence"],
        },
        {
          content:
            "Unit tests check small logic in isolation, integration tests check connected pieces, and end-to-end tests check real user workflows across the whole stack.",
          explanation:
            "Each layer catches different failure shapes. A candidate sounds mature when they explain why they picked one layer instead of claiming every bug needs every kind of test.",
          strictness: "medium",
          tags: ["unit tests", "integration tests", "end to end tests"],
        },
        {
          content:
            "A regression is when a change breaks behavior that used to work, even if the new code technically solved a different problem.",
          explanation:
            "Teams care about regressions because users experience the product as one whole system. Preventing a comeback bug is often more valuable than adding one flashy feature.",
          strictness: "medium",
          tags: ["regression", "change risk", "production confidence"],
        },
        {
          content:
            "A practical debugging loop is reproduce the issue, isolate the failing path, inspect inputs and outputs, find the root cause, and then validate the fix.",
          explanation:
            "That process sounds strong in interviews because it shows method instead of panic. It also mirrors how real engineers reduce guesswork under pressure.",
          strictness: "medium",
          tags: ["debugging process", "reproduction", "root cause"],
        },
        {
          content:
            "A symptom is the visible failure, but the root cause is the underlying condition that created that failure in the first place.",
          explanation:
            "A null error on screen is often just the smoke, not the fire. Strong engineers talk about the bad assumption, missing guard, or contract mismatch underneath it.",
          strictness: "medium",
          tags: ["root cause", "symptom", "bug analysis"],
        },
        {
          content:
            "Many product bugs come from null or undefined states, stale data, invalid inputs, race conditions, missing error states, or wrong assumptions about data shape.",
          explanation:
            "These are useful mental buckets during triage. They help you narrow the search space faster than staring at one stack trace without a theory.",
          strictness: "medium",
          tags: ["common failures", "race conditions", "data shape"],
        },
        {
          content:
            "Manual QA still matters because smoke checks, visual review, and edge-case walkthroughs catch problems that automated tests often miss.",
          explanation:
            "Automation is powerful, but it does not fully replace human judgment about layout, flow, timing, or awkward interaction details. Real quality ownership includes both.",
          strictness: "medium",
          tags: ["manual QA", "smoke tests", "edge cases"],
        },
        {
          content:
            "Clear bug notes should include reproduction steps, expected behavior, actual behavior, and what was checked to prove the fix did not regress something nearby.",
          explanation:
            "That style of communication makes you sound like a teammate, not just a coder. It shortens handoffs between engineering, QA, and product.",
          strictness: "medium",
          tags: ["bug reports", "reproduction steps", "validation notes"],
        },
      ],
    },
    {
      id: "c0516273-8495-4abc-def0-123456789abc",
      title: "Engineering Process, Team Communication, and Interview Language",
      description:
        "Turn solid technical work into dependable team behavior by learning process vocabulary, tradeoff language, and better ways to describe project decisions.",
      orderIndex: 5,
      facts: [
        {
          content:
            "Acceptance criteria define the specific conditions that tell the team when a feature is actually done.",
          explanation:
            "They are the finish line, not a suggestion. When juniors reference acceptance criteria, they sound like people who can land work instead of just start it.",
          strictness: "medium",
          tags: ["acceptance criteria", "definition of done", "feature scope"],
        },
        {
          content:
            "Scope says what is included, requirements say what must be true, assumptions fill in unknowns, risks highlight what could go wrong, and edge cases cover awkward but real scenarios.",
          explanation:
            "These words are useful because they separate different kinds of uncertainty. Teams move faster when they name the problem precisely instead of calling everything a requirement.",
          strictness: "medium",
          tags: ["scope vs requirements", "assumptions", "risks"],
        },
        {
          content:
            "A sprint is a short delivery window, a standup is a quick status sync, a backlog is queued work, a ticket is one tracked task, a blocker stops progress, and code review checks a proposed change before merge.",
          explanation:
            "You do not need enterprise jargon for its own sake. You do need to understand the shared operating language teams use every day.",
          strictness: "medium",
          tags: ["team process", "standup", "code review"],
        },
        {
          content:
            "Good engineers ship narrow slices because smaller changes are easier to review, validate, debug, and adapt when requirements shift.",
          explanation:
            "Trying to build everything at once feels efficient, but it usually hides risk. A thin vertical slice proves the path before the project gets expensive.",
          strictness: "medium",
          tags: ["narrow slices", "incremental delivery", "scope control"],
        },
        {
          content:
            "A strong pull request has tight scope, a clear description, validation notes, and changes that stay focused on one problem.",
          explanation:
            "Reviewers move faster when they know what changed, why it changed, and how it was checked. That is part of engineering communication, not paperwork.",
          strictness: "medium",
          tags: ["pull requests", "validation notes", "reviewability"],
        },
        {
          content:
            "Functional requirements describe what the feature does, while non-functional requirements describe qualities like performance, reliability, accessibility, and maintainability.",
          explanation:
            "A screen can meet the visible requirement and still fail the real job if it is too slow, brittle, or inaccessible. Mature answers mention both behavior and quality attributes.",
          strictness: "medium",
          tags: ["non-functional requirements", "performance", "maintainability"],
        },
        {
          content:
            "Interview tradeoff talk usually compares speed versus quality, flexibility versus simplicity, or reuse versus overengineering instead of pretending every goal can be maximized at once.",
          explanation:
            "The goal is not to sound pessimistic. It is to show that you can choose deliberately when constraints pull in different directions.",
          strictness: "medium",
          tags: ["tradeoffs", "speed vs quality", "overengineering"],
        },
        {
          content:
            "A strong project story explains the problem, constraints, approach, validation, outcome, and lessons learned in that order.",
          explanation:
            "That structure helps with recruiter screens, resume bullets, and technical interviews because it turns raw activity into a professional narrative. It is also a natural place to use words like stakeholder, technical debt, handoff, and cross-functional collaboration.",
          strictness: "medium",
          tags: ["project storytelling", "interview language", "stakeholders"],
        },
      ],
    },
  ],
};

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

function printSummary() {
  const factCount = COURSE.lessons.reduce((count, lesson) => count + lesson.facts.length, 0);

  console.log(`Subject: ${COURSE.subject.name}`);
  console.log(`Lessons: ${COURSE.lessons.length}`);
  console.log(`Facts: ${factCount}`);
  console.log("");

  for (const lesson of COURSE.lessons) {
    console.log(`${lesson.orderIndex}. ${lesson.title} (${lesson.facts.length} facts)`);
  }
}

async function ensureSubject(supabase, userId) {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("id", COURSE.subject.id)
    .maybeSingle();

  if (error) throw error;

  if (data) return;

  const { error: insertError } = await supabase.from("subjects").insert({
    id: COURSE.subject.id,
    name: COURSE.subject.name,
    description: COURSE.subject.description,
    icon: COURSE.subject.icon,
    is_community: false,
    created_by: userId,
  });

  if (insertError) throw insertError;
}

async function maybeResetLesson(supabase, lessonId, userId, force) {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, created_by")
    .eq("id", lessonId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { action: "insert" };
  if (!force) return { action: "skip", title: data.title };
  if (data.created_by !== userId) return { action: "skip", title: data.title };

  const { error: deleteError } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (deleteError) throw deleteError;

  return { action: "recreate", title: data.title };
}

async function insertLessonWithFacts(supabase, lesson, userId) {
  const { error: lessonError } = await supabase.from("lessons").insert({
    id: lesson.id,
    subject_id: COURSE.subject.id,
    title: lesson.title,
    description: lesson.description,
    order_index: lesson.orderIndex,
    is_community: false,
    created_by: userId,
  });

  if (lessonError) throw lessonError;

  const factRows = lesson.facts.map((fact, index) => ({
    lesson_id: lesson.id,
    content: fact.content,
    explanation: fact.explanation,
    strictness: fact.strictness,
    order_index: index + 1,
    tags: fact.tags,
  }));

  const { error: factError } = await supabase.from("facts").insert(factRows);
  if (!factError) return;

  await supabase.from("lessons").delete().eq("id", lesson.id);
  throw factError;
}

async function verifySeed(supabase) {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, lessons(id, title, order_index, facts(id))")
    .eq("id", COURSE.subject.id)
    .maybeSingle();

  if (error) throw error;

  const lessons = (data?.lessons ?? [])
    .slice()
    .sort((left, right) => left.order_index - right.order_index);

  return {
    subjectName: data?.name ?? COURSE.subject.name,
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

  if (authError) throw authError;

  const userId = authData.user?.id;
  if (!userId) {
    throw new Error("Sign-in succeeded but no user id was returned.");
  }

  await ensureSubject(supabase, userId);

  const results = [];
  for (const lesson of COURSE.lessons) {
    const status = await maybeResetLesson(supabase, lesson.id, userId, force);

    if (status.action === "skip") {
      results.push({ title: lesson.title, action: "skipped" });
      continue;
    }

    await insertLessonWithFacts(supabase, lesson, userId);
    results.push({
      title: lesson.title,
      action: status.action === "recreate" ? "recreated" : "inserted",
    });
  }

  const verification = await verifySeed(supabase);

  console.log(
    JSON.stringify(
      {
        subject: verification.subjectName,
        results,
        lessonCount: verification.lessonCount,
        lessons: verification.lessons,
      },
      null,
      2
    )
  );

  await supabase.auth.signOut();
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const modulePath = fileURLToPath(import.meta.url);

if (entryPath === modulePath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}