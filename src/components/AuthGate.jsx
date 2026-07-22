import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { supabase } from "../supabaseClient";

// Real Supabase Auth login, replacing the old PasswordGate (a shared
// static password that never actually protected the database — the
// REST/Realtime calls in useCloudState.js had no RLS behind them at all).
// Session state is undefined while checking, null when signed out, an
// object once signed in — children only ever render in that last case.
export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.access_token) supabase.realtime.setAuth(newSession.access_token);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div
        className="min-h-screen"
        style={{ background: "radial-gradient(120% 120% at 50% -10%, #EAE5D6 0%, #F5F3EC 55%, #F5F3EC 100%)" }}
      />
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
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "radial-gradient(120% 120% at 50% -10%, #EAE5D6 0%, #F5F3EC 55%, #F5F3EC 100%)" }}
    >
      <form
        onSubmit={trySignIn}
        className="max-w-sm w-full bg-white border border-[#E4E0D5] rounded-[28px] p-8 text-center"
        style={{ boxShadow: "0 1px 2px rgba(18,40,60,0.06), 0 30px 60px -20px rgba(18,40,60,0.25)" }}
      >
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
          className="w-full border border-[#E4E0D5] rounded-xl px-3 py-2.5 text-sm text-center mb-2.5 focus:outline-none focus:ring-4 focus:ring-[#2F6F62]/10 focus:border-[#2F6F62]"
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
