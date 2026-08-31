import { formatHmm, parseHmm, signedDelta, sumMinutes, type Delta } from "./time";

export const HISTORY_LIMIT = 3;
export const PIECE_SOFT_CAP = 20;

export type Working = {
  id: string;
  dutyMinutes: number | null;
  pieces: number[];
  createdAt: string;
  updatedAt: string;
};

export type PadSnapshot = {
  current: Working;
  history: Working[];
  recoveredFromId: string | null;
  dirtySinceRecover: boolean;
};

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(at = new Date()): string {
  return at.toISOString();
}

export function emptyWorking(at = new Date()): Working {
  const stamp = nowIso(at);
  return { id: newId(), dutyMinutes: null, pieces: [], createdAt: stamp, updatedAt: stamp };
}

export function emptyPad(at = new Date()): PadSnapshot {
  return { current: emptyWorking(at), history: [], recoveredFromId: null, dirtySinceRecover: false };
}

export function payTotal(working: Working): number {
  return sumMinutes(working.pieces);
}

export function workingDelta(working: Working): Delta | null {
  return signedDelta(working.dutyMinutes, payTotal(working));
}

export function qualifiesForHistory(working: Working): boolean {
  return working.pieces.length >= 1;
}

export function cloneWorking(working: Working, id = newId(), at = new Date()): Working {
  return {
    id,
    dutyMinutes: working.dutyMinutes,
    pieces: [...working.pieces],
    createdAt: working.createdAt,
    updatedAt: nowIso(at),
  };
}

function touch(working: Working, at = new Date()): Working {
  return { ...working, updatedAt: nowIso(at) };
}

export function upsertHistory(history: Working[], working: Working): Working[] {
  if (!qualifiesForHistory(working)) return history;
  return [working, ...history.filter((row) => row.id !== working.id)].slice(0, HISTORY_LIMIT);
}

function markDirty(pad: PadSnapshot): PadSnapshot {
  if (!pad.recoveredFromId || pad.dirtySinceRecover) return pad;
  return { ...pad, dirtySinceRecover: true, current: { ...pad.current, id: newId() } };
}

function persistCurrent(pad: PadSnapshot): PadSnapshot {
  if (!qualifiesForHistory(pad.current)) return pad;
  if (pad.recoveredFromId && !pad.dirtySinceRecover) return pad;
  return { ...pad, history: upsertHistory(pad.history, pad.current) };
}

export function confirmDuty(
  pad: PadSnapshot,
  raw: string,
  at = new Date(),
): { ok: true; pad: PadSnapshot } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: true, pad: markDirty({ ...pad, current: touch({ ...pad.current, dutyMinutes: null }, at) }) };
  }
  const parsed = parseHmm(trimmed);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return {
    ok: true,
    pad: markDirty({ ...pad, current: touch({ ...pad.current, dutyMinutes: parsed.minutes }, at) }),
  };
}

export type PieceSign = 1 | -1;

export function commitPiece(
  pad: PadSnapshot,
  raw: string,
  sign: PieceSign,
  at = new Date(),
): { ok: true; pad: PadSnapshot; warning: boolean } | { ok: false; error: string } {
  const parsed = parseHmm(raw);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const minutes = sign * parsed.minutes;
  const pieces = [...pad.current.pieces, minutes];
  const next = persistCurrent(
    markDirty({ ...pad, current: touch({ ...pad.current, pieces }, at) }),
  );
  return { ok: true, pad: next, warning: pieces.length >= PIECE_SOFT_CAP };
}

export function addPiece(
  pad: PadSnapshot,
  raw: string,
  at = new Date(),
): { ok: true; pad: PadSnapshot; warning: boolean } | { ok: false; error: string } {
  return commitPiece(pad, raw, 1, at);
}

export function subtractPiece(
  pad: PadSnapshot,
  raw: string,
  at = new Date(),
): { ok: true; pad: PadSnapshot; warning: boolean } | { ok: false; error: string } {
  return commitPiece(pad, raw, -1, at);
}

export function undoLast(pad: PadSnapshot, at = new Date()): PadSnapshot {
  if (pad.current.pieces.length === 0) return pad;
  const pieces = pad.current.pieces.slice(0, -1);
  return persistCurrent(markDirty({ ...pad, current: touch({ ...pad.current, pieces }, at) }));
}

export function clearPieces(pad: PadSnapshot, at = new Date()): PadSnapshot {
  if (pad.current.pieces.length === 0) return pad;
  return markDirty({ ...pad, current: touch({ ...pad.current, pieces: [] }, at) });
}

export function newWorking(pad: PadSnapshot, at = new Date()): PadSnapshot {
  const shouldArchive =
    qualifiesForHistory(pad.current) && (!pad.recoveredFromId || pad.dirtySinceRecover);
  return {
    current: emptyWorking(at),
    history: shouldArchive ? upsertHistory(pad.history, pad.current) : pad.history,
    recoveredFromId: null,
    dirtySinceRecover: false,
  };
}

export function recoverWorking(pad: PadSnapshot, historyId: string, at = new Date()): PadSnapshot {
  const source = pad.history.find((row) => row.id === historyId);
  if (!source) return pad;
  const archived = qualifiesForHistory(pad.current)
    ? upsertHistory(pad.history, pad.current)
    : pad.history;
  const current = cloneWorking(source, newId(), at);
  current.createdAt = nowIso(at);
  return { current, history: archived, recoveredFromId: source.id, dirtySinceRecover: false };
}

export function sameAgain(pad: PadSnapshot, historyId: string, at = new Date()): PadSnapshot {
  const source = pad.history.find((row) => row.id === historyId);
  if (!source) return pad;
  const history = qualifiesForHistory(pad.current)
    ? upsertHistory(pad.history, pad.current)
    : pad.history;
  const current = cloneWorking(source, newId(), at);
  current.createdAt = nowIso(at);
  return { current, history, recoveredFromId: null, dirtySinceRecover: false };
}

export function formatCopy(working: Working): string {
  const delta = workingDelta(working);
  const lines = [
    "Duty Pad",
    "",
    `Duty: ${working.dutyMinutes === null ? "none" : formatHmm(working.dutyMinutes)}`,
    `Pay total: ${formatHmm(payTotal(working))}`,
  ];
  if (delta) {
    lines.push(delta.kind === "even" ? "even: 0:00" : `${delta.label}: ${delta.magnitudeHmm}`);
  } else {
    lines.push("no duty");
  }
  lines.push("", "Pieces");
  if (working.pieces.length === 0) lines.push("(none)");
  else working.pieces.forEach((piece, index) => lines.push(`${index + 1}. ${formatTapePiece(piece)}`));
  return lines.join("\n");
}

export function historyLabel(working: Working): {
  duty: string;
  pay: string;
  delta: string;
  pieces: number;
} {
  const delta = workingDelta(working);
  return {
    duty: working.dutyMinutes === null ? "sum" : formatHmm(working.dutyMinutes),
    pay: formatHmm(payTotal(working)),
    delta: delta
      ? delta.kind === "even"
        ? "even"
        : `${delta.kind === "saving" ? "S" : "E"} ${delta.magnitudeHmm}`
      : "—",
    pieces: working.pieces.length,
  };
}

export function mergeHistories(local: Working[], cloud: Working[]): Working[] {
  const byId = new Map<string, Working>();
  for (const row of [...local, ...cloud]) {
    const existing = byId.get(row.id);
    if (!existing || existing.updatedAt <= row.updatedAt) byId.set(row.id, row);
  }
  return [...byId.values()]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
    .slice(0, HISTORY_LIMIT);
}

export function runningSubtotals(pieces: number[]): number[] {
  const totals: number[] = [];
  let running = 0;
  for (const piece of pieces) {
    running += piece;
    totals.push(running);
  }
  return totals;
}

export function formatTapePiece(minutes: number): string {
  const magnitude = formatHmm(Math.abs(minutes));
  return minutes < 0 ? `− ${magnitude}` : `+ ${magnitude}`;
}
