import React from "react";
import { Users } from "lucide-react";
import { ASSIGNEE_COLOR } from "../../lib/theme";

export default function AssigneeAvatar({ name, size = 28, className = "" }) {
  const color = ASSIGNEE_COLOR[name] || "#9CA3AF";

  if (name === "Both") {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full text-white shrink-0 ${className}`}
        style={{ width: size, height: size, backgroundColor: color }}
        title="Both"
      >
        <Users size={Math.max(11, size * 0.5)} />
      </div>
    );
  }

  const letter = (name || "?").slice(0, 1).toUpperCase();
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: color, fontSize: Math.max(10, size * 0.42) }}
      title={name || ""}
    >
      {letter}
    </div>
  );
}
