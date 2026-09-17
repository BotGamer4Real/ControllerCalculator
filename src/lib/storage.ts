import { emptyDrivePad, emptyDriveWorking, type DrivePadSnapshot, type DrivePiece, type DriveWorking } from "./drive";
import { emptyStats, type Stats } from "./stats";
import { emptyPad, emptyWorking, type PadSnapshot, type Working } from "./working";

export const STORE_KEY = "dutypad.v1";

export type PadMode = "duty" | "drive";
export type DriveField = "start" | "finish";

export type StoredState = {
  version: 1;
  mode: PadMode;
  pad: PadSnapshot;
  drivePad: DrivePadSnapshot;
  dutyDraft: string;
  payDraft: string;
  startDraft: string;
  finishDraft: string;
  driveField: DriveField;
  stats: Stats;
};

export function emptyStore(): StoredState {
  return {
    version: 1,
    mode: "duty",
    pad: emptyPad(),
    drivePad: emptyDrivePad(),
    dutyDraft: "",
    payDraft: "",
    startDraft: "",
    finishDraft: "",
    driveField: "start",
    stats: emptyStats(),
  };
}

function isWorking(value: unknown): value is Working {
  if (!value || typeof value !== "object") return false;
  const row = value as Working;
  return (
    typeof row.id === "string" &&
    (row.dutyMinutes === null || typeof row.dutyMinutes === "number") &&
    Array.isArray(row.pieces)
  );
}

function isDrivePiece(value: unknown): value is DrivePiece {
  if (!value || typeof value !== "object") return false;
  const row = value as DrivePiece;
  return (
    typeof row.startMinutes === "number" &&
    typeof row.finishMinutes === "number" &&
    typeof row.minutes === "number"
  );
}

function isDriveWorking(value: unknown): value is DriveWorking {
  if (!value || typeof value !== "object") return false;
  const row = value as DriveWorking;
  return typeof row.id === "string" && Array.isArray(row.pieces) && row.pieces.every(isDrivePiece);
}

export function loadStore(): StoredState {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    const pad = parsed.pad;
    const current = pad && isWorking(pad.current) ? pad.current : emptyWorking();
    const history = pad && Array.isArray(pad.history) ? pad.history.filter(isWorking) : [];
    const drivePad = parsed.drivePad;
    const driveCurrent = drivePad && isDriveWorking(drivePad.current) ? drivePad.current : emptyDriveWorking();
    const driveHistory =
      drivePad && Array.isArray(drivePad.history) ? drivePad.history.filter(isDriveWorking) : [];
    const stats = parsed.stats ?? emptyStats();
    const mode = parsed.mode === "drive" ? "drive" : "duty";
    const driveField = parsed.driveField === "finish" ? "finish" : "start";
    return {
      version: 1,
      mode,
      pad: {
        current,
        history,
        recoveredFromId: pad?.recoveredFromId ?? null,
        dirtySinceRecover: Boolean(pad?.dirtySinceRecover),
      },
      drivePad: {
        current: driveCurrent,
        history: driveHistory,
        recoveredFromId: drivePad?.recoveredFromId ?? null,
        dirtySinceRecover: Boolean(drivePad?.dirtySinceRecover),
      },
      dutyDraft: parsed.dutyDraft ?? "",
      payDraft: parsed.payDraft ?? "",
      startDraft: parsed.startDraft ?? "",
      finishDraft: parsed.finishDraft ?? "",
      driveField,
      stats: {
        ...emptyStats(),
        ...stats,
        records: { ...emptyStats().records, ...stats.records },
        achievements: stats.achievements ?? {},
      },
    };
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: StoredState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}
