# Despliegue con Nginx

Guía para desplegar el Formulario de Solicitud HC en un servidor con Nginx.

## Requisitos previos

- Node.js 18+ y npm
- PostgreSQL
- Nginx
- PM2 (opcional, recomendado para producción)

---

## 1. Instalar dependencias en el servidor

```bash
# Node.js (si no está instalado)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Nginx
sudo apt install -y nginx

# PM2 (gestor de procesos)
sudo npm install -g pm2
```

---

## 2. Desplegar la aplicación

```bash
# Clonar o copiar el proyecto al servidor
cd /var/www  # o la ruta que prefieras
# git clone ... o scp -r Formulario-solicitud-HC usuario@servidor:/var/www/

cd Formulario-solicitud-HC

# Instalar dependencias
npm install --production

# Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con las credenciales de BD del servidor
```

---

## 3. Iniciar la aplicación con PM2

```bash
cd /var/www/Formulario-solicitud-HC
pm2 start config/ecosystem.config.js

# Ver estado
pm2 status

# Iniciar al reiniciar el servidor
pm2 save
pm2 startup
```

---

## 4. Configurar Nginx

```bash
# Copiar la configuración
sudo cp config/nginx.conf.example /etc/nginx/sites-available/formulario-hc

# Editar server_name si tienes dominio
sudo nano /etc/nginx/sites-available/formulario-hc

# Habilitar el sitio
sudo ln -sf /etc/nginx/sites-available/formulario-hc /etc/nginx/sites-enabled/

# Verificar y recargar
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Verificar

- **Formulario:** http://TU_IP o http://tu-dominio.com
- **Admin:** http://TU_IP/admin.html

---

## Comandos útiles

| Acción | Comando |
|--------|---------|
| Reiniciar app | `pm2 restart formulario-hc` |
| Ver logs | `pm2 logs formulario-hc` |
| Ver estado | `pm2 status` |
| Recargar Nginx | `sudo systemctl reload nginx` |

---

## HTTPS (opcional con Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```
