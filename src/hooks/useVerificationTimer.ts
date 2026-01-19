import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_TIMEOUT_SECONDS = 180; // 3 minutes default

export const useVerificationTimer = () => {
  const [timeoutSeconds, setTimeoutSeconds] = useState(DEFAULT_TIMEOUT_SECONDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimerSetting = async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "verification_timeout")
        .maybeSingle();

      if (!error && data?.setting_value) {
        const parsed = parseInt(data.setting_value, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setTimeoutSeconds(parsed);
        }
      }
      setLoading(false);
    };

    fetchTimerSetting();

    // Subscribe to changes
    const channel = supabase
      .channel("timer_settings")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "admin_settings",
          filter: "setting_key=eq.verification_timeout"
        },
        (payload) => {
          const newValue = parseInt(payload.new.setting_value, 10);
          if (!isNaN(newValue) && newValue > 0) {
            setTimeoutSeconds(newValue);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { timeoutSeconds, loading };
};
