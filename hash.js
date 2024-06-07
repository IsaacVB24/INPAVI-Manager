const bcrypt = require('bcrypt');

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

// Obtener el parámetro de la línea de comandos
const contraseña = process.argv[2];

if (!contraseña) {
    console.error('Por favor, proporciona una contraseña como parámetro.');
    process.exit(1);
}

// Invocar la función encriptar y mostrar el resultado
encriptar(contraseña)
    .then(hash => {
        console.log('Hash encriptado:', hash);
    })
    .catch(error => {
        console.error('Error:', error);
    });