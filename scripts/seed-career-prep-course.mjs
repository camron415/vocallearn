import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

/** Stable id — also used for unlock bypass in lesson-store / subjects UI when added. */
export const CAREER_PREP_SUBJECT_ID = "a9b8c7d6-e5f4-4321-abcd-ef9876543210";

export const COURSE = {
  subject: {
    id: CAREER_PREP_SUBJECT_ID,
    name: "Career Prep: Interview Fundamentals",
    description:
      "Concrete, analogy-rich fundamentals for junior frontend interviews — React, the web stack, APIs, data, and Git — so you can explain concepts in your own words, not just prompt AI.",
    icon: "🎯",
  },
  lessons: [
    {
      id: "b1c2d3e4-f5a6-4789-bcde-f01234567801",
      title: "Frontend & React Fundamentals",
      description:
        "HTML through the DOM — the building blocks of the web and React, explained in everyday language for interview recall.",
      orderIndex: 1,
      facts: [
        {
          content:
            "HTML is the markup language that defines a web page's structure and content, like headings, buttons, and forms.",
          explanation:
            "Think of HTML as the skeleton of a house — it marks where the walls, doors, and windows go, but it does not paint them or make the lights work.",
          strictness: "medium",
          tags: ["HTML", "markup", "page structure"],
        },
        {
          content:
            "CSS styles HTML with color, layout, spacing, and fonts, and SCSS adds variables and nesting on top of plain CSS.",
          explanation:
            "If HTML is the skeleton, CSS is the paint, furniture, and floor plan. SCSS is like labeled storage bins in a garage — same house, but easier to organize repeated styles.",
          strictness: "medium",
          tags: ["CSS", "SCSS", "styling", "layout"],
        },
        {
          content:
            "Bootstrap is a CSS framework of ready-made responsive components like buttons, grids, and navbars so you don't style everything from scratch.",
          explanation:
            "It is like buying pre-built kitchen modules instead of carving every cabinet yourself — you still assemble and customize, but the baseline layout is already done.",
          strictness: "medium",
          tags: ["Bootstrap", "CSS framework", "responsive components"],
        },
        {
          content:
            "JavaScript is the language that makes web pages interactive by responding to clicks, updating content, and calling servers.",
          explanation:
            "HTML sets the structure, CSS sets the look, and JavaScript is the electricity — lights turn on, buttons respond, and the page can call outside for fresh data.",
          strictness: "medium",
          tags: ["JavaScript", "interactivity", "client-side"],
        },
        {
          content:
            "React is a JavaScript library for building user interfaces out of reusable pieces called components.",
          explanation:
            "Instead of one giant page script, React is like LEGO for UI — you build small blocks once and snap them together into screens that stay maintainable as the app grows.",
          strictness: "medium",
          tags: ["React", "UI library", "components"],
        },
        {
          content:
            "A component is a self-contained, reusable piece of UI, like a button or form, that you combine to build a page.",
          explanation:
            "Think of a component like a prefab room module — a navbar room, a login room — each has a clear job and you wire them together on the page.",
          strictness: "medium",
          tags: ["component", "reusable UI", "composition"],
        },
        {
          content:
            "Props are the inputs passed into a component to configure it, like arguments to a function, and they are read-only from the child.",
          explanation:
            "Props are like order tickets passed to a kitchen station — the parent says make this size, this label, this color, and the child renders it without rewriting the ticket.",
          strictness: "medium",
          tags: ["props", "component inputs", "read-only"],
        },
        {
          content:
            "State is data a component owns and can change over time, and when state changes React re-renders that part of the screen.",
          explanation:
            "State is like the score on a sports bar TV — when the number changes, only the board updates, not the entire building.",
          strictness: "medium",
          tags: ["state", "re-render", "local data"],
        },
        {
          content:
            "JSX is the HTML-like syntax used inside React to describe what the UI should look like.",
          explanation:
            "JSX looks like HTML, but it is JavaScript's way of writing a blueprint sentence: render a header, then a button, then pass this label. It keeps UI structure next to the logic that owns it.",
          strictness: "medium",
          tags: ["JSX", "React syntax", "UI description"],
        },
        {
          content:
            "The DOM is the browser's live tree-shaped model of the page that JavaScript reads and updates to change what the user sees.",
          explanation:
            "Picture a family tree of every tag on the page — the browser keeps that tree in memory, and JavaScript can add branches or change labels without reloading the whole site.",
          strictness: "medium",
          tags: ["DOM", "document object model", "browser tree"],
        },
      ],
    },
    {
      id: "c2d3e4f5-a6b7-4890-cdef-012345678902",
      title: "APIs, Data & Version Control",
      description:
        "REST, HTTP, JSON, MySQL, PHP/Laravel, and Git — the backend and collaboration vocabulary for the role you're targeting.",
      orderIndex: 2,
      facts: [
        {
          content:
            "An API is a defined way for two programs to talk to each other, with a contract for requesting and exchanging data.",
          explanation:
            "An API is like a restaurant menu with rules — you know what you can order, what you will get back, and what happens if the kitchen cannot make it.",
          strictness: "medium",
          tags: ["API", "contract", "program communication"],
        },
        {
          content:
            "A REST API is a common web style where you act on resources like users or jobs over HTTP using standard actions.",
          explanation:
            "REST treats data like labeled folders in a filing cabinet — users, jobs, applications — and you use the same handful of verbs to open, add, update, or remove what is inside.",
          strictness: "medium",
          tags: ["REST API", "resources", "HTTP"],
        },
        {
          content:
            "HTTP methods are the verbs of web requests: GET reads, POST creates, PUT or PATCH updates, and DELETE removes.",
          explanation:
            "Think of a shared shopping list on the fridge — GET reads it, POST adds a new item, PATCH edits a line, and DELETE wipes one off.",
          strictness: "high",
          tags: ["HTTP methods", "GET POST PUT PATCH DELETE", "REST verbs"],
        },
        {
          content:
            "An endpoint is a specific API URL for a resource or action, like /users/123.",
          explanation:
            "If the API is the restaurant, the endpoint is the exact window you walk up to — pick up user 123 here — not the whole building.",
          strictness: "medium",
          tags: ["endpoint", "API URL", "resource path"],
        },
        {
          content:
            "JSON is the lightweight text format most APIs use to send structured data as key-value pairs.",
          explanation:
            'JSON looks like a labeled packing list — {"name": "Camron", "role": "junior dev"} — easy for humans to skim and easy for programs to parse.',
          strictness: "medium",
          tags: ["JSON", "key-value", "data format"],
        },
        {
          content:
            "A database like MySQL is an organized data store that keeps information in relational tables of rows and columns.",
          explanation:
            "MySQL is like a spreadsheet warehouse with many linked tabs — users in one table, jobs in another — with rules so related rows stay consistent.",
          strictness: "medium",
          tags: ["MySQL", "database", "relational tables"],
        },
        {
          content:
            "PHP is a server-side language used to build web-app backends, including the PHP apps this role maintains.",
          explanation:
            "PHP runs in the kitchen, not at the customer's table — the browser asks for a page, PHP prepares data on the server, then serves the finished plate.",
          strictness: "medium",
          tags: ["PHP", "server-side", "backend"],
        },
        {
          content:
            "Laravel is a popular PHP framework that gives structure for routing, databases, authentication, and more when building web apps.",
          explanation:
            "Raw PHP is like cooking in an empty rental kitchen; Laravel is a stocked commercial kitchen with labeled stations for routes, models, and auth already laid out.",
          strictness: "medium",
          tags: ["Laravel", "PHP framework", "routing"],
        },
        {
          content:
            "Git is a version-control tool that tracks changes to code over time so you can review history and collaborate safely.",
          explanation:
            "Git is a time machine plus lab notebook for your codebase — every save is timestamped, labeled, and reversible if an experiment goes wrong.",
          strictness: "medium",
          tags: ["Git", "version control", "collaboration"],
        },
        {
          content:
            "In Git, a commit is a saved snapshot of changes, a branch is a separate line of work, and a pull request proposes merging a branch after review.",
          explanation:
            "A commit is a saved chapter, a branch is a draft notebook where you will not mess up the main story, and a pull request is asking teammates to proofread before that draft joins the official book.",
          strictness: "medium",
          tags: ["commit", "branch", "pull request", "Git workflow"],
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
  console.log(`Subject id: ${COURSE.subject.id}`);
  console.log(`Lessons: ${COURSE.lessons.length}`);
  console.log(`Facts: ${factCount}`);
  console.log("");

  for (const lesson of COURSE.lessons) {
    console.log(`${lesson.orderIndex}. ${lesson.title} (${lesson.facts.length} facts)`);
    for (const [index, fact] of lesson.facts.entries()) {
      console.log(`   ${index + 1}. ${fact.content.slice(0, 72)}...`);
    }
    console.log("");
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
    unlock_threshold: 0.7,
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
