/*!
    * Autor: Isaac Victoria Benavides
    * Fecha: Julio 2024
*/

document.addEventListener('DOMContentLoaded', () => {
    get('regresar').onclick = () => {window.location.href = localStorage.getItem('anterior');};
    document.querySelectorAll('input').forEach(input => {input.readOnly = true;});
    document.querySelectorAll('textarea').forEach(textarea => {textarea.readOnly = true; textarea.style.resize = 'none';});
    const id_voluntario = localStorage.getItem('id');
    document.querySelectorAll('span').forEach(span => {if(span.id !== 'fecha') {span.style.backgroundColor = '#6281b4'; span.style.border = '1px solid black'; span.style.color = 'white'; span.style.fontWeight = 'bold';}});
    document.querySelectorAll('textarea').forEach(textarea => {textarea.style.border = '1px solid black'; textarea.style.backgroundColor = '#f6f6f6';});
    document.querySelectorAll('input').forEach(input => {input.style.border = '1px solid black'; input.style.backgroundColor = '#f6f6f6';});
    document.querySelectorAll('select').forEach(select => {select.style.border = '1px solid black';});
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
            const voluntario = data.row;
            const textoFecha = get('textoFecha');
            const fecha = get('fecha');
            if(voluntario.estado === 0) {
                textoFecha.innerHTML = 'Fecha baja:';
                fecha.innerHTML = tratarFecha(voluntario.fecha_baja);
            }
            if(voluntario.estado === 1) {
                textoFecha.innerHTML = 'Fecha alta:';
                fecha.innerHTML = tratarFecha(voluntario.fecha_alta);
            }
            if(voluntario.estado === 2) {
                textoFecha.innerHTML = 'Fecha captación:';
                fecha.innerHTML = tratarFecha(voluntario.fecha_captacion);
                get('divFechaCaptacion').style.display = 'none';
            }
            textoFecha.innerHTML += '&nbsp;';
            get('nombres').value = voluntario.nombre_v;
            get('apPat').value = voluntario.apellido_paterno_v;
            get('apMat').value = voluntario.apellido_materno_v;
            get('fechaNacimiento').value = tratarFecha(voluntario.fecha_nacimiento);
            get('correo').value = voluntario.correo_v;
            get('telefono').value = voluntario.telefono_v;
            get('identificacion').value = voluntario.identificacion;
            get('ocupacion').value = voluntario.ocupacion;
            get('sede').value = voluntario.sede;
            get('fechaCaptacion').value = tratarFecha(voluntario.fecha_captacion);
            get('personaDeAlta').value = `${voluntario.sede_usuarioAlta} - ${voluntario.nombre_usuarioAlta} ${voluntario.apPat_usuarioAlta} ${voluntario.apMat_usuarioAlta}`;
            get('internoAsignado').value = voluntario.id_voluntarioAsignado === 0 ? 'Sin asignación' : `${voluntario.nombre_voluntarioAsignado}`;
            if(!voluntario.intereses) {
                get('intereses').rows = 1;
                get('intereses').innerHTML = 'Sin intereses registrados';
            } else {
                const intereses = voluntario.intereses.split(',');
                get('intereses').rows = intereses.length > 0 ? intereses.length : 1;
                intereses.forEach((interes, indice) => {
                    get('intereses').innerHTML += (indice !== intereses.length - 1 ? interes + '\n' : interes);
                });
            }
            get('personaContacto').value = voluntario.personaContacto || '-';
            get('observaciones').value = voluntario.observaciones || '-';
            const valoracion = voluntario.valoracion.split(',');
            get('valoracion').rows = valoracion.length;
            valoracion.forEach((programa, indice) => {
                get('valoracion').innerHTML += (indice !== valoracion.length - 1 ? programa + '\n' : programa);
            });
            get('tipoVoluntario').value = (voluntario.informe_valoracion === 0 || voluntario.informe_valoracion === 1) ? (voluntario.informe_valoracion === 0 ? 'Interno' : 'Externo temporal') : 'No se tiene registro';
            const primerosContactos = get('primerosContactos');
            if(voluntario.primerosContactos) {
                const contactos = voluntario.primerosContactos.split(',');
                primerosContactos.rows = contactos.length;
                contactos.forEach((contacto, indice) => {
                    primerosContactos.innerHTML += (indice !== contactos.length - 1 ? contacto + '\n' : contacto);
                });
            } else {
                primerosContactos.rows = 1;
                primerosContactos.innerHTML = '-';
            }
            const derivacion = get('derivacion');
            derivacion.rows = 1;
            if(voluntario.derivacion) {
                const programasDerivacion = voluntario.derivacion.split(',');
                derivacion.rows = programasDerivacion.length;
                programasDerivacion.forEach((programa, indice) => {
                    derivacion.innerHTML += (indice !== programasDerivacion.length - 1 ? programa + '\n' : programa);
                });
            } else {
                derivacion.innerHTML = '-';
            }
        })
        .catch(error => {
            console.error('Error al cargar sedes:', error);
            alert('Error al cargar sedes');
        });
});