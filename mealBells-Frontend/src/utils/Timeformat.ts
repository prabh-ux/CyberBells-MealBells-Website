/**
 * Formats a "HH:mm" 24-hour string → "9:00 AM" style local time.
 * Returns "—" for empty / invalid input.
 */
export function formatTime(hhmm: string | null | undefined): string {
  if (!hhmm) return "—";
  const parts = hhmm.split(":");
  if (parts.length < 2) return "—";
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  if (isNaN(hh) || isNaN(mm)) return "—";
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Returns true if the current local time is past the "HH:mm" cutoff string.
 * Returns false for empty / invalid input (safe default = not locked).
 */
export function isPastCutoff(cutoffTime: string | null | undefined): boolean {
  if (!cutoffTime) return false;
  const parts = cutoffTime.split(":");
  if (parts.length < 2) return false;
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  if (isNaN(hh) || isNaN(mm)) return false;
  const now    = new Date();
  const cutoff = new Date();
  cutoff.setHours(hh, mm, 0, 0);
  return now > cutoff;
}