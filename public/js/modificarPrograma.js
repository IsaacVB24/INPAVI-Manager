document.addEventListener('DOMContentLoaded', () => {
    const id_programa = localStorage.getItem('idPrograma');
    const id_sede = localStorage.getItem('idSede');
    const tituloModificar = get('tituloModificar');
    tituloModificar.innerHTML += localStorage.getItem('programa');
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
        if(datoPrograma.sede !== null) {tituloModificar.innerHTML += ` - ${datoPrograma.sede}`;}
        get('contenidoPrograma').innerHTML = `
        <div class='row'>
            <div class="input-group mb-3 col" style='border: 1px solid black; border-radius:5px;'>
                <span class="input-group-text">Fecha de inicio:</span>
                <input type="text" class="form-control" readonly value="${tratarFecha(datoPrograma.fechaInicio)}">
            </div>
            <div class='input-group mb-3 col ml-3' style='border: 1px solid black; border-radius:5px;'>
                <span class='input-group-text'>Fecha de fin:</span>
                <input type="date" class='form-control' ${datoPrograma.fechaFin ? `value=${tratarFecha(datoPrograma.fechaFin)}` : ''}>
            </div>
        </div>
        <div class='input-group' style='border: 1px solid black; border-radius:5px;'>
            <span class='input-group-text'>Descripción: </span>
            <textarea class='form-control' rows=7 style='resize: none;'>${datoPrograma.descripcion}</textarea>
        </div>
        <button type="button" id="botonRegistrar" class="btn-primary mt-3">
            <i class="bi bi-emoji-smile-fill"></i> Registrar
        </button>
        `;
    })
    .catch(error => {
        alert(error);
    });
});