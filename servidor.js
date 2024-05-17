const express = require('express');
const session = require('express-session');
const path = require('path');
const rutas = require('./rutas');

const puerto = 3000;
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

app.listen(puerto, () => {
  console.log(`Servidor en ejecución en el puerto ${puerto}`);
});