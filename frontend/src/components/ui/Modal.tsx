import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "info" | "success" | "error";
  confirmText?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "Entendido"
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={onClose} />
      <div 
        className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" 
        style={{ background: "var(--card)" }}
      >
        <div className="flex flex-col items-center text-center">
          {type === "success" && (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 text-green-600">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
          )}
          {type === "error" && (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>
          )}
          {type === "info" && (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
              <Info size={32} strokeWidth={2.5} />
            </div>
          )}
          
          <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mb-6 font-medium">{message}</p>
          
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-transform hover:scale-[0.98] active:scale-[0.95] shadow-md"
            style={{ 
              background: type === "error" ? "#EF4444" : "var(--primary)" 
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
