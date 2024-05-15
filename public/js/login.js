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
    .then(response => response.json())
    .then(data => {
    if (data.mensaje === 'OK') {
        alert('Inicio de sesión exitoso');
    } else {
        alert('El usuario no existe');
    }
    })
    .catch(error => {
    console.error('Error al iniciar sesión:', error);
    alert('Error al iniciar sesión');
    });
}