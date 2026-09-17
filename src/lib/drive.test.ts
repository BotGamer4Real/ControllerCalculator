import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { elapsedClockMinutes, formatClockHmm, parseClockHmm } from "./time";
import {
  commitDrivePiece,
  driveResult,
  driveTotal,
  emptyDrivePad,
  formatDriveTapePiece,
  newDriveWorking,
  type DrivePadSnapshot,
} from "./drive";
import { formatHmm } from "./time";

function commit(pad: DrivePadSnapshot, start: string, finish: string, sign: 1 | -1 = 1): DrivePadSnapshot {
  const result = commitDrivePiece(pad, start, finish, sign);
  if (!result.ok) throw new Error(result.error);
  return result.pad;
}

describe("drive elapsed", () => {
  it("06:00 to 8:34 is 2:34", () => {
    const start = parseClockHmm("06:00");
    const finish = parseClockHmm("8:34");
    assert.equal(start.ok && finish.ok, true);
    if (start.ok && finish.ok) {
      assert.equal(elapsedClockMinutes(start.minutes, finish.minutes), 2 * 60 + 34);
    }
  });

  it("09:30 to 12:00 is 2:30", () => {
    const start = parseClockHmm("09:30");
    const finish = parseClockHmm("12:00");
    assert.equal(start.ok && finish.ok, true);
    if (start.ok && finish.ok) {
      assert.equal(elapsedClockMinutes(start.minutes, finish.minutes), 2 * 60 + 30);
    }
  });

  it("22:00 to 06:00 wraps past midnight to 8:00", () => {
    const start = parseClockHmm("22:00");
    const finish = parseClockHmm("06:00");
    assert.equal(start.ok && finish.ok, true);
    if (start.ok && finish.ok) {
      assert.equal(elapsedClockMinutes(start.minutes, finish.minutes), 8 * 60);
    }
  });

  it("same start and finish is 0:00", () => {
    assert.equal(elapsedClockMinutes(6 * 60, 6 * 60), 0);
  });

  it("rejects 24:00 as a clock time", () => {
    const parsed = parseClockHmm("24:00");
    assert.equal(parsed.ok, false);
  });

  it("pads clock hours", () => {
    assert.equal(formatClockHmm(6 * 60 + 0), "06:00");
    assert.equal(formatClockHmm(8 * 60 + 34), "08:34");
  });
});

describe("drive pad", () => {
  it("adds two spells onto the tape", () => {
    let pad = commit(emptyDrivePad(), "06:00", "8:34");
    pad = commit(pad, "09:30", "12:00");
    assert.equal(formatHmm(driveTotal(pad.current)), "5:04");
    assert.equal(driveResult(pad.current).label, "Drive Time");
    assert.equal(formatDriveTapePiece(pad.current.pieces[0]!), "+ 06:00–08:34 2:34");
    assert.equal(formatDriveTapePiece(pad.current.pieces[1]!), "+ 09:30–12:00 2:30");
  });

  it("subtracts a spell from the total", () => {
    let pad = commit(emptyDrivePad(), "06:00", "12:00");
    pad = commit(pad, "09:00", "09:30", -1);
    assert.equal(formatHmm(driveTotal(pad.current)), "5:30");
  });

  it("needs both start and finish", () => {
    assert.equal(commitDrivePiece(emptyDrivePad(), "", "8:34", 1).ok, false);
    assert.equal(commitDrivePiece(emptyDrivePad(), "06:00", "", 1).ok, false);
  });

  it("archives on new working", () => {
    let pad = commit(emptyDrivePad(), "06:00", "8:34");
    const id = pad.current.id;
    pad = newDriveWorking(pad);
    assert.equal(pad.history[0]?.id, id);
    assert.equal(pad.current.pieces.length, 0);
  });
});
