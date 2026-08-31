import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { backspaceHmm, formatHmm, liveHmm, parseHmm, resultFromTotal } from "./time";

describe("parseHmm", () => {
  it("accepts 6:49, 06:49, 649, and 6.49 as a colon alias", () => {
    for (const raw of ["6:49", "06:49", "649", "6.49"]) {
      const parsed = parseHmm(raw);
      assert.equal(parsed.ok, true);
      if (parsed.ok) assert.equal(parsed.minutes, 6 * 60 + 49);
    }
  });

  it("rejects empty, seconds, and 6:75 without auto-carry", () => {
    assert.equal(parseHmm("  ").ok, false);
    assert.equal(parseHmm("6:49:00").ok, false);
    const bad = parseHmm("6:75");
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.match(bad.error, /00–59/);
  });

  it("treats 6.75 as invalid minutes, never decimal hours", () => {
    assert.equal(parseHmm("6.75").ok, false);
  });

  it("allows hours beyond 24", () => {
    const parsed = parseHmm("27:15");
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.minutes, 27 * 60 + 15);
  });
});

describe("liveHmm", () => {
  it("formats 123 to 1:23 and 1030 to 10:30", () => {
    assert.equal(liveHmm("1"), "1");
    assert.equal(liveHmm("12"), "12");
    assert.equal(liveHmm("123"), "1:23");
    assert.equal(liveHmm("1030"), "10:30");
    assert.equal(liveHmm("649"), "6:49");
  });

  it("backspace removes the last digit through the colon", () => {
    assert.equal(backspaceHmm("1:23"), "12");
    assert.equal(backspaceHmm("12"), "1");
    assert.equal(backspaceHmm("10:30"), "1:03");
  });
});

describe("format and delta", () => {
  it("does not wrap hours at 24", () => {
    assert.equal(formatHmm(27 * 60 + 15), "27:15");
  });

  it("positive remaining is Amount Saved", () => {
    const delta = resultFromTotal(3 * 60 + 11);
    assert.equal(delta.kind, "saving");
    assert.equal(delta.label, "Amount Saved");
    assert.equal(delta.magnitudeHmm, "3:11");
  });

  it("negative remaining is Additional Cost", () => {
    const delta = resultFromTotal(-(35));
    assert.equal(delta.kind, "extra");
    assert.equal(delta.label, "Additional Cost");
    assert.equal(delta.magnitudeHmm, "0:35");
  });
});
