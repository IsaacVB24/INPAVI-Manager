const mensajeCorreoIncorrecto = '<div class="alert alert-danger alert-dismissible fade show"><button type="button" class="btn-close" data-bs-dismiss="alert"></button><strong>¡Correo no encontrado!</strong> Verifica que esté escrito correctamente o <a href="crearCuenta.html">crea una cuenta</a>.</div>';
const mensajeCorreoEncontrado = '<div class="alert alert-success alert-dismissible fade show"><button type="button" class="btn-close" data-bs-dismiss="alert"></button><strong>¡Correo encontrado!</strong> Revisa tu bandeja de entrada y proporciona el código que te fue enviado.</div>';

function pruebaRecuperarDatos(){
    const inputCorreo = document.getElementById('email');
    inputCorreo.value = 'usuario@prueba.tt2';
}

function validarCorreoRecuperacion(){
    const valorCorreo = document.getElementById('email');
    const divAlerta = document.getElementById('alertas');
    const inputCodigo = document.getElementById('pwd');
    const divCodigo = document.getElementById('divCodRecup');
    const boton = document.getElementById('btn-recuperar');
    const formRecuperarCuenta = document.getElementById('formRecuperarCuenta');

    if(valorCorreo.value === 'usuario@prueba.tt2'){
        divAlerta.innerHTML = mensajeCorreoEncontrado;
        divCodigo.style.width = '30ch';
        divCodigo.style.display = 'block';
        inputCodigo.value = 'codT4';
        boton.innerHTML = 'Validar tóken';
        formRecuperarCuenta.onsubmit = function () {
            return validarTokenRecuperacion(inputCodigo.value);
        };
    }else{
        divAlerta.innerHTML = mensajeCorreoIncorrecto;
    }
    return false;
}

function validarTokenRecuperacion(codigoRec){
    if(codigoRec === 'codT4'){
        alert('Código correcto.');
    }else{
        alert('Código incorrecto. Intenta de nuevo.');
    }
    return false;
}