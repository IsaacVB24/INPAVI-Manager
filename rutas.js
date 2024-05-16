const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('./baseDeDatos');

// Ruta inicial, muestra login.html
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'login.html'));
});

// Ruta para dar de alta usuarios
router.get('/crearCuenta', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'crearCuenta.html'));
});

// Ruta para recuperar cuenta
router.get('/recuperarCuenta', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'recuperarCuenta.html'));
});

// Ruta para pantalla de espera de verificación
router.get('/verificacion', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'verificacion.html'));
});

// Ruta para verificar el inicio de sesión
router.post('/login', (req, res) => {
  const { correo, contraseña } = req.body;

  // Buscar el usuario en la base de datos por correo y contraseña
  db.get('SELECT * FROM usuarios WHERE correo = ? AND contraseña = ?', [correo, contraseña], (err, row) => {
    if (err) {
      console.error('Error al buscar usuario:', err);
      res.status(500);
    } else {
      if (row) {
        // Usuario encontrado, responder con "OK"
        res.status(200);
      }
    }
  });
});

// Ruta para validar si un correo ya existe
router.post('/altaUsuario', (req, res) => {
  const {correo} = req.body;
  // Buscar el correo en la base de datos por correo y contraseña
  db.get('SELECT 1 FROM usuarios WHERE correo = ?', [correo], (err, row) => {
    if (err) {
      console.error('Error al buscar el correo:', err);
      res.status(500).json({ mensaje: 'Error al buscar correo en la base de datos' });
    } else {
      if (row) {
        // Usuario encontrado, responder con "OK"
        res.status(200).json({mensaje: 'OK'});
      } else {
        // Usuario no encontrado, responder con "El usuario no existe"
        res.status(404).json({ mensaje: 'El correo no existe' });
      }
    }
  });
});

// Obtener las sedes
router.get('/obtenerSedes', (req, res) => {
  db.all('SELECT sede FROM sedes;', (err, rows) => {
    if(err) {
      res.status(500).json({ mensaje: 'No se pudieron consultar las sedes' });
    } else {
      const sedes = [];
      rows.forEach(sede => {
        sedes.push(sede);
      });
      res.status(200).json(sedes);
    }
  });
});

// Obtener los roles
router.get('/obtenerRoles', (req, res) => {
  db.all('SELECT rol FROM roles;', (err, rows) => {
    if(err) {
      res.status(500).json({ mensaje: 'No se pudieron consultar los roles' });
    } else {
      const roles = [];
      rows.forEach(rol => {
        roles.push(rol);
      });
      res.status(200).json(roles);
    }
  });
});

module.exports = router;