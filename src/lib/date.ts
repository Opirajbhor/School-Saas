/**
 * One date format for the whole app: `22/11/2026, Sunday`.
 *
 * Dates are stored as either a `date` column (`"2026-11-22"`), a timestamp, or
 * a `Date`, so all three are accepted. A bare `YYYY-MM-DD` is parsed as a local
 * calendar day — `new Date("2026-11-22")` would be UTC midnight and could show
 * as the 21st.
 */

export type DateInput = Date | string | number | null | undefined;

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SHORT_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (value: number) => String(value).padStart(2, "0");

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value);
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (day) {
    return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** `22/11/2026, Sunday` — the default everywhere a date is shown. */
export function formatDate(
  value: DateInput,
  { weekday = "long" }: { weekday?: "long" | "short" | "none" } = {},
): string {
  const date = toDate(value);
  if (!date) return "—";

  const base = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  if (weekday === "none") return base;
  if (weekday === "short") return `${base}, ${SHORT_WEEKDAYS[date.getDay()]}`;
  return `${base}, ${WEEKDAYS[date.getDay()]}`;
}

/**
 * Short form for narrow print columns — a routine header cell is ~22 mm wide,
 * so the weekday is abbreviated rather than dropped.
 */
export function formatDateCompact(value: DateInput): string {
  return formatDate(value, { weekday: "short" });
}

/** `22/11/2026, Sunday · 10:30` */
export function formatDateTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${formatDate(date)} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Today, in the same format — used on printed sheets. */
export function today(): string {
  return formatDate(new Date());
}
