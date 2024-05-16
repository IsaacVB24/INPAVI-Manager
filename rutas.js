const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('./baseDeDatos');
const bcrypt = require('bcrypt');

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
router.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    // Cifrar la contraseña proporcionada
    const hashedPassword = await encriptarContraseña(contraseña);

    // Buscar el usuario en la base de datos por correo y contraseña cifrada
    db.get('SELECT 1 FROM usuarios WHERE correo = ? AND contraseña = ?', [correo, hashedPassword], (err, row) => {
      if (err) {
        console.error('Error al buscar usuario:', err);
        res.status(500).json({ mensaje: 'Error al buscar usuario en la base de datos' });
      } else {
        if (row) {
          // Usuario encontrado, responder con "OK"
          res.status(200).json({ mensaje: 'Usuario encontrado', usuario: row });
        } else {
          // Usuario no encontrado
          res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
      }
    });
  } catch (error) {
    console.error('Error al cifrar la contraseña:', error);
    res.status(500).json({ mensaje: 'Error al cifrar la contraseña' });
  }
});

// Ruta para validar si un correo ya existe y dar de alta a un usuario
router.post('/altaUsuario', (req, res) => {
  const { correo, apellido_materno, apellido_paterno, telefono, contraseña, nombre_usuario, id_rol, id_sede } = req.body;

  // Validar que todos los campos necesarios estén presentes
  if (!correo || !apellido_materno || !apellido_paterno || !telefono || !contraseña || !nombre_usuario || !id_rol || !id_sede) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  const hash = encriptarContraseña(contraseña);

  // Intentar insertar el usuario en la base de datos
  db.run('INSERT INTO usuarios (correo, apellido_materno, apellido_paterno, telefono, contraseña, nombre_usuario, id_rol, id_sede) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', 
  [correo, apellido_materno, apellido_paterno, telefono, hash, nombre_usuario, id_rol, id_sede], (err) => {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        // Manejar el caso donde el correo ya existe
        res.status(409).json({ mensaje: 'El correo ya está registrado' });
      } else {
        console.error('Error al insertar el usuario:', err);
        res.status(500).json({ mensaje: 'Error al insertar el usuario en la base de datos' });
      }
    } else {
      res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
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

// Función para encriptar la contraseña
async function encriptarContraseña(contraseña) {
  try {
      // Genera un hash de la contraseña con una sal aleatoria
      const hash = await bcrypt.hash(contraseña, 10);
      return hash;
  } catch (error) {
      throw error;
  }
}

module.exports = router;