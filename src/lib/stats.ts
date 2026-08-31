import type { Working } from "./working";
import { payTotal, workingResult } from "./working";

export const ACHIEVEMENTS = [
  { id: "first_working", title: "First working", detail: "A working with at least one pay piece." },
  { id: "first_saving", title: "First Amount Saved", detail: "Duty Pay minus paid shows a saving." },
  { id: "first_extra", title: "First Additional Cost", detail: "Paid more than Duty Pay — valid, always shown." },
  { id: "first_split", title: "First split", detail: "Three or more pay pieces in one working." },
  { id: "history_filled", title: "History filled", detail: "Ten lifetime workings." },
  { id: "lifetime_50", title: "50 lifetime workings", detail: "Fifty completed workings." },
  { id: "lifetime_200", title: "200 lifetime workings", detail: "Two hundred completed workings." },
  { id: "seven_days", title: "Seven days of use", detail: "Seven distinct calendar days with a completed working." },
  { id: "recovered", title: "Recovered from history", detail: "Reload a history row onto the pad." },
] as const;

export type AchievementId = (typeof ACHIEVEMENTS)[number]["id"];

export type PersonalRecords = {
  mostPieces: number;
  largestSavingMinutes: number;
  largestExtraMinutes: number;
};

export type Stats = {
  lifetimeWorkings: number;
  countedIds: string[];
  activeDays: string[];
  achievements: Partial<Record<AchievementId, string>>;
  records: PersonalRecords;
};

export function emptyStats(): Stats {
  return {
    lifetimeWorkings: 0,
    countedIds: [],
    activeDays: [],
    achievements: {},
    records: { mostPieces: 0, largestSavingMinutes: 0, largestExtraMinutes: 0 },
  };
}

export function localDay(at = new Date()): string {
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, "0");
  const d = String(at.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function unlock(stats: Stats, id: AchievementId, at: Date): Stats {
  if (stats.achievements[id]) return stats;
  return { ...stats, achievements: { ...stats.achievements, [id]: at.toISOString() } };
}

export function noteRecovered(stats: Stats, at = new Date()): Stats {
  return unlock(stats, "recovered", at);
}

export function applyWorkingToStats(stats: Stats, working: Working, at = new Date()): Stats {
  if (working.pieces.length < 1) return stats;
  let next = stats;
  if (!stats.countedIds.includes(working.id)) {
    const countedIds = [...stats.countedIds, working.id].slice(-400);
    const day = localDay(at);
    const activeDays = stats.activeDays.includes(day) ? stats.activeDays : [...stats.activeDays, day];
    next = {
      ...next,
      lifetimeWorkings: stats.lifetimeWorkings + 1,
      countedIds,
      activeDays,
    };
  }
  const delta = workingResult(working);
  const total = payTotal(working);
  next = {
    ...next,
    records: {
      mostPieces: Math.max(next.records.mostPieces, working.pieces.length),
      largestSavingMinutes:
        delta.kind === "saving"
          ? Math.max(next.records.largestSavingMinutes, total)
          : next.records.largestSavingMinutes,
      largestExtraMinutes:
        delta.kind === "extra"
          ? Math.max(next.records.largestExtraMinutes, Math.abs(total))
          : next.records.largestExtraMinutes,
    },
  };
  next = unlock(next, "first_working", at);
  if (delta.kind === "saving") next = unlock(next, "first_saving", at);
  if (delta.kind === "extra") next = unlock(next, "first_extra", at);
  if (working.pieces.length >= 3) next = unlock(next, "first_split", at);
  if (next.lifetimeWorkings >= 10) next = unlock(next, "history_filled", at);
  if (next.lifetimeWorkings >= 50) next = unlock(next, "lifetime_50", at);
  if (next.lifetimeWorkings >= 200) next = unlock(next, "lifetime_200", at);
  if (next.activeDays.length >= 7) next = unlock(next, "seven_days", at);
  return next;
}

export function mergeStats(local: Stats, cloud: Stats): Stats {
  const counted = Array.from(new Set([...local.countedIds, ...cloud.countedIds])).slice(-400);
  const activeDays = Array.from(new Set([...local.activeDays, ...cloud.activeDays])).sort();
  const achievements: Stats["achievements"] = { ...cloud.achievements };
  for (const [id, at] of Object.entries(local.achievements) as [AchievementId, string][]) {
    const existing = achievements[id];
    if (!existing || existing > at) achievements[id] = at;
  }
  return {
    lifetimeWorkings: Math.max(local.lifetimeWorkings, cloud.lifetimeWorkings, counted.length),
    countedIds: counted,
    activeDays,
    achievements,
    records: {
      mostPieces: Math.max(local.records.mostPieces, cloud.records.mostPieces),
      largestSavingMinutes: Math.max(local.records.largestSavingMinutes, cloud.records.largestSavingMinutes),
      largestExtraMinutes: Math.max(local.records.largestExtraMinutes, cloud.records.largestExtraMinutes),
    },
  };
}
