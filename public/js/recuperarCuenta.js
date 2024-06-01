const mensajeCorreoIncorrecto = '<div class="alert alert-danger alert-dismissible fade show"><button type="button" class="btn-close" data-bs-dismiss="alert"></button><strong>¡Correo no encontrado!</strong> Verifica que esté escrito correctamente o <a href="/crearCuenta">crea una cuenta</a>.</div>';
const mensajeCorreoEncontrado = '<div class="alert alert-success alert-dismissible fade show"><button type="button" class="btn-close" data-bs-dismiss="alert"></button><strong>¡Correo encontrado!</strong> Revisa tu bandeja de entrada y proporciona el código que te fue enviado.</div>';

document.addEventListener('DOMContentLoaded', () => {
    const botonCodigo = get('btn-recuperar');
    botonCodigo.onclick = validarCorreoRecuperacion;
});

async function validarCorreoRecuperacion() {
    const inputCorreo = get('email');
    const correo = inputCorreo.value;
    const divAlertas = get('alertas');
    const divCodRecup = get('divCodRecup');
    const botonCodigo = get('btn-recuperar');

    if(correo === '') {
        alert("Se debe ingresar un correo válido");
        return;
    }

    try {
        const response = await fetch('/reestablecerPwd', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ correo: correo })
        });
        const data = await response.json();
        if (response.ok) {
            inputCorreo.readOnly = true;
            divAlertas.innerHTML = mensajeCorreoEncontrado;
            divCodRecup.style.display = 'block';
            botonCodigo.innerHTML = 'Validar código recibido';
            botonCodigo.onclick = () => validarTokenRecuperacion(correo, get('codRecup').value);
        } else {
            divAlertas.innerHTML = `<div class="alert alert-danger">${data.mensaje}</div>`;
        }
    } catch (error) {
        console.error('Error al validar correo:', error);
        divAlertas.innerHTML = '<div class="alert alert-danger">Error en la conexión con la base de datos</div>';
    }
}

async function validarTokenRecuperacion(correo, token) {
    get('btn-recuperar').style.display = 'none';
    const tipoUsuario = 1;
    if (token === '') {
        alert('Se debe ingresar el token que recibiste al correo ' + correo);
        return;
    }

    try {
        const response = await fetch('/validarToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ correo: correo, token: token, tipoUsuario: tipoUsuario })
        });

        const data = await response.json();

        if (response.ok) {
            get('codRecup').readOnly = true;
            const camposNuevaContrasena = get('camposNuevaContrasena');
            camposNuevaContrasena.style.display = 'block';
        } else {
            alert(data.mensaje);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al validar el token');
    }
}

async function cambiarContrasena() {
    const correo = get('email').value;
    const nuevaContrasena = get('nuevaContrasena').value;
    const repetirNuevaContrasena = get('repetirNuevaContrasena').value;

    if(!validarContraseña(nuevaContrasena)) {
        alert('La contraseña debe tener al menos 8 caracteres de longitud, incluir al menos una letra mayúscula, minúscula, un número y un carácter especial (>#$_.).');
        return;
    } else if (nuevaContrasena !== repetirNuevaContrasena) {
        alert('Las contraseñas no coinciden');
        return;
    }

    try {
        const response = await fetch('/cambiarPwd', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ correo: correo, nuevaContr: nuevaContrasena })
        });

        const data = await response.json();
        alert(data.mensaje);

        if (response.ok) {
            window.location.href = data.ruta;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cambiar la contraseña');
    }
}