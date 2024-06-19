// Función para obtener categorías de despensas y mostrar los datos en la tabla
function visualizarDatos() {
  fetch("/obtener_datos_despensas")
      .then(response => response.json())
      .then(data => {
          let tablaHtml = "<table class='table'><thead><tr><th>Categoría</th><th>Descripción</th><th>Cantidad de productos</th></tr></thead><tbody>";
          data.forEach(item => {
              tablaHtml += `<tr><td>${item.nombre_categoria}</td><td>${item.descripcion_despensa}</td><td>${item.cantidad_prod_despensa}</td></tr>`;
          });
          tablaHtml += "</tbody></table>";

          // Añadir los botones al final de la tabla
          tablaHtml += `
              <div class="mt-3">
                  <button id="botonRegresar"  class="button-return" onclick="history.back()">
                      <i class="bi bi-arrow-left"></i> Regresar
                  </button>
                  <button type="button" id="botonRegistrar" class="btn-primary">
                      <i class="bi bi-emoji-smile-fill"></i> Registrar
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
    fetch("/obtener_despensas")
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                document.getElementById("tablaDatos").innerHTML = "<p>No hay datos disponibles</p>";
                return;
            }

            let tablaHtml = "<table class='table'><thead><tr><th>Categoría</th><th>Cantidad de despensas</th><th>Fecha de registro</th></tr></thead><tbody>";

            const obtenerNombreCategoria = async (categoriaId) => {
                const response = await fetch(`/obtenerNombreCategoria/${categoriaId}`);
                if (!response.ok) {
                    throw new Error('Error al obtener el nombre de la categoría');
                }
                const categoria = await response.json();
                return categoria.nombre_categoria;
            };

            const promises = data.map(item => {
                return obtenerNombreCategoria(item.categoria_despensa_id)
                    .then(nombreCategoria => {
                        tablaHtml += `<tr><td>${nombreCategoria}</td><td>${item.cantidad_despensas}</td><td>${item.fecha_registro}</td></tr>`;
                    })
                    .catch(error => {
                        console.error("Error al obtener nombre de categoría:", error);
                        tablaHtml += `<tr><td>Error</td><td>${item.cantidad_despensas}</td><td>${item.fecha_registro}</td></tr>`;
                    });
            });

            Promise.all(promises)
                .then(() => {
                    tablaHtml += "</tbody></table>";

                    document.getElementById("tablaDatos").innerHTML = tablaHtml;

                    const buttonsHtml = `
                        <div class="mt-3">
                            <button id="botonRegresar" class="button-return" onclick="history.back()">
                                <i class="bi bi-arrow-left"></i> Regresar
                            </button>
                            <button type="button" id="botonRegistrar" class="btn-primary">
                                <i class="bi bi-emoji-smile-fill"></i> Registrar
                            </button>
                        </div>
                    `;
                    document.getElementById("tablaDatos").insertAdjacentHTML('beforeend', buttonsHtml);

                    document.getElementById("botonRegistrar").addEventListener("click", function() {
                        window.location.href = "/altacatdespensas";
                    });
                    document.getElementById("botonRegresar").addEventListener("click", function() {
                        window.location.href = "/index_entrada";
                    });
                })
                .catch(error => console.error("Error al obtener nombres de categoría:", error));
        })
        .catch(error => console.error("Error al obtener despensas:", error));
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

// Llamar a la función al cargar la página
document.addEventListener('DOMContentLoaded', visualizarDatosCategorias);
