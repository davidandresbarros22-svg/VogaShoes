require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'voga_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use((req, res, next) => {
  const rows = db.prepare('SELECT clave, valor FROM site_settings').all();
  res.locals.settings = {};
  for (const row of rows) {
    res.locals.settings[row.clave] = row.valor;
  }
  next();
});

app.use('/admin', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/home'));
app.use('/', require('./routes/products'));

app.use((req, res) => {
  res.status(404).render('404', { currentPage: '' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Vogashoes corriendo en http://localhost:${PORT}`);
});
