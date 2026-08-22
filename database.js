const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const db = new Database(path.join(__dirname, 'vogashoes.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK(categoria IN ('flats', 'plataformas', 'bailarinas', 'tacones')),
    descripcion TEXT DEFAULT '',
    precio REAL NOT NULL,
    en_oferta INTEGER DEFAULT 0,
    precio_oferta REAL,
    imagen TEXT DEFAULT '',
    imagenes TEXT DEFAULT '[]',
    tallas TEXT NOT NULL DEFAULT '[]',
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL UNIQUE CHECK(tipo IN ('compra', 'cambio')),
    contenido TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imagen TEXT NOT NULL DEFAULT '',
    titulo TEXT DEFAULT '',
    subtitulo TEXT DEFAULT '',
    orden INTEGER DEFAULT 0,
    activo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS giftcard_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion TEXT DEFAULT '',
    monto_minimo REAL DEFAULT 20,
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL DEFAULT ''
  );
`);

try {
  db.exec(`ALTER TABLE products ADD COLUMN imagenes TEXT DEFAULT '[]'`);
} catch (e) {}

const initAdmin = db.prepare('SELECT id FROM admin LIMIT 1').get();
if (!initAdmin) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
  db.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run(username, password);
  console.log('Admin user created');
}

const compraPolicy = db.prepare('SELECT id FROM policies WHERE tipo = ?').get('compra');
if (!compraPolicy) {
  db.prepare('INSERT INTO policies (tipo, contenido) VALUES (?, ?)').run('compra', '');
}

const cambioPolicy = db.prepare('SELECT id FROM policies WHERE tipo = ?').get('cambio');
if (!cambioPolicy) {
  db.prepare('INSERT INTO policies (tipo, contenido) VALUES (?, ?)').run('cambio', '');
}

const giftcardInfo = db.prepare('SELECT id FROM giftcard_info LIMIT 1').get();
if (!giftcardInfo) {
  db.prepare('INSERT INTO giftcard_info (descripcion, monto_minimo) VALUES (?, ?)').run('Tarjetas de regalo Vogashoes', 20);
}

const defaults = [
  ['instagram_url', 'https://www.instagram.com/vogashoes'],
  ['whatsapp_url', 'https://wa.me/584246582763'],
  ['logo_tipo', 'texto'],
  ['logo_texto', 'Voga Shoes'],
  ['logo_imagen', ''],
  ['slogan', 'Elegancia que camina contigo'],
  ['footer_email', 'info@vogashoes.com'],
  ['footer_telefono', '+58 424-6582763'],
  ['cat_icon_flats', 'fas fa-shoe-prints'],
  ['cat_icon_plataformas', 'fas fa-arrow-up'],
  ['cat_icon_bailarinas', 'fas fa-female'],
  ['cat_icon_tacones', 'fas fa-chevron-circle-up']
];
const insertSetting = db.prepare('INSERT OR IGNORE INTO site_settings (clave, valor) VALUES (?, ?)');
for (const [clave, valor] of defaults) {
  insertSetting.run(clave, valor);
}

module.exports = db;
