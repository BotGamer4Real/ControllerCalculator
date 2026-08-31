"use client";

import { ACHIEVEMENTS, type Stats } from "@/lib/stats";
import { formatHmm } from "@/lib/time";

export function StatsPanel({
  open,
  onClose,
  stats,
}: {
  open: boolean;
  onClose: () => void;
  stats: Stats;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="stats-title">
      <div className="panel-glow max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h2 id="stats-title" className="text-lg font-semibold">
            Personal stats
          </h2>
          <button type="button" className="min-h-11 px-3 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">Your records. Nothing here is ranked against other people.</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-[var(--line)] bg-[#08141c] p-3">
            <dt className="text-[var(--muted)]">Lifetime workings</dt>
            <dd className="font-mono text-xl">{stats.lifetimeWorkings}</dd>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[#08141c] p-3">
            <dt className="text-[var(--muted)]">Days used</dt>
            <dd className="font-mono text-xl">{stats.activeDays.length}</dd>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[#08141c] p-3">
            <dt className="text-[var(--muted)]">Most pieces</dt>
            <dd className="font-mono text-xl">{stats.records.mostPieces}</dd>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[#08141c] p-3">
            <dt className="text-[var(--muted)]">Largest saving</dt>
            <dd className="font-mono text-xl">{formatHmm(stats.records.largestSavingMinutes)}</dd>
          </div>
          <div className="col-span-2 rounded-xl border border-[var(--line)] bg-[#08141c] p-3">
            <dt className="text-[var(--muted)]">Largest extra</dt>
            <dd className="font-mono text-xl">{formatHmm(stats.records.largestExtraMinutes)}</dd>
          </div>
        </dl>
        <h3 className="mt-5 text-sm font-semibold">Achievements</h3>
        <ul className="mt-2 space-y-2">
          {ACHIEVEMENTS.map((item) => {
            const unlocked = stats.achievements[item.id];
            return (
              <li key={item.id} className="rounded-xl border border-[var(--line)] bg-[#08141c] p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-[var(--muted)]">{item.detail}</p>
                <p className="mt-1 text-xs">{unlocked ? `Unlocked ${new Date(unlocked).toLocaleDateString()}` : "Not yet"}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
