/** Calendar helpers. Days are the member's local calendar day (matches FitForge's date pickers). */
export const ymd = (d: Date = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => ymd();
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Parse an API date (ISO) to a local Date for display. */
export const parse = (iso: string | null | undefined) => (iso ? new Date(iso) : null);
/** Day key of an API "date" column stored at UTC noon/midnight → YYYY-MM-DD. */
export const utcDay = (iso: string) => iso.slice(0, 10);

export function relative(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function dayLabel(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const t = new Date();
  const k = (x: Date) => x.toDateString();
  if (k(d) === k(t)) return `Today at ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  if (k(d) === k(addDays(t, -1))) return `Yesterday at ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export const shortDate = (iso: string | Date | null | undefined) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export function duration(seconds: number) {
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
