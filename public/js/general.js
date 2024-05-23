const ventanaModal = '<div class="modal" id="myModal" style="display=block;"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title" id="hModal">Header de modal dinámico</h4><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="bModal">Cuerpo del modal dinámico..</div><div class="modal-footer"><button type="button" class="btn btn-danger" data-bs-dismiss="modal" id="btnModal">Contenido botón</button></div></div></div></div>';
const idHModal = 'hModal';
const idBModal = 'bModal';
const idBotonModal = 'btnModal';
const barraNav = `<nav class="navbar navbar-expand-lg">
<a class="navbar-brand" href="#">Integración Para La Vida</a>
<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
  <span class="navbar-toggler-icon"></span>
</button>
<div class="collapse navbar-collapse" id="navbarNav">
  <ul class="navbar-nav ml-auto">
    <li class="nav-item">
      <a class="nav-link" href="#">Inicio</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#">Acerca de</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#">Servicios</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#">Contacto</a>
    </li>
  </ul>
</div>
</nav>`;

function idInnerHTML(id, contenido){
    document.getElementById(id).innerHTML = contenido;
}
function enterEnInput(inputObjetivo, idBoton){
    inputObjetivo.addEventListener('keydown', function (event) {
        if(event.key === 'Enter'){
            document.getElementById(idBoton).click();
        }
    });
}
// Función para verificar si un elemento ya existe en una lista
function elementoExisteEnLista(elemento, criterioDeSeleccion) {
    const labels = document.querySelectorAll(criterioDeSeleccion);
    const labelContents = Array.from(labels).map(label => label.textContent.trim());
    return labelContents.includes(elemento);
}

function ocultar(idElemento){
    document.getElementById(idElemento).style.display = 'none';
}
function mostrar(idElemento){
    document.getElementById(idElemento).style.display = 'block';
}
function get(id){
    return document.getElementById(id);
}
function valorDe(id){
    return document.getElementById(id).value;
}

function mostrarModal(titulo, mensaje, modal) {
    document.getElementById(idHModal).innerHTML = titulo;
    document.getElementById(idBModal).innerHTML = mensaje;
    modal.show();
}

function nav() {
    get('barraNav').innerHTML = barraNav;
}