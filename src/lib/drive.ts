import {
  elapsedClockMinutes,
  formatClockHmm,
  formatHmm,
  parseClockHmm,
  resultFromTotal,
  sumMinutes,
  type Delta,
} from "./time";
import { HISTORY_LIMIT, PIECE_SOFT_CAP, newId, nowIso } from "./working";

export type DrivePiece = {
  startMinutes: number;
  finishMinutes: number;
  minutes: number;
};

export type DriveWorking = {
  id: string;
  pieces: DrivePiece[];
  createdAt: string;
  updatedAt: string;
};

export type DrivePadSnapshot = {
  current: DriveWorking;
  history: DriveWorking[];
  recoveredFromId: string | null;
  dirtySinceRecover: boolean;
};

export function emptyDriveWorking(at = new Date()): DriveWorking {
  const stamp = nowIso(at);
  return { id: newId(), pieces: [], createdAt: stamp, updatedAt: stamp };
}

export function emptyDrivePad(at = new Date()): DrivePadSnapshot {
  return { current: emptyDriveWorking(at), history: [], recoveredFromId: null, dirtySinceRecover: false };
}

export function driveTotal(working: DriveWorking): number {
  return sumMinutes(working.pieces.map((piece) => piece.minutes));
}

export function driveResult(working: DriveWorking): Delta {
  const total = driveTotal(working);
  const delta = resultFromTotal(total);
  return { ...delta, label: "Drive Time" };
}

export function qualifiesForDriveHistory(working: DriveWorking): boolean {
  return working.pieces.length >= 1;
}

function cloneDriveWorking(working: DriveWorking, id = newId(), at = new Date()): DriveWorking {
  return {
    id,
    pieces: working.pieces.map((piece) => ({ ...piece })),
    createdAt: working.createdAt,
    updatedAt: nowIso(at),
  };
}

function touch(working: DriveWorking, at = new Date()): DriveWorking {
  return { ...working, updatedAt: nowIso(at) };
}

function upsertDriveHistory(history: DriveWorking[], working: DriveWorking): DriveWorking[] {
  if (!qualifiesForDriveHistory(working)) return history;
  return [working, ...history.filter((row) => row.id !== working.id)].slice(0, HISTORY_LIMIT);
}

function markDirty(pad: DrivePadSnapshot): DrivePadSnapshot {
  if (!pad.recoveredFromId || pad.dirtySinceRecover) return pad;
  return { ...pad, dirtySinceRecover: true, current: { ...pad.current, id: newId() } };
}

function persistCurrent(pad: DrivePadSnapshot): DrivePadSnapshot {
  if (!qualifiesForDriveHistory(pad.current)) return pad;
  if (pad.recoveredFromId && !pad.dirtySinceRecover) return pad;
  return { ...pad, history: upsertDriveHistory(pad.history, pad.current) };
}

export type PieceSign = 1 | -1;

export function commitDrivePiece(
  pad: DrivePadSnapshot,
  startRaw: string,
  finishRaw: string,
  sign: PieceSign,
  at = new Date(),
): { ok: true; pad: DrivePadSnapshot; warning: boolean } | { ok: false; error: string } {
  if (startRaw.trim().length === 0) return { ok: false, error: "Enter a start time." };
  if (finishRaw.trim().length === 0) return { ok: false, error: "Enter a finish time." };
  const start = parseClockHmm(startRaw);
  if (!start.ok) return { ok: false, error: start.error };
  const finish = parseClockHmm(finishRaw);
  if (!finish.ok) return { ok: false, error: finish.error };
  const duration = elapsedClockMinutes(start.minutes, finish.minutes);
  const piece: DrivePiece = {
    startMinutes: start.minutes,
    finishMinutes: finish.minutes,
    minutes: sign * duration,
  };
  const pieces = [...pad.current.pieces, piece];
  const next = persistCurrent(markDirty({ ...pad, current: touch({ ...pad.current, pieces }, at) }));
  return { ok: true, pad: next, warning: pieces.length >= PIECE_SOFT_CAP };
}

export function undoLastDrive(pad: DrivePadSnapshot, at = new Date()): DrivePadSnapshot {
  if (pad.current.pieces.length === 0) return pad;
  const pieces = pad.current.pieces.slice(0, -1);
  return persistCurrent(markDirty({ ...pad, current: touch({ ...pad.current, pieces }, at) }));
}

export function clearDrivePieces(pad: DrivePadSnapshot, at = new Date()): DrivePadSnapshot {
  const currentId = pad.current.id;
  return {
    current: emptyDriveWorking(at),
    history: pad.history.filter((row) => row.id !== currentId),
    recoveredFromId: null,
    dirtySinceRecover: false,
  };
}

export function newDriveWorking(pad: DrivePadSnapshot, at = new Date()): DrivePadSnapshot {
  const shouldArchive =
    qualifiesForDriveHistory(pad.current) && (!pad.recoveredFromId || pad.dirtySinceRecover);
  return {
    current: emptyDriveWorking(at),
    history: shouldArchive ? upsertDriveHistory(pad.history, pad.current) : pad.history,
    recoveredFromId: null,
    dirtySinceRecover: false,
  };
}

export function recoverDriveWorking(pad: DrivePadSnapshot, historyId: string, at = new Date()): DrivePadSnapshot {
  const source = pad.history.find((row) => row.id === historyId);
  if (!source) return pad;
  const archived = qualifiesForDriveHistory(pad.current)
    ? upsertDriveHistory(pad.history, pad.current)
    : pad.history;
  const current = cloneDriveWorking(source, newId(), at);
  current.createdAt = nowIso(at);
  return { current, history: archived, recoveredFromId: source.id, dirtySinceRecover: false };
}

export function sameAgainDrive(pad: DrivePadSnapshot, historyId: string, at = new Date()): DrivePadSnapshot {
  const source = pad.history.find((row) => row.id === historyId);
  if (!source) return pad;
  const history = qualifiesForDriveHistory(pad.current)
    ? upsertDriveHistory(pad.history, pad.current)
    : pad.history;
  const current = cloneDriveWorking(source, newId(), at);
  current.createdAt = nowIso(at);
  return { current, history, recoveredFromId: null, dirtySinceRecover: false };
}

export function driveHistoryLabel(working: DriveWorking): { total: string; pieces: number } {
  return { total: formatHmm(driveTotal(working)), pieces: working.pieces.length };
}

export function runningDriveSubtotals(pieces: DrivePiece[]): number[] {
  const totals: number[] = [];
  let running = 0;
  for (const piece of pieces) {
    running += piece.minutes;
    totals.push(running);
  }
  return totals;
}

export function formatDriveTapePiece(piece: DrivePiece): string {
  const span = `${formatClockHmm(piece.startMinutes)}–${formatClockHmm(piece.finishMinutes)}`;
  const magnitude = formatHmm(Math.abs(piece.minutes));
  return piece.minutes < 0 ? `− ${span} ${magnitude}` : `+ ${span} ${magnitude}`;
}
