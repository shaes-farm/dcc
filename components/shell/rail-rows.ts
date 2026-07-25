import type { DccConfig } from "@/lib/config/schema";
import { formatUri, type Status, type Uri } from "@/lib/domain";

/**
 * What the service rail draws (spec §5.2).
 *
 * Kept apart from the component so the addressability rule is testable without
 * a DOM: §5.2's rail is "services (from config + inference), each with a status
 * dot rolled up from everything related to it", and every row is addressed by
 * its `service://<id>` URI.
 *
 * URIs are minted with `formatUri` rather than concatenated, so the rail cannot
 * produce a string the codec would refuse to parse back.
 */
export interface ServiceRailRow {
  uri: Uri;
  label: string;
  status: Status;
}

/**
 * Config is inference-first (§4.2): `{ "id": "checkout" }` is a complete
 * service, so the label falls back to the id rather than inventing a
 * prettified name — that guess belongs to the inference resolver
 * (https://github.com/shaes-farm/dcc/issues/9), not to a rail row.
 *
 * Every row is `unknown` for now. There is nothing to roll up until providers
 * report (https://github.com/shaes-farm/dcc/issues/11), and §2.2's rule is
 * that missing data is `unknown` — never a guessed `healthy`.
 */
export function serviceRailRows(config: DccConfig): ServiceRailRow[] {
  return (config.services ?? []).map((service) => ({
    uri: formatUri({ scheme: "service", service: service.id }),
    label: service.name ?? service.id,
    status: "unknown",
  }));
}
