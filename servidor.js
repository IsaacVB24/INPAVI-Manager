const express = require('express');
const session = require('express-session');
const path = require('path');
const rutas = require('./rutas');
const https = require('https');
const fs = require('fs');
const helmet = require('helmet');

const puertoHTTPS = 8444;

const app = express();

app.use(helmet());

// Configurar la Política de Seguridad de Contenido con Helmet.js
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://code.jquery.com", "https://cdn.jsdelivr.net"]
    },
  })
);

// Middleware para redirigir de HTTP a HTTPS
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Configurar el middleware de express-session
app.use(session({
  secret: process.env.SECRETO,
  resave: false,
  saveUninitialized: true,
  rolling: true,
  proxy: true,
  cookie: {
    maxAge: 20 * 60 * 1000, // 20 minutos en milisegundos
    secure: true
  }
}));

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para manejar datos de formularios y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Usar el archivo de rutas
app.use('/', rutas);

// Opciones de SSL
const opcionesSSL = {
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('certificate.crt')
};

// Crear y iniciar el servidor HTTPS
const servidorHTTPS = https.createServer(opcionesSSL, app);

servidorHTTPS.listen(puertoHTTPS, () => {
  console.log(`Servidor HTTPS iniciado en el puerto ${puertoHTTPS}`);
  console.log('Esperando conexión segura...');
});