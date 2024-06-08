document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('id');
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
            const flagRespuesta = respuesta;
            const rol = respuesta.id_rol;
    
            if ([1, 2, 3, 5].includes(rol)) {
                const divElementosExtra = get('elementosExtra');
                divElementosExtra.innerHTML = `
                    <div class="table-responsive" id="tablaVoluntarios">      
                        <table class="table" style="text-align: center;">
                            <thead>
                                <tr id="encabezados">
                                    <th class='align-middle'>Nombre(s)</th>
                                    <th class='align-middle'>Apellido paterno</th>
                                    <th class='align-middle'>Ocupación</th>
                                    <th class='align-middle'>Derivación</th>
                                    <th class='align-middle'>Intereses</th>
                                    <th class='align-middle'>Primeros contactos</th>
                                    <th class='align-middle'>Tipo de voluntario</th>
                                </tr>
                            </thead>
                            <tbody id="contenidoTabla">
                            </tbody>
                        </table>
                    </div>`;
                
                if (rol === 1 || (rol === 2 && respuesta.id_sede === 1)) {
                    const encabezadoSede = crear('th');
                    encabezadoSede.innerHTML = 'Sede';
                    encabezadoSede.classList.add('align-middle');
                    get('encabezados').appendChild(encabezadoSede);
                }
                if (rol === 1) {
                    const encabezadoEstado = crear('th');
                    encabezadoEstado.innerHTML = 'Estado';
                    encabezadoEstado.classList.add('align-middle');
                    get('encabezados').appendChild(encabezadoEstado);
                }
    
                fetch('/obtenerVoluntariosEquipoDirecto', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(respuesta => {
                    const tabla = get('contenidoTabla');
                    if (respuesta.length === 0) {
                        tabla.innerHTML = `
                            <tr>
                                <td colspan="${get('encabezados').querySelectorAll('th').length}" id="noVoluntarios">No hay voluntarios registrados aún, da clic en el botón para registrar a un voluntario.</td>
                            </tr>`;
                    }
                    
                    // Variable para manejar si se ha agregado el encabezado de "Acciones"
                    let accionesAgregadas = false;
                    
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
                        
                        const fila = crear('tr');
                        fila.id = informacion.id_voluntario;
                        
                        fila.innerHTML = `
                            <td class='align-middle'>${informacion.nombre}</td>
                            <td class='align-middle'>${informacion.apellido_paterno}</td>
                            <td class='align-middle'>${informacion.ocupacion}</td>
                            <td class='align-middle'>${derivacion || 'Sin datos'}</td>
                            <td class='align-middle'>${intereses}</td>
                            <td class='align-middle'>${primerosContactos || 'Sin información'}</td>
                            <td class='align-middle'>${informacion.informe_valoracion}</td>
                        `;
                        if (rol === 1 || (rol === 2 && flagRespuesta.id_sede === 1)) {
                            fila.innerHTML += `<td class='align-middle'>${informacion.sede}</td>`;
                        }
                        const estado = (informacion.estado === 0 ? 'Dado de baja' : (informacion.estado === 1 ? 'Alta' : 'Registrado'));
                        if (rol === 1) {
                            fila.innerHTML += `<td class='align-middle'>${estado}</td>`;
                        }
                        tabla.appendChild(fila);
                        
                        // Verificar si se necesita agregar el encabezado "Acciones"
                        if ([1, 2, 3, 5].includes(rol)) {
                            if (!accionesAgregadas) {
                                const headerRow = get('encabezados');
                                const headerActions = crear('th');
                                headerActions.colSpan = 2;
                                headerActions.textContent = 'Acciones';
                                headerActions.classList.add('align-middle');
                                headerRow.appendChild(headerActions);
                                accionesAgregadas = true;
                            }
                            const nvoTd = crear('td');
                            nvoTd.style.height = '30px';
                            nvoTd.classList.add('align-middle');
                            nvoTd.style.border = 'none';
                            nvoTd.style.padding = '5px';
                            const nvoIcono = crear('img');
                            nvoIcono.src = '../img/vista.png';
                            nvoIcono.alt = 'Ícono ojo de Smashicons en flaticon.es';
                            nvoIcono.style.height = '30px';
                            nvoIcono.id = `ver_${informacion.id_voluntario}`;
                            const nvoDiv = crear('div');
                            nvoDiv.style.width = '100%';
                            nvoDiv.style.padding = '5px';
                            nvoDiv.style.border = '0px solid black';
                            nvoDiv.style.borderRadius = '5px';
                            nvoDiv.style.backgroundColor = 'white';
                            nvoDiv.appendChild(nvoIcono);
                            nvoTd.appendChild(nvoDiv);
                            fila.appendChild(nvoTd);
                            get(`ver_${informacion.id_voluntario}`).addEventListener('click', () => {
                                let ruta = '';
                                localStorage.setItem('id', informacion.id_voluntario);
                                flagRespuesta.botones.forEach(boton => {
                                    if (boton.nombre === 'Ver la información de un voluntario') ruta = boton.ruta;
                                });
                                window.location = ruta;
                            });
                        }
                        if ([2, 3].includes(rol)) {
                            if (!accionesAgregadas) {
                                const headerRow = get('encabezados');
                                const headerActions = crear('th');
                                headerActions.colSpan = 2; // Asume que tendrás dos columnas de acciones
                                headerActions.textContent = 'Acciones';
                                headerRow.appendChild(headerActions);
                                accionesAgregadas = true;
                            }
                            const nvoTd = crear('td');
                            nvoTd.style.height = '30px';
                            nvoTd.classList.add('align-middle');
                            nvoTd.style.border = 'none';
                            nvoTd.style.padding = '3px';
                            const nvoIcono = crear('img');
                            nvoIcono.src = '../img/editar.png';
                            nvoIcono.alt = 'Ícono editar de Kiranshastry en flaticon.es';
                            nvoIcono.style.height = '30px';
                            nvoIcono.id = `modificar_${informacion.id_voluntario}`;
                            const nvoDiv = crear('div');
                            nvoDiv.style.width = '100%';
                            nvoDiv.style.padding = '5px';
                            nvoDiv.style.border = '0px solid black';
                            nvoDiv.style.borderRadius = '5px';
                            nvoDiv.style.backgroundColor = 'white';
                            nvoDiv.appendChild(nvoIcono);
                            nvoTd.appendChild(nvoDiv);
                            fila.appendChild(nvoTd);
                            get(`modificar_${informacion.id_voluntario}`).addEventListener('click', () => {
                                let ruta = '';
                                localStorage.setItem('id', informacion.id_voluntario);
                                flagRespuesta.botones.forEach(boton => {
                                    if (boton.nombre === 'Modificar información de un voluntario') ruta = boton.ruta;
                                });
                                window.location = ruta;
                            });
                        }
                    });
                    
                    flagRespuesta.botones.forEach(boton => {
                        if (boton.tipo === 'button') {
                            const nvoA = crear('a');
                            nvoA.href = boton.ruta;
                            nvoA.classList.add('btn');
                            nvoA.classList.add('btn-primary');
                            if (boton.inactivo) nvoA.classList.add('disabled');
                            nvoA.classList.add('ml-1');
                            nvoA.classList.add('mr-1');
                            nvoA.innerHTML = boton.nombre;
                            divBotones.appendChild(nvoA);
                        }
                    });
                })
                .catch(error => {
                    console.error('Error al obtener los voluntarios activos:', error);
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

function seleccionVoluntario(idFila) {
    const filaActual = get(idFila);
    const idFilaActual = localStorage.getItem('id');
    
    if (parseInt(idFilaActual) === idFila) {
        filaActual.classList.remove('table-success');
        localStorage.removeItem('id');
        const activos = document.querySelectorAll('a.activado');
        activos.forEach(boton => {
            boton.classList.add('disabled');
            boton.classList.remove('activado');
        });
    } else {
        const inactivos = document.querySelectorAll('a.disabled');
        const filasActivas = document.querySelectorAll('tr.table-success');
        filasActivas.forEach(fila => {
            fila.classList.remove('table-success');
        });
        filaActual.classList.add('table-success');
        localStorage.setItem('id', idFila);
        inactivos.forEach(boton => {
            boton.classList.add('activado');
            boton.classList.remove('disabled');
        });
    }
}