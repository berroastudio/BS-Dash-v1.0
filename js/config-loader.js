// js/config-loader.js - Cargador seguro de configuración
class ConfigLoader {
    static load() {
        console.log('🔄 Cargando configuración...');
        
        try {
            // Verificar si existe configuración personalizada
            if (typeof CONFIG !== 'undefined' && CONFIG.ENCRYPTION_KEY) {
                console.log('✅ Configuración personalizada cargada correctamente');
                
                // Validar configuración mínima
                if (CONFIG.ENCRYPTION_KEY.includes('cambiar-por-clave')) {
                    console.error('❌ ERROR: No has configurado ENCRYPTION_KEY en config.js');
                    alert('ERROR: Debes configurar la clave de encriptación en config.js');
                    return this.getDefaultConfig();
                }
                
                return CONFIG;
            }
        } catch (error) {
            console.warn('⚠️ Configuración personalizada no encontrada:', error);
        }
        
        console.warn('⚠️ Usando configuración por defecto (menos segura)');
        return this.getDefaultConfig();
    }
    
    static getDefaultConfig() {
        // Configuración por defecto para desarrollo
        return {
            ENCRYPTION_KEY: 'bs-dash-dev-key-0722' + btoa(navigator.userAgent + Date.now()),
            ADMIN_EMAIL: 'jberroa@berroastudio.com',
            ADMIN_PASSWORD: 'RnKxNohk3vmTmKBm809415',
            DEFAULT_EMPRESA: 1,
            SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
            BACKUP_INTERVAL: 24 * 60 * 60 * 1000,
            APP_NAME: 'BS Dashboard',
            APP_VERSION: '1.0.0'
        };
    }
}

// Cargar y hacer disponible globalmente
window.CONFIG = ConfigLoader.load();
console.log('🎯 Configuración cargada:', {
    app: window.CONFIG.APP_NAME,
    version: window.CONFIG.APP_VERSION,
    empresa: window.CONFIG.DEFAULT_EMPRESA
});