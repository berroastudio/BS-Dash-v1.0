// js/database-manager.js - VERSIÓN COMPATIBLE CON MULTIEMPRESAS
console.log('📊 Cargando database-manager.js...');

class DatabaseManager {
    constructor() {
        this.storageKey = 'bs_dash_multiempresa_data';
        this.init();
        console.log('✅ Database manager inicializado para multiempresas');
    }

    init() {
        // Inicializar datos de empresas si no existen
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                empresas: [
                    {
                        id: 1,
                        nombre: 'Empresa Principal',
                        rif: 'J-123456789',
                        direccion: 'Caracas, Venezuela',
                        telefono: '+584123456789',
                        color: '#3B82F6'
                    }
                ],
                usuarios: [],
                ventas: [],
                productos: []
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialData));
        }
    }

    getInfo() {
        return { status: 'active', version: '1.0', multiempresa: true };
    }

    // Métodos para empresas (compatibilidad con empresa-context.js)
    getEmpresas() {
        const data = JSON.parse(localStorage.getItem(this.storageKey) || '{"empresas":[]}');
        return data.empresas;
    }

    getEmpresa(id) {
        const empresas = this.getEmpresas();
        return empresas.find(emp => emp.id.toString() === id.toString());
    }

    crearEmpresa(nombre, rif, direccion, telefono, color) {
        const data = JSON.parse(localStorage.getItem(this.storageKey));
        const nuevaEmpresa = {
            id: Date.now(),
            nombre,
            rif,
            direccion,
            telefono,
            color
        };
        data.empresas.push(nuevaEmpresa);
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        return nuevaEmpresa;
    }

    getEstadisticas(empresaId) {
        // Estadísticas simuladas
        return {
            ventas: 15000,
            productos: 45,
            productosBajoStock: 3,
            ordenesPendientes: 7,
            clientes: 23
        };
    }
}

window.dbManager = new DatabaseManager();