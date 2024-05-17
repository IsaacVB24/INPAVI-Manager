const express = require('express');
const path = require('path');
const rutas = require('./rutas');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('./baseDeDatos'); // Asegúrate de tener este módulo configurado correctamente
const bcrypt = require('bcrypt');

// Iniciar el servidor en el puerto 3000
const puerto = 3000;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: '!"#INPAVI-manager.DesarrolloD3LB4ck3nD.', // Cambia esto por una cadena secreta fuerte
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Cambia a true si usas HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

// Configuración de la estrategia local
passport.use(new LocalStrategy(
  { usernameField: 'correo' },
  (correo, contraseña, done) => {
    db.get('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: 'Correo no encontrado' });
      }
      const match = await bcrypt.compare(contraseña, user.contraseña);
      if (!match) {
        return done(null, false, { message: 'Contraseña incorrecta' });
      }
      return done(null, user);
    });
  }
));

// Serialización y deserialización del usuario
passport.serializeUser((user, done) => {
  done(null, user.id_usuario);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM usuarios WHERE id_usuario = ?', [id], (err, user) => {
    done(err, user);
  });
});

// Middleware para proteger rutas
function requireLogin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

// Configurar el middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para analizar datos de formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Agrega soporte para JSON

// Usar las rutas definidas en rutas.js
app.use('/', rutas);

// Inicia el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor en ejecución en el puerto ${puerto}`);
});