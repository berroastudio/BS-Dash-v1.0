// js/supabase-manager.js - VERSIÓN MEJORADA Y CORREGIDA
console.log('🔌 SUPABASE MANAGER - Iniciando...');

class SupabaseManager {
    constructor() {
        this.supabase = null;
        this.isConnected = false;
        this.projectUrl = '';
        this.apiKey = '';
        this.currentUser = null;
        this.createClient = null;
        this.init();
    }

    async init() {
        console.log('🎯 Supabase Manager inicializando...');
        await this.loadSupabaseLibrary();
        this.loadConfig();
        await this.initializeFromConfig();
        console.log('✅ Supabase Manager listo');
    }

    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargada
            if (typeof createClient !== 'undefined') {
                console.log('✅ Supabase ya cargado');
                this.createClient = createClient;
                resolve();
                return;
            }

            console.log('📦 Cargando librería Supabase...');
            const maxAttempts = 10;
            let attempts = 0;

            const checkLibrary = () => {
                attempts++;
                
                if (typeof createClient !== 'undefined') {
                    console.log('✅ Supabase cargado después de ' + attempts + ' intentos');
                    this.createClient = createClient;
                    resolve();
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    console.error('❌ Timeout: Supabase no se cargó');
                    // Crear un fallback para createClient
                    this.createClient = this.createClientFallback;
                    resolve();
                    return;
                }
                
                setTimeout(checkLibrary, 300);
            };
            
            checkLibrary();
        });
    }

    // Fallback para createClient si la librería no carga
    createClientFallback(url, key, options) {
        console.warn('⚠️ Usando createClient fallback');
        // Retornar un objeto mock básico
        return {
            auth: {
                signIn: () => Promise.resolve({ data: null, error: new Error('No disponible') }),
                signOut: () => Promise.resolve({ error: null }),
                onAuthStateChange: () => ({ data: null, error: null })
            },
            from: () => ({
                select: () => ({
                    limit: () => Promise.resolve({ data: null, error: new Error('No disponible') })
                }),
                insert: () => Promise.resolve({ data: null, error: new Error('No disponible') })
            })
        };
    }

    loadConfig() {
        try {
            const config = JSON.parse(localStorage.getItem('bs_supabase_config') || '{}');
            this.projectUrl = config.url || '';
            this.apiKey = config.key || '';
            this.isConnected = config.enabled || false;
            
            console.log('📋 Configuración cargada:', {
                url: this.projectUrl ? '✓' : '✗',
                key: this.apiKey ? '✓' : '✗', 
                enabled: this.isConnected
            });
        } catch (error) {
            console.error('❌ Error cargando configuración:', error);
        }
    }

    async initializeFromConfig() {
        if (this.isConnected && this.projectUrl && this.apiKey) {
            console.log('🔄 Inicializando desde configuración guardada...');
            const success = this.initializeClient(this.projectUrl, this.apiKey);
            
            if (success) {
                // Probar conexión automáticamente
                setTimeout(async () => {
                    await this.testConnection();
                }, 1000);
            }
        }
    }

    initializeClient(url, key) {
        try {
            console.log('🔧 Inicializando cliente Supabase...');
            
            if (!url || !key) {
                throw new Error('URL o API Key faltantes');
            }

            if (!url.includes('supabase.co')) {
                throw new Error('URL debe ser: https://tu-proyecto.supabase.co');
            }

            if (!key.startsWith('eyJ')) {
                throw new Error('API Key debe comenzar con "eyJ"');
            }

            console.log('✅ Credenciales válidas, creando cliente...');

            // VERIFICACIÓN CRÍTICA: Asegurar que createClient existe
            if (!this.createClient || typeof this.createClient !== 'function') {
                throw new Error('createClient no está disponible. La librería Supabase no se cargó correctamente.');
            }

            // Usar la función createClient
            this.supabase = this.createClient(url, key, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                },
                db: { schema: 'public' }
            });

            this.projectUrl = url;
            this.apiKey = key;
            this.isConnected = true;
            
            console.log('✅ Cliente Supabase inicializado');
            this.saveConfig(url, key, true);
            
            return true;

        } catch (error) {
            console.error('❌ Error inicializando:', error);
            this.isConnected = false;
            
            // Guardar configuración pero marcada como no conectada
            this.saveConfig(url, key, false);
            
            return false;
        }
    }

    saveConfig(url, key, enabled) {
        const config = { 
            url, 
            key, 
            enabled, 
            lastUpdate: new Date().toISOString(),
            version: '2.0'
        };
        localStorage.setItem('bs_supabase_config', JSON.stringify(config));
        console.log('💾 Configuración guardada');
    }

    async testConnection() {
        if (!this.supabase) {
            return { success: false, message: 'Cliente no inicializado' };
        }

        try {
            console.log('🔌 Probando conexión...');
            
            // Probar con una consulta simple
            const { data, error } = await this.supabase
                .from('empresas')
                .select('count')
                .limit(1)
                .single();

            if (error) {
                // Intentar con otra tabla si empresas no existe
                const { error: error2 } = await this.supabase
                    .from('modulos_sistema')
                    .select('count')
                    .limit(1)
                    .single();

                if (error2) throw error2;
            }

            console.log('✅ Conexión exitosa');
            return { 
                success: true, 
                message: `Conexión establecida correctamente`,
                data: data 
            };

        } catch (error) {
            console.error('❌ Error en conexión:', error);
            return { 
                success: false, 
                message: `Error de conexión: ${error.message}`,
                error: error 
            };
        }
    }

    async inicializarDatosSistema() {
        if (!this.isConnected || !this.supabase) {
            return { success: false, message: 'No hay conexión con Supabase' };
        }

        try {
            console.log('🏗️ Inicializando datos del sistema...');

            // 1. Verificar si ya hay empresas
            const { data: empresasExistentes, error: errorEmpresas } = await this.supabase
                .from('empresas')
                .select('id')
                .limit(1);

            if (errorEmpresas && errorEmpresas.code !== 'PGRST116') {
                console.error('Error verificando empresas:', errorEmpresas);
            }

            // 2. Insertar empresa por defecto si no existe
            if (!empresasExistentes || empresasExistentes.length === 0) {
                const { data: nuevaEmpresa, error: errorInsert } = await this.supabase
                    .from('empresas')
                    .insert([
                        {
                            nombre: 'Berroa Studio S.R.L.',
                            rnc: '131246789',
                            telefono: '+1 809-555-0101',
                            email: 'info@berroastudio.com',
                            direccion: 'Santo Domingo, República Dominicana',
                            website: 'https://berroastudio.com',
                            eslogan: 'Soluciones tecnológicas innovadoras',
                            activo: true
                        }
                    ])
                    .select();

                if (errorInsert) {
                    throw new Error(`Error creando empresa: ${errorInsert.message}`);
                }

                console.log('✅ Empresa por defecto creada:', nuevaEmpresa);
            }

            // 3. Insertar módulos del sistema
            const modulos = [
                { id: 'dashboard', nombre: 'Dashboard', icono: 'bi-speedometer2', descripcion: 'Panel principal del sistema', url: 'dashboard.html', categoria: 'principal', siempre_activo: true, orden: 1 },
                { id: 'facturacion', nombre: 'Facturación', icono: 'bi-receipt', descripcion: 'Sistema completo de facturación', url: 'modules/facturacion.html', categoria: 'ventas', orden: 2 },
                { id: 'inventario', nombre: 'Inventario', icono: 'bi-box-seam', descripcion: 'Gestión de stock y productos', url: 'modules/inventario.html', categoria: 'operaciones', orden: 3 },
                { id: 'pos', nombre: 'Punto de Venta', icono: 'bi-cash-coin', descripcion: 'Sistema POS para ventas rápidas', url: 'modules/pos.html', categoria: 'ventas', orden: 4 },
                { id: 'clientes', nombre: 'Clientes', icono: 'bi-people', descripcion: 'Gestión de base de clientes', url: 'modules/clientes.html', categoria: 'ventas', orden: 5 },
                { id: 'reportes', nombre: 'Reportes', icono: 'bi-graph-up', descripcion: 'Análisis y reportes del sistema', url: 'modules/reportes.html', categoria: 'analisis', orden: 6 },
                { id: 'contabilidad', nombre: 'Contabilidad', icono: 'bi-calculator', descripcion: 'Sistema contable integrado', url: 'modules/contabilidad.html', categoria: 'finanzas', orden: 7 },
                { id: 'configuracion', nombre: 'Configuración', icono: 'bi-gear', descripcion: 'Configuración del sistema', url: 'configuracion.html', categoria: 'sistema', orden: 8 },
                { id: 'empresas', nombre: 'Empresas', icono: 'bi-buildings', descripcion: 'Gestión multiempresa', url: 'modules/empresas.html', categoria: 'administracion', orden: 9 },
                { id: 'usuarios', nombre: 'Usuarios', icono: 'bi-shield-check', descripcion: 'Gestión de usuarios y permisos', url: 'modules/usuarios.html', categoria: 'administracion', orden: 10 }
            ];

            // Insertar módulos uno por uno para evitar errores de duplicados
            for (const modulo of modulos) {
                const { error: errorModulo } = await this.supabase
                    .from('modulos_sistema')
                    .upsert(modulo, { onConflict: 'id' });

                if (errorModulo) {
                    console.warn(`⚠️ Error insertando módulo ${modulo.id}:`, errorModulo);
                }
            }

            console.log('✅ Módulos del sistema inicializados');

            return { 
                success: true, 
                message: 'Sistema inicializado correctamente. Datos base creados.' 
            };

        } catch (error) {
            console.error('❌ Error inicializando sistema:', error);
            return { 
                success: false, 
                message: `Error inicializando sistema: ${error.message}` 
            };
        }
    }

    async getEmpresas() {
        if (!this.isConnected || !this.supabase) {
            return { success: false, message: 'No hay conexión con Supabase' };
        }

        try {
            const { data, error } = await this.supabase
                .from('empresas')
                .select('*')
                .order('nombre');

            if (error) throw error;

            return { 
                success: true, 
                data: data || [],
                message: `Se encontraron ${data?.length || 0} empresas` 
            };

        } catch (error) {
            console.error('Error obteniendo empresas:', error);
            return { 
                success: false, 
                message: error.message,
                data: [] 
            };
        }
    }

    async getModulosSistema() {
        if (!this.isConnected || !this.supabase) {
            return { success: false, message: 'No hay conexión con Supabase' };
        }

        try {
            const { data, error } = await this.supabase
                .from('modulos_sistema')
                .select('*')
                .order('orden');

            if (error) throw error;

            return { 
                success: true, 
                data: data || [],
                message: `Se encontraron ${data?.length || 0} módulos` 
            };

        } catch (error) {
            console.error('Error obteniendo módulos:', error);
            return { 
                success: false, 
                message: error.message,
                data: [] 
            };
        }
    }

    async getModulosPorEmpresa(empresaId) {
        if (!this.isConnected || !this.supabase) {
            return { success: false, message: 'No hay conexión con Supabase' };
        }

        try {
            const { data, error } = await this.supabase
                .from('empresa_modulos')
                .select('modulo_id')
                .eq('empresa_id', empresaId)
                .eq('activo', true);

            if (error) throw error;

            return { 
                success: true, 
                data: data || [],
                message: `Se encontraron ${data?.length || 0} módulos activos` 
            };

        } catch (error) {
            console.error('Error obteniendo módulos de empresa:', error);
            return { 
                success: false, 
                message: error.message,
                data: [] 
            };
        }
    }

    async asignarModuloEmpresa(empresaId, moduloId, activo = true) {
        if (!this.isConnected || !this.supabase) {
            return { success: false, message: 'No hay conexión con Supabase' };
        }

        try {
            const { data, error } = await this.supabase
                .from('empresa_modulos')
                .upsert({
                    empresa_id: empresaId,
                    modulo_id: moduloId,
                    activo: activo
                }, {
                    onConflict: 'empresa_id,modulo_id'
                });

            if (error) throw error;

            return { 
                success: true, 
                data: data,
                message: `Módulo ${activo ? 'activado' : 'desactivado'} correctamente` 
            };

        } catch (error) {
            console.error('Error asignando módulo:', error);
            return { 
                success: false, 
                message: error.message 
            };
        }
    }

    disconnect() {
        this.supabase = null;
        this.isConnected = false;
        this.saveConfig(this.projectUrl, this.apiKey, false);
        console.log('🔌 Cliente Supabase desconectado');
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            projectUrl: this.projectUrl,
            hasApiKey: !!this.apiKey,
            hasClient: !!this.supabase,
            currentUser: this.currentUser
        };
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    async diagnosticarConexionCompleta() {
        console.group('🔍 DIAGNÓSTICO SUPABASE COMPLETO');
        
        console.log('1. ✅ Manager inicializado:', this !== null);
        console.log('2. 🔌 Estado conexión:', this.isConnected);
        console.log('3. 🌐 URL proyecto:', this.projectUrl);
        console.log('4. 🔑 API Key presente:', !!this.apiKey);
        console.log('5. 🛠️ Cliente creado:', !!this.supabase);
        console.log('6. 📦 createClient disponible:', !!this.createClient);
        
        if (this.isConnected && this.supabase) {
            console.log('7. 🧪 Probando conexión...');
            const testResult = await this.testConnection();
            console.log('8. 📊 Resultado prueba:', testResult.success ? '✅ CONEXIÓN EXITOSA' : '❌ FALLO CONEXIÓN');
            
            if (testResult.success) {
                console.log('9. 🗃️ Verificando tablas...');
                
                // Verificar empresas
                const empresasResult = await this.getEmpresas();
                console.log('   - Empresas:', empresasResult.success ? `✅ ${empresasResult.data?.length || 0} encontradas` : '❌ Error');
                
                // Verificar módulos
                const modulosResult = await this.getModulosSistema();
                console.log('   - Módulos:', modulosResult.success ? `✅ ${modulosResult.data?.length || 0} encontrados` : '❌ Error');
                
                console.log('10. 🎉 DIAGNÓSTICO COMPLETADO: SISTEMA OPERATIVO');
            } else {
                console.log('9. ❌ DIAGNÓSTICO FALLIDO: Problemas de conexión');
            }
        } else {
            console.log('7. ❌ No se puede diagnosticar: Sin conexión activa');
        }
        
        console.groupEnd();
        
        return this.isConnected;
    }

    logout() {
        if (this.supabase) {
            this.supabase.auth.signOut();
        }
        this.currentUser = null;
        localStorage.removeItem('bs_dash_auth');
        localStorage.removeItem('bs_dash_user');
        localStorage.removeItem('bs_user_session');
        console.log('👋 Sesión cerrada');
    }
}

// ✅ INICIALIZACIÓN GLOBAL MEJORADA
async function initializeSupabaseManager() {
    try {
        console.log('🎯 Inicializando Supabase Manager global...');
        
        // Crear instancia global
        window.supabaseManager = new SupabaseManager();
        
        // Esperar a que se inicialice completamente
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('🎉 Supabase Manager inicializado correctamente');
        return window.supabaseManager;
        
    } catch (error) {
        console.error('💥 Error crítico inicializando Supabase Manager:', error);
        
        // Fallback mínimo
        window.supabaseManager = {
            isConnected: false,
            supabase: null,
            getStatus: () => ({ isConnected: false, hasClient: false }),
            initializeClient: () => false,
            testConnection: async () => ({ success: false, message: 'Manager no disponible' }),
            diagnosticarConexionCompleta: () => console.log('❌ Manager no disponible')
        };
        
        return window.supabaseManager;
    }
}

// ✅ INICIAR INMEDIATAMENTE
initializeSupabaseManager();

// Función global para diagnóstico rápido
window.diagnosticarSupabase = function() {
    if (window.supabaseManager && window.supabaseManager.diagnosticarConexionCompleta) {
        return window.supabaseManager.diagnosticarConexionCompleta();
    } else {
        console.error('❌ SupabaseManager no disponible');
        return false;
    }
};