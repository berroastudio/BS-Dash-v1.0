// js/secure-database.js - Base de datos mejorada
class SecureDatabase {
    constructor() {
        this.prefix = 'bs_dash_';
        this.encryptionKey = 'bs_dash_secure_key';
    }

    // Estructura inicial de la base de datos
    initializeDatabase() {
        const baseStructure = {
            version: '2.0.0',
            empresas: [
                {
                    id: 1,
                    nombre: 'Berroa Studio S.R.L.',
                    rif: '131456789',
                    telefono: '(809) 123-4567',
                    email: 'info@berroastudio.com',
                    direccion: 'Santo Domingo, República Dominicana',
                    website: 'https://berroastudio.com',
                    eslogan: 'Soluciones digitales innovadoras',
                    color: '#3B82F6',
                    activa: true,
                    fecha_creacion: new Date().toISOString()
                }
            ],
            usuarios: [
                {
                    id: 1,
                    nombre: 'Administrador',
                    username: 'admin',
                    email: 'admin@berroastudio.com',
                    password: this.hashPassword('809415'),
                    rol: 'admin',
                    empresa_id: 1,
                    activo: true,
                    permisos: ['*'],
                    fecha_creacion: new Date().toISOString()
                }
            ],
            modulos: {
                empresa_1: ['dashboard', 'facturacion', 'inventario', 'clientes', 'reportes', 'configuracion', 'usuarios', 'empresas', 'pos', 'backups', 'onedrive']
            },
            configuracion: {
                sistema: {
                    darkMode: true,
                    notificaciones: true,
                    autoguardado: true,
                    idioma: 'es',
                    zonaHoraria: 'America/Santo_Domingo'
                },
                onedrive: {
                    clientId: '',
                    tenantId: 'common',
                    autoBackup: false,
                    syncRealTime: false
                },
                smtp: {
                    server: '',
                    port: 587,
                    email: '',
                    security: 'tls'
                }
            }
        };

        localStorage.setItem(this.prefix + 'database', JSON.stringify(baseStructure));
        return baseStructure;
    }

    hashPassword(password) {
        // Hash simple para desarrollo (en producción usar bcrypt)
        return btoa(password + '_bs_dash_salt');
    }

    verifyPassword(inputPassword, storedHash) {
        return this.hashPassword(inputPassword) === storedHash;
    }

    getDatabase() {
        const db = localStorage.getItem(this.prefix + 'database');
        if (!db) {
            return this.initializeDatabase();
        }
        return JSON.parse(db);
    }

    saveDatabase(data) {
        localStorage.setItem(this.prefix + 'database', JSON.stringify(data));
    }

    // Métodos específicos
    getEmpresas() {
        const db = this.getDatabase();
        return db.empresas || [];
    }

    getEmpresa(id) {
        const empresas = this.getEmpresas();
        return empresas.find(e => e.id.toString() === id.toString());
    }

    getUsuarios() {
        const db = this.getDatabase();
        return db.usuarios || [];
    }

    getUsuarioByEmail(email) {
        const usuarios = this.getUsuarios();
        return usuarios.find(u => u.email === email);
    }

    getUsuarioByUsername(username) {
        const usuarios = this.getUsuarios();
        return usuarios.find(u => u.username === username);
    }

    crearUsuario(usuarioData) {
        const db = this.getDatabase();
        const nuevoId = Math.max(...db.usuarios.map(u => u.id), 0) + 1;
        
        const usuario = {
            id: nuevoId,
            ...usuarioData,
            fecha_creacion: new Date().toISOString(),
            activo: true
        };

        db.usuarios.push(usuario);
        this.saveDatabase(db);
        return usuario;
    }

    actualizarUsuario(id, datos) {
        const db = this.getDatabase();
        const index = db.usuarios.findIndex(u => u.id.toString() === id.toString());
        
        if (index !== -1) {
            db.usuarios[index] = { ...db.usuarios[index], ...datos };
            this.saveDatabase(db);
            return db.usuarios[index];
        }
        return null;
    }
}

window.SecureDatabase = SecureDatabase;