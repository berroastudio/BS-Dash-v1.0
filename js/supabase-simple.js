// js/supabase-simple.js - VERSIÓN ULTRA SIMPLE
console.log('🚀 SUPABASE ULTRA SIMPLE - Iniciando...');

class SupabaseSimple {
    constructor() {
        this.supabase = null;
        this.isConnected = false;
        this.config = null;
        console.log('🎯 Constructor SupabaseSimple llamado');
        this.init();
    }

    init() {
        console.log('🔧 Inicializando SupabaseSimple...');
        this.loadConfig();
        
        console.log('📊 Configuración actual:', this.config);
        
        if (this.config && this.config.enabled && this.config.url && this.config.key) {
            console.log('🔌 Intentando conectar con Supabase...');
            this.initializeClient();
        } else {
            console.log('ℹ️ Supabase no configurado o deshabilitado');
        }
    }

    loadConfig() {
        try {
            const configStr = localStorage.getItem('bs_supabase_config');
            console.log('📋 Configuración en localStorage:', configStr);
            
            this.config = JSON.parse(configStr || '{}');
            console.log('✅ Configuración cargada:', this.config);
        } catch (error) {
            console.error('❌ Error cargando configuración:', error);
            this.config = { enabled: false };
        }
    }

    initializeClient() {
        try {
            console.log('🔄 Inicializando cliente Supabase...');
            console.log('📡 URL:', this.config.url);
            console.log('🔑 API Key presente:', !!this.config.key);
            console.log('📦 createClient disponible:', typeof createClient);
            
            if (!this.config.url || !this.config.key) {
                console.error('❌ URL o API Key faltantes');
                return false;
            }

            if (typeof createClient === 'undefined') {
                console.error('❌ createClient no está disponible en el navegador');
                console.log('💡 Asegúrate de que el script de Supabase esté cargado');
                return false;
            }

            // Crear cliente de manera MUY simple
            console.log('🎯 Creando cliente Supabase...');
            this.supabase = createClient(this.config.url, this.config.key, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true
                }
            });

            console.log('✅ Cliente Supabase creado:', !!this.supabase);
            this.isConnected = true;
            
            console.log('🎉 CONEXIÓN EXITOSA CON SUPABASE');
            return true;

        } catch (error) {
            console.error('💥 ERROR CRÍTICO inicializando Supabase:', error);
            console.error('🔧 Detalles del error:', {
                message: error.message,
                stack: error.stack
            });
            this.isConnected = false;
            return false;
        }
    }

    async testConnection() {
        console.log('🔍 Iniciando test de conexión...');
        console.log('📊 Estado actual:', {
            hasClient: !!this.supabase,
            isConnected: this.isConnected,
            config: this.config
        });

        if (!this.supabase) {
            console.error('❌ Cliente no inicializado en testConnection');
            return { 
                success: false, 
                message: 'Cliente Supabase no inicializado. Verifica la configuración.' 
            };
        }

        try {
            console.log('🔌 Probando consulta a Supabase...');
            
            // Probar con una consulta simple a una tabla común
            const { data, error } = await this.supabase
                .from('empresas')
                .select('count')
                .limit(1);

            console.log('📨 Respuesta de Supabase:', { data, error });

            if (error) {
                console.error('❌ Error en consulta Supabase:', error);
                return { 
                    success: false, 
                    message: `Error de conexión: ${error.message}`,
                    error: error 
                };
            }

            console.log('✅ Test de conexión exitoso');
            return { 
                success: true, 
                message: 'Conexión con Supabase establecida correctamente',
                data: data 
            };

        } catch (error) {
            console.error('💥 Error en test de conexión:', error);
            return { 
                success: false, 
                message: `Error: ${error.message}`,
                error: error 
            };
        }
    }

    async inicializarDatosSistema() {
        console.log('🏗️ Inicializando datos del sistema...');
        
        if (!this.supabase) {
            console.error('❌ Cliente no inicializado para inicializar datos');
            return { success: false, message: 'Cliente no inicializado' };
        }

        try {
            // 1. Crear empresa por defecto
            console.log('🏢 Creando empresa por defecto...');
            const empresaPorDefecto = {
                nombre: 'Berroa Studio S.R.L.',
                rnc: '131456789',
                telefono: '(809) 123-4567',
                email: 'info@berroastudio.com',
                direccion: 'Santo Domingo, República Dominicana',
                website: 'https://berroastudio.com',
                eslogan: 'Soluciones digitales innovadoras'
            };

            const { data: empresa, error: errorEmpresa } = await this.supabase
                .from('empresas')
                .insert([empresaPorDefecto])
                .select();

            if (errorEmpresa) {
                console.error('❌ Error creando empresa:', errorEmpresa);
                // Puede ser que ya exista, no es necesariamente un error
            } else {
                console.log('✅ Empresa creada:', empresa);
            }

            // 2. Crear módulos del sistema
            console.log('🧩 Creando módulos del sistema...');
            const modulosSistema = [
                { id: 'dashboard', nombre: 'Dashboard', icono: 'bi-speedometer2', descripcion: 'Panel principal del sistema', url: 'dashboard.html', categoria: 'principal', siempre_activo: true, orden: 1 },
                { id: 'facturacion', nombre: 'Facturación', icono: 'bi-receipt', descripcion: 'Sistema completo de facturación', url: 'modules/facturacion.html', categoria: 'ventas', orden: 2 },
                { id: 'inventario', nombre: 'Inventario', icono: 'bi-box-seam', descripcion: 'Gestión de stock y productos', url: 'modules/inventario.html', categoria: 'operaciones', orden: 3 }
            ];

            for (const modulo of modulosSistema) {
                const { error: errorModulo } = await this.supabase
                    .from('modulos_sistema')
                    .upsert(modulo, { onConflict: 'id' });

                if (errorModulo) {
                    console.error(`⚠️ Error con módulo ${modulo.id}:`, errorModulo);
                } else {
                    console.log(`✅ Módulo ${modulo.id} procesado`);
                }
            }

            console.log('🎉 Inicialización de datos completada');
            return { 
                success: true, 
                message: 'Sistema inicializado correctamente en Supabase' 
            };

        } catch (error) {
            console.error('💥 Error inicializando datos:', error);
            return { 
                success: false, 
                message: `Error: ${error.message}` 
            };
        }
    }

    getStatus() {
        const status = {
            isConnected: this.isConnected,
            hasClient: !!this.supabase,
            projectUrl: this.config?.url || '',
            hasApiKey: !!(this.config?.key),
            configEnabled: !!(this.config?.enabled)
        };
        
        console.log('📊 Estado de SupabaseSimple:', status);
        return status;
    }
}

// Inicialización global INMEDIATA
console.log('🎯 CREANDO INSTANCIA GLOBAL DE SUPABASE SIMPLE...');
window.supabaseSimple = new SupabaseSimple();
console.log('✅ SupabaseSimple inicializado:', window.supabaseSimple.getStatus());