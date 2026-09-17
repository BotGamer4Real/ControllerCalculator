"use client";

import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { StatsPanel } from "@/components/StatsPanel";
import {
  clearDrivePieces,
  commitDrivePiece,
  driveHistoryLabel,
  driveResult,
  formatDriveTapePiece,
  newDriveWorking,
  recoverDriveWorking,
  runningDriveSubtotals,
  sameAgainDrive,
} from "@/lib/drive";
import { APP_VERSION } from "@/lib/appVersion";
import { applyDriveToStats, applyWorkingToStats, noteRecovered } from "@/lib/stats";
import { emptyStore, loadStore, saveStore, type DriveField, type PadMode, type StoredState } from "@/lib/storage";
import { backspaceHmm, formatHmm, hmmMinutesComplete, liveHmm } from "@/lib/time";
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
  const startRef = useRef<HTMLInputElement>(null);
  const finishRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!ready || statsOpen) return;
    if (store.mode === "duty") {
      payRef.current?.focus();
      return;
    }
    if (store.driveField === "finish") finishRef.current?.focus();
    else startRef.current?.focus();
  }, [ready, statsOpen, store.mode, store.driveField]);

  const isDrive = store.mode === "drive";
  const pad = store.pad;
  const drivePad = store.drivePad;
  const result = isDrive ? driveResult(drivePad.current) : workingResult(pad.current);
  const dutySubtotals = useMemo(() => runningSubtotals(pad.current.pieces), [pad.current.pieces]);
  const driveSubtotals = useMemo(
    () => runningDriveSubtotals(drivePad.current.pieces),
    [drivePad.current.pieces],
  );

  function setMode(mode: PadMode) {
    setPayError(null);
    setPieceWarning(false);
    setPendingSign(1);
    setStore((prev) => ({ ...prev, mode, driveField: mode === "drive" ? "start" : prev.driveField }));
  }

  function setDriveField(field: DriveField) {
    setStore((prev) => (prev.driveField === field ? prev : { ...prev, driveField: field }));
  }

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

  function commitDrive(sign: PieceSign): boolean {
    const outcome = commitDrivePiece(store.drivePad, store.startDraft, store.finishDraft, sign);
    if (!outcome.ok) {
      setPayError(outcome.error);
      return false;
    }
    setPayError(null);
    setPieceWarning(outcome.warning);
    setStore((prev) => ({
      ...prev,
      drivePad: outcome.pad,
      startDraft: "",
      finishDraft: "",
      driveField: "start",
      stats: applyDriveToStats(prev.stats, outcome.pad.current),
    }));
    return true;
  }

  function onOperator(nextSign: PieceSign) {
    if (isDrive) {
      const hasStart = Boolean(store.startDraft.trim());
      const hasFinish = Boolean(store.finishDraft.trim());
      if (hasStart || hasFinish) {
        if (hasStart && !hasFinish) {
          setPayError(null);
          setDriveField("finish");
          setPendingSign(nextSign);
          return;
        }
        if (!commitDrive(pendingSign)) return;
      }
      setPendingSign(nextSign);
      return;
    }
    if (store.payDraft.trim()) {
      if (!commitPay(pendingSign)) return;
    }
    setPendingSign(nextSign);
    setPayError(null);
    payRef.current?.focus();
  }

  function onCommit() {
    if (isDrive) {
      if (!commitDrive(pendingSign)) return;
      setPendingSign(1);
      return;
    }
    if (!commitPay(pendingSign)) return;
    setPendingSign(1);
  }

  function onReset() {
    setPayError(null);
    if (isDrive) {
      setStore((prev) => ({
        ...prev,
        startDraft: prev.driveField === "start" ? "" : prev.startDraft,
        finishDraft: prev.driveField === "finish" ? "" : prev.finishDraft,
      }));
      return;
    }
    setStore((prev) => ({ ...prev, payDraft: "" }));
  }

  function onClear() {
    setPayError(null);
    setPieceWarning(false);
    setPendingSign(1);
    if (isDrive) {
      setStore((prev) => ({
        ...prev,
        drivePad: clearDrivePieces(prev.drivePad),
        startDraft: "",
        finishDraft: "",
        driveField: "start",
      }));
      return;
    }
    setStore((prev) => ({
      ...prev,
      pad: clearPieces(prev.pad),
      payDraft: "",
    }));
  }

  function onNew() {
    setPayError(null);
    setPieceWarning(false);
    setPendingSign(1);
    if (isDrive) {
      setStore((prev) => ({
        ...prev,
        drivePad: newDriveWorking(prev.drivePad),
        startDraft: "",
        finishDraft: "",
        driveField: "start",
      }));
      return;
    }
    setStore((prev) => ({
      ...prev,
      pad: newWorking(prev.pad),
      payDraft: "",
    }));
    payRef.current?.focus();
  }

  function onRecover(id: string) {
    setPayError(null);
    setPendingSign(1);
    if (isDrive) {
      setStore((prev) => {
        const next = recoverDriveWorking(prev.drivePad, id);
        return {
          ...prev,
          drivePad: next,
          startDraft: "",
          finishDraft: "",
          driveField: "start",
          stats: noteRecovered(prev.stats),
        };
      });
      return;
    }
    setStore((prev) => {
      const next = recoverWorking(prev.pad, id);
      return {
        ...prev,
        pad: next,
        payDraft: "",
        stats: noteRecovered(prev.stats),
      };
    });
  }

  function onSameAgain(id: string) {
    setPayError(null);
    setPendingSign(1);
    if (isDrive) {
      setStore((prev) => {
        const next = sameAgainDrive(prev.drivePad, id);
        return { ...prev, drivePad: next, startDraft: "", finishDraft: "", driveField: "start" };
      });
      return;
    }
    setStore((prev) => {
      const next = sameAgain(prev.pad, id);
      return { ...prev, pad: next, payDraft: "" };
    });
  }

  function typeKey(key: string) {
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
    if (isDrive) {
      const field = store.driveField;
      if (key === "⌫") {
        setPayError(null);
        setStore((s) => ({
          ...s,
          startDraft: field === "start" ? backspaceHmm(s.startDraft) : s.startDraft,
          finishDraft: field === "finish" ? backspaceHmm(s.finishDraft) : s.finishDraft,
        }));
        return;
      }
      setPayError(null);
      setStore((s) => {
        const current = field === "start" ? s.startDraft : s.finishDraft;
        const next = liveHmm(current + key);
        const jump = field === "start" && hmmMinutesComplete(next);
        return {
          ...s,
          startDraft: field === "start" ? next : s.startDraft,
          finishDraft: field === "finish" ? next : s.finishDraft,
          driveField: jump ? "finish" : s.driveField,
        };
      });
      return;
    }
    if (key === "⌫") {
      setPayError(null);
      setStore((s) => ({ ...s, payDraft: backspaceHmm(s.payDraft) }));
      return;
    }
    setPayError(null);
    setStore((s) => ({ ...s, payDraft: liveHmm(s.payDraft + key) }));
  }

  function onFieldKeyDown(event: KeyboardEvent<HTMLInputElement>) {
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
        <button type="button" aria-label="Clear current field" className="btn-reset" onClick={() => typeKey("Rst")}>
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

  const signBadge = (
    <span
      className={`flex min-h-12 w-10 shrink-0 items-center justify-center rounded-l-xl border font-mono text-2xl font-semibold ${
        pendingSign === 1
          ? "border-[#14e0c4] bg-[#0d2a32] text-[#14e0c4]"
          : "border-[#ff7a4a] bg-[#2a1610] text-[#ff7a4a]"
      }`}
      aria-hidden="true"
    >
      {pendingSign === 1 ? "+" : "−"}
    </span>
  );

  return (
    <main className="pad-shell px-4 pb-[env(safe-area-inset-bottom)] pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pad-main">
      <header className="mb-3 flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--navy)]">Time duty calculator</p>
          <h1 className="display-glow text-2xl font-semibold tracking-tight sm:text-3xl">Duty Pad</h1>
          <p className="mt-0.5 font-mono text-[11px] text-[var(--muted)]">v{APP_VERSION}</p>
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

      <div
        className="mode-switch mb-3 shrink-0"
        role="tablist"
        aria-label="Calculation type"
      >
        <button
          type="button"
          role="tab"
          aria-selected={!isDrive}
          className={!isDrive ? "is-on" : ""}
          onClick={() => setMode("duty")}
        >
          Duty
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isDrive}
          className={isDrive ? "is-on" : ""}
          onClick={() => setMode("drive")}
        >
          Drive Time
        </button>
      </div>

      <div className="shrink-0">
        {isDrive ? (
          <>
            <div className="drive-labels">
              <span>Start time</span>
              <span>Finish time</span>
            </div>
            <div className="mt-1 flex">
              {signBadge}
              <input
                id="drive-start"
                ref={startRef}
                name="drive-start"
                aria-label="Start time"
                inputMode={coarsePointer ? "none" : "decimal"}
                readOnly={coarsePointer}
                autoComplete="off"
                placeholder="06:00"
                value={store.startDraft}
                onPointerDown={() => setDriveField("start")}
                onFocus={() => setDriveField("start")}
                onChange={(event) => {
                  setPayError(null);
                  const next = liveHmm(event.target.value);
                  setStore((s) => ({
                    ...s,
                    startDraft: next,
                    driveField: hmmMinutesComplete(next) ? "finish" : "start",
                  }));
                }}
                onKeyDown={onFieldKeyDown}
                className={`field-glow min-h-12 min-w-0 flex-1 rounded-none px-2 font-mono text-lg ${
                  store.driveField === "start" ? "field-on" : ""
                }`}
              />
              <span className="drive-dash" aria-hidden="true">
                −
              </span>
              <input
                id="drive-finish"
                ref={finishRef}
                name="drive-finish"
                aria-label="Finish time"
                inputMode={coarsePointer ? "none" : "decimal"}
                readOnly={coarsePointer}
                autoComplete="off"
                placeholder="8:34"
                value={store.finishDraft}
                onPointerDown={() => setDriveField("finish")}
                onFocus={() => setDriveField("finish")}
                onChange={(event) => {
                  setPayError(null);
                  setStore((s) => ({ ...s, finishDraft: liveHmm(event.target.value), driveField: "finish" }));
                }}
                onKeyDown={onFieldKeyDown}
                className={`field-glow min-h-12 min-w-0 flex-1 rounded-r-xl rounded-l-none px-2 font-mono text-lg ${
                  store.driveField === "finish" ? "field-on" : ""
                }`}
              />
            </div>
            {payError ? <p className="mt-1 text-sm text-[var(--extra)]">{payError}</p> : null}
            {pieceWarning ? (
              <p className="mt-1 text-sm text-[var(--muted)]">This working has 20+ pieces. You can still add more.</p>
            ) : null}
            <p className="mt-1 text-xs text-[var(--muted)]">Start and finish, then + or −. Each pair adds to the tape.</p>
          </>
        ) : (
          <>
            <label className="text-sm font-semibold tracking-wide text-[var(--navy)]" htmlFor="pay">
              Pay time
            </label>
            <div className="mt-1 flex">
              {signBadge}
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
                onKeyDown={onFieldKeyDown}
                className="field-on field-glow min-h-12 w-full rounded-r-xl rounded-l-none px-3 font-mono text-lg"
              />
            </div>
            {payError ? <p className="mt-1 text-sm text-[var(--extra)]">{payError}</p> : null}
            {pieceWarning ? (
              <p className="mt-1 text-sm text-[var(--muted)]">This working has 20+ pieces. You can still add more.</p>
            ) : null}
            <p className="mt-1 text-xs text-[var(--muted)]">Enter Duty Pay first, then subtract what you paid.</p>
          </>
        )}
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
          {isDrive && result.kind === "extra" ? `− ${result.magnitudeHmm}` : result.magnitudeHmm}
        </p>
      </section>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3">
        <div className="grid grid-cols-2 gap-3">
          <button type="button" aria-label="Clear working" onClick={onClear} className="btn-loud-clear">
            Clear
          </button>
          <button type="button" aria-label="New working" onClick={onNew} className="btn-loud-new">
            New
          </button>
        </div>

        <section className="mt-4" aria-label="Tape">
          <h2 className="text-sm font-semibold">Tape</h2>
          {isDrive ? (
            drivePad.current.pieces.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">No pieces yet. Enter start and finish, then +.</p>
            ) : (
              <ol className="panel-glow mt-2 divide-y divide-[var(--line)] rounded-xl">
                {drivePad.current.pieces.map((piece, index) => (
                  <li key={`${index}-${piece.startMinutes}-${piece.finishMinutes}-${piece.minutes}`} className="flex min-h-11 items-center justify-between gap-2 px-3 font-mono text-sm">
                    <span>
                      {index + 1}. {formatDriveTapePiece(piece)}
                    </span>
                    <span className="shrink-0 text-[var(--muted)]">{formatHmm(driveSubtotals[index] ?? piece.minutes)}</span>
                  </li>
                ))}
              </ol>
            )
          ) : pad.current.pieces.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">No pieces yet. Enter Duty Pay, then subtract paid time.</p>
          ) : (
            <ol className="panel-glow mt-2 divide-y divide-[var(--line)] rounded-xl">
              {pad.current.pieces.map((piece, index) => (
                <li key={`${index}-${piece}`} className="flex min-h-11 items-center justify-between px-3 font-mono text-sm">
                  <span>
                    {index + 1}. {formatTapePiece(piece)}
                  </span>
                  <span className="text-[var(--muted)]">{formatHmm(dutySubtotals[index] ?? piece)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mt-4" aria-label="History">
          <h2 className="text-sm font-semibold">History</h2>
          <p className="text-xs text-[var(--muted)]">Last 3 workings. Tap a row to recover.</p>
          {isDrive ? (
            drivePad.history.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">No workings yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {drivePad.history.map((row) => {
                  const label = driveHistoryLabel(row);
                  const when = new Date(row.updatedAt);
                  return (
                    <li key={row.id} className="panel-glow rounded-xl p-3">
                      <button type="button" className="block w-full text-left" onClick={() => onRecover(row.id)}>
                        <p className="font-mono text-sm">
                          Drive {label.total} · {label.pieces} pcs
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
            )
          ) : pad.history.length === 0 ? (
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
