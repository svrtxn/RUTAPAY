import { useState } from "react";
import { Trip } from "../../types";
import { formatCLP, formatDate } from "../../utils/format";
import { Edit2, Trash2, X, AlertTriangle } from "lucide-react";

export function BottomSheet({
  trip,
  onEdit,
  onDelete,
  onClose,
}: {
  trip: Trip;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [confirmAction, setConfirmAction] = useState<"edit" | "delete" | null>(null);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl p-6 shadow-2xl transition-transform"
        style={{ background: "var(--background)" }}
      >
        {confirmAction ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: confirmAction === 'delete' ? '#FEE2E2' : 'var(--secondary)', color: confirmAction === 'delete' ? '#DC2626' : 'var(--primary)' }}>
              {confirmAction === 'delete' ? <Trash2 size={24} /> : <Edit2 size={24} />}
            </div>
            <h3 className="text-xl font-bold mb-2">
              ¿Seguro que deseas {confirmAction === 'edit' ? 'editar' : 'eliminar'} este viaje?
            </h3>
            <p className="text-sm text-muted-foreground mb-6 px-4">
              {confirmAction === 'edit' 
                ? 'Se abrirá el formulario con los datos cargados para que puedas modificarlos.' 
                : 'Esta acción no se puede deshacer y borrará el viaje de tus registros.'}
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-3.5 rounded-2xl font-bold transition-colors hover:bg-black/5"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (confirmAction === 'edit') onEdit();
                  else onDelete();
                }}
                className="flex-1 py-3.5 rounded-2xl font-bold text-white transition-opacity hover:opacity-90 shadow-md"
                style={{ background: confirmAction === 'edit' ? "var(--primary)" : "#DC2626" }}
              >
                Sí, {confirmAction === 'edit' ? 'Editar' : 'Eliminar'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  {formatDate(trip.date)}
                </p>
                <h3 className="text-xl font-bold leading-tight">
                  {trip.origin} <span className="text-muted-foreground font-normal">a</span> {trip.destination}
                </h3>
                <p className="text-xl font-bold mt-1" style={{ color: "var(--primary)" }}>
                  {formatCLP(trip.amount)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-black/10"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction('edit')}
                className="flex-1 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors hover:opacity-90"
                style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
              >
                <Edit2 size={20} strokeWidth={2} />
                <span className="text-xs font-bold">Editar</span>
              </button>
              <button
                onClick={() => setConfirmAction('delete')}
                className="flex-1 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors hover:bg-red-100"
                style={{ background: "#FEE2E2", color: "#B91C1C" }}
              >
                <Trash2 size={20} strokeWidth={2} />
                <span className="text-xs font-bold">Eliminar</span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
