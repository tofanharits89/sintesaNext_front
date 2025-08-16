import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, isValid } from "date-fns";

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
    console.error(`Error formatting date: ${dateString}`, error);
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
      console.warn(`Invalid date string received: ${dateString}`);
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
    console.error(`Error formatting time: ${dateString}`, error);
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
      console.warn(`Invalid date string received: ${dateString}`);
      return fallback;
    }

    return format(date, "PPP HH:mm");
  } catch (error) {
    console.error(`Error formatting datetime: ${dateString}`, error);
    return fallback;
  }
}
