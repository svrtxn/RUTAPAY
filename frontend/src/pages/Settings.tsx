import { useState, useEffect } from "react";
import { formatMonthLabel, currentYM, formatNumberInput } from "../utils/format";
import { Spinner } from "../components/ui/Spinner";
import { Settings as SettingsIcon, LogOut, Save, ChevronDown, Check, User, Lock, Key, Eye, EyeOff } from "lucide-react";
import { Modal } from "../components/ui/Modal";

export function Settings({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const user = JSON.parse(localStorage.getItem("rutapay_user") || "{}");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Modal state
  const [modal, setModal] = useState<{isOpen: boolean, title: string, message: string, type: "success" | "error" | "info"}>({
    isOpen: false, title: "", message: "", type: "info"
  });
  
  // Modal state
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      setModal({ isOpen: true, title: "Campos requeridos", message: "Ambos campos son requeridos.", type: "error" });
      return;
    }

    try {
      setPwdLoading(true);
      const token = localStorage.getItem("rutapay_token");
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setModal({ isOpen: true, title: "¡Contraseña actualizada!", message: "Tu contraseña ha sido cambiada exitosamente.", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setModal({ isOpen: true, title: "Error", message: data.error || "Error al actualizar contraseña.", type: "error" });
      }
    } catch (err) {
      setModal({ isOpen: true, title: "Sin conexión", message: "Error de conexión al intentar actualizar.", type: "error" });
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettingsIcon size={24} className="text-primary" />
          <h1 className="text-2xl font-bold">Configuración</h1>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-6">
        {/* Cuenta y Credenciales */}
        <div className="bg-card rounded-3xl p-6 shadow-sm border" style={{ borderColor: "var(--border)" }}>
          <div className="mb-6 flex items-center gap-2">
            <User size={20} className="text-primary" />
            <h2 className="text-lg font-bold">Mi Cuenta</h2>
          </div>

          <div className="flex flex-col gap-3 mb-6 bg-black/5 p-4 rounded-2xl">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nombre</p>
              <p className="text-sm font-semibold">{user.name || "Usuario"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Correo Electrónico</p>
              <p className="text-sm font-semibold">{user.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rol</p>
              <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>{user.role}</p>
            </div>
          </div>

          {/* Formulario Cambiar Contraseña */}
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Key size={16} className="text-muted-foreground" />
              Cambiar Contraseña
            </h3>
            
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Lock size={16} strokeWidth={2.5} />
              </div>
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Contraseña actual"
                className="w-full pl-10 pr-12 py-3.5 rounded-2xl text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-primary/50 bg-black/5"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Lock size={16} strokeWidth={2.5} />
              </div>
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña"
                className="w-full pl-10 pr-12 py-3.5 rounded-2xl text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-primary/50 bg-black/5"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-black/5 transition-colors hover:bg-black/10"
              style={{ color: "var(--foreground)" }}
            >
              {pwdLoading ? "Actualizando..." : "Actualizar Contraseña"}
            </button>
          </form>
        </div>

        {/* Botón Cerrar Sesión */}
        <div className="mt-2 mb-6">
          <button
            onClick={onLogout}
            type="button"
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-red-600 bg-red-50 border border-red-100 transition-colors hover:bg-red-100"
          >
            <LogOut size={18} strokeWidth={2.5} />
            Cerrar Sesión
          </button>
        </div>
      </div>

      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
      />
    </div>
  );
}
