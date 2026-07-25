import { SlotGrid } from "@/components/panels/slot-grid";

/**
 * Workspace Health — the home screen (spec §5.1).
 *
 * The rollup itself needs providers reporting
 * (https://github.com/shaes-farm/dcc/issues/11); until then the slot engine's
 * default preset stands here, split/resize/swap/maximize and all.
 */
export default function Home() {
  return <SlotGrid />;
}
