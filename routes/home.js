const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const destacados = db.prepare('SELECT * FROM products WHERE activo = 1 ORDER BY created_at DESC LIMIT 8').all();
  const slides = db.prepare('SELECT * FROM slides WHERE activo = 1 ORDER BY orden ASC').all();
  res.render('index', { destacados, slides, currentPage: 'home' });
});

router.get('/politicas', (req, res) => {
  const compra = db.prepare('SELECT contenido FROM policies WHERE tipo = ?').get('compra');
  const cambio = db.prepare('SELECT contenido FROM policies WHERE tipo = ?').get('cambio');
  res.render('policies', { compra: compra ? compra.contenido : '', cambio: cambio ? cambio.contenido : '', currentPage: 'politicas' });
});

router.get('/giftcard', (req, res) => {
  const info = db.prepare('SELECT * FROM giftcard_info LIMIT 1').get();
  res.render('giftcard', { info, currentPage: 'giftcard' });
});

router.get('/sitemap.xml', (req, res) => {
  const products = db.prepare('SELECT id, nombre FROM products WHERE activo = 1').all();
  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
  const categorias = ['flats', 'plataformas', 'bailarinas', 'tacones'];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url><loc>${siteUrl}/</loc><priority>1.0</priority></url>\n`;
  xml += `  <url><loc>${siteUrl}/sale</loc><priority>0.8</priority></url>\n`;
  categorias.forEach(c => { xml += `  <url><loc>${siteUrl}/${c}</loc><priority>0.9</priority></url>\n`; });
  products.forEach(p => { xml += `  <url><loc>${siteUrl}/producto/${p.id}</loc><priority>0.7</priority></url>\n`; });
  xml += '</urlset>';
  res.header('Content-Type', 'application/xml').send(xml);
});

module.exports = router;
