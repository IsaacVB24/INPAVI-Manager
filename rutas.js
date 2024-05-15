const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('./baseDeDatos');

// Ruta inicial, muestra login.html
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'login.html'));
});

// Ruta para verificar el inicio de sesión
router.post('/login', (req, res) => {
  const { correo, contraseña } = req.body;

  // Buscar el usuario en la base de datos por correo y contraseña
  db.get('SELECT * FROM usuarios WHERE correo = ? AND contraseña = ?', [correo, contraseña], (err, row) => {
    if (err) {
      console.error('Error al buscar usuario:', err);
      res.status(500).json({ mensaje: 'Error al buscar usuario en la base de datos' });
    } else {
      if (row) {
        // Usuario encontrado, responder con "OK"
        res.json({ mensaje: 'OK' });
      } else {
        // Usuario no encontrado, responder con "El usuario no existe"
        res.status(404).json({ mensaje: 'El usuario no existe' });
      }
    }
  });
});

module.exports = router;