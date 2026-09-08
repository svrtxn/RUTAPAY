require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000; // Según requisitos.md es el puerto 3000

// Supabase Connection
const supabaseUrl = process.env.SUPABASE_URL; // Asegúrate de tener estas variables en backend/.env
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase configurado correctamente.');
} else {
  console.warn('⚠️ Falta configurar SUPABASE_URL y/o SUPABASE_KEY en el archivo .env');
}

// ========================
// ENDPOINTS RUTAPAY
// ========================

app.get('/', (req, res) => {
  res.send('API de RutaPay funcionando. 🚀');
});

// 1. Obtener todos los choferes (Para el Admin)
app.get('/api/drivers', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('role', 'CHOFER');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// 2. Registrar un nuevo viaje
app.post('/api/trips', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });

  const { driver_id, amount, destination, date } = req.body;
  if (!driver_id || !amount) {
    return res.status(400).json({ error: 'driver_id y amount son requeridos.' });
  }

  const { data, error } = await supabase
    .from('trips')
    .insert([{ driver_id, amount, destination, date: date || new Date().toISOString() }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: 'Viaje guardado exitosamente.', trip: data[0] });
});

// 3. Obtener viajes de un chofer específico en un mes
app.get('/api/trips/:driver_id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });
  const { driver_id } = req.params;
  const { month, year } = req.query; // opcionales

  let query = supabase.from('trips').select('*').eq('driver_id', driver_id).order('date', { ascending: false });

  // Filtrado simple por mes si se envía (meses en formato "09" y "2026")
  if (month && year) {
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`; // simplificado
    query = query.gte('date', startDate).lte('date', endDate);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// 4. Obtener/Crear Configuración Mensual (Sueldo base y Viáticos)
app.post('/api/monthly-config', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });
  const { month, year, base_salary, viatics } = req.body;

  const { data, error } = await supabase
    .from('monthly_configs')
    .upsert({ month, year, base_salary, viatics }, { onConflict: 'month, year' })
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Configuración actualizada', config: data[0] });
});

// 5. Cálculo y Reporte Mensual (Total = Viajes + Sueldo + Viáticos)
app.get('/api/report/:driver_id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });
  const { driver_id } = req.params;
  const { month, year } = req.query;

  if (!month || !year) return res.status(400).json({ error: 'month y year son obligatorios para el reporte' });

  // 1. Obtener viajes
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = `${year}-${month.padStart(2, '0')}-31`; 
  
  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('amount')
    .eq('driver_id', driver_id)
    .gte('date', startDate).lte('date', endDate);

  if (tripsError) return res.status(400).json({ error: tripsError.message });

  const totalTripsAmount = trips.reduce((acc, trip) => acc + Number(trip.amount), 0);

  // 2. Obtener config mensual
  const { data: config, error: configError } = await supabase
    .from('monthly_configs')
    .select('base_salary, viatics')
    .eq('month', month)
    .eq('year', year)
    .single();

  // Si no hay config, se asume 0 para base y viáticos
  const baseSalary = config ? Number(config.base_salary) : 0;
  const viatics = config ? Number(config.viatics) : 0;

  // 3. Cálculo Total
  const totalToPay = totalTripsAmount + baseSalary + viatics;

  res.json({
    driver_id,
    month,
    year,
    resume: {
      total_trips_amount: totalTripsAmount,
      base_salary: baseSalary,
      viatics: viatics,
      total_to_pay: totalToPay
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor de RutaPay corriendo en http://localhost:${PORT}`);
});
