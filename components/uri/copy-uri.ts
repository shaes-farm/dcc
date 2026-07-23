import type { Uri } from "@/lib/domain";

/**
 * Copies a URI to the clipboard (spec §3.2, "Copy link").
 *
 * `navigator.clipboard` is available here — DCC binds to 127.0.0.1, which
 * browsers treat as a secure context (§10.1) — but it is still absent behind
 * some permission policies, so the old `execCommand` path stays as a fallback.
 * Copy link failing silently would be worse than the feature not existing:
 * the engineer pastes whatever was in the buffer before.
 */
export async function copyUri(uri: Uri): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(uri);
      return true;
    } catch {
      // Fall through — a rejected permission is not a reason to give up.
    }
  }

  const field = document.createElement("textarea");
  field.value = uri;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);

  // Several browsers only copy a selection that sits inside the focused
  // element, so selecting without focusing first fails quietly and reports
  // success. `preventScroll` because the field is off-screen by design.
  const previouslyFocused = document.activeElement;
  field.focus({ preventScroll: true });
  field.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
    // Copy link is invoked from a focused object (⌘-click, or the context menu
    // opened with the Menu key), and §5.4 wants that keyboard flow unbroken —
    // so focus goes back where it was rather than to the body.
    if (previouslyFocused instanceof HTMLElement) {
      previouslyFocused.focus({ preventScroll: true });
    }
  }
}
