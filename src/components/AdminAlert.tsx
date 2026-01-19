import { AlertTriangle, XCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminAlertProps {
  message: string;
  type: string | null;
  onDismiss: () => void;
}

const AdminAlert = ({ message, type, onDismiss }: AdminAlertProps) => {
  const getAlertStyles = () => {
    switch (type) {
      case "error":
        return {
          bg: "bg-red-50 border-red-200",
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          text: "text-red-800"
        };
      case "warning":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
          text: "text-yellow-800"
        };
      case "info":
      default:
        return {
          bg: "bg-blue-50 border-blue-200",
          icon: <Info className="w-5 h-5 text-blue-500" />,
          text: "text-blue-800"
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className={`${styles.bg} border rounded-lg p-4 mb-4 animate-fade-in`}>
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="flex-1">
          <p className={`${styles.text} font-medium`}>{message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-auto p-1 hover:bg-transparent"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AdminAlert;
