import { emptyStats, type Stats } from "./stats";
import { emptyPad, emptyWorking, type PadSnapshot, type Working } from "./working";

export const STORE_KEY = "dutypad.v1";

export type StoredState = {
  version: 1;
  pad: PadSnapshot;
  dutyDraft: string;
  payDraft: string;
  stats: Stats;
};

export function emptyStore(): StoredState {
  return {
    version: 1,
    pad: emptyPad(),
    dutyDraft: "",
    payDraft: "",
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

export function loadStore(): StoredState {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    const pad = parsed.pad;
    const current = pad && isWorking(pad.current) ? pad.current : emptyWorking();
    const history = pad && Array.isArray(pad.history) ? pad.history.filter(isWorking) : [];
    const stats = parsed.stats ?? emptyStats();
    return {
      version: 1,
      pad: {
        current,
        history,
        recoveredFromId: pad?.recoveredFromId ?? null,
        dirtySinceRecover: Boolean(pad?.dirtySinceRecover),
      },
      dutyDraft: parsed.dutyDraft ?? "",
      payDraft: parsed.payDraft ?? "",
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
