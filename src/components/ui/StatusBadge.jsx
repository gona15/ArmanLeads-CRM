import React from "react";
import { STATUS_COLOR } from "../../lib/constants";
import { hexToRgba } from "../../lib/theme";

export default function StatusBadge({ status, size = "md" }) {
  const color = STATUS_COLOR[status] || "#9CA3AF";
  const padding = size === "sm" ? "px-2 py-[3px] text-[10px]" : "px-2.5 py-[5px] text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} font-mono font-semibold rounded-full whitespace-nowrap leading-none`}
      style={{ backgroundColor: hexToRgba(color, 0.13), color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}
