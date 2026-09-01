import type { KeyboardEvent } from "react";

/** Enter sends. Shift+Enter inserts a line. */
export function handleComposeKeyDown(
  event: KeyboardEvent<HTMLTextAreaElement>
) {
  if (event.key !== "Enter" || event.shiftKey) return;
  // 229 = IME composition on some browsers; don't steal that Enter.
  if (event.nativeEvent.isComposing && event.nativeEvent.keyCode === 229) {
    return;
  }
  event.preventDefault();
  const form = event.currentTarget.form;
  if (!form) return;
  if (typeof form.requestSubmit === "function") {
    const submitter = form.querySelector<HTMLButtonElement>(
      'button[type="submit"]:not(:disabled)'
    );
    if (submitter) form.requestSubmit(submitter);
    else form.requestSubmit();
    return;
  }
  form.querySelector<HTMLButtonElement>('button[type="submit"]:not(:disabled)')
    ?.click();
}
