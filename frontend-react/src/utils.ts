import type { Stage } from "./types";

export type Band = "strong" | "moderate" | "weak";

export function band(final: number): Band {
  return final >= 65 ? "strong" : final >= 45 ? "moderate" : "weak";
}

export function bandLabel(b: Band): string {
  return b === "strong" ? "Strong fit" : b === "moderate" ? "Moderate fit" : "Weak fit";
}

export function fmtW(x: number): string {
  return (Math.round(x * 100) / 100).toString();
}

export const STAGES: { v: Stage; t: string }[] = [
  { v: "new", t: "New" },
  { v: "screened", t: "Screened" },
  { v: "interview", t: "Interview" },
  { v: "offer", t: "Offer" },
  { v: "rejected", t: "Rejected" },
];
