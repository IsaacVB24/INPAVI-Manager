const fondoTh = '#dcd8d8';
document.addEventListener('DOMContentLoaded', () => {
    get('tituloVisualizar').innerHTML += `"${localStorage.getItem('programa')}"`;
    const contenidoPrograma = get('contenidoPrograma');
    const id_programa = parseInt(localStorage.getItem('idPrograma'));
    const id_sede = parseInt(localStorage.getItem('idSede'));
    get('alertas').innerHTML = ventanaModal;
    fetch('/consultaPrograma', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_programa, id_sede })
    })
    .then(response => {return response.json()})
    .then(programas => {
        const datoPrograma = programas.mensaje;
        console.log(datoPrograma);

        fetch('/voluntariosEnPrograma', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_programa, id_sede })
        })
        .then(response => {return response.json()})
        .then(voluntarios => {
            console.log(voluntarios);
        
            contenidoPrograma.innerHTML = `
            <div id='datosPrograma'>
                <p class='h5 fw-bold'>Sede: <span style='font-weight: normal'>${datoPrograma.sede}</span></p>
                <p class='h5 fw-bold'>Descripción: <span style='font-weight: normal'>${datoPrograma.descripcion || 'Sin descripción registrada'}</span></p>
                <p class='h5 fw-bold'>Fecha inicio: <span style='font-weight: normal'>${datoPrograma.fechaInicio ? tratarFecha(datoPrograma.fechaInicio) : 'Sin registro'}</span></p>
                <p class='h5 fw-bold'>Fecha fin: <span style='font-weight: normal'>${datoPrograma.fechaFin ? tratarFecha(datoPrograma.fechaFin) : 'Sin expiración'}</span></p>
                <p class='h5 fw-bold'>Cantidad de voluntarios participantes: <span style='font-weight: normal'>${datoPrograma.cantidadInvolucrados}</span></p>
            </div>
            <div class="mt-4 table-responsive" id='datosVoluntariosPrograma'>
                <table class="table table-hover" style="border: 2px solid black;">
                    <thead>
                        <tr id="encabezadosV">
                            <th>Nombre voluntario</th>
                            <th>Fecha de alta</th>
                            <th id="acciones">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="datosVoluntarios">
                    </tbody>
                </table>
            </div>
            `;
            if(voluntarios.length === 0) {
                get('datosVoluntarios').innerHTML = `
                <tr>
                    <td colspan=3>No hay voluntarios asociados a este programa social en esta sede.</td>
                </tr>
                `;
            } else {
                voluntarios.forEach(voluntario => {
                    const fila = crear('tr');
                    fila.id = voluntario.id_voluntario;

                    const nombre = crear('td');
                    nombre.innerHTML = voluntario.nombreCompleto;
                    fila.appendChild(nombre);
                    
                    const fechaAlta = crear('td');
                    fechaAlta.innerHTML = voluntario.fecha_alta ? tratarFecha(voluntario.fecha_alta) : 'Sin registro';
                    fila.appendChild(fechaAlta);
                    
                    const acciones = crear('td');
                    const div = crear('div');
                    const img1 = crear('img');
                    img1.src = '../img/desvincular.png';
                    img1.alt = 'Ícono de desvincular de iconographics en flaticon.es';
                    img1.title = `Desvincular a ${voluntario.nombreCompleto.split(' ')[0]} de ${localStorage.getItem('programa')}`;
                    img1.style.height = '30px';
                    img1.classList.add('m-3');
                    img1.id = `desvincular_${voluntario.id_voluntario}`;
                    div.appendChild(img1);
                    acciones.appendChild(div);
                    fila.appendChild(acciones);

                    get('datosVoluntarios').appendChild(fila);

                    get(`desvincular_${voluntario.id_voluntario}`).addEventListener('click', () => {
                        desvincularVoluntario(voluntario.nombreCompleto, id_sede, datoPrograma.sede, id_programa, localStorage.getItem('programa'), voluntario.id_voluntario);
                    });
                });
            }
            document.querySelectorAll('th').forEach(th => {th.style.backgroundColor = fondoTh; th.classList.add('align-middle')});
            document.querySelectorAll('td').forEach(td => {td.classList.add('align-middle')});
        })
        .catch(error => {
            alert(error);
        });
    })
    .catch(error => {
        alert(error);
    });
});

function desvincularVoluntario(nombre, id_sede, sede, id_programa, programa, id_voluntario) {
    const modal = new bootstrap.Modal(get('myModal'));
    const btn = get(idBotonModal);
    btn.innerHTML = 'Desvincular';
    mostrarModal('Desvincular voluntario', `
        ¿Realmente deseas desvincular a "${nombre}" del programa "${programa}" para la sede "${sede}"?
        <br><br>
        <div class="form-group">
            <div class="form-group">
                <label for="motivo">Motivo por el cual se va a desvincular: <span style='color: red;'>*</span></label>
                <textarea class="form-control" rows="5" id="motivo" style='resize: none;'></textarea>
            </div>
            <label for="contrDesv" class="fw-bold">Si confirmas esta acción, escribe la contraseña que utilizas para iniciar sesión:</label>
            <input type="password" class="form-control" id="contrDesv" placeholder='Ingresa tu contraseña' maxlength=30>
        </div>
    `, modal);
    btn.onclick = () => {
        const motivo = get('motivo').value.trim();
        const contra = get('contrDesv').value;
        if(motivo === '' || contra === '') return alert('Se debe ingresar un motivo y tu contraseña');
        if(!get('spinner')) get('botonesModal').innerHTML += `<div id='spinner' class='spinner-border text-danger'></div>`;
        
        fetch('/compararContra', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contra })
        })
        .then(response => {
            if(!response.ok) {
                return alert('Constraseña incorrecta');
            } else {
                fetch('/desvincularVoluntario', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id_voluntario, id_programa, id_sede, motivo })
                })
                .then(response => {
                    if(!response.ok) {
                        throw new Error('Error en la solicitud para obtener programas');
                    }
                    codigo = 200;
                    return response.json();
                })
                .then(data => {
                    alert(data.mensaje);
                    if(codigo === 200) {
                        window.location.href = '/datosPrograma';
                        modal.hide();
                    }
                })
                .catch(error => {
                    if(get('spinner')) get('spinner').remove();
                    console.error('Error al modificar los datos del voluntario: ' + error);
                    alert('Error al modificar los datos del voluntario');
                });
            }
        })
        .catch(error => {
            alert(error);
        });
        if(get('spinner')) get('spinner').remove();
    };
}