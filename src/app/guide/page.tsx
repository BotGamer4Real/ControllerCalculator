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
          Duty Pad adds and subtracts paid hours in H:MM and, if you enter a duty, shows Saving, Extra, or even. It is
          not a timesheet, overtime engine, payroll engine, or drivers’ hours tool.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">A working</h2>
        <p>
          Optional Duty Pay + pay pieces in order + a live pay total. If Duty Pay is set, delta is duty minus pay.
          Positive is Saving. Negative is Extra (valid, always shown). Zero is even.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">How to add and subtract</h2>
        <p>
          Type a pay time, then + or −. Plus and minus both commit the number you just typed and set the sign for the
          next piece — so 10:00 + 4:00 − 1:30 is one working and the pay total is 12:30. Enter or Add commits the last
          piece with the current sign. The tape shows each piece with + or − and the running subtotal. Empty commit is a
          visible fail. Undo piece, Clear pieces (asks first), and New working sit with the tape.
        </p>
        <p>
          On a phone, use the pad at the bottom of the screen. Duty Pay, pay, and the totals stay in view; tape and
          history scroll in the middle so the keypad never covers the working.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold">Saving, Extra, and even</h2>
        <p>
          Extra means paid more than the Duty Pay. That is a normal result, not an error, and it is never hidden or
          clamped to zero.
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
          <strong>Simple saving.</strong> Duty Pay 10:00, pay 6:49 → pay 6:49, Saving 3:11.
        </p>
        <p>
          <strong>Split duty.</strong> Duty Pay 12:00, pieces 2:10 + 1:45 + 0:30 + 3:20 + 1:05 + 1:40 → pay 10:30, Saving
          1:30.
        </p>
        <p>
          <strong>Extra.</strong> Duty Pay 8:00, pieces 5:20 + 3:15 → pay 8:35, Extra 0:35 — shown, not an error.
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
