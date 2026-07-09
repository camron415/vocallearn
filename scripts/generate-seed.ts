/**
 * VocalLearn Seed Generator / Explanation Rewriter
 *
 * Usage (via shell wrapper):
 *   # Rewrite explanations in an existing seed SQL file — outputs UPDATE SQL:
 *   ./scripts/generate-seed.sh --rewrite supabase/seed.sql > supabase/update_finance_voice.sql
 *
 *   # Generate a brand-new lesson from a topic — outputs INSERT SQL:
 *   ./scripts/generate-seed.sh --generate "How Vaccines Work"
 *   ./scripts/generate-seed.sh --generate "Behavioral Economics" \
 *     --subject-id a1b2c3d4-e5f6-7890-abcd-ef1234567890 --order-index 3
 */

import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { callGrok, generateLessonFromTopic, type GeneratedLesson } from "@/lib/grok";

// ── Load .env.local ────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^#\s][^=]*)=(.*)/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, "$1");
  }
}

// ── Types ──────────────────────────────────────────────────────────────────
interface ParsedFact {
  lessonId: string;
  content: string;
  explanation: string;
  strictness: string;
  orderIndex: number;
  rawTags: string; // e.g. ARRAY['compound-interest', 'definition']
}

// ── SQL Tuple Parser ────────────────────────────────────────────────────────

/** Extract all top-level (…) tuples from a SQL VALUES block, handling nested
 *  ARRAY[…] brackets and SQL-escaped single quotes correctly. */
function extractTuples(text: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let inString = false;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    if (inString) {
      if (text[i] === "'" && text[i + 1] === "'") { i++; }
      else if (text[i] === "'") { inString = false; }
    } else {
      if (text[i] === "'") { inString = true; }
      else if (text[i] === "(") {
        if (depth === 0) start = i;
        depth++;
      } else if (text[i] === ")") {
        depth--;
        if (depth === 0 && start !== -1) {
          tuples.push(text.slice(start, i + 1));
          start = -1;
        }
      }
    }
  }
  return tuples;
}

/** Parse a single (field1, field2, …) tuple into its string values.
 *  Handles SQL-escaped quotes ('') and unquoted values (numbers, ARRAY[...]). */
function parseTupleFields(tuple: string): string[] {
  const fields: string[] = [];
  // Skip outer parens
  let i = 1;
  const end = tuple.length - 1;

  while (i < end) {
    // Skip whitespace and commas between fields
    while (i < end && /[\s,]/.test(tuple[i])) i++;
    if (i >= end) break;

    if (tuple[i] === "'") {
      // Quoted string — handle '' escapes
      let val = "";
      i++;
      while (i < tuple.length) {
        if (tuple[i] === "'" && tuple[i + 1] === "'") { val += "'"; i += 2; }
        else if (tuple[i] === "'") { i++; break; }
        else { val += tuple[i++]; }
      }
      fields.push(val);
    } else {
      // Unquoted — number or ARRAY[…]; scan to next top-level comma or closing paren
      const s = i;
      let d = 0;
      let inStr = false;
      while (i < tuple.length) {
        if (inStr) {
          if (tuple[i] === "'") inStr = false;
        } else if (tuple[i] === "'") {
          inStr = true;
        } else if (tuple[i] === "[") d++;
        else if (tuple[i] === "]") d--;
        if (!inStr && d === 0 && (tuple[i] === "," || tuple[i] === ")")) break;
        i++;
      }
      const v = tuple.slice(s, i).trim();
      if (v) fields.push(v);
    }
  }
  return fields;
}

/** Parse all facts from a seed SQL file that uses INSERT INTO facts … VALUES */
function parseSeedFacts(sql: string): ParsedFact[] {
  const facts: ParsedFact[] = [];

  // Find each INSERT INTO facts … VALUES block
  const insertRegex = /INSERT INTO facts[^V]*VALUES\s*([\s\S]+?)(?=\s*(?:INSERT INTO|$|--\s*={10,}))/gi;
  let insertMatch: RegExpExecArray | null;

  while ((insertMatch = insertRegex.exec(sql)) !== null) {
    const valuesBlock = insertMatch[1];
    const tuples = extractTuples(valuesBlock);

    for (const tuple of tuples) {
      try {
        const fields = parseTupleFields(tuple);
        if (fields.length < 6) continue;

        // Validate first field looks like a UUID
        if (!/^[0-9a-f-]{36}$/.test(fields[0])) continue;

        facts.push({
          lessonId: fields[0],
          content: fields[1],
          explanation: fields[2],
          strictness: fields[3],
          orderIndex: parseInt(fields[4], 10),
          rawTags: fields[5],
        });
      } catch {
        // Skip malformed tuples
      }
    }
  }

  return facts;
}

// ── Rewrite prompt ─────────────────────────────────────────────────────────
const REWRITE_SYSTEM = `You are rewriting teaching explanations to sound natural when spoken aloud by a text-to-speech voice tutor.

Rules:
- Write as if speaking directly to the learner (use "you", active voice)
- Lead with a hook, analogy, real-world consequence, or curiosity spark — never start with "This", "Unlike", or "The"
- Short sentences (≤18 words each), no passive voice
- 2–3 sentences maximum
- This is a teaching bridge spoken BEFORE the fact is stated — set up why the fact matters or make it memorable, but do NOT restate the fact itself
- No academic language: no "is characterized by", "refers to", "demonstrates that"
- End with either why it matters or something that creates anticipation

Return ONLY the rewritten explanation. No JSON, no quotes around it, no extra commentary.`;

async function rewriteExplanation(content: string, explanation: string): Promise<string> {
  const { content: result } = await callGrok(
    [
      { role: "system", content: REWRITE_SYSTEM },
      {
        role: "user",
        content: `Fact: "${content}"\n\nCurrent explanation: "${explanation}"\n\nRewrite in spoken teaching voice:`,
      },
    ],
    { maxTokens: 120, temperature: 0.7 }
  );
  return result.trim();
}

// ── SQL generators ─────────────────────────────────────────────────────────
function escape(s: string): string {
  return s.replace(/'/g, "''");
}

function generateUpdateSql(fact: ParsedFact, newExplanation: string): string {
  return `UPDATE facts SET explanation = '${escape(newExplanation)}' WHERE lesson_id = '${fact.lessonId}' AND order_index = ${fact.orderIndex};`;
}

function generateInsertSql(lesson: GeneratedLesson, subjectId: string, lessonId: string, orderIndex: number): string {
  const lines: string[] = [
    `-- Generated lesson: ${lesson.lessonTitle}`,
    `INSERT INTO lessons (id, subject_id, title, description, order_index)`,
    `VALUES (`,
    `  '${lessonId}',`,
    `  '${subjectId}',`,
    `  '${escape(lesson.lessonTitle)}',`,
    `  '${escape(lesson.lessonDescription)}',`,
    `  ${orderIndex}`,
    `);`,
    ``,
    `INSERT INTO facts (lesson_id, content, explanation, strictness, order_index, tags) VALUES`,
  ];

  lesson.facts.forEach((fact, i) => {
    const isLast = i === lesson.facts.length - 1;
    lines.push(
      `('${lessonId}', '${escape(fact.content)}', '${escape(fact.explanation)}', '${fact.strictness}', ${i + 1}, ARRAY[]::text[])${isLast ? ";" : ","}`
    );
  });

  return lines.join("\n");
}

// ── CLI ────────────────────────────────────────────────────────────────────
async function modeRewrite(sqlFile: string): Promise<void> {
  if (!fs.existsSync(sqlFile)) {
    console.error(`File not found: ${sqlFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFile, "utf-8");
  const facts = parseSeedFacts(sql);

  if (facts.length === 0) {
    console.error("No facts found in SQL file. Check that it contains INSERT INTO facts … VALUES blocks.");
    process.exit(1);
  }

  console.error(`Found ${facts.length} facts. Rewriting explanations via Grok…`);
  console.error("(SQL output goes to stdout — redirect to a file to save)\n");

  const updates: string[] = [
    `-- Explanation rewrites for: ${path.basename(sqlFile)}`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Apply in Supabase SQL Editor`,
    ``,
  ];

  for (let i = 0; i < facts.length; i++) {
    const fact = facts[i];
    console.error(`[${i + 1}/${facts.length}] order_index=${fact.orderIndex}: ${fact.content.slice(0, 60)}…`);

    const newExplanation = await rewriteExplanation(fact.content, fact.explanation);
    updates.push(generateUpdateSql(fact, newExplanation));
    console.error(`  → ${newExplanation.slice(0, 80)}…\n`);
  }

  console.log(updates.join("\n"));
}

async function modeGenerate(topic: string, subjectId?: string, orderIndex?: number): Promise<void> {
  const finalSubjectId = subjectId ?? randomUUID();
  const lessonId = randomUUID();
  const finalOrderIndex = orderIndex ?? 1;

  console.error(`Generating lesson about: "${topic}"`);
  console.error(`Subject ID: ${finalSubjectId}`);
  console.error(`Lesson ID:  ${lessonId}\n`);

  const lesson = await generateLessonFromTopic(topic);

  if (!subjectId) {
    // Output a subject INSERT too
    console.log(`-- Generated subject + lesson for: ${topic}`);
    console.log(`-- Generated: ${new Date().toISOString()}`);
    console.log(``);
    console.log(`INSERT INTO subjects (id, name, description, icon, is_community) VALUES (`);
    console.log(`  '${finalSubjectId}',`);
    console.log(`  '${escape(lesson.subjectName)}',`);
    console.log(`  '${escape(lesson.lessonDescription)}',`);
    console.log(`  '📚',`);
    console.log(`  false`);
    console.log(`);`);
    console.log(``);
  } else {
    console.log(`-- Generated lesson for subject: ${subjectId}`);
    console.log(`-- Topic: ${topic}`);
    console.log(`-- Generated: ${new Date().toISOString()}`);
    console.log(``);
  }

  console.log(generateInsertSql(lesson, finalSubjectId, lessonId, finalOrderIndex));
  console.error(`\nDone! ${lesson.facts.length} facts generated.`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const rewriteIdx = args.indexOf("--rewrite");
  const generateIdx = args.indexOf("--generate");
  const subjectIdx = args.indexOf("--subject-id");
  const orderIdx = args.indexOf("--order-index");

  const subjectId = subjectIdx !== -1 ? args[subjectIdx + 1] : undefined;
  const orderIndex = orderIdx !== -1 ? parseInt(args[orderIdx + 1], 10) : undefined;

  if (rewriteIdx !== -1) {
    const sqlFile = args[rewriteIdx + 1];
    if (!sqlFile) { console.error("Usage: --rewrite <sql-file>"); process.exit(1); }
    await modeRewrite(path.resolve(sqlFile));
  } else if (generateIdx !== -1) {
    const topic = args[generateIdx + 1];
    if (!topic) { console.error("Usage: --generate \"Topic Name\""); process.exit(1); }
    await modeGenerate(topic, subjectId, orderIndex);
  } else {
    console.error("Usage:");
    console.error("  --rewrite <sql-file>              Rewrite explanations in an existing seed");
    console.error("  --generate \"Topic\"                Generate a new lesson from scratch");
    console.error("  --generate \"Topic\" --subject-id <uuid>   Add to existing subject");
    console.error("  --generate \"Topic\" --order-index 2       Set lesson order");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
