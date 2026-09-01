"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DictateButton } from "@/components/DictateButton";
import { GlassButton } from "@/components/Glass";
import { WaterAction, WaterPane } from "@/components/WaterSurface";
import { DEMO_CARDS, gradeLocally, type LearnCard, type LearnToday } from "@/lib/learn";
import { gradeChips, isDueChip, readKeepChips } from "@/lib/keep-memory";
import {
  IDLE_HINT_MS,
  assistCopy,
  classifyRecall,
  correctFeedback,
  feedbackLeaksAnswer,
  hintsUsedForPhase,
  missNudge,
  nextAssistPhase,
  recallQuality,
  wantsAssist,
  type AssistPhase,
  type CardBead,
} from "@/lib/learn-recall";

export function LearnReview({
  demo = false,
  open,
  onClose,
  initial,
  onFinished,
  focusId,
}: {
  demo?: boolean;
  open: boolean;
  onClose: () => void;
  initial?: LearnToday | null;
  onFinished?: (next: { streak: number; reviews: number }) => void;
  focusId?: string | null;
}) {
  const pack = (() => {
    const kept = readKeepChips()
      .filter(isDueChip)
      .map((chip) => ({
      id: chip.id,
      prompt: chip.prompt,
      answer: chip.answer,
      hint: chip.hint,
      kind: chip.kind,
      token: chip.token,
      demo: false,
    }));
    const base = kept.length ? kept : (initial?.cards ?? DEMO_CARDS);
    if (!focusId) return base;
    const hit = base.findIndex((card) => card.id === focusId);
    if (hit <= 0) return base;
    return [base[hit], ...base.filter((card) => card.id !== focusId)];
  })();
  const [cards, setCards] = useState<LearnCard[]>(pack);
  const [index, setIndex] = useState(0);
  const [beads, setBeads] = useState<CardBead[]>(() =>
    pack.map(() => "pending")
  );
  const [said, setSaid] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<AssistPhase>("recall");
  const [hintLine, setHintLine] = useState<string | null>(null);
  const [softFail, setSoftFail] = useState(false);
  const [idleNudge, setIdleNudge] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    feedback: string;
    bead: CardBead;
  } | null>(null);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(initial?.streak ?? 0);
  const [isDemo, setIsDemo] = useState(
    pack.every((card) => card.demo) && (initial?.isDemo ?? !readKeepChips().length)
  );
  const [bonusUsed, setBonusUsed] = useState(false);
  const shownAtRef = useRef(0);

  function resetCard() {
    setSaid("");
    setListening(false);
    setPhase("recall");
    setHintLine(null);
    setSoftFail(false);
    setIdleNudge(false);
    setResult(null);
    shownAtRef.current = Date.now();
  }

  useEffect(() => {
    shownAtRef.current = Date.now();
    if (demo) return;
    let cancelled = false;
    void fetch("/api/learn")
      .then((res) => res.json())
      .then((data: LearnToday) => {
        if (cancelled) return;
        if (data.doneToday) {
          setDone(true);
          setStreak(data.streak);
          setIsDemo(data.isDemo);
          setCards([]);
          setBeads([]);
          return;
        }
        const nextCards = data.cards?.length ? data.cards : DEMO_CARDS;
        setCards(nextCards);
        setBeads(nextCards.map(() => "pending"));
        setIsDemo(Boolean(data.isDemo) || !data.cards?.length);
        setStreak(data.streak ?? 0);
      })
      .catch(() => {
        if (!cancelled) {
          setCards(DEMO_CARDS);
          setBeads(DEMO_CARDS.map(() => "pending"));
          setIsDemo(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [demo]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    if (done || result || phase === "reveal" || listening || busy) {
      return;
    }
    const t = window.setTimeout(() => setIdleNudge(true), IDLE_HINT_MS);
    return () => window.clearTimeout(t);
  }, [done, result, phase, listening, busy, index, said]);

  const card = cards[index];
  const revealed = phase === "reveal";

  function applyAssist(afterMiss: boolean) {
    if (!card) return;
    const next = nextAssistPhase(phase);
    setPhase(next);
    setHintLine(assistCopy(card, next));
    setSoftFail(afterMiss);
    setSaid("");
    setIdleNudge(false);
    shownAtRef.current = Date.now();
  }

  async function gradeAttempt(text: string, kind: "check" | "reveal-repeat") {
    if (!card) return { correct: false };
    if (demo) {
      return { correct: gradeLocally(text, card.answer) };
    }
    const res = await fetch("/api/learn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: card.id,
        said: text,
        hintsUsed: hintsUsedForPhase(phase),
        delayMs: Date.now() - shownAtRef.current,
        kind,
      }),
    });
    const data = (await res.json()) as {
      correct?: boolean;
      feedback?: string;
    };
    const correct = Boolean(data.correct);
    let feedback = data.feedback;
    if (
      !correct &&
      feedback &&
      feedbackLeaksAnswer(feedback, card.answer)
    ) {
      feedback = missNudge();
    }
    return { correct, feedback };
  }

  async function check() {
    if (!card || busy || result) return;
    const kind = classifyRecall(said);

    if (revealed) {
      if (!said.trim()) return;
      setBusy(true);
      try {
        const graded = await gradeAttempt(said.trim(), "reveal-repeat");
        const repeatOk = graded.correct;
        setResult({
          correct: repeatOk,
          bead: "miss",
          feedback: correctFeedback({
            quality: 0,
            hintsUsed: 2,
            revealed: true,
            repeatOk,
          }),
        });
      } finally {
        setBusy(false);
      }
      return;
    }

    if (wantsAssist(kind)) {
      applyAssist(false);
      return;
    }

    setBusy(true);
    try {
      const graded = await gradeAttempt(said.trim(), "check");
      const delayMs = Date.now() - shownAtRef.current;
      const hintsUsed = hintsUsedForPhase(phase);
      if (graded.correct) {
        const quality = recallQuality({
          correct: true,
          hintsUsed,
          delayMs,
          revealed: false,
          kind: "attempt",
        });
        setResult({
          correct: true,
          bead: "ok",
          feedback:
            graded.feedback && !feedbackLeaksAnswer(graded.feedback, card.answer)
              ? graded.feedback
              : correctFeedback({ quality, hintsUsed, revealed: false }),
        });
        return;
      }
      applyAssist(true);
    } finally {
      setBusy(false);
    }
  }

  async function finishSession() {
    setBusy(true);
    try {
      if (!demo) {
        const res = await fetch("/api/learn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ finish: true }),
        });
        const data = (await res.json()) as { streak?: number; reviews?: number };
        const nextStreak = data.streak ?? streak + 1;
        setStreak(nextStreak);
        onFinished?.({ streak: nextStreak, reviews: data.reviews ?? 1 });
      } else {
        onFinished?.({ streak: 1, reviews: 1 });
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    if (!result) return;
    const nextBeads = beads.map((bead, i) => (i === index ? result.bead : bead));
    setBeads(nextBeads);
    if (card?.id) {
      gradeChips([card.id], result.bead === "ok" ? "ok" : "miss");
    }

    if (bonusUsed) {
      await finishSession();
      return;
    }

    if (index + 1 < cards.length) {
      setIndex((n) => n + 1);
      resetCard();
      return;
    }

    if (result.bead === "miss") {
      const missIdx = nextBeads.findIndex((bead) => bead === "miss");
      if (missIdx >= 0) {
        setBonusUsed(true);
        setBeads(nextBeads.map((bead, i) => (i === missIdx ? "pending" : bead)));
        setIndex(missIdx);
        resetCard();
        return;
      }
    }

    await finishSession();
  }

  if (!open) return null;

  const finishing = result
    ? bonusUsed || (index + 1 >= cards.length && result.bead !== "miss")
    : false;
  const primaryLabel = result
    ? finishing
      ? "Finish"
      : "Next"
    : busy
      ? "Checking…"
      : "Check";

  const page = (
    <div
      className="history-overlay learn-stage"
      role="dialog"
      aria-modal="true"
      aria-labelledby="learn-title"
    >
      <div className="learn-stage-inner">
        <div className="learn-stage-head">
          <div className="learn-beads" aria-hidden="true">
            {beads.map((bead, i) => (
              <span
                key={`${cards[i]?.id ?? i}-${bead}`}
                className={`learn-bead${i === index && !done ? " is-now" : ""}${
                  bead === "ok" ? " is-ok" : ""
                }${bead === "miss" ? " is-miss" : ""}`}
              />
            ))}
          </div>
          <h1 id="learn-title" className="learn-stage-title">
            Learn
          </h1>
          <GlassButton onClick={onClose}>Close</GlassButton>
        </div>

        {done ? (
          <WaterPane className="learn-card-pane" still>
            <p className="learn-kicker">Done for today</p>
            <h2 className="learn-prompt">
              {streak ? `${streak}-day streak` : "Nice review"}
            </h2>
            <p className="login-sub">
              {isDemo
                ? "That was a sample. After you ask things worth remembering, tomorrow’s cards will come from you."
                : "Come back tomorrow for a few more from your own asks."}
            </p>
            <GlassButton onClick={onClose}>Back to Ask</GlassButton>
          </WaterPane>
        ) : card ? (
          <WaterPane className={`learn-card-pane${result?.correct ? " is-ok" : ""}`} key={card.id}>
            <p className="learn-kicker">
              {bonusUsed
                ? "One more — end on a win"
                : isDemo
                  ? "Sample"
                  : card.token
                    ? "Due"
                    : "From your asks"}
            </p>
            {card.token ? (
              <p className={`learn-token learn-token--${card.kind ?? "meaning"}`}>
                {card.token}
              </p>
            ) : null}
            <h2 className="learn-prompt">{card.prompt}</h2>
            {softFail && !result ? (
              <p className="learn-feedback">{missNudge()}</p>
            ) : null}
            {hintLine && !result ? <p className="learn-hint">{hintLine}</p> : null}
            <textarea
              className="field learn-answer"
              rows={3}
              value={said}
              onChange={(e) => {
                setIdleNudge(false);
                setSaid(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.shiftKey) return;
                e.preventDefault();
                if (result) void next();
                else void check();
              }}
              placeholder={
                revealed ? "Type it once" : "Type it, or dictate"
              }
              disabled={Boolean(result)}
              autoFocus
            />
            <div className="compose-actions learn-actions">
              <DictateButton
                value={said}
                onValueChange={(value) => {
                  setIdleNudge(false);
                  setSaid(value);
                }}
                listening={listening}
                onListeningChange={(next) => {
                  if (next) setIdleNudge(false);
                  setListening(next);
                }}
                disabled={Boolean(result)}
              />
              {result ? (
                <WaterAction type="button" onClick={() => void next()}>
                  {primaryLabel}
                </WaterAction>
              ) : (
                <WaterAction
                  type="button"
                  disabled={busy || (revealed && !said.trim())}
                  onClick={() => void check()}
                >
                  {primaryLabel}
                </WaterAction>
              )}
            </div>
            {result ? (
              <p className={`learn-feedback${result.correct ? " is-ok" : ""}`}>
                {result.feedback}
              </p>
            ) : (
              <div className="learn-soft-row">
                {phase === "reveal" ? (
                  <button
                    type="button"
                    className="learn-soft"
                    onClick={() => {
                      setResult({
                        correct: false,
                        bead: "miss",
                        feedback: "That’s alright. We’ll see this again.",
                      });
                    }}
                  >
                    Move on
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="learn-soft"
                      onClick={() => applyAssist(false)}
                    >
                      {idleNudge
                        ? phase === "recall"
                          ? "Need a hint?"
                          : "Need another hint?"
                        : "Hint"}
                    </button>
                    <button
                      type="button"
                      className="learn-soft"
                      onClick={() => applyAssist(false)}
                    >
                      I don’t know
                    </button>
                  </>
                )}
              </div>
            )}
          </WaterPane>
        ) : null}
      </div>
    </div>
  );

  return createPortal(page, document.body);
}
