let programas;
document.addEventListener('DOMContentLoaded', () => {
    get('alertas').innerHTML = ventanaModal;
    get('btn-buscar').addEventListener('click', () => {
        const criterio = get('criterio').value;
        consultarInactivos(criterio);
    });
    get('criterio').addEventListener('keydown', (event) => {
        if(event.key === 'Enter') consultarInactivos(get('criterio').value);
    });
    get('busqueda').addEventListener('click', () => {
        const toast = get('toastBusqueda');
        if(toast.classList.contains('show')) {
            toast.classList.add('hide');
            toast.classList.remove('show');
        } else {
            toast.classList.add('show');
            toast.classList.remove('hide');
        }
    });

    fetch('/obtenerProgramas', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if(!response.ok) {
            throw new Error('Error en la solicitud para obtener programas');
        }
        return response.json();
    })
    .then(datosProgramas => {
        //console.log(datosProgramas);
        programas = datosProgramas;
    })
    .catch(error => {
        console.error('Error en la solicitud para obtener programas:', error);
    });
    consultarInactivos(null);
});

function consultarInactivos(criterio) {
    const bodyTabla = get('contenidoTablaRegistrados');
    const encabezados = get('encabezadosRegistrados');
    const sedeTabla = get('sedeTabla');
    fetch('/voluntariosParaAlta', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ criterioBusqueda: criterio })
    })
    .then(response => response.json())
    .then(data => {
        const voluntarios = data.voluntariosArray;
        bodyTabla.innerHTML = '';

        if (voluntarios.length === 0) {
            bodyTabla.innerHTML = `
            <tr>
                <td colspan=${sedeTabla.style.display === 'none' ? encabezados.querySelectorAll('th').length - 1 : encabezados.querySelectorAll('th').length}>Todos los voluntarios están dados de alta o no hay voluntarios registrados.</td>
            </tr>
            `;
        } else {
            if (voluntarios[0].sedeVoluntario !== null) sedeTabla.style.display = 'block';
            voluntarios.forEach(voluntario => {
                const idVoluntario = voluntario.id_voluntario;
                const intereses = voluntario.intereses ? voluntario.intereses.split(',') : [];
                const nombreVoluntario = voluntario.nombreVoluntario;
                const ocupacionVoluntario = voluntario.ocupacion;
                const sedeVoluntario = voluntario.sedeVoluntario;
                const usuarioDeAlta = voluntario.usuarioDeAlta;
                const valoracion = voluntario.valoracion ? voluntario.valoracion.split(',') : [];

                const nvoTr = crear('tr');
                nvoTr.id = idVoluntario;

                const nombreVoluntarioTd = crear('td');
                nombreVoluntarioTd.innerHTML = nombreVoluntario;
                nvoTr.appendChild(nombreVoluntarioTd);

                const ocupacionVoluntarioTd = crear('td');
                ocupacionVoluntarioTd.innerHTML = ocupacionVoluntario;
                nvoTr.appendChild(ocupacionVoluntarioTd);

                if(intereses.length > 0) {
                    const interesesTd = crear('td');
                    const ulIntereses = crear('ul');
                    intereses.forEach(interes => {
                        const li = crear('li');
                        li.innerHTML = interes;
                        ulIntereses.appendChild(li);
                    });
                    interesesTd.appendChild(ulIntereses);
                    nvoTr.appendChild(interesesTd);
                } else {
                    const interesesTd = crear('td');
                    interesesTd.innerHTML = 'Sin intereses registrados';
                    nvoTr.appendChild(interesesTd);
                }

                const valoracionTd = crear('td');
                const ulValoracion = crear('ul');
                valoracion.forEach(programa => {
                    const li = crear('li');
                    li.innerHTML = programa;
                    ulValoracion.appendChild(li);
                });
                valoracionTd.appendChild(ulValoracion);
                nvoTr.appendChild(valoracionTd);

                const personaDeAltaTd = crear('td');
                personaDeAltaTd.innerHTML = usuarioDeAlta;
                nvoTr.appendChild(personaDeAltaTd);

                if (sedeTabla.style.display === 'block') {
                    const sedeTd = crear('td');
                    sedeTd.innerHTML = sedeVoluntario;
                    nvoTr.appendChild(sedeTd);
                }

                const acciones = crear('td');
                const nvoDiv = crear('div');
                nvoDiv.classList.add('d-flex');
                const img1 = crear('img');
                img1.src = '../img/vista.png';
                img1.alt = 'Ícono ojo de Smashicons en flaticon.es';
                img1.style.height = '30px';
                img1.classList.add('m-3');
                img1.title = 'Ver información del voluntario';
                img1.id = `ver_${idVoluntario}`;
                nvoDiv.appendChild(img1);
                const img2 = crear('img');
                img2.src = '../img/vinculacion.png';
                img2.alt = 'Ícono vinculación de blinixsolutions en flaticon.es';
                img2.style.height = '30px';
                img2.classList.add('m-3');
                img2.title = 'Vincular voluntario a programas';
                img2.id = `vincular_${idVoluntario}`;
                nvoDiv.appendChild(img2);
                acciones.appendChild(nvoDiv);
                nvoTr.appendChild(acciones);

                bodyTabla.appendChild(nvoTr);
                get(`ver_${idVoluntario}`).addEventListener('click', () => {
                    localStorage.setItem('id', idVoluntario);
                    localStorage.setItem('anterior', '/inactivos');
                    window.location.href = '/datosVoluntario';
                });
                get(`vincular_${idVoluntario}`).addEventListener('click', () => {
                    vincularVoluntario(voluntario, programas);
                });
            });
        }
        document.querySelectorAll('th').forEach(th => { th.classList.add('align-middle'); });
        document.querySelectorAll('td').forEach(td => { td.classList.add('align-middle'); });
    })
    .catch(error => {
        console.error(`Error: ${error}`);
    });
}

function vincularVoluntario(voluntario, programas) {
    console.log(voluntario, programas);
    const modal = new bootstrap.Modal(get('myModal'));
    let divProgramas = ``;
    programas.forEach(dato => {
        const checkbox = `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" id="derivacion_${dato.id}" name="derivacion_${dato.id}" value="${dato.id}">
            <label class="form-check-label" for="derivacion_${dato.id}">${dato.nombre} - Voluntarios: ${dato.cantidadVoluntarios}</label>
        </div>`;
        divProgramas += checkbox;
    });
    mostrarModal('Vincular voluntario', `
        ¿A qué programa(s) deseas vincular a "${voluntario.nombreVoluntario}"?<br><br>
        <div id='divProgramas'>${divProgramas}<div>
        `, modal);

    const botonModal = get(idBotonModal);
    botonModal.innerHTML = 'Vincular voluntario';
    botonModal.classList.remove('btn-danger');
    botonModal.classList.add('btn-success');
    botonModal.addEventListener('click', () => {
        const idsProgramas = [];
        get('divProgramas').querySelectorAll('input[type="checkbox"]:checked').forEach(checked => {
            idsProgramas.push(parseInt(checked.value));
        });
        if(idsProgramas.length === 0) return alert('No se han seleccionado programas de derivación para "' + voluntario.nombreVoluntario + '"');
        if(!get('spinner')) get('botonesModal').innerHTML += `<div id='spinner' class='spinner-border text-success'></div>`;
        modal.hide();
        let codigo = 0;

        fetch('/modificarDatosVoluntario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                id_voluntario: voluntario.id_voluntario,
                id_internoAsignado: null,
                fechaCaptacion: null,
                nombres: null,
                apPat: null,
                apMat: null,
                identificacion: null,
                fechaNacimiento: null,
                telefono: null,
                correo: null,
                ocupacion: null,
                tipoVoluntario: null,
                observaciones: null,
                id_sede: null,
                personaContacto: null,
                intereses: null,
                valoracion: null,
                primerosContactos: null,
                derivacion: idsProgramas
             })
        })
        .then(response => {
            if(!response.ok) {
                throw new Error('Error en la solicitud para obtener programas');
            }
            codigo = 200;
            return response.json();
        })
        .then(data => {
            alert(data.mensaje);
            if(codigo === 200) window.location.href = '/inactivos';
        })
        .catch(error => {
            if(get('spinner')) get('spinner').remove();
            console.error('Error al modificar los datos del voluntario: ' + error);
            alert('Error al modificar los datos del voluntario');
        });
    });

    get('myModal').addEventListener('hidden.bs.modal', () => {
        alert('bye');
        modal.dispose();
        get('myModal').remove();
    });
}