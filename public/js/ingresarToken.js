document.addEventListener('DOMContentLoaded', () => {
    const correo = localStorage.getItem('correo');
    fetch('/obtenerDatos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo: correo })
    })
    .then(response => response.json()) // Convertir la respuesta a JSON
    .then(data => {
        if (data) {
            localStorage.removeItem('correo');
            document.getElementById('nombres').value = data.nombres;
            document.getElementById('apPat').value = data.apPat;
            document.getElementById('apMat').value = data.apMat;
            document.getElementById('telefono').value = data.telefono;
            document.getElementById('email').value = data.correo;
            document.getElementById('rol').value = data.rol;
            document.getElementById('sede').value = data.sede;
        } else {
            alert('Error al obtener datos: ' + data.mensaje);
        }
    })
    .catch(error => {
        console.error('Error al obtener datos:', error);
        alert('Error al validar correo');
    });
});