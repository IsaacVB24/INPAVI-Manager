document.addEventListener('DOMContentLoaded', () => {
    fetch('/obtenerBotones', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json()) // Convertir la respuesta a JSON
    .then(respuesta => {
        if (respuesta) {
            get('username').innerHTML = respuesta.nombre;
            get('rol').innerHTML = respuesta.rol;
            const divBotones = get('botonesDinamicos');
            respuesta.botones.forEach(boton => {
                const nvoA = document.createElement('a');
                nvoA.href = boton.ruta;
                const nvoBoton = document.createElement('button');
                nvoBoton.innerHTML = boton.nombre;
                nvoA.appendChild(nvoBoton)
                divBotones.appendChild(nvoA);
            });
        } else {
            alert('Error al obtener datos: ' + respuesta.mensaje);
        }
    })
    .catch(error => {
        console.error('Error al obtener datos:', error);
    });
});