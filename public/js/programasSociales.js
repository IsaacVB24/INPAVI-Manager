const fondoTh = '#dcd8d8';
document.addEventListener('DOMContentLoaded', () => {
    const datosProgramas = get('datosProgramas');
    const encabezados = get('encabezados');
    const encabezadosExp = get('encabezadosExp');
    const datosProgramasExp = get('datosProgramasExp');

    fetch('/consultaProgramas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {return response.json()})
    .then(programas => {
        datosProgramas.innerHTML = '';
        if(programas.length > 4) {
            const th = crear('th');
            th.innerHTML = 'Sede';
            th.style.backgroundColor = fondoTh;
            encabezados.insertBefore(th, encabezados.firstChild);
            const th1 = crear('th');
            th1.innerHTML = 'Sede';
            th1.style.backgroundColor = fondoTh;
            encabezadosExp.insertBefore(th1, encabezadosExp.firstChild);
        }
        const fechaActual = new Date();
        programas.forEach((programa) => {
            const fechaFinComparar = programa.fechaFin;
            const fechaComparar = convertirFecha(fechaFinComparar);
            const fila = crear('tr');
            
            if(programas.length > 4) {
                const sede = crear('td');
                sede.innerHTML = programa.sede;
                sede.classList.add('align-middle');
                fila.appendChild(sede);
            }
            
            const nombre = crear('td');
            nombre.innerHTML = programa.programa;
            nombre.classList.add('align-middle');
            fila.appendChild(nombre);
        
            const involucrados = crear('td');
            involucrados.innerHTML = programa.cantidadInvolucrados;
            involucrados.classList.add('align-middle');
            fila.appendChild(involucrados);
        
            const fechaFin = crear('td');
            fechaFin.innerHTML = programa.fechaFin || 'Sin expiración';
            fechaFin.classList.add('align-middle');
            fila.appendChild(fechaFin);

            const acciones = crear('td');
            const div = crear('div');
            const img1 = crear('img');
            img1.src = '../img/observar.png';
            img1.alt = 'Ícono de observar de Freepik en flaticon.es';
            img1.title = 'Observar datos de programa social';
            img1.style.height = '30px';
            img1.classList.add('m-3');
            img1.id = `ver_sede${programa.id_sede}_programa${programa.id_programa}`;
            div.appendChild(img1);
            const img2 = crear('img');
            img2.src = '../img/editar.png';
            img2.alt = 'Ícono de editar de Kiranshastry en flaticon.es';
            img2.title = 'Editar datos de programa social';
            img2.style.height = '30px';
            img2.classList.add('m-3');
            if(parseInt(sessionStorage.getItem('rol')) !== 1) div.appendChild(img2);
            acciones.appendChild(div);
            fila.appendChild(acciones);
            
            (fechaActual.getTime() < fechaComparar.getTime()) ? datosProgramas.appendChild(fila) : datosProgramasExp.appendChild(fila);

            get(`ver_sede${programa.id_sede}_programa${programa.id_programa}`).addEventListener('click', () => {
                localStorage.setItem('idPrograma', programa.id_programa);
                localStorage.setItem('idSede', programa.id_sede);
                localStorage.setItem('programa', programa.programa);
                window.location.href = '/datosPrograma';
            });
        });
        document.querySelectorAll('th').forEach(th => {th.style.backgroundColor = fondoTh;});
        if(datosProgramasExp.querySelectorAll('tr').length === 0) {
            datosProgramasExp.innerHTML = `
            <tr>
                <td colspan=${programas.length > 4 ? encabezadosExp.querySelectorAll('th').length + 1 : encabezadosExp.querySelectorAll('th').length}>No ha expirado aún ningún programa social.</td>
            </tr>
            `;
        }
    })
    .catch(error => {
        alert(error);
    });
});

function convertirFecha(fechaStr) {
    if(fechaStr !== null) {
        const partes = fechaStr.split('/');
        const year = parseInt(partes[0], 10);
        const month = parseInt(partes[1], 10) - 1; // Meses en JavaScript son 0-11
        const day = parseInt(partes[2], 10);
        return new Date(year, month, day);
    } else {
        const fechaActual = new Date();
        const fechaFutura = new Date(fechaActual.setFullYear(fechaActual.getFullYear() + 1));
        return fechaFutura;
    }
}