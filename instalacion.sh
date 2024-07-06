#!/bin/bash

# Actualizar lista de paquetes
sudo apt update

# Instalar Node.js y npm
sudo apt install nodejs
sudo apt install npm
sudo npm install express
sudo apt install npm
sudo npm install pm2 -g
sudo apt install sqlite3
npm install sqlite3
npm install nodemailer crypto
npm install bcrypt
npm install  express-session
npm install helmet
npm install dotenv
npm install cookie-parser

echo "Setup completo. Ahora puedes ejecutar 'npm start' para iniciar el servidor."