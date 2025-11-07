// auth.js - Sistema de autenticación BS Dash
function loginUser(email, password) {
    // Primero, asegurarnos de que exista al menos un usuario
    const usuariosExistentes = JSON.parse(localStorage.getItem('bsdash_usuarios') || '[]');
    
    if (usuariosExistentes.length === 0) {
        // Crear usuario por defecto si no existe ninguno
        const usuarioDefault = {
            id: 1,
            nombre: 'John Berroa',
            email: 'admin@bsdash.com',
            username: 'admin',
            password: '1234', // Contraseña por defecto
            rol: 'admin',
            activo: true
        };
        usuariosExistentes.push(usuarioDefault);
        localStorage.setItem('bsdash_usuarios', JSON.stringify(usuariosExistentes));
    }

    const users = JSON.parse(localStorage.getItem('bsdash_usuarios') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', user.nombre);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userRole', user.rol);
        
        // REDIRIGIR al dashboard
        window.location.href = 'dashboard.html';
        return true;
    } else {
        alert('❌ Usuario o contraseña incorrectos');
        return false;
    }
}

// Evento del formulario de login
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = this.querySelector('input[type="email"]').value;
    const password = this.querySelector('input[type="password"]').value;
    
    if (!email || !password) {
        alert('⚠️ Por favor, completa todos los campos');
        return;
    }
    
    loginUser(email, password);
});

// Verificar si ya está logueado (para redirigir del index al dashboard)
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            window.location.href = 'dashboard.html';
        }
    }
});