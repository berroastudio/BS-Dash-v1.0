// js/database-manager.js - Database manager corregido
class DatabaseManager {
    constructor() {
        this.secureDB = new SecureDatabase();
        this.currentEmpresa = '1';
        this.init();
    }

    init() {
        console.log('🗄️ Inicializando Database Manager...');
        this.loadCurrentEmpresa();
    }

    loadCurrentEmpresa() {
        const empresaGuardada = localStorage.getItem('bs_current_empresa');
        if (empresaGuardada) {
            this.currentEmpresa = empresaGuardada;
        }
    }

    // Métodos de empresas
    getEmpresas() {
        return this.secureDB.getEmpresas();
    }

    getEmpresa(id = null) {
        const empresaId = id || this.currentEmpresa;
        return this.secureDB.getEmpresa(empresaId);
    }

    crearEmpresa(nombre, rif, direccion, telefono, color = '#3B82F6') {
        const db = this.secureDB.getDatabase();
        const nuevoId = Math.max(...db.empresas.map(e => e.id), 0) + 1;
        
        const nuevaEmpresa = {
            id: nuevoId,
            nombre,
            rif,
            direccion,
            telefono,
            color,
            email: '',
            website: '',
            eslogan: '',
            activa: true,
            fecha_creacion: new Date().toISOString()
        };

        db.empresas.push(nuevaEmpresa);
        this.secureDB.saveDatabase(db);

        // Crear módulos por defecto para la nueva empresa
        this.initializeModulosEmpresa(nuevoId);

        return nuevaEmpresa;
    }

    initializeModulosEmpresa(empresaId) {
        const modulosPorDefecto = [
            'dashboard', 'facturacion', 'inventario', 'clientes', 
            'reportes', 'configuracion'
        ];
        
        const db = this.secureDB.getDatabase();
        db.modulos[`empresa_${empresaId}`] = modulosPorDefecto;
        this.secureDB.saveDatabase(db);
    }

    // Métodos de backup
    backup() {
        try {
            const db = this.secureDB.getDatabase();
            const backupData = {
                ...db,
                backup_timestamp: new Date().toISOString(),
                version: '2.0.0'
            };

            const backups = JSON.parse(localStorage.getItem('bs_backups') || '[]');
            backups.unshift({
                nombre: `backup-${new Date().toISOString().split('T')[0]}.json`,
                fecha: new Date().toISOString(),
                tamaño: JSON.stringify(backupData).length / 1024 / 1024, // MB
                tipo: 'completo',
                data: backupData
            });

            // Mantener solo los últimos 10 backups
            if (backups.length > 10) {
                backups.splice(10);
            }

            localStorage.setItem('bs_backups', JSON.stringify(backups));
            return true;
        } catch (error) {
            console.error('Error en backup:', error);
            return false;
        }
    }

    getInfo() {
        const db = this.secureDB.getDatabase();
        return {
            multiempresa: true,
            empresas: db.empresas.length,
            usuarios: db.usuarios.length,
            version: db.version
        };
    }

    // Métodos de módulos
    getModulosEmpresa(empresaId = null) {
        const id = empresaId || this.currentEmpresa;
        const db = this.secureDB.getDatabase();
        return db.modulos[`empresa_${id}`] || [];
    }

    setModulosEmpresa(empresaId, modulos) {
        const db = this.secureDB.getDatabase();
        db.modulos[`empresa_${empresaId}`] = modulos;
        this.secureDB.saveDatabase(db);
    }
}

window.DatabaseManager = DatabaseManager;