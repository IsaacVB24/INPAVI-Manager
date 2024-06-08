document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('textarea').forEach(textarea => {textarea.style.resize = 'none';});
    const id_voluntario = localStorage.getItem('id');
    get('alertas').innerHTML = ventanaModal;
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
                    '/obtenerNombreVoluntarios',
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
                .then(([ocupaciones, intereses, voluntarios, programas, primerosContactos, sedes]) => {
                    const voluntario = data.row;
                    const nombres = get('nombres');
                    const apPat = get('apPat');
                    const apMat = get('apMat');
                    const tipoVoluntario = get('tipoVoluntario');
                    const fechaNacimiento = get('fechaNacimiento');
                    const correo = get('correo');
                    const telefono = get('telefono');
                    const identificacion = get('identificacion');
                    const selectOcupacion = get('ocupacion');
                    const fechaCaptacion = get('fechaCaptacion');
                    const selectSede = get('sede');
                    const personaContacto = get('personaContacto');
                    const selectInternoAsignado = get('internoAsignado');
                    const divIntereses = get('divIntereses');
                    const ulIntereses = get('listaIntereses');
                    const divValoracion = get('valoracion');
                    const divPrimerosContactos = get('primerosContactos');
                    const divInformeValoracion = get('informeValoracion');
                    divInformeValoracion.querySelectorAll('button').forEach(boton => {
                        boton.addEventListener('click', () => {
                            botonSeleccionado(boton);
                        });
                        if(voluntario.informe_valoracion === parseInt(boton.id)) boton.click();
                    });
                    const divDerivacion = get('derivacion');
                    const observaciones = get('observaciones');
                    const soloNombres = [nombres, apPat, apMat, personaContacto];
                    soloNombres.forEach(campo => {
                        permitirSoloNombres(campo);
                    });
                    permitirSoloNumeros(telefono);
                    nombres.value = voluntario.nombre_v;
                    apPat.value = voluntario.apellido_paterno_v;
                    apMat.value = voluntario.apellido_materno_v;
                    tipoVoluntario.selectedIndex = voluntario.informe_valoracion === 0 ? 1 : 2;
                    const nacimiento = new Date(voluntario.fecha_nacimiento);
                    fechaNacimiento.value = nacimiento.toISOString().slice(0, 10);
                    correo.value = voluntario.correo_v;
                    telefono.value = voluntario.telefono_v;
                    identificacion.value = voluntario.identificacion;
                    ocupaciones.forEach(ocupacion => {
                        const option = crear('option');
                        option.value = ocupacion.id_ocupacion;
                        option.innerHTML = ocupacion.ocupacion;
                        option.id = 'ocupacion_' + ocupacion.id_ocupacion;
                        selectOcupacion.appendChild(option);
                    });
                    if(voluntario.id_ocupacion) ocupaciones.selectedIndex = voluntario.id_ocupacion;
                    const captacion = new Date(voluntario.fecha_captacion);
                    fechaCaptacion.value = captacion.toISOString().slice(0, 10);
                    sedes.forEach(sede => {
                        const option = crear('option');
                        option.value = sede.id_sede;
                        option.innerHTML = sede.sede;
                        option.id = 'sede_' + sede.id_sede;
                        selectSede.appendChild(option);
                    });
                    selectSede.selectedIndex = voluntario.id_sede - 1;
                    personaContacto.value = voluntario.personaContacto || '-';
                    voluntarios.forEach((voluntario, indice) => {
                        const option = crear('option');
                        option.value = indice + 1;
                        option.innerHTML = voluntario;
                        option.id = `voluntario_${indice + 1}`;
                        if(voluntario !== `${nombres.value} ${apPat.value} ${apMat.value}`) selectInternoAsignado.appendChild(option);
                    });
                    selectInternoAsignado.selectedIndex = voluntario.id_voluntarioAsignado;
                    observaciones.value = voluntario.observaciones || '-';

                    let interesesVoluntario;
                    if(voluntario.intereses) interesesVoluntario = voluntario.intereses.split(',');
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
                    const contactosVoluntario = voluntario.primerosContactos.split(',')
                    const botonesPrimerosContactos = divPrimerosContactos.querySelectorAll('button');
                    botonesPrimerosContactos.forEach(boton => {
                        boton.addEventListener('click', () => {botonSeleccionado(boton);});
                        if(contactosVoluntario.includes(boton.textContent)) boton.click();
                    });
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