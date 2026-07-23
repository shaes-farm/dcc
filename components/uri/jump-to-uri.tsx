"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useUriNavigation } from "@/lib/routing/use-uri-navigation";

/**
 * Paste a URI, go to it (spec §3.2).
 *
 * **Temporary.** §3.2 puts this in the command palette — "paste a URI to jump"
 * (§5.4) — and the palette is
 * https://github.com/shaes-farm/dcc/issues/14. Until it exists there is nowhere
 * to paste, so the routing layer would ship with half of its acceptance
 * criterion undemonstrable. This is that half, in the smallest form that works.
 *
 * #14 deletes this file and calls `navigateToUriText` from the palette. Nothing
 * else has to change, which is the point of putting the logic in the hook
 * rather than here.
 */
export function JumpToUri() {
  const { navigateToUriText } = useUriNavigation();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  return (
    <form
      className="flex w-full max-w-md flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (text.trim() === "") return;

        const result = navigateToUriText(text);
        setError(result.ok ? undefined : result.error.message);
      }}
    >
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(undefined);
          }}
          spellCheck={false}
          placeholder="service://checkout"
          aria-label="Jump to a resource URI"
          aria-invalid={error !== undefined}
          className="h-8 flex-1 rounded-lg border border-border bg-background px-2.5 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
        />
        <Button type="submit" variant="outline">
          Jump
        </Button>
      </div>

      {error ? (
        <p className="font-mono text-xs break-all text-destructive">{error}</p>
      ) : null}
    </form>
  );
}
