const express = require('express');
const router = express.Router();
const path = require('path');
const bodyParser = require('body-parser');
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

// Middleware para verificar si el usuario ha iniciado sesión y redirigir según el estado
const verificarSesionYStatus = (req, res, next) => {
  const usuario = req.session.usuario;

  if (!usuario) {
    // Si el usuario no ha iniciado sesión, redirigir al inicio
    res.redirect('/');
    return;
  }

  // Obtener el estado y ruta a acceder del usuario
  const status = usuario.status;
  const ruta = req.path;

  /*
    0 -> Usuario dado de baja
    1 -> Usuario dado de alta
    2 -> En espera de que el usuario escriba el token
    3 -> En espera de que un delegado acepte la solicitud
  */

  // Verificar el estado del usuario y redirigir según corresponda
  switch (status) {
    case 0:
      // Estado 0: Usuario dado de baja
      // Redirigir siempre al inicio y cerrar sesión
      req.session.destroy(() => {
        res.redirect('/');
      });
      break;
    case 1:
      // Estado 1: Usuario dado de alta
      // Redirigir siempre al dashboard y bloquear acceso a otras rutas
      if (ruta !== '/tablero') {
        res.redirect('/tablero');
        return;
      }
      next();
      break;
    case 2:
      // Estado 2: En espera de que el usuario escriba el token
      // Redirigir siempre a /crearCuenta y bloquear acceso a otras rutas
      if (ruta !== '/ingresarToken') {
        res.redirect('/ingresarToken');
        return;
      }
      next();
      break;
    case 3:
      // Estado 3: En espera de que un delegado acepte la solicitud
      // Redirigir siempre a /verificacion y bloquear acceso a otras rutas
      if (ruta !== '/verificacion') {
        res.redirect('/verificacion');
        return;
      }
      next();
      break;
    default:
      // Cualquier otro estado desconocido
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
router.get('/verificacion', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'verificacion.html'));
});

// Ruta para pantalla de alta de voluntario
router.get('/altaVoluntario', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'altaVoluntario.html'));
});

// Ruta para pantalla de para ingresar token (MODIFICAR HTML)
router.get('/ingresarToken', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'ingresarToken.html'));
});

// Ruta para pantalla de dashboard
router.get('/tablero', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'dashboard.html'));
});

// Ruta para el inicio de sesión
router.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    // Buscar el usuario en la base de datos por correo
    db.get('SELECT contraseña, status FROM usuarios WHERE correo = ?', [correo], async (err, row) => {
      if (err) {
        console.error('Error al buscar usuario:', err);
        res.status(500).json({ mensaje: 'Error al buscar usuario en la base de datos' });
      } else {
        if (row) {
          // Verificar si la contraseña proporcionada coincide con la contraseña almacenada
          const match = await bcrypt.compare(contraseña, row.contraseña);
          if (match) {
            // Establecer la sesión del usuario
            req.session.usuario = { correo, status: row.status }; // Puedes agregar más información del usuario si lo necesitas
            if(row.status === 0) res.status(404).json({ mensaje: 'Correo no encontrado' });
            if(row.status === 1) res.status(200).json({ mensaje: 'Inicio de sesión correcto', ruta: '/tablero' });
            if(row.status === 2) res.status(200).json({ mensaje: 'Inicio de sesión correcto', ruta: '/ingresarToken', tipoUsuario: row.status });
            if(row.status === 3) res.status(200).json({ mensaje: 'Inicio de sesión correcto', ruta: '/verificacion' });
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
              db.run('INSERT INTO tokens (token, id_usuario, tipo_token) VALUES (?, ?, ?)', [hash_token, userId, 1], (err) => {
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

// Ruta para validar el token ingresado por el usuario
router.post('/validarToken', async (req, res) => {
  const { correo, token, tipoUsuario } = req.body;

  try {
    db.get('SELECT token FROM tokens WHERE id_usuario = (SELECT id_usuario FROM usuarios WHERE correo = ?)', [correo], async (err, row) => {
      if (err) {
        console.error('No se pudo buscar el token:', err);
        return res.status(500).json({ mensaje: 'Error al buscar el token' });
      }

      if (row) {
        const match = await bcrypt.compare(token, row.token);

        if (match) {
          db.serialize(() => {
            db.run('BEGIN TRANSACTION', (err) => {
              if (err) {
                console.error('Error al iniciar la transacción:', err);
                return res.status(500).json({ mensaje: 'Error al iniciar la transacción' });
              }

              db.run('UPDATE usuarios SET status = ? WHERE correo = ?', [tipoUsuario, correo], (err) => {
                if (err) {
                  db.run('ROLLBACK', rollbackErr => {
                    if (rollbackErr) {
                      console.error('Error al hacer rollback:', rollbackErr);
                    }
                    return res.status(500).json({ mensaje: 'Error al modificar el status del usuario en la base de datos' });
                  });
                } else {
                  db.run('DELETE FROM tokens WHERE token = ?', [row.token], (err) => {
                    if (err) {
                      console.error('Error al borrar el token:', err);
                      db.run('ROLLBACK', rollbackErr => {
                        if (rollbackErr) {
                          console.error('Error al hacer rollback:', rollbackErr);
                        }
                        return res.status(500).json({ mensaje: 'Error al borrar el token en la base de datos' });
                      });
                    } else {
                      db.run('COMMIT', (commitErr) => {
                        if (commitErr) {
                          console.error('Error al hacer commit:', commitErr);
                          return res.status(500).json({ mensaje: 'Error al hacer commit en la base de datos' });
                        }
                        res.status(201).json({ mensaje: 'Usuario dado de alta correctamente' });
                      });
                    }
                  });
                }
              });
            });
          });
        } else {
          res.status(401).json({ mensaje: 'Token incorrecto' });
        }
      } else {
        res.status(404).json({ mensaje: 'Correo no encontrado' });
      }
    });
  } catch (error) {
    console.error('Error al validar el token:', error);
    res.status(500).json({ mensaje: 'Error al validar el token' });
  }
});

// Ruta para reestablecer la contraseña de un usuario
router.post('/reestablecerPwd', async (req, res) => {
  const { correo } = req.body;

  db.get('SELECT status FROM usuarios WHERE correo = ?', [correo], (err, row) => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error al buscar el correo del usuario' });
    } 
    if (row) {
      const status = row.status;
      if (status === 0) return res.status(404).json({ mensaje: 'No existe cuenta asociada a este correo' });
      if (status === 1) {
        db.get('SELECT 1 FROM tokens WHERE tipo_token = ? AND id_usuario = (SELECT id_usuario FROM usuarios WHERE correo = ?)', [2, correo], async (err, row) => {
          if (err) {
            return res.status(500).json({ mensaje: 'Error al validar el estatus del usuario' });
          }
          try {
            const token = crypto.randomBytes(5).toString('hex'); // Generar token de 10 caracteres
            const hash_token = await encriptar(token);

            if (row) {
              db.run('UPDATE tokens SET token = ? WHERE id_usuario = (SELECT id_usuario FROM usuarios WHERE correo = ?)', [hash_token, correo], (err) => {
                if (err) {
                  return res.status(500).json({ mensaje: 'Error al asociar un token al usuario' });
                } 
                res.status(201).json({ mensaje: 'Se ha creado y asociado un token al usuario' });
                enviarCorreoReestablecerContraseña(correo, token);
              });
            } else {
              db.run('INSERT INTO tokens (token, tipo_token, id_usuario) VALUES (?, ?, (SELECT id_usuario FROM usuarios WHERE correo = ?))', [hash_token, 2, correo], (err) => {
                if (err) {
                  return res.status(500).json({ mensaje: 'Error al asociar un token al usuario' });
                } 
                res.status(201).json({ mensaje: 'Se ha creado y asociado un token al usuario' });
                enviarCorreoReestablecerContraseña(correo, token);
              });
            }
          } catch (error) {
            console.error('Error al encriptar el token:', error);
            return res.status(500).json({ mensaje: 'Error al encriptar el token' });
          }
        });
      } 
      if (status === 2 || status === 3) return res.status(403).json({ mensaje: 'Esta cuenta no tiene los permisos para realizar esta acción' });
    } else {
      return res.status(404).json({ mensaje: 'No se encontró al usuario con el correo \"' + correo + '\"'});
    }
  });
});

// Ruta para cambiar la contraseña del usuario
router.post('/cambiarPwd', (req, res) => {
  const { correo, nuevaContr } = req.body;

  db.get('SELECT 1 FROM usuarios WHERE correo = ?', [correo], async (err, row) => {
    if(err) {
      res.status(500).json({ mensaje: 'Error interno en la base de datos para consultar correo' });
    } else {
      if(row) {
        try {
          const hash = await encriptar(nuevaContr);

          db.run('UPDATE usuarios SET contraseña = ? WHERE correo = ?', [hash, correo], (err) => {
            if(err) {
              res.status(500).json({ mensaje: 'Error en la base de datos para actualizar la contraseña '});
            } else {
              res.status(201).json({ mensaje: 'Actualización de la nueva contraseña con éxito', ruta: '/tablero' });
            }
          });
        } catch (error) {
          return res.status(500).json({ mensaje: 'Error al encriptar la nueva contraseña' });
        }
      } else {
        res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }
    }
  });
});

// Ruta para obtener los datos del usuario
router.post('/obtenerDatos', (req, res) => {
  const { correo } = req.body;
  const datos = {};

  // Consultar la base de datos para obtener los datos del usuario
  db.get('SELECT nombre_usuario, apellido_paterno, apellido_materno, telefono, correo, id_rol, id_sede FROM usuarios WHERE correo = ?', [correo], (err, row) => {
    if (err) {
      console.error('Error al obtener datos del usuario:', err);
      return res.status(500).json({ mensaje: 'Error al obtener datos del usuario' });
    }

    if (!row) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    datos.nombres = row.nombre_usuario;
    datos.apPat = row.apellido_paterno;
    datos.apMat = row.apellido_materno;
    datos.telefono = row.telefono;
    datos.correo = row.correo;
    const id_rol = row.id_rol;
    const id_sede = row.id_sede;
    db.get('SELECT rol FROM roles WHERE id_rol = ?', [id_rol], (err, row) => {
      if(err) {
        res.status(500).json({ mensaje: 'Error al obtener el rol del usuario' });
      } else {
        if(row) {
          datos.rol = row.rol;
          db.get('SELECT sede FROM sedes WHERE id_sede = ?', [id_sede], (err, row) => {
            if(err) {
              res.status(500).json({ mensaje: 'Error al obtener la sede del usuario' });
            } else {
              if(row) {
                datos.sede = row.sede;
                //console.log(datos);
                res.status(200).json(datos);
              } else {
                res.status(404).json({ mensaje: 'Sede no encontrado' });
              }
            }
          });
        } else {
          res.status(404).json({ mensaje: 'Rol no encontrado' });
        }
      }
    });
    
  });
});

// Función para enviar correo para reestablecer contraseña
function enviarCorreoReestablecerContraseña(correo, token) {
  const mailOptions = {
    from: 'pruebas_back24@hotmail.com',
    to: correo,
    subject: 'Recuperación de cuenta - INPAVI MANAGER',
    text: `Haz recibido un código para cambiar tu contraseña, escríbelo en el campo solicitado para validar el correo. NO COMPARTAS EL CÓDIGO CON NADIE.

    Tu token de verificación es: 
    ${token}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar correo:', error, info);
    } else {
      //console.log('Correo enviado: ' + info.response);
    }
  });
}

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