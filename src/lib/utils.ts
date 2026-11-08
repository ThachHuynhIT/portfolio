import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Reads `.message` from a caught value without assuming it is an `Error`
 * (e.g. Cloudinary rejects with plain `{ message, http_code }` objects).
 * Mirrors `error?.message` on an untyped value: returns undefined when absent.
 */
export function getErrorMessage(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "message" in error) {
    const { message } = error as { message: unknown };
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}
