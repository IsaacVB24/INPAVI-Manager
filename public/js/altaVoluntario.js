const colorFondoBotonSeleccionado = 'rgb(123, 168, 133)';

document.addEventListener('DOMContentLoaded', () => {
    get('alertas').insertAdjacentHTML('beforeend', ventanaModal);
    const selectOcupaciones = get('ocupacionV');
    const ulIntereses = get('listaIntereses');
    const selectVoluntarios = get('voluntarioAsignado');
    const divValoracion = get('valoracion');
    const divPrimerosContactos = get('primerosContactos');
    const divInformeValoracion = get('informeValoracion');
    const divDerivacion = get('derivacion');
    const botonesInformeValoracion = divInformeValoracion.querySelectorAll('button');
    const soloCaracteres = [get('nombresV'), get('apPatV'), get('apMatV'), get('personaContactoV')];
    soloCaracteres.forEach(campo => {
        permitirSoloNombres(campo);
    });

    const inputTelefono = get('telefonoV');
    // Agregar un event listener para el evento input
    inputTelefono.addEventListener('input', function(event) {
        // Obtener el valor actual del campo de fecha de nacimiento
        let valor = inputTelefono.value;
        
        // Reemplazar cualquier carácter que no sea un número con una cadena vacía
        valor = valor.replace(/\D/g, '');

        // Actualizar el valor del campo de fecha de nacimiento con solo números
        inputTelefono.value = valor;
    });

    botonesInformeValoracion.forEach(boton => {
        boton.addEventListener('click', () => {botonSeleccionado(boton);});
    });

    // URL de las solicitudes
    const urls = [
        '/obtenerOcupaciones',
        '/obtenerIntereses',
        '/obtenerNombreVoluntarios',
        '/obtenerProgramas',
        '/obtenerPrimerosContactos'
    ];

    // Realizar las solicitudes con Promise.all
    Promise.all(urls.map(url => fetch(url).then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(`Error al obtener datos desde ${url}`);
      })))
      .then(([ocupaciones, intereses, voluntarios, programas, primerosContactos]) => {
        // Procesar ocupaciones
        ocupaciones.forEach((ocupacion, indice) => {
          const nuevaOpcion = crear('option');
          nuevaOpcion.id = 'ocupacion_' + (indice + 1);
          nuevaOpcion.value = indice + 1;
          nuevaOpcion.textContent = ocupacion.ocupacion;
          selectOcupaciones.appendChild(nuevaOpcion);
          selectOcupaciones.addEventListener('change', () => {
            const opcionSeleccionada = selectOcupaciones.options[selectOcupaciones.selectedIndex].text;
            asignarOupacion(opcionSeleccionada);
          });
        });

        // Procesar intereses
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
          nvoLabel.innerText = interes;

          const nvoLi = crear('li');
          nvoLi.id = 'interes_' + (indice + 1);
          nvoLi.appendChild(nvoInput);
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
        nvoA.onclick = () => { agregarInteres(); };
        nvoA.setAttribute('data-bs-toggle', 'modal');
        nvoA.setAttribute('data-bs-target', '#myModal');
        nvoA.innerText = 'Añadir nuevo interés';
        otroDiv.appendChild(nvoA);
        otroLi.appendChild(otroDiv);
        ulIntereses.appendChild(otroLi);
        
        // Procesar voluntarios
        voluntarios.forEach((voluntario, indice) => {
          const nuevaOpcion = crear('option');
          nuevaOpcion.id = 'voluntario_' + (indice + 1);
          nuevaOpcion.value = indice + 1;
          nuevaOpcion.textContent = voluntario;
          selectVoluntarios.appendChild(nuevaOpcion);
        });

        // Procesar programas
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
        divDerivacion.innerHTML += seccionProyecto;
        const botonesValoracion = divValoracion.querySelectorAll('button');
        botonesValoracion.forEach(boton => {
            boton.addEventListener('click', () => {botonSeleccionado(boton);});
        });
        const botonesDerivacion = divDerivacion.querySelectorAll('button');
        botonesDerivacion.forEach(boton => {
            boton.addEventListener('click', () => {botonSeleccionado(boton);});
        });

        // Procesar primeros contactos
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
        const botonesPrimerosContactos = divPrimerosContactos.querySelectorAll('button');
        botonesPrimerosContactos.forEach(boton => {
            boton.addEventListener('click', () => {botonSeleccionado(boton);});
        });
      })
      .catch(error => {
        console.error('Error al cargar los datos:', error);
      });
});

let ocupacion = '';

function agregarOcupacion() {
    idInnerHTML(idHModal, 'Añadir ocupación');
    idInnerHTML(idBModal, '<input type="text" class="shadow form-control" id="ocupacionNva" placeholder="Ingrese la nueva ocupación" name="ocupacionNva" required autocomplete="off" maxlength="100">');
    idInnerHTML(idBotonModal, 'Agregar');
    const btnModal = get('btnModal');
    btnModal.classList.remove(...btnModal.classList);
    btnModal.classList.add('btn');
    btnModal.classList.add('btn-warning');
    const divOcupacion = get('divOcupacion');
    const contOcupaciones= divOcupacion.innerHTML;
    const selectOcupaciones = get('ocupacionV');
    const opciones = selectOcupaciones.querySelectorAll('option:not([disabled])');
    const ocupacionesActuales = [];
    opciones.forEach(opcion => {ocupacionesActuales.push(opcion.textContent.trim().toLowerCase());});
    get(idBotonModal).addEventListener('click', () => {
        if(elementoExiste(ocupacionesActuales, valorDe('ocupacionNva'))) {
            alert('Esa ocupación ya existe');
            divOcupacion.innerHTML = contOcupaciones;
            get('ocupacionNva').value = '';
        };
    });
    const inputOcupacionNva = get('ocupacionNva');
    permitirSoloLetras(inputOcupacionNva);
    inputOcupacionNva.focus();
    enterEnInput(inputOcupacionNva, idBotonModal);

    // Agregar evento hide.bs.modal al modal para evitar su cierre si el input está vacío
    btnModal.addEventListener('click', function() {
        // Obtener el valor del input
        const ocupacionNva = inputOcupacionNva.value;

        // Verificar si el input está vacío
        if (ocupacionNva.trim() !== '') {
            divOcupacion.innerHTML = '<input type="text" class="shadow form-control" id="ocupacionV" placeholder="Ocupación añadida" name="ocupacionV" required autocomplete="off" maxlength="70" readonly style="user-select:no; cursor:default;"><label for="ocupacionV" class="ms-2">Ocupación:</label><div class="mt-1"><a href="" data-bs-toggle="modal" data-bs-target="#myModal" style="color:#df950d;" id="modificarOcupacion">Modificar ocupación</a><a href="" onclick="eliminarOcupacion()" style="color:red; float:right;">Eliminar ocupación</a></div>';
            get('ocupacionV').setAttribute('value', ocupacionNva);
            ocupacion = get('ocupacionV').value;
        }
    });
}

function agregarInteres(){
    idInnerHTML(idHModal, 'Añadir interés de voluntario');
    idInnerHTML(idBModal, '<input type="text" class="shadow form-control" id="interesNvo" placeholder="Ingrese el nuevo interés" name="interesNvo" required autocomplete="off" maxlength="40">');
    idInnerHTML(idBotonModal, 'Agregar');
    const inputInteresNvo = get('interesNvo');
    permitirSoloLetras(inputInteresNvo);
    inputInteresNvo.focus();
    enterEnInput(inputInteresNvo, idBotonModal);
    const labels = document.querySelectorAll('#listaIntereses label');
    //const labelContents = Array.from(labels).map(label => label.textContent);
    //console.log(labelContents);
    const divNvosIntereses = get('nvosIntereses');
    const contenidoDivNvosIntereses = divNvosIntereses.innerHTML;

    // Agregar evento hide.bs.modal al modal para evitar su cierre si el input está vacío
    get('myModal').addEventListener('hide.bs.modal', function() {
        // Obtener el valor del input
        const interesNvo = inputInteresNvo.value.trim();

        // Verificar si el input está vacío
        if (interesNvo.trim() !== '' && !elementoExisteEnLista(interesNvo, '#listaIntereses label')) {
            divNvosIntereses.innerHTML = '';
            divNvosIntereses.innerHTML = contenidoDivNvosIntereses + '<li><input class="form-check-input" type="checkbox" id="chk' + interesNvo + '" value="desempleado" checked><label for="chk' + interesNvo + '">&nbsp' + interesNvo + '</label></li>';
        }
    });
}

function altaVoluntario(){
    const btnModal = get('btnModal');
    const altaHoy = get('alta').checked;
    btnModal.classList.remove(...btnModal.classList);
    btnModal.classList.add('btn');
    btnModal.classList.add('btn-danger');
    btnModal.innerHTML = 'Entendido';
    //btnModal.classList.add('btn-success');
    const modal = new bootstrap.Modal(get('myModal'));
    const divValoracion = get('valoracion');
    let botonesSeleccionadosValoracion = 0;
    const valoracion = [];
    const nombresValoracion = [];
    divValoracion.querySelectorAll('button').forEach(boton => {
        if(boton.classList.contains('seleccionado')) {
            botonesSeleccionadosValoracion += 1;
            valoracion.push(parseInt(boton.id));
            nombresValoracion.push(boton.innerHTML);
        };
    });
    const divDerivacion = get('derivacion');
    let botonesSeleccionadosDerivacion = 0;
    const derivacion = [];
    const nombresDerivacion = [];
    const botonesDerivacion = divDerivacion.querySelectorAll('button.seleccionado');
    botonesDerivacion.forEach(boton => {
        let datoPrograma = [];
        botonesSeleccionadosDerivacion += 1;
        if(boton.id === 'proyecto') {
            const proyecto = get('nombreProyecto');
            datoPrograma.push(parseInt(proyecto.name));
            datoPrograma.push(proyecto.value.trim());
            nombresDerivacion.push(proyecto.value.trim());
        } else {
            datoPrograma.push(parseInt(boton.id));
            datoPrograma.push(boton.textContent);
            nombresDerivacion.push(boton.textContent);
        }
        derivacion.push(datoPrograma);
    });
    
    const nombres = valorDe('nombresV').trim();
    const apellidoP = valorDe('apPatV').trim();
    const apellidoM = valorDe('apMatV').trim();
    const fechaNacimiento = valorDe('fechaNacimientoV');
    const identificacion = valorDe('identificacion').trim();
    const telefono = valorDe('telefonoV');
    const correo = valorDe('correoV').trim();
    const ocupacionV = ocupacion.trim();
    const personaContacto = valorDe('personaContactoV');
    const correoValido = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(correo);
    const selectVoluntarioAsignado = get('voluntarioAsignado');
    const voluntarioAsignado = selectVoluntarioAsignado.value;
    const intereses = [];
    const ulIntereses = get('listaIntereses');
    const checkboxesIntereses = ulIntereses.querySelectorAll('input[type="checkbox"]');
    checkboxesIntereses.forEach(checkbox => {
        if(checkbox.checked) {
            const label = ulIntereses.querySelector(`label[for="${checkbox.id}"`);
            intereses.push(label.textContent.trim());
        }
    });
    const primerosContactos = [];
    const nombresContactos = [];
    const divPrimerosContactos = get('primerosContactos');
    divPrimerosContactos.querySelectorAll('button').forEach(boton => {
        if(boton.classList.contains('seleccionado')){
            primerosContactos.push(parseInt(boton.id));
            nombresContactos.push(boton.innerHTML);
        }
    });
    const divInformeValoracion = get('informeValoracion');
    const cantidadInformeValoracion = divInformeValoracion.querySelectorAll('button.seleccionado');
    const nombresInformeValoracion = [];
    cantidadInformeValoracion.forEach(boton => {
        nombresInformeValoracion.push(boton.innerHTML);
    });
    const observaciones = valorDe('comment').trim();
    
    if(!nombres || !apellidoP || !apellidoM || !fechaNacimiento || !identificacion || !telefono || !correo || !ocupacionV || botonesSeleccionadosValoracion === 0) {
        mostrarModal('Campos incompletos', 'Se deben completar todos los campos marcados con <span>*</span>.', modal);
        return;
    }
    if((altaHoy && botonesSeleccionadosDerivacion === 0) || (altaHoy && primerosContactos.length === 0) || (altaHoy && cantidadInformeValoracion.length === 0)) {
        mostrarModal('Completar derivación del voluntario', 'Si hoy se va a dar de alta el voluntario, se debe asignarle una derivación, completar los primeros contactos y la valoración.', modal);
        return;
    }
    if(fechaNacimiento.length > 10) {
        mostrarModal('Error en la fecha de nacimiento', 'Se debe ingresar una fecha de nacimiento válida.', modal);
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
    if(cantidadInformeValoracion.length > 1) {
        mostrarModal('Error en el informe de valoración', 'Solo se debe seleccionar una opción en el informe de valoración.', modal);
        return;
    }
    var informeValoracion;
    if(cantidadInformeValoracion.length === 1) {
        informeValoracion = parseInt(cantidadInformeValoracion[0].id);
    } else {
        informeValoracion = 3;
    }
    if(altaHoy && get('proyecto').classList.contains('seleccionado') && !valorDe('nombreProyecto')) {
        mostrarModal('Completar proyecto', 'Se debe ingresar el nombre del proyecto.', modal);
        return;
    } else if(altaHoy) {
        const botonesProyectos = divDerivacion.querySelectorAll('button');
        let duplicado = false;
        botonesProyectos.forEach(boton => {
            if(boton.textContent === valorDe('nombreProyecto').trim()) {
                duplicado = true;
            }
        });
        if(duplicado && get('proyecto').classList.contains('seleccionado')) {
            mostrarModal('Nombre de proyecto incorrecto', 'El proyecto que se trata de registrar ya existe', modal);
            return;
        }
    }
    
    const [año, mes, dia] = fechaNacimiento.split('-');
    var fechaActual = new Date();
    var añoActual = fechaActual.getFullYear();
    if(año >= añoActual || (añoActual - año) > 100) {
        mostrarModal('Error en la fecha de nacimiento', 'Se debe ingresar una fecha de nacimiento válida para el voluntario.', modal);
        return;
    }
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'otubre', 'noviembre', 'diciembre'];
    const nombreMes = meses[parseInt(mes, 10) - 1];
    const interesesConf = formateoArregloParaImpresion(intereses);
    const valoracionConf = formateoArregloParaImpresion(nombresValoracion);
    const contactosConf = formateoArregloParaImpresion(nombresContactos);
    const informeValConf = formateoArregloParaImpresion(nombresInformeValoracion);
    const derivacionConf = formateoArregloParaImpresion(nombresDerivacion);
    
    mostrarModal('Confirmación', `¿Realmente deseas registrar al siguiente voluntario? <br><br>
    <ul id="datosConfirmacion">
        <li><p><span class="fw-bold">Nombre completo:</span> ${nombres} ${apellidoP} ${apellidoM}</p></li>
        <li><p><span class="fw-bold">Fecha de nacimiento:</span> ${dia} de ${nombreMes} de ${año}</p></li>
        <li><p><span class="fw-bold">Identificación:</span> ${identificacion}</p></li>
        <li><p><span class="fw-bold">Teléfono:</span> ${telefono}</p></li>
        <li><p><span class="fw-bold">Correo electrónico:</span> ${correo}</p></li>
        <li><p><span class="fw-bold">Ocupación:</span> ${ocupacionV}</p></li>
        <li><p><span class="fw-bold">Persona de contacto:</span> ${personaContacto || '-'}</p></li>
        <li><p><span class="fw-bold">Voluntario interno asignado:</span> ${selectVoluntarioAsignado.options[selectVoluntarioAsignado.selectedIndex].text}</p></li>
        <li><p><span class="fw-bold">Intereses:</span> ${interesesConf}</p></li>
        <li><p><span class="fw-bold">Valoración / Participación:</span> ${valoracionConf}</p></li>
        <li><p><span class="fw-bold">Primeros contactos:</span> ${contactosConf}</p></li>
        <li><p><span class="fw-bold">Informe de valoración:</span> ${informeValConf}</p></li>
        <li><p><span class="fw-bold">Derivación:</span> ${derivacionConf}</p></li>
        <li><p><span class="fw-bold">Observaciones:</span> ${observaciones || '-'}</p></li>
    </ul>`, modal);
    btnModal.classList.add('btn-success');
    btnModal.classList.remove('btn-danger');
    get('cerrarModal').onclick = () => {get('myModal').style.display = 'none'; alert("OK");};
    btnModal.onclick = () => {
        fetch('/voluntarioNuevo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre: nombres, apellidoP: apellidoP, apellidoM: apellidoM, fechaNacimiento: fechaNacimiento, identificacion: identificacion, telefono: telefono, correo: correo, ocupacion: ocupacionV, personaContacto: personaContacto, voluntarioIntAsignado: voluntarioAsignado, intereses: intereses, valoracion: valoracion, primerosContactos: primerosContactos, informeValoracion: informeValoracion, derivacion: derivacion, observaciones: observaciones })
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
            if (data.status === 201) {
                btnModal.classList.remove('btn-danger');
                btnModal.classList.add('btn-success');
                btnModal.innerHTML = 'Genial';
                btnModal.onclick = () => {window.location.href = '/tablero'};
                mostrarModal('Voluntario registrado', 'El voluntario ha sido registrado exitosamente', modal);
            } else if(data.status === 409) {
                btnModal.classList.add('btn-danger');
                btnModal.classList.remove('btn-success');
                mostrarModal('Conflicto', data.mensaje, modal);
                btnModal.onclick = () => {};
            } else if(data.status === 500) {
                mostrarModal('Error del servidor', data.mensaje, modal);
            } else {
                mostrarModal('Error', 'Error desconocido al registrar al voluntario.', modal);
            }
        })
        .catch(error => {
            console.error('Error al intentar registrar al voluntario:', error);
            alert('Error al validar intentar registrar al voluntario');
        });
    };
}

function elementoExiste(arreglo, elemento) {
    const elementoMinusculas = elemento.toLowerCase();
    const existe = arreglo.some(item => item === elementoMinusculas.trim());
    return existe;
}

function botonSeleccionado(boton) {
    // Marcar el botón como seleccionado
    boton.classList.add('seleccionado');

    // Cambiar el estilo del botón seleccionado
    boton.style.backgroundColor = colorFondoBotonSeleccionado;
    boton.style.color = '#333232';
    boton.style.transition = 'background-color 0.3s ease, color 0.3s ease';

    boton.addEventListener('click', () => {botonDeseleccionado(boton);});

    if(boton.classList.contains('deseleccionado')) {
        boton.classList.remove('deseleccionado');
    }
    if(boton.id === 'proyecto') {
        get('nombreProyecto').style.display = 'block';
        bloquearCaracteresEspeciales(get('nombreProyecto'));
    }
}

function botonDeseleccionado(boton) {
    // Remover la marca de selección del botón
    boton.classList.remove('seleccionado');
    boton.classList.add('deseleccionado');

    // Restaurar el estilo del botón deseleccionado
    boton.style.backgroundColor = 'white';
    boton.style.color = 'black';
    boton.style.transition = 'background-color 0.3s ease, color 0.3s ease';

    boton.addEventListener('click', () => {botonSeleccionado(boton);});
    if(boton.id === 'proyecto') get('nombreProyecto').style.display = 'none';
}

function altaHoy() {
    get('derivacion').style.display = (get('alta').checked ? 'block' : 'none');
}

function asignarOupacion(nombreOcupacion) {
    ocupacion = nombreOcupacion;
}

function formateoArregloParaImpresion(arreglo) {
    if(arreglo.length === 0) {
        return '-';
    } else {
        let total = '';
        arreglo.forEach((elemento, indice) => {
            if((indice + 1) !== arreglo.length) {
                total += (elemento + ', ');
            } else {
                total += elemento;
            }
        });
        return total;
    }
}

function permitirSoloNombres(campo) {
    campo.addEventListener('input', function() {
        let texto = campo.value;
        texto = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        // Convertir a minúsculas
        texto = texto.toLowerCase();

        // Capitalizar la primera letra de cada palabra
        texto = texto.replace(/\b\w/g, function(letra) {
            return letra.toUpperCase();
        });
        
        // Mantener todo el texto en minúsculas excepto las primeras letras
        texto = texto.split(' ').map(palabra => {
            return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
        }).join(' ');

        // Actualizar el valor del input
        this.value = texto;
    });
}

function permitirSoloLetras(campo) {
    campo.addEventListener('input', function() {
        let texto = campo.value;
        texto = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        
        // Convertir a minúsculas excepto la primera letra de la oración
        texto = texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

        // Actualizar el valor del input
        this.value = texto;
    });
}

function bloquearCaracteresEspeciales(campo) {
    campo.addEventListener('input', function() {
        let texto = campo.value;
        // Bloquear caracteres especiales (algunos)
        texto = texto.replace(/[@#$%^&*()_+\-=\[\]{};':"\\|<>\/~`]/g, '');

        // Actualizar el valor del input
        this.value = texto;
    });
}