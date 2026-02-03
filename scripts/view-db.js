#!/usr/bin/env node
/**
 * Ver contenido de la tabla solicitudes en la consola.
 * Uso: npm run db:view
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { query } = require('../src/db');

async function main() {
  try {
    const res = await query(
      'SELECT ref_id, nombre_paciente, no_documento, estado, fecha_solicitud FROM solicitudes ORDER BY fecha_solicitud DESC'
    );
    console.log('\n--- Base de datos:', process.env.DB_NAME, '---');
    console.log('Tabla: solicitudes | Registros:', res.rows.length, '\n');
    if (res.rows.length === 0) {
      console.log('(No hay solicitudes)\n');
      process.exit(0);
      return;
    }
    res.rows.forEach((r, i) => {
      const fecha = r.fecha_solicitud ? new Date(r.fecha_solicitud).toLocaleString('es-CO') : '-';
      console.log(`${i + 1}. ${r.ref_id} | ${r.nombre_paciente || '-'} | Doc: ${r.no_documento || '-'} | ${r.estado} | ${fecha}`);
    });
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
