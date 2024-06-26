// Función para obtener categorías de despensas y mostrar los datos en la tabla
function visualizarDatos() {
  fetch("/obtener_datos_despensas")
      .then(response => response.json())
      .then(data => {
          let tablaHtml = "<table class='table'><thead><tr><th>Categoría</th><th>Descripción</th><th>Cantidad de productos totales</th><th>Cantidad de productos seleccionados por despensa</th><th>Productos seeccionados</th><th>Peso de despensa</th></tr></thead><tbody>";
          data.forEach(item => {
              tablaHtml += `<tr><td>${item.Categoria}</td><td>${item.Descripcion}</td><td>${item.cantidad_prod_despensa}</td><td>${item.cantidad_prod_selec}</td><td>${item.Productos_asociados}</td><td>${item.Peso_despensa}</td></tr>`;
          });
          tablaHtml += "</tbody></table>";

          // Añadir los botones al final de la tabla
          tablaHtml += `
              <div class="mt-3">
                  <button id="botonRegresar"  class="button-return" onclick="history.back()">
                      <i class="bi bi-arrow-left"></i> Regresar
                  </button>
                  <button type="button" id="botonRegistrar" class="btn-primary">
                      <i class="bi bi-emoji-smile-fill"></i> Registrar más categorías
                  </button>
              </div>
          `;

          document.getElementById("tablaDatos").innerHTML = tablaHtml;

          // Agregar evento al botón Registrar y regresar
          document.getElementById("botonRegistrar").addEventListener("click", function() {
              window.location.href = "/altacatdespensas";
          });
          document.getElementById("botonRegresar").addEventListener("click", function() {
            window.location.href = "/index_entrada";
        });

      })
      .catch(error => console.error("Error:", error));
}


function visualizarDatosDespensas() {
    fetch("/obtener_datos_despensas2")
        .then(response => response.json())
        .then(data => {
            let tablaHtml = "<table class='table'><thead><tr><th>Categoría</th><th>Descripción</th><th>Cantidad de despensas</th></tr></thead><tbody>";
            data.forEach(item => {
                tablaHtml += `<tr><td>${item.Categoria}</td><td>${item.Descripcion}</td><td>${item.cantidad_despensas}</td></tr>`;
            });
            tablaHtml += "</tbody></table>";
  
            // Añadir los botones al final de la tabla
            tablaHtml += `
                <div class="mt-3">
                    <button id="botonRegresar" class="button-return" onclick="history.back()">
                        <i class="bi bi-arrow-left"></i> Regresar
                    </button>
                    <button type="button" id="botonRegistrar" class="btn btn-primary">
                        <i class="bi bi-emoji-smile-fill"></i> Registrar más despensas
                    </button>
                </div>
            `;
  
            document.getElementById("tablaDatos").innerHTML = tablaHtml;
  
            // Agregar evento al botón Registrar más despensas
            document.getElementById("botonRegistrar").addEventListener("click", function() {
                window.location.href = "../html/altadespensas.html";
            });

            // Agregar evento al botón Regresar
            document.getElementById("botonRegresar").addEventListener("click", function() {
                window.location.href = "/index_entrada";
            });
  
        })
        .catch(error => console.error("Error:", error));
}



function visualizarDatosCategorias() {
    fetch('/visualizarproductosstock')
        .then(response => response.json())
        .then(data => {
            const tablaDatos = document.getElementById('tablaDatos');
            const table = document.createElement('table');
            table.classList.add('table');

            // Crear el encabezado de la tabla
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `

                <th scope="col">Nombre de Categoría</th>
            `;
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Crear el cuerpo de la tabla
            const tbody = document.createElement('tbody');
            data.forEach(categoria => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${categoria.nombre_categor_prod}</td>
                `;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            // Limpiar contenido previo y agregar la tabla al contenedor
            tablaDatos.innerHTML = '';
            tablaDatos.appendChild(table);
        })
        .catch(error => console.error('Error al obtener categorías de productos:', error));
}

// visualizacion.js

// Función para cargar los datos de los productos al cargar la página
function visualizarDatosProductos() {
    fetch("/obtener_productos")
        .then(response => response.json())
        .then(data => {
            // Obtener referencia a la tabla de productos en el HTML
            const tablaProductos = document.getElementById("tablaDatos");

            // Verificar si hay datos para mostrar
            if (data.length === 0) {
                tablaProductos.innerHTML = "<p>No hay datos disponibles</p>";
                return;
            }

            // Construir la tabla dinámicamente
            let tablaHtml = "<table class='table'><thead><tr><th>Nombre del Producto</th><th>Cantidad</th><th>Fecha de Caducidad</th><th>Unidad de Medida</th><th>Cantidad Unidad</th></tr></thead><tbody>";

            data.forEach(producto => {
                tablaHtml += `
                    <tr>
                        <td>${producto.nombre_producto}</td>
                        <td>${producto.cantidad}</td>
                        <td>${producto.fecha_caducidad}</td>
                        <td>${producto.unidad_medida}</td>
                        <td>${producto.cantidad_unidad}</td>
                    </tr>
                `;
            });

            tablaHtml += "</tbody></table>";

            tablaHtml += `
            <div class="mt-3">
                <button id="botonRegresar" class="button-return" onclick="history.back()">
                    <i class="bi bi-arrow-left"></i> Regresar
                </button>
                <button type="button" id="botonRegistrar" class="btn btn-primary">
                    <i class="bi bi-emoji-smile-fill"></i> Registrar más productos
                </button>
            </div>
        `;

            // Insertar la tabla generada en el contenedor
            tablaProductos.innerHTML = tablaHtml;

            // Asignar la acción de redirección al botón Registrar más productos
            const botonRegistrar = document.getElementById("botonRegistrar");
            botonRegistrar.addEventListener("click", function() {
                window.location.href = "../html/altacatproductos.html";
            });
        })
        .catch(error => console.error("Error al obtener los productos:", error));
}
