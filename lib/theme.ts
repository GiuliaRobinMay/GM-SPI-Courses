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
  violet: {
    soft: "bg-brand-violet/10",
    softText: "text-brand-violet",
    solid: "bg-brand-violet",
    border: "border-brand-violet/20",
    cover: "from-brand-violet to-brand-violet-deep",
  },
  red: {
    soft: "bg-brand-red/10",
    softText: "text-brand-red",
    solid: "bg-brand-red",
    border: "border-brand-red/20",
    cover: "from-brand-red to-brand-red-deep",
  },
  green: {
    soft: "bg-brand-green/10",
    softText: "text-brand-green",
    solid: "bg-brand-green",
    border: "border-brand-green/20",
    cover: "from-brand-green to-brand-green-deep",
  },
  orange: {
    soft: "bg-brand-orange/10",
    softText: "text-brand-orange",
    solid: "bg-brand-orange",
    border: "border-brand-orange/20",
    cover: "from-brand-orange to-brand-orange-deep",
  },
};

/**
 * Libraries written before the palette was fixed carry Tailwind's names.
 * Fold each onto its nearest brand colour rather than dropping the row.
 */
const LEGACY: Record<string, AccentToken> = {
  indigo: "violet",
  sky: "violet",
  slate: "violet",
  rose: "red",
  emerald: "green",
  amber: "orange",
};

export const ACCENT_TOKENS = Object.keys(ACCENTS) as AccentToken[];

export function accent(token: string | undefined): AccentStyle {
  if (token && token in ACCENTS) return ACCENTS[token as AccentToken];
  return ACCENTS[(token && LEGACY[token]) || "violet"];
}
