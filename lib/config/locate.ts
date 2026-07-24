/**
 * Maps a `ConfigIssue.path` (§4.1's Zod path — a mix of object keys and array
 * indices, e.g. `["services", 2, "repository"]`) back to a line/column in the
 * raw config text, for the repair screen (§4.3, #8) to show "line references"
 * alongside each error.
 *
 * `JSON.parse` throws away source positions, so this is a small hand-rolled
 * scanner in the same spirit as `levenshteinDistance` in
 * `reference-integrity.ts` — no package in this repo's dependency tree parses
 * JSON with position tracking, and it isn't worth a new dependency for one
 * narrow need.
 *
 * It only has to handle syntactically *valid* JSON: it is only ever called
 * with the raw text of a file that already passed `JSON.parse` (a schema or
 * reference-integrity issue implies the JSON itself parsed fine — a parse
 * failure is reported separately, from the `SyntaxError` itself, in
 * `load.ts`). Scanning tracks only a character offset; line/column are
 * computed once at the end rather than threaded through every step.
 */

/** A 1-indexed line/column position in the raw config text. */
export interface TextPosition {
  line: number;
  column: number;
}

/**
 * The position of the value at `path` within `raw`, or `undefined` if `path`
 * does not resolve — a container of the wrong kind, or a key/index that isn't
 * there. That mirrors `reference-integrity.ts`'s "reads defensively" stance:
 * an issue's `path` is trusted to point somewhere sensible, but not blindly,
 * since `superRefine` runs even when other parts of the config are malformed.
 */
export function locateJsonPath(
  raw: string,
  path: (string | number)[],
): TextPosition | undefined {
  const offset = descend(raw, skipWhitespace(raw, 0), path);
  return offset === undefined ? undefined : offsetToLineColumn(raw, offset);
}

/** Index of the first non-whitespace character at or after `i`. */
function skipWhitespace(raw: string, i: number): number {
  while (i < raw.length && /\s/.test(raw[i])) i++;
  return i;
}

/** Index just past the closing quote of the string starting at `i`. */
function skipString(raw: string, i: number): number {
  i++; // opening quote
  while (raw[i] !== '"') i += raw[i] === "\\" ? 2 : 1;
  return i + 1; // closing quote
}

/** Index just past the JSON value starting at `i`. */
function skipValue(raw: string, i: number): number {
  const char = raw[i];

  if (char === '"') return skipString(raw, i);

  if (char === "{" || char === "[") {
    const close = char === "{" ? "}" : "]";
    i++;
    i = skipWhitespace(raw, i);
    while (raw[i] !== close) {
      if (char === "{") {
        i = skipString(raw, i); // key
        i = skipWhitespace(raw, i);
        i++; // ':'
        i = skipWhitespace(raw, i);
      }
      i = skipValue(raw, i); // value (or array element)
      i = skipWhitespace(raw, i);
      if (raw[i] === ",") {
        i++;
        i = skipWhitespace(raw, i);
      }
    }
    return i + 1; // closing bracket
  }

  // number, `true`, `false`, or `null` — run to the next structural character.
  while (i < raw.length && !/[\s,}\]]/.test(raw[i])) i++;
  return i;
}

/** The offset of the value at `path`, starting the search at `i`. */
function descend(
  raw: string,
  i: number,
  path: (string | number)[],
): number | undefined {
  if (path.length === 0) return i;

  const [head, ...rest] = path;
  const char = raw[i];

  if (typeof head === "string" && char === "{") {
    i = skipWhitespace(raw, i + 1);
    while (raw[i] !== "}") {
      const keyStart = i + 1; // past the opening quote
      const keyEnd = skipString(raw, i) - 1; // before the closing quote
      const key = raw.slice(keyStart, keyEnd);

      i = skipWhitespace(raw, keyEnd + 1);
      i++; // ':'
      i = skipWhitespace(raw, i);

      if (key === head) return descend(raw, i, rest);

      i = skipWhitespace(raw, skipValue(raw, i));
      if (raw[i] === ",") i = skipWhitespace(raw, i + 1);
    }
    return undefined;
  }

  if (typeof head === "number" && char === "[") {
    i = skipWhitespace(raw, i + 1);
    let index = 0;
    while (raw[i] !== "]") {
      if (index === head) return descend(raw, i, rest);

      i = skipWhitespace(raw, skipValue(raw, i));
      if (raw[i] === ",") i = skipWhitespace(raw, i + 1);
      index++;
    }
    return undefined;
  }

  return undefined;
}

/** `offset` converted to a 1-indexed line and column within `raw`. */
function offsetToLineColumn(raw: string, offset: number): TextPosition {
  let line = 1;
  let lastNewline = -1;

  for (let i = 0; i < offset; i++) {
    if (raw[i] === "\n") {
      line++;
      lastNewline = i;
    }
  }

  return { line, column: offset - lastNewline };
}
