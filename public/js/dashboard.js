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
            const divElementosExtra = get('elementosExtra');
            respuesta.botones.forEach(boton => {
                const nvoA = crear('a');
                nvoA.href = boton.ruta;
                const nvoBoton = crear('button');
                nvoBoton.innerHTML = boton.nombre;
                nvoA.appendChild(nvoBoton)
                divBotones.appendChild(nvoA);
            });
            if(respuesta.id_rol === 5) {}
        } else {
            alert('Error al obtener datos: ' + respuesta.mensaje);
        }
    })
    .catch(error => {
        console.error('Error al obtener datos:', error);
    });
});