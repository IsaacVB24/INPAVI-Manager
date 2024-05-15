const nombreForm = "formCrearCuenta";
const formConDatos = 'datosTrasValidacion';

const idSelectRol = 'rol';
const idSelectSede = 'sede';

const correoYaRegistrado = '<div class="alert alert-danger alert-dismissible fade show"><button type="button" class="btn-close" data-bs-dismiss="alert"></button><strong>¡Correo registrado!</strong> Este correo no puede usarse ya que ya hay una cuenta asociada. Por favor <a href="login.html">inicie sesión</a>.</div>';
const tokenEnviado = '<div class="alert alert-success alert-dismissible fade show"><button type="button" class="btn-close" data-bs-dismiss="alert"></button><strong>¡Token enviado!</strong> Revisa tu bandeja de entrada y proporciona el código que te fue enviado.</div>';

function validarNuevaCuenta(){
    const roles = document.getElementById(idSelectRol);
    const sedes = document.getElementById(idSelectSede);
    const formulario = document.getElementById('formCrearCuenta');
    const datosIngresados = Array.from(formulario.querySelectorAll('input, select'));
    console.log(datosIngresados);

    // Insertar HTML de la ventana modal dentro del formulario
    document.getElementById('nvaCuenta').insertAdjacentHTML('beforeend', ventanaModal);
    const modal = new bootstrap.Modal(document.getElementById('myModal'));
    document.getElementById(idBotonModal).innerHTML = 'Entendido';

    if(roles.selectedIndex === 0){
        document.getElementById(idHModal).innerHTML = "Error en el rol";
        document.getElementById(idBModal).innerHTML = "Se debe de seleccionar un rol.";
        modal.show();
        return false;
    }
    if(sedes.selectedIndex === 0){
        document.getElementById(idHModal).innerHTML = 'Error en la sede';
        document.getElementById(idBModal).innerHTML = 'Se debe de seleccionar una sede.';
        modal.show();
        return false;
    }

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

    return false;
}

function pruebaDatos(){
    const formulario = document.getElementById('nvaCuenta');
    const inputs = formulario.querySelectorAll('input');
    
    inputs[0].value = 'Usuario';
    inputs[1].value = 'Apellido paterno de prueba';
    inputs[2].value = 'Apellido materno de prueba';
    inputs[3].value = '5500000000';
    inputs[4].value = 'usuario@prueba.tt2';
    inputs[5].value = '12345678';
    inputs[6].value = '12345678';

    const roles = document.getElementById(idSelectRol);
    roles.selectedIndex = 1;
    const sedes = document.getElementById(idSelectSede);
    sedes.selectedIndex = 1;
}

function validarToken(){
    document.getElementById('token').value === '' ? alert('Se debe de ingresar un código.') : window.location = 'verificacion.html';
}