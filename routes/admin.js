const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Solo imágenes (jpg, png, gif, webp, svg) o video (mp4, webm, mov)'));
  },
  limits: { fileSize: 20 * 1024 * 1024 }
});

router.use(requireAdmin);

router.use((req, res, next) => {
  res.locals.currentPage = '';
  next();
});

router.get('/', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM products').get();
  const activos = db.prepare('SELECT COUNT(*) as count FROM products WHERE activo = 1').get();
  const ofertas = db.prepare('SELECT COUNT(*) as count FROM products WHERE en_oferta = 1').get();
  res.render('admin/dashboard', { total: total.count, activos: activos.count, ofertas: ofertas.count, admin: req.session.adminUsername });
});

router.get('/productos', (req, res) => {
  const productos = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.render('admin/products', { productos, admin: req.session.adminUsername, query: req.query });
});

router.get('/productos/nuevo', (req, res) => {
  res.render('admin/product-form', { producto: null, admin: req.session.adminUsername });
});

router.post('/productos', upload.array('imagenes', 5), (req, res) => {
  const { nombre, categoria, descripcion, precio, en_oferta, precio_oferta, tallas } = req.body;
  const imagenes = req.files ? req.files.map(function(f) { return '/uploads/' + f.filename; }) : [];
  const imagen = imagenes.length > 0 ? imagenes[0] : '';
  const tallasArr = tallas ? (Array.isArray(tallas) ? tallas : [tallas]) : [];
  db.prepare(`INSERT INTO products (nombre, categoria, descripcion, precio, en_oferta, precio_oferta, imagen, imagenes, tallas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    nombre, categoria, descripcion || '', parseFloat(precio), en_oferta ? 1 : 0,
    en_oferta ? parseFloat(precio_oferta) : null, imagen, JSON.stringify(imagenes), JSON.stringify(tallasArr)
  );
  res.redirect('/admin/productos');
});

router.get('/productos/:id/editar', (req, res) => {
  const producto = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!producto) return res.redirect('/admin/productos');
  res.render('admin/product-form', { producto, admin: req.session.adminUsername });
});

router.post('/productos/:id', upload.array('imagenes', 5), (req, res) => {
  const { nombre, categoria, descripcion, precio, en_oferta, precio_oferta, tallas, activo, mantener_imagen } = req.body;
  const existente = db.prepare('SELECT imagen, imagenes FROM products WHERE id = ?').get(req.params.id);
  let imagenesExistentes = existente ? JSON.parse(existente.imagenes || '[]') : [];
  let imagenes = imagenesExistentes;

  if (req.files && req.files.length > 0) {
    imagenes = req.files.map(function(f) { return '/uploads/' + f.filename; });
    if (existente && existente.imagen && !mantener_imagen) {
      imagenesExistentes.forEach(function(img) {
        const imgPath = path.join(__dirname, '..', 'public', img);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });
    }
  }

  const imagen = imagenes.length > 0 ? imagenes[0] : (existente ? existente.imagen : '');
  const tallasArr = tallas ? (Array.isArray(tallas) ? tallas : [tallas]) : [];
  db.prepare(`UPDATE products SET nombre=?, categoria=?, descripcion=?, precio=?, en_oferta=?, precio_oferta=?, imagen=?, imagenes=?, tallas=?, activo=? WHERE id=?`).run(
    nombre, categoria, descripcion || '', parseFloat(precio), en_oferta ? 1 : 0,
    en_oferta ? parseFloat(precio_oferta) : null, imagen, JSON.stringify(imagenes), JSON.stringify(tallasArr), activo ? 1 : 0, req.params.id
  );
  res.redirect('/admin/productos');
});

router.post('/productos/:id/eliminar', (req, res) => {
  const producto = db.prepare('SELECT imagen, imagenes FROM products WHERE id = ?').get(req.params.id);
  if (producto) {
    var imgs = JSON.parse(producto.imagenes || '[]');
    if (imgs.length === 0 && producto.imagen) imgs = [producto.imagen];
    imgs.forEach(function(img) {
      const imgPath = path.join(__dirname, '..', 'public', img);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    });
  }
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.redirect('/admin/productos');
});

router.get('/politicas', (req, res) => {
  const compra = db.prepare('SELECT contenido FROM policies WHERE tipo = ?').get('compra');
  const cambio = db.prepare('SELECT contenido FROM policies WHERE tipo = ?').get('cambio');
  res.render('admin/policies-edit', { compra: compra ? compra.contenido : '', cambio: cambio ? cambio.contenido : '', admin: req.session.adminUsername });
});

router.post('/politicas', (req, res) => {
  const { compra, cambio } = req.body;
  db.prepare('UPDATE policies SET contenido = ?, updated_at = datetime(\'now\',\'localtime\') WHERE tipo = ?').run(compra || '', 'compra');
  db.prepare('UPDATE policies SET contenido = ?, updated_at = datetime(\'now\',\'localtime\') WHERE tipo = ?').run(cambio || '', 'cambio');
  res.redirect('/admin/politicas');
});

router.get('/slides', (req, res) => {
  const slides = db.prepare('SELECT * FROM slides ORDER BY orden ASC').all();
  res.render('admin/slides', { slides, admin: req.session.adminUsername });
});

router.post('/slides', upload.single('imagen'), (req, res) => {
  const { titulo, subtitulo, orden } = req.body;
  const imagen = req.file ? '/uploads/' + req.file.filename : '';
  db.prepare('INSERT INTO slides (imagen, titulo, subtitulo, orden) VALUES (?, ?, ?, ?)').run(imagen, titulo || '', subtitulo || '', parseInt(orden) || 0);
  res.redirect('/admin/slides');
});

router.post('/slides/:id/eliminar', (req, res) => {
  const slide = db.prepare('SELECT imagen FROM slides WHERE id = ?').get(req.params.id);
  if (slide && slide.imagen) {
    const imgPath = path.join(__dirname, '..', 'public', slide.imagen);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  db.prepare('DELETE FROM slides WHERE id = ?').run(req.params.id);
  res.redirect('/admin/slides');
});

router.get('/giftcard', (req, res) => {
  const info = db.prepare('SELECT * FROM giftcard_info LIMIT 1').get();
  res.render('admin/giftcard-edit', { info, admin: req.session.adminUsername });
});

router.post('/giftcard', upload.single('imagen'), (req, res) => {
  const { descripcion, monto_minimo, titulo, visual_logo, visual_titulo, visual_subtitulo } = req.body;
  const existing = db.prepare('SELECT id, imagen FROM giftcard_info LIMIT 1').get();
  const id = existing.id;
  let imagen = existing.imagen || '';
  if (req.file) {
    if (imagen) {
      const oldPath = path.join(__dirname, '..', 'public', imagen);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    imagen = '/uploads/' + req.file.filename;
  }
  db.prepare(`UPDATE giftcard_info SET descripcion=?, monto_minimo=?, titulo=?, imagen=?, visual_logo=?, visual_titulo=?, visual_subtitulo=?, updated_at=datetime('now','localtime') WHERE id=?`).run(
    descripcion || '', parseFloat(monto_minimo) || 20, titulo || 'Tarjeta de Regalo', imagen,
    visual_logo || 'Voga Shoes', visual_titulo || 'Gift Card', visual_subtitulo || 'El regalo perfecto', id
  );
  res.redirect('/admin/giftcard');
});

router.get('/ajustes', (req, res) => {
  const admin = db.prepare('SELECT id, username FROM admin WHERE id = ?').get(req.session.adminId);
  const socials = db.prepare('SELECT clave, valor FROM site_settings').all();
  const siteSettings = {};
  for (const s of socials) siteSettings[s.clave] = s.valor;
  res.render('admin/settings', { admin, siteSettings, error: null, success: null, adminUser: req.session.adminUsername });
});

router.post('/ajustes', upload.single('logo_imagen'), (req, res) => {
  const { current_password, new_username, new_password, confirm_password, instagram_url, whatsapp_url, logo_tipo, logo_texto, slogan, footer_instagram, footer_telefono, footer_descripcion, cat_icon_flats, cat_icon_plataformas, cat_icon_bailarinas, cat_icon_tacones } = req.body;
  const adminData = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.session.adminId);
  if (!bcrypt.compareSync(current_password, adminData.password)) {
    const admin = db.prepare('SELECT id, username FROM admin WHERE id = ?').get(req.session.adminId);
    const socials = db.prepare('SELECT clave, valor FROM site_settings').all();
    const siteSettings = {};
    for (const s of socials) siteSettings[s.clave] = s.valor;
    return res.render('admin/settings', { admin, siteSettings, error: 'Contraseña actual incorrecta', success: null, adminUser: req.session.adminUsername });
  }
  if (new_username) {
    db.prepare('UPDATE admin SET username = ? WHERE id = ?').run(new_username, req.session.adminId);
    req.session.adminUsername = new_username;
  }
  if (new_password) {
    if (new_password !== confirm_password) {
      const admin = db.prepare('SELECT id, username FROM admin WHERE id = ?').get(req.session.adminId);
      const socials = db.prepare('SELECT clave, valor FROM site_settings').all();
      const siteSettings = {};
      for (const s of socials) siteSettings[s.clave] = s.valor;
      return res.render('admin/settings', { admin, siteSettings, error: 'Las contraseñas no coinciden', success: null, adminUser: req.session.adminUsername });
    }
    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE admin SET password = ? WHERE id = ?').run(hash, req.session.adminId);
  }

  let logoImagen = db.prepare("SELECT valor FROM site_settings WHERE clave = 'logo_imagen'").get();
  logoImagen = logoImagen ? logoImagen.valor : '';
  if (req.file) {
    if (logoImagen) {
      const oldPath = path.join(__dirname, '..', 'public', logoImagen);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    logoImagen = '/uploads/' + req.file.filename;
  }

  const upsert = db.prepare('INSERT OR REPLACE INTO site_settings (clave, valor) VALUES (?, ?)');
  upsert.run('instagram_url', instagram_url || '');
  upsert.run('whatsapp_url', whatsapp_url || '');
  upsert.run('logo_tipo', logo_tipo || 'texto');
  upsert.run('logo_texto', logo_texto || 'Voga Shoes');
  upsert.run('logo_imagen', logoImagen);
  upsert.run('slogan', slogan || 'Elegancia que camina contigo');
  upsert.run('footer_instagram', footer_instagram || '@vogashoes');
  upsert.run('footer_telefono', footer_telefono || '');
  upsert.run('footer_descripcion', footer_descripcion || 'Tu destino para calzado femenino elegante y moderno. Calidad, estilo y comodidad en cada paso.');
  upsert.run('cat_icon_flats', cat_icon_flats || 'fas fa-shoe-prints');
  upsert.run('cat_icon_plataformas', cat_icon_plataformas || 'fas fa-arrow-up');
  upsert.run('cat_icon_bailarinas', cat_icon_bailarinas || 'fas fa-female');
  upsert.run('cat_icon_tacones', cat_icon_tacones || 'fas fa-chevron-circle-up');
  const admin = db.prepare('SELECT id, username FROM admin WHERE id = ?').get(req.session.adminId);
  const socials = db.prepare('SELECT clave, valor FROM site_settings').all();
  const siteSettings = {};
  for (const s of socials) siteSettings[s.clave] = s.valor;
  res.render('admin/settings', { admin, siteSettings, error: null, success: 'Ajustes guardados correctamente', adminUser: req.session.adminUsername });
});

module.exports = router;
