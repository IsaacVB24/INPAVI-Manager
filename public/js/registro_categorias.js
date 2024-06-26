
function obtenerCategoriasDespensas() {
  const selectCat = document.getElementById('nombre_categoria');
  
  fetch('/obtenerCategoriasDespensas') 
    .then(response => {
      if (response.ok) {
        return response.json(); // Convertir la respuesta a JSON
      }
      throw new Error('Error al obtener las categorías de despensas. Estado de respuesta: ' + response.status);
    })
    .then(data => {
      console.log(data);
      // Crear una opción por cada categoría obtenida
      data.forEach((categoria_despensa, indice) => {
        const nuevaOpcion = document.createElement('option');
        nuevaOpcion.id = 'nombre_categoria_' + (indice + 1);
        nuevaOpcion.value = categoria_despensa;
        nuevaOpcion.textContent = categoria_despensa;
        selectCat.appendChild(nuevaOpcion);
      });
    })
    .catch(error => {
      console.error('Error al cargar categorías de despensas:', error);
      alert('Error al cargar categorías de despensas: ' + error.message);
    });
}

    // Función para obtener la cantidad de despensas asociadas a la categoría seleccionada
    function obtenerCantidadDespensas() {
        const categoriaId = document.getElementById("nombre_categoria").value;

        fetch(`/obtener_cantidad_despensas/${categoriaId}`)
            .then(response => response.json())
            .then(data => {
              console.log("Respuesta del servidor:", data);
                document.getElementById("cantidad_despensas").textContent = data.cantidadDespensas;
            })
            .catch(error => console.error("Error al obtener la cantidad de despensas:", error));
    }

    // Llamar a la función al cambiar la selección del usuario
    document.getElementById("nombre_categoria").addEventListener("change", obtenerCantidadDespensas);

    // Manejar el envío del formulario
    document.getElementById("eliminar_categoria_despe").addEventListener("submit", function(event) {
        event.preventDefault(); // Evitar envío tradicional del formulario

        const formData = new FormData(this); // Obtener datos del formulario
        const urlEncodedFormData = new URLSearchParams(formData); // Codificar en formato URL

        fetch("/eliminar_categoria_despe", {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: urlEncodedFormData
        })
        .then(response => response.json())
        .then(data => {
            alert(data.mensaje);
            if (data.mensaje.includes("correctamente")) {
                window.location.href = "/entrada_inicio";
            }
        })
        .catch(error => console.error("Error:", error));
    });

// Función para obtener y mostrar productos en un select
function obtenerYMostrarProductos(selectorProductos) {
  fetch('/obtenerproductos')
    .then(response => {
      if (response.ok) {
        return response.json(); // Convertir la respuesta a JSON
      }
      throw new Error('Error al obtener los productos. Estado de respuesta: ' + response.status);
    })
    .then(data => {
      console.log('Productos obtenidos:', data); // Verificar los datos obtenidos

      // Limpiar el select de opciones existentes
      selectorProductos.empty();

      // Crear opciones para cada nombre de producto recibido
      data.forEach(nombreProducto => {
        selectorProductos.append(`<option value="${nombreProducto}">${nombreProducto}</option>`);
      });

      // Inicializar Select2
      selectorProductos.select2({
        width: '100%'
      });

      // Escuchar cambios en el select y actualizar visualización de selecciones
      selectorProductos.on('change', function() {
        const selectedOptions = $(this).find('option:selected');
        const selectedValues = selectedOptions.map(function() {
          return $(this).text();
        }).get();
        $(this).closest('.form-row').find('.selected-items').html(selectedValues.length > 0 ? selectedValues.join('<br>') : 'Ninguna opción seleccionada');
      });

    })
    .catch(error => {
      console.error('Error al cargar los productos:', error);
      alert('Error al cargar los productos: ' + error.message);
    });
}
