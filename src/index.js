require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { query } = require('./db');

const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const uploadsDir = path.join(rootDir, 'uploads', 'cedulas');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, timestamp + '_' + sanitizedName);
  }
});

const fileFilter = (req, file, cb) => {
  const isPdf = file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/x-pdf' ||
    (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
  if (isPdf) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'formulario-hc-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));
app.use(express.static(publicDir));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// Middleware de autenticación para admin
function requireAuth(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  res.status(401).json({ ok: false, message: 'Debes iniciar sesión' });
}

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    req.session.admin = true;
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, message: 'Usuario o contraseña incorrectos' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// Verificar sesión
app.get('/api/auth/check', (req, res) => {
  res.json({ ok: !!(req.session && req.session.admin) });
});

// Inicializar tabla al arrancar
async function initDb() {
  const sql = fs.readFileSync(path.join(rootDir, 'database', 'init-db.sql'), 'utf8');
  await query(sql);
}

// Convierte fila BD a objeto como espera el frontend
function rowToSolicitud(row) {
  if (!row) return null;
  return {
    id: row.ref_id,
    fechaSolicitud: row.fecha_solicitud,
    tipoSolicitud: row.tipo_solicitud,
    fecha: row.fecha,
    nombrePaciente: row.nombre_paciente,
    noDocumento: row.no_documento,
    tipoDocumento: row.tipo_documento,
    entidadAseguradora: row.entidad_aseguradora,
    fechaUltimaAtencion: row.fecha_ultima_atencion,
    correo: row.correo,
    telefonos: row.telefonos,
    documentosSolicitados: row.documentos_solicitados || [],
    especifiquePartes: row.especifique_partes,
    motivosSolicitud: row.motivos_solicitud || [],
    cualOtro: row.cual_otro,
    nombreFirma: row.nombre_firma,
    firmaPaciente: row.firma_paciente,
    cedulaPaciente: row.cedula_paciente,
    estado: row.estado || 'pendiente',
    nombreSolicitante: row.nombre_solicitante,
    traeCarta: row.trae_carta,
    traeCopiaDocs: row.trae_copia_docs,
    nombreFuncionario: row.nombre_funcionario,
    firmaFuncionario: row.firma_funcionario,
    nombrePacienteTercero: row.nombre_paciente_tercero,
    fechaEntrega: row.fecha_entrega,
    cedulaTercero: row.cedula_tercero,
  };
}

// Ruta para verificar conexión a PostgreSQL
app.get('/api/health/db', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as now, current_database() as db');
    res.json({
      ok: true,
      message: 'Conexión a PostgreSQL correcta',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error conectando a la BD:', err.message);
    res.status(500).json({
      ok: false,
      message: 'Error al conectar con la base de datos',
      error: err.message,
    });
  }
});

// POST: guardar nueva solicitud con archivos PDF
app.post('/api/solicitudes', (req, res, next) => {
  upload.fields([
    { name: 'cedulaPaciente', maxCount: 1 },
    { name: 'cedulaTercero', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ ok: false, message: err.message || 'Error al subir archivo' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const b = JSON.parse(req.body.data || '{}'); // Los datos vienen en req.body.data
    const files = req.files || {};
    await query(
      `INSERT INTO solicitudes (
        ref_id, fecha_solicitud, tipo_solicitud, fecha, nombre_paciente, no_documento,
        tipo_documento, entidad_aseguradora, fecha_ultima_atencion, correo, telefonos,
        documentos_solicitados, especifique_partes, motivos_solicitud, cual_otro,
        nombre_firma, firma_paciente, cedula_paciente, estado,
        nombre_solicitante, trae_carta, trae_copia_docs, nombre_funcionario, firma_funcionario,
        nombre_paciente_tercero, fecha_entrega, cedula_tercero
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)`,
      [
        b.id,
        b.fechaSolicitud || new Date().toISOString(),
        b.tipoSolicitud || null,
        b.fecha || null,
        b.nombrePaciente || null,
        b.noDocumento || null,
        b.tipoDocumento || null,
        b.entidadAseguradora || null,
        b.fechaUltimaAtencion || null,
        b.correo || null,
        b.telefonos || null,
        JSON.stringify(b.documentosSolicitados || []),
        b.especifiquePartes || null,
        JSON.stringify(b.motivosSolicitud || []),
        b.cualOtro || null,
        b.nombreFirma || null,
        b.firmaPaciente || null, /* imagen firma paciente (base64 data URL) */
        files.cedulaPaciente ? `/uploads/cedulas/${files.cedulaPaciente[0].filename}` : null,
        b.estado || 'pendiente',
        b.nombreSolicitante || null,
        b.traeCarta || null,
        b.traeCopiaDocs || null,
        b.nombreFuncionario || null,
        b.firmaFuncionario || null,
        b.nombrePacienteTercero || null,
        b.fechaEntrega || null,
        files.cedulaTercero ? `/uploads/cedulas/${files.cedulaTercero[0].filename}` : null,
      ]
    );
    res.status(201).json({ ok: true, id: b.id });
  } catch (err) {
    console.error('Error guardando solicitud:', err.message);
    res.status(500).json({ ok: false, message: 'Error al guardar la solicitud', error: err.message });
  }
});

// GET: listar todas las solicitudes (requiere login)
app.get('/api/solicitudes', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM solicitudes ORDER BY fecha_solicitud DESC'
    );
    const solicitudes = result.rows.map(rowToSolicitud);
    res.json(solicitudes);
  } catch (err) {
    console.error('Error listando solicitudes:', err.message);
    res.status(500).json({ ok: false, message: 'Error al listar solicitudes', error: err.message });
  }
});

// PATCH: actualizar solicitud (estado y datos de clínica) (requiere login)
app.patch('/api/solicitudes/:id', requireAuth, async (req, res) => {
  const refId = req.params.id;
  const { estado, traeCarta, traeCopiaDocs, nombreFuncionario, firmaFuncionario, fechaEntrega } = req.body;
  
  try {
    // Construir la query dinámicamente según los campos enviados
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (estado !== undefined) {
      updates.push(`estado = $${paramIndex++}`);
      values.push(estado);
    }
    if (traeCarta !== undefined) {
      updates.push(`trae_carta = $${paramIndex++}`);
      values.push(traeCarta);
    }
    if (traeCopiaDocs !== undefined) {
      updates.push(`trae_copia_docs = $${paramIndex++}`);
      values.push(traeCopiaDocs);
    }
    if (nombreFuncionario !== undefined) {
      updates.push(`nombre_funcionario = $${paramIndex++}`);
      values.push(nombreFuncionario);
    }
    if (firmaFuncionario !== undefined) {
      updates.push(`firma_funcionario = $${paramIndex++}`);
      values.push(firmaFuncionario);
    }
    if (fechaEntrega !== undefined) {
      updates.push(`fecha_entrega = $${paramIndex++}`);
      values.push(fechaEntrega || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ ok: false, message: 'No hay campos para actualizar' });
    }
    
    values.push(refId);
    const sql = `UPDATE solicitudes SET ${updates.join(', ')} WHERE ref_id = $${paramIndex} RETURNING *`;
    
    const result = await query(sql, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    }
    res.json({ ok: true, solicitud: rowToSolicitud(result.rows[0]) });
  } catch (err) {
    console.error('Error actualizando solicitud:', err.message);
    res.status(500).json({ ok: false, message: 'Error al actualizar', error: err.message });
  }
});

// Servir la aplicación
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

async function start() {
  fs.mkdirSync(uploadsDir, { recursive: true });
  await initDb();
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
    console.log(`Verificar BD: http://localhost:${PORT}/api/health/db`);
  });
}

start().catch((err) => {
  console.error('Error al iniciar:', err);
  process.exit(1);
});
