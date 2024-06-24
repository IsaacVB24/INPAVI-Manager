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

const permisosPorRol = {
  1: ['/tablero', '/datosVoluntario', '/programas', '/entrada_inicio'],  // Rutas exclusivas del supervisor
  2: ['/tablero', '/modificarVoluntario', '/altaVoluntario', '/datosVoluntario', '/programas', '/inactivos', '/entrada_inicio'],  // Rutas exlusivas del delegado
  3: ['/tablero', '/modificarVoluntario', '/altaVoluntario', '/datosVoluntario'],  // Rutas exclusivas del coordinador DAS
  4: [],  // Rutas exclusivas del coordinador Entrada
  5: ['/tablero', '/altaVoluntario', '/datosVoluntario'],  // Rutas exclusivas del equipo directo DAS
  6: []   // Rutas exclusivas del equipo directo Entrada
};

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
  const rol = usuario.id_rol;
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
      // Usuario dado de alta
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

  if((!permisosPorRol[rol] || !permisosPorRol[rol].includes(ruta)) && status === 1) {
    return res.status(403).json({ mensaje: 'Tu rol no está permitido a acceder a esta ruta' });
  }
  next();
};

/*
router.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'html', 'sitioEnConstruccion.html'));
});
*/

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

router.get('/enConstruccion', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'sitioEnConstruccion.html'));
});

router.get('/inactivos', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'activarVoluntario.html'));
});

router.get('/principal', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'principal.html'));
});

router.get('/entrada_inicio', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'entrada_inicio.html'));
});

router.get('/altadespensas', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'altadespensas.html'));
});

router.get('/altacatdespensas', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'altacatdespensas.html'));
});

router.get('/index_entrada', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'entrada_inicio.html'));
});

router.get('/eliminardespensas', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'eliminardespensas.html'));
});

router.get('/modificarcatdespensas', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'modificarcatdespensas.html'));
});

router.get('/altacatproductos', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'altacatproductos.html'));
});

router.get('/visualizarcatdesp', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'Visualizar_cat_desp.html'));
});

router.get('/eliminarcatdepe', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'eliminarcatdepe.html'));
});

router.get('/eliminardepe', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'eliminardepe.html'));
});

router.get('/Visualizar_desp', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'Visualizar_desp.html'));
});

router.get('/altacatproductos', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'altacatproductos.html'));
});

router.get('/visualizarproductos', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'visualizarproductos.html'));
});

router.get('/eliminarproductos', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'eliminarproductos.html'));
});

router.get('/altafechaentrega', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'altafechaentrega.html'));
});

router.get('/modificarcdespensas', verificarSesionYStatus, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'modificarcdespensas.html'));
});

// Ruta para el inicio de sesión
router.post('/login', async (req, res) => {
  const { correo, contraseña, fechaUTC, zonaHorariaOffset } = req.body;

  try {
    // Buscar el usuario en la base de datos por correo
    db.get(`
      SELECT u.contraseña, u.status, u.id_rol, u.nombre_usuario, u.apellido_paterno, u.apellido_materno, u.id_sede, u.id_usuario, s.sede
      FROM usuarios u
      LEFT JOIN sedes s ON u.id_sede = s.id_sede
      WHERE u.correo = ?`, [correo], async (err, row) => {
      if (err) {
        console.error('Error al buscar usuario:', err);
        res.status(500).json({ mensaje: 'Error al buscar usuario en la base de datos' });
      } else {
        if (row) {
          // Verificar si la contraseña proporcionada coincide con la contraseña almacenada
          const match = await bcrypt.compare(contraseña, row.contraseña);
          if (match) {
            let sedeEnvio;
            if(row.id_rol === 2 && row.id_sede === 1) {
              sedeEnvio = 'Ajusco, Atlacomulco, Tultitlán, Xola';
            } else if(row.id_rol === 1) {
              sedeEnvio = 'INPAVI México';
            } else {
              sedeEnvio = row.sede;
            }
            // Establecer la sesión del usuario
            req.session.usuario = { correo, status: row.status, id_rol: row.id_rol, nombre: row.nombre_usuario, apPat: row.apellido_paterno, apMat: row.apellido_materno, id_sede: row.id_sede, id_usuario: row.id_usuario, sede: row.sede, fechaUTC: fechaUTC, zonaHorariaOffset: zonaHorariaOffset };
            if(row.status === 0) res.status(404).json({ mensaje: 'Correo no encontrado', sede: '', rol: '' });
            if(row.status === 1) res.status(200).json({ mensaje: 'Inicio de sesión correcto', ruta: '/tablero', sede: sedeEnvio, rol: row.id_rol });
            if(row.status === 2) res.status(200).json({ mensaje: 'En espera de que el usuario ingrese token de verificación de correo', ruta: '/ingresarToken', tipoUsuario: row.status, sede: '', rol: '' });
            if(row.status === 3) res.status(200).json({ mensaje: 'En espera de que un delegado apruebe la solicitud', ruta: '/verificacion', sede: '', rol: '' });
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

    if(id_rol === 4) return res.redirect('/index_entrada');

    db.get('SELECT rol FROM roles WHERE id_rol=?', [id_rol], (err, row) => {
      if(err) res.status(500).json({ mensaje: 'Error al consultar el rol del usuario' });
      if(!row) res.status(404).json({ mensaje: `No se encontró el rol con id: ${id_rol}` });
      const rol = row.rol;
      // Define los botones según el status del usuario
      let botones;
      switch (id_rol) {
        case 1: // Supervisor
          botones = [
            { nombre: 'Ver la información de un voluntario', ruta: '/datosVoluntario', inactivo: true, tipo: 'icon' },
            { nombre: 'Explorar programas', ruta: '/programas', inactivo: false, tipo: 'button' }
          ];
          break;
        case 2: // Delegado
          botones = [
            { nombre: 'Registrar a un voluntario', ruta: '/altaVoluntario', inactivo: false, tipo: 'button' },
            { nombre: 'Explorar programas', ruta: '/programas', inactivo: false, tipo: 'button' },
            { nombre: 'Modificar información de un voluntario', ruta: '/modificarVoluntario', inactivo: true, tipo: 'icon' },
            { nombre: 'Ver la información de un voluntario', ruta: '/datosVoluntario', inactivo: true, tipo: 'icon' },
            { nombre: 'Voluntarios prospectos', ruta: '/inactivos', inactivo: false, tipo: 'button' }
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

router.get('/obtenerOcupaciones', (req, res) => {
  if (req.session && req.session.usuario) {
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
  } else {
    res.redirect('/');
  }
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

router.post('/obtenerVoluntariosEquipoDirecto', (req, res) => {
  // Verifica si hay un usuario en la sesión
  if (req.session && req.session.usuario) {
    const { id_sede, id_rol } = req.session.usuario;
    const { busqueda } = req.body;

    let consulta = 
    `SELECT
      v.id_voluntario,
      v.nombre_v,
      v.apellido_paterno_v,
      v.informe_valoracion,
      v.estado,
      v.ocupacion,
      v.observaciones,
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
      consulta += ' WHERE v.estado=1 AND v.id_sede IN (1,2,3,4) ';
    } else if(!(id_rol === 2 && id_sede === 1) && id_rol !== 1) {
      consulta += ' WHERE v.estado=1 AND v.id_sede=? ';
      parametros.push(id_sede);
    }
    if (busqueda) {
      const criterio = busqueda[0];
      const separadas = criterio.split(' ');
      consulta += id_rol === 1 ? 'WHERE ' : 'AND ';
      consulta += `(v.nombre_v LIKE ? OR v.apellido_paterno_v LIKE ? OR v.ocupacion LIKE ? OR p.programa LIKE ? OR iv.interes LIKE ? OR pc.contacto LIKE ? OR s.sede LIKE ? OR v.observaciones LIKE ?) `;
      parametros.push(`%${criterio}%`);
      parametros.push(`%${criterio}%`);
      parametros.push(`%${criterio}%`);
      parametros.push(`%${criterio}%`);
      parametros.push(`%${criterio}%`);
      parametros.push(`%${criterio}%`);
      parametros.push(`%${criterio}%`);
      parametros.push(`%${criterio}%`);
      if(separadas.length === 2) {
        consulta += `OR (v.nombre_v LIKE ? AND v.apellido_paterno_v LIKE ?)`;
        parametros.push(`%${separadas[0]}%`);
        parametros.push(`%${separadas[1]}%`);
      }
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

router.get('/obtenerProgramas', (req, res) => {
  if (req.session && req.session.usuario) {
    db.all(`
      SELECT p.*, ps.cantidadInvolucrados
      FROM programas p
      LEFT JOIN programasSede ps ON p.id_programa = ps.id_programa
      WHERE id_sede = ?`, [req.session.usuario.id_sede], (err, rows) => {
      if(err) {
        res.status(500).json({ mensaje: 'Error al consultar los programas sociales en la base de datos' });
      }
      if(rows) {
        // Crear un arreglo de objetos con el id y nombre del programa
        const programas = rows.map(row => ({
          id: row.id_programa,
          nombre: row.programa,
          cantidadVoluntarios: row.cantidadInvolucrados
        }));

        // Enviar la respuesta en formato JSON
        res.status(200).json(programas);
      } else {
        res.status(404).json({ mensaje: 'No se encontró ningún programa social' });
      }
    });
  } else {
    res.redirect('/');
  }
});

router.get('/obtenerPrimerosContactos', (req,res) => {
  if (req.session && req.session.usuario) {
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
  } else {
    res.redirect('/');
  }
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

router.post('/infoVoluntario', (req, res) => {
  if (req.session && req.session.usuario) {
      const { id_voluntario } = req.body;

    db.get(`
      SELECT 
        v.id_voluntario, 
        v.id_voluntarioAsignado, 
        cv.nombreCompleto AS nombre_voluntarioAsignado,
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
        conjuntoVoluntarios cv ON v.id_voluntarioAsignado = cv.id_voluntario
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
  } else {
    res.redirect('/');
  }
});

router.post('/modificarDatosVoluntario', (req, res) => {
  if (req.session && req.session.usuario) {
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

    db.get('SELECT nombre_v, apellido_paterno_v, apellido_materno_v, id_sede FROM voluntarios WHERE id_voluntario = ?', [id_voluntario], (err, row) => {
      if (err) {
        return res.status(500).json({ mensaje: 'Error al buscar el voluntario en la base de datos' });
      }
      if (!row) {
        return res.status(404).json({ mensaje: 'El voluntario no fue encontrado' });
      }

      let programasViejos;
      db.all('SELECT id_derivacion FROM derivacionVoluntario WHERE id_voluntario = ?', [id_voluntario], (err, rows) => {
        if (err) {
          return hacerRollback(500, `Error al obtener los programas de derivación actuales del voluntario`, res, err);
        }
        programasViejos = rows;
      });

      const nombreVoluntario = row.nombre_v;
      const id_sedeActual = row.id_sede;
      const apPatActual = row.apellido_paterno_v;
      const apMatActual = row.apellido_materno_v;

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        if(id_sede !== null) {
          if(id_sede !== id_sedeActual) {
            db.run('UPDATE conjuntoVoluntarios SET id_sede = ? WHERE id_filaVoluntarios = ?', [id_sede, id_voluntario], (err) => {
              if(err) {
                return hacerRollback(500, `Error al actualizar la sede del voluntario en la tabla general de voluntarios`, res, err);
              }

              if(derivacion === null) {
                programasViejos.forEach(id_programaViejo => {
                  db.run('UPDATE programasSede SET cantidadInvolucrados = cantidadInvolucrados - 1 WHERE id_sede = ? AND id_programa = ?', [id_sedeActual, id_programaViejo.id_derivacion], (err) => {
                    if(err) {
                      return hacerRollback(500, `Error al descontar un voluntario del programa con ID ${id_programaViejo.id_derivacion} en la transferencia de sede`, res, err);
                    }

                    db.run('UPDATE programasSede SET cantidadInvolucrados = cantidadInvolucrados + 1 WHERE id_sede = ? AND id_programa = ?', [id_sede, id_programaViejo.id_derivacion], (err) => {
                      if(err) {
                        return hacerRollback(500, `Error al aumentar un voluntario del programa con ID ${id_programaViejo.id_derivacion} en la transferencia de sede`, res, err);
                      }
                    });
                  });
                });
              }
            });
          }
        }

        if(nombreVoluntario !== nombres || apPatActual !== apPat || apMatActual !== apMat && (nombres !== null || apPat !== null || apMat !== null)) {
          let nombrePorModificar = nombreVoluntario;
          let apPatPorModificar = apPatActual;
          let apMatPorModificar = apMatActual;
          if(nombres !== null) nombrePorModificar = nombres;
          if(apPat !== null) apPatPorModificar = apPat;
          if(apMat !== null) apMatPorModificar = apMat;
          db.run('UPDATE conjuntoVoluntarios SET nombreCompleto = ? WHERE id_filaVoluntarios = ?', [`${nombrePorModificar} ${apPatPorModificar} ${apMatPorModificar}`, id_voluntario], (err) => {
            if(err) {
              return hacerRollback(500, `Error al actualizar el nombre del voluntario`, res, err);
            }
          });
        }

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
            db.run('UPDATE voluntarios SET estado = ? WHERE id_voluntario = ?', [1, id_voluntario], (err) => {
              if(err) {
                return hacerRollback(500, `Error al actualizar el estado del voluntario`, res, err);
              }

              db.get('SELECT 1 FROM conjuntoVoluntarios WHERE id_filaVoluntarios = ?', [id_voluntario], (err, row) => {
                if(err) {
                  return hacerRollback(500, `Error al comprobar si el voluntario ya está en la tabla general de voluntarios`, res, err);
                }
                if(!row) {
                  db.run('INSERT INTO conjuntoVoluntarios (nombreCompleto, id_sede, tipoPersona, id_filaVoluntarios) VALUES (?, ?, ?, ?)', [`${nombreVoluntario} ${apPatActual} ${apMatActual}`, id_sedeActual, 1, id_voluntario], (err) => {
                    if(err) {
                      return hacerRollback(500, `Error al asociar al voluntario a la tabla general de voluntarios activos`, res, err);
                    }
                  });
                }
              });
            });

            db.run('DELETE FROM derivacionVoluntario WHERE id_voluntario = ?', [id_voluntario], (err) => {
              if (err) {
                return hacerRollback(500, `Error al eliminar los programas de derivación anteriores del voluntario`, res, err);
              }

              programasViejos.forEach(idViejo => {
                db.run('UPDATE programasSede SET cantidadInvolucrados = cantidadInvolucrados - 1 WHERE id_programa = ? AND id_sede = ?', [idViejo.id_derivacion, id_sedeActual], (err) => {
                  if (err) {
                    return hacerRollback(500, `Error al descontar un voluntario para el programa con ID "${idViejo.id_derivacion}" de la sede con ID "${id_sedeActual}"`, res, err);
                  }

                  
                });
              });
              
              derivacion.forEach((id_programa) => {
                db.run('INSERT INTO derivacionVoluntario (id_voluntario, id_derivacion) VALUES (?, ?)', [id_voluntario, id_programa], (err) => {
                  if (err) {
                    return hacerRollback(500, `Error al asociar el programa con ID "${id_programa}" con el voluntario "${nombreVoluntario}"`, res, err);
                  }
                  
                  db.run('UPDATE programasSede SET cantidadInvolucrados = cantidadInvolucrados + 1 WHERE id_programa = ? AND id_sede = ?', [id_programa, id_sede || id_sedeActual], (err) => {
                    if (err) {
                      return hacerRollback(500, `Error al aumentar un voluntario para el programa con ID "${id_programa}" de la sede con ID "${id_sede}"`, res, err);
                    }
                  });
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
  } else {
    res.redirect('/');
  }
});

// Ruta para dar de baja a un voluntario
router.post('/bajaVoluntario', (req, res) => {
  if (req.session && req.session.usuario) {
    const { idVoluntario, clave, motivo } = req.body;
    const { id_usuario } = req.session.usuario;

    db.get('SELECT contraseña FROM usuarios WHERE id_usuario = ?', [id_usuario], async (err, row) => {
      if(err) {
        console.error(`Error al buscar al usuario que da de baja: ${err}`);
        return res.status(500).json({ mensaje: 'Error al localizar al usuario que da de baja' });
      }

      if(!row) {
        return res.status(404).json({ mensaje: 'No se localizó al usuario que da de baja' });
      } else {
        const match = await bcrypt.compare(clave, row.contraseña);
        db.all('SELECT v.id_sede, dv.id_derivacion, cv.nombreCompleto, p.programa FROM voluntarios v LEFT JOIN derivacionVoluntario dv ON v.id_voluntario = dv.id_voluntario LEFT JOIN conjuntoVoluntarios cv ON v.id_voluntario = cv.id_filaVoluntarios LEFT JOIN programas p ON p.id_programa = dv.id_derivacion WHERE v.id_voluntario = ?', [idVoluntario], (err, rows) => {
          if(err) {
            console.error(`Error al obtener la sede y la derivación del voluntario a dar de baja.`);
            return res.status(500).json({ mensaje: 'Error al obtener la sede y la derivación del voluntario a dar de baja' });
          }
          if(rows) {
            const nombreVoluntario = rows[0].nombreCompleto;
            let programasVoluntario = [];
            rows.forEach(fila => {
              programasVoluntario.push(fila.programa);
            });
            if(match) {
              db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                rows.forEach(datosDerivacion => {
                  db.run('UPDATE programasSede SET cantidadInvolucrados = cantidadInvolucrados - 1 WHERE id_programa = ? AND id_sede = ?', [datosDerivacion.id_derivacion, datosDerivacion.id_sede], (err) => {
                    if(err) {
                      return hacerRollback(500, `Error al descontar un voluntario del programa con ID ${datosDerivacion.id_derivacion} de la sede con ID ${datosDerivacion.id_sede}`, res, err);
                    }
                  });
                });

                db.run('UPDATE voluntarios SET estado = ? WHERE id_voluntario = ?', [2, idVoluntario], (err) => {
                  if (err) {
                    return hacerRollback(500, `Error al actualizar el estado del voluntario`, res, err);
                  }

                  db.run('DELETE FROM conjuntoVoluntarios WHERE id_filaVoluntarios = ?', [idVoluntario], (err) => {
                    if(err) {
                      return hacerRollback(500, `Error al eliminar al voluntario de la tabla general`, res, err);
                    }

                    db.run('DELETE FROM derivacionVoluntario WHERE id_voluntario = ?', [idVoluntario], (err) => {
                      if (err) {
                        return hacerRollback(500, `Error al desvincular al voluntario de los programas de derivación`, res, err);
                      }
                      
                      db.get('SELECT correo FROM usuarios WHERE id_rol = ? AND id_sede = ?', [2, req.session.usuario.id_sede], (err, row) => {
                        if(err) {
                          return hacerRollback(500, `Error al obtener el correo del delegado para la notificación de la baja.`, res, err);
                        }
                        if(!row) {
                          return hacerRollback(403, `No se completó la operación debido a que no existe actualmente un delegado de esta sede`, res, err);
                        } else {
                          const correoDelegado = row.correo;
                          
                          const fechaUTC = new Date();
                          const zonaHorariaOffset = req.session.usuario.zonaHorariaOffset;

                          const fechaLocal = new Date(fechaUTC.getTime() - (zonaHorariaOffset * 60000));

                          // Obtener componentes individuales de fecha y hora
                          const anio = fechaLocal.getFullYear();
                          const mes = (fechaLocal.getMonth() + 1).toString().padStart(2, '0');
                          const dia = fechaLocal.getDate().toString().padStart(2, '0');
                          const horas = fechaLocal.getHours().toString().padStart(2, '0');
                          const minutos = fechaLocal.getMinutes().toString().padStart(2, '0');

                          // Obtener componentes individuales de la hora UTC
                          const horasUTC = fechaUTC.getUTCHours().toString().padStart(2, '0');
                          const minutosUTC = fechaUTC.getUTCMinutes().toString().padStart(2, '0');
                          const horaUTC = `${horasUTC}:${minutosUTC}`;

                          // Formatear la fecha y la hora
                          const fechaFormateada = `${dia}/${mes}/${anio}`;
                          const horaFormateada = `${horas}:${minutos}`;
                          enviarCorreoEnTransaccion(correoDelegado, 'Baja de voluntario', `<strong>¡Alerta!</strong> Se ha dado de baja al voluntario "${nombreVoluntario}", quien tenía vinculación en los programas: ${formateoArregloParaImpresion(programasVoluntario)}. La baja se debe dado lo siguiente: <br>
                          "${motivo}"
                          <br><br>
                          Datos de quien dio de baja: <br>
                            > Nombre: ${req.session.usuario.nombre} ${req.session.usuario.apPat} ${req.session.usuario.apMat}<br>
                            > Fecha: ${fechaFormateada}<br>
                            > Hora: ${horaFormateada} horas (${horaUTC} horas - Tiempo UTC)<br>
                          <br><br>
                          Si crees que se trata de un error, <a href='${dominio}'>accede</a> al sistema para visualizar la información.`);
                        }
                      });
                    });
                  });
                });
                realizarCommit(res, 200, `Se dio de baja correctamente al voluntario.`);
              });
            } else {
              return res.status(401).json({ status: 401, mensaje: 'Contraseña incorrecta.' });
            }
          }
        });
      }
    });
  } else {
    res.redirect('/');
  }
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

router.post('/consultaProgramas', (req, res) => {
  if (req.session && req.session.usuario) {
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
    if(req.session.usuario.id_rol === 1) {
      instruccion += "ORDER BY sede";
    } else if(id_sede === 1) {
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
  } else {
    res.redirect('/');
  }
});

router.post('/voluntariosParaAlta', (req, res) => {
  if (req.session && req.session.usuario) {
    const { criterioBusqueda } = req.body;
    const id_sedeConsulta = (req.session.usuario.id_sede === 1 && req.session.usuario.id_rol === 2) ? 'cdmx' : req.session.usuario.id_sede;
    const parametros = [];
    let consulta = `
    SELECT 
      v.id_voluntario,
      v.nombre_v,
      v.apellido_paterno_v,
      v.apellido_materno_v,
      v.ocupacion, v.observaciones,
      GROUP_CONCAT(DISTINCT iv.interes) AS intereses,
      GROUP_CONCAT(DISTINCT p.programa) AS programas,
      u.nombre_usuario,
      u.apellido_paterno,
      u.apellido_materno,
      sua.sede as sedeUsuarioAlta,
      sv.sede as sedeVoluntario
    FROM voluntarios v
    LEFT JOIN interesesVoluntario iv ON v.id_voluntario = iv.id_voluntario
    LEFT JOIN valoracionVoluntario vv ON v.id_voluntario = vv.id_voluntario
    LEFT JOIN programas p ON vv.id_valoracion = p.id_programa
    LEFT JOIN usuarios u ON v.id_usuarioQueDaDeAlta = u.id_usuario
    LEFT JOIN sedes sua ON u.id_sede = sua.id_sede
    LEFT JOIN sedes sv ON v.id_sede = sv.id_sede
    WHERE v.estado != 1 `;

    if (id_sedeConsulta === 'cdmx') {
      consulta += 'AND v.id_sede IN (1, 2, 3, 4) ';
    } else {
      consulta += 'AND v.id_sede = ? ';
      parametros.push(id_sedeConsulta);
    }

    if (criterioBusqueda) {
      consulta += `AND (v.nombre_v LIKE ? OR v.apellido_paterno_v LIKE ? OR v.apellido_materno_v LIKE ? OR v.ocupacion LIKE ? OR v.observaciones LIKE ? OR iv.interes LIKE ? OR p.programa LIKE ? OR u.nombre_usuario LIKE ? OR u.apellido_paterno LIKE ? OR u.apellido_materno LIKE ? OR sua.sede LIKE ? OR sv.sede LIKE ?) `;
      const busquedaParam = `%${criterioBusqueda}%`;
      for (let i = 0; i < 12; i++) {
        parametros.push(busquedaParam);
      }

      const separadas = criterioBusqueda.split(' ');
      if (separadas.length === 2) {
        consulta += `OR ((v.nombre_v LIKE ? AND v.apellido_paterno_v LIKE ?) OR (u.nombre_usuario LIKE ? AND u.apellido_paterno LIKE ?)) `;
        parametros.push(`%${separadas[0]}%`, `%${separadas[1]}%`, `%${separadas[0]}%`, `%${separadas[1]}%`);
      }
      if (separadas.length === 3) {
        consulta += `OR ((v.nombre_v LIKE ? AND v.apellido_paterno_v LIKE ? AND v.apellido_materno_v LIKE ?) OR (u.nombre_usuario LIKE ? AND u.apellido_paterno LIKE ? AND u.apellido_materno LIKE ?)) `;
        parametros.push(`%${separadas[0]}%`, `%${separadas[1]}%`, `%${separadas[2]}%`, `%${separadas[0]}%`, `%${separadas[1]}%`, `%${separadas[2]}%`);
      }
    }
    consulta += 'GROUP BY v.id_voluntario';

    db.all(consulta, parametros, (err, rows) => {
      if (err) {
        console.error(`Error al obtener los voluntarios que solo están registrados: ${err}`);
        return res.status(500).json({ mensaje: 'Error al obtener los voluntarios que solo están registrados' });
      }
      if (!rows.length) {
        return res.status(200).json({ voluntariosArray: [] });
      } else {
        const voluntarios = {};

        rows.forEach(row => {
          if (!voluntarios[row.id_voluntario]) {
            voluntarios[row.id_voluntario] = {
              id_voluntario: row.id_voluntario,
              nombreVoluntario: `${row.nombre_v} ${row.apellido_paterno_v} ${row.apellido_materno_v}`,
              ocupacion: row.ocupacion,
              observaciones: row.observaciones,
              usuarioDeAlta: `${row.sedeUsuarioAlta} - ${row.nombre_usuario} ${row.apellido_paterno} ${row.apellido_materno}`,
              sedeVoluntario: (req.session.usuario.id_rol === 2 && req.session.usuario.id_sede === 2) ? row.sedeVoluntario : null,
              intereses: row.intereses,
              valoracion: row.programas
            };
          }
        });
        const voluntariosArray = Object.values(voluntarios);
        res.status(200).json({ voluntariosArray });
      }
    });
  } else {
    res.redirect('/');
  }
});

router.post('/altacatdespensas', (req, res) => {
  const categorias = [];

  // Obtener los datos del cuerpo de la solicitud
  for (let i = 1; i <= 11; i++) { // Iterar hasta 10, ajustar según tu límite máximo
    if (req.body[`nombre_categoria_${i}`]) {
      categorias.push({
        nombre_categoria: req.body[`nombre_categoria_${i}`],
        descripcion_despensa: req.body[`descripcion_despensa_${i}`],
        cantidad_prod_despensa: req.body[`cantidad_prod_despensa_${i}`]
      });
    }
  }
  
  // Verificar si se recibieron datos de categorías
  if (categorias.length === 0) {
    return res.status(400).json({ mensaje: 'No se recibieron categorías' });
  }

  // Iniciar una transacción
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Iterar sobre las categorías recibidas
    categorias.forEach((categoria, index) => {
      const { nombre_categoria, descripcion_despensa, cantidad_prod_despensa } = categoria;

      // Validar campos necesarios
      if (!nombre_categoria || !cantidad_prod_despensa) {
        return res.status(400).json({ mensaje: `Faltan campos obligatorios para la categoría ${index + 1}` });
      }

      // Verificar si la categoría ya existe
      db.get('SELECT nombre_categoria FROM CategoriaDespensa WHERE nombre_categoria = ?', [nombre_categoria], (err, row) => {
        if (err) {
          console.error('Error al verificar si la categoría existe:', err);
          db.run('ROLLBACK'); // Deshacer la transacción en caso de error
          return res.status(500).json({ mensaje: 'Error interno del servidor' });
        }

        if (row) {
          // La categoría ya existe
          return res.status(409).json({ mensaje: `La categoría ${nombre_categoria} ya existe en la base de datos` });
        } else {
          // Insertar la categoría si no existe
          db.run('INSERT INTO CategoriaDespensa (nombre_categoria, descripcion_despensa, cantidad_prod_despensa) VALUES (?, ?, ?)',
            [nombre_categoria, descripcion_despensa, cantidad_prod_despensa], function(err) {
              if (err) {
                console.error(`Error al insertar categoría ${nombre_categoria}:`, err.message);
                db.run('ROLLBACK'); // Deshacer la transacción en caso de error
                return res.status(500).json({ mensaje: `Error al insertar la categoría ${nombre_categoria} en la base de datos` });
              }
              console.log(`Categoría ${nombre_categoria} insertada correctamente. ID de la fila:`, this.lastID);

              // Si es la última categoría, hacer COMMIT de la transacción
              if (index === categorias.length - 1) {
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('Error al hacer COMMIT:', err);
                    return res.status(500).json({ mensaje: 'Error interno del servidor' });
                  }
                  res.status(201).json({ mensaje: '¡Categorías registradas correctamente!' });
                });
              }
            });
        }
      });
    });
  });
});

//obtener categorias despensas
router.get('/obtenerCategoriasDespensas', (req, res) => {
  db.all('SELECT id, nombre_categoria FROM CategoriaDespensa;', (err, rows) => {
    if(err) {
      res.status(500).json({ mensaje: 'No se pudieron consultar las categorias' });
    } else {
      const categoriasDespensas = [];
      rows.forEach(row => {
        categoriasDespensas.push(row.nombre_categoria);
      });
      res.status(200).json(categoriasDespensas);
    }
  });
});

router.post('/registrar_despensa', (req, res) => {
  const { nombre_categoria, cantidad_despensas } = req.body;

  // Validar que cantidad_despensas sea un número positivo
  const cantidad = parseInt(cantidad_despensas);
  if (isNaN(cantidad) || cantidad <= 0) {
      return res.status(400).json({ mensaje: 'La cantidad de despensas debe ser un número positivo.' });
  }

  // Verificar si ya existe un registro de despensa para la categoría seleccionada
  db.get('SELECT id FROM CategoriaDespensa WHERE nombre_categoria = ?', [nombre_categoria], (err, row) => {
      if (err) {
          console.error('Error al verificar si existe la categoría:', err);
          return res.status(500).json({ mensaje: 'Error interno del servidor' });
      }

      if (!row) {
          // Si la categoría no existe, retornar un error
          return res.status(404).json({ mensaje: 'La categoría no existe en la base de datos' });
      }

      const categoria_despensa_id = row.id;

      // Verificar si ya existe un registro de despensa para la categoría seleccionada
      db.get('SELECT * FROM Despensas WHERE categoria_despensa_id = ?', [categoria_despensa_id], (err, row) => {
          if (err) {
              console.error('Error al verificar si ya existe un registro de despensa:', err);
              return res.status(500).json({ mensaje: 'Error interno del servidor' });
          }

          if (row) {
              // Si ya existe un registro, actualizar la cantidad de despensas
              const cantidadExistente = parseInt(row.cantidad_despensas); // Convertir a número
              const nuevaCantidad = cantidadExistente + cantidad; // Sumar correctamente

              db.run('UPDATE Despensas SET cantidad_despensas = ? WHERE categoria_despensa_id = ?', [nuevaCantidad, categoria_despensa_id], function(err) {
                  if (err) {
                      console.error('Error al actualizar la cantidad de despensas:', err.message);
                      return res.status(500).json({ mensaje: 'Error al actualizar la cantidad de despensas en la base de datos' });
                  }
                  console.log('Cantidad de despensas actualizada correctamente.');
                  res.status(200).json({ mensaje: '¡Cantidad de despensas actualizada correctamente!' });
              });
          } else {
              // Si no existe un registro, realizar la inserción
              db.run('INSERT INTO Despensas (categoria_despensa_id, cantidad_despensas) VALUES (?, ?)', [categoria_despensa_id, cantidad], function(err) {
                  if (err) {
                      console.error('Error al insertar el registro de despensa:', err.message);
                      return res.status(500).json({ mensaje: 'Error al insertar el registro de despensa en la base de datos' });
                  }
                  console.log('Registro de despensa insertado correctamente.');
                  res.status(201).json({ mensaje: '¡Registro de despensa insertado correctamente!' });
              });
          }
      });
  });
});

router.post('/eliminardespensas', (req, res) => {
  const { nombre_categoria, cantidad_eliminar } = req.body;

  console.log('Categoría a eliminar despensas:', nombre_categoria);
  console.log('Cantidad a eliminar:', cantidad_eliminar);

  // Obtener el ID de la categoría de despensa
  db.get('SELECT id, cantidad_despensas FROM Despensas WHERE categoria_despensa_id = (SELECT id FROM CategoriaDespensa WHERE nombre_categoria = ?)', [nombre_categoria], (err, row) => {
    if (err) {
      console.error('Error al verificar si existe la categoría:', err);
      return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
    console.log('Resultado del primer SELECT:', row);
    if (!row) {
      console.log('La categoría no existe en la base de datos de despensas');
      return res.status(404).json({ mensaje: 'La categoría no existe en la base de datos de despensas' });
    }

    const { id, cantidad_despensas } = row;
    console.log('ID de la categoría de despensa:', id);
    console.log('Cantidad actual de despensas:', cantidad_despensas);

    // Verificar si hay suficientes despensas para eliminar
    if (cantidad_eliminar > cantidad_despensas) {
      console.log('No se pueden eliminar más despensas de las que existen');
      return res.status(400).json({ mensaje: 'No se pueden eliminar más despensas de las que existen' });
    }

    // Calcular la nueva cantidad de despensas después de la eliminación
    const nuevaCantidad = cantidad_despensas - cantidad_eliminar;
    console.log('Nueva cantidad de despensas después de eliminar:', nuevaCantidad);

    // Actualizar la cantidad de despensas en la base de datos
    db.run('UPDATE Despensas SET cantidad_despensas = ? WHERE id = ?', [nuevaCantidad, id], function(err) {
      if (err) {
        console.error('Error al actualizar la cantidad de despensas:', err.message);
        return res.status(500).json({ mensaje: 'Error al actualizar la cantidad de despensas en la base de datos' });
      }
      console.log('Cantidad de despensas actualizada correctamente.');
      res.status(200).json({ mensaje: '¡Cantidad de despensas actualizada correctamente!' });
    });
  });
});

router.post('/modificar_despensa', (req, res) => {
  const { nombre_categoria, descripcion_despensa, cantidad_prod_despensa, campo_modificar } = req.body;

  // Consultar los datos actuales de la categoría
  db.get('SELECT * FROM CategoriaDespensa WHERE nombre_categoria = ?', [nombre_categoria], (err, row) => {
    if (err) {
      return res.json({ mensaje: 'Error al consultar la categoría' });
    }

    if (!row) {
      return res.json({ mensaje: 'Categoría no encontrada' });
    }

    let updates = [];
    let params = [];

    // Verificar si los datos nuevos son diferentes a los actuales
    if (campo_modificar.includes('descripcion') && descripcion_despensa !== row.descripcion_despensa) {
      updates.push('descripcion_despensa = ?');
      params.push(descripcion_despensa);
    }

    if (campo_modificar.includes('cantidad') && cantidad_prod_despensa !== row.cantidad_prod_despensa) {
      updates.push('cantidad_prod_despensa = ?');
      params.push(cantidad_prod_despensa);
    }

    if (updates.length === 0) {
      return res.json({ mensaje: 'No hay cambios en los datos' });
    }

    params.push(nombre_categoria);

    // Construir la consulta SQL dinámica
    const sql = `UPDATE CategoriaDespensa SET ${updates.join(', ')} WHERE nombre_categoria = ?`;

    // Ejecutar la consulta SQL
    db.run(sql, params, function(err) {
      if (err) {
        return res.json({ mensaje: 'Error al actualizar la categoría' });
      }
      res.json({ mensaje: 'Categoría actualizada correctamente' });
    });
  });
});

router.get('/obtener_datos_despensas', (req, res) => {
  db.all('SELECT * FROM CategoriaDespensa', (err, rows) => {
      if (err) {
          console.error(err.message);
          res.status(500).json({ error: 'Error al obtener datos de la base de datos' });
      } else {
          console.log(rows); // Verifica los datos obtenidos
          res.json(rows); // Enviar los datos como JSON al cliente
      }
  });
});

router.post('/eliminar_categoria_despe', (req, res) => {
  const { nombre_categoria } = req.body;

  db.get(`SELECT cantidad_prod_despensa FROM CategoriaDespensa WHERE nombre_categoria = ?`, [nombre_categoria], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ mensaje: "Error al verificar la categoría" });
    } else if (row && row.cantidad_prod_despensa > 0) {
      res.json({ mensaje: "No se puede eliminar la categoría porque tiene despensas asociadas" });
    } else {
      db.run(`DELETE FROM CategoriaDespensa WHERE nombre_categoria = ?`, [nombre_categoria], function(err) {
        if (err) {
          console.error(err.message);
          res.status(500).json({ mensaje: "Error al eliminar la categoría" });
        } else {
          res.json({ mensaje: "Categoría eliminada correctamente" });
        }
      });
    }
  });
});

router.get('/cantidad_despensas', (req, res) => {
  const categoriaId = req.query.categoriaId;
  console.log(`Categoria ID recibida: ${categoriaId}`);
  db.get('SELECT cantidad_despensas FROM Despensas WHERE categoria_despensa_id = ?', [categoriaId], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Error al obtener la cantidad de despensas' });
    } else {
      const cantidad = row ? row.cantidad_despensas : 0;
      console.log(`Resultado de la consulta: ${cantidad}`);
      res.json({ cantidad_despensas: cantidad });
    }
  });
});

router.get('/obtener_despensas', (req, res) => {
  db.all('SELECT * FROM Despensas', (err, rows) => {
      if (err) {
          console.error(err.message);
          res.status(500).json({ error: 'Error al obtener datos de la base de datos' });
      } else {
          console.log(rows); // Verifica los datos obtenidos
          res.json(rows); // Enviar los datos como JSON al cliente
      }
  });
});

// Ruta para obtener el nombre de una categoría específica por su id
router.get('/obtenerNombreCategoria/:id', (req, res) => {
  const categoriaId = req.params.id;
  db.get('SELECT nombre_categoria FROM CategoriaDespensa WHERE id = ?', [categoriaId], (err, row) => {
      if (err) {
          console.error("Error al obtener nombre de categoría:", err);
          res.status(500).json({ error: 'Error al obtener nombre de categoría' });
      } else {
          res.json({ nombre_categoria: row.nombre_categoria });
      }
  });
});

// Ruta para obtener la cantidad de despensas asociadas a una categoría
router.get('/obtener_cantidad_despensas/:categoriaId', (req, res) => {
  const { categoriaId } = req.params;
  console.log(req.params);

  db.get('SELECT SUM(cantidad_despensas) AS cantidadDespensas FROM Despensas WHERE categoria_despensa_id = ?', [categoriaId], (err, row) => {
      if (err) {
          console.error(err.message);
          res.status(500).json({ error: 'Error al obtener la cantidad de despensas' });
      } else {
          const cantidadDespensas = row ? row.cantidadDespensas : 0;
          console.log(`categoriaId: ${categoriaId}, cantidadDespensas: ${cantidadDespensas}`);
          res.json({ cantidadDespensas });
      }
  });
});

router.post('/altacatprod', (req, res) => {
  const categorias = []; // Arreglo para almacenar las categorías recibidas

  // Obtener las categorías del cuerpo del formulario
  for (let i = 1; i <= 10; i++) { // Iteramos hasta 10, ya que es el límite máximo definido
    const nombre_categoria = req.body[`nombre_categoria_${i}`]; // Obtener el nombre de la categoría del campo correspondiente

    if (nombre_categoria) {
      categorias.push(nombre_categoria); // Agregar el nombre de la categoría al arreglo
    }
  }

  // Iniciar una transacción
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Insertar las categorías en la base de datos con verificación de existencia
    const stmt = db.prepare('INSERT INTO categoria_productos (nombre_categor_prod) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM categoria_productos WHERE nombre_categor_prod = ?)');
    categorias.forEach((nombre_categoria) => {
      stmt.run(nombre_categoria, nombre_categoria);
    });
    stmt.finalize();

    // Confirmar la transacción
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error al confirmar la transacción:', err.message);
        res.status(500).json({ mensaje: 'Error al registrar categorías' });
      } else {
        console.log('Categorías registradas correctamente');
        res.json({ mensaje: 'Categorías registradas correctamente' });
      }
    });
  });
});

router.get('/visualizarproductosstock', (req, res) => {
  db.all('SELECT * FROM categoria_productos', (err, rows) => {
    if (err) {
      console.error('Error al obtener categorías de productos:', err.message);
      res.status(500).json({ mensaje: 'Error al obtener categorías de productos' });
    } else {
      console.log(rows); // Verifica los datos obtenidos
      res.json(rows); // Enviar los datos como JSON al cliente
  }
  });
});

router.get('/productos', (req, res) => {
  db.all('SELECT id_categ_prod, nombre_categor_prod FROM categoria_productos', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      productos: rows
    });
  });
});

router.delete('/eliminarproductos/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM categoria_productos WHERE id_categ_prod = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, mensaje: 'Producto eliminado correctamente.' });
  });
});

router.post('/altafechaentrega', async (req, res) => {
  const { fechas } = req.body;
console.log(req.body);
  // Verificar si se recibieron fechas
  if (!fechas || fechas.length === 0) {
      return res.status(400).json({ mensaje: 'Fecha insertada correctamente' });
  }

  // Iniciar una transacción
  db.beginTransaction(function(err) {
      if (err) {
          console.error('Error al iniciar la transacción:', err.message);
          return res.status(500).json({ mensaje: 'Error interno del servidor' });
      }

      // Iterar sobre cada fecha para realizar la inserción
      fechas.forEach(({ fecha_entrega, descripcion_entrega }, index) => {
          // Verificar si la fecha ya existe en la base de datos
          db.get('SELECT id_fecha_entrega FROM entregas WHERE fecha_entrega = ?', [fecha_entrega], (err, row) => {
              if (err) {
                  db.rollback(function() {
                      console.error('Error en consulta SELECT:', err.message);
                      res.status(500).json({ mensaje: 'Error interno del servidor' });
                  });
              }

              if (row) {
                  // Si la fecha ya existe, omitir la inserción
                  console.log(`La fecha ${fecha_entrega} ya está registrada en la base de datos. Se omite la inserción.`);
              } else {
                  // Insertar la nueva fecha de entrega
                  db.run('INSERT INTO entregas (fecha_entrega, descripcion_entrega) VALUES (?, ?)', [fecha_entrega, descripcion_entrega], function(err) {
                      if (err) {
                          db.rollback(function() {
                              console.error('Error en consulta INSERT:', err.message);
                              res.status(500).json({ mensaje: 'Error interno del servidor' });
                          });
                      }

                      // Si es la última inserción exitosa, hacer commit de la transacción
                      if (index === fechas.length - 1) {
                          db.commit(function(err) {
                              if (err) {
                                  console.error('Error al hacer commit:', err.message);
                                  res.status(500).json({ mensaje: 'Error interno del servidor' });
                              } else {
                                  res.status(200).json({ mensaje: 'Todas las fechas de entrega fueron registradas correctamente' });
                              }
                          });
                      }
                  });
              }
          });
      });
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

function enviarCorreoEnTransaccion(correoEnvio, asunto, mensaje, res) {
  const mailOptions = {
    from: correoParaEnvios,
    to: correoEnvio,
    subject: asunto,
    html: mensaje
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
    if(error) {
      return hacerRollback(500, `Error al enviar el correo con asunto "${asunto}": ${info}`, res, error);
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

function formateoArregloParaImpresion(arreglo) {
  if(arreglo.length === 0) {
      return '-';
  } else {
      let total = '';
      arreglo.forEach((elemento, indice) => {
        if(elemento !== '') {
          if((indice + 1) !== arreglo.length) {
              total += (elemento + ', ');
          } else {
              total += elemento;
          }
        }
      });
      return total;
  }
}

// Middleware para manejar rutas no encontradas
router.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'html', 'recursoNoEncontrado.html'));
});

module.exports = router;