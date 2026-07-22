import React, { useState, useEffect } from "react";
import { Lock, KeyRound } from "lucide-react";
import { supabase } from "../supabaseClient";

const shellStyle = { background: "radial-gradient(120% 120% at 50% -10%, #EAE5D6 0%, #F5F3EC 55%, #F5F3EC 100%)" };
const cardClass = "max-w-sm w-full bg-white border border-[#E4E0D5] rounded-[28px] p-8 text-center";
const cardShadow = { boxShadow: "0 1px 2px rgba(18,40,60,0.06), 0 30px 60px -20px rgba(18,40,60,0.25)" };
const inputClass = "w-full border border-[#E4E0D5] rounded-xl px-3 py-2.5 text-sm text-center mb-2.5 focus:outline-none focus:ring-4 focus:ring-[#2F6F62]/10 focus:border-[#2F6F62]";

// Real Supabase Auth login, replacing the old PasswordGate (a shared
// static password that never actually protected the database — the
// REST/Realtime calls in useCloudState.js had no RLS behind them at all).
//
// Invite/recovery emails log the browser in via a short-lived session as
// soon as the link is clicked — but that's not a password. If we let that
// session straight through to the app, the person never sets one, and is
// locked out for good the moment that session ends (signs out, clears
// storage, opens a different browser). So any session that arrived via
// one of those links has to pass through a mandatory "set your password"
// step before it counts as actually signed in.
export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  const [mustSetPassword, setMustSetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || "";
    if (hash.includes("type=invite") || hash.includes("type=recovery")) {
      setMustSetPassword(true);
    }

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (newSession?.access_token) supabase.realtime.setAuth(newSession.access_token);
      if (event === "PASSWORD_RECOVERY") setMustSetPassword(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="min-h-screen" style={shellStyle} />;
  }

  if (session && mustSetPassword) {
    const submitNewPassword = async (e) => {
      e.preventDefault();
      setError("");
      if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (newPassword !== confirmPassword) { setError("Passwords don't match."); return; }
      setSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setSubmitting(false);
      if (error) { setError(error.message); return; }
      window.history.replaceState(null, "", window.location.pathname);
      setMustSetPassword(false);
    };

    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={shellStyle}>
        <form onSubmit={submitNewPassword} className={cardClass} style={cardShadow}>
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#3A8172] to-[#1F5C4E] flex items-center justify-center">
            <KeyRound className="text-white" size={26} />
          </div>
          <h1 className="font-serif text-2xl text-[#12283C] mb-1.5">Set your password</h1>
          <p className="text-sm text-[#8A8574] mb-6">For {session.user?.email}. This is the one you'll use to sign in from now on.</p>
          <input
            type="password"
            autoFocus
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
            placeholder="New password"
            className={inputClass}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            placeholder="Confirm password"
            className="w-full border border-[#E4E0D5] rounded-xl px-3 py-2.5 text-sm text-center mb-3 focus:outline-none focus:ring-4 focus:ring-[#2F6F62]/10 focus:border-[#2F6F62]"
          />
          {error && <p className="text-xs text-[#A33B3B] mb-3">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#2F6F62] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#1F5C4E] transition-colors disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save password"}
          </button>
        </form>
      </div>
    );
  }

  if (session) return children;

  const trySignIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError("Wrong email or password — try again.");
      setPassword("");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={shellStyle}>
      <form onSubmit={trySignIn} className={cardClass} style={cardShadow}>
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#3A8172] to-[#1F5C4E] flex items-center justify-center">
          <Lock className="text-white" size={26} />
        </div>
        <h1 className="font-serif text-2xl text-[#12283C] mb-1.5">ArmanLeads Ledger</h1>
        <p className="text-sm text-[#8A8574] mb-6">Sign in to continue.</p>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="Email"
          className={inputClass}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          placeholder="Password"
          className="w-full border border-[#E4E0D5] rounded-xl px-3 py-2.5 text-sm text-center mb-3 focus:outline-none focus:ring-4 focus:ring-[#2F6F62]/10 focus:border-[#2F6F62]"
        />
        {error && <p className="text-xs text-[#A33B3B] mb-3">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#2F6F62] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#1F5C4E] transition-colors disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
