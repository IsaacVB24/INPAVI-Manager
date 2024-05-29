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
                const nvoA = crear('a');
                nvoA.href = boton.ruta;
                const nvoBoton = crear('button');
                nvoBoton.innerHTML = boton.nombre;
                nvoBoton.disabled = boton.inactivo;
                nvoA.appendChild(nvoBoton)
                divBotones.appendChild(nvoA);
            });
            if(respuesta.id_rol === 5) {
                const divElementosExtra = get('elementosExtra');
                divElementosExtra.innerHTML = `
                <div class="table-responsive" id="tablaVoluntarios">      
                    <table class="table table-hover" style="text-align: center;">
                    <thead>
                        <tr>
                        <th>Nombre(s)</th>
                        <th>Apellido paterno</th>
                        <th>Ocupación</th>
                        <th>Derivación</th>
                        <th>Intereses</th>
                        <th>Primeros contactos</th>
                        <th>Tipo de voluntario</th>
                        </tr>
                    </thead>
                    <tbody id="contenidoTabla">
                    </tbody>
                    </table>
                </div>`;
                fetch('/obtenerVoluntariosEquipoDirecto', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(respuesta => {
                    const tabla = document.getElementById('contenidoTabla');
                    respuesta.forEach(informacion => {
                        let derivacion = '';
                        let intereses = '';
                        let primerosContactos = '';
                
                        informacion.derivacion.forEach(programa => {
                            derivacion += (programa + '<br>');
                        });
                        if (informacion.intereses.length === 0) {
                            intereses += 'Sin intereses registrados<br>';
                        } else {
                            informacion.intereses.forEach(interes => {
                                intereses += (interes + '<br>');
                            });
                        }
                        informacion.primeros_contactos.forEach(contacto => {
                            primerosContactos += (contacto + '<br>');
                        });
                
                        const fila = `
                        <tr id='${informacion.id_voluntario}'>
                            <td class='align-middle'>${informacion.nombre}</td>
                            <td class='align-middle'>${informacion.apellido_paterno}</td>
                            <td class='align-middle'>${informacion.ocupacion}</td>
                            <td class='align-middle'>${derivacion}</td>
                            <td class='align-middle'>${intereses}</td>
                            <td class='align-middle'>${primerosContactos}</td>
                            <td class='align-middle'>${informacion.informe_valoracion}</td>
                        </tr>`;
                        tabla.innerHTML += fila;
                    });
                })
                .catch(error => {
                    console.error('Error al obtener los voluntarios activos:', error)
                });                
            }
        } else {
            alert('Error al obtener datos: ' + respuesta.mensaje);
        }
    })
    .catch(error => {
        console.error('Error al obtener datos:', error);
    });
});