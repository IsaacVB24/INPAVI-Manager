#!/bin/bash

# Actualizar lista de paquetes
sudo apt update

# Instalar Node.js y npm
sudo apt install -y nodejs npm

# Instalar SQLite3
sudo apt install -y sqlite3

# Instalar dependencias del proyecto
npm install

echo "Setup completo. Ahora puedes ejecutar 'npm start' para iniciar el servidor."