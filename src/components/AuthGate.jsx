import React, { useState, useEffect } from "react";
import { Lock, KeyRound } from "lucide-react";
import { supabase } from "../supabaseClient";
import AuthShell, { glassCard, glassCardShadow, glassInput, glassButton } from "./AuthShell";

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
    // The branded animated shell itself is the loading state — no blank
    // white/cream flash while the session check resolves.
    return <AuthShell><div className="h-[220px]" /></AuthShell>;
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
      <AuthShell>
        <form onSubmit={submitNewPassword} className={glassCard} style={glassCardShadow}>
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#3A8172] to-[#1F5C4E] flex items-center justify-center shadow-[0_4px_16px_rgba(47,111,98,0.4)]">
            <KeyRound className="text-white" size={24} />
          </div>
          <h1 className="font-serif text-xl text-white mb-1.5">Set your password</h1>
          <p className="text-sm text-white/50 mb-6">For {session.user?.email}. This is the one you'll use to sign in from now on.</p>
          <input
            type="password"
            autoFocus
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
            placeholder="New password"
            className={`${glassInput} mb-3`}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            placeholder="Confirm password"
            className={`${glassInput} mb-4`}
          />
          {error && <p className="text-xs text-[#FF9B9B] mb-3">{error}</p>}
          <button type="submit" disabled={submitting} className={glassButton}>
            {submitting ? "Saving…" : "Save password"}
          </button>
        </form>
      </AuthShell>
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
    <AuthShell>
      <form onSubmit={trySignIn} className={glassCard} style={glassCardShadow}>
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#3A8172] to-[#1F5C4E] flex items-center justify-center shadow-[0_4px_16px_rgba(47,111,98,0.4)]">
          <Lock className="text-white" size={24} />
        </div>
        <p className="text-sm text-white/50 mb-6 text-center">Sign in to continue.</p>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="Email"
          className={`${glassInput} mb-3`}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          placeholder="Password"
          className={`${glassInput} mb-4`}
        />
        {error && <p className="text-xs text-[#FF9B9B] mb-3">{error}</p>}
        <button type="submit" disabled={submitting} className={glassButton}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
