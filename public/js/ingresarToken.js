document.addEventListener('DOMContentLoaded', () => {
    const correo = localStorage.getItem('correo');
    if(!correo) window.location.href = '/recursoNoEncontrado';
    get('btn-validarToken').addEventListener('click', validarToken);

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
            get('nombres').value = data.nombres;
            get('apPat').value = data.apPat;
            get('apMat').value = data.apMat;
            get('telefono').value = data.telefono;
            get('email').value = data.correo;
            get('rol').value = data.rol;
            get('sede').value = data.sede;
        } else {
            alert('Error al obtener datos: ' + data.mensaje);
        }
    })
    .catch(error => {
        console.error('Error al obtener datos:', error);
    });
});