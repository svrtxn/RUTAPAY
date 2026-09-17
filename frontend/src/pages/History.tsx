import { useState } from "react";
import { Trip } from "../types";
import { formatCLP, formatMonthLabel, currentYM } from "../utils/format";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { TripRow } from "../components/trips/TripRow";
import { ChevronDown, Check, Download } from "lucide-react";
import { Modal } from "../components/ui/Modal";

export function History({
  trips,
  onTripPress,
}: {
  trips: Trip[];
  onTripPress: (t: Trip) => void;
}) {
  const [selectedMonth, setSelectedMonth] = useState(currentYM());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [modal, setModal] = useState<{isOpen: boolean, title: string, message: string, type: "success" | "error" | "info"}>({
    isOpen: false, title: "", message: "", type: "info"
  });

  const availableMonths = Array.from(new Set([
    currentYM(),
    ...trips.map((t) => t.date.substring(0, 7)),
  ])).sort().reverse();

  function selectMonth(m: string) {
    setShowMonthPicker(false);
    setLoading(true);
    setSelectedMonth(m);
    setTimeout(() => setLoading(false), 400);
  }

  const monthTrips = trips.filter((t) => t.date.startsWith(selectedMonth)).sort((a, b) => b.date.localeCompare(a.date));
  const tripAmount = monthTrips.reduce((s, t) => s + t.amount, 0);

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("rutapay_token");
      if (!token) return;
      
      const [y, m] = selectedMonth.split('-');
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
      <div className="px-5 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Historial</h1>
        <div className="relative">
          <button
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:bg-black/5"
            style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
          >
            {formatMonthLabel(selectedMonth)}
            <ChevronDown size={16} />
          </button>

          {showMonthPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMonthPicker(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg border z-20 py-1"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                {availableMonths.map((m) => (
                  <button
                    key={m}
                    onClick={() => selectMonth(m)}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center justify-between transition-colors hover:bg-black/5"
                    style={{ color: m === selectedMonth ? "var(--primary)" : "var(--foreground)" }}
                  >
                    {formatMonthLabel(m)}
                    {m === selectedMonth && <Check size={16} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            {monthTrips.length} Viajes
          </p>
          <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
            Total: {formatCLP(tripAmount)}
          </p>
        </div>

        <button
          onClick={handleDownloadExcel}
          disabled={downloading || monthTrips.length === 0}
          className={`w-full py-3.5 mb-4 rounded-2xl flex items-center justify-center gap-2.5 font-semibold text-sm transition-colors ${(downloading || monthTrips.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/5'}`}
          style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
        >
          {downloading ? <Spinner /> : <Download size={18} strokeWidth={2} />}
          {downloading ? "Generando Excel..." : `Descargar Planilla ${formatMonthLabel(selectedMonth)}`}
        </button>

        {loading ? (
          <Spinner />
        ) : (
          <div className="rounded-2xl px-4" style={{ background: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {monthTrips.length === 0 ? (
              <EmptyState label={`No hay viajes en ${formatMonthLabel(selectedMonth).toLowerCase()}`} />
            ) : (
              monthTrips.map((t) => (
                <TripRow key={t.id} trip={t} onPress={() => onTripPress(t)} />
              ))
            )}
          </div>
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
