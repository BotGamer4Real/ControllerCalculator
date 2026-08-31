export type ParseOk = { ok: true; minutes: number };
export type ParseFail = { ok: false; error: string };
export type ParseResult = ParseOk | ParseFail;

const EMPTY = "Enter a time in H:MM.";
const UNPARSEABLE = "Use H:MM (for example 6:49).";
const SECONDS = "Minutes only — seconds are not accepted.";
const MINUTES_RANGE = "Minutes must be 00–59.";
const NEGATIVE = "Time cannot be negative.";

export function parseHmm(raw: string): ParseResult {
  const input = raw.trim();
  if (input.length === 0) return { ok: false, error: EMPTY };
  if (/[a-z]/i.test(input)) return { ok: false, error: UNPARSEABLE };
  if (input.includes("-")) return { ok: false, error: NEGATIVE };

  const colonCount = (input.match(/:/g) ?? []).length;
  if (colonCount > 1) return { ok: false, error: SECONDS };
  if (colonCount === 1) return parseHoursMinutes(input.split(":"));

  if (input.includes(".")) {
    if ((input.match(/\./g) ?? []).length !== 1) return { ok: false, error: UNPARSEABLE };
    return parseHoursMinutes(input.split("."));
  }

  if (!/^\d+$/.test(input)) return { ok: false, error: UNPARSEABLE };
  if (input.length <= 2) return fromHoursMinutes(Number(input), 0);
  return fromHoursMinutes(Number(input.slice(0, -2)), Number(input.slice(-2)));
}

function parseHoursMinutes(parts: string[]): ParseResult {
  if (parts.length !== 2) return { ok: false, error: UNPARSEABLE };
  const [hoursRaw, minutesRaw] = parts;
  if (hoursRaw.length === 0 || minutesRaw.length === 0) return { ok: false, error: UNPARSEABLE };
  if (!/^\d+$/.test(hoursRaw) || !/^\d+$/.test(minutesRaw)) return { ok: false, error: UNPARSEABLE };
  if (minutesRaw.length > 2) return { ok: false, error: SECONDS };
  return fromHoursMinutes(Number(hoursRaw), Number(minutesRaw));
}

function fromHoursMinutes(hours: number, minutes: number): ParseResult {
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return { ok: false, error: UNPARSEABLE };
  if (hours < 0 || minutes < 0) return { ok: false, error: NEGATIVE };
  if (minutes > 59) return { ok: false, error: MINUTES_RANGE };
  return { ok: true, minutes: hours * 60 + minutes };
}

/** As-you-type: 123 → 1:23, 1030 → 10:30. Last two digits are minutes. */
export function liveHmm(raw: string): string {
  if (raw.includes(".")) {
    const kept = raw.replace(/[^\d.]/g, "");
    const firstDot = kept.indexOf(".");
    if (firstDot === -1) return kept;
    return `${kept.slice(0, firstDot).replace(/\D/g, "")}.${kept.slice(firstDot + 1).replace(/\D/g, "").slice(0, 2)}`;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  const minutes = digits.slice(-2);
  const hours = digits.slice(0, -2).replace(/^0+(?=\d)/, "") || "0";
  return `${hours}:${minutes}`;
}

export function backspaceHmm(raw: string): string {
  if (raw.includes(".")) return liveHmm(raw.slice(0, -1));
  const digits = raw.replace(/\D/g, "").slice(0, -1);
  return liveHmm(digits);
}

export function formatHmm(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? "-" : "";
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${sign}${hours}:${minutes.toString().padStart(2, "0")}`;
}

export function sumMinutes(pieces: number[]): number {
  return pieces.reduce((acc, piece) => acc + piece, 0);
}

export type DeltaKind = "saving" | "extra" | "even";

export type Delta = {
  kind: DeltaKind;
  minutes: number;
  label: string;
  signedHmm: string;
  magnitudeHmm: string;
};

export function signedDelta(dutyMinutes: number | null, payMinutes: number): Delta | null {
  if (dutyMinutes === null) return null;
  const minutes = dutyMinutes - payMinutes;
  const magnitudeHmm = formatHmm(Math.abs(minutes));
  if (minutes > 0) {
    return { kind: "saving", minutes, label: "Saving", signedHmm: `+${magnitudeHmm}`, magnitudeHmm };
  }
  if (minutes < 0) {
    return { kind: "extra", minutes, label: "Extra", signedHmm: `-${magnitudeHmm}`, magnitudeHmm };
  }
  return { kind: "even", minutes: 0, label: "even", signedHmm: "0:00", magnitudeHmm: "0:00" };
}
