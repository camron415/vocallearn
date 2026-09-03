import type { Metadata } from "next";
import { Suspense } from "react";
import { AskLanding } from "@/components/AskLanding";
import { ChatThread } from "@/components/ChatThread";
import { InviteSetup } from "@/components/InviteSetup";
import { LoginForm } from "@/components/LoginForm";
import { PreviewSwitcher } from "@/components/PreviewSwitcher";
import { showPreviewMixer } from "@/lib/lab-preview";
import { PREVIEW_RECIPE_ASK, PREVIEW_RECIPE_REPLY } from "@/lib/save-offer";
import { STARTERS } from "@/lib/suggest-chips";
import type { AskMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

const SAVE_DEMO_ID = "save-demo";
const SAVE_DEMO_MESSAGES: AskMessage[] = [
  {
    id: "save-demo-user",
    conversation_id: SAVE_DEMO_ID,
    role: "user",
    content: PREVIEW_RECIPE_ASK,
    created_at: "",
  },
  {
    id: "save-demo-assistant",
    conversation_id: SAVE_DEMO_ID,
    role: "assistant",
    content: PREVIEW_RECIPE_REPLY,
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
    mixer?: string;
    save?: string;
  }>;
}) {
  const { view, thread: threadId, orb, fly, keep, dock, play, mixer, save } =
    await searchParams;
  const labMixer = showPreviewMixer(mixer);
  const harvestKey = `${orb || "drop"}-${fly || "burst"}-${keep || "pebble"}-${dock || "beads"}-${play || "0"}`;
  const saveDemo = save === "1" || save === "demo";

  const rec = saveDemo
    ? { id: SAVE_DEMO_ID, title: "Baked Alaska recipe", user_id: "x", created_at: "", updated_at: "" }
    : RECENTS.find((row) => row.id === threadId) ?? RECENTS[0];
  const chatMessages = saveDemo ? SAVE_DEMO_MESSAGES : MESSAGES;
  const screen =
    view === "chat" ? (
      <ChatThread
        key={`${harvestKey}-${rec.id}`}
        conversationId={rec.id}
        title={rec.title}
        initialMessages={chatMessages}
        conversations={RECENTS.map((c) => ({ id: c.id, title: c.title }))}
        homeHref="/preview"
        demo
        saveDemo={saveDemo}
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
      {labMixer ? (
        <Suspense>
          <PreviewSwitcher />
        </Suspense>
      ) : null}
    </>
  );
}
