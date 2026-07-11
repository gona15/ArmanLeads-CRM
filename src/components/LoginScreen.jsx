import React from "react";
import { Mail } from "lucide-react";
import AssigneeAvatar from "./ui/AssigneeAvatar";
import { ASSIGNEES } from "../lib/constants";

export default function LoginScreen({ onChoose }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "radial-gradient(120% 120% at 50% -10%, #EAE5D6 0%, #F5F3EC 55%, #F5F3EC 100%)" }}
    >
      <div className="max-w-sm w-full animate-fade-slide-up">
        <div
          className="bg-white border border-[#E4E0D5] rounded-[28px] p-8 text-center"
          style={{ boxShadow: "0 1px 2px rgba(18,40,60,0.06), 0 30px 60px -20px rgba(18,40,60,0.25)" }}
        >
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#3A8172] to-[#1F5C4E] flex items-center justify-center shadow-[0_8px_20px_rgba(47,111,98,0.35)]">
            <Mail className="text-white" size={28} />
          </div>
          <h1 className="font-serif text-[26px] text-[#12283C] mb-1.5 leading-tight">ArmanLeads Ledger</h1>
          <p className="text-sm text-[#8A8574] mb-7">Who's opening the ledger?</p>
          <div className="flex flex-col gap-2.5">
            {ASSIGNEES.filter((a) => a !== "Both").map((a) => (
              <button
                key={a}
                onClick={() => onChoose(a)}
                className="w-full flex items-center gap-3 py-2.5 px-4 rounded-2xl border border-[#E4E0D5] hover:border-[#12283C] hover:bg-[#12283C] group transition-all duration-150 active:scale-[0.98]"
              >
                <AssigneeAvatar name={a} size={32} />
                <span className="text-[#12283C] group-hover:text-white font-medium transition-colors">{a}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
