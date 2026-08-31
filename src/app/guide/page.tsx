import Link from "next/link";

export const dynamic = "force-static";

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-2xl overflow-y-auto px-5 py-10 text-[var(--ink)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy)]">Duty Pad</p>
      <h1 className="mt-1 text-3xl font-semibold">User guide</h1>
      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
        A pad beside the weekly report. The report stays in the office system. This pad totals paid pieces and compares
        them to a duty.
      </p>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">What it is (and is not)</h2>
        <p>
          Duty Pad totals what you actually paid the driver, then subtracts that from Duty Pay. The difference is Amount
          Saved or Additional Cost. It is not a timesheet, overtime engine, payroll engine, or drivers’ hours tool.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">A working</h2>
        <p>
          Optional Duty Pay (what the duty was worth) minus Paid (what you paid the driver). Positive is Amount Saved.
          Negative is Additional Cost (valid, always shown). Zero is Even.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">How to add and subtract</h2>
        <p>
          Type a pay time, then + or −. Plus and minus commit that piece and set the sign for the next one — so 10:00 +
          4:00 − 1:30 is one working and Paid is 12:30. Press = (or Enter) to finish the last piece. Empty commit is a
          visible fail. Undo piece, Clear pieces (asks first), and New working sit with the tape.
        </p>
        <p>
          On a phone, use the pad at the bottom of the screen. Duty Pay, pay, and the totals stay in view; tape and
          history scroll in the middle so the keypad never covers the working.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">Amount Saved and Additional Cost</h2>
        <p>
          Amount Saved means Duty Pay was more than you paid. Additional Cost means you paid more than Duty Pay. That is
          a normal result, not an error, and it is never hidden or clamped to zero.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">History</h2>
        <p>
          Last 3 workings, newest first. Tap a row to recover it onto the pad. If you then change it, the next archive
          writes a new row. The original is not silently rewritten. Same again starts a new working pre-filled from that
          row.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">Time format</h2>
        <p>
          Minutes only. Hours may go past 24. Minutes must be 00–59 — 6:75 is rejected, not carried. Typing digits
          auto-formats: 123 becomes 1:23, 1030 becomes 10:30. You can still type 6:49, or 6.49 as a colon alias (never
          decimal hours).
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">On this device</h2>
        <p>
          There is no login. History and stats stay in this browser on this device. Clearing site data clears them.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">Three typical workings</h2>
        <p>
          <strong>Amount Saved.</strong> Duty Pay 10:00, Paid 6:49 → Amount Saved 3:11.
        </p>
        <p>
          <strong>Split duty.</strong> Duty Pay 12:00, pieces 2:10 + 1:45 + 0:30 + 3:20 + 1:05 + 1:40 → Paid 10:30, Amount
          Saved 1:30.
        </p>
        <p>
          <strong>Additional Cost.</strong> Duty Pay 8:00, pieces 5:20 + 3:15 → Paid 8:35, Additional Cost 0:35 — shown,
          not an error.
        </p>
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
