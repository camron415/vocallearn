import { Suspense } from "react";
import { AskLanding } from "@/components/AskLanding";
import { ChatThread } from "@/components/ChatThread";
import { InviteSetup } from "@/components/InviteSetup";
import { LoginForm } from "@/components/LoginForm";
import { PreviewSwitcher } from "@/components/PreviewSwitcher";
import { STARTERS } from "@/lib/suggest-chips";
import type { AskMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

const RECENTS = [
  { id: "1", title: "Sourdough starter schedule", user_id: "x", created_at: "", updated_at: "" },
  { id: "2", title: "Why is the sky blue at dusk?", user_id: "x", created_at: "", updated_at: "" },
  { id: "3", title: "Cheap flights to Lisbon in March", user_id: "x", created_at: "", updated_at: "" },
  { id: "4", title: "Fix a squeaky door hinge", user_id: "x", created_at: "", updated_at: "" },
  { id: "5", title: "Best beginner guitar songs", user_id: "x", created_at: "", updated_at: "" },
  { id: "6", title: "Trader Joe's dinner ideas", user_id: "x", created_at: "", updated_at: "" },
];

const MESSAGES: AskMessage[] = [
  {
    id: "m1",
    conversation_id: "1",
    role: "user",
    content: "What's usually named as the longest river in the world?",
    created_at: "",
  },
  {
    id: "m2",
    conversation_id: "1",
    role: "assistant",
    content:
      "The **Nile** is usually named as the longest river in the world. It runs north through **Egypt** for about **4,130 miles** and empties into the Mediterranean.\n\nHerodotus called Egypt “the gift of the Nile.”",
    created_at: "",
  },
];

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    thread?: string;
    orb?: string;
    fly?: string;
    keep?: string;
    dock?: string;
    play?: string;
  }>;
}) {
  const { view, thread: threadId, orb, fly, keep, dock, play } = await searchParams;
  const harvestKey = `${orb || "drop"}-${fly || "burst"}-${keep || "pebble"}-${dock || "beads"}-${play || "0"}`;

  const rec = RECENTS.find((row) => row.id === threadId) ?? RECENTS[0];
  const screen =
    view === "chat" ? (
      <ChatThread
        key={`${harvestKey}-${rec.id}`}
        conversationId={rec.id}
        title={rec.title}
        initialMessages={MESSAGES}
        conversations={RECENTS.map((c) => ({ id: c.id, title: c.title }))}
        homeHref="/preview"
        demo
      />
    ) : view === "join" ? (
      <InviteSetup token="preview" demo />
    ) : view === "login" ? (
      <LoginForm demo />
    ) : (
      <AskLanding
        conversations={RECENTS}
        displayName="Camron"
        demo
        initialChips={STARTERS}
      />
    );

  return (
    <>
      {screen}
      <Suspense>
        <PreviewSwitcher />
      </Suspense>
    </>
  );
}
