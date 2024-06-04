const nombreForm = "formCrearCuenta";
const formConDatos = 'datosTrasValidacion';

const idSelectRol = 'rol';
const idSelectSede = 'sede';

const correoYaRegistrado = '<div class="alert alert-danger alert-dismissible fade show"><button type="button" class="btn-close" data-bs-dismiss="alert"></button><strong>¡Correo registrado!</strong> Este correo no puede usarse ya que ya hay una cuenta asociada. Por favor <a href="/">inicie sesión</a>.</div>';
const tokenEnviado = '<div class="alert alert-success alert-dismissible fade show"><button type="button" class="btn-close" data-bs-dismiss="alert"></button><strong>¡Token enviado!</strong> Revisa tu bandeja de entrada y proporciona el código que te fue enviado.</div>';

function validarNuevaCuenta(){
    const roles = get(idSelectRol);
    const sedes = get(idSelectSede);
    var completo = true;

    // Insertar HTML de la ventana modal dentro del formulario
    get('nvaCuenta').insertAdjacentHTML('beforeend', ventanaModal);
    const modal = new bootstrap.Modal(get('myModal'));
    get(idBotonModal).innerHTML = 'Entendido';

    const inputs = document.querySelectorAll('input');
    inputs.forEach((input, numeroInput) => {
        if (input.value === '' && numeroInput < 7) completo = false;
    });

    const nombre_usuario = valorDe('nombres');
    const apellido_paterno = valorDe('apPat');
    const apellido_materno = valorDe('apMat');
    const telefono = valorDe('telefono');
    const correo = valorDe('email');
    const contraseña = valorDe('pwd');
    const id_rol = roles.selectedIndex;
    const id_sede = sedes.selectedIndex;

    if(!completo) {
        mostrarModal('Formulario incompleto', 'Se deben completar todos los campos', modal);
    } else if(!validarContraseña(contraseña)) {
        mostrarModal('Contraseña no válida', 'La contraseña debe tener al menos 8 caracteres de longitud, incluir al menos una letra mayúscula, minúscula, un número y un carácter especial (>#$_.).', modal);
    } else if (contraseña !== valorDe('pwd2')){
        mostrarModal('Error en contraseña', 'Las contraseñas no coinciden', modal);
    } else if(roles.selectedIndex === 0){
        mostrarModal("Error en el rol", "Se debe de seleccionar un rol.", modal);
    } else if(sedes.selectedIndex === 0){
        mostrarModal('Error en la sede', 'Se debe de seleccionar una sede.', modal);
    } else {
        // Validar si el correo no existe actualmente
        fetch('/altaUsuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ correo: correo, apellido_materno: apellido_materno, apellido_paterno: apellido_paterno, telefono: telefono, contraseña: contraseña, nombre_usuario: nombre_usuario, id_rol: id_rol, id_sede: id_sede })
        })
        .then(response => {
            if (response.status === 201) {
                localStorage.setItem('correo', correo);
                window.location.href = '#';
                get('alertas').innerHTML = tokenEnviado;
                setTimeout(() => {
                    window.location.href = '/ingresarToken';
                }, 5000); // 5000 milisegundos = 5 segundos
            } else if (response.status === 409) {
                mostrarModal('Correo en uso', 'Este correo es usado para una cuenta ya creada, intente con otro o, de lo contrario, <a href="/">inicie sesión</a>.', modal);
            } else {
                alert('Error al registrar el usuario');
            }
        })
        .catch(error => {
            console.error('Error al validar correo:', error);
            alert('Error al validar correo');
        });
    }
}

async function validarToken() {
    const token = get('token').value;
    const correo = get('email').value;
    const tipoUsuario = 3;

    if (token === '') {
        alert('Se debe ingresar el token que recibiste al correo ' + correo);
    } else {
        try {
            const response = await fetch('/validarToken', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ correo: correo, token: token, tipoUsuario: tipoUsuario })
            });

            const data = await response.json();
            alert(data.mensaje); // Mostrar mensaje de respuesta

            // Verificar el código de respuesta y redirigir si es 200 o 201
            if (response.status >= 200 && response.status < 300) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al validar el token');
        }
    }
}

function cargarSedesYRoles() {
    const selectSede = get(idSelectSede);
    const selectRoles = get(idSelectRol);
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

function visibilidadDeContraseña() {
    const campoContraseña = get('pwd');
    const textoParaCambio = get('cambio');
    if(campoContraseña.type === 'password') {
        campoContraseña.type = 'text';
        textoParaCambio.innerHTML = 'Ocultar';
    } else {
        campoContraseña.type = 'password';
        textoParaCambio.innerHTML = 'Mostrar';
    }
}

function validarContraseña(contraseña) {
    // Expresión regular para validar la contraseña
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[>#$_.]).{8,}$/;

    // Verificar si la contraseña cumple con los criterios
    if (regex.test(contraseña)) {
        return true; // La contraseña es válida
    } else {
        return false; // La contraseña no cumple con los criterios
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if(ruta === '/crearCuenta'){
        cargarSedesYRoles();
        get('cambio').addEventListener('click', visibilidadDeContraseña);
        get('btn-genToken').addEventListener('click', validarNuevaCuenta);
    }
});