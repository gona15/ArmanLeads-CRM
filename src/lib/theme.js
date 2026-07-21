// ---------- presentation helpers ----------
// Pure UI helpers only — nothing here touches the data model or Supabase.

export function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// The armanleads.com brand maroon, used as a targeted accent only (truly
// overdue items, primary urgency states) — never as a base/background
// color, so the daily-use tool stays calm rather than alarm-colored.
export const BRAND_MAROON = "#7A1F2B";

// Fixed, deliberate colors for the two people + the joint "Both" queue —
// stable and recognizable rather than hash-derived, since there are only
// ever three values here.
export const ASSIGNEE_COLOR = {
  Arman: "#2F6F62",
  Prusha: "#5B8DB8",
  Both: "#C99A3C",
};

const AVATAR_PALETTE = ["#2F6F62", "#5B8DB8", "#C99A3C", "#8B6FB8", "#D2691E", "#1F5C4E", "#A33B3B", "#12283C"];

// Deterministic color per clinic name/id so the same clinic always gets the
// same avatar tint across the list, queues, and detail view.
export function colorForSeed(seed) {
  const str = String(seed || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
  const idx = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

export const SHADOW = {
  card: "0 1px 2px rgba(18,40,60,0.05), 0 1px 1px rgba(18,40,60,0.03)",
  raised: "0 1px 2px rgba(18,40,60,0.06), 0 10px 30px -8px rgba(18,40,60,0.12)",
  lift: "0 4px 10px rgba(18,40,60,0.08), 0 24px 48px -12px rgba(18,40,60,0.18)",
  popover: "0 20px 50px -12px rgba(18,40,60,0.35), 0 4px 12px rgba(18,40,60,0.15)",
};
