import React from "react";
import AssigneeAvatar from "./ui/AssigneeAvatar";
import { ASSIGNEES } from "../lib/constants";
import AuthShell, { glassCard, glassCardShadow } from "./AuthShell";

export default function LoginScreen({ onChoose }) {
  return (
    <AuthShell>
      <div className={glassCard} style={glassCardShadow}>
        <p className="text-sm text-white/50 mb-6 text-center">Who's opening the ledger?</p>
        <div className="flex flex-col gap-2.5">
          {ASSIGNEES.filter((a) => a !== "Both").map((a) => (
            <button
              key={a}
              onClick={() => onChoose(a)}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.09] hover:border-white/[0.2] group transition-all duration-150 active:scale-[0.98]"
            >
              <AssigneeAvatar name={a} size={32} />
              <span className="text-white/90 group-hover:text-white font-medium transition-colors">{a}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
