document.addEventListener('DOMContentLoaded', () => {
    const datosProgramas = get('datosProgramas');
    const encabezados = get('encabezados');

    fetch('/consultaProgramas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {return response.json()})
    .then(programas => {
        console.log(programas);
        datosProgramas.innerHTML = '';
        if(programas.length > 4) encabezados.innerHTML += '<th>Sede</th>';
        programas.forEach((programa) => {
            const fila = crear('tr');

            const nombre = crear('td');
            nombre.innerHTML = programa.programa;
            fila.appendChild(nombre);

            const involucrados = crear('td');
            involucrados.innerHTML = programa.cantidadInvolucrados;
            fila.appendChild(involucrados);

            const fechaFin = crear('td');
            fechaFin.innerHTML = programa.fechaFin || 'Sin expiración';
            fila.appendChild(fechaFin);

            if(programas.length > 4) {
                const sede = crear('td');
                sede.innerHTML = programa.sede;
                fila.appendChild(sede);
            }

            datosProgramas.appendChild(fila);
            fila.addEventListener('click', () => {visualizarPrograma(programa)});
        });
    })
    .catch(error => {
        alert(error);
    });
});

function visualizarPrograma(datosPrograma) {
    const descripcion = get('descripcion');
    const involucrados = get('cantidadVoluntarios');
    const inicio = get('fechaInicio');
    const fin = get('fechaFin');
    const sede = get('sede');

    descripcion.value = datosPrograma.descripcion || '-';
    involucrados.value = datosPrograma.cantidadInvolucrados;
    inicio.value = datosPrograma.fechaInicio;
    fin.value = datosPrograma.fechaFin;
    sede.value = datosPrograma.sede;
}