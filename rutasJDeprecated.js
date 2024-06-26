const express = require('express');
const router = express.Router();
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./baseDeDatos');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com', // Servidor SMTP de Outlook
  port: 587, // Puerto SMTP
  secure: false, // true para el puerto 465, false para otros puertos
  auth: {
    user: 'inpavimanager@outlook.com', // Dirección de correo de Outlook
    pass: 'Ramirez+18' // Contraseña de Outlook
  }
});
router.use(express.static(path.join(__dirname, 'public')));

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

// Ruta para pantalla de alta de voluntario
router.get('/altaVoluntario', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'altaVoluntario.html'));
});

// Ruta para pantalla de para ingresar token (MODIFICAR HTML)
router.get('/ingresarToken', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'ingresarToken.html'));
});

// Ruta para pantalla de dashboard
router.get('/tablero', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'dashboard.html'));
});

router.get('/principal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'principal.html'));
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
            if(row.status === 2) res.status(200).json({ mensaje: 'Inicio de sesión correcto', ruta: '/principal', tipoUsuario: row.status });
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
    datos.routerat = row.apellido_paterno;
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


//Jessica desde aqui

router.get('/entrada_inicio', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'entrada_inicio.html'));
});

router.get('/altadespensas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'altadespensas.html'));
});
router.get('/altacatdespensas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'altacatdespensas.html'));
});

router.get('/index_entrada', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'entrada_inicio.html'));
});

router.post('/altacatdespensas', (req, res) => {
  db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const categorias = [];
      for (let i = 1; i <= 10; i++) {
          if (req.body[`nombre_categoria_${i}`]) {
              const productos = Array.isArray(req.body[`nombre_producto_${i}`]) ? req.body[`nombre_producto_${i}`] : [req.body[`nombre_producto_${i}`]];
              categorias.push({
                  nombre_categoria: req.body[`nombre_categoria_${i}`],
                  descripcion_despensa: req.body[`descripcion_despensa_${i}`],
                  cantidad_prod_despensa: req.body[`cantidad_prod_despensa_${i}`],
                  peso_despensa: req.body[`peso_despensa_${i}`],
                  nombre_producto: productos
              });
          }
      }

      const promises = categorias.map(categoria => {
          return new Promise((resolve, reject) => {
              db.get("SELECT * FROM categoriasdespensas WHERE nombre_categoria = ?", [categoria.nombre_categoria], (err, row) => {
                  if (err) {
                      reject(err);
                  } else if (row) {
                      resolve({ mensaje: `La categoría ${categoria.nombre_categoria} ya existe.` });
                  } else {
                      db.run(
                          `INSERT INTO categoriasdespensas (nombre_categoria, descripcion_despensa, cantidad_prod_despensa, peso_despensa) 
                          VALUES (?, ?, ?, ?)`,
                          [categoria.nombre_categoria, categoria.descripcion_despensa, categoria.cantidad_prod_despensa, categoria.peso_despensa],
                          function(err) {
                              if (err) {
                                  reject(err);
                              } else {
                                  const categoriaId = this.lastID;
                                  const productoPromises = categoria.nombre_producto.map(producto => {
                                      return new Promise((resolve, reject) => {
                                          db.run(
                                              `INSERT INTO productosCategorias (categoria_id, nombre_producto) 
                                              VALUES (?, ?)`,
                                              [categoriaId, producto],
                                              function(err) {
                                                  if (err) {
                                                      reject(err);
                                                  } else {
                                                      resolve();
                                                  }
                                              }
                                          );
                                      });
                                  });

                                  Promise.all(productoPromises)
                                      .then(() => {
                                          resolve({ mensaje: `Categoría ${categoria.nombre_categoria} registrada correctamente.` });
                                      })
                                      .catch(err => {
                                          reject(err);
                                      });
                              }
                          }
                      );
                  }
              });
          });
      });

      Promise.all(promises)
          .then(results => {
              db.run('COMMIT');
              const mensajes = results.map(result => result.mensaje);
              console.log('Datos insertados:', categorias);
              res.json({ mensaje: mensajes.join(' ') });
          })
          .catch(err => {
              db.run('ROLLBACK');
              console.error("Error al insertar datos:", err);
              res.status(500).json({ mensaje: 'Error al registrar las categorías.' });
          });
  });
});


//obtener categorias despensas
router.get('/obtenerCategoriasDespensas', (req, res) => {
  db.all('SELECT id, nombre_categoria FROM categoriasdespensas;', (err, rows) => {
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

// Obtener productos por categoría de despensa
router.get('/obtener_productos_por_categoria', (req, res) => {
  const categoriaId = req.query.id;
  db.all(`SELECT * FROM productosCategorias WHERE categoria_id = ?`, [categoriaId], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener productos por categoría' });
    } else {
      res.json(rows);
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
  db.get('SELECT id FROM categoriasdespensas WHERE nombre_categoria = ?', [nombre_categoria], (err, row) => {
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


router.get('/eliminardespensas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'eliminardespensas.html'));
});


router.post('/eliminardespensas', (req, res) => {
  const { nombre_categoria, cantidad_eliminar } = req.body;

  // Validaciones
  if (cantidad_eliminar <= 0) {
    return res.status(400).json({ mensaje: 'La cantidad a eliminar debe ser un número positivo.' });
  }

  // Iniciar una transacción
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', err => {
      if (err) {
        console.error('Error al iniciar la transacción:', err);
        return res.status(500).json({ mensaje: 'Error al iniciar la transacción en la base de datos.' });
      }

      // Consulta para obtener la cantidad actual de despensas
      const selectCategoriaSql = 'SELECT id FROM categoriasdespensas WHERE nombre_categoria = ?';
      db.get(selectCategoriaSql, [nombre_categoria], (err, rowCategoria) => {
        if (err) {
          db.run('ROLLBACK', () => {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ mensaje: 'Error al consultar la base de datos.' });
          });
          return;
        }

        if (!rowCategoria) {
          db.run('ROLLBACK', () => {
            console.error('No se encontró la categoría de despensa especificada.');
            return res.status(404).json({ mensaje: 'No se encontró la categoría de despensa especificada.' });
          });
          return;
        }

        const categoria_id = rowCategoria.id;

        // Consulta para obtener la cantidad actual de despensas
        const selectSql = 'SELECT cantidad_despensas FROM Despensas WHERE categoria_despensa_id = ?';

        // Consultar la cantidad actual de despensas
        db.get(selectSql, [categoria_id], (err, rowBeforeUpdate) => {
          if (err) {
            db.run('ROLLBACK', () => {
              console.error('Error al consultar la cantidad actual de despensas:', err);
              return res.status(500).json({ mensaje: 'Error al consultar la base de datos.' });
            });
            return;
          }

          if (!rowBeforeUpdate) {
            db.run('ROLLBACK', () => {
              console.error('No se encontró la categoría de despensa especificada.');
              return res.status(404).json({ mensaje: 'No se encontró la categoría de despensa especificada.' });
            });
            return;
          }

          const cantidadActualAntes = rowBeforeUpdate.cantidad_despensas;

          // Validar si hay suficientes despensas para eliminar
          if (cantidadActualAntes === 0) {
            db.run('ROLLBACK', () => {
              console.error('No se pueden eliminar más despensas porque ya están en cero.');
              return res.status(400).json({ mensaje: 'No se pueden eliminar más despensas porque ya están en cero.' });
            });
            return;
          }

          // Validar si se puede eliminar la cantidad solicitada
          if (cantidad_eliminar > cantidadActualAntes) {
            db.run('ROLLBACK', () => {
              console.error('No se pueden eliminar más despensas de las que existen.');
              return res.status(400).json({ mensaje: 'No se pueden eliminar más despensas de las que existen.' });
            });
            return;
          }

          // Calcular nueva cantidad de despensas
          const nuevaCantidad = cantidadActualAntes - cantidad_eliminar;

          // Actualizar la cantidad de despensas
          const updateSql = 'UPDATE Despensas SET cantidad_despensas = ? WHERE categoria_despensa_id = ?';

          db.run(updateSql, [nuevaCantidad, categoria_id], function(err) {
            if (err) {
              db.run('ROLLBACK', () => {
                console.error('Error al actualizar la base de datos:', err);
                return res.status(500).json({ mensaje: 'Error al actualizar la base de datos.' });
              });
              return;
            }

            // Confirmar la transacción
            db.run('COMMIT', () => {
              console.log('Transacción completada.');

              res.status(200).json({ 
                mensaje: 'Se eliminaron las despensas correctamente.', 
                nombre_categoria: nombre_categoria,
                cantidad_despensas_anterior: cantidadActualAntes,
                cantidad_despensas_actual: nuevaCantidad
              });
            });
          });
        });
      });
    });
  });
});






router.get('/modificarcatdespensas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'modificarcatdespensas.html'));
});



router.get('/altacatproductos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'altacatproductos.html'));
});


router.get('/visualizarcatdesp', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'Visualizar_cat_desp.html'));
});

router.get('/obtener_datos_despensas', (req, res) => {
  const sql = `
      SELECT
          cd.nombre_categoria AS Categoria,
          cd.descripcion_despensa AS Descripcion,
          cd.cantidad_prod_despensa,
          SUM(pc.nombre_producto IS NOT NULL) as cantidad_prod_selec,
          cd.peso_despensa AS 'Peso_despensa',
          GROUP_CONCAT(pc.nombre_producto, ', ') AS 'Productos_asociados'
      FROM categoriasdespensas cd
      LEFT JOIN productosCategorias pc ON cd.id = pc.categoria_id
      GROUP BY cd.id
  `;
  
  db.all(sql, (err, rows) => {
      if (err) {
          console.error(err.message);
          res.status(500).json({ error: 'Error al obtener datos de la base de datos' });
      } else {
          console.log(rows); // Verifica los datos obtenidos
          res.json(rows); // Enviar los datos como JSON al cliente
      }
  });
});

router.get('/obtener_datos_despensas2', (req, res) => {
  const sql = `
        SELECT
            cd.nombre_categoria AS Categoria,
            cd.descripcion_despensa AS Descripcion,
            cd.cantidad_prod_despensa,
            pc.cantidad_despensas
        FROM categoriasdespensas cd
        INNER JOIN Despensas pc ON cd.id = pc.categoria_despensa_id
        GROUP BY cd.id
  `;
  
  db.all(sql, (err, rows) => {
      if (err) {
          console.error(err.message);
          res.status(500).json({ error: 'Error al obtener datos de la base de datos' });
      } else {
          console.log(rows); // Verifica los datos obtenidos
          res.json(rows); // Enviar los datos como JSON al cliente
      }
  });
});
router.get('/eliminarcatdepe', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'eliminarcatdepe.html'));
});
router.post('/eliminar_categoria_despe', (req, res) => {
  const { nombre_categoria } = req.body;

  // Consulta SQL para obtener la cantidad de despensas asociadas a la categoría
  const sql = `
    SELECT COUNT(*) AS cantidad_despensas
    FROM Despensas AS d
    INNER JOIN categoriasdespensas AS c ON d.categoria_despensa_id = c.id
    WHERE c.nombre_categoria = ?
  `;

  // Ejecutar la consulta SQL
  db.get(sql, [nombre_categoria], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ mensaje: "Error al verificar la categoría" });
    }

    const cantidadDespensas = row.cantidad_despensas;

    if (cantidadDespensas > 0) {
      return res.json({ 
        mensaje: `No se puede eliminar la categoría porque tiene ${cantidadDespensas} despensa(s) asociada(s). Es necesario que eliminas esa despensa para poder dar de baja la categoría.`, 
        cantidadDespensas: cantidadDespensas 
      });
    } else {
      // Si no hay despensas asociadas, proceder con la eliminación de la categoría
      db.run(`DELETE FROM CategoriaDespensa WHERE nombre_categoria = ?`, [nombre_categoria], function(err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ mensaje: "Error al eliminar la categoría" });
        } else {
          return res.json({ mensaje: "Categoría eliminada correctamente" });
        }
      });
    }
  });
});

router.get('/cantidad_despensas', (req, res) => {
  const { nombre_categoria } = req.query;
console.log(req.query);
  // Primero obtenemos el ID de la categoría usando el nombre
  db.get(`SELECT id FROM categoriasdespensas WHERE nombre_categoria = ?`, [nombre_categoria], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ mensaje: "Error al obtener la cantidad de despensas" });
    }

    if (!row) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" });
    }

    const categoriaId = row.id;

    // Ahora usamos el ID obtenido para obtener la cantidad de despensas
    db.get(`
    SELECT cantidad_despensas
      FROM Despensas
      WHERE categoria_despensa_id = ?
    `, [categoriaId], (err, row) => {
      if (err) {
        console.error(err.message);
        res.status(500).json({ mensaje: "Error al obtener la cantidad de despensas" });
      } else {
        console.log(`Cantidad de despensas encontradas para la categoría ${nombre_categoria}:`, row ? row.cantidad_despensas : 0);
        res.json({ cantidad_despensas: row ? row.cantidad_despensas : 0, nombre_categoria });
      }
    });
  });
});


router.get('/eliminardepe', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'eliminardepe.html'));
});

router.get('/Visualizar_desp', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'Visualizar_desp.html'));
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
  db.get('SELECT nombre_categoria FROM categoriasdespensas WHERE id = ?', [categoriaId], (err, row) => {
    if (err) {
      console.error("Error al obtener nombre de categoría:", err);
      res.status(500).json({ error: 'Error al obtener nombre de categoría' });
    } else {
      if (row) {
        res.json({ nombre_categoria: row.nombre_categoria });
      } else {
        res.status(404).json({ error: 'No se encontró la categoría con el ID proporcionado' });
      }
    }
  });
});

// Importa SQLite y configura la conexión a la base de datos
router.post('/altacatprod', (req, res) => {
  const { nombre_producto, cantidad, fecha_caducidad, unidad_medida, cantidad_unidad } = req.body;

  // Verificar que los campos obligatorios no estén vacíos
  if (!nombre_producto || !cantidad || !fecha_caducidad || !unidad_medida || !cantidad_unidad) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  // Validar que la fecha de caducidad no sea el mes corriente
  const fechaCaducidad = new Date(fecha_caducidad);
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth() + 1; // getMonth() devuelve el mes base 0, por eso se suma 1

  if (fechaCaducidad.getFullYear() === fechaActual.getFullYear() && fechaCaducidad.getMonth() + 2 === mesActual) {
    return res.status(400).json({ mensaje: 'La fecha de caducidad no puede ser el mes corriente' });
  }

  // Mapeo de unidades de medida completas a códigos
  const unidadMedidaMap = {
    'gr': 'gr',
    'kg': 'kg',
    'lt': 'lt',
    'ml': 'ml',
    'pzas': 'pzas',
    'otro': 'otro'
  };

  // Obtener el código de unidad de medida a partir del nombre completo
  const unidadMedidaCodigo = unidadMedidaMap[unidad_medida];

  // Consultar si el producto ya existe en la base de datos con todos los campos iguales
  const sqlSelect = `SELECT * FROM productos 
                     WHERE nombre_producto = ? 
                     AND unidad_medida = ? 
                     AND fecha_caducidad = ? 
                     AND cantidad_unidad = ?`;

  db.get(sqlSelect, [nombre_producto, unidadMedidaCodigo, fecha_caducidad, cantidad_unidad], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ mensaje: 'Error al buscar el producto' });
    }

    if (row) {
      // Si el producto ya existe, actualizar la cantidad sumando la nueva cantidad
      const nuevaCantidad = parseInt(row.cantidad) + parseInt(cantidad);
      const sqlUpdate = 'UPDATE productos SET cantidad = ? WHERE id = ?';
      db.run(sqlUpdate, [nuevaCantidad, row.id], function(err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ mensaje: 'Error al actualizar la cantidad del producto' });
        }
        console.log(`Cantidad actualizada para el producto con ID: ${row.id}`);
        res.json({ mensaje: 'Cantidad actualizada correctamente' });
      });
    } else {
      // Si el producto no existe, insertar un nuevo registro
      const sqlInsert = `INSERT INTO productos (nombre_producto, cantidad, fecha_caducidad, unidad_medida, cantidad_unidad)
                         VALUES (?, ?, ?, ?, ?)`;
      db.run(sqlInsert, [nombre_producto, cantidad, fecha_caducidad, unidadMedidaCodigo, cantidad_unidad], function(err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ mensaje: 'Error al insertar el producto' });
        }
        console.log(`Producto insertado con ID: ${this.lastID}`);
        res.json({ mensaje: 'Producto registrado correctamente' });
      });
    }
  });
});



router.get('/visualizarproductos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'visualizarproductos.html'));
});


// Middleware para manejar rutas no encontradas

router.get('/eliminarproductos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'eliminarproductos.html'));
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

router.get('/altafechaentrega', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'altafechaentrega.html'));
});



router.get('/modificarcdespensas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'modificarcdespensas.html'));
});

// Ruta para modificar la cantidad de despensas
router.post('/modificar_despensa', (req, res) => {
  const { nombre_categoria, nueva_c_desp } = req.body;

  // Validar que los datos recibidos sean correctos
  if (!nombre_categoria || !nueva_c_desp) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos.' });
  }

  // Obtener el ID de la categoría de despensa por su nombre
  const selectCategoriaSql = 'SELECT id FROM categoriasdespensas WHERE nombre_categoria = ?';

  db.get(selectCategoriaSql, [nombre_categoria], (err, rowCategoria) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      return res.status(500).json({ mensaje: 'Error al consultar la base de datos.' });
    }

    if (!rowCategoria) {
      return res.status(404).json({ mensaje: 'No se encontró la categoría de despensa especificada.' });
    }

    const categoriaId = rowCategoria.id;

    // Actualizar la cantidad de despensas
    const updateSql = 'UPDATE Despensas SET cantidad_despensas = ? WHERE categoria_despensa_id = ?';

    db.run(updateSql, [nueva_c_desp, categoriaId], function(err) {
      if (err) {
        console.error('Error al actualizar la base de datos:', err);
        return res.status(500).json({ mensaje: 'Error al actualizar la base de datos.' });
      }

      res.status(200).json({ mensaje: 'Se modificó la cantidad de despensas correctamente.' });
    });
  });
});


// Ruta para modificar despensa
router.post('/modificar_cat_despensa', (req, res) => {
  const { nombre_categoria, nombre_categoria_1, cantidad_prod_despensa_1, descripcion_despensa_1, peso_despensa_1, nombre_producto_1 } = req.body;
console.log(req.body);
  // Comenzar una transacción
  db.serialize(() => {
    // Actualizar la tabla categoriasdespensas
    if (nombre_categoria_1 || cantidad_prod_despensa_1 || descripcion_despensa_1 || peso_despensa_1) {
      let updateQuery = 'UPDATE categoriasdespensas SET ';
      const params = [];

      if (nombre_categoria_1) {
        updateQuery += 'nombre_categoria = ?, ';
        params.push(nombre_categoria_1);
      }
      if (cantidad_prod_despensa_1) {
        updateQuery += 'cantidad_prod_despensa = ?, ';
        params.push(cantidad_prod_despensa_1);
      }
      if (descripcion_despensa_1) {
        updateQuery += 'descripcion_despensa = ?, ';
        params.push(descripcion_despensa_1);
      }
      if (peso_despensa_1) {
        updateQuery += 'peso_despensa = ?, ';
        params.push(peso_despensa_1);
      }

      // Quitar la última coma y espacio
      updateQuery = updateQuery.slice(0, -2);

      updateQuery += ' WHERE nombre_categoria = ?';
      params.push(nombre_categoria);

      // Ejecutar la consulta para actualizar categoriasdespensas
      db.run(updateQuery, params, function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // Actualizar la tabla productosCategorias si hay nombre_producto_1
        if (nombre_producto_1) {
          // Obtener el ID de la categoría modificada
          db.get('SELECT id FROM categoriasdespensas WHERE nombre_categoria = ?', [nombre_categoria_1], (err, row) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            if (!row) {
              res.status(404).json({ error: 'Categoría no encontrada' });
              return;
            }

            const categoria_id = row.id;

            // Eliminar los productos asociados a la categoría
            db.run('DELETE FROM productosCategorias WHERE categoria_id = ?', [categoria_id], err => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }

              // Insertar los nuevos productos
              const insertPromises = nombre_producto_1.map(nombreProducto => {
                return new Promise((resolve, reject) => {
                  db.run('INSERT INTO productosCategorias (categoria_id, nombre_producto) VALUES (?, ?)', [categoria_id, nombreProducto], function(err) {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(this.lastID);
                    }
                  });
                });
              });

              Promise.all(insertPromises)
                .then(() => {
                  res.json({ mensaje: 'Categoría y productos modificados correctamente' });
                })
                .catch(err => {
                  res.status(500).json({ error: err.message });
                });
            });
          });
        } else {
          // Si no hay productos nuevos, solo responder que la categoría se modificó
          res.json({ mensaje: 'Categoría modificada correctamente' });
        }
      });
    } else if (nombre_producto_1) {
      // Si solo se van a modificar productos sin cambiar datos de categoriasdespensas
      // Obtener el ID de la categoría
      db.get('SELECT id FROM categoriasdespensas WHERE nombre_categoria = ?', [nombre_categoria], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        if (!row) {
          res.status(404).json({ error: 'Categoría no encontrada' });
          return;
        }

        const categoria_id = row.id;

        // Eliminar los productos actuales de la categoría
        db.run('DELETE FROM productosCategorias WHERE categoria_id = ?', [categoria_id], err => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          // Insertar los nuevos productos
          const insertPromises = nombre_producto_1.map(nombreProducto => {
            return new Promise((resolve, reject) => {
              db.run('INSERT INTO productosCategorias (categoria_id, nombre_producto) VALUES (?, ?)', [categoria_id, nombreProducto], function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve(this.lastID);
                }
              });
            });
          });

          Promise.all(insertPromises)
            .then(() => {
              res.json({ mensaje: 'Productos de la categoría modificados correctamente' });
            })
            .catch(err => {
              res.status(500).json({ error: err.message });
            });
        });
      });
    } else {
      // Si no se especificaron campos para modificar
      res.status(400).json({ error: 'No se especificaron campos para modificar' });
    }
  });
});


// Ruta para obtener la cantidad de despensas de una categoría
router.get('/AltaBeneSol', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'alta_bene_sol.html'));
});

router.post('/AltaBeneSol', (req, res) => {
  const {
    nombre_solicitante,
    apellido_paterno_solicitante,
    apellido_materno_solicitante,
    lugar_naciemiento_sol,
    fecha_nacimiento_sol,
    edad_sol,
    Nacionalidad_sol,
    Sexo_sol,
    ocupacion_sol,
    Situacion_lab_sol,
    Nivel_estudios_sol,
    Calle_solicitante,
    Numero_calle_soliciatante,
    Colonia_solicitante,
    Delegacion_solicitante,
    cp_sol,
    Localidad_sol,
    tel_casa_sol,
    Celular_Sol,
    email_Sol
  } = req.body;

  console.log('Datos recibidos:', req.body);

  // Validaciones adicionales
  if (!nombre_solicitante || !apellido_paterno_solicitante || !apellido_materno_solicitante) {
    console.error('Faltan campos requeridos');
    return res.status(400).json({ error: 'Nombre y apellidos del solicitante son requeridos' });
  }

  // Verificar si el solicitante ya existe
  db.get(
    `SELECT * FROM beneficiarios WHERE nombre_solicitante = ? AND apellido_paterno_solicitante = ? AND apellido_materno_solicitante = ?`,
    [nombre_solicitante, apellido_paterno_solicitante, apellido_materno_solicitante],
    (err, row) => {
      if (err) {
        console.error('Error en la consulta de la base de datos:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      if (row) {
        console.log('El solicitante ya existe');
        return res.status(400).json({ error: 'El solicitante ya existe' });
      }

      // Insertar nuevo solicitante
      db.run(`INSERT INTO beneficiarios (
        nombre_solicitante,
        apellido_paterno_solicitante,
        apellido_materno_solicitante,
        lugar_naciemiento_sol,
        fecha_nacimiento_sol,
        edad_sol,
        Nacionalidad_sol,
        Sexo_sol,
        ocupacion_sol,
        Situacion_lab_sol,
        Nivel_estudios_sol,
        Calle_solicitante,
        Numero_calle_soliciatante,
        Colonia_solicitante,
        Delegacion_solicitante,
        cp_sol,
        Localidad_sol,
        tel_casa_sol,
        Celular_Sol,
        email_Sol
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        nombre_solicitante,
        apellido_paterno_solicitante,
        apellido_materno_solicitante,
        lugar_naciemiento_sol,
        fecha_nacimiento_sol,
        edad_sol,
        Nacionalidad_sol,
        Sexo_sol,
        ocupacion_sol,
        Situacion_lab_sol,
        Nivel_estudios_sol,
        Calle_solicitante,
        Numero_calle_soliciatante,
        Colonia_solicitante,
        Delegacion_solicitante,
        cp_sol,
        Localidad_sol,
        tel_casa_sol,
        Celular_Sol,
        email_Sol
      ], (err) => {
        if (err) {
          console.error('Error al insertar el solicitante:', err);
          return res.status(500).json({ error: 'Error al insertar el solicitante' });
        }
        console.log('Solicitante registrado exitosamente');
        res.json({ success: true, message: 'Solicitante registrado exitosamente' });
      });
    }
  );
});

router.get('/alta_bene_conyuge', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'alta_bene_conyuge.html'));
});


// Ruta para manejar la obtención de opciones de selects
router.get('/options', (req, res) => {
  // Opciones para el select de Estado Civil
  const estadosCiviles = [
    { value: 'Casado(a)', label: 'Casado(a)' },
    { value: 'Soltero(a)', label: 'Soltero(a)' },
    { value: 'Divorciado(a)', label: 'Divorciado(a)' },
    { value: 'Viudo(a)', label: 'Viudo(a)' },
    { value: 'Concubinato', label: 'Concubinato' }
  ];

  // Opciones para el select de Nivel de Estudios
  const nivelesEstudios = [
    { value: 'Básico', label: 'Básico' },
    { value: 'Medio Superior', label: 'Medio Superior' },
    { value: 'Superior', label: 'Superior' }
  ];

  res.json({ estadosCiviles, nivelesEstudios });
});

// Ruta para manejar la inserción de datos del formulario
router.post('/AltaBeneConyuge', (req, res) => {
  const {
    nombre_Conyuge,
    apellido_paterno_Conyuge,
    apellido_materno_Conyuge,
    fecha_nacimiento_conyuge,
    Estado_civil_conyuge,
    Ocupacion_conyuge,
    Nivel_estudios_conyuge
  } = req.body;

  // Validar que la fecha de nacimiento no sea en el año 2024
  const fechaNacimientoDate = new Date(fecha_nacimiento_conyuge);
  if (fechaNacimientoDate.getFullYear() === 2024) {
    return res.status(400).json({ error: 'La fecha de nacimiento no puede ser en el año 2024.' });
  }

  // Validar que no exista un registro previo con los mismos datos personales
  const sql = `SELECT COUNT(*) AS count FROM beneficiario_conyuge
               WHERE nombre = ? AND apellido_paterno = ? AND apellido_materno = ? AND fecha_nacimiento = ?`;
  db.get(sql, [nombre_Conyuge, apellido_paterno_Conyuge, apellido_materno_Conyuge, fecha_nacimiento_conyuge], (err, row) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err.message);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (row.count > 0) {
      return res.status(400).json({ error: 'Ya existe un registro con estos datos personales.' });
    }

    // Insertar datos en la base de datos si pasa todas las validaciones
    const insertSql = `INSERT INTO beneficiario_conyuge (
        nombre, 
        apellido_paterno, 
        apellido_materno, 
        fecha_nacimiento, 
        estado_civil, 
        ocupacion, 
        nivel_estudios
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(insertSql, [
      nombre_Conyuge,
      apellido_paterno_Conyuge,
      apellido_materno_Conyuge,
      fecha_nacimiento_conyuge,
      Estado_civil_conyuge,
      Ocupacion_conyuge,
      Nivel_estudios_conyuge
    ], function (err) {
      if (err) {
        console.error('Error al insertar en la tabla beneficiario_conyuge:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
      } else {
        console.log(`Registro insertado con ID: ${this.lastID}`);
        res.json({ message: 'Datos del cónyuge registrados correctamente.' });
      }
    });
  });
});

router.get('/alta_bene_familiar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'alta_bene_familiar.html'));
});

router.post('/AltaBeneFamiliar', (req, res) => {
  const {
      id_solicitante,
      nombre_fam,
      apellido_paterno_fam,
      apellido_materno_fam,
      fecha_nacimiento_fam,
      situacion_laboral_fam,
      nivel_estudios_fam
  } = req.body;

  // Validación de la fecha de nacimiento (no puede ser este año)
  const today = new Date();
  const birthDate = new Date(fecha_nacimiento_fam);
  if (birthDate.getFullYear() === today.getFullYear()) {
      return res.status(400).json({ error: 'La fecha de nacimiento no puede ser este año.' });
  }

  const edad = calculateAge(birthDate); // Calcular la edad desde la fecha de nacimiento

  // Insertar datos en la tabla beneficiarios_familiares
  const insertSql = `INSERT INTO beneficiarios_familiares 
                     (id_solicitante, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, edad, situacion_laboral, nivel_estudios)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(insertSql, [
      id_solicitante,
      nombre_fam,
      apellido_paterno_fam,
      apellido_materno_fam,
      fecha_nacimiento_fam,
      edad,
      situacion_laboral_fam,
      nivel_estudios_fam
  ], function(err) {
      if (err) {
          console.error('Error al insertar datos:', err.message);
          res.status(500).json({ error: 'Error interno del servidor' });
      } else {
          console.log(`Familiar ${this.lastID} insertado correctamente.`);
          res.status(200).json({ message: 'Familiar registrado exitosamente' });
      }

      closeConnection(db); // Cerrar la conexión después de ejecutar la operación
  });
});

// Ruta para obtener las opciones de Situación Laboral y Nivel de Estudios
router.get('/opciones', (req, res) => {
  // Definir las opciones disponibles (pueden provenir de una base de datos, archivo JSON, etc.)
  const opcionesSituacionLaboral = ['Empleado', 'Desempleado', 'Estudiante', 'Otro'];
  const opcionesNivelEstudios = ['Básico', 'Medio Superior', 'Superior', 'Posgrado'];

  // Enviar las opciones como respuesta
  res.json({
      situacionLaboral: opcionesSituacionLaboral,
      nivelEstudios: opcionesNivelEstudios
  });
});

const situacionLaboralOptions = [
  { value: 'Empleado(a)', label: 'Empleado(a)' },
  { value: 'Desempleado(a)', label: 'Desempleado(a)' },
  { value: 'Estudiante(a)', label: 'Estudiante(a)' },
  { value: 'Otro', label: 'Otro' }
];

// Mock de opciones para el select de Nivel de Estudios
const nivelEstudiosOptions = [
  { value: 'Básico', label: 'Básico' },
  { value: 'Medio Superior', label: 'Medio Superior' },
  { value: 'Superior', label: 'Superior' }
];

// Ruta para obtener las opciones de Situación Laboral y Nivel de Estudios
router.get('/opciones', (req, res) => {
  res.json({
    situacionLaboral: situacionLaboralOptions,
    nivelEstudios: nivelEstudiosOptions
  });
});

// Ruta para procesar el formulario de alta de beneficiario familiar
router.post('/AltaBeneFamiliar', (req, res) => {
  const {
    nombre_fam,
    apellido_paterno_fam,
    apellido_materno_fam,
    fecha_nacimiento_fam,
    situacion_laboral_fam,
    nivel_estudios_fam
  } = req.body;

  // Validación de la fecha de nacimiento (no puede ser este año)
  const today = new Date();
  const birthDate = new Date(fecha_nacimiento_fam);
  if (birthDate.getFullYear() === today.getFullYear()) {
    return res.status(400).json({ error: 'La fecha de nacimiento no puede ser este año.' });
  }

  const edad = calculateAge(birthDate); // Calcular la edad desde la fecha de nacimiento

  // Simulación de inserción en la base de datos
  // Aquí deberías conectar a tu base de datos MySQL y realizar la inserción real

  // Simulación de respuesta exitosa
  setTimeout(() => {
    res.status(200).json({ message: 'Familiar registrado exitosamente' });
  }, 1000); // Simulando un retardo de 1 segundo para la inserción
});

// Función para calcular la edad a partir de la fecha de nacimiento
function calculateAge(birthDate) {
  const today = new Date();
  const diff = today - birthDate;
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

router.get('/alta_bene_trabajador_s', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'alta_bene_trabajador_s.html'));
});

router.get('/obtener_productos', (req, res) => {
  db.all('SELECT * FROM productos', (err, rows) => {
      if (err) {
          console.error(err.message);
          res.status(500).json({ error: 'Error al obtener datos de la base de datos' });
      } else {
          console.log(rows); // Verifica los datos obtenidos
          res.json(rows); // Enviar los datos como JSON al cliente
      }
  });
});

//obtener productos
router.get('/obtenerproductos', (req, res) => {
  db.all('SELECT id, nombre_producto FROM productos;', (err, rows) => {
    if(err) {
      res.status(500).json({ mensaje: 'No se pudieron consultar los productos' });
    } else {
      const productos = [];
      rows.forEach(row => {
        productos.push(row.nombre_producto);
      });
      res.status(200).json(productos);
    }
  });
});


router.post('/eliminar_cantidad', (req, res) => {
  const { nombre_producto, cantidad_eliminar } = req.body;

  // Verificar si se proporcionaron nombre_producto y cantidad_eliminar
  if (!nombre_producto || !cantidad_eliminar) {
    return res.status(400).json({ error: 'Nombre de producto y cantidad a eliminar son requeridos' });
  }

  // Validar que la cantidad a eliminar sea un número positivo
  if (cantidad_eliminar <= 0) {
    return res.status(400).json({ error: 'La cantidad a eliminar debe ser mayor que cero' });
  }

  // Consultar la cantidad actual del producto
  db.get('SELECT cantidad FROM productos WHERE nombre_producto = ?', nombre_producto, (err, row) => {
    if (err) {
      console.error('Error al consultar cantidad del producto:', err);
      return res.status(500).json({ error: 'Error al eliminar cantidad del producto' });
    }

    // Si no se encuentra el producto
    if (!row) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const cantidadActual = row.cantidad;
console.log(cantidadActual);
    // Validar si hay suficiente cantidad para eliminar
    if (cantidadActual === 0) {
      return res.status(400).json({ error: 'No hay productos disponibles para eliminar' });
    }

    if (cantidad_eliminar > cantidadActual) {
      return res.status(400).json({ error: 'No hay suficiente cantidad para eliminar' });
    }

    // Calcular la nueva cantidad después de la eliminación
    const nuevaCantidad = cantidadActual - cantidad_eliminar;

    // Actualizar la cantidad del producto en la base de datos
    db.run('UPDATE productos SET cantidad = ? WHERE nombre_producto = ?', [nuevaCantidad, nombre_producto], function(err) {
      if (err) {
        console.error('Error al actualizar la cantidad del producto:', err);
        res.status(500).json({ error: 'Error al eliminar cantidad del producto' });
      } else {
        console.log(`Se eliminaron ${cantidad_eliminar} unidades del producto: ${nombre_producto}`);
        res.json({ mensaje: `Se eliminaron ${cantidad_eliminar} unidades del producto: ${nombre_producto}`, nuevaCantidad });
      }
    });
  });
});


// Ruta para obtener la cantidad de un producto específico
router.get('/obtenercantidad', (req, res) => {
  const { producto } = req.query;
  db.get('SELECT cantidad FROM productos WHERE nombre_producto = ?', [producto], (err, row) => {
      if (err) {
          console.error('Error al obtener la cantidad:', err.message);
          res.status(500).json({ error: 'Error interno del servidor' });
      } else {
          if (row) {
              res.json({ cantidad: row.cantidad });
          } else {
              res.status(404).json({ error: 'Producto no encontrado' });
          }
      }
  });
});

function altafechasentregas(fechasEntregas, callback) {
  db.serialize(() => {
    db.run("BEGIN TRANSACTION"); // Iniciar la transacción

    const stmt = db.prepare('INSERT INTO entregas (fecha_entrega, descripcion_entrega) VALUES (?, ?)');
    
    for (const { fecha_entrega, descripcion_entrega } of fechasEntregas) {
      stmt.run(fecha_entrega, descripcion_entrega, (err) => {
        if (err) {
          db.run("ROLLBACK"); // Revertir la transacción si hay un error
          stmt.finalize();
          return callback(err);
        }
      });
    }
    
    stmt.finalize((err) => {
      if (err) {
        db.run("ROLLBACK"); // Revertir la transacción si hay un error en la finalización
        return callback(err);
      } else {
        db.run("COMMIT"); // Finalizar la transacción si todo fue bien
        return callback(null, { mensaje: 'Fechas de entrega registradas correctamente' });
      }
    });
  });
}

// Ruta POST para alta de fechas de entrega
router.post('/altafechaentrega', (req, res) => {
  const fechasEntregas = req.body;
console.log(req.body);
  // Validar que el array no esté vacío y que cada entrada tenga ambos campos
  if (!Array.isArray(fechasEntregas) || fechasEntregas.some(({ fecha_entrega, descripcion_entrega }) => !fecha_entrega || !descripcion_entrega)) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios para cada entrega' });
  }

  altafechasentregas(fechasEntregas, (err, result) => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error al registrar las fechas de entrega' });
    }
    res.json(result);
  });
});

module.exports = router;