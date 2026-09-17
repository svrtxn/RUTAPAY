import { useEffect } from "react";
import { ToastType } from "../../types";
import { CheckCircle, XCircle } from "lucide-react";

export function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed top-5 left-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
      style={{
        transform: "translateX(-50%)",
        background: type === "success" ? "#2D5A3D" : "#C0392B",
        color: "#fff",
        minWidth: 220,
        maxWidth: "90vw",
      }}
    >
      {type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
      <span>{message}</span>
    </div>
  );
}
