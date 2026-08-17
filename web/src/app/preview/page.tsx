import { Suspense } from "react";
import { AskLanding } from "@/components/AskLanding";
import { ChatThread } from "@/components/ChatThread";
import { PreviewSwitcher } from "@/components/PreviewSwitcher";
import type { AskMessage } from "@/lib/types";

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
    content: "How do I keep a sourdough starter alive if I bake once a week?",
    created_at: "",
  },
  {
    id: "m2",
    conversation_id: "1",
    role: "assistant",
    content:
      "## Weekly feed\n\nKeep the starter **in the fridge** and feed it once a week.[[1]](https://www.kingarthurbaking.com/blog/2018/01/05/feeding-sourdough-starter)\n\nThe night before you bake:\n\n- Take it out and let it warm up\n- Discard most of it\n- Feed **equal weights** of flour and water\n\nIt should *double in 4–8 hours* at room temperature. If it smells like acetone, it is hungry, not dead.\n\n### If you skip a week\n\nFeed it once, wait until it is lively, then feed again before you mix dough.[[2]](https://www.kingarthurbaking.com)\n\n## Sources\n\n1. [King Arthur Baking](https://www.kingarthurbaking.com/blog/2018/01/05/feeding-sourdough-starter)\n2. [King Arthur Baking](https://www.kingarthurbaking.com)",
    created_at: "",
  },
];

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;

  const thread =
    view === "chat" ? (
      <ChatThread
        conversationId="1"
        title="Sourdough starter schedule"
        initialMessages={MESSAGES}
        conversations={RECENTS.map((c) => ({ id: c.id, title: c.title }))}
        homeHref="/preview"
        demo
      />
    ) : (
      <AskLanding conversations={RECENTS} displayName="Camron" demo />
    );

  return (
    <>
      {thread}
      <Suspense>
        <PreviewSwitcher />
      </Suspense>
    </>
  );
}
