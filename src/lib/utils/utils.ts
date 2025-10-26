import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, isValid } from "date-fns";

// Centralized logger that removes console statements in production
export const logger = {
  debug: process.env.NODE_ENV === 'development' ? console.log : () => {},
  info: process.env.NODE_ENV === 'development' ? console.info : () => {},
  warn: process.env.NODE_ENV === 'development' ? console.warn : () => {},
  error: console.error, // Always log errors
  log: process.env.NODE_ENV === 'development' ? console.log : () => {},
  group: process.env.NODE_ENV === 'development' ? console.group : () => {},
  groupEnd: process.env.NODE_ENV === 'development' ? console.groupEnd : () => {},
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely formats a date string with validation
 * Returns a fallback value for invalid dates
 */
export function safeFormatDate(
  dateString: string | null | undefined,
  fallback: string = "—"
): string {
  if (!dateString) {
    return fallback;
  }

  try {
    const date = new Date(dateString);

    // Check if the date is valid
    if (!isValid(date)) {
      console.warn(`Invalid date string received: ${dateString}`);
      return fallback;
    }

    return format(date, "PPP");
  } catch (error) {
    logger.error(`Error formatting date: ${dateString}`, error);
    return fallback;
  }
}

/**
 * Safely formats a time string with validation
 * Returns a fallback value for invalid dates
 */
export function safeFormatTime(
  dateString: string | null | undefined,
  fallback: string = "—"
): string {
  if (!dateString) {
    return fallback;
  }

  try {
    const date = new Date(dateString);

    // Check if the date is valid
    if (!isValid(date)) {
      logger.warn(`Invalid date string received: ${dateString}`);
      return fallback;
    }

    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "HH:mm")}`;
    } else {
      return format(date, "MMM dd, HH:mm");
    }
  } catch (error) {
    logger.error(`Error formatting time: ${dateString}`, error);
    return fallback;
  }
}

/**
 * Safely formats a date and time string with validation
 * Returns a fallback value for invalid dates
 */
export function safeFormatDateTime(
  dateString: string | null | undefined,
  fallback: string = "—"
): string {
  if (!dateString) {
    return fallback;
  }

  try {
    const date = new Date(dateString);

    // Check if the date is valid
    if (!isValid(date)) {
      logger.warn(`Invalid date string received: ${dateString}`);
      return fallback;
    }

    return format(date, "PPP HH:mm");
  } catch (error) {
    logger.error(`Error formatting datetime: ${dateString}`, error);
    return fallback;
  }
}

// Fixed calendar-like formatter: dd MMM yyyy, HH.mm (id-ID)
// Robust parsing for Date | epoch seconds/ms | SQL timestamps | ISO
export function formatCalendarDate(input: any): string {
  try {
    if (input == null) return "—";

    let d: Date | null = null;
    if (input instanceof Date) {
      d = input;
    } else if (typeof input === "number") {
      const ms = input < 1e12 ? input * 1000 : input;
      d = new Date(ms);
    } else if (typeof input === "string") {
      const raw = input.trim();
      if (!raw) return "—";
      if (/^\d+$/.test(raw)) {
        const num = Number(raw);
        const ms = raw.length <= 10 ? num * 1000 : num;
        d = new Date(ms);
      } else {
        let normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
        normalized = normalized.replace(/\.(\d{3})\d+/, ".$1");
        if (
          normalized.includes("T") &&
          !/[Zz]|[+-]\d{2}:?\d{2}$/.test(normalized)
        ) {
          normalized += "Z";
        }
        const parsed = new Date(normalized);
        if (!isNaN(parsed.getTime())) d = parsed;
      }
    }

    if (!d || isNaN(d.getTime())) return "—";

    let text = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);

    // Normalize "pukul" to comma and 14:05 -> 14.05
    text = text.replace(" pukul ", ", ");
    text = text.replace(/(\d{2}):(\d{2})/, (_m, h, m) => `${h}.${m}`);
    return text;
  } catch {
    return "—";
  }
}
