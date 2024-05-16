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
        return response.json().then(data => {
            return { status: response.status, body: data };
        });
    })
    .then(({ status, body }) => {
        if (status === 200) {
            alert('Usuario encontrado [después se implementará la redirección]'); 
        } else if (status === 404) {
            alert('Credenciales incorrectas'); // Credenciales incorrectas
        } else {
            alert('Error al iniciar sesión: ' + (body.mensaje || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error al iniciar sesión:', error);
        alert('Error al iniciar sesión');
    });
}