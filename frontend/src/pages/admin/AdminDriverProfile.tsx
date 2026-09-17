import { useState, useEffect } from "react";
import { AuthUser, Trip } from "../../types";
import { currentYM, formatCLP } from "../../utils/format";
import { ChevronLeft, Download, MapPin } from "lucide-react";
import { Spinner } from "../../components/ui/Spinner";

export function AdminDriverProfile({ driver, onBack }: { driver: AuthUser; onBack: () => void }) {
  const [ym, setYm] = useState(currentYM());
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [resume, setResume] = useState({ total_trips_amount: 0, base_salary: 0, viatics: 0, total_to_pay: 0 });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const token = localStorage.getItem("rutapay_token");
      const [y, m] = ym.split('-');
      try {
        // Fetch Report
        const reportRes = await fetch(`/api/report?month=${m}&year=${y}&driver_id=${driver.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (reportRes.ok) {
          const reportData = await reportRes.json();
          setResume(reportData.resume);
        }

        // Fetch Trips
        const tripsRes = await fetch(`/api/trips?month=${m}&year=${y}&driver_id=${driver.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (tripsRes.ok) {
          setTrips(await tripsRes.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [ym, driver.id]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("rutapay_token");
      const [y, m] = ym.split('-');
      const res = await fetch(`/api/report/excel?month=${m}&year=${y}&driver_id=${driver.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RutaPay_${driver.name.replace(/\s+/g, '_')}_${m}_${y}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error al descargar el archivo");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-28 px-5 pt-8 relative">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-black/5 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{driver.name}</h1>
          <p className="text-xs text-muted-foreground">{driver.phone} {driver.email ? `- ${driver.email}` : ''}</p>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="month"
          value={ym}
          onChange={(e) => setYm(e.target.value)}
          className="w-full rounded-2xl bg-secondary px-4 py-3 outline-none border border-transparent focus:border-primary font-semibold"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card border rounded-2xl p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs text-muted-foreground mb-1">Total Viajes</p>
              <p className="text-xl font-bold">{formatCLP(resume.total_trips_amount)}</p>
            </div>
            <div className="bg-card border rounded-2xl p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs text-muted-foreground mb-1">Sueldo Base</p>
              <p className="text-xl font-bold">{formatCLP(resume.base_salary)}</p>
            </div>
            <div className="bg-card border rounded-2xl p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs text-muted-foreground mb-1">Viáticos</p>
              <p className="text-xl font-bold">{formatCLP(resume.viatics)}</p>
            </div>
            <div className="rounded-2xl p-4 shadow-sm text-white" style={{ background: "linear-gradient(135deg, #2D5A3D 0%, #4A7C59 100%)" }}>
              <p className="text-xs text-white/80 mb-1">Total a Pagar</p>
              <p className="text-xl font-bold">{formatCLP(resume.total_to_pay)}</p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3.5 mb-8 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {downloading ? <Spinner /> : <><Download size={18} /> Descargar Excel del Chofer</>}
          </button>

          <h2 className="text-lg font-bold mb-4">Historial de Viajes ({trips.length})</h2>
          <div className="flex flex-col gap-3">
            {trips.map((t) => {
              const d = new Date(t.date + "T00:00:00");
              const day = String(d.getDate()).padStart(2, "0");
              const month = String(d.getMonth() + 1).padStart(2, "0");
              return (
                <div key={t.id} className="p-4 rounded-2xl bg-card border shadow-sm flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm truncate">{t.origin || "Sin Origen"} → {t.destination}</p>
                      <p className="text-xs text-muted-foreground">{day}/{month}</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary shrink-0 ml-2">{formatCLP(t.amount)}</p>
                </div>
              );
            })}
            {trips.length === 0 && <p className="text-center text-muted-foreground py-10">No hay viajes registrados en este mes.</p>}
          </div>
        </>
      )}
    </div>
  );
}
