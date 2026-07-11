import React from "react";

const VARIANTS = {
  primary: "bg-[#2F6F62] text-white hover:bg-[#1F5C4E] disabled:bg-[#D1D5DB] disabled:text-white disabled:cursor-not-allowed",
  navy: "bg-[#12283C] text-white hover:bg-[#1B3A52]",
  secondary: "bg-white text-[#12283C] border border-[#E4E0D5] hover:border-[#12283C]/40 hover:bg-[#F7F5EF]",
  ghost: "bg-transparent text-[#6B6355] hover:bg-[#12283C]/5 hover:text-[#12283C]",
  danger: "bg-transparent text-[#A33B3B] hover:bg-[#A33B3B]/10",
  dangerSolid: "bg-[#A33B3B] text-white hover:bg-[#8A2F2F]",
};

const SIZES = {
  sm: "text-xs px-2.5 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-3.5 py-2 gap-1.5 rounded-xl",
  lg: "text-sm px-5 py-2.5 gap-2 rounded-xl",
};

export default function Button({ variant = "primary", size = "md", className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.97] focus-ring whitespace-nowrap ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
