document.addEventListener('DOMContentLoaded', () => {
    const loginForm = get('loginForm');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const correo = get('correo').value;
      const contraseña = get('contraseña').value;
  
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
          if(result.tipoUsuario === 2) localStorage.setItem('correo', correo);
          window.location.href = result.ruta;
        }
      } catch (error) {
        console.error('Error al enviar la solicitud de inicio de sesión:', error);
        const errorMessage = get('error-message');
        errorMessage.classList.remove('d-none');
        errorMessage.textContent = 'Error al iniciar sesión. Por favor, intenta de nuevo.';
      }
    });
});