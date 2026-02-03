-- Tabla de solicitudes de copia de historia clínica
CREATE TABLE IF NOT EXISTS solicitudes (
  ref_id TEXT PRIMARY KEY,
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo_solicitud TEXT,
  fecha DATE,
  nombre_paciente TEXT,
  no_documento TEXT,
  tipo_documento TEXT,
  entidad_aseguradora TEXT,
  fecha_ultima_atencion DATE,
  correo TEXT,
  telefonos TEXT,
  documentos_solicitados JSONB,
  especifique_partes TEXT,
  motivos_solicitud JSONB,
  cual_otro TEXT,
  nombre_firma TEXT,
  firma_paciente TEXT,  /* imagen de la firma del paciente en base64 (data URL PNG) */
  cedula_paciente TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  nombre_solicitante TEXT,
  trae_carta TEXT,
  trae_copia_docs TEXT,
  nombre_funcionario TEXT,
  firma_funcionario TEXT,  /* imagen firma del funcionario (por tercero) en base64 */
  nombre_paciente_tercero TEXT,
  fecha_entrega DATE,
  cedula_tercero TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
