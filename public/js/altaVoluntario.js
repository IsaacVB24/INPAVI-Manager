function agregarOcupacion() {
    idInnerHTML(idHModal, 'Añadir ocupación');
    idInnerHTML(idBModal, '<input type="text" class="shadow form-control" id="ocupacionNva" placeholder="Ingrese la nueva ocupación" name="ocupacionNva" required autocomplete="off" maxlength="20">');
    idInnerHTML(idBotonModal, 'Agregar');
    const inputOcupacionNva = document.getElementById('ocupacionNva');
    inputOcupacionNva.focus();
    enterEnInput(inputOcupacionNva, idBotonModal);

    // Agregar evento hide.bs.modal al modal para evitar su cierre si el input está vacío
    document.getElementById('myModal').addEventListener('hide.bs.modal', function() {
        // Obtener el valor del input
        const ocupacionNva = inputOcupacionNva.value;
        const divOcupacion = document.getElementById('divOcupacion');

        // Verificar si el input está vacío
        if (ocupacionNva.trim() !== '') {
            divOcupacion.innerHTML = '<input type="text" class="shadow form-control" id="ocupacionV" placeholder="Ocupación añadida" name="ocupacionV" required autocomplete="off" maxlength="70" readonly style="user-select:no; cursor:default;"><label for="ocupacionV" class="ms-2">Ocupación:</label><div class="mt-1"><a href="" data-bs-toggle="modal" data-bs-target="#myModal" style="color:#df950d;">Modificar ocupación</a><a href="" onclick="eliminarOcupacion()" style="color:red; float:right;">Eliminar ocupación</a></div>';
            document.getElementById('ocupacionV').setAttribute('value', ocupacionNva);
        }
    });
}

function agregarInteres(){
    idInnerHTML(idHModal, 'Añadir interés de voluntario');
    idInnerHTML(idBModal, '<input type="text" class="shadow form-control" id="interesNvo" placeholder="Ingrese el nuevo interés" name="interesNvo" required autocomplete="off" maxlength="20">');
    idInnerHTML(idBotonModal, 'Agregar');
    const inputInteresNvo = document.getElementById('interesNvo');
    inputInteresNvo.focus();
    enterEnInput(inputInteresNvo, idBotonModal);
    const labels = document.querySelectorAll('#listaIntereses label');
    const labelContents = Array.from(labels).map(label => label.textContent);
    console.log(labelContents);
    const divNvosIntereses = document.getElementById('nvosIntereses');
    const contenidoDivNvosIntereses = divNvosIntereses.innerHTML;

    // Agregar evento hide.bs.modal al modal para evitar su cierre si el input está vacío
    document.getElementById('myModal').addEventListener('hide.bs.modal', function() {
        // Obtener el valor del input
        const interesNvo = inputInteresNvo.value;

        // Verificar si el input está vacío
        if (interesNvo.trim() !== '' && !elementoExisteEnLista(interesNvo, '#listaIntereses label')) {
            divNvosIntereses.innerHTML = '';
            divNvosIntereses.innerHTML = contenidoDivNvosIntereses + '<li><input class="form-check-input" type="checkbox" id="chk' + interesNvo + '" value="desempleado" checked><label for="chk' + interesNvo + '">&nbsp' + interesNvo + '</label></li>';
        }
    });
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('alertas').innerHTML = ventanaModal;
    const btnModal = document.getElementById('btnModal');
    btnModal.classList.remove('btn-danger');
    btnModal.classList.add('btn-success');
});

function validarAltaVoluntario(){
    const divValoracion = document.getElementById('valoracion');
    console.log(divValoracion);
    const checkboxesValoracion = divValoracion.querySelectorAll('input[type=checkbox');
    console.log(checkboxesValoracion);
    let algunCheckValoracion = false;

    checkboxesValoracion.forEach(checkbox => {
        if(checkbox.selected) algunCheckValoracion = true;
    });

    if(!checkboxesValoracion){
        document.getElementById(idHModal).innerHTML = "Error en la valoración / participación";
        document.getElementById(idBModal).innerHTML = "Se debe seleccionar "
    }

    return false;
}