"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatsPanel } from "@/components/StatsPanel";
import { applyWorkingToStats, noteRecovered } from "@/lib/stats";
import { emptyStore, loadStore, saveStore, type StoredState } from "@/lib/storage";
import { backspaceHmm, formatHmm, liveHmm } from "@/lib/time";
import {
  addPiece,
  clearPieces,
  confirmDuty,
  formatTapePiece,
  historyLabel,
  newWorking,
  payTotal,
  recoverWorking,
  runningSubtotals,
  sameAgain,
  subtractPiece,
  undoLast,
  workingDelta,
  type PadSnapshot,
  type PieceSign,
} from "@/lib/working";

function dutyDraftFromPad(pad: PadSnapshot): string {
  return pad.current.dutyMinutes === null ? "" : formatHmm(pad.current.dutyMinutes);
}

export function PadApp() {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<StoredState>(emptyStore);
  const [dutyError, setDutyError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [pieceWarning, setPieceWarning] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [activeField, setActiveField] = useState<"duty" | "pay">("pay");
  const [pendingSign, setPendingSign] = useState<PieceSign>(1);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const payRef = useRef<HTMLInputElement>(null);
  const dutyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStore(loadStore());
    setReady(true);
    const media = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarsePointer(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (ready) saveStore(store);
  }, [ready, store]);

  const pad = store.pad;
  const delta = workingDelta(pad.current);
  const total = payTotal(pad.current);
  const subtotals = useMemo(() => runningSubtotals(pad.current.pieces), [pad.current.pieces]);

  function applyDuty() {
    const result = confirmDuty(store.pad, store.dutyDraft);
    if (!result.ok) {
      setDutyError(result.error);
      return false;
    }
    setDutyError(null);
    setStore((prev) => ({ ...prev, pad: result.pad }));
    return true;
  }

  function commitPay(sign: PieceSign): boolean {
    let base = store.pad;
    if (store.dutyDraft.trim()) {
      const dutyResult = confirmDuty(base, store.dutyDraft);
      if (!dutyResult.ok) {
        setDutyError(dutyResult.error);
        return false;
      }
      setDutyError(null);
      base = dutyResult.pad;
    } else if (store.pad.current.dutyMinutes !== null && store.dutyDraft.trim() === "") {
      const dutyResult = confirmDuty(base, "");
      if (dutyResult.ok) base = dutyResult.pad;
    }
    const result = sign === 1 ? addPiece(base, store.payDraft) : subtractPiece(base, store.payDraft);
    if (!result.ok) {
      setPayError(result.error);
      return false;
    }
    setPayError(null);
    setPieceWarning(result.warning);
    setStore((prev) => ({
      ...prev,
      pad: result.pad,
      payDraft: "",
      stats: applyWorkingToStats(prev.stats, result.pad.current),
    }));
    setActiveField("pay");
    payRef.current?.focus();
    return true;
  }

  function onOperator(nextSign: PieceSign) {
    if (store.payDraft.trim()) {
      if (!commitPay(pendingSign)) return;
    }
    setPendingSign(nextSign);
    setPayError(null);
    setActiveField("pay");
    payRef.current?.focus();
  }

  function onCommit() {
    if (!commitPay(pendingSign)) return;
    setPendingSign(1);
  }

  function onNew() {
    setDutyError(null);
    setPayError(null);
    setPieceWarning(false);
    setStore((prev) => ({
      ...prev,
      pad: newWorking(prev.pad),
      dutyDraft: "",
      payDraft: "",
    }));
    setPendingSign(1);
    setActiveField("duty");
    dutyRef.current?.focus();
  }

  function onRecover(id: string) {
    setStore((prev) => {
      const next = recoverWorking(prev.pad, id);
      return {
        ...prev,
        pad: next,
        dutyDraft: dutyDraftFromPad(next),
        payDraft: "",
        stats: noteRecovered(prev.stats),
      };
    });
    setDutyError(null);
    setPayError(null);
    setPendingSign(1);
  }

  function onSameAgain(id: string) {
    setStore((prev) => {
      const next = sameAgain(prev.pad, id);
      return { ...prev, pad: next, dutyDraft: dutyDraftFromPad(next), payDraft: "" };
    });
    setDutyError(null);
    setPayError(null);
    setPendingSign(1);
  }

  function setDraft(field: "duty" | "pay", value: string) {
    if (field === "duty") {
      setDutyError(null);
      setStore((s) => ({ ...s, dutyDraft: value }));
    } else {
      setPayError(null);
      setStore((s) => ({ ...s, payDraft: value }));
    }
  }

  function typeKey(key: string) {
    const current = activeField === "duty" ? store.dutyDraft : store.payDraft;
    if (key === "⌫") {
      setDraft(activeField, backspaceHmm(current));
      return;
    }
    if (key === "+" || key === "−" || key === "-") {
      onOperator(key === "+" ? 1 : -1);
      return;
    }
    if (key === "=") {
      onCommit();
      return;
    }
    if (key === ":") return;
    setDraft(activeField, liveHmm(current + key));
  }

  if (!ready) {
    return <main className="mx-auto max-w-lg px-4 py-10 text-[var(--muted)]">Opening pad…</main>;
  }

  const fieldClass = "field-glow mt-1 min-h-12 w-full rounded-xl px-3 font-mono text-lg";

  return (
    <main className="mx-auto flex h-dvh max-w-lg flex-col overflow-hidden px-4 pt-3">
      <header className="mb-3 flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--navy)]">Time duty calculator</p>
          <h1 className="display-glow text-2xl font-semibold tracking-tight sm:text-3xl">Duty Pad</h1>
        </div>
        <nav className="flex shrink-0 flex-wrap justify-end gap-1">
          <button type="button" className="btn-action min-h-11 px-3" onClick={() => setStatsOpen(true)}>
            Stats
          </button>
          <Link href="/guide" className="btn-action inline-flex min-h-11 items-center px-3">
            Guide
          </Link>
        </nav>
      </header>

      <div className="shrink-0">
        <label className="text-sm font-semibold tracking-wide text-[var(--navy)]" htmlFor="duty">
          Duty Pay
        </label>
        <input
          id="duty"
          ref={dutyRef}
          name="duty"
          aria-label="Duty Pay"
          inputMode={coarsePointer ? "none" : "decimal"}
          readOnly={coarsePointer}
          autoComplete="off"
          placeholder="optional, e.g. 10:00"
          value={store.dutyDraft}
          onFocus={() => setActiveField("duty")}
          onChange={(event) => setDraft("duty", liveHmm(event.target.value))}
          onBlur={applyDuty}
          onKeyDown={(event) => {
            if (event.key === "+" || event.code === "NumpadAdd" || event.key === "-" || event.code === "NumpadSubtract") {
              event.preventDefault();
              applyDuty();
              onOperator(event.key === "-" || event.code === "NumpadSubtract" ? -1 : 1);
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              applyDuty();
              setActiveField("pay");
              payRef.current?.focus();
            }
          }}
          className={`${fieldClass} ${activeField === "duty" ? "field-on" : ""}`}
        />
        {dutyError ? (
          <p className="mt-1 text-sm text-[var(--extra)]">{dutyError}</p>
        ) : (
          <p className="mt-1 text-xs text-[var(--muted)]">Empty = sum only. Tab or Enter pins it.</p>
        )}

        <div className="mt-3 flex gap-2">
          <div className="flex-1">
            <label className="text-sm font-semibold tracking-wide text-[var(--navy)]" htmlFor="pay">
              Pay time
            </label>
            <div className="mt-1 flex">
              <span
                className={`flex min-h-12 w-12 shrink-0 items-center justify-center rounded-l-xl border font-mono text-2xl font-semibold ${
                  pendingSign === 1
                    ? "border-[#14e0c4] bg-[#0d2a32] text-[#14e0c4]"
                    : "border-[#ff7a4a] bg-[#2a1610] text-[#ff7a4a]"
                }`}
                aria-hidden="true"
              >
                {pendingSign === 1 ? "+" : "−"}
              </span>
              <input
                id="pay"
                ref={payRef}
                name="pay"
                aria-label="Pay time"
                inputMode={coarsePointer ? "none" : "decimal"}
                readOnly={coarsePointer}
                autoComplete="off"
                placeholder="123 → 1:23"
                value={store.payDraft}
                onFocus={() => setActiveField("pay")}
                onChange={(event) => setDraft("pay", liveHmm(event.target.value))}
                onKeyDown={(event) => {
                  if (event.key === "+" || event.code === "NumpadAdd") {
                    event.preventDefault();
                    onOperator(1);
                    return;
                  }
                  if (event.key === "-" || event.code === "NumpadSubtract") {
                    event.preventDefault();
                    onOperator(-1);
                    return;
                  }
                  if (event.key === "Enter" || event.key === "=") {
                    event.preventDefault();
                    onCommit();
                  }
                }}
                className={`field-glow min-h-12 w-full rounded-r-xl rounded-l-none px-3 font-mono text-lg ${
                  activeField === "pay" ? "field-on" : ""
                }`}
              />
            </div>
          </div>
          <div className="hidden self-end md:flex md:gap-2">
            <button
              type="button"
              aria-label="Plus"
              onClick={() => onOperator(1)}
              className={`btn-plus min-w-12 text-xl ${pendingSign === 1 ? "is-on" : ""}`}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Minus"
              onClick={() => onOperator(-1)}
              className={`btn-minus min-w-12 text-xl ${pendingSign === -1 ? "is-on" : ""}`}
            >
              −
            </button>
            <button type="button" aria-label="Equals" onClick={onCommit} className="btn-add min-w-16 px-4 text-2xl">
              =
            </button>
          </div>
        </div>
        {payError ? <p className="mt-1 text-sm text-[var(--extra)]">{payError}</p> : null}
        {pieceWarning ? (
          <p className="mt-1 text-sm text-[var(--muted)]">This working has 20+ pieces. You can still add more.</p>
        ) : null}
      </div>

      <section className="panel-glow mt-3 shrink-0 rounded-2xl p-3" aria-live="polite">
        <dl className="space-y-1 text-base">
          {pad.current.dutyMinutes !== null ? (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[var(--muted)]">Duty Pay</dt>
              <dd className="font-mono text-xl tabular-nums">{formatHmm(pad.current.dutyMinutes)}</dd>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No Duty Pay — paid total only</p>
          )}
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-[var(--muted)]">Paid</dt>
            <dd className="display-glow font-mono text-4xl font-semibold tabular-nums" aria-label="Paid">
              {formatHmm(total)}
            </dd>
          </div>
          {delta ? (
            <div
              className={`flex items-baseline justify-between gap-3 ${
                delta.kind === "saving"
                  ? "text-[var(--saving)]"
                  : delta.kind === "extra"
                    ? "text-[var(--extra)]"
                    : "text-[var(--even)]"
              }`}
            >
              <dt className="font-semibold" aria-label="Amount Saved or Additional Cost">
                {delta.label}
              </dt>
              <dd className="font-mono text-2xl font-semibold tabular-nums">{delta.magnitudeHmm}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            aria-label="Undo last piece"
            disabled={pad.current.pieces.length === 0}
            onClick={() => setStore((prev) => ({ ...prev, pad: undoLast(prev.pad) }))}
            className="btn-action"
          >
            Undo piece
          </button>
          <button
            type="button"
            aria-label="Clear pieces"
            onClick={() => {
              if (pad.current.pieces.length === 0) return;
              setConfirmClear(true);
            }}
            className="btn-action"
          >
            Clear pieces
          </button>
          <button type="button" aria-label="New working" onClick={onNew} className="btn-action">
            New working
          </button>
        </div>

        <section className="mt-4" aria-label="Tape">
          <h2 className="text-sm font-semibold">Tape</h2>
          {pad.current.pieces.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">No pieces yet. Add or subtract a pay time.</p>
          ) : (
            <ol className="panel-glow mt-2 divide-y divide-[var(--line)] rounded-xl">
              {pad.current.pieces.map((piece, index) => (
                <li key={`${index}-${piece}`} className="flex min-h-11 items-center justify-between px-3 font-mono text-sm">
                  <span>
                    {index + 1}. {formatTapePiece(piece)}
                  </span>
                  <span className="text-[var(--muted)]">{formatHmm(subtotals[index] ?? piece)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mt-4" aria-label="History">
          <h2 className="text-sm font-semibold">History</h2>
          <p className="text-xs text-[var(--muted)]">
            Last 3 workings. Tap a row to recover. Same again starts a new working from that row.
          </p>
          {pad.history.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">No workings yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {pad.history.map((row) => {
                const label = historyLabel(row);
                const when = new Date(row.updatedAt);
                return (
                  <li key={row.id} className="panel-glow rounded-xl p-3">
                    <button type="button" className="block w-full text-left" onClick={() => onRecover(row.id)}>
                      <p className="font-mono text-sm">
                        {label.duty} → {label.pay} · {label.delta} · {label.pieces} pcs
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {when.toLocaleString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label="Same again"
                      className="btn-action mt-2 px-3"
                      onClick={() => onSameAgain(row.id)}
                    >
                      Same again
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section
        className="shrink-0 border-t border-[var(--line)] pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
        aria-label="Numpad"
      >
        <div className="mb-2 grid grid-cols-3 gap-2">
          <button
            type="button"
            aria-label="Plus"
            onClick={() => onOperator(1)}
            className={`btn-plus text-2xl ${pendingSign === 1 ? "is-on" : ""}`}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Minus"
            onClick={() => onOperator(-1)}
            className={`btn-minus text-2xl ${pendingSign === -1 ? "is-on" : ""}`}
          >
            −
          </button>
          <button type="button" aria-label="Equals" onClick={onCommit} className="btn-add text-2xl">
            =
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((key) => (
            <button
              key={key}
              type="button"
              className="btn-key"
              onClick={() => typeKey(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </section>

      <ConfirmDialog
        open={confirmClear}
        title="Clear pieces?"
        body="Duty Pay stays. The tape will be emptied."
        confirmLabel="Clear pieces"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          setStore((prev) => ({ ...prev, pad: clearPieces(prev.pad) }));
        }}
      />

      <StatsPanel open={statsOpen} onClose={() => setStatsOpen(false)} stats={store.stats} />
    </main>
  );
}
