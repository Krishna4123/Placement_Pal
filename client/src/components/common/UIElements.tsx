import React from "react";

/* ── GlassCard ───────────────────────────────────────────── */
export const GlassCard = ({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) => (
  <div
    className={`bg-card border border-border rounded-2xl shadow-sm ${
      hover ? "card-hover cursor-pointer" : ""
    } ${className}`}
  >
    {children}
  </div>
);

/* ── Badge ───────────────────────────────────────────────── */
export type BadgeColor = "blue" | "purple" | "green" | "amber" | "red" | "gray";

const badgeStyles: Record<BadgeColor, string> = {
  blue:   "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/60",
  purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-900/60",
  green:  "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-100 dark:border-green-900/60",
  amber:  "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/60",
  red:    "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900/60",
  gray:   "bg-secondary text-muted-foreground border-border",
};

export const Badge = ({
  children,
  color = "blue",
  className = "",
}: {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[color]} ${className}`}
  >
    {children}
  </span>
);

/* ── Btn ─────────────────────────────────────────────────── */
export type BtnVariant = "primary" | "secondary" | "ghost" | "gradient";
export type BtnSize = "sm" | "md" | "lg";

const btnSizes: Record<BtnSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-7 py-3 text-base rounded-xl",
};

const btnVariants: Record<BtnVariant, string> = {
  primary:   "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
  secondary: "bg-card text-foreground border border-border hover:bg-secondary",
  ghost:     "text-muted-foreground hover:bg-secondary hover:text-foreground",
  gradient:  "bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white hover:opacity-90 shadow-sm btn-shimmer",
};

export const Btn = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-1.5 font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm ${btnSizes[size]} ${btnVariants[variant]} ${className}`}
  >
    {children}
  </button>
);

/* ── ProgressBar ─────────────────────────────────────────── */
export const ProgressBar = ({
  value,
  color = "var(--primary)",
  className = "",
  animate = true,
}: {
  value: number;
  color?: string;
  className?: string;
  animate?: boolean;
}) => (
  <div className={`h-1.5 bg-secondary rounded-full overflow-hidden ${className}`}>
    <div
      className={`h-full rounded-full transition-all ${animate ? "duration-700 ease-out" : ""}`}
      style={{
        width: `${Math.min(value, 100)}%`,
        background: color,
      }}
    />
  </div>
);
