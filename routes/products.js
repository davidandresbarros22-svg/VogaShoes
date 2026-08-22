const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/sale', (req, res) => {
  const productos = db.prepare('SELECT * FROM products WHERE activo = 1 AND en_oferta = 1 ORDER BY created_at DESC').all();
  res.render('sale', { productos, currentPage: 'sale' });
});

router.get('/:categoria', (req, res, next) => {
  const categorias = ['flats', 'plataformas', 'bailarinas', 'tacones'];
  const cat = req.params.categoria.toLowerCase();
  if (!categorias.includes(cat)) return next();
  const productos = db.prepare('SELECT * FROM products WHERE activo = 1 AND categoria = ? ORDER BY created_at DESC').all(cat);
  res.render('catalog', { productos, categoria: cat, currentPage: cat });
});

router.get('/producto/:id', (req, res) => {
  const producto = db.prepare('SELECT * FROM products WHERE id = ? AND activo = 1').get(req.params.id);
  if (!producto) return res.redirect('/');
  const relacionados = db.prepare('SELECT * FROM products WHERE categoria = ? AND id != ? AND activo = 1 LIMIT 4').all(producto.categoria, producto.id);
  res.render('product', { producto, relacionados, currentPage: '' });
});

module.exports = router;
