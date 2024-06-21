document.addEventListener('DOMContentLoaded', () => {
    const loginForm = get('loginForm');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const correo = get('correo').value;
      const contraseña = get('contraseña').value;
      if(!get('spinner')) get('iniciarSesion').innerHTML += `<div id='spinner' class='ml-3 spinner-border text-primary' style='height: 20px; width: 20px;'></div>`;
  
      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ correo, contraseña })
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          const errorMessage = get('error-message');
          errorMessage.classList.remove('d-none');
          errorMessage.textContent = result.mensaje || 'Error al iniciar sesión. Por favor, intenta de nuevo.';
        } else {
          sessionStorage.setItem('sede', result.sede);
          if(result.tipoUsuario === 2) localStorage.setItem('correo', correo);
          window.location.href = result.ruta;
        }
      } catch (error) {
        if(get('spinner')) get('spinner').remove();
        console.error('Error al enviar la solicitud de inicio de sesión:', error);
        const errorMessage = get('error-message');
        errorMessage.classList.remove('d-none');
        errorMessage.textContent = 'Error al iniciar sesión. Por favor, intenta de nuevo o revisa tu conexión a Internet.';
      }
    });
});