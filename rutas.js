const express = require('express');
const router = express.Router();
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./baseDeDatos');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const puerto = '8444';
const dominio = `${process.env.DOMINIO}`;
// Variables definidas en ~/.bashrc en Linux
const correoParaEnvios = process.env.CORREO_ENVIOS;
const claveCorreoEnvios = process.env.CLAVE;

// Configurar Nodemailer para Outlook
const transporter = nodemailer.createTransport({
  host: process.env.SERVIDOR_SMTP,
  port: 587, // Puerto SMTP
  secure: false, // true para el puerto 465, false para otros puertos
  auth: {
    user: correoParaEnvios,
    pass: claveCorreoEnvios
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

  /*
  req.session.destroy(() => {
    res.redirect('/mantenimiento');
  });
  */

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
      next();
      break;
    case 2:
      // Estado 2: En espera de que el usuario escriba el token
      // Redirigir siempre a /crearCuenta y bloquear acceso a otras rutas
      if (ruta !== '/ingresarToken') {
        return res.redirect('/ingresarToken');
      }
      next();
      break;
    case 3:
      // Estado 3: En espera de que un delegado acepte la solicitud
      // Redirigir siempre a /verificacion y bloquear acceso a otras rutas
      if (ruta !== '/verificacion') {
        return res.redirect('/verificacion');
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

// Ruta para redirigir al usuario al HTML de usuario validado
router.get('/usuarioAceptado', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'usuarioAceptado.html'));
});

// Ruta para redirigir al usuario al HTML de usuario validado
router.get('/usuarioDeclinado', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'usuarioDeclinado.html'));
});

// Ruta para redirigir al usuario al HTML de usuario validado previamente
router.get('/aceptadoPreviamente', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'usuarioYaAceptado.html'));
});

// Ruta para redirigir al usuario al HTML de usuario validado
router.get('/declinadoPreviamente', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'usuarioYaDeclinado.html'));
});

// Ruta para redirigir al usuario a la pantalla de visualización de los datos de un voluntario
router.get('/datosVoluntario', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'datosVoluntario.html'));
});

router.get('/modificarVoluntario', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'modificacionVoluntario.html'));
});

router.get('/programas', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'programasSociales.html'));
});

// Ruta para el inicio de sesión
router.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    // Buscar el usuario en la base de datos por correo
    db.get('SELECT contraseña, status, id_rol, nombre_usuario, id_sede, id_usuario FROM usuarios WHERE correo = ?', [correo], async (err, row) => {
      if (err) {
        console.error('Error al buscar usuario:', err);
        res.status(500).json({ mensaje: 'Error al buscar usuario en la base de datos' });
      } else {
        if (row) {
          // Verificar si la contraseña proporcionada coincide con la contraseña almacenada
          const match = await bcrypt.compare(contraseña, row.contraseña);
          if (match) {
            // Establecer la sesión del usuario
            req.session.usuario = { correo, status: row.status, id_rol: row.id_rol, nombre: row.nombre_usuario, id_sede: row.id_sede, id_usuario: row.id_usuario }; // Puedes agregar más información del usuario si lo necesitas
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

// Ruta para cerrar la sesión del usuario
router.get('/logout', function(req, res) {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Ruta para validar si un correo ya existe y dar de alta a un usuario
router.post('/altaUsuario', async (req, res) => {
  const { correo, apellido_materno, apellido_paterno, telefono, contraseña, nombre_usuario, id_rol, id_sede } = req.body;

  if (!correo || !apellido_materno || !apellido_paterno || !telefono || !contraseña || !nombre_usuario || !id_rol || !id_sede) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  try {
    const hash = await encriptar(contraseña);
    const token = crypto.randomBytes(5).toString('hex'); // Generar token de 10 caracteres
    const hash_token = await encriptar(token);

    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Error al iniciar la transacción:', err);
          return res.status(500).json({ mensaje: 'Error al iniciar la transacción' });
        }

        db.run('INSERT INTO usuarios (correo, apellido_materno, apellido_paterno, telefono, contraseña, nombre_usuario, id_rol, id_sede, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [correo, apellido_materno, apellido_paterno, telefono, hash, nombre_usuario, id_rol, id_sede, 2], function (err) {
            if (err) {
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
                  // Enviar correo con el token
                  const mailOptions = {
                    from: correoParaEnvios,
                    to: correo,
                    subject: 'Verificación de cuenta - INPAVI MANAGER',
                    text: `Hola, ${nombre_usuario} ${apellido_paterno} ${apellido_materno}.

                    Haz recibido un código para registrarte en el sistema, escríbelo en el campo solicitado para validar el correo. NO COMPARTAS EL CÓDIGO CON NADIE.

                    Tu token de verificación es: 
                    ${token}`
                  };

                  transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      console.error('Error al enviar correo:', error);
                      db.run('ROLLBACK', rollbackErr => {
                        if (rollbackErr) {
                          console.error('Error al hacer rollback:', rollbackErr);
                        }
                        return res.status(500).json({ mensaje: 'Error al enviar el correo' });
                      });
                    } else {
                      db.run('COMMIT', (commitErr) => {
                            if (commitErr) {
                              console.error('Error al hacer commit:', commitErr);
                              return res.status(500).json({ mensaje: 'Error al hacer commit en la base de datos' });
                            }
                            //console.log('Usuario registrado');
                            res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
                          });
                    }
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
  db.all('SELECT * FROM sedes;', (err, rows) => {
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
                      db.get('SELECT nombre_usuario, apellido_paterno, apellido_materno, id_sede, id_usuario FROM usuarios WHERE correo = ?', [correo], (err, row) => {
                        if (err) {
                          return hacerRollback(500, `Error al obtener los datos del voluntario tras eliminar token`, res, err);
                        }
                        if(!row) {
                          return hacerRollback(404, `No se encontró al voluntario buscado`, res, err);
                        }
                        const nombreCompleto = `${row.nombre_usuario} ${row.apellido_paterno} ${row.apellido_materno}`;
                        const id_sede = row.id_sede;
                        const id_usuario = row.id_usuario;
                        db.get('SELECT id_usuario, id_sede, id_rol, nombre_usuario, apellido_paterno, apellido_materno FROM usuarios WHERE correo=?', [correo], (err, row) => {
                          if(err) {
                            res.status(500).json({ mensaje: 'Error al obtener los datos del usuario para el envío de correo' });
                          }
                          if(!row) res.status(404).json({ mensaje: 'No se eencontró al usuario'});
  
                          const nombre_usuario = row.nombre_usuario;
                          const apellido_paterno = row.apellido_paterno;
                          const apellido_materno = row.apellido_materno;
                          const id_usuario = row.id_usuario;
                          const id_sede = row.id_sede;
                          const id_rol = row.id_rol;
                          db.get('SELECT rol FROM roles WHERE id_rol=?', [id_rol], (err, row) => {
                            if(err) {
                              res.status(500).json({ mensaje: 'Error al consultar el rol'});
                            } else {
                              if(!row) res.status(404).json({ mensaje: 'No se encontró el rol'});
                              const rol = row.rol;
                              db.get('SELECT sede FROM sedes WHERE id_sede=?', [id_sede], (err, row) => {
                                if(err) res.status(500).json({ mensaje: 'Error al consultar la sede' });
                                if(!row) res.status(404).json({ mensaje: 'No se encontró la sede' });
                                const sede = row.sede;
                                // Enviar correo al delegado
                                db.get('SELECT correo, nombre_usuario FROM usuarios WHERE id_rol = ? AND id_sede = ?', [2, id_sede], (err, delegadoRow) => { // Suponiendo que id_rol = 1 es el rol del delegado
                                  if (err) {
                                    console.error('Error al obtener el correo del delegado:', err);
                                    return res.status(500).json({ mensaje: 'Error al obtener el correo del delegado' });
                                  }
  
                                  if (delegadoRow) {
                                    const delegadoMailOptions = {
                                      from: correoParaEnvios,
                                      to: delegadoRow.correo,
                                      subject: 'Solicitud de aprobación de usuario - INPAVI MANAGER',
                                      html: `Hola, ${delegadoRow.nombre_usuario}.
                                      
                                        <p>Se ha registrado un nuevo usuario en su sede. A continuación, se muestran los datos del usuario:</p>
                                        <ul>
                                          <li>Nombre: ${nombre_usuario}</li>
                                          <li>Apellido Paterno: ${apellido_paterno}</li>
                                          <li>Apellido Materno: ${apellido_materno}</li>
                                          <li>Correo: ${correo}</li>
                                          <li>Rol: ${rol}</li>
                                          <li>Sede: ${sede}</li>
                                        </ul>
                                        <p>Por favor, apruebe o rechace esta solicitud:</p>
                                        <a href="${dominio}/aceptarUsuario/${id_usuario}"><button style="color: green; text-decoration: none; font-weight: bold;">Aceptar</button></a>
                                        <br>
                                        <a href="${dominio}/declinarUsuario/${id_usuario}"><button style="color: red; text-decoration: none; font-weight: bold;">Declinar</button></a>
                                      `
                                    };
  
                                    transporter.sendMail(delegadoMailOptions, (error, info) => {
                                      if (error) {
                                        console.error('Error al enviar correo al delegado:', error);
                                        db.run('COMMIT', (commitErr) => {
                                          if (commitErr) {
                                            console.error('Error al hacer commit:', commitErr);
                                            return res.status(500).json({ mensaje: 'Error al hacer commit en la base de datos' });
                                          }
                                        });
                                      }
                                    });
                                  } else {
                                    console.error('No se encontró el correo del delegado');
                                    db.run('ROLLBACK', rollbackErr => {
                                      if (rollbackErr) {
                                        console.error('Error al hacer rollback:', rollbackErr);
                                      }
                                      return res.status(500).json({ mensaje: 'No se encontró el correo del delegado' });
                                    });
                                  }
                                });
                              });
                            };
                          });
                        });
                      });
                      db.run('COMMIT', (commitErr) => {
                        if (commitErr) {
                          console.error('Error al hacer commit:', commitErr);
                          return res.status(500).json({ mensaje: 'Error al hacer commit en la base de datos' });
                        }
                        res.status(201).json({ mensaje: 'Usuario dado de alta correctamente y en espera de validación' });
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

// Ruta para rechazar el alta de un usuario
router.get('/aceptarUsuario/:id_usuario', (req, res) => {
  const {id_usuario} = req.params;

  db.get('SELECT nombre_usuario, apellido_paterno, apellido_materno, id_sede, status FROM usuarios WHERE id_usuario=?', [id_usuario], (err, row) => {
    if(err) res.status(500).json({ mensaje: 'Error al buscar al usuario' });
    if(row) {
      const nombreCompleto = `${row.nombre_usuario} ${row.apellido_paterno} ${row.apellido_materno}`;
      const id_sede = row.id_sede;
      if(row.status === 1) {
        res.redirect('/aceptadoPreviamente');
      } else if(row.status === 3) {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          db.run('INSERT INTO conjuntoVoluntarios (nombreCompleto, id_sede, tipoPersona, id_filaUsuarios) VALUES (?, ?, ?, ?)', [nombreCompleto, id_sede, 0, id_usuario], (err) => {
            if (err) {
              hacerRollback(500, `Error al insertar al usuario en la tabla general de voluntarios`, res, err);
            }

            db.run('UPDATE usuarios SET status=? WHERE id_usuario=?', [1, id_usuario], (err) => {
              if(err) {
                hacerRollback(500, `Error al modificar el estado del usuario`, res, err);
              }
              db.get('SELECT correo, nombre_usuario FROM usuarios WHERE id_usuario=?', [id_usuario], (err, row) => {
                if(err) {
                  hacerRollback(500, `Error al obtener los datos del usuario para el envío de correo`, res, err);
                }
                const opcionesCorreo = {
                  from: correoParaEnvios,
                  to: row.correo,
                  subject: 'Aceptación de cuenta - INPAVI MANAGER',
                  html: `
                    <p>Hola, ${row.nombre_usuario}. <br><br> Te damos la bienvenida a INPAVI Manager. <br><br>Da clic <a href="${dominio}/">aquí</a> para comenzar a ayudar.</p>
                  `
                };
            
                transporter.sendMail(opcionesCorreo, (error, info) => {
                  if (error) {
                    console.error('Error al enviar correo al usuario aceptado:', error);
                  } else {
                    db.run('COMMIT', (err) => {
                      if(err) {
                        console.error(`Error al realizar commit: ${err}`);
                        return hacerRollback(500, `Error al hacer commit de la transacción`, res, err);
                      }
                      return res.redirect('/usuarioAceptado');
                    });
                  }
                });
              });
            });
          });
        });
      }
    } else {
      res.redirect('/declinadoPreviamente');
    }
  });
});

// Ruta para aceptar el alta de un usuario
router.get('/declinarUsuario/:id_usuario', (req, res) => {
  const {id_usuario} = req.params;

  db.get('SELECT status FROM usuarios WHERE id_usuario=?', [id_usuario], (err, row) => {
    if(err) res.status(500).json({ mensaje: 'Error al buscar al usuario' });
    if(row) {
      if(row.status === 1) {
        res.redirect('/aceptadoPreviamente');
      } else if(row.status === 3) {
        db.get('SELECT correo, nombre_usuario FROM usuarios WHERE id_usuario=?', [id_usuario], (err, row) => {
          if(err) res.status(500).json({ mensaje: 'Error al buscar el correo del usuario' });
          if(!row) res.status(404).json({ mensaje: 'Usuario no encontrado' });
          const opcionesCorreo = {
            from: correoParaEnvios,
            to: row.correo,
            subject: 'Rechazo de solicitud para alta - INPAVI MANAGER',
            html: `
              <p>Hola, ${row.nombre_usuario}. <br><br>Tu solicitud de alta ha sido rechazada. Comunícate con el delegado de tu sede para que te informe sobre los pasos a seguir.</p>
            `
          };
      
          transporter.sendMail(opcionesCorreo, (error, info) => {
            if (error) {
              console.error('Error al enviar correo al delegado:', error);
              return res.status(500);
            } else {
              db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                db.run('DELETE FROM usuarios WHERE id_usuario=?', [id_usuario], (err) => {
                  if(err) {
                    hacerRollback(500, `Error al eliminar al usuario de la tabla de usuarios`, res, err);
                  }
  
                  db.run('DELETE FROM conjuntoVoluntarios WHERE id_voluntario = ?', [id_usuario], (err) => {
                    if (err) {
                      return hacerRollback(500, `Error al eliminar el usuario de la tabla de voluntarios`, res, err);
                    }
                    
                    db.run('COMMIT', (err) => {
                      if(err) {
                        console.error(`Error al realizar commit: ${err}`);
                        return hacerRollback(500, `Error al hacer commit de la transacción`, res, err);
                      }
                      return res.redirect('/usuarioDeclinado');
                    });
                  });
                });
              });
            }
          });
        });
      }
    } else {
      res.redirect('/declinadoPreviamente');
    }
  });
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

// Ruta para enviar botones al HTML según el tipo de usuario y tras haber iniciado sesión
router.get('/obtenerBotones', (req, res) => {
  // Verifica si hay un usuario en la sesión
  if (req.session && req.session.usuario) {
    const { nombre, id_rol, id_sede } = req.session.usuario;

    db.get('SELECT rol FROM roles WHERE id_rol=?', [id_rol], (err, row) => {
      if(err) res.status(500).json({ mensaje: 'Error al consultar el rol del usuario' });
      if(!row) res.status(404).json({ mensaje: `No se encontró el rol con id: ${id_rol}` });
      const rol = row.rol;
      // Define los botones según el status del usuario
      let botones;
      switch (id_rol) {
        case 1: // Supervisor
          botones = [
            { nombre: 'Ver la información de un voluntario', ruta: '/datosVoluntario', inactivo: true, tipo: 'icon' }
          ];
          break;
        case 2: // Delegado
          botones = [
            { nombre: 'Registrar a un voluntario', ruta: '/altaVoluntario', inactivo: false, tipo: 'button' },
            { nombre: 'Explorar programas', ruta: '/programas', inactivo: false, tipo: 'button' },
            { nombre: 'Modificar información de un voluntario', ruta: '/modificarVoluntario', inactivo: true, tipo: 'icon' },
            { nombre: 'Ver la información de un voluntario', ruta: '/datosVoluntario', inactivo: true, tipo: 'icon' }
          ];
          break;
        case 3: // Coordinador DAS
          botones = [
            { nombre: 'Registrar a un voluntario', ruta: '/altaVoluntario', inactivo: false, tipo: 'button' },
            { nombre: 'Modificar información de un voluntario', ruta: '/modificarVoluntario', inactivo: true, tipo: 'icon' },
            { nombre: 'Ver la información de un voluntario', ruta: '/datosVoluntario', inactivo: true, tipo: 'icon' }
          ];
          break;
        case 4: // Coordinador Entrada
          botones = [
          ];
          break;
        case 5: // Equipo directo DAS
          botones = [
            { nombre: 'Registrar a un voluntario', ruta: '/altaVoluntario', inactivo: false, tipo: 'button' },
            { nombre: 'Ver la información de un voluntario', ruta: '/datosVoluntario', inactivo: true, tipo: 'icon' }
          ];
          break;
        case 6: // Equipo directo Entrada
          botones = [
          ];
          break;
        default:
          res.status(403).json({ mensaje: 'Error con el tipo de usuario que está trabajando' });
      }

      // Enviar los botones y el status al cliente
      res.json({ botones, nombre, rol, id_rol, id_sede });
    });
  } else {
    res.redirect('/');
  }
});

router.get('/obtenerOcupaciones', verificarSesionYStatus, (req, res) => {
  db.all('SELECT * FROM ocupaciones ORDER BY ocupacion', (err, rows) => {
    if(err) {
      res.status(500).json({ mensaje: 'Error al consultar las ocupaciones en la base de datos' });
    } else {
      if(rows) {
        const ocupaciones = [];
        rows.forEach(ocupacion => {
          ocupaciones.push(ocupacion);
        });
        res.status(200).json(ocupaciones);
      } else {
        res.status(404).json({ mensaje: 'No existen ocupaciones actualmente' });
      }
    }
  });
});

router.post('/obtenerNombreVoluntarios', (req, res) => {
  if (req.session && req.session.usuario) {
    const id_sede = req.body.id_sede || req.session.usuario.id_sede;
    const voluntarios = [];
    db.all('SELECT id_voluntario, nombreCompleto FROM conjuntoVoluntarios WHERE id_sede=? ORDER BY nombreCompleto', [id_sede], (err, rows) => {
      if(err) {
        return res.status(500).json({ mensaje: 'Error al consultar la tabla de voluntarios del sistema ' + err });
      } else {
        if(rows) {
          rows.forEach(usuario => {
            voluntarios.push(usuario);
          });
        }
        res.status(200).json(voluntarios.sort());
      }
    });
  } else {
    res.redirect('/');
  }
});

router.get('/obtenerVoluntariosEquipoDirecto', (req, res) => {
  // Verifica si hay un usuario en la sesión
  if (req.session && req.session.usuario) {
    const { id_sede, id_rol } = req.session.usuario;
    let consulta = 
    `SELECT
      v.id_voluntario,
      v.nombre_v,
      v.apellido_paterno_v,
      v.informe_valoracion,
      v.estado,
      V.ocupacion,
      iv.interes,
      p.programa AS derivacion,
      pc.contacto AS primeros_contactos,
      s.sede AS sede
        FROM voluntarios v
        LEFT JOIN interesesVoluntario iv ON v.id_voluntario = iv.id_voluntario
        LEFT JOIN derivacionVoluntario dv ON v.id_voluntario = dv.id_voluntario
        LEFT JOIN programas p ON dv.id_derivacion = p.id_programa
        LEFT JOIN primerosContactosVoluntario pcv ON v.id_voluntario = pcv.id_voluntario
        LEFT JOIN primerosContactos pc ON pcv.id_contacto = pc.id_contacto
        LEFT JOIN sedes s ON v.id_sede = s.id_sede
        `;
    let parametros = [];
    if(id_rol === 2 && id_sede === 1) {
      consulta += ' WHERE v.estado=1 AND v.id_sede IN (1,2,3,4)';
    } else if(!(id_rol === 2 && id_sede === 1) && id_rol !== 1) {
      consulta += ' WHERE v.estado=1 AND v.id_sede=?';
      parametros.push(id_sede);
    }
    
    db.all(consulta, parametros, (err, rows) => {
        if (err) {
          res.status(500).json({ mensaje: 'Error al consultar los voluntarios activos: ' + err, consulta, parametros });
        } else {
          if (rows) {
            const voluntarios = {};

            rows.forEach(row => {
              if (!voluntarios[row.id_voluntario]) {
                voluntarios[row.id_voluntario] = {
                  id_voluntario: row.id_voluntario,
                  nombre: row.nombre_v,
                  apellido_paterno: row.apellido_paterno_v,
                  informe_valoracion: row.informe_valoracion === 3 ? 'Sin información' : (row.informe_valoracion === 0 ? 'Interno' : 'Externo temporal'),
                  ocupacion: row.ocupacion,
                  intereses: [],
                  derivacion: [],
                  primeros_contactos: [],
                  sede: row.sede,
                  estado: row.estado
                };
              }
              if (row.interes) {
                if(!voluntarios[row.id_voluntario].intereses.includes(row.interes))
                  voluntarios[row.id_voluntario].intereses.push(row.interes);
              }
              if (row.derivacion) {
                if(!voluntarios[row.id_voluntario].derivacion.includes(row.derivacion))
                  voluntarios[row.id_voluntario].derivacion.push(row.derivacion);
              }
              if (row.primeros_contactos) {
                if(!voluntarios[row.id_voluntario].primeros_contactos.includes(row.primeros_contactos))
                  voluntarios[row.id_voluntario].primeros_contactos.push(row.primeros_contactos);
              }
            });

            const voluntariosArray = Object.values(voluntarios);

            res.status(200).json(voluntariosArray);
          } else {
            db.get('SELECT sede FROM sedes WHERE id_sede=?', [id_sede], (err, row) => {
              if(err) {
                res.status(500).json({ mensaje: 'Error al consultar la sede de los voluntarios activos' });
              } else {
                if(row) res.status(404).json({ mensaje: 'No se encontraron voluntarios activos para la sede: ' + row.sede });
              }
            });
          }
        }
      }
    );
  } else {
    res.redirect('/');
  }
});

router.get('/obtenerProgramas', verificarSesionYStatus, (req, res) => {
  db.all('SELECT * FROM programas', (err, rows) => {
    if(err) {
      res.status(500).json({ mensaje: 'Error al consultar los programas sociales en la base de datos' });
    }
    if(rows) {
      // Crear un arreglo de objetos con el id y nombre del programa
      const programas = rows.map(row => ({
        id: row.id_programa,
        nombre: row.programa
      }));

      // Enviar la respuesta en formato JSON
      res.status(200).json(programas);
    } else {
      res.status(404).json({ mensaje: 'No se encontró ningún programa social' });
    }
  });
});

router.get('/obtenerPrimerosContactos', verificarSesionYStatus, (req,res) => {
  db.all('SELECT * FROM primerosContactos', (err, rows) => {
    if(err) {
      res.status(500).json({ mensaje: 'Error al consultar los datos de primeros contactos' });
    }
    if(rows) {
      const primerosContactos = rows.map(contacto => ({
        id: contacto.id_contacto,
        nombre: contacto.contacto
      }));
      res.status(200).json(primerosContactos);
    } else {
      res.status(404).json({ mensaje: 'No se encontraron datos de primeros contactos' });
    }
  });
});

router.post('/voluntarioNuevo', (req, res) => {
  if (req.session && req.session.usuario) {
    const { id_sede, id_usuario } = req.session.usuario;
    const { nombre, apellidoP, apellidoM, fechaNacimiento, identificacion, telefono, correo, ocupacion, personaContacto, voluntarioIntAsignado, intereses, valoracion, primerosContactos, informeValoracion, derivacion, observaciones } = req.body;
    
    const fechaActual = new Date();
    const year = fechaActual.getUTCFullYear();
    const month = String(fechaActual.getUTCMonth() + 1).padStart(2, '0');
    const day = String(fechaActual.getUTCDate()).padStart(2, '0');
    const fechaFormateada = `${year}-${month}-${day}`;
    
    let estado = derivacion.length === 0 ? 2 : 1;
    let fechaAlta = estado === 1 ? fechaFormateada : '';

    db.get('SELECT 1 FROM voluntarios WHERE nombre_v = ? AND apellido_paterno_v = ? AND apellido_materno_v = ? AND fecha_nacimiento = ?', [nombre, apellidoP, apellidoM, fechaNacimiento], function (err, row) {
      if(err) {
        console.error(`Error al consultar la existencia del voluntario: ${err}`);
        return res.status(500).json({ mensaje: 'Error al consultar la existencia del voluntario' });
      }
      if(row) {
        return res.status(409).json({ mensaje: 'El voluntario que se quiere registrar ya existe' });
      } else {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          db.run('INSERT INTO voluntarios(id_voluntarioAsignado, estado, fecha_captacion, fecha_alta, nombre_v, apellido_paterno_v, apellido_materno_v, identificacion, fecha_nacimiento, telefono_v, correo_v, ocupacion, informe_valoracion, observaciones, id_sede, personaContacto, id_usuarioQueDaDeAlta) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [voluntarioIntAsignado, estado, fechaFormateada, fechaAlta, nombre, apellidoP, apellidoM, identificacion, fechaNacimiento, telefono, correo, ocupacion, informeValoracion, observaciones, id_sede, personaContacto, id_usuario], function(err) {
            if(err) {
              if(err.code === 'SQLITE_CONSTRAINT') {
                return hacerRollback(409, `El voluntario con esta identificación ya existe.`, res, err);
              } else {
                return hacerRollback(500, `Error al insertar los datos del voluntario`, res, err);
              }
            }
            const id_voluntario = this.lastID;

            if (valoracion.length > 0) {
              valoracion.forEach(id_programa => {
                db.run('INSERT INTO valoracionVoluntario(id_voluntario, id_valoracion) VALUES (?,?)', [id_voluntario, id_programa], (err) => {
                  if (err) {
                    return hacerRollback(500, `Error al asociar el programa de valoración con id ${id_programa} con el voluntario "${nombre}"`, res, err);
                  }
                });
              });
            }

            if (intereses.length > 0) {
              intereses.forEach(interes => {
                db.run('INSERT INTO interesesVoluntario(id_voluntario, interes) VALUES (?, ?)', [id_voluntario, interes], (err) => {
                  if(err) {
                    return hacerRollback(500, `Error al relacionar el interés "${interes}" con el voluntario "${nombre}"`, res, err);
                  }
                });
              });
            }

            if (primerosContactos.length > 0) {
              primerosContactos.forEach(id_contacto => {
                db.run('INSERT INTO primerosContactosVoluntario(id_voluntario, id_contacto) VALUES (?,?)', [id_voluntario, id_contacto], (err) => {
                  if (err) {
                    return hacerRollback(500, `Error al asociar el primer contacto con ID ${id_contacto} con el voluntario "${nombre}"`, res, err);
                  }
                });
              });
            }

            if (derivacion.length > 0) {
              derivacion.forEach(programa => {
                db.run('INSERT INTO derivacionVoluntario(id_voluntario, id_derivacion) VALUES (?,?)', [id_voluntario, programa[0]], (err) => {
                  if (err) {
                    return hacerRollback(500, `Error al asociar el programa de derivación "${programa[1]}" con el voluntario "${nombre}"`, res, err);
                  } else {
                    db.run('UPDATE programasSede SET cantidadInvolucrados = cantidadInvolucrados + 1 WHERE id_programa = ? AND id_sede = ?', [programa[0], id_sede], (err) => {
                      if (err) {
                        return hacerRollback(500, `Error al actualizar la cantidad de voluntarios para el programa "${programa[1]}"`, res, err);
                      }
                    });
                  }
                });
              });
            }

            if(estado === 1) {
              const nombreCompleto = `${nombre} ${apellidoP} ${apellidoM}`;
              db.run('INSERT INTO conjuntoVoluntarios (nombreCompleto, id_sede, tipoPersona, id_filaVoluntarios) VALUES (?, ?, ?, ?)', [nombreCompleto, id_sede, 1, id_voluntario], (err) => {
                if(err) {
                  return hacerRollback(500, 'Error al insertar el voluntario en la tabla general de voluntarios', res, err);
                }
              });
            }

            return realizarCommit(res, 201, `Voluntario registrado correctamente`);
          });
        });
      }
    });
  } else {
    res.redirect('/');
  }
});

router.post('/infoVoluntario', verificarSesionYStatus, (req, res) => {
  const { id_voluntario } = req.body;

  db.get(`
    SELECT 
      v.id_voluntario, 
      v.id_voluntarioAsignado, 
      va.nombre_v AS nombre_voluntarioAsignado, 
      va.apellido_paterno_v AS apPat_voluntarioAsignado, 
      va.apellido_materno_v AS apMat_voluntarioAsignado, 
      v.fecha_captacion, 
      v.fecha_alta, 
      v.nombre_v, 
      v.apellido_paterno_v, 
      v.apellido_materno_v, 
      v.identificacion, 
      v.fecha_nacimiento, 
      v.telefono_v, 
      v.correo_v, 
      v.informe_valoracion, 
      v.fecha_baja, 
      v.estado, 
      v.observaciones, 
      v.id_sede, 
      s.sede,
      v.personaContacto,
      v.ocupacion,
      GROUP_CONCAT(DISTINCT iv.interes) AS intereses,
      GROUP_CONCAT(DISTINCT d.programa) AS derivacion,
      GROUP_CONCAT(DISTINCT p.programa) AS valoracion,
      GROUP_CONCAT(DISTINCT pc.contacto) AS primerosContactos,
      u.nombre_usuario AS nombre_usuarioAlta,
      u.apellido_paterno AS apPat_usuarioAlta,
      u.apellido_materno AS apMat_usuarioAlta,
      su.sede AS sede_usuarioAlta
    FROM 
      voluntarios v
    LEFT JOIN 
      voluntarios va ON v.id_voluntarioAsignado = va.id_voluntarioAsignado
    LEFT JOIN 
      interesesVoluntario iv ON v.id_voluntario = iv.id_voluntario
    LEFT JOIN 
      derivacionVoluntario dv ON v.id_voluntario = dv.id_voluntario
    LEFT JOIN 
      programas d ON dv.id_derivacion = d.id_programa
    LEFT JOIN 
      valoracionVoluntario vv ON v.id_voluntario = vv.id_voluntario
    LEFT JOIN 
      programas p ON vv.id_valoracion = p.id_programa
    LEFT JOIN 
      primerosContactosVoluntario pcv ON v.id_voluntario = pcv.id_voluntario
    LEFT JOIN 
      primerosContactos pc ON pcv.id_contacto = pc.id_contacto
    LEFT JOIN 
      sedes s ON v.id_sede = s.id_sede
    LEFT JOIN 
      usuarios u ON v.id_usuarioQueDaDeAlta = u.id_usuario
    LEFT JOIN
      sedes su ON u.id_sede = su.id_sede
    WHERE v.id_voluntario = ?`, [id_voluntario], (err, row) => {
      if(err) {
        console.error(err);
        return res.status(500).json({ mensaje: 'Error al consultar datos del voluntario en la base de datos' });
      }
      if(row) {
        //console.log(row);
        return res.status(200).json({ row });
      } else {
        return res.status(404).json({ mensaje: 'No se encontró el voluntario buscado' });
      }
    }
  );
});

router.post('/modificarDatosVoluntario', verificarSesionYStatus, (req, res) => {
  const { id_voluntario, id_internoAsignado, fechaCaptacion, nombres, apPat, apMat, identificacion, fechaNacimiento, telefono, correo, ocupacion, tipoVoluntario, observaciones, id_sede, personaContacto, intereses, valoracion, primerosContactos, derivacion } = req.body;
  let sets = [];
  let parametros = [];

  if (id_internoAsignado !== null) {
    sets.push('id_voluntarioAsignado = ?');
    parametros.push(id_internoAsignado);
  }
  if (fechaCaptacion !== null) {
    sets.push('fecha_captacion = ?');
    parametros.push(fechaCaptacion);
  }
  if (nombres !== null) {
    sets.push('nombre_v = ?');
    parametros.push(nombres);
  }
  if (apPat !== null) {
    sets.push('apellido_paterno_v = ?');
    parametros.push(apPat);
  }
  if (apMat !== null) {
    sets.push('apellido_materno_v = ?');
    parametros.push(apMat);
  }
  if (identificacion !== null) {
    sets.push('identificacion = ?');
    parametros.push(identificacion);
  }
  if (fechaNacimiento !== null) {
    sets.push('fecha_nacimiento = ?');
    parametros.push(fechaNacimiento);
  }
  if (telefono !== null) {
    sets.push('telefono_v = ?');
    parametros.push(telefono);
  }
  if (correo !== null) {
    sets.push('correo_v = ?');
    parametros.push(correo);
  }
  if (tipoVoluntario !== null) {
    sets.push('informe_valoracion = ?');
    parametros.push(tipoVoluntario);
  }
  if (observaciones !== null) {
    sets.push('observaciones = ?');
    parametros.push(observaciones);
  }
  if (id_sede !== null) {
    sets.push('id_sede = ?');
    parametros.push(id_sede);
  }
  if (personaContacto !== null) {
    sets.push('personaContacto = ?');
    parametros.push(personaContacto);
  }
  if (ocupacion !== null) {
    sets.push('ocupacion = ?');
    parametros.push(ocupacion);
  }

  //console.log('Datos recibidos en el body: ', req.body);

  db.get('SELECT nombre_v FROM voluntarios WHERE id_voluntario = ?', [id_voluntario], (err, row) => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error al buscar el voluntario en la base de datos' });
    }
    if (!row) {
      return res.status(404).json({ mensaje: 'El voluntario no fue encontrado' });
    }

    const nombreVoluntario = row.nombre_v;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      if (intereses !== null) {
        if (intereses.length === 0) {
          db.run('DELETE FROM interesesVoluntario WHERE id_voluntario = ?', [id_voluntario], (err) => {
            if (err) {
              return hacerRollback(500, 'Error al eliminar los intereses anteriores del voluntario.', res, err);
            }
          });
        } else {
          db.run('DELETE FROM interesesVoluntario WHERE id_voluntario = ?', [id_voluntario], (err) => {
            if (err) {
              return hacerRollback(500, 'Error al eliminar los intereses anteriores del voluntario.', res, err);
            }
            
            intereses.forEach((interes) => {
              db.run('INSERT INTO interesesVoluntario (id_voluntario, interes) VALUES (?, ?)', [id_voluntario, interes], (err) => {
                if (err) {
                  return hacerRollback(500, `Error al relacionar el interés "${interes}" con el voluntario "${nombres}`, res, err);
                }
              });
            });
          });
        }
      }

      if (valoracion !== null) {
        if (valoracion.length === 0) {
          return hacerRollback(400, `Se debe seleccionar al menos un programa de valoración para el voluntario "${nombreVoluntario}".`, res, 'Arreglo de valoración nulo');
        } else {
          db.run('DELETE FROM valoracionVoluntario WHERE id_voluntario = ?', [id_voluntario], (err) => {
            if (err) {
              return hacerRollback(500, 'Error al eliminar los programas de valoración anteriores del voluntario', res, err);
            }

            const stmt = db.prepare('INSERT INTO valoracionVoluntario (id_voluntario, id_valoracion) VALUES (?, ?)');
            valoracion.forEach((id_programa) => {
              stmt.run([id_voluntario, id_programa], (err) => {
                if (err) {
                  return hacerRollback(500, `Error al relacionar el programa con id ${id_programa} con el voluntario "${nombreVoluntario}"`, res, err);
                }
              });
            });
            stmt.finalize((err) => {
              if (err) {
                return hacerRollback(500, `Error al completar la relación de los programas de valoración con el voluntario "${nombreVoluntario}"`, res, err);
              }
            });
          });
        }
      }
      
      if (primerosContactos !== null) {
        if (primerosContactos.length === 0) {
          return hacerRollback(400, `Se debe seleccionar al menos un contacto para el voluntario`, res, 'Primeros contactos vacíos');
        } else {
          db.run('DELETE FROM primerosContactosVoluntario WHERE id_voluntario = ?', [id_voluntario], (err) => {
            if (err) {
              return hacerRollback(500, `Error al eliminar los primeros contactos antiguos del voluntario "${nombreVoluntario}"`, res, err);
            }

            const stmt = db.prepare('INSERT INTO primerosContactosVoluntario (id_voluntario, id_contacto) VALUES (?, ?)');
            primerosContactos.forEach((id_contacto) => {
              stmt.run([id_voluntario, id_contacto], (err) => {
                if (err) {
                  return hacerRollback(500, `Error al relacionar el contacto con ID "${id_contacto}" con el voluntario "${nombreVoluntario}"`, res, err);
                }
              });
            });
            stmt.finalize((err) => {
              if (err) {
                return hacerRollback(500, `Error al completar la relación de contactos con el voluntario "${nombreVoluntario}"`, res, err);
              }
            });
          });
        }
      }

      if (derivacion !== null) {
        if (derivacion.length === 0) {
          return hacerRollback(400, `Se debe seleccionar al menos un programa de derivación para el voluntario`, res, 'Derivación incompleta');
        } else {
          db.run('DELETE FROM derivacionVoluntario WHERE id_voluntario = ?', [id_voluntario], (err) => {
            if (err) {
              return hacerRollback(500, `Error al eliminar los programas de derivación anteriores del voluntario`, res, err);
            }

            if (proyectoNuevo) {
              db.run('INSERT INTO programas (programa) VALUES (?)', [proyectoNuevo], function(err) {
                if (err) {
                  return hacerRollback(500, `Error al insertar el programa "${proyectoNuevo}" a la tabla de programas`, res, err);
                }

                const id_programaNuevo = this.lastID;
                db.run('INSERT INTO derivacionVoluntario (id_voluntario, id_derivacion) VALUES (?, ?)', [id_voluntario, id_programaNuevo], (err) => {
                  if (err) {
                    return hacerRollback(500, `Error al relacionar el nuevo programa "${proyectoNuevo}", de ID ${id_programaNuevo} con el voluntario "${nombreVoluntario}"`, res, err);
                  }
                });
              });
            }

            derivacion.forEach((id_programa) => {
              db.run('INSERT INTO derivacionVoluntario (id_voluntario, id_derivacion) VALUES (?, ?)', [id_voluntario, id_programa], (err) => {
                if (err) {
                  return hacerRollback(500, `Error al asociar el programa con ID "${id_programa}" con el voluntario "${nombreVoluntario}"`, res, err);
                }
              });
            });
          });
        }
      }

      if (sets.length > 0) {
        const conjuntoSet = sets.join(', ');
        parametros.push(id_voluntario);
        //console.log(`3. La instrucción sería: UPDATE voluntarios SET ${conjuntoSet} WHERE id_voluntario = ${id_voluntario}`);
        //console.log(`Los parámetros son: ${parametros}`);
        db.run(`UPDATE voluntarios SET ${conjuntoSet} WHERE id_voluntario = ?`, parametros, (err) => {
          if (err) {
            return hacerRollback(500, 'Error al actualizar los datos del voluntario', res, err);
          }
        });
      }
      //console.log(`3. Los parámetros son: ${parametros}`);
      realizarCommit(res, 200, `Los datos del voluntario "${nombreVoluntario}" fueron modificados correctamente.`);
    });
  });
});

// Ruta para dar de baja a un voluntario
router.post('/bajaVoluntario', verificarSesionYStatus, (req, res) => {
  const { idVoluntario, clave } = req.body;
  const { id_usuario } = req.session.usuario;
  console.log(req.body);

  db.get('SELECT contraseña FROM usuarios WHERE id_usuario = ?', [id_usuario], async (err, row) => {
    if(err) {
      console.error(`Error al buscar al usuario que da de baja: ${err}`);
      return res.status(500).json({ mensaje: 'Error al localizar al usuario que da de baja' });
    }

    if(!row) {
      return res.status(404).json({ mensaje: 'No se localizó al usuario que da de baja' });
    } else {
      console.log('Se encontró la contraseña');
      const match = await bcrypt.compare(clave, row.contraseña);
      console.log(match);
      if(match) {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          db.run('UPDATE voluntarios SET estado = ? WHERE id_voluntario = ?', [2, idVoluntario], (err) => {
            if (err) {
              return hacerRollback(500, `Error al actualizar el estado del voluntario`, res, err);
            }

            db.run('DELETE FROM conjuntoVoluntarios WHERE id_filaVoluntarios = ?', [idVoluntario], (err) => {
              if(err) {
                return hacerRollback(500, `Error al eliminar al voluntario de la tabla general`, res, err);
              }

              realizarCommit(res, 200, `Se dio de baja correctamente al voluntario.`);
            });
          });
        });
      } else {
        return res.status(401).json({ status: 401, mensaje: 'Contraseña incorrecta.' });
      }
    }
  });
});

router.post('/consultaPrograma', verificarSesionYStatus, (req, res) => {
  const { id_programa } = req.body;
  const id_sede = req.body.id_sede || req.session.usuario.id_sede;

  db.get(`
    SELECT *
      FROM programas p
        INNER JOIN programasSede ps
          ON ps.id_programa = p.id_programa
        LEFT JOIN sedes s
          ON ps.id_sede = s.id_sede
      WHERE ps.id_sede = ? AND ps.id_programa = ?`, [id_sede, id_programa], (err, row) => {
    if(err) {
      console.error(`Error al consultar los datos del programa: ` + err);
      return res.status(500).json({ mensaje:'Error al consultar los datos del programa' });
    }
    if(!row) {
      return res.status(404).json({ mensaje: `No se encontró el programa buscado` });
    }
    console.log(row);
    return res.status(200).json({ mensaje: row });
  });
});

router.post('/consultaProgramas', verificarSesionYStatus, (req, res) => {
  const id_sede = req.body.id_sede || req.session.usuario.id_sede;
  
  let instruccion = `
    SELECT *
      FROM programas p
        INNER JOIN programasSede ps
          ON ps.id_programa = p.id_programa
        LEFT JOIN sedes s
          ON ps.id_sede = s.id_sede
  `;
  const params = [];
  if(id_sede === 1) {
    instruccion += "WHERE ps.id_sede IN (1, 2, 3, 4) ORDER BY sede";
  } else {
    instruccion += "WHERE ps.id_sede = ?";
    params.push(id_sede);
  }

  db.all(instruccion, params, (err, rows) => {
    if(err) {
      console.error(`Error al consultar los datos de todos los programas sociales para esta sede`);
      return res.status(500).json({ mensaje: 'Error al consultar todos los programas de esta sede' });
    }
    if(!rows) {
      return res.status(404).json({ mensaje: 'No se encontraron programas sociales para esta sede' });
    }
    res.status(200).json(rows);
  });
});

// Función para enviar correo para reestablecer contraseña
function enviarCorreoReestablecerContraseña(correo, token) {
  const mailOptions = {
    from: correoParaEnvios,
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

function hacerRollback(codigo, mensaje, res, error) {
  db.run('ROLLBACK', () => {
    console.error(`Error al hacer rollback: ${error}`);
    return res.status(codigo).json({ mensaje: mensaje });
  });
}

function realizarCommit(res, codigo, mensajeExito) {
  db.run('COMMIT', (err) => {
    if(err) {
      console.error(`Error al realizar commit: ${err}`);
      return hacerRollback(500, `Error al hacer commit de la transacción`, res, err);
    }
    //console.log('Se realizó commit correctamente');
    return res.status(codigo).json({ mensaje: mensajeExito });
  });
}

// Middleware para manejar rutas no encontradas
router.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'html', 'recursoNoEncontrado.html'));
});

module.exports = router;