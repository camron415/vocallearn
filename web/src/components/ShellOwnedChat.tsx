"use client";

import type { ReactNode } from "react";
import { shellOwnsChat } from "@/lib/shell-chat";

/** Skip a second ChatThread when the shell already mounted this conversation. */
export function ShellOwnedChat({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  if (shellOwnsChat(id)) return null;
  return children;
}
