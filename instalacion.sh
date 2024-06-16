#!/bin/bash

# Actualizar lista de paquetes
sudo apt update

# Instalar Node.js y npm
sudo apt install nodejs
sudo apt install npm
sudo npm install -g express
sudo apt install npm
sudo npm install pm2 -g
npm install sqlite3
npm install nodemailer crypto
npm install bcrypt
npm install  express-session
npm install helmet

echo "Setup completo. Ahora puedes ejecutar 'npm start' para iniciar el servidor."