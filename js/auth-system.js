// js/auth-system.js - Sistema de autenticación unificado y estable
class AuthSystem {
    constructor() {
        this.db = new SecureDatabase();
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkExistingSession();
    }

    /**
     * Verifica si existe una sesión activa y la mantiene
     */
    checkExistingSession() {
        try {
            const session = localStorage.getItem('bs_dash_session');
            if (session) {
                const sessionData = JSON.parse(session);

                // Verificar si la sesión no ha expirado (24 horas)
                if (sessionData.expiresAt > Date.now() && sessionData.user) {
                    this.currentUser = sessionData.user;

                    // Sincronizar compatibilidad con config-manager
                    localStorage.setItem('bs_dash_user', JSON.stringify(this.currentUser));

                    console.log('✅ Sesión activa encontrada:', this.currentUser.email);
                    return { active: true, user: this.currentUser };
                } else {
                    this.logout();
                }
            }
        } catch (error) {
            console.error('⚠️ Error verificando sesión:', error);
            this.logout();
        }
        return { active: false };
    }

    /**
     * Inicia sesión con email o usuario
     */
    async login(identifier, password) {
        try {
            console.log('🔐 Intentando login con:', identifier);

            // Buscar usuario por email o username
            let usuario = this.db.getUsuarioByEmail(identifier);
            if (!usuario) {
                usuario = this.db.getUsuarioByUsername(identifier);
            }

            if (!usuario) throw new Error('Usuario no encontrado');
            if (!usuario.activo) throw new Error('Usuario desactivado');

            // Verificar contraseña
            if (!this.db.verifyPassword(password, usuario.password)) {
                throw new Error('Contraseña incorrecta');
            }

            // Crear sesión válida por 24 horas
            const sessionData = {
                user: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    username: usuario.username,
                    rol: usuario.rol,
                    empresa_id: usuario.empresa_id,
                    permisos: usuario.permisos || []
                },
                loginTime: Date.now(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
            };

            // Guardar sesión
            localStorage.setItem('bs_dash_session', JSON.stringify(sessionData));
            localStorage.setItem('bs_dash_user', JSON.stringify(sessionData.user)); // compatibilidad
            this.currentUser = sessionData.user;

            console.log('✅ Login exitoso:', usuario.email);
            return { success: true, user: this.currentUser };

        } catch (error) {
            console.error('❌ Error en login:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cierra sesión y limpia almacenamiento
     */
    logout() {
        localStorage.removeItem('bs_dash_session');
        localStorage.removeItem('bs_dash_user');
        this.currentUser = null;
        console.log('👋 Sesión cerrada');
    }

    /**
     * Verifica si hay usuario autenticado en memoria
     */
    checkAuth() {
        return this.currentUser !== null;
    }

    /**
     * Devuelve el usuario actual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    // ============ Gestión de usuarios ============

    getUsers() {
        return this.db.getUsuarios();
    }

    crearUsuario(datos) {
        if (!datos.password) throw new Error('La contraseña es requerida');

        const usuarioData = {
            ...datos,
            password: this.db.hashPassword(datos.password)
        };

        return this.db.crearUsuario(usuarioData);
    }

    actualizarUsuario(id, datos) {
        if (datos.password) {
            datos.password = this.db.hashPassword(datos.password);
        }
        return this.db.actualizarUsuario(id, datos);
    }

    eliminarUsuario(id) {
        if (id === 1) {
            throw new Error('No se puede eliminar el usuario administrador principal');
        }
        return this.actualizarUsuario(id, { activo: false });
    }
}

window.AuthSystem = AuthSystem;
