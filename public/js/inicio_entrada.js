document.addEventListener("DOMContentLoaded", function() {
    // Agregar event listeners una vez que el DOM esté completamente cargado
    
    // Función para redireccionar a una página
    function redirectToPage(pageName) {
        window.location.href = pageName;
    }

    // Obtener todos los botones por su ID y agregar event listeners
    document.getElementById("altadespensas").addEventListener("click", function() {
        redirectToPage("/altadespensas");
    });

    document.getElementById("modificarcatdespensas").addEventListener("click", function() {
        redirectToPage("/modificarcatdespensas");
    });

    document.getElementById("eliminarcatdepe").addEventListener("click", function() {
        redirectToPage("eliminarcatdepe");
    });

    document.getElementById("altacatdespensas").addEventListener("click", function() {
         redirectToPage("/altacatdespensas");
    });
    
    document.getElementById("eliminardepe").addEventListener("click", function() {
        redirectToPage("/eliminardepe");
    });

    document.getElementById("Visualizar_desp").addEventListener("click", function() {
        redirectToPage("/Visualizar_desp");
    });

    document.getElementById("altacatproductos").addEventListener("click", function() {
        redirectToPage("/altacatproductos");
    });

    document.getElementById("visualizarproductos").addEventListener("click", function() {
        redirectToPage("/visualizarproductos");
    });

    document.getElementById("eliminarproductos").addEventListener("click", function() {
        redirectToPage("/eliminarproductos");
    });


    document.getElementById("visualizarcatdesp").addEventListener("click", function() {
        redirectToPage("/visualizarcatdesp");
    });
    document.getElementById("index_entrada").addEventListener("click", function() {
        redirectToPage("/index_entrada");
    });
    document.getElementById("altacatproductos").addEventListener("click", function() {
        redirectToPage("/altacatproductos");
    });
    document.getElementById("altacatentrega").addEventListener("click", function() {
        redirectToPage("/altacatentrega");
    });
    
    document.getElementById("altafechaentrega").addEventListener("click", function() {
        redirectToPage("/altafechaentrega");
    }); 

    document.getElementById("modificarcdespensas").addEventListener("click", function() {
        redirectToPage("/modificarcdespensas");
    });
});
