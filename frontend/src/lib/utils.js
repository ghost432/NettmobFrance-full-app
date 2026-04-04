import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function safeJsonParse(str, fallback = []) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}
