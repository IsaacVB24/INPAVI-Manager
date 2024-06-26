//inpavi_manager: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
//inpavimanager : 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
const express = require('express');
const mysql = require('mysql');
const randomstring = require('randomstring');
const sgMail = require('@sendgrid/mail');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'public')));

// Configurar la conexión a la base de datos MySQL
const connection = mysql.createConnection({
  host: 'contando-ovejas',
  user: 'root',
  password: 'Ramirez+18',
  database: 'inpavi'
});

connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión establecida con la base de datos MySQL');
});

// Configurar el middleware para procesar datos de formulario
app.use(express.urlencoded({ extended: true }));

// Configurar la sesión
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// Configurar API Key de SendGrid
sgMail.setApiKey('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');

// Función para enviar correo y generar token en paralelo
async function enviarCorreoYGenerarToken(email, tipo) {
  const token = randomstring.generate({ length: 5, charset: 'numeric' });

  // Configuración tipo de token 
  let subject, text;

  if (tipo === 'registro') {
    subject = 'Token de registro';
    text = `Tu token de registro es: ${token}`;
  } else if (tipo === 'recuperacion') {
    subject = 'Token de recuperación de contraseña';
    text = `Tu token de recuperación de contraseña es: ${token}`;
  } else {
    throw new Error('Tipo de token no válido');
  }

  // Verificar que el email no esté vacío
  if (!email) {
    throw new Error('El correo electrónico no puede estar vacío');
  }

  // Verificar que subject y text no estén vacíos
  if (!subject || !text) {
    throw new Error('El asunto y el texto del mensaje no pueden estar vacíos');
  }

  // Enviar el token al correo electrónico proporcionado utilizando SendGrid
  const msg = {
    to: email,
    from: 'inpavimanager@gmail.com', // Dirección de correo verificada en SendGrid
    subject: subject,
    text: text,
  };

  try {
    await sgMail.send(msg);
    return token;
  } catch (error) {
    console.error('Error al enviar el correo electrónico:', error);
    throw new Error('Error al enviar el correo electrónico');
  }
}

// Ruta para manejar la solicitud POST de registro
app.post('/register', async (req, res) => {
  const { email, password, phone, role } = req.body;
  const origin = 'registro'; 
  req.session.origin = 'registro';
  console.log('Sesión en /registo:', req.session)
  console.log(origin);
  try {


    
    // Generar token y enviar correo en paralelo
    const token = await enviarCorreoYGenerarToken(email, 'registro');

    // Insertar el usuario en la base de datos junto con el token
    const query = 'INSERT INTO user (email, password, phone, role, token) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [email, password, phone, role, token], (error, results) => {
      if (error) {
        console.error('Error al insertar en la base de datos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
        return;
      }

      console.log('Usuario registrado en la base de datos');

      // Almacena el correo electrónico en la sesión
      req.session.email = email;

      // Redirigir al usuario a la página de ingresar token después de crear la cuenta
      res.redirect(`/ingresar-token-page?email=${email}`);
    });
  } catch (error) {
    console.error('Error al enviar correo y generar token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para manejar la solicitud POST de ingreso de token
app.post('/ingresar-token', (req, res) => {
  const { token } = req.body;
  const email = req.session.email;
  const origin = req.session.origin;
  console.log('Sesión en /ingresar-token:', req.session);
  console.log(origin);
  // Verificar el token en la base de datos para el correo dado
  const query = 'SELECT * FROM user WHERE email = ? AND token = ?';
  connection.query(query, [email, token], (error, results) => {
    if (error) {
      console.error('Error al verificar el token en la base de datos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }

    // Si se encuentra una coincidencia de correo y token en la base de datos
    if (results.length > 0) {
      // Establecer una variable de sesión para indicar que el token es válido
      req.session.tokenValido = true;
      
      res.redirect(`/verify?origin=${origin}`);
      console.log(origin);
      console.log("hola");
    } else {
      // Si no se encuentra una coincidencia, mostrar un mensaje de error
      res.status(400).json({ error: 'Token inválido' });
    }
  });
});

// Ruta para manejar la solicitud POST de inicio de sesión
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  console.log('Email ingresado:', email);
  console.log('Contraseña ingresada:', password);

  // Verificar las credenciales del usuario en la base de datos
  const query = 'SELECT * FROM user WHERE email = ? AND password = ?';
  connection.query(query, [email, password], (error, results) => {
    if (error) {
      console.error('Error al verificar las credenciales del usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }

    // Si se encuentra una coincidencia de correo y contraseña en la base de datos
    if (results.length > 0) {
      // Redirigir al usuario a la página index
      res.redirect('/principal');
    } else {
      // Si las credenciales son inválidas, mostrar un mensaje de error y redirigir al usuario de nuevo a la página de inicio de sesión
      res.status(401).send('Credenciales inválidas. Por favor, reintente.');
    }
  });
});

// Ruta para manejar la solicitud POST de recuperación de contraseña
app.post('/rec_contra', async (req, res) => {
  const { email } = req.body;
  const origin = 'recuperacion';
  req.session.origin = origin;
  console.log('Email ingresado:', email);
  console.log('Valor de origin en ingresar-token:', origin);
  console.log('Sesión en /rec_contra:', req.session);

  // Verificar el correo del usuario en la base de datos
  const query = 'SELECT * FROM user WHERE email = ?';
  connection.query(query, [email], async (error, results) => {
    if (error) {
      console.error('Error al verificar el correo del usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }

    // Si se encuentra una coincidencia de correo en la base de datos
    if (results.length > 0) {
      // Generar token y enviar correo en paralelo
      try {
        const token = await enviarCorreoYGenerarToken(email, 'recuperacion');

        // Actualizar el token en la base de datos
        const queryUpdate = 'UPDATE user SET token = ? WHERE email = ?';
        connection.query(queryUpdate, [token, email], (error, results) => {
          if (error) {
            console.error('Error al actualizar el token en la base de datos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
          }

          console.log('Nuevo token enviado');

          // Almacena el correo electrónico en la sesión
          req.session.email = email;
          req.session.origin = origin;
          // Redirigir al usuario a la página de ingresar token
          res.redirect(`/ingresar-token-page`);
        });
      } catch (error) {
        console.error('Error al enviar correo y generar token:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    } else {
      // Si el correo no se encuentra, mostrar un mensaje de error
      res.status(401).send('El usuario no existe.');
    }
  });
});

app.all('/actual_contra', async (req, res) => {
  const {password1, password2} = req.body;
  const email = req.session.email;
  // Verificar el correo del usuario en la base de datos
  const query = 'SELECT * FROM user WHERE email = ?';
  connection.query(query, [email], async (error, results) => {
    if (error) {
      console.error('Error al verificar el correo del usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }
    // Si se encuentra una coincidencia de correo en la base de datos
    if (results.length > 0) {
      // Generar token y enviar correo en paralelo
      if (password1 === password2) {

        // Actualizar el token en la base de datos
        const queryUpdate = 'UPDATE user SET password = ? WHERE email = ?';
        connection.query(queryUpdate, [password1, email], (error, results) => {
          if (error) {
            console.error('Error al actualizar la contraseña en la base de datos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
          }
          console.log(password1);

          // Almacena el correo electrónico en la sesión
          req.session.email = email;

          // Redirigir al usuario a la página de ingresar token
          res.redirect(`/login`);
        });
      } else {
        console.error('Las contraseñas ingresadas son distintas', error);
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    } else {
      // Si el correo no se encuentra, mostrar un mensaje de error
      res.status(401).send('El usuario no existe.');
    }
  });
});

// Ruta para manejar la solicitud GET de la página de ingresar token
app.get('/ingresar-token-page', (req, res) => {
  const email = req.query.email; // Obtener el correo electrónico del parámetro
  // Enviar el archivo HTML de la página de ingresar token
  res.sendFile(path.join(__dirname, 'public', 'views', 'ingresar-token.html'));
});

// Ruta para manejar la solicitud GET de la página de registro
app.get('/register', (req, res) => {
  // Enviar el archivo HTML del formulario de registro
  res.sendFile(path.join(__dirname, 'public', 'views', 'register.html'));
});

// Ruta para manejar la solicitud GET de la página de verificar
app.all('/verify', (req, res) => {
  // Verificar si el token es válido
  const origin = req.session.origin;

  console.log('Sesión en /verify:', req.session);
  
    const email = req.session.email;

    const query = 'SELECT * FROM user WHERE email = ?';
    connection.query(query, [email], (error, results) => {
      if (error) {
        console.error('Error al obtener los datos del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
        return;
      }
      console.log("adois");
      if (results.length > 0) {
        console.log("holiwis");
        console.log(origin)
        if (origin === 'recuperacion'){
          console.log("aaqui");
          setTimeout(() => {
            console.log("dentro");
            // Redireccionar después de 5 segundos
            res.redirect('/actual_contra');
          }, 7000);
        } 
        else if (origin === 'registro') {
          console.log("dentro2");
          console.log(origin);
          setTimeout(() => {
            // Redireccionar después de 5 segundos
            res.redirect('/login');
          }, 5000);
        }
        
        console.log("holaaaa");

        } else {
        console.error('No se encontraron datos del usuario en la base de datos');
        res.status(404).json({ error: 'Usuario no encontrado' });
      }
    });
  
});

app.all('/cambiar-pagina', (req, res) => {
  const nuevaPagina = req.body.nuevaPagina;

  // Si la nueva página es 'login', envía la página 'login.html'
  if (nuevaPagina === 'login') {
    res.sendFile(path.join(__dirname, 'public', 'views', 'login.html'));
  } else {
    // Manejar otras páginas si es necesario
    // Por ejemplo, puedes devolver un error 404 si la página no está disponible
    res.status(404).send('Página no encontrada');
  }
});


app.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'views', 'verify.html'));
});

// Ruta para manejar la solicitud GET de la página de inicio de sesión
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'views', 'login.html'));
});

// Ruta para manejar la solicitud GET en la página de inicio (index)
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'views', 'index.html'));
});

app.get('/principal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'views', 'principal.html'));
});
// Ruta para manejar la solicitud GET de la página de recuperación de contraseña
app.get('/rec_contra', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'views', 'rec_contra.html'));
});



// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en el puerto ${PORT}`);
});
