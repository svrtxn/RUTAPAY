import { Screen } from "../../types";
import { LayoutDashboard, PlusCircle, History } from "lucide-react";

export function BottomNav({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around items-end px-2 pb-5 pt-2 z-20"
      style={{ borderColor: "var(--border)", paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
    >
      <button
        onClick={() => onNavigate("dashboard")}
        className="flex flex-col items-center gap-1 p-2 flex-1"
        style={{ color: active === "dashboard" ? "var(--primary)" : "var(--muted-foreground)" }}
      >
        <LayoutDashboard size={22} strokeWidth={active === "dashboard" ? 2.5 : 1.8} />
        <span className="text-[10px] font-semibold">Resumen</span>
      </button>

      {/* Floating Action Button */}
      <div className="relative flex-1 flex flex-col items-center justify-start -mt-8">
        <button
          onClick={() => onNavigate("new-trip")}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 mb-1.5"
          style={{ 
            background: "var(--primary)",
            boxShadow: "0 4px 14px 0 rgba(74, 124, 89, 0.39)"
          }}
        >
          <PlusCircle size={28} strokeWidth={2.5} />
        </button>
        <span className="text-[10px] font-semibold text-center w-full" style={{ color: active === "new-trip" ? "var(--primary)" : "var(--muted-foreground)" }}>Nuevo viaje</span>
      </div>

      <button
        onClick={() => onNavigate("history")}
        className="flex flex-col items-center gap-1 p-2 flex-1"
        style={{ color: active === "history" ? "var(--primary)" : "var(--muted-foreground)" }}
      >
        <History size={22} strokeWidth={active === "history" ? 2.5 : 1.8} />
        <span className="text-[10px] font-semibold">Historial</span>
      </button>
    </nav>
  );
}
