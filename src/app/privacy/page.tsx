import Link from "next/link";

export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-[var(--ink)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy)]">Duty Pad</p>
      <h1 className="mt-1 text-3xl font-semibold">Privacy</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Last updated 30 August 2026</p>
      <div className="mt-6 space-y-4 text-sm leading-6">
        <p>
          Duty Pad is an adult workplace time calculator. Workings and stats stay on this device in the browser. There
          is no account and no cloud copy. We do not send piece lists to advertising or analytics companies.
        </p>
        <p>Not designed for children. No chat. No public leaderboard.</p>
      </div>
      <p className="mt-10">
        <Link href="/" className="underline">
          Back to the pad
        </Link>
      </p>
    </main>
  );
}
