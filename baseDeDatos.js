const sqlite3 = require('sqlite3').verbose();

// Ruta al archivo de base de datos (debe de existir la carpeta)
const dbPath = './baseDeDatos/inpaviManager.db';

// Crear una nueva instancia de base de datos SQLite3
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err.message);
  } else {
    console.log('Conexión a la base de datos establecida correctamente');
  }
});

db.serialize(() => {
  // Crear tabla de roles si no existe
  db.run(`CREATE TABLE IF NOT EXISTS roles (
    id_rol INTEGER PRIMARY KEY,
    rol TEXT NOT NULL
  )`);

  // Insertar datos de roles si la tabla está vacía
  db.get("SELECT COUNT(*) AS count FROM roles", (err, row) => {
    if (err) {
      console.error('Error al verificar tabla de roles:', err);
    } else {
      if (row.count === 0) {
        const roles = [
          { rol: 'Supervisor' },
          { rol: 'Delegado' },
          { rol: 'Coordinador D.A.S.' },
          { rol: 'Coordinador Entrada' },
          { rol: 'Equipo directo D.A.S.' },
          { rol: 'Equipo directo Entrada' }
        ];
        const stmt = db.prepare("INSERT INTO roles (rol) VALUES (?)");
        roles.forEach((rol) => {
          stmt.run(rol.rol);
        });
        stmt.finalize();
        console.log('Datos de roles insertados correctamente');
      }
    }
  });

  // Crear tabla de sedes si no existe
  db.run(`CREATE TABLE IF NOT EXISTS sedes (
    id_sede INTEGER PRIMARY KEY,
    sede TEXT NOT NULL
  )`);

  // Insertar datos de sedes si la tabla está vacía
  db.get("SELECT COUNT(*) AS count FROM sedes", (err, row) => {
    if (err) {
      console.error('Error al verificar tabla de sedes:', err);
    } else {
      if (row.count === 0) {
        const sedes = [
          { sede: 'Xola' },
          { sede: 'Tultitlán' },
          { sede: 'Ajusco' },
          { sede: 'Atlacomulco' },
          { sede: 'Cancún' },
          { sede: 'León' }
        ];
        const stmt = db.prepare("INSERT INTO sedes (sede) VALUES (?)");
        sedes.forEach((sede) => {
          stmt.run(sede.sede);
        });
        stmt.finalize();
        console.log('Datos de sedes insertados correctamente');
      }
    }
  });

  // Crear tabla de usuarios si no existe
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    correo TEXT NOT NULL UNIQUE,
    apellido_paterno TEXT NOT NULL,
    apellido_materno TEXT NOT NULL,
    telefono TEXT NOT NULL,
    contraseña TEXT NOT NULL,
    nombre_usuario TEXT NOT NULL,
    id_rol INTEGER NOT NULL,
    id_sede INTEGER NOT NULL,
    status INTEGER NOT NULL,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
    FOREIGN KEY (id_sede) REFERENCES sedes(id_sede)
  )`);
  /*
  0 -> Usuario dado de baja
  1 -> Usuario dado de alta
  2 -> En espera de que el usuario escriba el token
  3 -> En espera de que un delegado acepte la solicitud
  */

  // Crear tabla de tokens si no existe
  db.run(`CREATE TABLE IF NOT EXISTS tokens (
    id_token INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    tipo_token INT NOT NULL,
    id_usuario INTEGER NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
  )`);
  /*
    Tipo token:
      1 -> Token de creación de cuenta
      2 -> Token de recuperación de cuenta
  */

  // Crear tabla de ocupaciones si no existe
  db.run(`CREATE TABLE IF NOT EXISTS ocupaciones (
    id_ocupacion INTEGER PRIMARY KEY AUTOINCREMENT,
    ocupacion TEXT NOT NULL
  )`);

  // Crear tabla de programas si no existe
  db.run(`CREATE TABLE IF NOT EXISTS programas (
    id_programa INTEGER PRIMARY KEY AUTOINCREMENT,
    programa TEXT NOT NULL
  )`);

  // Insertar datos de programas si la tabla está vacía
  db.get("SELECT COUNT(*) AS count FROM programas", (err, row) => {
    if (err) {
      console.error('Error al verificar tabla de programas:', err);
    } else {
      if (row.count === 0) {
        const programas = [
          { programa: 'Entrada' },
          { programa: 'Integra' },
          { programa: 'D.A.S.' }, // Desarrollando Acciones Solidarias
          { programa: 'C.V.C.' }  // Centro de Vida Cristiana
        ];
        const stmt = db.prepare("INSERT INTO programas (programa) VALUES (?)");
        programas.forEach((programa) => {
          stmt.run(programa.programa);
        });
        stmt.finalize();
        console.log('Datos de programas insertados correctamente');
      }
    }
  });

  // Crear tabla de voluntarios si no existe
  db.run(`CREATE TABLE IF NOT EXISTS voluntarios (
    id_voluntario INTEGER PRIMARY KEY AUTOINCREMENT,
    id_voluntarioAsignado INTEGER,
    estado INTEGER NOT NULL,    -- 0 -> Baja  / 1 -> Alta / 2 -> (registrado pero no dado de alta)
    fecha_captacion TEXT NOT NULL,
    fecha_alta TEXT NOT NULL,
    nombre_v TEXT NOT NULL,
    apellido_paterno_v TEXT NOT NULL,
    apellido_materno_v TEXT NOT NULL,
    identificacion TEXT NOT NULL UNIQUE,
    fecha_nacimiento TEXT NOT NULL,
    telefono_v TEXT NOT NULL,
    correo_v TEXT NOT NULL,
    id_ocupacion INTEGER NOT NULL,
    informe_valoracion INTEGER,   -- 0 -> Voluntario interno / 1 -> Voluntario externo temporal
    fecha_baja TEXT,
    observaciones TEXT,
    id_sede INT NOT NULL,
    personaContacto TEXT,
    FOREIGN KEY (id_voluntarioAsignado) REFERENCES voluntarios(id_voluntario),
    FOREIGN KEY (id_ocupacion) REFERENCES ocupaciones(id_ocupacion),
    FOREIGN KEY (id_sede) REFERENCES sedes(id_sede)
  )`);

  // Crear índices para la tabla de voluntarios
  db.run(`CREATE INDEX IF NOT EXISTS idx_nombre_voluntario ON voluntarios(nombre_v)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_apellido_paterno_voluntario ON voluntarios(apellido_paterno_v)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_apellido_materno_voluntario ON voluntarios(apellido_materno_v)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_identificacion_voluntario ON voluntarios(identificacion)`);

  // Crear tabla de intereses si no existe
  db.run(`CREATE TABLE IF NOT EXISTS intereses (
    id_interes INTEGER PRIMARY KEY AUTOINCREMENT,
    interes TEXT NOT NULL
  )`);

  // Crear tabla de interesesVoluntario si no existe
  db.run(`CREATE TABLE IF NOT EXISTS interesesVoluntario (
    id_voluntario INTEGER NOT NULL,
    id_interes INTEGER NOT NULL,
    FOREIGN KEY (id_voluntario) REFERENCES voluntarios(id_voluntario),
    FOREIGN KEY (id_interes) REFERENCES intereses(id_interes)
  )`);

  // Crear tabla de valoracionVoluntario si no existe
  db.run(`CREATE TABLE IF NOT EXISTS valoracionVoluntario (
    id_voluntario INTEGER NOT NULL,
    id_valoracion INTEGER NOT NULL,
    FOREIGN KEY (id_voluntario) REFERENCES voluntarios(id_voluntario),
    FOREIGN KEY (id_valoracion) REFERENCES programas(id_programa)
  )`);

  // Crear tabla de derivacionVoluntario si no existe
  db.run(`CREATE TABLE IF NOT EXISTS derivacionVoluntario (
    id_voluntario INTEGER NOT NULL,
    id_derivacion INTEGER NOT NULL,
    FOREIGN KEY (id_voluntario) REFERENCES voluntarios(id_voluntario),
    FOREIGN KEY (id_derivacion) REFERENCES programas(id_programa)
  )`);

  // Crear tabla de primerosContactos si no existe
  db.run(`CREATE TABLE IF NOT EXISTS primerosContactos (
    id_contacto INTEGER PRIMARY KEY AUTOINCREMENT,
    contacto TEXT NOT NULL
  )`);

  // Crear tabla de primerosContactosVoluntario si no existe
  db.run(`CREATE TABLE IF NOT EXISTS primerosContactosVoluntario (
    id_voluntario INTEGER NOT NULL,
    id_contacto INTEGER NOT NULL,
    FOREIGN KEY (id_voluntario) REFERENCES voluntarios(id_voluntario),
    FOREIGN KEY (id_contacto) REFERENCES primerosContactos(id_contacto)
  )`);

  // Crear índices para la tabla de primerosContactosVoluntario
  db.run(`CREATE INDEX IF NOT EXISTS idx_voluntarios_id_ocupacion ON voluntarios(id_ocupacion)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_interesesVoluntario_id_voluntario ON interesesVoluntario(id_voluntario)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_interesesVoluntario_id_interes ON interesesVoluntario(id_interes)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_valoracionVoluntario_id_voluntario ON valoracionVoluntario(id_voluntario)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_valoracionVoluntario_id_valoracion ON valoracionVoluntario(id_valoracion)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_derivacionVoluntario_id_voluntario ON derivacionVoluntario(id_voluntario)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_derivacionVoluntario_id_derivacion ON derivacionVoluntario(id_derivacion)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_primerosContactosVoluntario_id_voluntario ON primerosContactosVoluntario(id_voluntario)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_primerosContactosVoluntario_id_contacto ON primerosContactosVoluntario(id_contacto)`);

  // Insertar datos de primeros contactos si la tabla está vacía
  db.get("SELECT COUNT(*) AS count FROM primerosContactos", (err, row) => {
    if (err) {
      console.error('Error al verificar tabla de primeros contactos:', err);
    } else {
      if (row.count === 0) {
        const primerosContactos = [
          { contacto: 'Taller acogida' },
          { contacto: '1° entrevista personal' },
          { contacto: 'Formación básica' },
          { contacto: 'Formación específica' }
        ];
        const stmt = db.prepare("INSERT INTO primerosContactos (contacto) VALUES (?)");
        primerosContactos.forEach((contacto) => {
          stmt.run(contacto.contacto);
        });
        stmt.finalize();
        console.log('Datos de primeros contactos insertados correctamente');
      }
    }
  });
});

/* En sqlite3 las fechas se guardan como texto pero se pueden formatear la consulta con strftime('%d-%m-%Y %H:%M:%S', atributo en la BD). la fecha de captación se almacenará de forma automática */

// Exportar la conexión a la base de datos para ser utilizada en otros archivos
module.exports = db;