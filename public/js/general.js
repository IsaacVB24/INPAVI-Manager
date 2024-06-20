const ruta = window.location.pathname;
const ventanaModal = '<div class="modal" id="myModal" style="display=block;"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title" id="hModal">Header de modal dinámico</h4><button type="button" class="btn-close" data-bs-dismiss="modal" id="cerrarModal"></button></div><div class="modal-body" id="bModal">Cuerpo del modal dinámico..</div><div class="modal-footer" id="botonesModal"><button type="button" class="btn btn-danger" data-bs-dismiss="modal" id="btnModal">Contenido botón</button></div></div></div></div>';
const idHModal = 'hModal';
const idBModal = 'bModal';
const idBotonModal = 'btnModal';
const idSeccionBotonesModal = 'botonesModal';
const barraNav = `
  <nav class="navbar navbar-expand-lg navbar-dark main-navbar">
        <img src="../img/inpavi_logo.png" alt="Logo" class="logo" id='logoBarra'>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav"
            aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav" style='padding-left: 5px;'>
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
    </nav>
`;

function idInnerHTML(id, contenido){
  get(id).innerHTML = contenido;
}
function enterEnInput(inputObjetivo, idBoton){
  inputObjetivo.addEventListener('keydown', function (event) {
      if(event.key === 'Enter'){
          get(idBoton).click();
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
  get(idElemento).style.display = 'none';
}
function mostrar(idElemento){
  get(idElemento).style.display = 'block';
}
function get(id){
  return document.getElementById(id);
}
function valorDe(id){
  const elemento = get(id);
  return elemento.value;
}

function crear(elemento) {
  return document.createElement(elemento);
}

function mostrarModal(titulo, mensaje, modal) {
  get(idHModal).innerHTML = titulo;
  get(idBModal).innerHTML = mensaje;
  if(modal) {
    modal.show();
  } else {
    console.log('El modal no está inicializado');
  }
}

function tratarFecha(fecha) {
  const [año, mes, dia] = fecha.split('-');
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'otubre', 'noviembre', 'diciembre'];
  return (`${dia} de ${meses[parseInt(mes, 10) - 1]} de ${año}`);
};

function formateoArregloParaImpresion(arreglo) {
  if(arreglo.length === 0) {
      return '-';
  } else {
      let total = '';
      arreglo.forEach((elemento, indice) => {
        if(elemento !== '') {
          if((indice + 1) !== arreglo.length) {
              total += (elemento + ', ');
          } else {
              total += elemento;
          }
        }
      });
      return total;
  }
}

function antiguoVsNuevo (stringElementosViejos, arregloElementosActuales) {
  const arregloTratamiento = [];
  const elementosViejos = stringElementosViejos || [];
  elementosViejos.split(',').forEach(elementoViejo => {
    arregloTratamiento.push(!arregloElementosActuales.includes(elementoViejo) ? `<span class='tachar'>${elementoViejo}</span>` : elementoViejo);
  });
  arregloElementosActuales.forEach(elementoActual => {
    if(!elementosViejos.split(',').includes(elementoActual) && !arregloTratamiento.includes(elementoActual)) arregloTratamiento.push(`<span style='color: green;'>${elementoActual}</span>`);
  });
  return arregloTratamiento;
}

function arreglosIguales(arr1, arr2) {
  // Primero, comprueba si ambos arreglos tienen la misma longitud
  if (arr1.length !== arr2.length) {
      return false;
  }

  // Luego, crea copias de los arreglos y ordénalos
  let sortedArr1 = [...arr1].sort();
  let sortedArr2 = [...arr2].sort();

  // Finalmente, compara los arreglos ordenados elemento por elemento
  for (let i = 0; i < sortedArr1.length; i++) {
      if (sortedArr1[i] !== sortedArr2[i]) {
          return false;
      }
  }

  return true;
}

function permitirSoloNombres(campo) {
  campo.addEventListener('input', function() {
      let texto = campo.value;
      texto = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      // Convertir a minúsculas
      texto = texto.toLowerCase();

      // Capitalizar la primera letra de cada palabra
      texto = texto.replace(/\b\w/g, function(letra) {
          return letra.toUpperCase();
      });
      
      // Mantener todo el texto en minúsculas excepto las primeras letras
      texto = texto.split(' ').map(palabra => {
          return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
      }).join(' ');

      // Actualizar el valor del input
      this.value = texto;
  });
}

function permitirSoloLetras(campo) {
  campo.addEventListener('input', function() {
      let texto = campo.value;
      texto = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      
      // Convertir a minúsculas excepto la primera letra de la oración
      texto = texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

      // Actualizar el valor del input
      this.value = texto;
  });
}

function bloquearCaracteresEspeciales(campo) {
  campo.addEventListener('input', function() {
      let texto = campo.value;
      // Bloquear caracteres especiales (algunos)
      texto = texto.replace(/[@#$%^&*()_+\-=\[\]{};':"\\|<>\/~`]/g, '');

      // Actualizar el valor del input
      this.value = texto;
  });
}

function permitirSoloNumeros(input) {
  input.addEventListener('input', function() {
      let valor = input.value;
      
      // Reemplazar cualquier carácter que no sea un número con una cadena vacía
      valor = valor.replace(/\D/g, '');

      // Actualizar el valor del campo de fecha de nacimiento con solo números
      input.value = valor;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if(get('barraNav')) get('barraNav').innerHTML = barraNav;
  //if(get('alertas')) {get('alertas').innerHTML = `<div class="alert alert-warning alert-dismissible"><button type="button" class="btn-close" data-bs-dismiss="alert"></button><strong>¡Guarda tus cambios!</strong> El servidor se reiniciará pronto.</div>`;}
});

// Función para agregar un script al head
function addScript(src) {
  var script = document.createElement('script');
  script.src = src;
  script.async = true; // Opcional, si quieres cargar los scripts de forma asíncrona
  var head = document.head || document.getElementsByTagName('head')[0];
  head.appendChild(script);
}

// URLs de los scripts que deseas agregar
var scripts = [
  'https://code.jquery.com/jquery-3.5.1.slim.min.js',
  'https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.4/dist/umd/popper.min.js',
  'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js'
];

// Agregar cada script al head
scripts.forEach(function(src) {
  addScript(src);
});