import { useState, useEffect } from "react";
import { currentYM, formatCLP } from "../../utils/format";
import { Download, Users } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";

export function AdminDashboard({ onNavigate, onLogout }: { onNavigate: (s: string) => void, onLogout: () => void }) {
  const [ym, setYm] = useState(currentYM());
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [globalData, setGlobalData] = useState({ total_trips_amount: 0, base_salary: 0, viatics: 0, total_to_pay: 0 });
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" as "info" | "success" | "error" });

  useEffect(() => {
    async function fetchGlobalData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("rutapay_token");
        const [y, m] = ym.split('-');
        const res = await fetch(`/api/report/global?month=${m}&year=${y}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGlobalData(data.resume);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchGlobalData();
  }, [ym]);

  const handleDownloadGlobalExcel = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("rutapay_token");
      const [y, m] = ym.split('-');
      const res = await fetch(`/api/report/excel/admin?month=${m}&year=${y}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RutaPay_General_${m}_${y}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setModal({ isOpen: true, title: "Error", message: "No se pudo generar el reporte general.", type: "error" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-28">
      {/* Header */}
      <div className="px-5 pt-8 pb-3 flex justify-between items-start">
        <div>
          <p className="text-muted-foreground text-sm font-medium">Hola 👋</p>
          <h1 className="text-2xl font-bold mt-0.5">Admin</h1>
        </div>
        
        <button 
          onClick={onLogout} 
          className="text-xs font-semibold text-red-500 hover:underline mt-1"
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3.5">
        {/* Main card */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #2D5A3D 0%, #4A7C59 60%, #5E9970 100%)" }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: "#fff", transform: "translate(30%, -30%)" }}
          />
          <div
            className="absolute bottom-0 left-1/2 w-40 h-40 rounded-full opacity-5"
            style={{ background: "#fff", transform: "translate(-20%, 40%)" }}
          />
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-white/70 mb-1">RutaPay Global</p>
              <p className="text-3xl font-bold text-white leading-tight">
                {loading ? "..." : formatCLP(globalData.total_to_pay)}
              </p>
              <p className="text-xs text-white/80">Total a pagar a todos los choferes</p>
            </div>
            <input
              type="month"
              value={ym}
              onChange={(e) => setYm(e.target.value)}
              className="rounded-xl bg-white/20 text-white px-3 py-2 text-xs outline-none border border-transparent focus:border-white/50"
              style={{ colorScheme: "dark" }}
            />
          </div>
          
          <div className="mt-4 mb-2 pt-3 border-t border-white/20 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Sueldos</p>
              <p className="text-sm font-semibold text-white">{loading ? "..." : formatCLP(globalData.base_salary)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Viáticos (x Día)</p>
              <p className="text-sm font-semibold text-white">{loading ? "..." : formatCLP(globalData.viatics)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Viajes</p>
              <p className="text-sm font-semibold text-white">{loading ? "..." : formatCLP(globalData.total_trips_amount)}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20">
            <button
              onClick={handleDownloadGlobalExcel}
              disabled={downloading}
              className="w-full p-3 rounded-xl flex items-center justify-center gap-2 transition-colors hover:bg-black/20 disabled:opacity-50 font-semibold text-sm"
              style={{ background: "rgba(0,0,0,0.25)" }}
            >
              {downloading ? <Spinner /> : (
                <>
                  <Download size={18} className="text-white" />
                  <span className="text-white">Descargar Excel Consolidado</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Options */}
        <button
          onClick={() => onNavigate("admin-drivers")}
          className="mt-2 flex items-center gap-4 p-5 rounded-3xl bg-card border shadow-sm transition-colors hover:bg-black/5 text-left"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-50 text-green-600">
            <Users size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Directorio de Choferes</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Añadir, eliminar y editar viáticos/sueldos</p>
          </div>
        </button>
      </div>

      <Modal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />
    </div>
  );
}
