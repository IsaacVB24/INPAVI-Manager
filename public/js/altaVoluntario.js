const colorFondoBotonSeleccionado = 'rgb(123, 168, 133)';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('alertas').insertAdjacentHTML('beforeend', ventanaModal);
    const selectOcupaciones = get('ocupacionV');
    const ulIntereses = get('listaIntereses');
    const selectVoluntarios = get('voluntarioAsignado');
    const divValoracion = get('valoracion');
    const divPrimerosContactos = get('primerosContactos');
    const divInformeValoracion = get('informeValoracion');
    const divDerivacion = get('derivacion');
    const botonesValoracion = divValoracion.querySelectorAll('button');
    const botonesPrimerosContactos = divPrimerosContactos.querySelectorAll('button');
    const botonesInformeValoracion = divInformeValoracion.querySelectorAll('button');
    const botonesDerivacion = divDerivacion.querySelectorAll('button');

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

    botonesValoracion.forEach(boton => {
        boton.addEventListener('click', () => {botonSeleccionado(boton);});
    });
    botonesPrimerosContactos.forEach(boton => {
        boton.addEventListener('click', () => {botonSeleccionado(boton);});
    });
    botonesInformeValoracion.forEach(boton => {
        boton.addEventListener('click', () => {botonSeleccionado(boton);});
    });
    botonesDerivacion.forEach(boton => {
        boton.addEventListener('click', () => {botonSeleccionado(boton);});
    });

    // URL de las solicitudes
    const urls = [
        '/obtenerOcupaciones',
        '/obtenerIntereses',
        '/obtenerNombreVoluntarios'
    ];

    // Realizar las solicitudes con Promise.all
    Promise.all(urls.map(url => fetch(url).then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(`Error al obtener datos desde ${url}`);
      })))
      .then(([ocupaciones, intereses, voluntarios]) => {
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
          nuevaOpcion.textContent = voluntario.nombre_v;
          selectVoluntarios.appendChild(nuevaOpcion);
        });
      })
      .catch(error => {
        console.error('Error al cargar los datos:', error);
      });
});

let ocupacion = '';

function agregarOcupacion() {
    idInnerHTML(idHModal, 'Añadir ocupación');
    idInnerHTML(idBModal, '<input type="text" class="shadow form-control" id="ocupacionNva" placeholder="Ingrese la nueva ocupación" name="ocupacionNva" required autocomplete="off" maxlength="20">');
    idInnerHTML(idBotonModal, 'Agregar');
    const btnModal = document.getElementById('btnModal');
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
    const inputOcupacionNva = document.getElementById('ocupacionNva');
    inputOcupacionNva.focus();
    enterEnInput(inputOcupacionNva, idBotonModal);

    // Agregar evento hide.bs.modal al modal para evitar su cierre si el input está vacío
    document.getElementById('myModal').addEventListener('hide.bs.modal', function() {
        // Obtener el valor del input
        const ocupacionNva = inputOcupacionNva.value;

        // Verificar si el input está vacío
        if (ocupacionNva.trim() !== '') {
            divOcupacion.innerHTML = '<input type="text" class="shadow form-control" id="ocupacionV" placeholder="Ocupación añadida" name="ocupacionV" required autocomplete="off" maxlength="70" readonly style="user-select:no; cursor:default;"><label for="ocupacionV" class="ms-2">Ocupación:</label><div class="mt-1"><a href="" data-bs-toggle="modal" data-bs-target="#myModal" style="color:#df950d;" id="modificarOcupacion">Modificar ocupación</a><a href="" onclick="eliminarOcupacion()" style="color:red; float:right;">Eliminar ocupación</a></div>';
            document.getElementById('ocupacionV').setAttribute('value', ocupacionNva);
            ocupacion = get('ocupacionV').value;
        }
    });
}

function agregarInteres(){
    idInnerHTML(idHModal, 'Añadir interés de voluntario');
    idInnerHTML(idBModal, '<input type="text" class="shadow form-control" id="interesNvo" placeholder="Ingrese el nuevo interés" name="interesNvo" required autocomplete="off" maxlength="40">');
    idInnerHTML(idBotonModal, 'Agregar');
    const inputInteresNvo = document.getElementById('interesNvo');
    inputInteresNvo.focus();
    enterEnInput(inputInteresNvo, idBotonModal);
    const labels = document.querySelectorAll('#listaIntereses label');
    //const labelContents = Array.from(labels).map(label => label.textContent);
    //console.log(labelContents);
    const divNvosIntereses = document.getElementById('nvosIntereses');
    const contenidoDivNvosIntereses = divNvosIntereses.innerHTML;

    // Agregar evento hide.bs.modal al modal para evitar su cierre si el input está vacío
    document.getElementById('myModal').addEventListener('hide.bs.modal', function() {
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
    const btnModal = document.getElementById('btnModal');
    const altaHoy = get('alta').checked;
    btnModal.classList.remove(...btnModal.classList);
    btnModal.classList.add('btn');
    btnModal.classList.add('btn-danger');
    btnModal.innerHTML = 'Entendido';
    //btnModal.classList.add('btn-success');
    const modal = new bootstrap.Modal(document.getElementById('myModal'));
    const divValoracion = get('valoracion');
    let botonesSeleccionadosValoracion = 0;
    divValoracion.querySelectorAll('button').forEach(boton => {
        if(boton.classList.contains('seleccionado')) botonesSeleccionadosValoracion += 1;
    });
    const divDerivacion = get('derivacion');
    let botonesSeleccionadosDerivacion = 0;
    divDerivacion.querySelectorAll('button').forEach(boton => {
        if(boton.classList.contains('seleccionado')) botonesSeleccionadosDerivacion += 1;
    });
    
    const nombres = valorDe('nombresV');
    const apellidoP = valorDe('apPatV');
    const apellidoM = valorDe('apMatV');
    const fechaNacimiento = valorDe('fechaNacimientoV');
    const identificacion = valorDe('identificacion');
    const telefono = valorDe('telefonoV');
    const correo = valorDe('correoV');
    const ocupacionV = ocupacion;
    const personaContacto = valorDe('presonaContactoV');
    const correoValido = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(correo);
    
    if(!nombres || !apellidoP || !apellidoM || !fechaNacimiento || !identificacion || !telefono || !correo || !ocupacionV || !personaContacto || botonesSeleccionadosValoracion === 0) {
        mostrarModal('Campos incompletos', 'Se deben completar todos los campos marcados con <span>*</span>.', modal);
        return;
    }
    if(altaHoy && botonesSeleccionadosDerivacion === 0) {
        mostrarModal('Completar derivación del voluntario', 'Si hoy se va a dar de alta el voluntario, se debe asignarle una derivación.', modal);
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
    if(altaHoy && get('proyecto').classList.contains('seleccionado') && !valorDe('nombreProyecto')) {
        mostrarModal('Completar proyecto', 'Se debe ingresar el nombre del proyecto.', modal);
    }
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
    if(boton.id === 'proyecto') get('nombreProyecto').style.display = 'block';
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