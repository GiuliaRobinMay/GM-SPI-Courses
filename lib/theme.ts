import type { AccentToken } from "./types";

interface AccentStyle {
  /** Soft tinted surface, used for icon chips and cover blocks */
  soft: string;
  /** Text colour on a soft surface */
  softText: string;
  /** Solid surface for badges and progress bars */
  solid: string;
  /** Thin border matching the tint */
  border: string;
  /** Gradient used on course covers */
  cover: string;
}

export const ACCENTS: Record<AccentToken, AccentStyle> = {
  indigo: {
    soft: "bg-indigo-50",
    softText: "text-indigo-600",
    solid: "bg-indigo-600",
    border: "border-indigo-100",
    cover: "from-indigo-500/90 to-violet-500/90",
  },
  violet: {
    soft: "bg-violet-50",
    softText: "text-violet-600",
    solid: "bg-violet-600",
    border: "border-violet-100",
    cover: "from-violet-500/90 to-fuchsia-500/90",
  },
  sky: {
    soft: "bg-sky-50",
    softText: "text-sky-600",
    solid: "bg-sky-600",
    border: "border-sky-100",
    cover: "from-sky-500/90 to-cyan-400/90",
  },
  emerald: {
    soft: "bg-emerald-50",
    softText: "text-emerald-600",
    solid: "bg-emerald-600",
    border: "border-emerald-100",
    cover: "from-emerald-500/90 to-teal-400/90",
  },
  amber: {
    soft: "bg-amber-50",
    softText: "text-amber-600",
    solid: "bg-amber-500",
    border: "border-amber-100",
    cover: "from-amber-400/90 to-orange-500/90",
  },
  rose: {
    soft: "bg-rose-50",
    softText: "text-rose-600",
    solid: "bg-rose-600",
    border: "border-rose-100",
    cover: "from-rose-500/90 to-pink-500/90",
  },
  slate: {
    soft: "bg-slate-100",
    softText: "text-slate-600",
    solid: "bg-slate-700",
    border: "border-slate-200",
    cover: "from-slate-500/90 to-slate-700/90",
  },
};

export const ACCENT_TOKENS = Object.keys(ACCENTS) as AccentToken[];

export function accent(token: AccentToken | undefined): AccentStyle {
  return ACCENTS[token ?? "indigo"];
}
