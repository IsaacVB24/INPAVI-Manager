document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const correo = document.getElementById('correo').value;
        const contraseña = document.getElementById('contraseña').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ correo, contraseña })
            });

            const result = await response.json();

            if (response.ok) {
                window.location.href = '/altaVoluntario'; // Redirigir a la página de inicio o a otra página después de iniciar sesión
            } else {
                const errorMessage = document.getElementById('error-message');
                errorMessage.classList.remove('d-none');
                errorMessage.textContent = result.mensaje || 'Error al iniciar sesión. Por favor, intenta de nuevo.';
            }
        } catch (error) {
            console.error('Error al enviar la solicitud de inicio de sesión:', error);
            const errorMessage = document.getElementById('error-message');
            errorMessage.classList.remove('d-none');
            errorMessage.textContent = 'Error al iniciar sesión. Por favor, intenta de nuevo.';
        }
    });
});