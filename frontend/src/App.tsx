import { useState, useEffect, useCallback } from "react";
import { AuthUser, Trip, Screen, ToastType } from "./types";
import { SideNav } from "./components/layout/SideNav";
import { BottomNav } from "./components/layout/BottomNav";
import { Toast } from "./components/ui/Toast";
import { BottomSheet } from "./components/ui/BottomSheet";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { History } from "./pages/History";
import { NewTrip } from "./pages/NewTrip";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Settings } from "./pages/Settings";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminDrivers } from "./pages/admin/AdminDrivers";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // Auth UI State
  const [showForgot, setShowForgot] = useState(false);
  
  // App UI State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("rutapay_token");
    const u = localStorage.getItem("rutapay_user");
    if (t && u) {
      setToken(t);
      try {
        setUser(JSON.parse(u));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/trips", {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTrips();
    }
  }, [token, fetchTrips]);

  function handleLogin(t: string, u: AuthUser) {
    setToken(t);
    setUser(u);
    setActiveScreen("dashboard");
    setShowForgot(false);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("rutapay_token");
    localStorage.removeItem("rutapay_user");
  }

  async function handleSaveTrip(t: Omit<Trip, "id">) {
    if (!token) return;
    try {
      const url = editingTrip ? `/api/trips/${editingTrip.id}` : "/api/trips";
      const method = editingTrip ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(t),
      });

      if (res.ok) {
        await fetchTrips();
        setToast({ message: editingTrip ? "Viaje actualizado" : "Viaje guardado", type: "success" });
        setEditingTrip(null);
        setActiveScreen("dashboard");
      } else {
        setToast({ message: "Error al guardar el viaje", type: "error" });
      }
    } catch {
      setToast({ message: "Error de conexión", type: "error" });
    }
  }

  async function handleDeleteTrip(id: string) {
    if (!token) return;
    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchTrips();
        setToast({ message: "Viaje eliminado", type: "success" });
        setSelectedTrip(null);
      } else {
        setToast({ message: "Error al eliminar", type: "error" });
      }
    } catch {
      setToast({ message: "Error de conexión", type: "error" });
    }
  }

  if (!token) {
    if (showForgot) {
      return <ForgotPassword onBack={() => setShowForgot(false)} />;
    }
    return <Login onLogin={handleLogin} onForgot={() => setShowForgot(true)} />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SideNav active={activeScreen} onNavigate={setActiveScreen} onLogout={handleLogout} isAdmin={user?.role === "ADMIN"} />

      <main className="flex-1 overflow-y-auto relative">
        {/* CHOFER SCREENS */}
        {user?.role !== "ADMIN" && activeScreen === "dashboard" && (
          <Dashboard trips={trips} onTripPress={setSelectedTrip} onNavigate={setActiveScreen} onLogout={handleLogout} />
        )}
        
        {user?.role !== "ADMIN" && activeScreen === "new-trip" && (
          <NewTrip
            onSave={handleSaveTrip}
            editTrip={editingTrip}
            onCancel={editingTrip ? () => setEditingTrip(null) : undefined}
          />
        )}
        
        {user?.role !== "ADMIN" && activeScreen === "history" && (
          <History trips={trips} onTripPress={setSelectedTrip} />
        )}

        {user?.role !== "ADMIN" && activeScreen === "settings" && (
          <Settings onLogout={handleLogout} />
        )}

        {/* ADMIN SCREENS */}
        {user?.role === "ADMIN" && activeScreen === "dashboard" && (
          <AdminDashboard onNavigate={setActiveScreen} onLogout={handleLogout} />
        )}
        
        {user?.role === "ADMIN" && activeScreen === "admin-drivers" && (
          <AdminDrivers onBack={() => setActiveScreen("dashboard")} />
        )}

        {/* Global UI Components */}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
        
        {selectedTrip && (
          <BottomSheet
            trip={selectedTrip}
            onClose={() => setSelectedTrip(null)}
            onEdit={() => {
              setEditingTrip(selectedTrip);
              setSelectedTrip(null);
              setActiveScreen("new-trip");
            }}
            onDelete={() => handleDeleteTrip(selectedTrip.id)}
          />
        )}
      </main>

      {user?.role !== "ADMIN" && (
        <BottomNav active={activeScreen} onNavigate={setActiveScreen} />
      )}
    </div>
  );
}
