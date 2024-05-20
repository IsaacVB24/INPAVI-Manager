const sqlite3 = require('sqlite3').verbose();

// Ruta al archivo de base de datos
const dbPath = './baseDeDatos/inpaviManager.db';

// Crear una nueva instancia de base de datos SQLite3
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err.message);
  } else {
    console.log('Conexión a la base de datos establecida correctamente');
  }
});

// Crear tabla de roles si no existe
db.serialize(() => {
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
          { rol: 'Coordinador DAS' },
          { rol: 'Coordinador Entrada' },
          { rol: 'Equipo directo DAS' },
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
});

// Crear tabla de sedes si no existe
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sedes (
    id_sede INTEGER PRIMARY KEY,
    sede TEXT NOT NULL
  )`);

  // Insertar datos de roles si la tabla está vacía
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
});

// Crear tabla de usuarios si no existe
db.serialize(() => {
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
});

/*
  0 -> Usuario dado de baja
  1 -> Usuario dado de alta
  2 -> En espera de que el usuario escriba el token
  3 -> En espera de que un delegado acepte la solicitud
*/

// Crear tabla de tokens si no existe
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tokens (
    id_token INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    tipo_token INT NOT NULL,
    id_usuario INTEGER NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
  )`);
});
/*
  Tipo token
  1 -> Token de creación de cuenta
  2 -> Token de recuperación de cuenta
*/

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS ocupaciones (
    id_ocupacion INTEGER PRIMARY KEY AUTOINCREMENT,
    ocupacion TEXT NOT NULL
  )`);
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS programas (
    id_programa INTEGER PRIMARY KEY AUTOINCREMENT,
    programa NOT NULL
  )`);

  // Insertar datos de roles si la tabla está vacía
  db.get("SELECT COUNT(*) AS count FROM programas", (err, row) => {
    if (err) {
      console.error('Error al verificar tabla de programas:', err);
    } else {
      if (row.count === 0) {
        const programas = [
          { programa: 'Entrada' },
          { programa: 'Integra' },
          { programa: 'D.A.S.' }, // Desarrollando Acciones Solidarias
          { programa: 'C.V.C' }  // Centro de Vida Cristiana
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
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS voluntarios (
    id_voluntario INTEGER PRIMARY KEY AUTOINCREMENT,
    es_interno INTEGER NOT NULL,
    estado INTEGER NOT NULL,
    fecha_captacion TEXT NOT NULL,
    fecha_alta TEXT NOT NULL,
    nombre_v TEXT NOT NULL,
    apellido_paterno_v TEXT NOT NULL,
    apellido_materno_v TEXT NOT NULL,
    identificacion TEXT NOT NULL,
    fecha_nacimiento TEXT NOT NULL,
    telefono_v TEXT NOT NULL,
    correo_v TEXT NOT NULL,
    id_ocupacion INTEGER NOT NULL,
    id_derivacion INTEGER,
    id_valoracion INTEGER,
    primeros_contactos INTEGER,
    informe_valoracion INTEGER,
    fecha_baja TEXT,
    observaciones TEXT,
    FOREIGN KEY (id_ocupacion) REFERENCES ocupaciones(id_ocupacion),
    FOREIGN KEY (id_derivacion) REFERENCES programas(id_programa),
    FOREIGN KEY (id_valoracion) REFERENCES programas(id_programa)
  )`);
});
/* En sqlite3 las fechas se guardan como texto pero se pueden formatear la consulta con strftime('%d-%m-%Y %H:%M:%S', atributo en la BD). la fecha de captación se almacenará de forma automática */

// Exportar la conexión a la base de datos para ser utilizada en otros archivos
module.exports = db;