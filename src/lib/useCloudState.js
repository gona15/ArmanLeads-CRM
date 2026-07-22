import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";
import { ROW_ID, TABLE, DEFAULT_STATE, normalizeLead } from "./constants";

// Normalizes every lead in a loaded/incoming state blob so schema
// additions never crash on rows saved under an older shape.
function normalizeState(raw) {
  const state = { ...DEFAULT_STATE, ...raw };
  return { ...state, leads: (state.leads || []).map(normalizeLead) };
}

// ---------- Supabase-backed shared state ----------
// Moved verbatim from App.jsx — same table, same row id, same realtime
// channel, same persist logic. Nothing about the sync behavior changed.
export function useCloudState() {
  const [state, setState] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from(TABLE).select("data").eq("id", ROW_ID).single();
      if (error || !data) {
        await supabase.from(TABLE).insert({ id: ROW_ID, data: DEFAULT_STATE });
        setState(DEFAULT_STATE);
      } else {
        setState(normalizeState(data.data));
      }
      setLoaded(true);
    })();

    channelRef.current = supabase
      .channel("armanleads-sync")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: TABLE, filter: `id=eq.${ROW_ID}` }, (payload) => {
        setState(normalizeState(payload.new.data));
      })
      .subscribe();

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  const persist = useCallback(async (nextState) => {
    setState(nextState);
    setSaving(true);
    const { error } = await supabase.from(TABLE).update({ data: nextState, updated_at: new Date().toISOString() }).eq("id", ROW_ID);
    if (error) console.error("save failed", error);
    setSaving(false);
  }, []);

  return { state, loaded, saving, persist };
}

export function useWhoAmI() {
  const [me, setMe] = useState(() => localStorage.getItem("armanleads-whoami") || null);
  const choose = (name) => { localStorage.setItem("armanleads-whoami", name); setMe(name); };
  const clear = () => { localStorage.removeItem("armanleads-whoami"); setMe(null); };
  return { me, choose, clear };
}
