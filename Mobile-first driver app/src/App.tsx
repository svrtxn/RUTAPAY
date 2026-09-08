import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Trip {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  origin: string;
  destination: string;
  amount: number;
}

interface MonthConfig {
  month: string; // "2026-09"
  baseSalary: number;
  viaticos: number;
}

type Screen = "dashboard" | "new-trip" | "history";
type ToastType = "success" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_CONFIGS: MonthConfig[] = [
  { month: "2026-09", baseSalary: 180000, viaticos: 62000 },
  { month: "2026-08", baseSalary: 175000, viaticos: 58000 },
  { month: "2026-07", baseSalary: 170000, viaticos: 55000 },
];

const FREQUENT_PLACES = ["CGA", "Hospital", "Casa"];

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const SEED_TRIPS: Trip[] = [
  { id: "1", date: "2026-09-07", origin: "CGA", destination: "Hospital", amount: 15000 },
  { id: "2", date: "2026-09-06", origin: "Casa", destination: "CGA", amount: 18000 },
  { id: "3", date: "2026-09-05", origin: "Hospital", destination: "Casa", amount: 12000 },
  { id: "4", date: "2026-09-04", origin: "CGA", destination: "Hospital", amount: 15000 },
  { id: "5", date: "2026-09-03", origin: "CGA", destination: "Casa", amount: 20000 },
  { id: "6", date: "2026-09-02", origin: "Hospital", destination: "CGA", amount: 14000 },
  { id: "7", date: "2026-09-01", origin: "Casa", destination: "Hospital", amount: 16000 },
  { id: "8", date: "2026-08-30", origin: "CGA", destination: "Casa", amount: 19000 },
  { id: "9", date: "2026-08-28", origin: "Hospital", destination: "CGA", amount: 13000 },
  { id: "10", date: "2026-08-25", origin: "Casa", destination: "Hospital", amount: 17000 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCLP(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MONTHS_ES[parseInt(m) - 1]} ${y}`;
}

function currentYM(): string {
  const now = new Date("2026-09-07");
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function today(): string {
  return "2026-09-07";
}

function getConfig(month: string): MonthConfig {
  return MONTH_CONFIGS.find((c) => c.month === month) ?? { month, baseSalary: 0, viaticos: 0 };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
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
      <span>{type === "success" ? "✓" : "✕"}</span>
      <span>{message}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin"
        style={{ borderTopColor: "var(--primary)" }}
      />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18" />
        <path d="M8 14h4M8 17h8" />
      </svg>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

function BottomSheet({
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
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl p-6 shadow-2xl"
        style={{ background: "var(--card)", maxWidth: 480, margin: "0 auto" }}
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />
        <div className="mb-5">
          <p className="text-xs font-medium text-muted-foreground mb-1">Viaje del {formatDate(trip.date)}</p>
          <p className="text-lg font-semibold">
            {trip.origin} → {trip.destination || "—"}
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: "var(--primary)" }}>
            {formatCLP(trip.amount)}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onEdit}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-sm"
            style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
          >
            Editar viaje
          </button>
          <button
            onClick={onDelete}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-sm"
            style={{ background: "#FEE2E2", color: "#B91C1C" }}
          >
            Eliminar
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-3 py-3.5 rounded-2xl font-medium text-sm text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </>
  );
}

function DeleteConfirmSheet({
  trip,
  onConfirm,
  onClose,
}: {
  trip: Trip;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl p-6 shadow-2xl"
        style={{ background: "var(--card)", maxWidth: 480, margin: "0 auto" }}
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#FEE2E2" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </div>
          <p className="font-semibold text-lg">¿Eliminar este viaje?</p>
          <p className="text-muted-foreground text-sm mt-1">
            {formatDate(trip.date)} · {trip.origin} → {trip.destination || "—"} · {formatCLP(trip.amount)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Esta acción no se puede deshacer.</p>
        </div>
        <button
          onClick={onConfirm}
          className="w-full py-4 rounded-2xl font-semibold text-sm mb-3"
          style={{ background: "#B91C1C", color: "#fff" }}
        >
          Sí, eliminar
        </button>
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl font-medium text-sm text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </>
  );
}

// ─── Trip Row ─────────────────────────────────────────────────────────────────
function TripRow({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center justify-between py-3.5 px-1 border-b border-border last:border-0 text-left active:bg-muted/50 rounded-lg hover:bg-muted/30"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--secondary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l3 3" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">
            {trip.origin} → {trip.destination || "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(trip.date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-sm font-semibold">{formatCLP(trip.amount)}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
function BottomNav({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around px-4 pb-safe"
      style={{
        background: "var(--card)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        paddingTop: 12,
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Inicio */}
      <button
        onClick={() => onNavigate("dashboard")}
        className="flex flex-col items-center gap-1 px-4"
        style={{ color: active === "dashboard" ? "var(--primary)" : "var(--muted-foreground)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active === "dashboard" ? "2.5" : "1.8"}>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="text-[10px] font-semibold">Inicio</span>
      </button>

      {/* Nuevo viaje — CTA central */}
      <button
        onClick={() => onNavigate("new-trip")}
        className="flex flex-col items-center -mt-6"
        style={{ filter: "drop-shadow(0 4px 12px rgba(74,124,89,0.4))" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--primary)" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <span className="text-[10px] font-semibold mt-1" style={{ color: "var(--primary)" }}>Nuevo viaje</span>
      </button>

      {/* Historial */}
      <button
        onClick={() => onNavigate("history")}
        className="flex flex-col items-center gap-1 px-4"
        style={{ color: active === "history" ? "var(--primary)" : "var(--muted-foreground)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active === "history" ? "2.5" : "1.8"}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <span className="text-[10px] font-semibold">Historial</span>
      </button>
    </nav>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({
  trips,
  onTripPress,
  onNavigate,
}: {
  trips: Trip[];
  onTripPress: (t: Trip) => void;
  onNavigate: (s: Screen) => void;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const ym = currentYM();
  const monthTrips = trips.filter((t) => t.date.startsWith(ym));
  const config = getConfig(ym);
  const tripAmount = monthTrips.reduce((s, t) => s + t.amount, 0);
  const total = tripAmount + config.baseSalary + config.viaticos;
  const recentTrips = [...trips].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="flex flex-col min-h-full pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <p className="text-muted-foreground text-sm font-medium">Hola 👋</p>
        <h1 className="text-2xl font-bold mt-0.5">{formatMonthLabel(ym)}</h1>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {loading ? (
          <Spinner />
        ) : (
          <>
            {/* Main card */}
            <div
              className="rounded-3xl p-6 relative overflow-hidden"
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
              <p className="text-4xl font-bold text-white leading-none mb-2">{formatCLP(total)}</p>
              <p className="text-xs text-white/60">Viajes + Sueldo proporcional + Viáticos</p>
              <div className="mt-5 pt-4 border-t border-white/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60">Sueldo</p>
                  <p className="text-sm font-semibold text-white">{formatCLP(config.baseSalary)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Viáticos</p>
                  <p className="text-sm font-semibold text-white">{formatCLP(config.viaticos)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Viajes</p>
                  <p className="text-sm font-semibold text-white">{formatCLP(tripAmount)}</p>
                </div>
              </div>
            </div>

            {/* Secondary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4" style={{ background: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "var(--secondary)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <p className="text-2xl font-bold">{monthTrips.length}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Viajes del mes</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "var(--secondary)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                <p className="text-xl font-bold leading-tight">{formatCLP(tripAmount)}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Monto en viajes</p>
              </div>
            </div>

            {/* Download button */}
            <button
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 font-semibold text-sm"
              style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar Planilla Mensual
            </button>

            {/* Recent trips */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-base">Últimos viajes</h2>
                <button
                  onClick={() => onNavigate("history")}
                  className="text-xs font-semibold"
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
    </div>
  );
}

// ─── NEW TRIP ─────────────────────────────────────────────────────────────────
function NewTrip({
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
  const [amount, setAmount] = useState(editTrip ? String(editTrip.amount) : "");
  const [saving, setSaving] = useState(false);

  const rawAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;
  const canSave = origin.trim() !== "" && rawAmount > 0;

  function handleAmountChange(val: string) {
    const digits = val.replace(/\D/g, "");
    setAmount(digits);
  }

  function handleChip(place: string) {
    if (origin === "") {
      setOrigin(place);
    } else {
      setDestination(place);
    }
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
          <button onClick={onCancel} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--muted)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
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
            className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium border"
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
            className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium border"
            style={{
              background: "var(--card)",
              borderColor: origin ? "var(--primary)" : "var(--border)",
              color: "var(--foreground)",
            }}
          />
          {/* Chips */}
          <div className="flex gap-2 mt-2.5 flex-wrap">
            {FREQUENT_PLACES.map((p) => (
              <button
                key={p}
                onClick={() => handleChip(p)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold"
                style={{
                  background: origin === p || destination === p ? "var(--primary)" : "var(--secondary)",
                  color: origin === p || destination === p ? "#fff" : "var(--secondary-foreground)",
                }}
              >
                {p}
              </button>
            ))}
            <button
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
            >
              +
            </button>
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 tracking-wide uppercase">Destino</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Opcional"
            className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium border"
            style={{
              background: "var(--card)",
              borderColor: destination ? "var(--primary)" : "var(--border)",
              color: "var(--foreground)",
            }}
          />
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
            className="w-full px-4 py-3.5 rounded-2xl font-mono text-xl font-semibold border"
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
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 mt-2"
          style={{
            background: canSave && !saving ? "var(--primary)" : "var(--muted)",
            color: canSave && !saving ? "#fff" : "var(--muted-foreground)",
            cursor: canSave && !saving ? "pointer" : "not-allowed",
          }}
        >
          {saving ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Guardar viaje
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────
function History({
  trips,
  onTripPress,
}: {
  trips: Trip[];
  onTripPress: (t: Trip) => void;
}) {
  const [selectedMonth, setSelectedMonth] = useState(currentYM());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [loading, setLoading] = useState(false);

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
  const config = getConfig(selectedMonth);
  const tripAmount = monthTrips.reduce((s, t) => s + t.amount, 0);
  const total = tripAmount + config.baseSalary + config.viaticos;

  return (
    <div className="flex flex-col min-h-full pb-28">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Historial</h1>
        {/* Month selector */}
        <div className="relative">
          <button
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
          >
            {formatMonthLabel(selectedMonth)}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showMonthPicker && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMonthPicker(false)} />
              <div
                className="absolute right-0 top-full mt-2 z-30 rounded-2xl shadow-xl overflow-hidden"
                style={{ background: "var(--card)", border: "1px solid var(--border)", minWidth: 180 }}
              >
                {availableMonths.map((m) => (
                  <button
                    key={m}
                    onClick={() => selectMonth(m)}
                    className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-muted/50"
                    style={{
                      color: m === selectedMonth ? "var(--primary)" : "var(--foreground)",
                      fontWeight: m === selectedMonth ? "600" : "400",
                    }}
                  >
                    {formatMonthLabel(m)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {loading ? (
          <Spinner />
        ) : (
          <>
            {/* Summary card */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">Resumen del mes</p>
              <div className="space-y-3">
                <SummaryRow label="Viajes" value={`${monthTrips.length} registros`} />
                <SummaryRow label="Monto viajes" value={formatCLP(tripAmount)} mono />
                <SummaryRow label="Sueldo proporcional" value={formatCLP(config.baseSalary)} mono />
                <SummaryRow label="Viáticos" value={formatCLP(config.viaticos)} mono />
                <div className="pt-3 mt-1 border-t border-border flex items-center justify-between">
                  <p className="font-bold text-sm">Total a pagar</p>
                  <p className="font-bold text-xl" style={{ color: "var(--primary)" }}>{formatCLP(total)}</p>
                </div>
              </div>
            </div>

            {/* Trip list */}
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-sm text-muted-foreground">{monthTrips.length} viajes</h2>
            </div>

            {monthTrips.length === 0 ? (
              <div
                className="rounded-2xl"
                style={{ background: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <EmptyState label={`Sin viajes en ${formatMonthLabel(selectedMonth)}`} />
              </div>
            ) : (
              <div
                className="rounded-2xl px-4"
                style={{ background: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                {monthTrips.map((t) => (
                  <TripRow key={t.id} trip={t} onPress={() => onTripPress(t)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB Excel */}
      <button
        className="fixed bottom-24 right-5 z-10 flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm shadow-lg"
        style={{
          background: "var(--primary)",
          color: "#fff",
          boxShadow: "0 4px 16px rgba(74,124,89,0.4)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Excel
      </button>
    </div>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [trips, setTrips] = useState<Trip[]>(SEED_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [sheetMode, setSheetMode] = useState<"options" | "delete" | "edit" | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [editFromSheet, setEditFromSheet] = useState<Trip | null>(null);

  function showToast(message: string, type: ToastType) {
    setToast({ message, type });
  }

  function handleTripPress(t: Trip) {
    setSelectedTrip(t);
    setSheetMode("options");
  }

  function handleSheetEdit() {
    setEditFromSheet(selectedTrip);
    setSelectedTrip(null);
    setSheetMode(null);
    setScreen("new-trip");
  }

  function handleSheetDeleteRequest() {
    setSheetMode("delete");
  }

  function handleDeleteConfirm() {
    if (!selectedTrip) return;
    setTrips((prev) => prev.filter((t) => t.id !== selectedTrip.id));
    setSelectedTrip(null);
    setSheetMode(null);
    showToast("Viaje eliminado", "success");
  }

  function handleSaveTrip(data: Omit<Trip, "id">) {
    if (editFromSheet) {
      setTrips((prev) => prev.map((t) => (t.id === editFromSheet.id ? { ...data, id: t.id } : t)));
      setEditFromSheet(null);
      showToast("Viaje actualizado", "success");
    } else {
      const id = Date.now().toString();
      setTrips((prev) => [{ ...data, id }, ...prev]);
      showToast("Viaje guardado", "success");
    }
    setScreen("dashboard");
  }

  function closeSheet() {
    setSelectedTrip(null);
    setSheetMode(null);
  }

  // Mobile frame constraint
  return (
    <div
      className="flex items-start justify-center min-h-full"
      style={{ background: "#D9EAD3" }}
    >
      {/* Desktop: two-panel layout */}
      <div
        className="hidden lg:flex items-start gap-8 w-full max-w-5xl px-8 py-8 min-h-full"
        style={{ background: "#D9EAD3" }}
      >
        {/* Left: description panel */}
        <div className="flex-1 pt-8 sticky top-8">
          <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--primary)", color: "#fff" }}>
            <span>●</span> En línea
          </div>
          <h1 className="text-4xl font-bold mt-4 leading-tight" style={{ color: "#1A1F1A" }}>
            Control de<br />viajes y pagos
          </h1>
          <p className="text-base mt-3" style={{ color: "#4A5A4A" }}>
            Registrá cada viaje, llevá el control de tus ingresos mensuales y descargá tu planilla con un toque.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: "🚗", label: "Registrá viajes en segundos" },
              { icon: "💵", label: "Total calculado automáticamente" },
              { icon: "📊", label: "Descargá tu planilla mensual" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm font-medium" style={{ color: "#2D5A3D" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: phone frame */}
        <div className="flex-shrink-0">
          <MobileFrame
            screen={screen}
            trips={trips}
            selectedTrip={selectedTrip}
            sheetMode={sheetMode}
            toast={toast}
            editFromSheet={editFromSheet}
            onTripPress={handleTripPress}
            onNavigate={setScreen}
            onSaveTrip={handleSaveTrip}
            onSheetEdit={handleSheetEdit}
            onSheetDeleteRequest={handleSheetDeleteRequest}
            onDeleteConfirm={handleDeleteConfirm}
            onCloseSheet={closeSheet}
            onCloseToast={() => setToast(null)}
            onCancelEdit={() => { setEditFromSheet(null); setScreen("dashboard"); }}
          />
        </div>
      </div>

      {/* Mobile: full screen */}
      <div
        className="lg:hidden w-full min-h-full"
        style={{ background: "var(--background)", maxWidth: 480 }}
      >
        <AppShell
          screen={screen}
          trips={trips}
          selectedTrip={selectedTrip}
          sheetMode={sheetMode}
          toast={toast}
          editFromSheet={editFromSheet}
          onTripPress={handleTripPress}
          onNavigate={setScreen}
          onSaveTrip={handleSaveTrip}
          onSheetEdit={handleSheetEdit}
          onSheetDeleteRequest={handleSheetDeleteRequest}
          onDeleteConfirm={handleDeleteConfirm}
          onCloseSheet={closeSheet}
          onCloseToast={() => setToast(null)}
          onCancelEdit={() => { setEditFromSheet(null); setScreen("dashboard"); }}
        />
      </div>
    </div>
  );
}

// Phone frame for desktop
function MobileFrame(props: AppShellProps) {
  return (
    <div
      style={{
        width: 390,
        height: 844,
        borderRadius: 44,
        background: "#1A1A1A",
        padding: "12px 10px",
        boxShadow: "0 32px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.06)",
        position: "relative",
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          width: 120,
          height: 32,
          background: "#1A1A1A",
          borderRadius: "0 0 20px 20px",
          zIndex: 50,
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 34,
          overflow: "hidden",
          background: "var(--background)",
          position: "relative",
        }}
      >
        <AppShell {...props} />
      </div>
    </div>
  );
}

// Shared shell
interface AppShellProps {
  screen: Screen;
  trips: Trip[];
  selectedTrip: Trip | null;
  sheetMode: "options" | "delete" | "edit" | null;
  toast: { message: string; type: ToastType } | null;
  editFromSheet: Trip | null;
  onTripPress: (t: Trip) => void;
  onNavigate: (s: Screen) => void;
  onSaveTrip: (data: Omit<Trip, "id">) => void;
  onSheetEdit: () => void;
  onSheetDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onCloseSheet: () => void;
  onCloseToast: () => void;
  onCancelEdit: () => void;
}

function AppShell({
  screen,
  trips,
  selectedTrip,
  sheetMode,
  toast,
  editFromSheet,
  onTripPress,
  onNavigate,
  onSaveTrip,
  onSheetEdit,
  onSheetDeleteRequest,
  onDeleteConfirm,
  onCloseSheet,
  onCloseToast,
  onCancelEdit,
}: AppShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [screen]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden" style={{ background: "var(--background)" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={onCloseToast} />}

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        {screen === "dashboard" && (
          <Dashboard trips={trips} onTripPress={onTripPress} onNavigate={onNavigate} />
        )}
        {screen === "new-trip" && (
          <NewTrip
            onSave={onSaveTrip}
            editTrip={editFromSheet}
            onCancel={editFromSheet ? onCancelEdit : undefined}
          />
        )}
        {screen === "history" && (
          <History trips={trips} onTripPress={onTripPress} />
        )}
      </div>

      <BottomNav active={screen} onNavigate={onNavigate} />

      {selectedTrip && sheetMode === "options" && (
        <BottomSheet
          trip={selectedTrip}
          onEdit={onSheetEdit}
          onDelete={onSheetDeleteRequest}
          onClose={onCloseSheet}
        />
      )}
      {selectedTrip && sheetMode === "delete" && (
        <DeleteConfirmSheet
          trip={selectedTrip}
          onConfirm={onDeleteConfirm}
          onClose={onCloseSheet}
        />
      )}
    </div>
  );
}
