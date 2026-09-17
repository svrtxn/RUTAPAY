import { useState, useEffect } from "react";
import { AuthUser } from "../../types";
import { currentYM, formatCLP } from "../../utils/format";
import { UserPlus, Edit2, Trash2, ChevronLeft, Save } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";
import { AdminDriverProfile } from "./AdminDriverProfile";

export function AdminDrivers({ onBack }: { onBack: () => void }) {
  const [drivers, setDrivers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDriver, setViewDriver] = useState<AuthUser | null>(null);
  
  // Create/Edit Driver Modal
  const [driverModal, setDriverModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);
  
  // Config Driver (Salary/Viatics) Modal
  const [configModal, setConfigModal] = useState(false);
  const [configDriver, setConfigDriver] = useState<AuthUser | null>(null);
  const [ym, setYm] = useState(currentYM());
  const [configForm, setConfigForm] = useState({ base_salary: "", viatics: "" });
  
  const [alert, setAlert] = useState({ isOpen: false, title: "", message: "", type: "info" as "info"|"success"|"error" });

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function fetchDrivers() {
    setLoading(true);
    const token = localStorage.getItem("rutapay_token");
    try {
      const res = await fetch("/api/drivers", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDrivers(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function saveDriver() {
    setSaving(true);
    const token = localStorage.getItem("rutapay_token");
    try {
      const url = editId ? `/api/drivers/${editId}` : "/api/drivers";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = await res.json();
        setAlert({ 
          isOpen: true, 
          title: "Éxito", 
          message: editId ? "Chofer actualizado." : `Chofer creado. Se ha enviado un mensaje de WhatsApp a ${form.phone} con su contraseña temporal.`, 
          type: "success" 
        });
        setDriverModal(false);
        fetchDrivers();
      } else {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }
    } catch (e: any) {
      setAlert({ isOpen: true, title: "Error", message: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteDriver(id: string) {
    if (!confirm("¿Estás seguro de eliminar este chofer? Se borrarán todos sus viajes.")) return;
    const token = localStorage.getItem("rutapay_token");
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        fetchDrivers();
        setAlert({ isOpen: true, title: "Éxito", message: "Chofer eliminado.", type: "success" });
      }
    } catch (e) {
      setAlert({ isOpen: true, title: "Error", message: "Error al eliminar", type: "error" });
    }
  }

  // --- CONFIG (SALARY/VIATICS) LOGIC ---
  async function openConfig(driver: AuthUser) {
    setConfigDriver(driver);
    setConfigModal(true);
    const token = localStorage.getItem("rutapay_token");
    const [y, m] = ym.split('-');
    try {
      const res = await fetch(`/api/monthly-config?driver_id=${driver.id}&month=${m}&year=${y}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.config) {
        setConfigForm({ 
          base_salary: data.config.base_salary != null ? String(data.config.base_salary) : "0", 
          viatics: data.config.viatics != null ? String(data.config.viatics) : "0" 
        });
      } else {
        setConfigForm({ base_salary: "0", viatics: "0" });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Load config when month changes if modal is open
  useEffect(() => {
    if (configModal && configDriver) openConfig(configDriver);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym]);

  async function saveConfig() {
    setSaving(true);
    const token = localStorage.getItem("rutapay_token");
    const [y, m] = ym.split('-');
    try {
      const res = await fetch("/api/monthly-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          driver_id: configDriver!.id, 
          month: parseInt(m), 
          year: parseInt(y), 
          base_salary: configForm.base_salary, 
          viatics: configForm.viatics 
        })
      });
      if (res.ok) {
        setAlert({ isOpen: true, title: "Éxito", message: "Configuración guardada.", type: "success" });
        setConfigModal(false);
      } else {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar configuración");
      }
    } catch (e: any) {
      setAlert({ isOpen: true, title: "Error", message: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (viewDriver) {
    return <AdminDriverProfile driver={viewDriver} onBack={() => setViewDriver(null)} />;
  }

  return (
    <div className="flex flex-col min-h-full pb-28 px-5 pt-8 relative">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-black/5 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Choferes</h1>
      </div>

      <button
        onClick={() => { setEditId(null); setForm({ name: "", phone: "", email: "" }); setDriverModal(true); }}
        className="w-full py-3.5 mb-6 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors hover:bg-black/5"
        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
      >
        <UserPlus size={18} />
        Añadir Chofer
      </button>

      {loading ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-3">
          {drivers.map(d => (
            <div key={d.id} className="p-4 rounded-2xl bg-card border shadow-sm flex flex-col gap-3 transition-colors hover:bg-black/5" style={{ borderColor: "var(--border)" }}>
              <div className="flex justify-between items-start">
                <div className="flex-1 cursor-pointer" onClick={() => setViewDriver(d)}>
                  <p className="font-bold">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.phone} {d.email ? `- ${d.email}` : ''}</p>
                  <p className="text-xs text-primary font-semibold mt-1">Ver perfil e historial →</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditId(d.id); setForm({ name: d.name, phone: d.phone || "", email: d.email || "" }); setDriverModal(true); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteDriver(d.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <button
                onClick={() => openConfig(d)}
                className="w-full py-2.5 rounded-xl border border-dashed font-semibold text-xs text-center hover:bg-black/5 transition-colors"
              >
                Configurar Sueldo y Viáticos
              </button>
            </div>
          ))}
          {drivers.length === 0 && <p className="text-center text-muted-foreground py-10">No hay choferes registrados.</p>}
        </div>
      )}

      {/* Driver Modal */}
      {driverModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-8 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-xl relative animate-in slide-in-from-bottom-8">
            <h2 className="text-xl font-bold mb-4">{editId ? "Editar Chofer" : "Nuevo Chofer"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-xl bg-secondary px-4 py-3 outline-none border border-transparent focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono (+569...)</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full rounded-xl bg-secondary px-4 py-3 outline-none border border-transparent focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Correo (Obligatorio)</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full rounded-xl bg-secondary px-4 py-3 outline-none border border-transparent focus:border-primary" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDriverModal(false)} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm bg-secondary">Cancelar</button>
                <button onClick={saveDriver} disabled={saving} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm flex justify-center items-center" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  {saving ? <Spinner /> : (editId ? "Guardar" : "Crear")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {configModal && configDriver && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-8 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-xl relative animate-in slide-in-from-bottom-8">
            <h2 className="text-xl font-bold mb-1">Configurar Mensualidad</h2>
            <p className="text-sm text-muted-foreground mb-4">Chofer: {configDriver.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mes</label>
                <input type="month" value={ym} onChange={e => setYm(e.target.value)} className="w-full rounded-xl bg-secondary px-4 py-3 outline-none border border-transparent focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sueldo Proporcional Base</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={configForm.base_salary && configForm.base_salary !== "0" ? Number(configForm.base_salary).toLocaleString('es-CL') : ""} 
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setConfigForm({...configForm, base_salary: raw});
                  }} 
                  placeholder="Ej: 50000"
                  className="w-full rounded-xl bg-secondary px-4 py-3 outline-none border border-transparent focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Viáticos Fijos</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={configForm.viatics && configForm.viatics !== "0" ? Number(configForm.viatics).toLocaleString('es-CL') : ""} 
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setConfigForm({...configForm, viatics: raw});
                  }} 
                  placeholder="Ej: 15000"
                  className="w-full rounded-xl bg-secondary px-4 py-3 outline-none border border-transparent focus:border-primary" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setConfigModal(false)} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm bg-secondary">Cancelar</button>
                <button onClick={saveConfig} disabled={saving} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm flex justify-center items-center" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  {saving ? <Spinner /> : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal {...alert} onClose={() => setAlert({ ...alert, isOpen: false })} />
    </div>
  );
}
