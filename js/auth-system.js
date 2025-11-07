// js/auth-system.js - Sistema de autenticación mejorado
console.log('🔐 Cargando auth-system.js...');

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.storageKey = 'bs_dash_auth';
        this.usersKey = 'bs_dash_usuarios';
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 horas
        console.log('✅ Auth system inicializado');
        this.checkAuth(); // Verificar sesión existente
        this.inicializarUsuariosPorDefecto();
    }

    inicializarUsuariosPorDefecto() {
        const usuarios = this.getUsers();
        
        if (usuarios.length === 0) {
            const usuarioAdmin = {
                id: 1,
                nombre: 'Administrador',
                email: 'admin@berroa.com',
                password: '809415',
                username: 'admin',
                rol: 'admin',
                activo: true,
                fecha_creacion: new Date().toISOString(),
                ultimo_acceso: null
            };
            
            usuarios.push(usuarioAdmin);
            this.saveUsers(usuarios);
            console.log('👤 Usuario administrador creado por defecto');
        }
    }

    async login(email, password) {
        console.log('🔐 Intentando login:', email);
        
        try {
            const usuarios = this.getUsers();
            const user = usuarios.find(u => 
                u.email === email && u.password === password && u.activo !== false
            );
            
            if (user) {
                this.currentUser = {
                    id: user.id,
                    email: user.email,
                    name: user.nombre,
                    username: user.username,
                    role: user.rol,
                    empresa_id: 1,
                    permisos: this.obtenerPermisosPorRol(user.rol)
                };
                
                // Actualizar último acceso
                user.ultimo_acceso = new Date().toISOString();
                this.saveUsers(usuarios);
                
                // Guardar sesión
                this.saveSession();
                console.log('✅ Login exitoso:', user.email);
                return true;
            } else {
                console.log('❌ Credenciales incorrectas o usuario inactivo');
                return false;
            }
        } catch (error) {
            console.error('💥 Error en login:', error);
            return false;
        }
    }

    obtenerPermisosPorRol(rol) {
        const permisos = {
            'admin': ['dashboard', 'ventas', 'inventario', 'clientes', 'reportes', 'configuracion', 'backup'],
            'vendedor': ['dashboard', 'ventas', 'clientes'],
            'inventario': ['dashboard', 'inventario', 'reportes'],
            'reportes': ['dashboard', 'reportes']
        };
        
        return permisos[rol] || ['dashboard'];
    }

    saveSession() {
        const sessionData = {
            user: this.currentUser,
            loginTime: new Date().getTime(),
            expiresAt: new Date().getTime() + this.sessionTimeout
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(sessionData));
        console.log('💾 Sesión guardada para:', this.currentUser.email);
    }

    checkAuth() {
        try {
            const session = localStorage.getItem(this.storageKey);
            if (!session) {
                console.log('🔐 No hay sesión activa');
                return false;
            }

            const sessionData = JSON.parse(session);
            const now = new Date().getTime();

            // Verificar si la sesión expiró
            if (now > sessionData.expiresAt) {
                console.log('⏰ Sesión expirada');
                this.logout();
                return false;
            }

            this.currentUser = sessionData.user;
            console.log('✅ Sesión recuperada:', this.currentUser.email);
            return true;
        } catch (error) {
            console.error('❌ Error verificando sesión:', error);
            return false;
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    logout() {
        console.log('👋 Cerrando sesión:', this.currentUser?.email);
        this.currentUser = null;
        localStorage.removeItem(this.storageKey);
        
        // Redirigir al login
        if (!window.location.pathname.includes('index.html') && 
            !window.location.pathname.includes('login.html')) {
            window.location.href = 'index.html';
        }
    }

    // Gestión de usuarios
    getUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey) || '[]');
    }

    saveUsers(users) {
        localStorage.setItem(this.usersKey, JSON.stringify(users));
    }

    crearUsuario(usuarioData) {
        const usuarios = this.getUsers();
        const nuevoUsuario = {
            id: Date.now(),
            ...usuarioData,
            fecha_creacion: new Date().toISOString(),
            activo: true,
            ultimo_acceso: null
        };
        
        usuarios.push(nuevoUsuario);
        this.saveUsers(usuarios);
        console.log('👤 Nuevo usuario creado:', nuevoUsuario.email);
        return nuevoUsuario;
    }

    actualizarUsuario(id, usuarioData) {
        const usuarios = this.getUsers();
        const index = usuarios.findIndex(u => u.id === id);
        
        if (index !== -1) {
            usuarios[index] = { ...usuarios[index], ...usuarioData };
            this.saveUsers(usuarios);
            console.log('✏️ Usuario actualizado:', usuarios[index].email);
            return usuarios[index];
        }
        
        return null;
    }

    eliminarUsuario(id) {
        const usuarios = this.getUsers();
        const nuevosUsuarios = usuarios.filter(u => u.id !== id);
        this.saveUsers(nuevosUsuarios);
        console.log('🗑️ Usuario eliminado:', id);
        return true;
    }

    // Verificación de permisos
    tienePermiso(permiso) {
        if (!this.currentUser) return false;
        if (this.currentUser.role === 'admin') return true;
        
        return this.currentUser.permisos.includes(permiso);
    }

    // Cambio de contraseña
    cambiarPassword(usuarioId, nuevaPassword) {
        const usuarios = this.getUsers();
        const usuario = usuarios.find(u => u.id === usuarioId);
        
        if (usuario) {
            usuario.password = nuevaPassword;
            this.saveUsers(usuarios);
            console.log('🔑 Contraseña actualizada para:', usuario.email);
            return true;
        }
        
        return false;
    }

    // Verificación de seguridad
    validarFortalezaPassword(password) {
        const criterios = {
            longitud: password.length >= 8,
            mayuscula: /[A-Z]/.test(password),
            minuscula: /[a-z]/.test(password),
            numero: /[0-9]/.test(password),
            especial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        return {
            valida: Object.values(criterios).every(c => c),
            criterios: criterios
        };
    }
}

// Inicializar sistema de autenticación
window.auth = new AuthSystem();

// Protección de rutas
window.protectarRuta = function(permisosRequeridos = []) {
    if (!window.auth || !window.auth.checkAuth()) {
        console.log('🚫 Acceso no autorizado - Redirigiendo a login');
        window.location.href = 'index.html';
        return false;
    }

    const usuario = window.auth.getCurrentUser();
    
    // Admin tiene acceso total
    if (usuario.role === 'admin') {
        return true;
    }

    // Verificar permisos específicos
    const tienePermiso = permisosRequeridos.some(permiso => 
        window.auth.tienePermiso(permiso)
    );

    if (!tienePermiso && permisosRequeridos.length > 0) {
        console.log('🚫 Permisos insuficientes');
        alert('No tiene permisos para acceder a esta sección');
        window.location.href = 'dashboard.html';
        return false;
    }

    return true;
};

// Middleware para páginas protegidas
document.addEventListener('DOMContentLoaded', function() {
    // No proteger páginas de login
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname.includes('login.html')) {
        return;
    }

    // Verificar autenticación en otras páginas
    if (!window.auth || !window.auth.checkAuth()) {
        console.log('🔐 Redirigiendo al login...');
        window.location.href = 'index.html';
    }
});