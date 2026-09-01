import { NextResponse } from "next/server";
import { callGrokChat } from "@/lib/grok";
import {
  DEMO_CARDS,
  gradeLocally,
  nextStreak,
  todayStamp,
  type LearnCard,
  type LearnToday,
} from "@/lib/learn";
import {
  classifyRecall,
  correctFeedback,
  feedbackLeaksAnswer,
  missNudge,
  recallQuality,
  wantsAssist,
} from "@/lib/learn-recall";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null as null };
  const { data: member } = await supabase
    .from("halo_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return { supabase, user: null };
  return { supabase, user };
}

function pickThree(mined: LearnCard[]): LearnToday {
  if (mined.length === 0) {
    return {
      doneToday: false,
      isDemo: true,
      streak: 0,
      reviews: 0,
      remaining: DEMO_CARDS.length,
      cards: DEMO_CARDS,
    };
  }
  return {
    doneToday: false,
    isDemo: false,
    streak: 0,
    reviews: 0,
    remaining: Math.min(3, mined.length),
    cards: mined.slice(0, 3),
  };
}

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayStamp();
  const [{ data: profile }, minedResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("halo_learn_streak, halo_learn_last_day, halo_learn_reviews")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("halo_learn_cards")
      .select("id, prompt, answer, hint")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const mined = minedResult.error ? [] : minedResult.data;

  const cards = pickThree(
    (mined ?? []).map((row) => ({
      id: row.id as string,
      prompt: row.prompt as string,
      answer: row.answer as string,
      hint: (row.hint as string | null) ?? undefined,
    }))
  );
  const streak = profile?.halo_learn_streak ?? 0;
  const reviews = profile?.halo_learn_reviews ?? 0;
  const last = profile?.halo_learn_last_day as string | null;
  const doneToday = last === today;

  if (doneToday) {
    return NextResponse.json({
      ...cards,
      doneToday: true,
      remaining: 0,
      cards: [],
      streak,
      reviews,
    } satisfies LearnToday);
  }

  return NextResponse.json({
    ...cards,
    streak,
    reviews,
  } satisfies LearnToday);
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    cardId?: string;
    said?: string;
    finish?: boolean;
    hintsUsed?: number;
    delayMs?: number;
    kind?: "check" | "reveal-repeat";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const today = todayStamp();

  if (body.finish) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("halo_learn_streak, halo_learn_last_day, halo_learn_reviews")
      .eq("id", user.id)
      .maybeSingle();
    const last = profile?.halo_learn_last_day as string | null;
    if (last === today) {
      return NextResponse.json({
        ok: true,
        streak: profile?.halo_learn_streak ?? 1,
        reviews: profile?.halo_learn_reviews ?? 0,
      });
    }
    const streak = nextStreak(last, profile?.halo_learn_streak ?? 0, today);
    const reviews = (profile?.halo_learn_reviews ?? 0) + 1;
    await supabase
      .from("profiles")
      .update({
        halo_learn_streak: streak,
        halo_learn_last_day: today,
        halo_learn_reviews: reviews,
      })
      .eq("id", user.id);
    return NextResponse.json({ ok: true, streak, reviews });
  }

  const cardId = body.cardId ?? "";
  const said = (body.said ?? "").trim();
  if (!cardId || !said) {
    return NextResponse.json({ error: "Answer required" }, { status: 400 });
  }

  const recallKind = classifyRecall(said);
  if (body.kind !== "reveal-repeat" && wantsAssist(recallKind)) {
    return NextResponse.json({ assist: true, correct: false });
  }

  const demo = DEMO_CARDS.find((card) => card.id === cardId);
  let expected = demo?.answer ?? "";
  if (!demo) {
    const { data: row } = await supabase
      .from("halo_learn_cards")
      .select("answer, hint")
      .eq("id", cardId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!row) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    expected = row.answer as string;
  }

  const revealed = body.kind === "reveal-repeat";
  const hintsUsed = Math.max(0, Math.min(2, body.hintsUsed ?? 0));
  const delayMs = Math.max(0, body.delayMs ?? 0);
  let correct = gradeLocally(said, expected);
  let feedback = "";

  if (!demo && !revealed && !correct) {
    try {
      const raw = await callGrokChat(
        [
          {
            role: "user",
            content: `Question: ${cardId}\nExpected: ${expected}\nThey said: ${said}\nReturn JSON {"correct":true|false,"feedback":"one short sentence"}`,
          },
        ],
        {
          tools: false,
          effort: "none",
          maxTokens: 120,
          system:
            "Grade a short recall answer. Be kind. correct is true if they have the idea, even if wording differs. If incorrect, do not state or hint the expected answer.",
        }
      );
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start >= 0 && end > start) {
        const parsed = JSON.parse(raw.slice(start, end + 1)) as {
          correct?: boolean;
          feedback?: string;
        };
        if (typeof parsed.correct === "boolean") correct = parsed.correct;
        if (parsed.feedback) feedback = parsed.feedback;
      }
    } catch {
      /* local grade stands */
    }
  }

  const quality = recallQuality({
    correct,
    hintsUsed,
    delayMs,
    revealed,
    kind: recallKind,
  });
  if (
    !feedback ||
    (feedbackLeaksAnswer(feedback, expected) && !revealed)
  ) {
    feedback = correct
      ? correctFeedback({ quality, hintsUsed, revealed, repeatOk: correct })
      : missNudge();
  }

  await supabase.from("halo_learn_attempts").insert({
    user_id: user.id,
    card_key: cardId,
    day: today,
    correct: revealed ? false : correct,
  });

  return NextResponse.json({
    correct,
    feedback,
    quality,
  });
}
