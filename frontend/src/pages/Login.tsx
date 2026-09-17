import { useState, useEffect } from "react";
import { AuthUser } from "../types";
import { User, Lock, Eye, EyeOff, Phone } from "lucide-react";
import iconUrl from "../../public/icon.jpg";

export function Login({
  onLogin,
  onForgot,
}: {
  onLogin: (token: string, user: AuthUser) => void;
  onForgot?: () => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Detecta si el usuario está escribiendo un teléfono o un correo
  const isPhone = identifier.length > 0 && !identifier.includes("@") && /^[\d\s-]+$/.test(identifier);

  useEffect(() => {
    const savedId = localStorage.getItem("rutapay_saved_identifier");
    if (savedId) {
      // Si guardamos con +56, quitarlo para mostrar solo los 9 dígitos
      if (savedId.startsWith("+56")) {
        setIdentifier(savedId.slice(3));
      } else {
        setIdentifier(savedId);
      }
      setRememberMe(true);
    }
  }, []);

  function getFullIdentifier() {
    if (isPhone) {
      const digits = identifier.replace(/\D/g, "");
      return `+56${digits}`;
    }
    return identifier;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Por favor ingresa ambos campos.");
      return;
    }

    // Validar largo del teléfono
    if (isPhone) {
      const digits = identifier.replace(/\D/g, "");
      if (digits.length !== 9) {
        setError("El número debe tener 9 dígitos (ej: 912345678).");
        return;
      }
    }

    setError("");
    setLoading(true);

    const fullIdentifier = getFullIdentifier();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: fullIdentifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      localStorage.setItem("rutapay_token", data.token);
      localStorage.setItem("rutapay_user", JSON.stringify(data.user));

      if (rememberMe) {
        localStorage.setItem("rutapay_saved_identifier", fullIdentifier);
      } else {
        localStorage.removeItem("rutapay_saved_identifier");
      }

      onLogin(data.token, data.user);
    } catch {
      setError("No se pudo conectar al servidor. ¿Está corriendo el backend?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-5 overflow-y-auto" style={{ background: "linear-gradient(135deg, var(--primary) 0%, #D4E0C8 100%)" }}>
      <div className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 relative flex flex-col items-center z-10">
        
        {/* Circle Logo */}
        <div className="w-32 h-32 mb-8 mt-2 rounded-[32px] overflow-hidden bg-white flex items-center justify-center">
          <img src={iconUrl} alt="RutaPay Icon" className="w-full h-full object-contain" />
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              {isPhone ? <Phone size={18} strokeWidth={2.5} /> : <User size={18} strokeWidth={2.5} />}
            </div>
            {isPhone && (
              <div className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-700 font-bold text-sm select-none pointer-events-none">
                +56
              </div>
            )}
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="912345678 o correo@email.com"
              className="w-full pr-6 py-4 rounded-full text-sm font-semibold outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50"
              style={{ 
                background: "#E5E7EB", 
                color: "#374151",
                paddingLeft: isPhone ? "4.5rem" : "3rem"
              }}
            />
          </div>
          
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <Lock size={18} strokeWidth={2.5} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full pl-12 pr-12 py-4 rounded-full text-sm font-semibold outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50"
              style={{ background: "#E5E7EB", color: "#374151" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between mt-1 mb-2 w-full gap-y-3 px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-primary focus:ring-primary w-4 h-4 bg-gray-200 border-transparent cursor-pointer" 
              />
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider select-none">Recordarme</span>
            </label>
            <button 
              type="button" 
              onClick={onForgot}
              className="text-[10px] sm:text-[11px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider italic"
            >
              ¿Olvidaste tu clave?
            </button>
          </div>

          {error && <p className="text-sm font-semibold text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full font-bold text-base tracking-widest uppercase transition-transform hover:scale-[0.98] active:scale-[0.95] mt-2 shadow-lg"
            style={{ 
              background: "var(--primary)", 
              color: "#fff",
              boxShadow: "0 8px 20px -8px rgba(45, 90, 61, 0.5)"
            }}
          >
            {loading ? "Cargando..." : "Ingresar"}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-gray-600 font-bold text-xs tracking-widest uppercase z-10">
        RUTAPAY © {new Date().getFullYear()}
      </div>
    </div>
  );
}
