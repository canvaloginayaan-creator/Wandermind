export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  PKR: "₨",
  USD: "$",
  AED: "AED ",
  EUR: "€",
  THB: "฿",
  TRY: "₺",
  GBP: "£",
};

export function money(amount: number, currency = "PKR", compact = false) {
  const sym = CURRENCY_SYMBOL[currency] ?? "";
  const n = Number.isFinite(amount) ? amount : 0;
  if (compact) {
    const abs = Math.abs(n);
    if (currency === "PKR" && abs >= 100000) return `${sym}${(n / 100000).toFixed(abs % 100000 === 0 ? 0 : 1)}L`;
    if (abs >= 10000) return `${sym}${(n / 1000).toFixed(abs % 1000 === 0 ? 0 : 1)}k`;
  }
  return `${sym}${Math.round(n).toLocaleString("en-US")}`;
}

export function daysBetween(a: string, b: string) {
  const start = new Date(a + "T00:00:00Z").getTime();
  const end = new Date(b + "T00:00:00Z").getTime();
  return Math.max(1, Math.round((end - start) / 864e5) + 1);
}

export function addDays(date: string, n: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function eachDay(start: string, end: string) {
  const out: string[] = [];
  let cur = start;
  let guard = 0;
  while (cur <= end && guard < 60) {
    out.push(cur);
    cur = addDays(cur, 1);
    guard++;
  }
  return out;
}

export function fmtDate(date: string, opts?: Intl.DateTimeFormatOptions) {
  const d = new Date(date + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...opts,
  });
}

export function fmtDateLong(date: string) {
  return fmtDate(date, { weekday: "short", year: "numeric" });
}

export function relDays(date: string) {
  const today = new Date();
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const d = new Date(date + "T00:00:00Z").getTime();
  const diff = Math.round((d - t) / 864e5);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `in ${diff} days`;
}

export function minsToDur(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function timeToMins(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minsToTime(mins: number) {
  const total = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// deterministic string hash -> 0..1
export function hash01(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export function pick<T>(arr: T[], seed: string): T {
  return arr[Math.floor(hash01(seed) * arr.length) % arr.length];
}

export function mapUrl(name: string, city: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`)}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
