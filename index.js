const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE clientes (id INTEGER PRIMARY KEY, nombre TEXT, email TEXT UNIQUE, password TEXT)");
  db.run("CREATE TABLE productos (id INTEGER PRIMARY KEY, nombre TEXT, descripcion TEXT, precio REAL, imagen TEXT)");
  const stmt = db.prepare("INSERT INTO productos (nombre, descripcion, precio, imagen) VALUES (?, ?, ?, ?)");
  stmt.run("Café en Grano 500g", "Aroma intenso y tostado medio. Ideal para espresso.", 3200, "/images/cafe-grano.jpg");
  stmt.run("Café Molido 250g", "Perfecto para cafeteras de filtro o prensa francesa.", 1850, "/images/cafe-molido.jpg");
  stmt.run("Kit Degustación", "Incluye 3 variedades: suave, intenso y orgánico.", 4900, "/images/kit-degustacion.jpg");
  stmt.finalize();
});

app.get('/', (req, res) => {
  db.all("SELECT * FROM productos", [], (err, productos) => {
    res.render('index', { productos, user: req.session.user, carrito: req.session.carrito || [] });
  });
});

app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.post('/register', (req, res) => {
  const { nombre, email, password } = req.body;
  const stmt = db.prepare("INSERT INTO clientes (nombre, email, password) VALUES (?, ?, ?)");
  stmt.run(nombre, email, password, function (err) {
    if (err) return res.render('register', { error: 'El correo ya está registrado.' });
    res.redirect('/login');
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM clientes WHERE email = ? AND password = ?", [email, password], (err, row) => {
    if (row) {
      req.session.user = row;
      req.session.carrito = [];
      res.redirect('/');
    } else {
      res.render('login', { error: 'Credenciales incorrectas.' });
    }
  });
});

app.post('/agregar', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const productoId = parseInt(req.body.id);
  db.get("SELECT * FROM productos WHERE id = ?", [productoId], (err, producto) => {
    if (!req.session.carrito) req.session.carrito = [];
    req.session.carrito.push(producto);
    res.redirect('/');
  });
});

app.listen(port, () => {
  console.log(`Servidor funcionando en http://localhost:${port}`);
});