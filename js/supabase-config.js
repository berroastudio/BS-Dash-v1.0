// js/supabase-config.js - Configuración corregida de Supabase
console.log('🔧 Cargando supabase-config.js...');

class SupabaseConfig {
    constructor() {
        this.supabase = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        try {
            // Configuración de Supabase - REEMPLAZA CON TUS DATOS REALES
            const supabaseConfig = {
                url: 'https://tu-proyecto.supabase.co',
                anonKey: 'tu-anon-key-aqui'
            };

            // Verificar configuración mínima
            if (!supabaseConfig.url || !supabaseConfig.anonKey || 
                supabaseConfig.url.includes('tu-proyecto') || 
                supabaseConfig.anonKey.includes('tu-anon-key')) {
                console.warn('⚠️ Configuración de Supabase no completada');
                this.createFallbackSystem();
                return;
            }

            // Inicializar Supabase
            this.supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
            this.isInitialized = true;
            
            console.log('✅ Supabase configurado correctamente');
            this.testConnection();
            
        } catch (error) {
            console.error('❌ Error inicializando Supabase:', error);
            this.createFallbackSystem();
        }
    }

    async testConnection() {
        if (!this.isInitialized) return;
        
        try {
            const { data, error } = await this.supabase
                .from('empresas')
                .select('count')
                .limit(1);
            
            if (error) throw error;
            
            console.log('✅ Conexión a Supabase verificada');
            return true;
        } catch (error) {
            console.error('❌ Error conectando a Supabase:', error);
            this.createFallbackSystem();
            return false;
        }
    }

    createFallbackSystem() {
        console.log('🔄 Usando sistema de respaldo con localStorage');
        // El sistema funcionará con localStorage como respaldo
        this.isInitialized = false;
    }

    getClient() {
        return this.supabase;
    }

    isReady() {
        return this.isInitialized;
    }
}

// Inicializar y hacer global
window.supabaseConfig = new SupabaseConfig();