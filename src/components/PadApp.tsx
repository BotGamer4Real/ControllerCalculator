"use client";

import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { StatsPanel } from "@/components/StatsPanel";
import { applyWorkingToStats, noteRecovered } from "@/lib/stats";
import { emptyStore, loadStore, saveStore, type StoredState } from "@/lib/storage";
import { backspaceHmm, formatHmm, liveHmm } from "@/lib/time";
import {
  addPiece,
  clearPieces,
  formatTapePiece,
  historyLabel,
  newWorking,
  recoverWorking,
  runningSubtotals,
  sameAgain,
  subtractPiece,
  undoLast,
  workingResult,
  type PieceSign,
} from "@/lib/working";

export function PadApp() {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<StoredState>(emptyStore);
  const [payError, setPayError] = useState<string | null>(null);
  const [pieceWarning, setPieceWarning] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [pendingSign, setPendingSign] = useState<PieceSign>(1);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const payRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStore(loadStore());
    setReady(true);
    const media = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarsePointer(media.matches);
    sync();
    media.addEventListener("change", sync);
    if (Capacitor.isNativePlatform()) {
      void StatusBar.setOverlaysWebView({ overlay: false });
      void StatusBar.setBackgroundColor({ color: "#071018" });
      void StatusBar.setStyle({ style: Style.Dark });
    }
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (ready) saveStore(store);
  }, [ready, store]);

  const pad = store.pad;
  const result = workingResult(pad.current);
  const subtotals = useMemo(() => runningSubtotals(pad.current.pieces), [pad.current.pieces]);

  function commitPay(sign: PieceSign): boolean {
    const outcome = sign === 1 ? addPiece(store.pad, store.payDraft) : subtractPiece(store.pad, store.payDraft);
    if (!outcome.ok) {
      setPayError(outcome.error);
      return false;
    }
    setPayError(null);
    setPieceWarning(outcome.warning);
    setStore((prev) => ({
      ...prev,
      pad: outcome.pad,
      payDraft: "",
      stats: applyWorkingToStats(prev.stats, outcome.pad.current),
    }));
    payRef.current?.focus();
    return true;
  }

  function onOperator(nextSign: PieceSign) {
    if (store.payDraft.trim()) {
      if (!commitPay(pendingSign)) return;
    }
    setPendingSign(nextSign);
    setPayError(null);
    payRef.current?.focus();
  }

  function onCommit() {
    if (!commitPay(pendingSign)) return;
    setPendingSign(1);
  }

  function onReset() {
    setPayError(null);
    setStore((prev) => ({ ...prev, pad: undoLast(prev.pad) }));
  }

  function onNew() {
    setPayError(null);
    setPieceWarning(false);
    setStore((prev) => ({
      ...prev,
      pad: newWorking(prev.pad),
      payDraft: "",
    }));
    setPendingSign(1);
    payRef.current?.focus();
  }

  function onRecover(id: string) {
    setStore((prev) => {
      const next = recoverWorking(prev.pad, id);
      return {
        ...prev,
        pad: next,
        payDraft: "",
        stats: noteRecovered(prev.stats),
      };
    });
    setPayError(null);
    setPendingSign(1);
  }

  function onSameAgain(id: string) {
    setStore((prev) => {
      const next = sameAgain(prev.pad, id);
      return { ...prev, pad: next, payDraft: "" };
    });
    setPayError(null);
    setPendingSign(1);
  }

  function typeKey(key: string) {
    if (key === "⌫") {
      setPayError(null);
      setStore((s) => ({ ...s, payDraft: backspaceHmm(s.payDraft) }));
      return;
    }
    if (key === "Rst") {
      onReset();
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
    setPayError(null);
    setStore((s) => ({ ...s, payDraft: liveHmm(s.payDraft + key) }));
  }

  if (!ready) {
    return <main className="mx-auto max-w-lg px-4 py-10 text-[var(--muted)]">Opening pad…</main>;
  }

  const keypad = (
    <section className="pad-keys px-0 pt-2" aria-label="Numpad">
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
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => (
          <button key={key} type="button" className="btn-key" onClick={() => typeKey(key)}>
            {key}
          </button>
        ))}
        <button type="button" aria-label="Reset last piece" className="btn-reset" onClick={() => typeKey("Rst")}>
          Rst
        </button>
        <button type="button" className="btn-key" onClick={() => typeKey("0")}>
          0
        </button>
        <button type="button" className="btn-key" onClick={() => typeKey("⌫")}>
          ⌫
        </button>
      </div>
    </section>
  );

  return (
    <main className="pad-shell px-4 pb-[env(safe-area-inset-bottom)] pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pad-main">
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
            onChange={(event) => {
              setPayError(null);
              setStore((s) => ({ ...s, payDraft: liveHmm(event.target.value) }));
            }}
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
            className="field-on field-glow min-h-12 w-full rounded-r-xl rounded-l-none px-3 font-mono text-lg"
          />
        </div>
        {payError ? <p className="mt-1 text-sm text-[var(--extra)]">{payError}</p> : null}
        {pieceWarning ? (
          <p className="mt-1 text-sm text-[var(--muted)]">This working has 20+ pieces. You can still add more.</p>
        ) : null}
        <p className="mt-1 text-xs text-[var(--muted)]">Enter Duty Pay first, then subtract what you paid.</p>
      </div>

      <section
        className={`panel-glow mt-3 shrink-0 rounded-2xl p-4 ${
          result.kind === "saving"
            ? "text-[var(--saving)]"
            : result.kind === "extra"
              ? "text-[var(--extra)]"
              : "text-[var(--even)]"
        }`}
        aria-live="polite"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em]">{result.label}</p>
        <p className="display-glow font-mono text-4xl font-semibold tabular-nums landscape:text-4xl portrait:text-5xl" aria-label={result.label}>
          {result.magnitudeHmm}
        </p>
      </section>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3">
        <div className="grid grid-cols-2 gap-3">
          <button type="button" aria-label="Clear pieces" onClick={() => setStore((prev) => ({ ...prev, pad: clearPieces(prev.pad) }))} className="btn-loud-clear">
            Clear
          </button>
          <button type="button" aria-label="New working" onClick={onNew} className="btn-loud-new">
            New
          </button>
        </div>

        <section className="mt-4" aria-label="Tape">
          <h2 className="text-sm font-semibold">Tape</h2>
          {pad.current.pieces.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">No pieces yet. Enter Duty Pay, then subtract paid time.</p>
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
          <p className="text-xs text-[var(--muted)]">Last 3 workings. Tap a row to recover.</p>
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
                        {label.delta} · {label.pay} · {label.pieces} pcs
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

      </div>
      {keypad}
      <StatsPanel open={statsOpen} onClose={() => setStatsOpen(false)} stats={store.stats} />
    </main>
  );
}
