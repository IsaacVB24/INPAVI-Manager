const nombreForm = "formCrearCuenta";
const formConDatos = 'datosTrasValidacion';

const idSelectRol = 'rol';
const idSelectSede = 'sede';

const correoYaRegistrado = '<div class="alert alert-danger alert-dismissible fade show"><button type="button" class="btn-close" data-bs-dismiss="alert"></button><strong>¡Correo registrado!</strong> Este correo no puede usarse ya que ya hay una cuenta asociada. Por favor <a href="/">inicie sesión</a>.</div>';
const tokenEnviado = '<div class="alert alert-success alert-dismissible fade show"><button type="button" class="btn-close" data-bs-dismiss="alert"></button><strong>¡Token enviado!</strong> Revisa tu bandeja de entrada y proporciona el código que te fue enviado.</div>';

function validarNuevaCuenta(){
    const roles = document.getElementById(idSelectRol);
    const sedes = document.getElementById(idSelectSede);
    const formulario = document.getElementById('formCrearCuenta');
    const datosIngresados = Array.from(formulario.querySelectorAll('input, select'));

    // Insertar HTML de la ventana modal dentro del formulario
    document.getElementById('nvaCuenta').insertAdjacentHTML('beforeend', ventanaModal);
    const modal = new bootstrap.Modal(document.getElementById('myModal'));
    document.getElementById(idBotonModal).innerHTML = 'Entendido';

    if(roles.selectedIndex === 0){
        document.getElementById(idHModal).innerHTML = "Error en el rol";
        document.getElementById(idBModal).innerHTML = "Se debe de seleccionar un rol.";
        modal.show();
    } else if(sedes.selectedIndex === 0){
        document.getElementById(idHModal).innerHTML = 'Error en la sede';
        document.getElementById(idBModal).innerHTML = 'Se debe de seleccionar una sede.';
        modal.show();
    } else {
        const correo = document.getElementById('email').value;
        // Validar si el correo no existe actualmente
        fetch('/altaUsuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ correo: correo })
        })
        .then(response => {
            if (response.status === 200) {
                alert('El correo ya existe, intente con otro o verifique con administración');
            } else if (response.status !== 404) {
                alert('Error al consultar correo');
            } else {
                document.getElementById(nombreForm).style.display = 'none';
                document.getElementById('yaTienesCuenta').style.display = 'none';
                document.getElementById(formConDatos).style.display = 'block';

                const formularioConDatos = document.getElementById(formConDatos);
                const inputsConDatos = Array.from(formularioConDatos.querySelectorAll('input'));
                inputsConDatos.pop();
                inputsConDatos.forEach((input, indice) => {
                    input.readOnly = true;
                    // Verificar si es un input o un select
                    if (datosIngresados[indice].tagName === 'INPUT') {
                        input.value = datosIngresados[indice].value;
                    } else if (datosIngresados[indice].tagName === 'SELECT') {
                        input.value = datosIngresados[indice].options[datosIngresados[indice].selectedIndex].text;
                    }
                });
                
                inputsConDatos[6].value = roles.options[roles.selectedIndex].text;
                inputsConDatos[7].value = sedes.options[sedes.selectedIndex].text;

                document.getElementById('alertas').innerHTML = tokenEnviado + correoYaRegistrado;
            }
        })
        .catch(error => {
            console.error('Error al validar correo:', error);
            alert('Error al validar correo');
        });
    }
}

function pruebaDatos(){
    const formulario = document.getElementById('nvaCuenta');
    const inputs = formulario.querySelectorAll('input');
    
    inputs[0].value = 'Usuario';
    inputs[1].value = 'Apellido paterno de prueba';
    inputs[2].value = 'Apellido materno de prueba';
    inputs[3].value = '5500000000';
    inputs[4].value = 'correo@prueba.com';
    inputs[5].value = '12345678';
    inputs[6].value = '12345678';

    const roles = document.getElementById(idSelectRol);
    roles.selectedIndex = 1;
    const sedes = document.getElementById(idSelectSede);
    sedes.selectedIndex = 1;
}

function validarToken(){
    document.getElementById('token').value === '' ? alert('Se debe de ingresar un código.') : window.location = 'verificacion';
}

function cargarSedesYRoles() {
    const selectSede = document.getElementById(idSelectSede);
    const selectRoles = document.getElementById(idSelectRol);
    console.clear();

    // Obtener sedes del backend
    fetch('/obtenerSedes')
        .then(response => {
            if (response.ok) {
                return response.json(); // Convertir la respuesta a JSON
            }
            throw new Error('Error al obtener las sedes');
        })
        .then(data => {
            // Crear una opción por cada sede obtenida
            data.forEach((sede, indice) => {
                const nuevaOpcion = document.createElement('option');
                nuevaOpcion.id = 'sede_' + (indice + 1);
                nuevaOpcion.value = indice + 1;
                nuevaOpcion.textContent = sede.sede;
                selectSede.appendChild(nuevaOpcion);
            });
        })
        .catch(error => {
            console.error('Error al cargar sedes:', error);
            alert('Error al cargar sedes');
        });

    // Obtener roles del backend
    fetch('/obtenerRoles')
    .then(response => {
        if (response.ok) {
            return response.json(); // Convertir la respuesta a JSON
        }
        throw new Error('Error al obtener los roles');
    })
    .then(data => {
        // Crear una opción por cada sede obtenida
        data.forEach((rol, indice) => {
            const nuevaOpcion = document.createElement('option');
            nuevaOpcion.id = 'rol_' + (indice + 1);
            nuevaOpcion.value = indice + 1;
            nuevaOpcion.textContent = rol.rol;
            selectRoles.appendChild(nuevaOpcion);
        });
    })
    .catch(error => {
        console.error('Error al cargar roles:', error);
        alert('Error al cargar roles');
    });
}