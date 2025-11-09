// js/config-loader.js - Cargador de configuración
console.log('⚙️ Cargando configuración del sistema...');

class ConfigLoader {
    constructor() {
        this.config = {};
        this.load();
    }

    load() {
        // Configuración por defecto
        this.config = {
            APP_NAME: 'BS Dash',
            APP_VERSION: '2.0.0',
            DEFAULT_EMPRESA: '1',
            MODULOS_POR_DEFECTO: [
                'dashboard', 'facturacion', 'inventario', 'clientes', 
                'reportes', 'configuracion'
            ],
            ROLES: {
                admin: 'Administrador',
                gerente: 'Gerente', 
                vendedor: 'Vendedor',
                inventario: 'Inventario',
                reportes: 'Solo Reportes'
            }
        };

        // Cargar configuración desde localStorage
        try {
            const savedConfig = localStorage.getItem('bs_system_config');
            if (savedConfig) {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }

        window.CONFIG = this.config;
        console.log('✅ Configuración cargada:', this.config);
    }

    save(config) {
        try {
            this.config = { ...this.config, ...config };
            localStorage.setItem('bs_system_config', JSON.stringify(this.config));
            window.CONFIG = this.config;
            console.log('✅ Configuración guardada');
        } catch (error) {
            console.error('Error guardando configuración:', error);
        }
    }
}

// Inicializar inmediatamente
window.configLoader = new ConfigLoader();