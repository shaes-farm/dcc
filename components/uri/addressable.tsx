"use client";

import { useEffect, useRef, useState } from "react";
import { Link2, Check } from "lucide-react";

import type { Uri } from "@/lib/domain";
import { useUriNavigation } from "@/lib/routing/use-uri-navigation";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { copyUri } from "./copy-uri";

/**
 * Anything rendered, carrying its URI (spec §3.2).
 *
 * §3.2's rule is that every object anywhere is copyable as a link:
 * "right-click/⌘-click → Copy link". Wrapping rather than styling is the point
 * — a repo row, a pod name, a lineage node, and a cockpit header are all
 * different components, and none of them should have to know how to copy
 * itself.
 *
 * Three ways in, because §5.4 requires every flow to be completable from the
 * keyboard:
 *
 * - right-click → the context menu
 * - ⌘/Ctrl-click → copy, no menu
 * - focus + the Menu key (or Shift+F10) → the same context menu, since browsers
 *   raise a `contextmenu` event for it and the trigger is focusable
 */
export function Addressable({
  uri,
  children,
  className,
  onOpen,
}: {
  uri: Uri;
  children: React.ReactNode;
  className?: string;
  /** What a plain click does. Defaults to opening the URI. */
  onOpen?: () => void;
}) {
  const { navigateToUri } = useUriNavigation();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    const ok = await copyUri(uri);
    if (!ok) return;

    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  }

  function open() {
    if (onOpen) onOpen();
    else navigateToUri(uri);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <span
          role="link"
          tabIndex={0}
          data-copied={copied || undefined}
          aria-label={uri}
          className={cn(
            "group inline-flex cursor-pointer items-center gap-1.5 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            className,
          )}
          onClick={(event) => {
            // ⌘-click on macOS, Ctrl-click elsewhere. Both also mean "open in a
            // new tab" to a browser, but this is a span, not an anchor, so
            // nothing is being overridden.
            if (event.metaKey || event.ctrlKey) {
              event.preventDefault();
              void copy();
              return;
            }
            open();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              open();
            }
          }}
        >
          {children}
          <span
            aria-hidden
            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[copied]:opacity-100"
          >
            {copied ? (
              <Check className="size-3" />
            ) : (
              <Link2 className="size-3" />
            )}
          </span>
          <span aria-live="polite" className="sr-only">
            {copied ? "Link copied" : ""}
          </span>
        </span>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onSelect={() => void copy()}>
          <Link2 />
          Copy link
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
