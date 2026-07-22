/**
 * Loopback binding guard — spec §10.1.
 *
 * DCC is a local-first control plane holding live credentials for GitHub,
 * Kubernetes and observability upstreams. Binding it to a routable interface
 * exposes that authority to anything on the network, so the default is
 * 127.0.0.1 and anything else must be opted into explicitly.
 *
 * Next's own default is 0.0.0.0, so this cannot be left to the framework.
 *
 * Pure functions only — no process access, no exits. The caller decides what
 * to do with a refusal.
 */

export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = "7777";
export const UNSAFE_HOST_FLAG = "--unsafe-host";

/** Hostnames that always resolve to the local machine. */
const LOOPBACK_NAMES = new Set(["localhost", "ip6-localhost", "ip6-loopback"]);

/**
 * IPv6 loopback, including the IPv4-mapped forms (::ffff:127.0.0.1) and the
 * zero-compressed spellings Node accepts.
 */
function isIpv6Loopback(host) {
  const bare = host.replace(/^\[|\]$/g, "").split("%")[0].toLowerCase();
  if (bare === "::1" || bare === "0:0:0:0:0:0:0:1") return true;
  const mapped = bare.match(/^::ffff:(.+)$/);
  return mapped ? isIpv4Loopback(mapped[1]) : false;
}

/** The whole 127.0.0.0/8 block is loopback, not just 127.0.0.1. */
function isIpv4Loopback(host) {
  const octets = host.split(".");
  if (octets.length !== 4) return false;
  if (!octets.every((o) => /^\d{1,3}$/.test(o) && Number(o) <= 255)) return false;
  return octets[0] === "127";
}

export function isLoopbackHost(host) {
  if (typeof host !== "string" || host.length === 0) return false;
  const normalized = host.trim().toLowerCase();
  return (
    LOOPBACK_NAMES.has(normalized) ||
    isIpv4Loopback(normalized) ||
    isIpv6Loopback(normalized)
  );
}

/**
 * Pull the host out of an argv array, honouring both `-H value` and
 * `--hostname=value`. Later occurrences win, matching how Next itself
 * resolves repeated flags.
 */
export function parseHostArg(argv) {
  let host;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-H" || arg === "--hostname") {
      host = argv[i + 1];
      i++;
    } else if (arg.startsWith("--hostname=")) {
      host = arg.slice("--hostname=".length);
    }
  }
  return host;
}

/**
 * Decide whether the requested binding is allowed.
 *
 * @returns {{ ok: true, host: string, unsafe: boolean } | { ok: false, host: string, reason: string }}
 */
export function checkHost(argv) {
  const unsafe = argv.includes(UNSAFE_HOST_FLAG);
  const requested = parseHostArg(argv);

  // No -H at all: bind loopback regardless of what Next would have defaulted to.
  if (requested === undefined) {
    return { ok: true, host: DEFAULT_HOST, unsafe };
  }

  // `-H` with nothing after it is a malformed invocation, not a bind request.
  if (requested === "" || requested.startsWith("-")) {
    return {
      ok: false,
      host: requested,
      reason: "The --hostname flag was given without a value.",
    };
  }

  if (isLoopbackHost(requested)) {
    return { ok: true, host: requested, unsafe };
  }

  if (unsafe) {
    return { ok: true, host: requested, unsafe: true };
  }

  return {
    ok: false,
    host: requested,
    reason:
      `Refusing to bind to non-loopback host "${requested}".\n` +
      "DCC holds live credentials for your upstreams and is meant to listen on\n" +
      `the loopback interface only (spec §10.1). Pass ${UNSAFE_HOST_FLAG} if you\n` +
      "genuinely intend to expose it on this network.",
  };
}
