require('dotenv').config();
const db = require('./database');

const products = [
  {
    nombre: 'Flats Clásicas Negras',
    categoria: 'flats',
    descripcion: 'Elegantes flats negras con punta redonda. Perfectas para el día a día con un toque sofisticado. Material: cuero genuino. Suela antideslizante.',
    precio: 45.00,
    en_oferta: 1,
    precio_oferta: 35.00,
    tallas: ['36', '37', '38', '39']
  },
  {
    nombre: 'Flats Doradas',
    categoria: 'flats',
    descripcion: 'Flats doradas con detalles brillantes. Ideales para ocasiones especiales. Combínalas con cualquier outfit elegante.',
    precio: 55.00,
    en_oferta: 0,
    precio_oferta: null,
    tallas: ['35', '36', '37', '38', '39', '40']
  },
  {
    nombre: 'Plataformas Cuña Beige',
    categoria: 'plataformas',
    descripcion: 'Plataformas tipo cuña en tono beige. Cómodas y elegantes, perfectas para el verano. Altura: 8cm.',
    precio: 65.00,
    en_oferta: 1,
    precio_oferta: 49.99,
    tallas: ['36', '37', '38']
  },
  {
    nombre: 'Plataformas Negras',
    categoria: 'plataformas',
    descripcion: 'Plataformas negras con tiras ajustables. Modernas y versátiles. Altura: 10cm.',
    precio: 72.00,
    en_oferta: 0,
    precio_oferta: null,
    tallas: ['34', '35', '36', '37', '38', '39', '40']
  },
  {
    nombre: 'Bailarinas Clásicas',
    categoria: 'bailarinas',
    descripcion: 'Bailarinas clásicas en color nude. Un básico que no puede faltar en tu armario. Material: gamuza.',
    precio: 39.99,
    en_oferta: 0,
    precio_oferta: null,
    tallas: ['35', '36', '37', '38', '39']
  },
  {
    nombre: 'Bailarinas con Moño',
    categoria: 'bailarinas',
    descripcion: 'Bailarinas elegantes con moño decorativo en color rojo. Perfectas para darle color a tu look.',
    precio: 42.00,
    en_oferta: 1,
    precio_oferta: 32.00,
    tallas: ['36', '37', '38', '39', '40']
  },
  {
    nombre: 'Tacones Stiletto',
    categoria: 'tacones',
    descripcion: 'Tacones stiletto negros con punta fina. El clásico que toda mujer necesita. Altura: 12cm.',
    precio: 89.99,
    en_oferta: 0,
    precio_oferta: null,
    tallas: ['36', '37', '38', '39']
  },
  {
    nombre: 'Tacones Plataforma',
    categoria: 'tacones',
    descripcion: 'Tacones con plataforma delantera en color vino tinto. Altura total: 14cm, plataforma: 4cm.',
    precio: 95.00,
    en_oferta: 1,
    precio_oferta: 75.00,
    tallas: ['35', '36', '37', '38', '39', '40']
  },
  {
    nombre: 'Flats Estampadas',
    categoria: 'flats',
    descripcion: 'Flats con estampado floral. Alegres y primaverales. Material textil de alta calidad.',
    precio: 48.00,
    en_oferta: 0,
    precio_oferta: null,
    tallas: ['36', '37', '38']
  },
  {
    nombre: 'Tacones Transparentes',
    categoria: 'tacones',
    descripcion: 'Tacones con detalles transparentes y tiras doradas. Modernos y sensuales. Altura: 10cm.',
    precio: 110.00,
    en_oferta: 0,
    precio_oferta: null,
    tallas: ['36', '37', '38', '39']
  }
];

const stmt = db.prepare(`INSERT INTO products (nombre, categoria, descripcion, precio, en_oferta, precio_oferta, imagen, imagenes, tallas)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const insertMany = db.transaction((prods) => {
  for (const p of prods) {
    const imgs = p.imagen ? [p.imagen] : [];
    stmt.run(p.nombre, p.categoria, p.descripcion, p.precio, p.en_oferta, p.precio_oferta, p.imagen || '', JSON.stringify(imgs), JSON.stringify(p.tallas));
  }
});

const existing = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (existing.count === 0) {
  insertMany(products);
  console.log('Seed data inserted: ' + products.length + ' products');
} else {
  console.log('Products already exist (' + existing.count + ' found). Skipping seed.');
}

// Seed default policies
const compraContent = `
<h3>Formas de Pago</h3>
<p>Aceptamos pagos en efectivo, transferencias bancarias y depósitos. Una vez realizado el pago, enviar el comprobante por WhatsApp para confirmar la orden.</p>
<h3>Proceso de Compra</h3>
<ul>
  <li>Selecciona el producto y la talla deseada</li>
  <li>Contáctanos por WhatsApp o Instagram para verificar disponibilidad</li>
  <li>Realiza el pago y envía el comprobante</li>
  <li>Recibirás confirmación y el tiempo estimado de entrega</li>
</ul>
<h3>Envíos</h3>
<p>Realizamos envíos a todo el país. El costo de envío depende de la ubicación y se acuerda al momento de la compra.</p>
`;

const cambioContent = `
<h3>Plazo de Cambio</h3>
<p>Dispones de 7 días hábiles a partir de la recepción del producto para solicitar un cambio.</p>
<h3>Condiciones</h3>
<ul>
  <li>El calzado debe estar en perfectas condiciones, sin uso y en su empaque original</li>
  <li>Se aceptan cambios por talla o por otro modelo de igual valor</li>
  <li>Si el cambio es por un producto de mayor valor, deberás pagar la diferencia</li>
  <li>Si es por un producto de menor valor, no se realiza reembolso de la diferencia</li>
</ul>
<h3>Proceso de Cambio</h3>
<p>Contáctanos por WhatsApp o Instagram para gestionar el cambio. Los gastos de envío corren por cuenta del cliente, excepto si el cambio es por defecto de fábrica.</p>
`;

const compraDb = db.prepare('SELECT contenido FROM policies WHERE tipo = ?').get('compra');
if (!compraDb || !compraDb.contenido) {
  db.prepare('UPDATE policies SET contenido = ? WHERE tipo = ?').run(compraContent, 'compra');
}

const cambioDb = db.prepare('SELECT contenido FROM policies WHERE tipo = ?').get('cambio');
if (!cambioDb || !cambioDb.contenido) {
  db.prepare('UPDATE policies SET contenido = ? WHERE tipo = ?').run(cambioContent, 'cambio');
}

console.log('Seed completed successfully!');
console.log('');
console.log('Default admin credentials:');
console.log('  Username: ' + (process.env.ADMIN_USERNAME || 'admin'));
console.log('  Password: ' + (process.env.ADMIN_PASSWORD || 'admin123'));
console.log('');
console.log('Run: npm start');
