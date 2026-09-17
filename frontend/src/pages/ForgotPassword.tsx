import { useState } from "react";
import { ArrowLeft, Phone, User, Loader2, Mail } from "lucide-react";

export function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Detecta si el usuario está escribiendo un teléfono o un correo
  const isPhone = identifier.length > 0 && !identifier.includes("@") && /^[\d\s-]+$/.test(identifier);

  function getFullIdentifier() {
    if (isPhone) {
      const digits = identifier.replace(/\D/g, "");
      return `+56${digits}`;
    }
    return identifier;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier) return;

    // Validar largo del teléfono
    if (isPhone) {
      const digits = identifier.replace(/\D/g, "");
      if (digits.length !== 9) {
        setErrorMsg("El número debe tener 9 dígitos (ej: 912345678).");
        return;
      }
    }
    
    setLoading(true);
    setErrorMsg("");
    
    const fullIdentifier = getFullIdentifier();

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: fullIdentifier })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSent(true);
      } else {
        setErrorMsg(data.error || "Ocurrió un error inesperado.");
      }
    } catch (e) {
      setErrorMsg("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-5 relative" style={{ background: "linear-gradient(135deg, var(--primary) 0%, #D4E0C8 100%)" }}>
      <div className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 relative flex flex-col items-center z-10">
        
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Circle Logo */}
        <div className="w-32 h-32 mb-8 mt-2 rounded-[32px] overflow-hidden bg-white flex items-center justify-center">
          <img src="https://i.postimg.cc/cCkQY6LH/icon.jpg" alt="RutaPay Icon" className="w-full h-full object-contain" />
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Recuperar Clave</h2>
        <p className="text-xs text-gray-500 text-center mb-6 px-4">
          Ingresa tu teléfono (sin +56) o correo y te enviaremos una clave temporal por WhatsApp.
        </p>

        {/* Content */}
        {sent ? (
          <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-green-600 text-center mb-6">
              ¡Clave enviada! Revisa tu WhatsApp.
            </p>
            <button
              onClick={onBack}
              className="w-full py-4 rounded-full font-bold text-base tracking-widest uppercase transition-transform hover:scale-[0.98] active:scale-[0.95] shadow-lg"
              style={{ 
                background: "var(--primary)", 
                color: "#fff",
                boxShadow: "0 8px 20px -8px rgba(45, 90, 61, 0.5)"
              }}
            >
              Volver al Login
            </button>
          </div>
        ) : (
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
                onChange={(e) => { setIdentifier(e.target.value); setErrorMsg(""); }}
                placeholder="912345678 o correo@email.com"
                required
                className="w-full pr-6 py-4 rounded-full text-sm font-semibold outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50"
                style={{ 
                  background: "#E5E7EB", 
                  color: "#374151",
                  paddingLeft: isPhone ? "4.5rem" : "3rem"
                }}
              />
            </div>

            {errorMsg && (
              <div className="text-red-500 text-sm font-semibold text-center px-4 bg-red-50 py-2 rounded-xl">
                {errorMsg}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || !identifier}
              className="w-full py-4 rounded-full font-bold text-base tracking-widest uppercase transition-transform hover:scale-[0.98] active:scale-[0.95] mt-2 shadow-lg disabled:opacity-70"
              style={{ 
                background: "var(--primary)", 
                color: "#fff",
                boxShadow: "0 8px 20px -8px rgba(45, 90, 61, 0.5)"
              }}
            >
              {loading ? "Enviando..." : "Enviar clave por WhatsApp"}
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 text-center text-gray-600 font-bold text-xs tracking-widest uppercase z-10">
        RUTAPAY © {new Date().getFullYear()}
      </div>
    </div>
  );
}
