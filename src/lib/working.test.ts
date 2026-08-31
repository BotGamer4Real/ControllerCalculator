import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatHmm } from "./time";
import {
  HISTORY_LIMIT,
  addPiece,
  confirmDuty,
  emptyPad,
  formatCopy,
  newWorking,
  payTotal,
  recoverWorking,
  sameAgain,
  subtractPiece,
  workingDelta,
  type PadSnapshot,
} from "./working";

function add(pad: PadSnapshot, raw: string): PadSnapshot {
  const result = addPiece(pad, raw);
  if (!result.ok) throw new Error(result.error);
  return result.pad;
}

function duty(pad: PadSnapshot, raw: string): PadSnapshot {
  const result = confirmDuty(pad, raw);
  if (!result.ok) throw new Error(result.error);
  return result.pad;
}

function subtract(pad: PadSnapshot, raw: string): PadSnapshot {
  const result = subtractPiece(pad, raw);
  if (!result.ok) throw new Error(result.error);
  return result.pad;
}

describe("golden cases", () => {
  it("simple saving", () => {
    let pad = duty(emptyPad(), "10:00");
    pad = add(pad, "6:49");
    assert.equal(formatHmm(payTotal(pad.current)), "6:49");
    assert.equal(workingDelta(pad.current)?.kind, "saving");
    assert.equal(workingDelta(pad.current)?.magnitudeHmm, "3:11");
  });

  it("split 12:00", () => {
    let pad = duty(emptyPad(), "12:00");
    for (const piece of ["2:10", "1:45", "0:30", "3:20", "1:05", "1:40"]) pad = add(pad, piece);
    assert.equal(formatHmm(payTotal(pad.current)), "10:30");
    assert.equal(workingDelta(pad.current)?.magnitudeHmm, "1:30");
  });

  it("extra 8:00 vs 5:20 + 3:15", () => {
    let pad = duty(emptyPad(), "8:00");
    pad = add(pad, "5:20");
    pad = add(pad, "3:15");
    assert.equal(formatHmm(payTotal(pad.current)), "8:35");
    assert.equal(workingDelta(pad.current)?.kind, "extra");
    assert.equal(workingDelta(pad.current)?.magnitudeHmm, "0:35");
  });

  it("sum only hides delta", () => {
    let pad = add(emptyPad(), "1:20");
    pad = add(pad, "2:10");
    assert.equal(formatHmm(payTotal(pad.current)), "3:30");
    assert.equal(workingDelta(pad.current), null);
  });

  it("colon alias, empty add fail, full-duty saving", () => {
    let pad = duty(emptyPad(), "10:00");
    pad = add(pad, "6.49");
    assert.equal(formatHmm(payTotal(pad.current)), "6:49");
    assert.equal(addPiece(emptyPad(), "").ok, false);
    const zero = duty(emptyPad(), "10:00");
    assert.equal(workingDelta(zero.current)?.magnitudeHmm, "10:00");
  });

  it("subtracts a piece from the running pay total", () => {
    let pad = duty(emptyPad(), "10:00");
    pad = add(pad, "6:49");
    pad = subtract(pad, "0:30");
    assert.equal(formatHmm(payTotal(pad.current)), "6:19");
    assert.equal(workingDelta(pad.current)?.kind, "saving");
    assert.equal(workingDelta(pad.current)?.magnitudeHmm, "3:41");
    assert.match(formatCopy(pad.current), /− 0:30/);
  });

  it("empty subtract is a visible fail", () => {
    const result = subtractPiece(emptyPad(), "");
    assert.equal(result.ok, false);
  });
});

describe("history", () => {
  it("recover writes a new row after edits", () => {
    let pad = duty(emptyPad(), "10:00");
    pad = add(pad, "6:49");
    const originalId = pad.current.id;
    pad = newWorking(pad);
    pad = recoverWorking(pad, originalId);
    assert.equal(formatHmm(payTotal(pad.current)), "6:49");
    pad = add(pad, "0:10");
    pad = newWorking(pad);
    assert.equal(pad.history.length, 2);
    const original = pad.history.find((row) => row.id === originalId);
    assert.equal(original?.pieces.length, 1);
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
    assert.deepEqual(pad.current.pieces, [10 * 60, 4 * 60, -(1 * 60 + 30)]);
  });

  it("same again and copy result", () => {
    let pad = duty(emptyPad(), "8:00");
    pad = add(pad, "3:00");
    const sourceId = pad.current.id;
    pad = newWorking(pad);
    pad = sameAgain(pad, sourceId);
    assert.equal(pad.current.dutyMinutes, 8 * 60);
    assert.notEqual(pad.current.id, sourceId);
    const text = formatCopy(pad.current);
    assert.match(text, /Duty: 8:00/);
    assert.match(text, /Pay total: 3:00/);
    assert.match(text, /\+ 3:00/);
  });
});
