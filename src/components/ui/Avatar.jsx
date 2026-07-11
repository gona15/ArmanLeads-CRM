import React from "react";
import { initials } from "../../lib/theme";

export default function Avatar({ name, color = "#2F6F62", size = 32, className = "" }) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: color, fontSize: Math.max(10, size * 0.38) }}
    >
      {initials(name)}
    </div>
  );
}
