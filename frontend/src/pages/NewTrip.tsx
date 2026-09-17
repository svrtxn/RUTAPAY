import { useState } from "react";
import { Trip } from "../types";
import { formatCLP, today, formatNumberInput } from "../utils/format";
import { ChevronLeft, Plus, Save } from "lucide-react";

const DEFAULT_FREQUENT_PLACES = ["CGA", "Hospital", "Casa"];

export function NewTrip({
  onSave,
  editTrip,
  onCancel,
}: {
  onSave: (trip: Omit<Trip, "id">) => void;
  editTrip?: Trip | null;
  onCancel?: () => void;
}) {
  const [date, setDate] = useState(editTrip?.date ?? today());
  const [origin, setOrigin] = useState(editTrip?.origin ?? "");
  const [destination, setDestination] = useState(editTrip?.destination ?? "");
  const [amount, setAmount] = useState(editTrip ? formatNumberInput(String(editTrip.amount)) : "");
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");

  const rawAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;
  const canSave = origin.trim() !== "" && rawAmount > 0;

  const [frequentPlaces, setFrequentPlaces] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("rutapay_places");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_FREQUENT_PLACES;
  });

  function handleAmountChange(val: string) {
    setAmount(formatNumberInput(val));
  }

  function handleAddPlace() {
    if (newPlaceName.trim()) {
      const val = newPlaceName.trim();
      if (!frequentPlaces.includes(val)) {
        const updated = [...frequentPlaces, val];
        setFrequentPlaces(updated);
        localStorage.setItem("rutapay_places", JSON.stringify(updated));
      }
    }
    setShowAddModal(false);
    setNewPlaceName("");
  }

  function renderChips(forField: "origin" | "destination") {
    return (
      <div className="flex gap-2 mt-2.5 flex-wrap">
        {frequentPlaces.map((p) => {
          const isSelected = forField === "origin" ? origin === p : destination === p;
          return (
            <button
              key={p}
              onClick={() => forField === "origin" ? setOrigin(p) : setDestination(p)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors hover:brightness-95"
              style={{
                background: isSelected ? "var(--primary)" : "var(--secondary)",
                color: isSelected ? "#fff" : "var(--secondary-foreground)",
              }}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors hover:brightness-95"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>
    );
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onSave({ date, origin: origin.trim(), destination: destination.trim(), amount: rawAmount });
    setSaving(false);
  }

  const displayAmount = rawAmount > 0 ? formatCLP(rawAmount) : "";

  return (
    <div className="flex flex-col min-h-full pb-28">
      <div className="px-5 pt-12 pb-6 flex items-center gap-3">
        {onCancel && (
          <button onClick={onCancel} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5" style={{ background: "var(--muted)" }}>
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold">{editTrip ? "Editar viaje" : "Nuevo viaje"}</h1>
          {!editTrip && <p className="text-sm text-muted-foreground mt-0.5">Completá los datos del recorrido</p>}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-5">
        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 tracking-wide uppercase">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium border transition-colors focus:outline-none focus:ring-2"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Origin */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 tracking-wide uppercase">
            Lugar de origen <span style={{ color: "#B91C1C" }}>*</span>
          </label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Escribí el origen…"
            className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium border transition-colors focus:outline-none focus:ring-2"
            style={{
              background: "var(--card)",
              borderColor: origin ? "var(--primary)" : "var(--border)",
              color: "var(--foreground)",
            }}
          />
          {renderChips("origin")}
        </div>

        {/* Destination */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 tracking-wide uppercase">Destino</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Opcional"
            className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium border transition-colors focus:outline-none focus:ring-2"
            style={{
              background: "var(--card)",
              borderColor: destination ? "var(--primary)" : "var(--border)",
              color: "var(--foreground)",
            }}
          />
          {renderChips("destination")}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 tracking-wide uppercase">
            Valor <span style={{ color: "#B91C1C" }}>*</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="$0"
            className="w-full px-4 py-3.5 rounded-2xl font-mono text-xl font-semibold border transition-colors focus:outline-none focus:ring-2"
            style={{
              background: "var(--card)",
              borderColor: rawAmount > 0 ? "var(--primary)" : "var(--border)",
              color: rawAmount > 0 ? "var(--primary)" : "var(--foreground)",
            }}
          />
          {displayAmount && (
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">{displayAmount}</p>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 mt-2 transition-transform hover:scale-[0.98] active:scale-[0.95]"
          style={{
            background: canSave && !saving ? "var(--primary)" : "var(--muted)",
            color: canSave && !saving ? "#fff" : "var(--muted-foreground)",
          }}
        >
          {saving ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              <Save size={20} strokeWidth={2.5} />
              Guardar viaje
            </>
          )}
        </button>
      </div>

      {/* Modal para agregar lugar */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-transform scale-100" style={{ background: "var(--background)" }}>
            <h3 className="text-xl font-bold mb-1">Nuevo lugar frecuente</h3>
            <p className="text-sm text-muted-foreground mb-4">Ingresá el nombre del lugar para tenerlo siempre a mano.</p>
            <input
              type="text"
              autoFocus
              value={newPlaceName}
              onChange={(e) => setNewPlaceName(e.target.value)}
              placeholder="Ej. Aeropuerto"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium border mb-5 focus:outline-none focus:ring-2"
              style={{
                background: "var(--card)",
                borderColor: newPlaceName ? "var(--primary)" : "var(--border)",
                color: "var(--foreground)",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAddPlace()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddModal(false); setNewPlaceName(""); }}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-colors hover:brightness-95 active:scale-[0.98]"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPlace}
                disabled={!newPlaceName.trim()}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-transform hover:scale-[0.98] active:scale-[0.95]"
                style={{
                  background: newPlaceName.trim() ? "var(--primary)" : "var(--muted)",
                  color: newPlaceName.trim() ? "#fff" : "var(--muted-foreground)",
                }}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
