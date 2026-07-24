import { describe, expect, it } from "vitest";

import { locateJsonPath } from "./locate";

const RAW = `{
  "workspace": { "name": "Acme", "defaultEnvironment": "dev" },
  "services": [
    { "id": "storefront" },
    { "id": "checkout", "repository": "unknown-repo" }
  ]
}`;

/** The `length` characters of `raw` starting at a 1-indexed line/column. */
function valueAt(
  raw: string,
  position: { line: number; column: number },
  length: number,
): string {
  const lineText = raw.split("\n")[position.line - 1];
  return lineText.slice(position.column - 1, position.column - 1 + length);
}

describe("locateJsonPath", () => {
  it("locates a top-level object key", () => {
    const position = locateJsonPath(RAW, ["workspace"]);

    expect(position).toBeDefined();
    expect(valueAt(RAW, position!, 1)).toBe("{");
  });

  it("locates a nested object key", () => {
    const position = locateJsonPath(RAW, ["workspace", "name"]);

    expect(position).toBeDefined();
    expect(valueAt(RAW, position!, 6)).toBe('"Acme"');
  });

  it("locates a value inside an array of objects", () => {
    const position = locateJsonPath(RAW, ["services", 1, "id"]);

    expect(position).toBeDefined();
    expect(valueAt(RAW, position!, 10)).toBe('"checkout"');
  });

  it("locates a field used by a reference-integrity check path", () => {
    // Mirrors the shape `checkReference` passes for `services[].repository`.
    const position = locateJsonPath(RAW, ["services", 1, "repository"]);

    expect(position).toBeDefined();
    expect(valueAt(RAW, position!, 14)).toBe('"unknown-repo"');
  });

  it("returns undefined for a key that does not exist", () => {
    expect(locateJsonPath(RAW, ["workspace", "nope"])).toBeUndefined();
  });

  it("returns undefined for an array index out of range", () => {
    expect(locateJsonPath(RAW, ["services", 5])).toBeUndefined();
  });

  it("returns undefined when a path segment's kind doesn't match the container", () => {
    // "workspace" resolves to an object, so a numeric segment can't descend
    // into it — the way an issue path could look if `checkReferenceIntegrity`
    // ever ran against a config shaped differently than the path assumes.
    expect(locateJsonPath(RAW, ["workspace", 0])).toBeUndefined();
  });

  it("returns the document start for an empty path", () => {
    expect(locateJsonPath(RAW, [])).toEqual({ line: 1, column: 1 });
  });

  it("locates the last occurrence of a duplicate key, matching JSON.parse", () => {
    const raw = '{ "id": "checkout", "repository": "a", "repository": "b" }';

    const position = locateJsonPath(raw, ["repository"]);

    expect(position).toBeDefined();
    expect(valueAt(raw, position!, 3)).toBe('"b"');
  });

  it("locates a key containing a JSON escape sequence", () => {
    const raw = '{ "services": { "qa\\"prod": "value" } }';

    const position = locateJsonPath(raw, ["services", 'qa"prod']);

    expect(position).toBeDefined();
    expect(valueAt(raw, position!, 7)).toBe('"value"');
  });
});
