import React from "react";

export const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${className}`}>{children}</div>
);

export type BadgeColor = "blue" | "purple" | "green" | "amber" | "red" | "gray";

const badgeStyles: Record<BadgeColor, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  purple: "bg-purple-50 text-purple-700 border-purple-100",
  green: "bg-green-50 text-green-700 border-green-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  red: "bg-red-50 text-red-700 border-red-100",
  gray: "bg-gray-50 text-gray-600 border-gray-200",
};

export const Badge = ({ children, color = "blue" }: { children: React.ReactNode; color?: BadgeColor }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[color]}`}>
    {children}
  </span>
);

export type BtnVariant = "primary" | "secondary" | "ghost" | "gradient";
export type BtnSize = "sm" | "md" | "lg";

const btnSizes: Record<BtnSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-7 py-3 text-base rounded-xl",
};

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-[#2563EB] text-white hover:bg-[#1d4ed8]",
  secondary: "bg-white text-[#374151] border border-gray-200 hover:bg-gray-50",
  ghost: "text-[#6B7280] hover:bg-gray-100 hover:text-[#374151]",
  gradient: "bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white hover:opacity-90",
};

export const Btn = ({
  children, onClick, variant = "primary", size = "md", className = "", disabled = false, type = "button"
}: {
  children: React.ReactNode; onClick?: () => void;
  variant?: BtnVariant; size?: BtnSize; className?: string; disabled?: boolean; type?: "button" | "submit" | "reset";
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-1.5 font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer ${btnSizes[size]} ${btnVariants[variant]} ${className}`}
  >
    {children}
  </button>
);

export const ProgressBar = ({ value, color = "#2563EB", className = "" }: { value: number; color?: string; className?: string }) => (
  <div className={`h-1.5 bg-gray-100 rounded-full overflow-hidden ${className}`}>
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
  </div>
);
