import type { KeyboardEvent } from "react";

/** Enter sends. Shift+Enter inserts a line. */
export function handleComposeKeyDown(
  event: KeyboardEvent<HTMLTextAreaElement>
) {
  if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
    return;
  }
  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
}
