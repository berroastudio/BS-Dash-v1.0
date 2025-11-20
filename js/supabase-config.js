// js/supabase-config.js - Configuración simplificada de Supabase
console.log('⚙️ Supabase Config cargado');

class SupabaseConfig {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            return JSON.parse(localStorage.getItem('bs_supabase_config') || '{}');
        } catch (error) {
            console.error('Error cargando configuración:', error);
            return {};
        }
    }

    saveConfig(url, key) {
        const config = {
            url: url,
            key: key,
            enabled: true,
            lastUpdate: new Date().toISOString()
        };
        
        localStorage.setItem('bs_supabase_config', JSON.stringify(config));
        console.log('✅ Configuración Supabase guardada');
        return config;
    }

    validateConfig(url, key) {
        const errors = [];
        
        if (!url) errors.push('URL de Supabase es requerida');
        if (!key) errors.push('API Key es requerida');
        if (url && !url.includes('supabase.co')) errors.push('URL de Supabase inválida');
        if (key && key.length < 20) errors.push('API Key parece inválida');
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    getConfig() {
        return this.config;
    }

    resetConfig() {
        localStorage.removeItem('bs_supabase_config');
        this.config = {};
        console.log('🔄 Configuración Supabase reseteada');
    }
}

// Inicializar globalmente
window.supabaseConfig = new SupabaseConfig();