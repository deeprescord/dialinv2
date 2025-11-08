import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { DialinPortal } from "@/components/DialinPortal/DialinPortal";
import DefaultHomePage from "./DefaultHomePage";

// Root route component: shows public DefaultHomePage when not signed in,
// and the full app (DialinPortal) when authenticated.
const Root = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (initializing) return null; // prevent flicker to public page during auth init

  return user ? <DialinPortal /> : <DefaultHomePage />;
};

export default Root;
