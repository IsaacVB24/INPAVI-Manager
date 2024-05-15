function iniciarSesion() {
    var username = document.getElementById('correo').value;
    var password = document.getElementById('pass').value;

    // Enviar una solicitud POST al servidor para validar el inicio de sesión
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo: username, contraseña: password })
    })
    .then(response => {
        if (response.status === 200) {
            alert('Inicio de sesión exitoso');
        } else if (response.status === 404) {
            alert('El usuario no existe');
        } else {
            alert('Error al iniciar sesión');
        }
    })
    .catch(error => {
        console.error('Error al iniciar sesión:', error);
        alert('Error al iniciar sesión');
    });
}