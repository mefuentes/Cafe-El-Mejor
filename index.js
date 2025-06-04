const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

const clientes = [];
let nextClienteId = 1;
const productos = [
  {
    id: 1,
    nombre: 'Café en Grano 500g',
    descripcion: 'Aroma intenso y tostado medio. Ideal para espresso.',
    precio: 3200,
    imagen: '/images/cafe-grano.jpg'
  },
  {
    id: 2,
    nombre: 'Café Molido 250g',
    descripcion: 'Perfecto para cafeteras de filtro o prensa francesa.',
    precio: 1850,
    imagen: '/images/cafe-molido.jpg'
  },
  {
    id: 3,
    nombre: 'Kit Degustación',
    descripcion: 'Incluye 3 variedades: suave, intenso y orgánico.',
    precio: 4900,
    imagen: '/images/kit-degustacion.jpg'
  }
];

app.get('/', (req, res) => {
  res.render('index', { productos, user: req.session.user, carrito: req.session.carrito || [] });
});

app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.post('/register', (req, res) => {
  const { nombre, email, password } = req.body;
  if (clientes.find(c => c.email === email)) {
    return res.render('register', { error: 'El correo ya está registrado.' });
  }
  clientes.push({ id: nextClienteId++, nombre, email, password });
  res.redirect('/login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = clientes.find(c => c.email === email && c.password === password);
  if (user) {
    req.session.user = user;
    req.session.carrito = [];
    res.redirect('/');
  } else {
    res.render('login', { error: 'Credenciales incorrectas.' });
  }
});

app.post('/agregar', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const productoId = parseInt(req.body.id);
  const producto = productos.find(p => p.id === productoId);
  if (!req.session.carrito) req.session.carrito = [];
  req.session.carrito.push(producto);
  res.redirect('/');
});

app.get('/carrito', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('carrito', { carrito: req.session.carrito || [] });
});

app.post('/comprar', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  req.session.carrito = [];
  res.render('confirmacion');
});

app.listen(port, () => {
  console.log(`Servidor funcionando en http://localhost:${port}`);
});