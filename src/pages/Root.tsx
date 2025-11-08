import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { DialinPortal } from "@/components/DialinPortal/DialinPortal";
import DefaultHomePage from "./DefaultHomePage";

// Root route component: shows public DefaultHomePage when not signed in,
// and the full app (DialinPortal) when authenticated.
const Root = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initial fetch
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return user ? <DialinPortal /> : <DefaultHomePage />;
};

export default Root;
