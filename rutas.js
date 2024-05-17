const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('./baseDeDatos');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configurar Nodemailer para Outlook
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com', // Servidor SMTP de Outlook
  port: 587, // Puerto SMTP
  secure: false, // true para el puerto 465, false para otros puertos
  auth: {
    user: 'pruebas_back24@hotmail.com', // Tu dirección de correo de Outlook
    pass: '#Qwerty1234' // Tu contraseña de Outlook
  }
});

// Middleware para verificar si el usuario ha iniciado sesión
const verificarSesion = (req, res, next) => {
  if (req.session.usuario) {
    next(); // Si el usuario ha iniciado sesión, continuar
  } else {
    res.redirect('/');
  }
};

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
router.get('/verificacion', verificarSesion, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'verificacion.html'));
});

// Ruta para pantalla de alta de voluntario
router.get('/altaVoluntario', verificarSesion, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'altaVoluntario.html'));
});

// Ruta para verificar el inicio de sesión
router.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    // Buscar el usuario en la base de datos por correo
    db.get('SELECT contraseña FROM usuarios WHERE correo = ?', [correo], async (err, row) => {
      if (err) {
        console.error('Error al buscar usuario:', err);
        res.status(500).json({ mensaje: 'Error al buscar usuario en la base de datos' });
      } else {
        if (row) {
          // Verificar si la contraseña proporcionada coincide con la contraseña almacenada
          const match = await bcrypt.compare(contraseña, row.contraseña);
          if (match) {
            // Establecer la sesión del usuario
            req.session.usuario = { correo }; // Puedes agregar más información del usuario si lo necesitas
            res.status(200).json({ mensaje: 'Inicio de sesión correcto' });
          } else {
            res.status(401).json({ mensaje: 'Contraseña incorrecta' });
          }
        } else {
          res.status(404).json({ mensaje: 'Correo no encontrado' });
        }
      }
    });
  } catch (error) {
    console.error('Error al comparar contraseñas:', error);
    res.status(500).json({ mensaje: 'Error al comparar contraseñas' });
  }
});

// Ruta para validar si un correo ya existe y dar de alta a un usuario
router.post('/altaUsuario', async (req, res) => {
  const { correo, apellido_materno, apellido_paterno, telefono, contraseña, nombre_usuario, id_rol, id_sede } = req.body;

  // Validar que todos los campos necesarios estén presentes
  if (!correo || !apellido_materno || !apellido_paterno || !telefono || !contraseña || !nombre_usuario || !id_rol || !id_sede) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  try {
    // Encriptar la contraseña
    const hash = await encriptar(contraseña);

    const token = crypto.randomBytes(5).toString('hex'); // Generar token de 10 caracteres
    const hash_token = await encriptar(token);

    // Iniciar transacción
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Error al iniciar la transacción:', err);
          return res.status(500).json({ mensaje: 'Error al iniciar la transacción' });
        }

        db.run('INSERT INTO usuarios (correo, apellido_materno, apellido_paterno, telefono, contraseña, nombre_usuario, id_rol, id_sede, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [correo, apellido_materno, apellido_paterno, telefono, hash, nombre_usuario, id_rol, id_sede, 2], function (err) {
            if (err) {
              //console.error('Error al insertar el usuario:', err);
              db.run('ROLLBACK', rollbackErr => {
                if (rollbackErr) {
                  console.error('Error al hacer rollback:', rollbackErr);
                }
                if (err.code === 'SQLITE_CONSTRAINT') {
                  return res.status(409).json({ mensaje: 'El correo ya está registrado' });
                }
                return res.status(500).json({ mensaje: 'Error al insertar el usuario en la base de datos' });
              });
            } else {
              const userId = this.lastID; // Obtener el ID del usuario recién insertado
              db.run('INSERT INTO tokens (token, id_usuario) VALUES (?, ?)', [hash_token, userId], (err) => {
                if (err) {
                  console.error('Error al insertar el token:', err);
                  db.run('ROLLBACK', rollbackErr => {
                    if (rollbackErr) {
                      console.error('Error al hacer rollback:', rollbackErr);
                    }
                    return res.status(500).json({ mensaje: 'Error al insertar el token en la base de datos' });
                  });
                } else {
                  db.run('COMMIT', (commitErr) => {
                    if (commitErr) {
                      console.error('Error al hacer commit:', commitErr);
                      return res.status(500).json({ mensaje: 'Error al hacer commit en la base de datos' });
                    }
                    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });

                    // Enviar correo con el token
                    const mailOptions = {
                      from: 'pruebas_back24@hotmail.com',
                      to: correo,
                      subject: 'Verificación de cuenta - INPAVI MANAGER',
                      text: `Haz recibido un código para registrarte en el sistema, escríbelo en el campo solicitado para validar el correo. NO COMPARTAS EL CÓDIGO CON NADIE.

                      Tu token de verificación es: 
                      ${token}`
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                      if (error) {
                        console.error('Error al enviar correo:', error);
                      } else {
                        //console.log('Correo enviado: ' + info.response);
                      }
                    });
                  });
                }
              });
            }
          });
      });
    });
  } catch (error) {
    console.error('Error al encriptar la contraseña:', error);
    res.status(500).json({ mensaje: 'Error al encriptar la contraseña' });
  }
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
async function encriptar(contraseña) {
  try {
    // Genera un hash de la contraseña con una sal aleatoria
    const hash = await bcrypt.hash(contraseña, 10);
    return hash;
  } catch (error) {
    throw error;
  }
}

// Middleware para manejar rutas no encontradas
router.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'html', 'recursoNoEncontrado.html'));
});

module.exports = router;