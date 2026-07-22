import { describe, expect, it } from "vitest";

import {
  DEFAULT_HOST,
  checkHost,
  isLoopbackHost,
  parseHostArg,
} from "./host-guard.mjs";

describe("isLoopbackHost", () => {
  it.each(["127.0.0.1", "127.0.0.53", "127.1.2.3", "localhost", "LocalHost"])(
    "accepts %s",
    (host) => {
      expect(isLoopbackHost(host)).toBe(true);
    },
  );

  it.each(["::1", "[::1]", "0:0:0:0:0:0:0:1", "::ffff:127.0.0.1"])(
    "accepts IPv6 loopback %s",
    (host) => {
      expect(isLoopbackHost(host)).toBe(true);
    },
  );

  it.each([
    "0.0.0.0",
    "192.168.1.10",
    "10.0.0.5",
    "::",
    "::ffff:192.168.1.10",
    "example.com",
    "127.0.0.1.evil.com",
    "1270.0.0.1",
    "",
  ])("rejects %s", (host) => {
    expect(isLoopbackHost(host)).toBe(false);
  });
});

describe("parseHostArg", () => {
  it("returns undefined when no host flag is present", () => {
    expect(parseHostArg(["--turbopack"])).toBeUndefined();
  });

  it("reads -H, --hostname, and --hostname=", () => {
    expect(parseHostArg(["-H", "0.0.0.0"])).toBe("0.0.0.0");
    expect(parseHostArg(["--hostname", "0.0.0.0"])).toBe("0.0.0.0");
    expect(parseHostArg(["--hostname=0.0.0.0"])).toBe("0.0.0.0");
  });

  it("lets the last occurrence win, as Next does", () => {
    expect(parseHostArg(["-H", "127.0.0.1", "-H", "0.0.0.0"])).toBe("0.0.0.0");
  });

  it("does not mistake a host value for a flag", () => {
    expect(parseHostArg(["-p", "7777", "-H", "127.0.0.1"])).toBe("127.0.0.1");
  });
});

describe("checkHost", () => {
  it("defaults to loopback when no host is requested", () => {
    const result = checkHost([]);
    expect(result).toMatchObject({ ok: true, host: DEFAULT_HOST });
  });

  it("does not inherit Next's 0.0.0.0 default", () => {
    expect(checkHost(["--turbopack"]).host).toBe("127.0.0.1");
  });

  it.each(["127.0.0.1", "localhost", "::1"])("allows %s", (host) => {
    expect(checkHost(["-H", host])).toMatchObject({ ok: true, host });
  });

  it.each(["0.0.0.0", "192.168.1.10", "::"])("refuses %s", (host) => {
    const result = checkHost(["-H", host]);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("--unsafe-host");
  });

  it.each(["0.0.0.0", "192.168.1.10"])(
    "allows %s once --unsafe-host is passed",
    (host) => {
      expect(checkHost(["-H", host, "--unsafe-host"])).toMatchObject({
        ok: true,
        host,
        unsafe: true,
      });
    },
  );

  it("refuses a host smuggled in via --hostname=", () => {
    expect(checkHost(["--hostname=0.0.0.0"]).ok).toBe(false);
  });

  it("refuses when an earlier loopback flag is overridden by a later one", () => {
    expect(checkHost(["-H", "127.0.0.1", "-H", "0.0.0.0"]).ok).toBe(false);
  });

  it("refuses a hostname flag with no value", () => {
    const result = checkHost(["-H", "--turbopack"]);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("without a value");
  });

  it("does not mark a plain loopback run as unsafe", () => {
    expect(checkHost(["-H", "127.0.0.1"]).unsafe).toBe(false);
  });
});
