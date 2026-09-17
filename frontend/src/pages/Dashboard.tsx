import { useState, useEffect } from "react";
import { Trip, Screen } from "../types";
import { formatCLP, formatMonthLabel, currentYM } from "../utils/format";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { TripRow } from "../components/trips/TripRow";
import { Download, Plane, Banknote, Settings } from "lucide-react";
import { Modal } from "../components/ui/Modal";

export function Dashboard({
  trips = [],
  onTripPress,
  onNavigate,
  onLogout,
}: {
  trips: Trip[];
  onTripPress: (t: Trip) => void;
  onNavigate: (s: Screen) => void;
  onLogout?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [reportData, setReportData] = useState({ totalToPay: 0, baseSalary: 0, viaticos: 0, tripsSum: 0 });
  const [modal, setModal] = useState<{isOpen: boolean, title: string, message: string, type: "success" | "error" | "info"}>({
    isOpen: false, title: "", message: "", type: "info"
  });

  const [ym, setYm] = useState(currentYM());

  useEffect(() => {
    async function fetchReport() {
      try {
        const token = localStorage.getItem("rutapay_token");
        if (!token) return;
        
        const [y, m] = ym.split('-');
        const res = await fetch(`/api/report?month=${m}&year=${y}`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setReportData({
            totalToPay: data.resume.total_to_pay,
            baseSalary: data.resume.base_salary,
            viaticos: data.resume.viatics,
            tripsSum: data.resume.total_trips_amount
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [ym, trips]);

  const safeTrips = trips || [];
  const monthTrips = safeTrips.filter((t) => t.date && t.date.startsWith(ym));
  const recentTrips = [...safeTrips].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);

  const localTripsSum = monthTrips.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const localTotalToPay = localTripsSum + Number(reportData.baseSalary) + Number(reportData.viaticos);

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("rutapay_token");
      if (!token) return;
      
      const [y, m] = ym.split('-');
      const res = await fetch(`/api/report/excel?month=${m}&year=${y}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Error al descargar Excel");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RutaPay_${m}_${y}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setModal({ isOpen: true, title: "Error", message: "Hubo un problema al descargar la planilla.", type: "error" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-28">
      {/* Header */}
      <div className="px-5 pt-8 pb-3 flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-sm font-medium">Hola 👋</p>
            <input 
              type="month" 
              value={ym}
              onChange={e => {
                if(e.target.value) setYm(e.target.value);
              }}
              className="text-xs bg-secondary px-2 py-1 rounded-md outline-none border-none font-semibold cursor-pointer"
            />
          </div>
          <h1 className="text-2xl font-bold mt-0.5">{formatMonthLabel(ym)}</h1>
        </div>
        
        {onNavigate && (
          <button 
            onClick={() => onNavigate("settings")} 
            className="md:hidden p-2 mt-1 rounded-xl bg-card border shadow-sm transition-colors hover:bg-black/5"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            aria-label="Ajustes"
          >
            <Settings size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div className="px-5 flex flex-col gap-3.5">
        {loading ? (
          <Spinner />
        ) : (
          <>
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
              <p className="text-xs font-semibold tracking-widest uppercase text-white/70 mb-1">Total a pagar</p>
              <p className="text-3xl font-bold text-white leading-none mb-2">{formatCLP(localTotalToPay)}</p>
              <p className="text-xs text-white/60">Viajes + Sueldo proporcional + Viáticos</p>
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60">Sueldo</p>
                  <p className="text-sm font-semibold text-white">{formatCLP(reportData.baseSalary)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Viáticos</p>
                  <p className="text-sm font-semibold text-white">{formatCLP(reportData.viaticos)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Viajes</p>
                  <p className="text-sm font-semibold text-white">{formatCLP(localTripsSum)}</p>
                </div>
              </div>
            </div>

            {/* Secondary cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl p-3.5" style={{ background: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "var(--secondary)" }}
                >
                  <Plane size={18} strokeWidth={2} style={{ color: "var(--primary)" }} />
                </div>
                <p className="text-2xl font-bold">{monthTrips.length}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Viajes del mes</p>
              </div>
              <div className="rounded-2xl p-3.5" style={{ background: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "var(--secondary)" }}
                >
                  <Banknote size={18} strokeWidth={2} style={{ color: "var(--primary)" }} />
                </div>
                <p className="text-xl font-bold leading-tight">{formatCLP(localTripsSum)}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Monto en viajes</p>
              </div>
            </div>

            {/* Download button */}
            <button
              onClick={handleDownloadExcel}
              disabled={downloading}
              className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 font-semibold text-sm transition-colors ${downloading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-black/5'}`}
              style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
            >
              {downloading ? <Spinner /> : <Download size={18} strokeWidth={2} />}
              {downloading ? "Generando Excel..." : "Descargar Planilla Mensual"}
            </button>

            {/* Recent trips */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-base">Últimos viajes</h2>
                <button
                  onClick={() => onNavigate("history")}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  Ver todos
                </button>
              </div>
              <div
                className="rounded-2xl px-4"
                style={{ background: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                {recentTrips.length === 0 ? (
                  <EmptyState label="Sin viajes registrados aún" />
                ) : (
                  recentTrips.map((t) => (
                    <TripRow key={t.id} trip={t} onPress={() => onTripPress(t)} />
                  ))
                )}
              </div>
            </div>
          </>
        )}
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
