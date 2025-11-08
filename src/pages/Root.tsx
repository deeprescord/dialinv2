import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { DialinPortal } from "@/components/DialinPortal/DialinPortal";
import DefaultHomePage from "./DefaultHomePage";
import { Skeleton } from "@/components/ui/skeleton";

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

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-64 w-full" />
          <div className="flex gap-2 justify-center">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    );
  }

  return user ? <DialinPortal /> : <DefaultHomePage />;
};

export default Root;
