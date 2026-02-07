import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format time from minutes to readable string
export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Format percentage with sign
export function formatDelta(value: number): string {
  const sign = value > 0 ? "↑" : value < 0 ? "↓" : "→";
  return `${sign} ${Math.abs(value)}%`;
}
