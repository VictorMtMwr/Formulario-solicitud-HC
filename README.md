# Formulario Solicitud HC

Formulario de solicitud de copia de historias clínicas para MEDIHELP.

## Estructura del proyecto

```
Formulario-solicitud-HC/
├── config/                 # Configuración de despliegue
│   ├── ecosystem.config.js # PM2
│   └── nginx.conf.example  # Nginx
├── database/
│   └── init-db.sql         # Script de creación de tablas
├── public/                 # Archivos estáticos (frontend)
│   ├── index.html          # Formulario público
│   ├── admin.html          # Panel de administración
│   ├── css/
│   ├── js/
│   └── assets/
├── scripts/
│   └── view-db.js          # Ver registros en consola
├── src/                    # Código del servidor (backend)
│   ├── index.js            # Entrada principal
│   └── db.js               # Conexión PostgreSQL
├── uploads/                # Archivos subidos (PDFs)
│   └── cedulas/
├── .env.example
├── package.json
└── DEPLOY.md               # Guía de despliegue
```

## Inicio rápido

```bash
npm install
cp .env.example .env
# Editar .env con credenciales de PostgreSQL
npm start
```

- Formulario: http://localhost:3000
- Admin: http://localhost:3000/admin.html
