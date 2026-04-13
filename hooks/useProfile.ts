import { useState, useEffect } from "react";
import { getProfile, Profile } from "@/lib/supabase/profile";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, []);

  return { profile, loading };
}