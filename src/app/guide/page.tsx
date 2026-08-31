import Link from "next/link";

export const dynamic = "force-static";

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-2xl overflow-y-auto px-5 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] text-[var(--ink)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy)]">Duty Pad</p>
      <h1 className="mt-1 text-3xl font-semibold">User guide</h1>
      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
        A pad beside the weekly report. Enter Duty Pay first, then subtract what you paid the driver. The remaining time
        is Amount Saved or Additional Cost.
      </p>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">What it is (and is not)</h2>
        <p>
          Duty Pad adds and subtracts paid hours in H:MM. It is not a timesheet, overtime engine, payroll engine, or
          drivers’ hours tool.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">A working</h2>
        <p>
          Put the Duty Pay in Pay time, press +, then subtract each paid piece. The big number is Amount Saved if time
          remains, or Additional Cost if you paid more (valid, always shown). Even means zero.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">How to add and subtract</h2>
        <p>
          Type a time, then + or −. Equals finishes the last piece. Rst undoes the last piece. Clear empties the tape.
          New starts a fresh working. None of those ask for confirmation.
        </p>
        <p>Example: 10:00 + then 6:49 − then = → Amount Saved 3:11.</p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">History</h2>
        <p>
          Last 3 workings, newest first. Tap a row to recover it. If you then change it, the next archive writes a new
          row. Same again starts a new working from that row.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">Time format</h2>
        <p>
          Minutes only. Hours may go past 24. Minutes must be 00–59. Typing digits auto-formats: 123 becomes 1:23, 1030
          becomes 10:30.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">On this device</h2>
        <p>There is no login. History and stats stay in this browser on this device.</p>
      </section>

      <p className="mt-10">
        <Link href="/" className="underline">
          Back to the pad
        </Link>
        {" · "}
        <Link href="/privacy" className="underline">
          Privacy
        </Link>
      </p>
    </main>
  );
}
