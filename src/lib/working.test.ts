import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatHmm } from "./time";
import {
  HISTORY_LIMIT,
  addPiece,
  emptyPad,
  formatCopy,
  newWorking,
  payTotal,
  recoverWorking,
  sameAgain,
  subtractPiece,
  workingResult,
  type PadSnapshot,
} from "./working";

function add(pad: PadSnapshot, raw: string): PadSnapshot {
  const result = addPiece(pad, raw);
  if (!result.ok) throw new Error(result.error);
  return result.pad;
}

function subtract(pad: PadSnapshot, raw: string): PadSnapshot {
  const result = subtractPiece(pad, raw);
  if (!result.ok) throw new Error(result.error);
  return result.pad;
}

describe("golden cases", () => {
  it("simple saving: 10:00 − 6:49 → Amount Saved 3:11", () => {
    let pad = add(emptyPad(), "10:00");
    pad = subtract(pad, "6:49");
    assert.equal(formatHmm(payTotal(pad.current)), "3:11");
    assert.equal(workingResult(pad.current).kind, "saving");
    assert.equal(workingResult(pad.current).label, "Amount Saved");
  });

  it("split 12:00 minus six pieces", () => {
    let pad = add(emptyPad(), "12:00");
    for (const piece of ["2:10", "1:45", "0:30", "3:20", "1:05", "1:40"]) pad = subtract(pad, piece);
    assert.equal(formatHmm(payTotal(pad.current)), "1:30");
    assert.equal(workingResult(pad.current).kind, "saving");
  });

  it("additional cost 8:00 − 5:20 − 3:15", () => {
    let pad = add(emptyPad(), "8:00");
    pad = subtract(pad, "5:20");
    pad = subtract(pad, "3:15");
    assert.equal(formatHmm(payTotal(pad.current)), "-0:35");
    assert.equal(workingResult(pad.current).kind, "extra");
    assert.equal(workingResult(pad.current).label, "Additional Cost");
    assert.equal(workingResult(pad.current).magnitudeHmm, "0:35");
  });

  it("colon alias and empty add fail", () => {
    let pad = add(emptyPad(), "10:00");
    pad = subtract(pad, "6.49");
    assert.equal(formatHmm(payTotal(pad.current)), "3:11");
    assert.equal(addPiece(emptyPad(), "").ok, false);
  });

  it("empty subtract is a visible fail", () => {
    const result = subtractPiece(emptyPad(), "");
    assert.equal(result.ok, false);
  });
});

describe("history", () => {
  it("recover writes a new row after edits", () => {
    let pad = add(emptyPad(), "10:00");
    pad = subtract(pad, "6:49");
    const originalId = pad.current.id;
    pad = newWorking(pad);
    pad = recoverWorking(pad, originalId);
    assert.equal(formatHmm(payTotal(pad.current)), "3:11");
    pad = subtract(pad, "0:10");
    pad = newWorking(pad);
    assert.equal(pad.history.length, 2);
    const original = pad.history.find((row) => row.id === originalId);
    assert.equal(original?.pieces.length, 2);
  });

  it("drops oldest when history exceeds 3", () => {
    let pad = emptyPad();
    const ids: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      pad = add(pad, "0:01");
      ids.push(pad.current.id);
      pad = newWorking(pad);
    }
    assert.equal(pad.history.length, HISTORY_LIMIT);
    assert.equal(pad.history.some((row) => row.id === ids[0]), false);
    assert.equal(pad.history[0]?.id, ids[3]);
  });

  it("chains 10:00 + 4:00 − 1:30 to 12:30", () => {
    let pad = add(emptyPad(), "10:00");
    pad = add(pad, "4:00");
    pad = subtract(pad, "1:30");
    assert.equal(formatHmm(payTotal(pad.current)), "12:30");
  });

  it("same again copies pieces", () => {
    let pad = add(emptyPad(), "8:00");
    pad = subtract(pad, "3:00");
    const sourceId = pad.current.id;
    pad = newWorking(pad);
    pad = sameAgain(pad, sourceId);
    assert.notEqual(pad.current.id, sourceId);
    const text = formatCopy(pad.current);
    assert.match(text, /Amount Saved: 5:00/);
    assert.match(text, /\+ 8:00/);
  });
});
