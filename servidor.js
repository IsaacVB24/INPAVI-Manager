const express = require('express');
const session = require('express-session');
const path = require('path');
const rutas = require('./rutas');
const https = require('https');
const fs = require('fs');

const puertoHTTPS = 8443; // Puerto HTTPS estándar

const app = express();

// Configurar el middleware de express-session
app.use(session({
  secret: 'secreto', // Se utiliza para firmar el ID de la sesión, puedes cambiarlo
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reinicia el temporizador de la sesión en cada solicitud, para que, después de 20 minutos de inactividad, se cierre la sesión
  cookie: {
    maxAge: 20 * 60 * 1000 // 20 minutos en milisegundos
  }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', rutas);

const opcionesSSL = {
  key: fs.readFileSync('clave_privada.pem'),
  cert: fs.readFileSync('certificado_autofirmado.pem')
};

const servidorHTTPS = https.createServer(opcionesSSL, app);

servidorHTTPS.listen(puertoHTTPS, () => {
  console.log(`Servidor HTTPS iniciado en el puerto ${puertoHTTPS}`);
  console.log(`Esperando conexión segura...`);
});

app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});