import { useState } from 'react';
import './index.css';

function App() {
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to Express backend POST /api/trips
    setTimeout(() => {
      alert('Viaje guardado.');
      setAmount('');
      setDestination('');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="app-container">
      <header>
        <h1>RutaPay</h1>
        <p className="text-small">Hola, Chofer de Prueba</p>
      </header>

      <section className="card">
        <h2>Registrar Viaje</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Monto del viaje ($)</label>
            <input 
              type="number" 
              className="input-control"
              placeholder="Ej: 467000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Destino (Opcional)</label>
            <input 
              type="text" 
              className="input-control"
              placeholder="¿A dónde fuiste?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button type="button" className="chip" onClick={() => setDestination('CGA')}>CGA</button>
            <button type="button" className="chip" onClick={() => setDestination('Aeropuerto')}>Aeropuerto</button>
            <button type="button" className="chip" onClick={() => setDestination('Centro')}>Centro</button>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Viaje'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Resumen del Mes</h2>
        <p className="text-small" style={{ marginBottom: '16px' }}>Septiembre 2026</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="text-small">Total Viajes</span>
          <span>$120.000</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="text-small">Sueldo Base</span>
          <span>$500.000</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="text-small">Viáticos</span>
          <span>$50.000</span>
        </div>
        
        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Total a Pagar</span>
          <span className="amount">$670.000</span>
        </div>
      </section>
    </div>
  );
}

export default App;
