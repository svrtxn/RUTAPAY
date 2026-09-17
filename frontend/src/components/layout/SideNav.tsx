import { Screen } from "../../types";
import { LayoutDashboard, PlusCircle, History, LogOut, Settings as SettingsIcon, Users } from "lucide-react";
import logoUrl from "../../../public/logo.jpg";

export function SideNav({
  active,
  onNavigate,
  onLogout,
  isAdmin = false,
}: {
  active: Screen;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}) {
  return (
    <nav className="hidden md:flex flex-col w-64 h-full border-r bg-card p-6" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-3 mb-10 pl-2">
        <img src={logoUrl} alt="RutaPay Logo" className="w-40 h-auto object-contain mix-blend-multiply" />
      </div>

      <div className="flex flex-col gap-2 flex-1">
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: active === "dashboard" ? "var(--secondary)" : "transparent",
            color: active === "dashboard" ? "var(--primary)" : "var(--muted-foreground)",
          }}
        >
          <LayoutDashboard size={20} strokeWidth={active === "dashboard" ? 2.5 : 2} />
          {isAdmin ? "Panel Admin" : "Resumen"}
        </button>
        
        {isAdmin ? (
          <button
            onClick={() => onNavigate("admin-drivers")}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: active === "admin-drivers" ? "var(--secondary)" : "transparent",
              color: active === "admin-drivers" ? "var(--primary)" : "var(--muted-foreground)",
            }}
          >
            <Users size={20} strokeWidth={active === "admin-drivers" ? 2.5 : 2} />
            Choferes
          </button>
        ) : (
          <>
            <button
              onClick={() => onNavigate("new-trip")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: active === "new-trip" ? "var(--secondary)" : "transparent",
                color: active === "new-trip" ? "var(--primary)" : "var(--muted-foreground)",
              }}
            >
              <PlusCircle size={20} strokeWidth={active === "new-trip" ? 2.5 : 2} />
              Nuevo viaje
            </button>
            <button
              onClick={() => onNavigate("history")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: active === "history" ? "var(--secondary)" : "transparent",
                color: active === "history" ? "var(--primary)" : "var(--muted-foreground)",
              }}
            >
              <History size={20} strokeWidth={active === "history" ? 2.5 : 2} />
              Historial
            </button>
            <button
              onClick={() => onNavigate("settings")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: active === "settings" ? "var(--secondary)" : "transparent",
                color: active === "settings" ? "var(--primary)" : "var(--muted-foreground)",
              }}
            >
              <SettingsIcon size={20} strokeWidth={active === "settings" ? 2.5 : 2} />
              Configuración
            </button>
          </>
        )}
      </div>

      <button
        onClick={onLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mt-auto"
        style={{ color: "var(--muted-foreground)" }}
      >
        <LogOut size={20} />
        Cerrar sesión
      </button>
    </nav>
  );
}
