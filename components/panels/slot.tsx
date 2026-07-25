"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  Maximize2,
  Minimize2,
  SplitSquareHorizontal,
  SplitSquareVertical,
} from "lucide-react";

import { EmptyState } from "@/components/ds/empty-state";
import { Panel } from "@/components/ds/panel";
import { Button } from "@/components/ui/button";
import { formatUri, safeParseUri, type Uri } from "@/lib/domain";
import { listSlots, useUiStore, type SlotId } from "@/lib/stores/ui";

import { PanelMount } from "./panel-mount";

/**
 * One leaf pane: its panel (or an empty-slot prompt) plus the header controls
 * that make it a *slot* rather than a bare panel — split, swap, maximize
 * (§5.3, issue #12).
 */
export function Slot({ id, uri }: { id: SlotId; uri: Uri | null }) {
  const layout = useUiStore((state) => state.layout);
  const maximizedSlotId = useUiStore((state) => state.maximizedSlotId);
  const splitSlot = useUiStore((state) => state.splitSlot);
  const swapSlots = useUiStore((state) => state.swapSlots);
  const toggleMaximized = useUiStore((state) => state.toggleMaximized);
  const [swapping, setSwapping] = useState(false);

  const otherSlots = listSlots(layout).filter((slot) => slot.id !== id);
  const maximized = maximizedSlotId === id;

  const actions = (
    <div className="flex items-center gap-0.5">
      {otherSlots.length > 0 &&
        (swapping ? (
          <select
            autoFocus
            aria-label="Swap with"
            defaultValue=""
            className="border-hairline bg-background h-6 rounded-sm border text-xs"
            onBlur={() => setSwapping(false)}
            onChange={(event) => {
              swapSlots(id, event.target.value);
              setSwapping(false);
            }}
          >
            <option value="" disabled>
              swap with…
            </option>
            {otherSlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.uri ?? "(empty)"}
              </option>
            ))}
          </select>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Swap with another slot"
            title="Swap with another slot"
            onClick={() => setSwapping(true)}
          >
            <ArrowLeftRight />
          </Button>
        ))}

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Split right"
        title="Split right"
        onClick={() => splitSlot(id, "horizontal")}
      >
        <SplitSquareHorizontal />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Split down"
        title="Split down"
        onClick={() => splitSlot(id, "vertical")}
      >
        <SplitSquareVertical />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={maximized ? "Restore" : "Maximize"}
        title={maximized ? "Restore" : "Maximize"}
        onClick={() => toggleMaximized(id)}
      >
        {maximized ? <Minimize2 /> : <Maximize2 />}
      </Button>
    </div>
  );

  if (uri === null) {
    return (
      <Panel title="Empty slot" actions={actions}>
        <EmptyState
          message="Nothing open here yet"
          action={<JumpToSlot id={id} />}
        />
      </Panel>
    );
  }

  return <PanelMount uri={uri} actions={actions} />;
}

/** Fills an empty slot from a pasted URI — the slot-local version of `JumpToUri`. */
function JumpToSlot({ id }: { id: SlotId }) {
  const setSlotUri = useUiStore((state) => state.setSlotUri);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  return (
    <form
      className="flex w-full max-w-xs flex-col gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        if (text.trim() === "") return;

        const parsed = safeParseUri(text.trim());
        if (!parsed.ok) {
          setError(parsed.error.message);
          return;
        }
        setSlotUri(id, formatUri(parsed.value));
      }}
    >
      <div className="flex gap-1.5">
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(undefined);
          }}
          spellCheck={false}
          placeholder="repo://github/acme/checkout-svc"
          aria-label="URI to open in this slot"
          aria-invalid={error !== undefined}
          className="border-hairline bg-background h-7 flex-1 rounded-md border px-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" variant="outline" size="sm">
          Open
        </Button>
      </div>
      {error ? (
        <p className="text-xs break-all text-destructive">{error}</p>
      ) : null}
    </form>
  );
}
