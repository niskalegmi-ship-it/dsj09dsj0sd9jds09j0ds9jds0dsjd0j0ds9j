import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateSessionPath, isValidSessionPath } from "@/utils/sessionPath";
import { RefreshCw } from "lucide-react";

const SessionRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user already has a session path stored
    const existingPath = localStorage.getItem("swift_session_path");
    
    if (existingPath && isValidSessionPath(existingPath)) {
      // Redirect to existing session
      navigate(`/${existingPath}`, { replace: true });
    } else {
      // Clear any invalid stored path (e.g., admin routes accidentally stored)
      localStorage.removeItem("swift_session_path");
      localStorage.removeItem("swift_session_id");

      // Generate new random path and redirect
      const newPath = generateSessionPath();
      localStorage.setItem("swift_session_path", newPath);
      navigate(`/${newPath}`, { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default SessionRedirect;
