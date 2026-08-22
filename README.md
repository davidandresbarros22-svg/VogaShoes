# Voga Shoes - Tienda de Calzado Femenino

Sitio web catálogo para Voga Shoes, una tienda de calzado para dama.

## Tecnologías

- Node.js + Express
- EJS (templates)
- SQLite (base de datos)
- Multer (subida de imágenes)
- bcrypt (autenticación)
- express-session (sesiones)

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Configuración

Editar el archivo `.env`:

```
PORT=3000
SESSION_SECRET=tu_secreto_aqui
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Población inicial de datos

```bash
npm run seed
```

Esto crea:
- 10 productos de ejemplo
- Políticas de compra y cambio por defecto
- Usuario admin (según `.env`)

## Iniciar

```bash
npm start
```

El sitio corre en `http://localhost:3000`

## Rutas

### Frontend
- `/` - Página principal con slider y destacados
- `/flats`, `/plataformas`, `/bailarinas`, `/tacones` - Catálogo por categoría
- `/sale` - Productos en oferta
- `/giftcard` - Información de Gift Cards
- `/politicas` - Políticas de compra y cambio
- `/producto/:id` - Detalle del producto

### Admin
- `/admin/login` - Inicio de sesión
- `/admin` - Dashboard
- `/admin/productos` - CRUD de productos
- `/admin/politicas` - Editor de políticas
- `/admin/slides` - Administrar sliders del home
- `/admin/giftcard` - Configurar Gift Card
- `/admin/ajustes` - Cambiar credenciales

## Deploy

### Opción 1: Render

1. Crear servicio Web en https://render.com
2. Build Command: `npm install`
3. Start Command: `node app.js`
4. Agregar variables de entorno desde `.env`

### Opción 2: Railway

1. Crear proyecto en https://railway.app
2. Conectar repositorio de GitHub
3. Start Command: `node app.js`
4. Agregar variables de entorno

### Opción 3: VPS / Hosting propio

```bash
npm install
npm run seed
node app.js
```

Usar PM2 para producción:

```bash
npm install -g pm2
pm2 start app.js --name vogashoes
```

## Estructura del Proyecto

```
voga/
├── app.js              # Entry point
├── database.js         # Configuración SQLite
├── seed.js             # Datos iniciales
├── .env                # Variables de entorno
├── public/
│   ├── css/style.css
│   ├── js/main.js
│   ├── favicon.svg
│   └── uploads/        # Imágenes subidas
├── views/
│   ├── partials/       # Header, Footer, Admin Nav
│   ├── admin/          # Vistas del panel admin
│   └── *.ejs           # Vistas del frontend
├── routes/             # Rutas Express
└── middleware/         # Auth middleware
```
