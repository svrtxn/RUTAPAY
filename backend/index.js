require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'rutapay-dev-secret-change-me';

// Supabase Connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase configurado correctamente.');
} else {
  console.warn('⚠️ Falta configurar SUPABASE_URL y/o SUPABASE_KEY en el archivo .env');
}

// Buscamos Chrome o Edge instalado en el sistema
let browserExecutablePath = null;
const paths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

for (const p of paths) {
  if (fs.existsSync(p)) {
    browserExecutablePath = p;
    break;
  }
}

// WhatsApp Config
let whatsappClient = null;
let whatsappReady = false;

function createWhatsAppClient() {
  const client = new Client({
    authStrategy: new LocalAuth(),
    authTimeoutMs: 120000,
    webVersionCache: {
      type: 'none'
    },
    puppeteer: { 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      executablePath: browserExecutablePath
    }
  });

  client.on('qr', async (qr) => {
    let botPhone = process.env.WHATSAPP_BOT_PHONE;
    if (botPhone) {
        botPhone = botPhone.replace(/\D/g, '');
        console.log(`\n📲 Solicitando código de emparejamiento para el número: ${botPhone}`);
        try {
            const code = await client.requestPairingCode(botPhone);
            console.log('\n=============================================');
            console.log(`TU CÓDIGO DE EMPAREJAMIENTO ES:  ${code}`);
            console.log('Ve a WhatsApp > Dispositivos Vinculados > Vincular con el número de teléfono');
            console.log('Ingresa este código para iniciar sesión.');
            console.log('=============================================\n');
        } catch (error) {
            console.error('Error al pedir el código de emparejamiento:', error.message);
        }
    } else {
        console.log('=============================================');
        console.log('SCAN THIS QR CODE CON TU WHATSAPP (RutaPay):');
        qrcode.generate(qr, {small: true});
        console.log('=============================================');
        console.log('💡 TIP: Si no puedes escanear el QR, puedes vincular por código.');
        console.log('Solo agrega WHATSAPP_BOT_PHONE="+569TU_NUMERO" en tu archivo .env y reinicia.');
    }
  });

  client.on('ready', () => {
    whatsappReady = true;
    console.log('✅ WhatsApp Client is ready!');
  });

  client.on('disconnected', (reason) => {
    whatsappReady = false;
    console.log('⚠️ WhatsApp desconectado:', reason);
  });

  return client;
}

async function initWhatsApp(maxRetries = 5) {
  console.log('⏳ Inicializando WhatsApp, por favor espera...');
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      whatsappClient = createWhatsAppClient();
      await whatsappClient.initialize();
      console.log('🟢 WhatsApp inicializado correctamente.');
      return; // Éxito, salimos
    } catch (err) {
      console.error(`❌ Intento ${attempt}/${maxRetries} falló: ${err.message}`);
      // Intentar destruir el cliente roto antes de reintentar
      try { await whatsappClient.destroy(); } catch (_) {}
      if (attempt < maxRetries) {
        const waitSec = attempt * 3;
        console.log(`⏳ Reintentando en ${waitSec} segundos...`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
      } else {
        console.error('🔴 No se pudo conectar a WhatsApp después de todos los intentos.');
        console.error('   El servidor seguirá corriendo SIN WhatsApp.');
        console.error('   Los mensajes se guardarán pero no se enviarán.');
      }
    }
  }
}

// Iniciar WhatsApp en segundo plano (no bloquea el servidor)
initWhatsApp();


// ========================
// AUTH MIDDLEWARE
// ========================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// ========================
// AUTH ENDPOINTS
// ========================

app.get('/', (req, res) => {
  res.send('API de RutaPay funcionando. 🚀');
});

// Login
app.post('/api/auth/login', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });

  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Correo/Teléfono y contraseña son requeridos.' });
  }

  const isEmail = identifier.includes('@');
  
  // Buscar usuario por correo o teléfono
  const { data: user, error } = await supabase
    .from('users')
    .select('id, phone, email, name, role, password_hash')
    .eq(isEmail ? 'email' : 'phone', isEmail ? identifier.toLowerCase().trim() : identifier.trim())
    .single();

  if (error || !user) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  if (!user.password_hash) {
    return res.status(401).json({ error: 'Este usuario no tiene contraseña configurada. Contacta al administrador.' });
  }

  // Verificar contraseña
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  // Generar JWT (expira en 7 días)
  const token = jwt.sign(
    { id: user.id, phone: user.phone, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: 'Login exitoso',
    token,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

// Recuperar contraseña
app.post('/api/forgot-password', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });
  
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ error: 'Falta el correo o teléfono' });

  const isEmail = identifier.includes('@');

  // 1. Buscar usuario
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, phone, email')
    .eq(isEmail ? 'email' : 'phone', isEmail ? identifier.toLowerCase().trim() : identifier.trim())
    .single();

  // Si no existe, podemos devolver un error amigable
  if (error || !user) {
    return res.status(404).json({ error: 'No hay ninguna cuenta registrada con ese dato.' });
  }

  // 2. Generar nueva contraseña
  const tempPassword = Math.random().toString(36).slice(-8);
  const hash = await bcrypt.hash(tempPassword, 10);

  // 3. Actualizar en DB
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: hash })
    .eq('id', user.id);

  if (updateError) return res.status(400).json({ error: updateError.message });

  // 4. Enviar WhatsApp
  try {
    const message = `Hola *${user.name.split(' ')[0]}*. Hemos recibido una solicitud para recuperar tu contraseña de RutaPay.\n\nTu nueva contraseña temporal es:\n*${tempPassword}*\n\nTe recomendamos iniciar sesión con esta contraseña y cambiarla inmediatamente en la sección de Ajustes.`;
    
    let formattedPhone = user.phone.replace(/\D/g, '');
    if (!formattedPhone.endsWith('@c.us')) {
       formattedPhone += '@c.us';
    }
    
    if (whatsappReady && whatsappClient) {
      await whatsappClient.sendMessage(formattedPhone, message);
    } else {
      console.warn('⚠️ WhatsApp no está conectado. Mensaje no enviado.');
    }
  } catch (wpError) {
    console.error("Error enviando WhatsApp de recuperación:", wpError);
  }

  res.json({ message: 'Contraseña temporal enviada por WhatsApp' });
});

// Validar token y obtener usuario actual
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });

  const { data: user, error } = await supabase
    .from('users')
    .select('id, phone, email, name, role')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json({ user });
});

// Cambiar contraseña
app.put('/api/auth/password', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });

  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Debes proporcionar la contraseña actual y la nueva' });
  }

  // 1. Obtener usuario actual para verificar hash
  const { data: user, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', req.user.id)
    .single();

  if (error || !user) return res.status(404).json({ error: 'Usuario no encontrado' });

  // 2. Verificar contraseña actual
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
  }

  // 3. Hashear y guardar nueva contraseña
  const hash = await bcrypt.hash(newPassword, 10);
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: hash })
    .eq('id', req.user.id);

  if (updateError) return res.status(400).json({ error: updateError.message });
  
  res.json({ message: 'Contraseña actualizada exitosamente' });
});

// Seed user temporal — crea user1@rutapay.cl con contraseña Temporal123

app.post('/api/auth/seed-user', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });

  const phone = '+56911111111';
  const email = 'user1@rutapay.cl';
  const password = 'Temporal123';
  const name = 'Chofer Principal';
  const role = 'CHOFER';

  // Verificar si ya existe
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .single();

  if (existing) {
    // Actualizar contraseña del existente
    const hash = await bcrypt.hash(password, 10);
    await supabase.from('users').update({ password_hash: hash }).eq('phone', phone);
    return res.json({ message: `Usuario ${phone} ya existía, contraseña actualizada a "${password}".` });
  }

  // Crear nuevo
  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert([{ phone, email, name, role, password_hash: hash }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: `Usuario creado: ${phone} / ${password}`, user: data[0] });
});

// Seed ADMIN temporal — crea +56900000000 con contraseña RutaPay@2026!
app.post('/api/auth/seed-admin', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });

  const phone = '+56900000000';
  const email = 'admin@rutapay.cl';
  const password = 'RutaPay@2026!';
  const name = 'Administrador General';
  const role = 'ADMIN';

  const { data: existing } = await supabase.from('users').select('id').eq('phone', phone).single();
  
  if (existing) {
    const hash = await bcrypt.hash(password, 10);
    await supabase.from('users').update({ password_hash: hash }).eq('phone', phone);
    return res.json({ message: `Admin ${phone} ya existía, contraseña actualizada a "${password}".` });
  }

  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('users').insert([{ phone, email, name, role, password_hash: hash }]).select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: `Administrador creado: ${phone} / ${password}`, user: data[0] });
});

// ========================
// ENDPOINTS RUTAPAY (protegidos)
// ========================

// 1. Obtener todos los choferes (Para el Admin)
app.get('/api/drivers', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });

  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone, email')
    .eq('role', 'CHOFER');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// 1.1 Crear chofer (ADMIN)
app.post('/api/drivers', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' });

  const { phone, email, name } = req.body;
  if (!phone || !email || !name) return res.status(400).json({ error: 'Faltan datos (teléfono, email, nombre son obligatorios)' });

  // Validar que el teléfono no esté repetido
  const { data: existingPhone } = await supabase.from('users').select('id').eq('phone', phone.trim()).single();
  if (existingPhone) {
    return res.status(400).json({ error: 'El teléfono ya está registrado.' });
  }

  // Validar que el correo no esté repetido
  const { data: existingEmail } = await supabase.from('users').select('id').eq('email', email.toLowerCase().trim()).single();
  if (existingEmail) {
    return res.status(400).json({ error: 'El correo ya está registrado.' });
  }

  const tempPassword = Math.random().toString(36).slice(-8); // Autogenerar clave
  const hash = await bcrypt.hash(tempPassword, 10);

  const { data, error } = await supabase
    .from('users')
    .insert([{ phone: phone.trim(), email: email.toLowerCase().trim(), name, role: 'CHOFER', password_hash: hash }])
    .select();

  if (error) return res.status(400).json({ error: error.message });

  // Enviar WhatsApp
  try {
    const message = `¡Bienvenido a *RutaPay*, ${name.split(' ')[0]}!\n\nTu cuenta como chofer ha sido creada exitosamente. Ahora puedes comenzar a gestionar tus viajes, sueldos y viáticos.\n\nPara tu primer inicio de sesión, hemos generado una contraseña temporal segura para ti:\n*${tempPassword}*\n\nTe recomendamos cambiar esta contraseña inmediatamente desde tu perfil después de iniciar sesión.`;
    
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.endsWith('@c.us')) {
       formattedPhone += '@c.us';
    }
    
    if (whatsappReady && whatsappClient) {
      await whatsappClient.sendMessage(formattedPhone, message);
    } else {
      console.warn('⚠️ WhatsApp no está conectado. Mensaje de bienvenida no enviado.');
    }
  } catch (wpError) {
    console.error("Error enviando WhatsApp de bienvenida:", wpError);
  }

  res.status(201).json({ message: 'Chofer creado exitosamente', user: data[0], tempPassword });
});

// 1.2 Editar chofer (ADMIN)
app.put('/api/drivers/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' });
  const { name, phone, email } = req.body;

  // Validar que el teléfono no esté tomado por otro usuario
  const { data: existingPhone } = await supabase.from('users').select('id').eq('phone', phone).single();
  if (existingPhone && existingPhone.id !== req.params.id) {
    return res.status(400).json({ error: 'El teléfono ya está registrado por otro chofer.' });
  }

  // Validar que el email no esté tomado por otro usuario
  const { data: existingEmail } = await supabase.from('users').select('id').eq('email', email).single();
  if (existingEmail && existingEmail.id !== req.params.id) {
    return res.status(400).json({ error: 'El correo electrónico ya está registrado por otro chofer.' });
  }

  const { data, error } = await supabase.from('users').update({ name, phone, email }).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Chofer actualizado', user: data[0] });
});

// 1.3 Eliminar chofer (ADMIN)
app.delete('/api/drivers/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' });
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Chofer eliminado' });
});

// 2. Registrar un nuevo viaje
app.post('/api/trips', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });

  const { amount, origin, destination, date } = req.body;
  const driver_id = req.user.id;

  if (!amount) {
    return res.status(400).json({ error: 'amount es requerido.' });
  }

  const { data, error } = await supabase
    .from('trips')
    .insert([{ driver_id, amount, origin, destination, date: date || new Date().toISOString().split('T')[0] }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: 'Viaje guardado exitosamente.', trip: data[0] });
});

// 3. Obtener viajes del usuario autenticado o de un chofer específico (si es admin)
app.get('/api/trips', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });
  const driver_id = req.user.role === 'ADMIN' && req.query.driver_id ? req.query.driver_id : req.user.id;
  const { month, year } = req.query;

  let query = supabase.from('trips').select('*').eq('driver_id', driver_id).order('date', { ascending: false });

  if (month && year) {
    const m = String(month).padStart(2, '0');
    const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
    const startDate = `${year}-${m}-01`;
    const endDate = `${year}-${m}-${lastDay}`;
    query = query.gte('date', startDate).lte('date', endDate);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// 4. Obtener/Crear Configuración Mensual
app.post('/api/monthly-config', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' }); // Solo ADMIN
  const { driver_id, month, year, base_salary, viatics } = req.body;

  if (!driver_id) return res.status(400).json({ error: 'driver_id es obligatorio' });

  // Manual upsert to bypass any constraint naming issues
  const { data: existing } = await supabase
    .from('monthly_configs')
    .select('id')
    .eq('driver_id', driver_id)
    .eq('month', month)
    .eq('year', year)
    .single();

  let result;
  if (existing) {
    result = await supabase
      .from('monthly_configs')
      .update({ base_salary: Number(base_salary) || 0, viatics: Number(viatics) || 0 })
      .eq('id', existing.id)
      .select();
  } else {
    result = await supabase
      .from('monthly_configs')
      .insert([{ driver_id, month, year, base_salary: Number(base_salary) || 0, viatics: Number(viatics) || 0 }])
      .select();
  }

  const { data, error } = result;

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Configuración actualizada', config: data[0] });
});

// 5. Obtener configuración mensual
app.get('/api/monthly-config', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });
  
  // Si es ADMIN puede consultar de cualquier chofer pasándolo por query, si es CHOFER ve la suya
  const driver_id = req.user.role === 'ADMIN' && req.query.driver_id ? req.query.driver_id : req.user.id;
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'month y year son obligatorios' });
  }

  const { data, error } = await supabase
    .from('monthly_configs')
    .select('*')
    .eq('driver_id', driver_id)
    .eq('month', parseInt(month, 10))
    .eq('year', parseInt(year, 10))
    .single();

  if (error && error.code !== 'PGRST116') {
    return res.status(400).json({ error: error.message });
  }

  res.json({ config: data || { base_salary: 0, viatics: 0, driver_id } });
});

// 6. Reporte Mensual
app.get('/api/report', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });
  const driver_id = req.user.role === 'ADMIN' && req.query.driver_id ? req.query.driver_id : req.user.id;
  const { month, year } = req.query;

  if (!month || !year) return res.status(400).json({ error: 'month y year son obligatorios para el reporte' });

  const m = String(month).padStart(2, '0');
  const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
  const startDate = `${year}-${m}-01`;
  const endDate = `${year}-${m}-${lastDay}`;

  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('amount, date')
    .eq('driver_id', driver_id)
    .gte('date', startDate).lte('date', endDate);

  if (tripsError) return res.status(400).json({ error: tripsError.message });

  const totalTripsAmount = trips.reduce((acc, trip) => acc + Number(trip.amount), 0);
  const uniqueDaysWorked = new Set(trips.map(t => String(t.date).substring(0, 10))).size;

  const { data: config } = await supabase
    .from('monthly_configs')
    .select('base_salary, viatics')
    .eq('driver_id', driver_id)
    .eq('month', parseInt(month, 10))
    .eq('year', parseInt(year, 10))
    .single();

  const baseSalary = config ? Number(config.base_salary) : 0;
  const viaticRate = config ? Number(config.viatics) : 0;
  const totalViatics = viaticRate * uniqueDaysWorked;
  const totalToPay = totalTripsAmount + baseSalary + totalViatics;

  res.json({
    driver_id,
    month,
    year,
    resume: {
      total_trips_amount: totalTripsAmount,
      base_salary: baseSalary,
      viatics: totalViatics,
      viatics_details: { days: uniqueDaysWorked, rate: viaticRate },
      total_to_pay: totalToPay,
    },
  });
});

// 6.1 Reporte Global (ADMIN)
app.get('/api/report/global', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' });

  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ error: 'month y year son obligatorios' });

  const m = String(month).padStart(2, '0');
  const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
  const startDate = `${year}-${m}-01`;
  const endDate = `${year}-${m}-${lastDay}`;

  // Todos los viajes del mes
  const { data: allTrips, error: tripsError } = await supabase
    .from('trips')
    .select('driver_id, amount, date')
    .gte('date', startDate).lte('date', endDate);

  if (tripsError) return res.status(400).json({ error: tripsError.message });
  const globalTripsAmount = allTrips.reduce((acc, t) => acc + Number(t.amount), 0);

  // Todas las configuraciones del mes
  const { data: allConfigs, error: configsError } = await supabase
    .from('monthly_configs')
    .select('driver_id, base_salary, viatics')
    .eq('month', parseInt(month, 10))
    .eq('year', parseInt(year, 10));

  if (configsError) return res.status(400).json({ error: configsError.message });
  
  const globalBaseSalary = allConfigs.reduce((acc, c) => acc + Number(c.base_salary), 0);
  
  // Calcular viáticos por chofer
  let globalViatics = 0;
  for (const config of allConfigs) {
    const driverTrips = allTrips.filter(t => t.driver_id === config.driver_id);
    const uniqueDays = new Set(driverTrips.map(t => String(t.date).substring(0, 10))).size;
    globalViatics += uniqueDays * (Number(config.viatics) || 0);
  }
  
  const globalTotalToPay = globalTripsAmount + globalBaseSalary + globalViatics;

  res.json({
    month,
    year,
    resume: {
      total_trips_amount: globalTripsAmount,
      base_salary: globalBaseSalary,
      viatics: globalViatics,
      total_to_pay: globalTotalToPay,
    }
  });
});

// 7. Descargar Reporte Mensual en Excel
app.get('/api/report/excel', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });
  const driver_id = req.user.role === 'ADMIN' && req.query.driver_id ? req.query.driver_id : req.user.id;
  const { month, year } = req.query;

  if (!month || !year) return res.status(400).json({ error: 'month y year son obligatorios' });

  const m = String(month).padStart(2, '0');
  const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
  const startDate = `${year}-${m}-01`;
  const endDate = `${year}-${m}-${lastDay}`;

  // 1. Obtener viajes del mes
  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('*')
    .eq('driver_id', driver_id)
    .gte('date', startDate).lte('date', endDate)
    .order('date', { ascending: false });

  if (tripsError) return res.status(400).json({ error: tripsError.message });

  const totalTripsAmount = trips.reduce((acc, trip) => acc + Number(trip.amount), 0);
  const uniqueDaysWorked = new Set(trips.map(t => String(t.date).substring(0, 10))).size;

  // 2. Obtener config del mes
  const { data: config } = await supabase
    .from('monthly_configs')
    .select('base_salary, viatics')
    .eq('driver_id', driver_id)
    .eq('month', parseInt(month, 10))
    .eq('year', parseInt(year, 10))
    .single();

  const baseSalary = config ? Number(config.base_salary) : 0;
  const viaticRate = config ? Number(config.viatics) : 0;
  const viatics = viaticRate * uniqueDaysWorked;
  const totalToPay = totalTripsAmount + baseSalary + viatics;

  // 3. Crear archivo Excel
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RutaPay';
  
  const sheet = workbook.addWorksheet(`Reporte ${month}-${year}`);

  sheet.columns = [
    { key: 'date', width: 15 },
    { key: 'origin', width: 25 },
    { key: 'destination', width: 25 },
    { key: 'amount', width: 15 }
  ];

  // Logo (si existe) y metadatos
  try {
    const logoPath = path.join(__dirname, '../frontend/public/logo.jpg');
    if (fs.existsSync(logoPath)) {
      const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'jpeg',
      });
      // Posicionar con tamaño fijo para no deformar
      sheet.addImage(logoId, {
        tl: { col: 0.5, row: 0.5 }, // Ligero margen en A1
        ext: { width: 450, height: 90 } // Tamaño proporcional fijo
      });
    }
  } catch (e) {
    console.error("Error al cargar logo en excel:", e);
  }

  // Dejar espacio para el logo
  sheet.addRow(['', '', '', '']);
  sheet.getRow(1).height = 80; // Darle altura a la fila del logo
  sheet.mergeCells('A1:D1');
  sheet.addRow(['', '', '', '']);

  sheet.addRow(['Chofer:', req.user.name || req.user.email, '', '']);
  sheet.addRow(['', '', '', '']);

  const borderRows = [];

  const headerRow = sheet.addRow(['Proporcional', '', '', '']);
  sheet.mergeCells(`A${headerRow.number}:D${headerRow.number}`);
  headerRow.getCell(1).alignment = { horizontal: 'center' };
  headerRow.getCell(1).font = { size: 16 };
  borderRows.push(headerRow);

  const colsRow = sheet.addRow(['fecha', 'Lugar', 'Destino', 'Valor']);
  borderRows.push(colsRow);

  const dataStartRow = colsRow.number + 1;
  let dataEndRow = colsRow.number;

  // Agregar viajes ordenados cronológicamente
  trips.slice().reverse().forEach(t => {
    let formattedDate = t.date;
    if (t.date.includes('-')) {
      const [y, m, d] = t.date.split('-');
      formattedDate = `${d}-${m}-${y}`;
    }
    const row = sheet.addRow([formattedDate, t.origin || '', t.destination || '', Number(t.amount)]);
    borderRows.push(row);
    dataEndRow++;
  });

  // Totales estáticos para evitar problemas de compatibilidad con fórmulas en algunos visores
  const rowTotal = sheet.addRow(['', '', 'Total Viajes', totalTripsAmount]);
  borderRows.push(rowTotal);

  const rowSueldo = sheet.addRow(['', 'Sueldo Proporcional', '', baseSalary]);
  borderRows.push(rowSueldo);

  const rowTotalParcial = sheet.addRow(['', 'Total Sueldo + Viajes', '', totalTripsAmount + baseSalary]);
  ['A', 'B', 'C', 'D'].forEach(col => {
    rowTotalParcial.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5E8D4' } }; // Verde claro
  });
  borderRows.push(rowTotalParcial);

  const viaticLabel = viaticRate > 0 ? `Viáticos (${uniqueDaysWorked} días x ${viaticRate.toLocaleString('es-CL')})` : 'Viaticos';
  const rowViaticos = sheet.addRow(['', viaticLabel, 'Total', viatics]);
  borderRows.push(rowViaticos);

  const rowTotalFinal = sheet.addRow(['', '', 'TOTAL FINAL A PAGAR', totalToPay]);
  ['A', 'B', 'C', 'D'].forEach(col => {
    rowTotalFinal.getCell(col).font = { bold: true };
  });
  borderRows.push(rowTotalFinal);

  // Aplicar bordes a todas las celdas de la tabla
  borderRows.forEach(row => {
    ['A', 'B', 'C', 'D'].forEach(col => {
      const cell = row.getCell(col);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  sheet.addRow(['', '', '', '']);
  const generatedRow = sheet.addRow([`GENERADO POR RUTAPAY - ${new Date().toLocaleDateString('es-CL')}`, '', '', '']);
  sheet.mergeCells(`A${generatedRow.number}:D${generatedRow.number}`);
  generatedRow.font = { italic: true, color: { argb: 'FF888888' }, size: 10 };
  generatedRow.getCell(1).alignment = { horizontal: 'center' };

  // Configurar la respuesta
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="RutaPay_${month}_${year}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
});

// 8. Descargar Reporte Mensual Global (ADMIN)
app.get('/api/report/excel/admin', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' });

  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ error: 'month y year son obligatorios' });

  const m = String(month).padStart(2, '0');
  const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
  const startDate = `${year}-${m}-01`;
  const endDate = `${year}-${m}-${lastDay}`;

  // Obtener todos los choferes
  const { data: drivers } = await supabase.from('users').select('id, name, email').eq('role', 'CHOFER');
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RutaPay Admin';

  for (const driver of (drivers || [])) {
    // Viajes
    const { data: trips } = await supabase
      .from('trips')
      .select('*')
      .eq('driver_id', driver.id)
      .gte('date', startDate).lte('date', endDate)
      .order('date', { ascending: false });

    const totalTripsAmount = (trips || []).reduce((acc, t) => acc + Number(t.amount), 0);
    const uniqueDaysWorked = new Set((trips || []).map(t => String(t.date).substring(0, 10))).size;

    // Config
    const { data: config } = await supabase
      .from('monthly_configs')
      .select('base_salary, viatics')
      .eq('driver_id', driver.id)
      .eq('month', parseInt(month, 10))
      .eq('year', parseInt(year, 10))
      .single();

    const baseSalary = config ? Number(config.base_salary) : 0;
    const viaticRate = config ? Number(config.viatics) : 0;
    const viatics = viaticRate * uniqueDaysWorked;
    const totalToPay = totalTripsAmount + baseSalary + viatics;

    // Crear hoja por chofer. Si no tiene nombre, usa "Chofer - Email"
    const displayName = driver.name ? driver.name : `Chofer ${driver.email.split('@')[0]}`;
    const sheetName = displayName.replace(/[*/\\[\]:?]/g, '').substring(0, 30);
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = [
      { key: 'date', width: 15 },
      { key: 'origin', width: 25 },
      { key: 'destination', width: 25 },
      { key: 'amount', width: 15 }
    ];

    try {
      const logoPath = path.join(__dirname, '../frontend/public/logo.jpg');
      if (fs.existsSync(logoPath)) {
        const logoId = workbook.addImage({ filename: logoPath, extension: 'jpeg' });
        sheet.addImage(logoId, {
          tl: { col: 0.5, row: 0.5 },
          ext: { width: 450, height: 90 }
        });
      }
    } catch (e) {}

    sheet.addRow(['', '', '', '']);
    sheet.getRow(1).height = 80;
    sheet.mergeCells('A1:D1');
    sheet.addRow(['', '', '', '']);
    
    sheet.addRow(['Chofer:', driver.name || driver.email, '', '']);
    sheet.addRow(['', '', '', '']);

    const borderRows = [];

    const headerRow = sheet.addRow(['Proporcional', '', '', '']);
    sheet.mergeCells(`A${headerRow.number}:D${headerRow.number}`);
    headerRow.getCell(1).alignment = { horizontal: 'center' };
    headerRow.getCell(1).font = { size: 16 };
    borderRows.push(headerRow);

    const colsRow = sheet.addRow(['fecha', 'Lugar', 'Destino', 'Valor']);
    borderRows.push(colsRow);

    const dataStartRow = colsRow.number + 1;
    let dataEndRow = colsRow.number;

    (trips || []).slice().reverse().forEach(t => {
      let fDate = t.date;
      if (t.date.includes('-')) {
        const [y, m, d] = t.date.split('-');
        fDate = `${d}-${m}-${y}`;
      }
      borderRows.push(sheet.addRow([fDate, t.origin || '', t.destination || '', Number(t.amount)]));
      dataEndRow++;
    });

    // Totales estáticos para el admin
    const rowTotal = sheet.addRow(['', '', 'Total Viajes', totalTripsAmount]);
    borderRows.push(rowTotal);

    const rowSueldo = sheet.addRow(['', 'Sueldo Proporcional', '', baseSalary]);
    borderRows.push(rowSueldo);

    const rowTotalParcial = sheet.addRow(['', 'Total Sueldo + Viajes', '', totalTripsAmount + baseSalary]);
    ['A', 'B', 'C', 'D'].forEach(col => {
      rowTotalParcial.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5E8D4' } };
    });
    borderRows.push(rowTotalParcial);

    const viaticLabel = viaticRate > 0 ? `Viáticos (${uniqueDaysWorked} días x ${viaticRate.toLocaleString('es-CL')})` : 'Viaticos';
    const rowViaticos = sheet.addRow(['', viaticLabel, 'Total', viatics]);
    borderRows.push(rowViaticos);

    const rowTotalFinal = sheet.addRow(['', '', 'TOTAL FINAL A PAGAR', totalToPay]);
    ['A', 'B', 'C', 'D'].forEach(col => {
      rowTotalFinal.getCell(col).font = { bold: true };
    });
    borderRows.push(rowTotalFinal);

    borderRows.forEach(row => {
      ['A', 'B', 'C', 'D'].forEach(col => {
        row.getCell(col).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });
    });

    sheet.addRow(['', '', '', '']);
    const generatedRow = sheet.addRow([`GENERADO POR RUTAPAY - ${new Date().toLocaleDateString('es-CL')}`, '', '', '']);
    sheet.mergeCells(`A${generatedRow.number}:D${generatedRow.number}`);
    generatedRow.font = { italic: true, color: { argb: 'FF888888' }, size: 10 };
    generatedRow.getCell(1).alignment = { horizontal: 'center' };
  }

  // Si no hay choferes, crear una hoja vacía para que ExcelJS no tire error
  if (!drivers || drivers.length === 0) {
    workbook.addWorksheet('Sin Choferes');
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="RutaPay_General_${month}_${year}.xlsx"`);
  
  await workbook.xlsx.write(res);
  res.end();
});

// Eliminar viaje
app.delete('/api/trips/:id', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });

  const { id } = req.params;
  const driver_id = req.user.id;

  const { data, error } = await supabase
    .from('trips')
    .delete()
    .eq('id', id)
    .eq('driver_id', driver_id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Viaje no encontrado' });
  res.json({ message: 'Viaje eliminado', trip: data[0] });
});

// Editar viaje
app.put('/api/trips/:id', authMiddleware, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no conectada' });

  const { id } = req.params;
  const driver_id = req.user.id;
  const { amount, origin, destination, date } = req.body;

  const { data, error } = await supabase
    .from('trips')
    .update({ amount, origin, destination, date })
    .eq('id', id)
    .eq('driver_id', driver_id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Viaje no encontrado' });
  res.json({ message: 'Viaje actualizado', trip: data[0] });
});

app.listen(PORT, () => {
  console.log(`Servidor de RutaPay corriendo en http://localhost:${PORT}`);
});
