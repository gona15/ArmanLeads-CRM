import React, { useState } from "react";
import { Lock } from "lucide-react";

const STORAGE_KEY = "armanleads-gate-ok";

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return children;

  const tryUnlock = (e) => {
    e.preventDefault();
    if (value === import.meta.env.VITE_APP_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setValue("");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "radial-gradient(120% 120% at 50% -10%, #EAE5D6 0%, #F5F3EC 55%, #F5F3EC 100%)" }}
    >
      <form
        onSubmit={tryUnlock}
        className="max-w-sm w-full bg-white border border-[#E4E0D5] rounded-[28px] p-8 text-center"
        style={{ boxShadow: "0 1px 2px rgba(18,40,60,0.06), 0 30px 60px -20px rgba(18,40,60,0.25)" }}
      >
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#3A8172] to-[#1F5C4E] flex items-center justify-center">
          <Lock className="text-white" size={26} />
        </div>
        <h1 className="font-serif text-2xl text-[#12283C] mb-1.5">ArmanLeads Ledger</h1>
        <p className="text-sm text-[#8A8574] mb-6">Enter the password to continue.</p>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          placeholder="Password"
          className="w-full border border-[#E4E0D5] rounded-xl px-3 py-2.5 text-sm text-center mb-3 focus:outline-none focus:ring-4 focus:ring-[#2F6F62]/10 focus:border-[#2F6F62]"
        />
        {error && <p className="text-xs text-[#A33B3B] mb-3">Wrong password — try again.</p>}
        <button type="submit" className="w-full bg-[#2F6F62] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#1F5C4E] transition-colors">
          Enter
        </button>
      </form>
    </div>
  );
}
