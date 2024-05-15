const express = require('express');
const path = require('path');
const rutas = require('./rutas'); // Importamos el módulo de rutas
// Iniciar el servidor en el puerto 3000
const puerto = 3000;

const app = express();

// Configurar el middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para analizar datos de formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Agrega soporte para JSON

// Usar las rutas definidas en rutas.js
app.use('/', rutas);

app.listen(puerto, () => {
  console.log(`Servidor en ejecución en el puerto ${puerto}`);
});