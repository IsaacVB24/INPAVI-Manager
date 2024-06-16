let datosActuales = {};
let ocupacionGlobal = '';
let modal;

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('textarea').forEach(textarea => {textarea.style.resize = 'none';});
    const id_voluntario = localStorage.getItem('id');
    get('alertas').innerHTML = ventanaModal;
    const elementoModal = get('myModal');
    modal = new bootstrap.Modal(elementoModal);
    //localStorage.clear();
    //return;
    fetch('/infoVoluntario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_voluntario })
    })
        .then(response => {
            if (response.ok) {
                return response.json(); // Convertir la respuesta a JSON
            }
            throw new Error('Error al obtener las sedes');
        })
        .then(data => {
            if(data.row.nombre_v) {
                // URL de las solicitudes
                const urls = [
                    '/obtenerOcupaciones',
                    '/obtenerIntereses',
                    '/obtenerProgramas',
                    '/obtenerPrimerosContactos',
                    '/obtenerSedes'
                ];

                // Realizar las solicitudes con Promise.all
                Promise.all(urls.map(url => fetch(url).then(response => {
                    if (response.ok) {
                    return response.json();
                    }
                    throw new Error(`Error al obtener datos desde ${url}`);
                })))
                .then(([ocupaciones, intereses, programas, primerosContactos, sedes]) => {
                    const voluntario = data.row;
                    const nombres = get('nombres');
                    const apPat = get('apPat');
                    const apMat = get('apMat');
                    const tipoVoluntario = get('tipoVoluntario');
                    const fechaNacimiento = get('fechaNacimiento');
                    const correo = get('correo');
                    const telefono = get('telefono');
                    const identificacion = get('identificacion');
                    const selectOcupacion = get('ocupacionV');
                    const fechaCaptacion = get('fechaCaptacion');
                    const selectSede = get('sede');
                    const personaContacto = get('personaContacto');
                    const selectInternoAsignado = get('internoAsignado');
                    const divIntereses = get('divIntereses');
                    const ulIntereses = get('listaIntereses');
                    const divValoracion = get('valoracion');
                    const divPrimerosContactos = get('primerosContactos');
                    const divDerivacion = get('derivacion');
                    const observaciones = get('observaciones');
                    const soloNombres = [nombres, apPat, apMat, personaContacto];
                    soloNombres.forEach(campo => {
                        permitirSoloNombres(campo);
                    });
                    permitirSoloNumeros(telefono);
                    nombres.value = voluntario.nombre_v;
                    datosActuales.nombres = voluntario.nombre_v;
                    apPat.value = voluntario.apellido_paterno_v;
                    datosActuales.apellidoPaterno = voluntario.apellido_paterno_v;
                    apMat.value = voluntario.apellido_materno_v;
                    datosActuales.apellidoMaterno = voluntario.apellido_materno_v;
                    tipoVoluntario.selectedIndex = voluntario.informe_valoracion === 0 ? 1 : 2;
                    datosActuales.tipoVoluntario = voluntario.informe_valoracion;
                    const nacimiento = new Date(voluntario.fecha_nacimiento);
                    fechaNacimiento.value = nacimiento.toISOString().slice(0, 10);
                    datosActuales.fechaNacimiento = fechaNacimiento.value;
                    correo.value = voluntario.correo_v;
                    datosActuales.correo = voluntario.correo_v;
                    telefono.value = voluntario.telefono_v;
                    datosActuales.telefono = voluntario.telefono_v;
                    identificacion.value = voluntario.identificacion;
                    datosActuales.identificacion = voluntario.identificacion;
                    ocupaciones.forEach(ocupacion => {
                        const option = crear('option');
                        option.value = ocupacion.id_ocupacion;
                        option.innerHTML = ocupacion.ocupacion;
                        option.id = 'ocupacion_' + ocupacion.id_ocupacion;
                        selectOcupacion.appendChild(option);
                    });
                    if(voluntario.id_ocupacion) {
                        const idOcupacion = voluntario.id_ocupacion;

                        for (let i = 0; i < selectOcupacion.options.length; i++) {
                            if (selectOcupacion.options[i].value == idOcupacion) {
                                selectOcupacion.selectedIndex = i;
                                break;
                            }
                        }
                    }
                    datosActuales.id_ocupacion = voluntario.id_ocupacion;
                    datosActuales.ocupacion = selectOcupacion.options[selectOcupacion.selectedIndex].text;
                    const captacion = new Date(voluntario.fecha_captacion);
                    fechaCaptacion.value = captacion.toISOString().slice(0, 10);
                    datosActuales.captacion = fechaCaptacion.value;
                    sedes.forEach(sede => {
                        const option = crear('option');
                        option.value = sede.id_sede;
                        option.innerHTML = sede.sede;
                        option.id = 'sede_' + sede.id_sede;
                        selectSede.appendChild(option);
                    });
                    selectSede.addEventListener('change', (event) => {
                        const idSedeSeleccionada = selectSede.options[selectSede.selectedIndex].value;
                        fetch('/obtenerNombreVoluntarios', {
                            method: 'POST',
                            headers: {
                                'Content-type': 'application/json'
                            },
                            body: JSON.stringify({ id_sede: idSedeSeleccionada })
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Hubo un problema con la solicitud: ' + response.status);
                            }
                            return response.json();
                        })
                        .then(voluntarios => {
                            selectInternoAsignado.innerHTML = `<option value="0" selected>Sin asignación</option>`;
                            voluntarios.forEach((voluntario) => {
                                //console.log(voluntario, indice);
                                const option = crear('option');
                                option.value = voluntario.id_voluntario;
                                option.innerHTML = voluntario.nombreCompleto;
                                option.id = `voluntario_${voluntario.id_voluntario}`;
                                //console.log(option);
                                if (voluntario.nombreCompleto !== `${nombres.value} ${apPat.value} ${apMat.value}`) selectInternoAsignado.appendChild(option);
                            });
                            selectInternoAsignado.selectedIndex = 0;
                        })
                        .catch(error => {
                            console.error('Error al realizar la solicitud: ' + error);
                        });
                    })
                    const btnAgregarOcupacion = get('agregarOcupacion');
                    btnAgregarOcupacion.addEventListener('click', () => {
                        idInnerHTML(idHModal, 'Añadir ocupación');
                        idInnerHTML(idBModal, '<input type="text" class="shadow form-control" id="ocupacionNva" placeholder="Ingrese la nueva ocupación" name="ocupacionNva" required autocomplete="off" maxlength="100">');
                        idInnerHTML(idBotonModal, 'Añadir');
                        const btnAgregar = get(idBotonModal);
                        bloquearCaracteresEspeciales(get('ocupacionNva'));
                        btnAgregar.classList.remove('btn-danger');
                        btnAgregar.classList.add('btn-warning');
                        enterEnInput(get('ocupacionNva'), idBotonModal);
                        const ocupaciones = [];
                        get('ocupacionV').querySelectorAll('option').forEach(opcion => {
                            ocupaciones.push(opcion.text.toLowerCase());
                        });
                        const divOcupacion = get('divOcupacion');
                        const actualesOcupaciones = divOcupacion.innerHTML;
                        const divEnlacesOcupacion = get('divEnlacesOcupacion');
                        const actualesEnlaces = divEnlacesOcupacion.innerHTML;
                        btnAgregar.addEventListener('click', () => {
                            const ocupacionNueva = get('ocupacionNva').value.trim().toLowerCase();
                            if (ocupacionNueva !== '') {
                                if (ocupaciones.includes(ocupacionNueva)) {
                                    alert('Esa ocupación ya existe');
                                } else {
                                    ocupacionGlobal = ocupacionNueva;
                                    divOcupacion.innerHTML = `
                                        <span class="input-group-text">Ocupación:</span>
                                        <input type="text" class="form-control" id="ocupacionAgregada" placeholder="Ocupación nueva" readonly style='user-select: no; cursor: default;'>
                                    `;
                                    get('ocupacionAgregada').setAttribute('value', get('ocupacionNva').value.trim());
                                    divEnlacesOcupacion.innerHTML = `<a href="#" data-bs-toggle="modal" data-bs-target="#myModal" id="agregarOcupacion" style='color: #df950d;'>Modificar ocupación</a><a class='text-danger' id="eliminarOcupacion" style='float: right;'>Eliminar ocupación</a>`;
                                    get('eliminarOcupacion').addEventListener('click', () => {
                                        divOcupacion.innerHTML = actualesOcupaciones;
                                        divEnlacesOcupacion.innerHTML = actualesEnlaces;
                                        get('ocupacionNva').value = '';
                                    });
                                }
                            }
                        });
                    });
                    selectSede.selectedIndex = voluntario.id_sede - 1;
                    datosActuales.id_sede = voluntario.id_sede;
                    datosActuales.sede = selectSede.options[selectSede.selectedIndex].text;
                    personaContacto.value = voluntario.personaContacto || '-';
                    datosActuales.personaContacto = voluntario.personaContacto || '-';
                    observaciones.value = voluntario.observaciones || '-';
                    datosActuales.observaciones = voluntario.observaciones || '-';

                    let interesesVoluntario;
                    if(voluntario.intereses) interesesVoluntario = voluntario.intereses.split(',');
                    datosActuales.intereses = voluntario.intereses;
                    intereses.forEach((elemento, indice) => {
                        const interes = elemento.interes;
                      
                        const nvoInput = crear('input');
                        nvoInput.className = 'form-check-input';
                        nvoInput.type = 'checkbox';
                        nvoInput.id = 'chk_' + interes;
                        nvoInput.value = indice + 1;
                      
                        const nvoLabel = crear('label');
                        nvoLabel.className = 'form-check-label';
                        nvoLabel.htmlFor = nvoInput.id;
                        nvoLabel.innerHTML = `&nbsp${interes}`;
                      
                        const nvoLi = crear('li');
                        nvoLi.id = 'interes_' + (indice + 1);
                        nvoLi.appendChild(nvoInput);
                      
                        if (interesesVoluntario) {
                          if (interesesVoluntario.includes(interes)) nvoInput.checked = true;
                        }
                      
                        nvoLi.appendChild(nvoLabel);
                      
                        ulIntereses.appendChild(nvoLi);
                    });
              
                    const nvoDiv = crear('div');
                    nvoDiv.id = 'nvosIntereses';
                    ulIntereses.appendChild(nvoDiv);
            
                    const li = crear('li');
                    const nvoHr = crear('hr');
                    nvoHr.className = 'dropdown-divider';
                    li.appendChild(nvoHr);
                    ulIntereses.appendChild(li);
            
                    const otroLi = crear('li');
                    const otroDiv = crear('div');
                    otroDiv.className = 'mt-1';
                    const nvoA = crear('a');
                    nvoA.href = '#';
                    nvoA.onclick = () => { agregarInteres(); get(idBotonModal).classList.remove('btn-danger'); get(idBotonModal).classList.add('btn-warning'); };
                    nvoA.setAttribute('data-bs-toggle', 'modal');
                    nvoA.setAttribute('data-bs-target', '#myModal');
                    nvoA.innerText = 'Añadir nuevo interés';
                    otroDiv.appendChild(nvoA);
                    otroLi.appendChild(otroDiv);
                    ulIntereses.appendChild(otroLi);
                    programas.forEach(programa => {
                        const nuevoDiv = crear('div');
                        nuevoDiv.classList.add('form-check');
                        nuevoDiv.classList.add('mt-2');
                        const btnPrograma = crear('button');
                        btnPrograma.id = programa.id;
                        btnPrograma.type = 'button';
                        btnPrograma.classList.add('w-50');
                        btnPrograma.innerHTML = programa.nombre;
                        nuevoDiv.appendChild(btnPrograma);
                        const clon1 = nuevoDiv.cloneNode(true);
                        const clon2 = nuevoDiv.cloneNode(true);
                        divValoracion.appendChild(clon1);
                        divDerivacion.appendChild(clon2);
                    });
                    const siguienteIDProgramas = programas.length + 1;
                    const seccionProyecto = `
                    <div class="form-check mt-2">
                                    <button type="button" class="w-50" id="proyecto">Proyecto</button>
                                </div>
                                <div class="form-check mt-2" style="text-align: center;">
                                    <textarea name="${siguienteIDProgramas}" id="nombreProyecto" cols="30" rows="2" style="resize: none; padding: 6px; display: none;" maxlength="200" placeholder="Nombre del proyecto"></textarea>
                                </div>
                    `;

                    const valoracion = voluntario.valoracion.split(',');
                    const derivacion = voluntario.derivacion.split(',');
                    datosActuales.valoracion = voluntario.valoracion;
                    datosActuales.derivacion = voluntario.derivacion;
                    divDerivacion.innerHTML += seccionProyecto;
                    const botonesValoracion = divValoracion.querySelectorAll('button');
                    botonesValoracion.forEach(boton => {
                        boton.addEventListener('click', () => {botonSeleccionado(boton);});
                        if(valoracion.includes(boton.textContent)) boton.click();
                    });
                    const botonesDerivacion = divDerivacion.querySelectorAll('button');
                    botonesDerivacion.forEach(boton => {
                        boton.addEventListener('click', () => {botonSeleccionado(boton);});
                        if(derivacion.includes(boton.textContent)) boton.click();
                    });

                    primerosContactos.forEach(contacto => {
                        const nuevoDiv = crear('div');
                        nuevoDiv.classList.add('form-check');
                        nuevoDiv.classList.add('mt-2');
                        const btnContacto = crear('button');
                        btnContacto.classList.add('w-75');
                        btnContacto.type ='button';
                        btnContacto.id = contacto.id;
                        btnContacto.innerHTML = contacto.nombre;
                        nuevoDiv.appendChild(btnContacto);
                        divPrimerosContactos.appendChild(nuevoDiv);
                    });
                    const contactosVoluntario = voluntario.primerosContactos.split(',');
                    datosActuales.primerosContactos = voluntario.primerosContactos;
                    const botonesPrimerosContactos = divPrimerosContactos.querySelectorAll('button');
                    botonesPrimerosContactos.forEach(boton => {
                        boton.addEventListener('click', () => {botonSeleccionado(boton);});
                        if(contactosVoluntario.includes(boton.textContent)) boton.click();
                    });
                    const btnModificar = get('modificacionVoluntario');
                    btnModificar.setAttribute('data-bs-toggle', 'modal');
                    btnModificar.setAttribute('data-bs-target', '#myModal');
                    btnModificar.onclick = () => {modificarDatosVoluntario()};
                    //
                    const id_sede = selectSede.options[selectSede.selectedIndex].value;
                    fetch('/obtenerNombreVoluntarios', {
                        method: 'POST',
                        headers: {
                            'Content-type': 'application/json'
                        },
                        body: JSON.stringify({ id_sede: id_sede })
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Hubo un problema con la solicitud: ' + response.status);
                        }
                        return response.json();
                    })
                    .then(voluntarios => {
                        selectInternoAsignado.innerHTML = `<option value="0" selected>Sin asignación</option>`;
                        voluntarios.forEach((voluntario) => {
                            //console.log(voluntario);
                            const option = crear('option');
                            option.value = voluntario.id_voluntario;
                            option.innerHTML = voluntario.nombreCompleto;
                            option.id = `voluntario_${voluntario.id_voluntario}`;
                            //console.log(option);
                            if (voluntario.nombreCompleto !== `${nombres.value} ${apPat.value} ${apMat.value}`) selectInternoAsignado.appendChild(option);
                        });
                        for (let i = 0; i < selectInternoAsignado.options.length; i++) {
                            if (parseInt(selectInternoAsignado.options[i].value) === voluntario.id_voluntarioAsignado) {
                                selectInternoAsignado.selectedIndex = i;
                                break;
                            }
                        }
                        datosActuales.id_voluntarioAsignado = voluntario.id_voluntarioAsignado;
                        datosActuales.voluntarioAsignado = selectInternoAsignado.options[selectInternoAsignado.selectedIndex].text;
                    })
                    .catch(error => {
                        console.error('Error al realizar la solicitud: ' + error);
                    });
                    get('bajaVoluntario').onclick =  () => {darDeBajaVoluntario()};
                })
                .catch(error => {
                console.error('Error al cargar los datos:', error);
                });
            } else {
                alert("No se tienen datos del voluntario buscado");
                window.location.href = '/tablero';
            }
        })
        .catch(error => {
            console.error('Error al cargar sedes:', error);
            alert('Error al cargar sedes');
        });
});

function modificarDatosVoluntario() {
    const nombres = get('nombres').value.trim();
    const apPat = get('apPat').value.trim();
    const apMat = get('apMat').value.trim();
    const tipoVoluntario = get('tipoVoluntario').options[get('tipoVoluntario').selectedIndex].id - 1;
    const nombreTipoVoluntario = tipoVoluntario === 0 ? 'Interno' : 'Externo temporal';
    const fechaNacimiento = get('fechaNacimiento').value;
    const correo = get('correo').value.trim();
    const correoValido = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(correo);
    const telefono = get('telefono').value.trim();
    const identificacion = get('identificacion').value.trim();
    const ocupacion = (get('ocupacionAgregada') ? ocupacionGlobal : get('ocupacionV').options[get('ocupacionV').selectedIndex].text);
    const fechaCaptacion = get('fechaCaptacion').value;
    const sede = get('sede').options[get('sede').selectedIndex].text;
    const id_sede = get('sede').options[get('sede').selectedIndex].value;
    const personaContacto = get('personaContacto').value.trim() || '-';
    const internoAsignado = get('internoAsignado').options[get('internoAsignado').selectedIndex].text;
    const id_internoAsignado = get('internoAsignado').options[get('internoAsignado').selectedIndex].value;
    const ulIntereses = get('listaIntereses').querySelectorAll('li');
    const interesesActuales = [];
    ulIntereses.forEach(li => {
        if(li.querySelector('label') && li.querySelector('input').checked) interesesActuales.push(li.querySelector('label').innerText.trim());
    });
    const divValoracion = get('valoracion');
    const divPrimerosContactos = get('primerosContactos');
    const divDerivacion = get('derivacion');
    const valoracionActual = [];
    const idsValoracionActual = [];
    divValoracion.querySelectorAll('div button.seleccionado').forEach(boton => {
        valoracionActual.push(boton.textContent);
        idsValoracionActual.push(boton.id);
    });
    const primerosContactosActuales = [];
    const idsContactosActuales = [];
    divPrimerosContactos.querySelectorAll('div button.seleccionado').forEach(boton => {
        primerosContactosActuales.push(boton.textContent);
        idsContactosActuales.push(boton.id);
    });
    const derivacionActual = [];
    const idsDerivacionActual = [];
    divDerivacion.querySelectorAll('div button.seleccionado').forEach(boton => {
        derivacionActual.push(boton.textContent === 'Proyecto' ? get('nombreProyecto').value.trim() : boton.textContent);
        idsDerivacionActual.push(boton.textContent === 'Proyecto' ? get('nombreProyecto').name : boton.id);
    });
    const observaciones = get('observaciones').value.trim() || '-';
    
    // Validar si hay cambios
    const idsModificados = [];
    if(nombres !== datosActuales.nombres) idsModificados.push('nombres');
    if(apPat !== datosActuales.apellidoPaterno) idsModificados.push('apPat');
    if(apMat !== datosActuales.apellidoMaterno) idsModificados.push('apMat');
    if(tipoVoluntario !== datosActuales.tipoVoluntario) idsModificados.push('tipoVoluntario');
    if(fechaNacimiento !== datosActuales.fechaNacimiento) idsModificados.push('fechaNacimiento');
    if(correo !== datosActuales.correo) idsModificados.push('correo');
    if(telefono !== datosActuales.telefono) idsModificados.push('telefono');
    if(identificacion !== datosActuales.identificacion) idsModificados.push('identificacion');
    if(ocupacion !== datosActuales.ocupacion) idsModificados.push('ocupacionV');
    if(fechaCaptacion !== datosActuales.captacion) idsModificados.push('fechaCaptacion');
    if(sede !== datosActuales.sede) idsModificados.push('sede');
    if(personaContacto !== datosActuales.personaContacto) idsModificados.push('personaContacto');
    if(internoAsignado !== datosActuales.voluntarioAsignado) idsModificados.push('internoAsignado');
    if(get('proyecto').classList.contains('seleccionado') && get('nombreProyecto').textContent) idsModificados.push('nombreProyecto');
    if(!(interesesActuales.length === 0 && datosActuales.intereses === null)) {
        if(!(interesesActuales == datosActuales.intereses) && !(arreglosIguales(interesesActuales, datosActuales.intereses.split(',')))) {
            idsModificados.push('listaIntereses');
        }
    }
    if(!(valoracionActual == datosActuales.valoracion)) idsModificados.push('valoracion');
    if(!(primerosContactosActuales == datosActuales.primerosContactos)) idsModificados.push('primerosContactos');
    if(!(derivacionActual == datosActuales.derivacion)) idsModificados.push('derivacion');
    if(observaciones !== datosActuales.observaciones) idsModificados.push('observaciones');

    const seccionBotones = get(idSeccionBotonesModal);
    if(idsModificados.length === 0) {
        get(idHModal).innerHTML = 'Sin cambios';
        get(idBModal).innerHTML = 'No se modificó ningún dato del voluntario';
        if(!get('volverTablero')) seccionBotones.innerHTML += `<button type='button' class='btn btn-primary' id='volverTablero'>Volver al tablero</button>`;
        get('volverTablero').style.display = 'block';
        get(idBotonModal).onclick = () => {modal.hide();};
        const btnSeguirEditando = get(idBotonModal);
        btnSeguirEditando.innerHTML = 'Editar datos';
        btnSeguirEditando.classList.add('btn-primary');
        btnSeguirEditando.classList.remove('btn-warning', 'btn-danger');
        get('myModal').addEventListener('hidden.bs.modal', function (event) {
            get('volverTablero').style.display = 'none';
            btnSeguirEditando.classList.remove('btn-primary');
        });
        get('volverTablero').onclick = () => {window.location.href = '/tablero';};
    } else {
        get(idBotonModal).innerHTML = 'Entendido';
        get(idBotonModal).classList.add('btn-success');
        get(idBotonModal).classList.remove('btn-danger');
        if(!nombres || !apPat || !apMat || !fechaNacimiento || !correo || !telefono || !identificacion || !fechaCaptacion || valoracionActual.length === 0 || primerosContactosActuales.length === 0 || derivacionActual.length === 0) {
            mostrarModal('Información incompleta', 'Los únicos campos que pueden quedar vacíos son:<br><br>Persona de contacto, intereses y observaciones', modal);
            return;
        }
        const añoActual = new Date().getFullYear();
        if(fechaNacimiento.length > 10 || fechaNacimiento.split('-')[0] > añoActual) {
            mostrarModal('Error en la fecha de nacimiento', 'Se debe ingresar una fecha de nacimiento válida.', modal);
            return;
        }
        if(fechaCaptacion.length > 10 || fechaCaptacion.split('-')[0] > añoActual) {
            mostrarModal('Error en la fecha de captación', 'Se debe ingresar una fecha de captación válida.', modal);
            return;
        }
        if(telefono.length !== 10) {
            mostrarModal('Error en el teléfono', 'Se debe ingresar un teléfono a 10 dígitos.', modal);
            return;
        }
        if(!correoValido) {
            mostrarModal('Correo inválido', 'Se debe ingresar un correo válido, por ejemplo: nombreCorreo@dominio.mx', modal);
            return;
        }
        if(get('proyecto').classList.contains('seleccionado') && get('nombreProyecto').value === '') {
            mostrarModal('Proyecto incompleto', 'Se debe colocar el nombre del proyecto, en caso contrario, se debe deseleccionar dicho campo.', modal);
            return;
        } else {
            const proyectoNuevo = get('nombreProyecto').value.trim().toLowerCase();
            const botonesDerivacion = get('derivacion').querySelectorAll('button');
            const nombresDerivacion = [];
            botonesDerivacion.forEach(boton => {
                nombresDerivacion.push(boton.textContent.toLowerCase());
            });
            if(proyectoNuevo === 'proyecto'.toLowerCase()) {
                mostrarModal('Nombre de proyecto inválido', 'Se debe escribir un nombre de proyecto válido.', modal);
                return;
            }
            if(nombresDerivacion.includes(proyectoNuevo)) {
                mostrarModal('Proyecto duplicado', 'El nombre del nuevo proyecto ya existe actualmente', modal);
                return;
            }
        }
        get(idHModal).innerHTML = '¿Deseas realizar los cambios?';
        get(idBModal).innerHTML = `A continuación se muestra el registro actualizado: <br><br>
        <ul id='datosModificados'>
            <li><p><span class="fw-bold">Nombre completo:</span> <span ${idsModificados.includes('nombres') ? `class='cambio'` : ''}>${nombres}</span></p></li>
            <li><p><span class="fw-bold">Apellido paterno:</span> <span ${idsModificados.includes('apPat') ?`class='cambio'` : ''}>${apPat}</span></p></li>
            <li><p><span class="fw-bold">Apellido materno:</span> <span ${idsModificados.includes('apMat') ? `class='cambio'` : ''}>${apMat}</span></p></li>
            <li><p><span class="fw-bold">Informe de valoración:</span> <span ${idsModificados.includes('tipoVoluntario') ? `class='cambio'` : ''}>${nombreTipoVoluntario}</span></p></li>
            <li><p><span class="fw-bold">Fecha de nacimiento:</span> <span ${idsModificados.includes('fechaNacimiento') ? `class='cambio'` : ''}>${tratarFecha(fechaNacimiento)}</span></p></li>
            <li><p><span class="fw-bold">Correo electrónico:</span> <span ${idsModificados.includes('correo') ? `class='cambio'` : ''}>${correo}</span></p></li>
            <li><p><span class="fw-bold">Teléfono:</span> <span ${idsModificados.includes('telefono') ? `class='cambio'` : ''}>${telefono}</span></p></li>
            <li><p><span class="fw-bold">Identificación:</span> <span ${idsModificados.includes('identificacion') ? `class='cambio'` : ''}>${identificacion}</span></p></li>
            <li><p><span class="fw-bold">Ocupación:</span> <span ${idsModificados.includes('ocupacionV') ? `class='cambio'` : ''}>${ocupacion}</span></p></li>
            <li><p><span class="fw-bold">Fecha captación:</span> <span ${idsModificados.includes('fechaCaptacion') ? `class='cambio'` : ''}>${tratarFecha(fechaCaptacion)}</span></p></li>
            <li><p><span class="fw-bold">Sede:</span> ${idsModificados.includes('sede') ? `<i class='bi bi-exclamation-triangle-fill' style='color: #FFA500;'></i> <span class='fw-bold'>¡Cuidado!</span> Se está realizando un cambio de sede. <i class='bi bi-exclamation-triangle-fill' style='color: #FFA500;'></i> <span class='cambio'>${sede}</span>` : `${sede}`}</p></li>
            <li><p><span class="fw-bold">Persona de contacto:</span> <span ${idsModificados.includes('personaContacto') ? `class='cambio'` : ''}>${personaContacto}</span></p></li>
            <li><p><span class="fw-bold">Voluntario interno asignado:</span> <span ${idsModificados.includes('internoAsignado') ? `class='cambio'` : ''}>${internoAsignado}</span></p></li>
            <li><p><span class="fw-bold">Intereses:</span> <span ${idsModificados.includes('listaIntereses') ? `class='cambio'` : ''}>${formateoArregloParaImpresion(interesesActuales)}</span></p></li>
            <li><p><span class="fw-bold">Valoración / Participación:</span> <span ${idsModificados.includes('valoracion') ? `class='cambio'` : ''}>${formateoArregloParaImpresion(valoracionActual)}</span></p></li>
            <li><p><span class="fw-bold">Primeros contactos:</span> <span ${idsModificados.includes('primerosContactos') ? `class='cambio'` : ''}>${formateoArregloParaImpresion(primerosContactosActuales)}</span></p></li>
            <li><p><span class="fw-bold">Derivación:</span> <span ${idsModificados.includes('derivacion') ? `class='cambio'` : ''}>${formateoArregloParaImpresion(derivacionActual)}</span></p></li>
            <li><p><span class="fw-bold">Observaciones:</span> <span ${idsModificados.includes('observaciones') ? `class='cambio'` : ''}>${observaciones}</span></p></li>
        </ul>
        `;
        document.querySelectorAll('span.cambio').forEach(span => {
            span.style.color = 'green';
        });
        const btnModal = get(idBotonModal);
        btnModal.classList.remove('btn-danger', 'btn-primary', 'btn-warning', 'btn-success');
        btnModal.innerHTML = 'Seguir editando';
        btnModal.classList.add('btn-secondary');
        if(!get('guardarCambios')) seccionBotones.innerHTML += `<button type='button' class='btn btn-success' id='guardarCambios'>Guardar cambios</button>`;
        get('guardarCambios').addEventListener('click', () => {
            fetch('/modificarDatosVoluntario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_voluntario: localStorage.getItem('id'),
                    id_internoAsignado: idsModificados.includes('internoAsignado') ? id_internoAsignado : null,
                    fechaCaptacion: idsModificados.includes('fechaCaptacion') ? fechaCaptacion : null,
                    nombres: idsModificados.includes('nombres') ? nombres : null,
                    apPat: idsModificados.includes('apPat') ? apPat : null,
                    apMat: idsModificados.includes('apMat') ? apMat : null,
                    identificacion: idsModificados.includes('identificacion') ? identificacion : null,
                    fechaNacimiento: idsModificados.includes('fechaNacimiento') ? fechaNacimiento : null,
                    telefono: idsModificados.includes('fechaNacimiento') ? telefono : null,
                    correo: idsModificados.includes('correo') ? correo : null,
                    ocupacion: idsModificados.includes('ocupacionV') ? ocupacion : null,
                    tipoVoluntario: idsModificados.includes('tipoVoluntario') ? tipoVoluntario : null,
                    observaciones: idsModificados.includes('observaciones') ? observaciones : null,
                    id_sede: idsModificados.includes('sede') ? id_sede : null,
                    personaContacto: idsModificados.includes('personaContacto') ? personaContacto : null,
                    intereses: idsModificados.includes('listaIntereses') ? interesesActuales : null,
                    valoracion: idsModificados.includes('valoracion') ? idsValoracionActual : null,
                    primerosContactos: idsModificados.includes('primerosContactos') ? idsContactosActuales : null,
                    derivacion: idsModificados.includes('derivacion') ? idsDerivacionActual : null,
                    proyectoNuevo: (get('proyecto').classList.contains('seleccionado') && get('nombreProyecto').value.trim() !== '') ? get('nombreProyecto').value.trim() : null 
                })
            })
            .then(response => {
                return response.json().then(data => {
                    return {
                        status: response.status,
                        mensaje: data.mensaje
                    };
                });
            })
            .then(data => {
                alert(data.mensaje);
                if(data.status === 200) window.location.href = '/tablero';
            })
            .catch(error => {
                console.error('Error al modificar los datos del voluntario: ' + error);
                alert('Error al modificar los datos del voluntario');
            });
        });
        get('guardarCambios').style.display = 'block';
        get('myModal').addEventListener('hidden.bs.modal', function (event) {
            get('guardarCambios').style.display = 'none';
            btnModal.classList.remove('btn-secondary');
        });
    }
}

function darDeBajaVoluntario() {
    const nombres = get('nombres').value.trim();
    const apPat = get('apPat').value.trim();
    const apMat = get('apMat').value.trim();
    const nombreCompleto = `${nombres} ${apPat} ${apMat}`;

    const btn = get(idBotonModal);
    btn.innerHTML = 'Confirmar baja';
    btn.classList.remove('btn-danger', 'btn-info', 'btn-success');
    btn.classList.add('btn-warning');
    mostrarModal('Dar de baja voluntario', `¿Realmente deseas dar de baja a "${nombreCompleto}"?<br><br>Esto significa, si se hicieron cambios en esta pantalla de sus datos, no se realizarán, solamente se cambiará su estado de "alta" a "registrado". <br><br><div class="form-group">
    <label for="pwd" class="fw-bold">Si confirmas esta acción, escribe la contraseña que utilizas para iniciar sesión:</label>
    <input type="password" class="form-control" id="contrBaja" placeholder='Ingresa tu contraseña' maxlength=30>
    </div>`, modal);
    btn.addEventListener('click', () => {
        const inputContrBaja = get('contrBaja');
        if(inputContrBaja.value === '') {
            alert('Se debe ingresar una contraseña');
            mostrarModal('Dar de baja voluntario', `¿Realmente deseas dar de baja a "${nombreCompleto}"?<br><br>Esto significa, si se hicieron cambios en esta pantalla de sus datos, no se realizarán, solamente se cambiará su estado de "alta" a "registrado". <br><br><div class="form-group">
                <label for="pwd" class="fw-bold">Si confirmas esta acción, escribe la contraseña que utilizas para iniciar sesión:</label>
                <input type="password" class="form-control" id="contrBaja" placeholder='Ingresa tu contraseña' maxlength=30>
                </div>`, modal);
        } else {
            const clave = get('contrBaja').value;
            fetch('/bajaVoluntario', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({ idVoluntario: localStorage.getItem('id'), clave: clave })
            })
            .then(response => {
                if (!response.ok && response.status !== 401) {
                    throw new Error('Hubo un problema con la solicitud: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                alert(data.mensaje);
                if(data.status !== 401 && data.status !== 500) window.location.href = '/tablero';
            })
            .catch(error => {
                console.error('Error al realizar la solicitud: ' + error);
                alert('Hubo un error al intentar dar de baja al voluntario');
            });
        }
    });
}