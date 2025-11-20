// js/config-manager.js - Gestor completo de configuración MEJORADO
console.log('🎛️ Cargando config-manager.js mejorado...');

class ConfiguracionManager {
    constructor() {
        this.ventanaActual = 'empresa';
        this.empresaActual = window.CONFIG?.DEFAULT_EMPRESA?.toString() || '1';
        this.supabase = null;
        this.supabaseManager = null;
        this.secuenciaEditando = null;
        this.plantillaEditando = null;
        this.oneDriveManager = null;
        this.supabaseInitialized = false;
        this.init();
    }

    async init() {
        console.log('🎯 Inicializando sistema de configuración mejorado...');
        
        // Verificar autenticación
        if (!this.verificarAutenticacion()) {
            return;
        }

        // Esperar a que Supabase Manager esté listo
        await this.esperarSupabaseManager();
        
        // Inicializar otros managers
        await this.inicializarManagers();
        
        // Cargar configuración
        await this.cargarTodaConfiguracion();
        
        console.log('✅ Sistema de configuración mejorado listo');
    }

    async esperarSupabaseManager() {
        console.log('⏳ Esperando Supabase Manager...');
        
        return new Promise((resolve) => {
            const checkManager = () => {
                if (window.supabaseManager && typeof window.supabaseManager.getStatus === 'function') {
                    this.supabaseManager = window.supabaseManager;
                    this.supabase = window.supabaseManager.supabase;
                    this.supabaseInitialized = window.supabaseManager.isConnected;
                    console.log('✅ Supabase Manager listo');
                    resolve();
                    return;
                }
                
                setTimeout(checkManager, 100);
            };
            
            // Timeout después de 10 segundos
            setTimeout(() => {
                console.warn('⚠️ Timeout esperando Supabase Manager - Continuando sin conexión');
                resolve();
            }, 10000);
            
            checkManager();
        });
    }

    async inicializarManagers() {
        console.log('🔧 Inicializando otros managers...');
        
        // Inicializar OneDrive Manager si hay configuración
        const oneDriveConfig = JSON.parse(localStorage.getItem('bs_onedrive_config') || '{}');
        if (oneDriveConfig.clientId && oneDriveConfig.clientId !== 'demo_client_id') {
            try {
                // Cargar dinámicamente si existe
                if (typeof OneDriveManager !== 'undefined') {
                    this.oneDriveManager = new OneDriveManager(oneDriveConfig.clientId, oneDriveConfig.tenantId);
                    this.oneDriveManager.loadAuthData();
                }
            } catch (error) {
                console.warn('⚠️ No se pudo inicializar OneDrive Manager:', error);
            }
        }
    }

    verificarAutenticacion() {
        try {
            // Primero verificar con Supabase Manager si está disponible
            if (this.supabaseManager && this.supabaseManager.isAuthenticated) {
                const autenticado = this.supabaseManager.isAuthenticated();
                if (!autenticado) {
                    window.location.href = '../index.html';
                    return false;
                }
                return true;
            }

            // Fallback: verificar autenticación local
            const user = localStorage.getItem('bs_dash_user');
            const auth = localStorage.getItem('bs_dash_auth');
            
            if (!user || auth !== 'true') {
                window.location.href = '../index.html';
                return false;
            }
            
            const userData = JSON.parse(user);
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userData.name || userData.email || 'Usuario';
            }
            
            return true;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            window.location.href = '../index.html';
            return false;
        }
    }

    // ==================== CONFIGURACIÓN EMPRESA (ACTUALIZADA) ====================
    async cargarConfigEmpresa() {
        try {
            if (this.supabaseManager && this.supabaseManager.isConnected) {
                // Cargar desde Supabase
                const empresaId = this.obtenerEmpresaActualId();
                if (empresaId) {
                    const { data: empresa, error } = await this.supabase
                        .from('empresas')
                        .select('*')
                        .eq('id', empresaId)
                        .single();

                    if (!error && empresa) {
                        this.actualizarFormularioEmpresa(empresa);
                        return;
                    }
                }
            }

            // Fallback: cargar desde localStorage
            const empresa = this.obtenerEmpresaLocal();
            if (empresa) {
                this.actualizarFormularioEmpresa(empresa);
            }
        } catch (error) {
            console.error('Error cargando configuración de empresa:', error);
        }
    }

    actualizarFormularioEmpresa(empresa) {
        document.getElementById('empresaNombre').value = empresa.nombre || '';
        document.getElementById('empresaRNC').value = empresa.rnc || empresa.rif || '';
        document.getElementById('empresaTelefono').value = empresa.telefono || '';
        document.getElementById('empresaEmail').value = empresa.email || '';
        document.getElementById('empresaDireccion').value = empresa.direccion || '';
        document.getElementById('empresaWebsite').value = empresa.website || '';
        document.getElementById('empresaEslogan').value = empresa.eslogan || '';
    }

    obtenerEmpresaLocal() {
        if (window.dbManager) {
            return window.dbManager.getEmpresa(this.empresaActual);
        }
        
        const data = JSON.parse(localStorage.getItem('bs_dash_multiempresa_data') || '{}');
        return data.empresas?.find(e => e.id.toString() === this.empresaActual);
    }

    async guardarConfigEmpresa() {
        try {
            const datos = {
                nombre: document.getElementById('empresaNombre').value,
                rnc: document.getElementById('empresaRNC').value,
                telefono: document.getElementById('empresaTelefono').value,
                email: document.getElementById('empresaEmail').value,
                direccion: document.getElementById('empresaDireccion').value,
                website: document.getElementById('empresaWebsite').value,
                eslogan: document.getElementById('empresaEslogan').value,
                updated_at: new Date().toISOString()
            };

            if (this.supabaseManager && this.supabaseManager.isConnected) {
                // Guardar en Supabase
                const empresaId = this.obtenerEmpresaActualId();
                if (empresaId) {
                    const { error } = await this.supabase
                        .from('empresas')
                        .update(datos)
                        .eq('id', empresaId);

                    if (error) throw error;
                    
                    this.mostrarNotificacion('✅ Configuración de empresa guardada en Supabase', 'success');
                    return;
                }
            }

            // Fallback: guardar en localStorage
            this.guardarEmpresaLocal(datos);
            this.mostrarNotificacion('✅ Configuración de empresa guardada localmente', 'success');

        } catch (error) {
            console.error('Error guardando configuración de empresa:', error);
            this.mostrarNotificacion('❌ Error guardando configuración: ' + error.message, 'error');
        }
    }

    guardarEmpresaLocal(datos) {
        const data = JSON.parse(localStorage.getItem('bs_dash_multiempresa_data') || '{}');
        if (!data.empresas) data.empresas = [];
        
        const empresaIndex = data.empresas.findIndex(e => e.id.toString() === this.empresaActual);
        
        if (empresaIndex !== -1) {
            data.empresas[empresaIndex] = { ...data.empresas[empresaIndex], ...datos };
        } else {
            data.empresas.push({ id: this.empresaActual, ...datos });
        }
        
        localStorage.setItem('bs_dash_multiempresa_data', JSON.stringify(data));
    }

    obtenerEmpresaActualId() {
        // Mapeo simple - en producción esto debería venir de la base de datos
        const empresaMap = {
            '1': 'empresa-1-uuid',
            '2': 'empresa-2-uuid', 
            '3': 'empresa-3-uuid'
        };
        return empresaMap[this.empresaActual];
    }

    // ==================== CONFIGURACIÓN SUPABASE (ACTUALIZADA) ====================
    async cargarConfigSupabase() {
        console.log('📋 Cargando configuración Supabase...');
        const config = JSON.parse(localStorage.getItem('bs_supabase_config') || '{}');
        
        document.getElementById('supabaseUrl').value = config.url || '';
        document.getElementById('supabaseKey').value = config.key || '';
        document.getElementById('supabaseEnabled').checked = config.enabled || false;
        
        // Actualizar estado de conexión
        this.actualizarEstadoSupabase();
    }

    actualizarEstadoSupabase() {
        const statusElement = document.getElementById('supabaseStatus');
        if (!statusElement) return;

        if (!this.supabaseManager) {
            statusElement.innerHTML = `
                <div class="w-3 h-3 rounded-full bg-gray-500"></div>
                <span class="text-gray-400">Manager no disponible</span>
            `;
            return;
        }

        const status = this.supabaseManager.getStatus();
        
        console.log('📊 Estado Supabase:', status);
        
        if (status.isConnected && status.hasClient) {
            let estadoTexto = 'Conectado';
            let estadoColor = 'green';
            
            if (status.currentUser) {
                estadoTexto += ' (Autenticado)';
            }

            statusElement.innerHTML = `
                <div class="w-3 h-3 rounded-full bg-${estadoColor}-500 animate-pulse"></div>
                <span class="text-${estadoColor}-400">${estadoTexto}</span>
                <span class="text-xs text-gray-400 truncate">${this.obtenerDominioSupabase(status.projectUrl)}</span>
            `;
        } else if (status.projectUrl && status.hasApiKey) {
            statusElement.innerHTML = `
                <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span class="text-yellow-400">Configurado (No conectado)</span>
            `;
        } else {
            statusElement.innerHTML = `
                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                <span class="text-red-400">No configurado</span>
            `;
        }
    }

    obtenerDominioSupabase(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return url;
        }
    }

    async guardarConfigSupabase() {
        try {
            const url = document.getElementById('supabaseUrl').value.trim();
            const key = document.getElementById('supabaseKey').value.trim();
            const enabled = document.getElementById('supabaseEnabled').checked;

            console.log('💾 Guardando configuración Supabase:', { url, key, enabled });

            if (enabled && (!url || !key)) {
                this.mostrarNotificacion('❌ URL y API Key son requeridos para habilitar Supabase', 'error');
                return;
            }

            if (!this.supabaseManager) {
                this.mostrarNotificacion('❌ Supabase Manager no disponible', 'error');
                return;
            }

            // Guardar configuración primero
            this.supabaseManager.saveConfig(url, key, enabled);
            
            console.log('📦 Configuración guardada en localStorage');

            // Inicializar conexión si está habilitado
            if (enabled) {
                console.log('🔌 Inicializando cliente Supabase...');
                const success = this.supabaseManager.initializeClient(url, key);
                if (success) {
                    this.mostrarNotificacion('✅ Configuración Supabase guardada y conectada', 'success');
                    
                    // Inicializar datos base después de conectar
                    setTimeout(async () => {
                        await this.inicializarDatosBase();
                    }, 2000);
                    
                } else {
                    this.mostrarNotificacion('❌ Error conectando con Supabase', 'error');
                }
            } else {
                this.supabaseManager.disconnect();
                this.mostrarNotificacion('✅ Configuración Supabase guardada (desconectado)', 'info');
            }
            
            this.actualizarEstadoSupabase();
            
        } catch (error) {
            console.error('💥 Error guardando configuración Supabase:', error);
            this.mostrarNotificacion('❌ Error guardando configuración: ' + error.message, 'error');
        }
    }

    async inicializarDatosBase() {
        if (!this.supabaseManager || !this.supabaseManager.isConnected) {
            return;
        }

        try {
            this.mostrarNotificacion('🏗️ Inicializando datos base...', 'info');
            const result = await this.supabaseManager.inicializarDatosSistema();
            
            if (result.success) {
                this.mostrarNotificacion('✅ ' + result.message, 'success');
            } else {
                this.mostrarNotificacion('⚠️ ' + result.message, 'warning');
            }
        } catch (error) {
            console.error('Error inicializando datos base:', error);
            this.mostrarNotificacion('❌ Error inicializando datos: ' + error.message, 'error');
        }
    }

    async testSupabaseConnection() {
        if (!this.supabaseManager) {
            this.mostrarNotificacion('❌ Supabase Manager no disponible', 'error');
            return;
        }

        this.mostrarNotificacion('🔌 Probando conexión con Supabase...', 'info');
        
        try {
            const result = await this.supabaseManager.testConnection();
            
            if (result.success) {
                this.mostrarNotificacion('✅ ' + result.message, 'success');
            } else {
                this.mostrarNotificacion('❌ ' + result.message, 'error');
            }
            
            this.actualizarEstadoSupabase();
            
        } catch (error) {
            console.error('Error en test de conexión:', error);
            this.mostrarNotificacion('❌ Error probando conexión: ' + error.message, 'error');
        }
    }

    async mostrarTablasSupabase() {
        if (!this.supabaseManager || !this.supabaseManager.isConnected || !this.supabaseManager.supabase) {
            this.mostrarNotificacion('❌ No hay conexión con Supabase', 'error');
            return;
        }

        try {
            this.mostrarNotificacion('📊 Obteniendo tablas...', 'info');
            
            // Método alternativo: probar con tablas conocidas
            const tablasConocidas = ['empresas', 'usuarios', 'modulos_sistema', 'empresa_modulos'];
            const tablasExistentes = [];

            for (const tabla of tablasConocidas) {
                const { error: tableError } = await this.supabase
                    .from(tabla)
                    .select('*')
                    .limit(1);

                if (!tableError) {
                    tablasExistentes.push(tabla);
                }
            }

            if (tablasExistentes.length > 0) {
                console.log('📋 Tablas disponibles:', tablasExistentes);
                this.mostrarNotificacion(`✅ ${tablasExistentes.length} tablas encontradas`, 'success');
                alert(`Tablas disponibles (${tablasExistentes.length}):\n\n${tablasExistentes.join('\n')}`);
            } else {
                this.mostrarNotificacion('❌ No se encontraron tablas accesibles', 'error');
            }
            
        } catch (error) {
            console.error('Error obteniendo tablas:', error);
            this.mostrarNotificacion('❌ Error obteniendo tablas: ' + error.message, 'error');
        }
    }

    // ==================== SISTEMA DE MÓDULOS ====================
    async cargarModulosSistema() {
        try {
            if (this.supabaseManager && this.supabaseManager.isConnected) {
                const result = await this.supabaseManager.getModulosSistema();
                if (result.success) {
                    return result.data || [];
                }
            }

            // Fallback: módulos por defecto
            return [
                { id: 'dashboard', nombre: 'Dashboard', icono: 'bi-speedometer2', descripcion: 'Panel principal del sistema', url: 'dashboard.html', categoria: 'principal', siempre_activo: true, orden: 1 },
                { id: 'facturacion', nombre: 'Facturación', icono: 'bi-receipt', descripcion: 'Sistema completo de facturación', url: 'modules/facturacion.html', categoria: 'ventas', orden: 2 },
                { id: 'inventario', nombre: 'Inventario', icono: 'bi-box-seam', descripcion: 'Gestión de stock y productos', url: 'modules/inventario.html', categoria: 'operaciones', orden: 3 }
            ];
        } catch (error) {
            console.error('Error cargando módulos:', error);
            return [];
        }
    }

    // ==================== NOTIFICACIONES ====================
    mostrarNotificacion(mensaje, tipo = 'info') {
        const tipos = {
            success: { bg: 'bg-green-500', icon: 'bi-check-circle' },
            error: { bg: 'bg-red-500', icon: 'bi-exclamation-triangle' },
            warning: { bg: 'bg-yellow-500', icon: 'bi-exclamation-circle' },
            info: { bg: 'bg-blue-500', icon: 'bi-info-circle' }
        };

        const config = tipos[tipo] || tipos.info;
        
        // Eliminar notificaciones existentes
        const notificacionesExistentes = document.querySelectorAll('.notificacion-global');
        notificacionesExistentes.forEach(n => n.remove());
        
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion-global fixed top-4 right-4 ${config.bg} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 transform transition-transform duration-300 translate-x-full`;
        notificacion.innerHTML = `
            <i class="bi ${config.icon}"></i>
            <span>${mensaje}</span>
        `;

        document.body.appendChild(notificacion);

        // Animación de entrada
        setTimeout(() => {
            notificacion.style.transform = 'translateX(0)';
        }, 10);

        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            notificacion.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.remove();
                }
            }, 300);
        }, 5000);
    }

    // ==================== NAVEGACIÓN ====================
    abrirVentana(ventanaId) {
        // Ocultar todas las ventanas
        document.querySelectorAll('.config-ventana').forEach(ventana => {
            ventana.classList.add('hidden');
        });
        
        // Mostrar ventana seleccionada
        const ventanaSeleccionada = document.getElementById(ventanaId);
        if (ventanaSeleccionada) {
            ventanaSeleccionada.classList.remove('hidden');
            this.ventanaActual = ventanaId;
        }
        
        // Cargar datos específicos de la ventana
        switch(ventanaId) {
            case 'empresa':
                this.cargarConfigEmpresa();
                break;
            case 'supabase':
                this.cargarConfigSupabase();
                break;
            case 'modulos':
                this.cargarConfigModulos();
                break;
        }
    }

    async cargarTodaConfiguracion() {
        console.log('📥 Cargando toda la configuración...');
        await this.cargarConfigEmpresa();
        await this.cargarConfigSupabase();
        // Cargar otras configuraciones según sea necesario
    }
}

// ==================== FUNCIONES GLOBALES ====================
function abrirVentana(ventanaId) {
    if (window.configManager) {
        window.configManager.abrirVentana(ventanaId);
    }
}

function guardarConfigEmpresa() {
    if (window.configManager) {
        window.configManager.guardarConfigEmpresa();
    }
}

function guardarConfigSupabase() {
    if (window.configManager) {
        window.configManager.guardarConfigSupabase();
    }
}

function testSupabaseConnection() {
    if (window.configManager) {
        window.configManager.testSupabaseConnection();
    }
}

function mostrarTablasSupabase() {
    if (window.configManager) {
        window.configManager.mostrarTablasSupabase();
    }
}

function inicializarDatosBase() {
    if (window.configManager) {
        window.configManager.inicializarDatosBase();
    }
}

function logout() {
    if (window.supabaseManager) {
        window.supabaseManager.logout();
    } else {
        localStorage.removeItem('bs_dash_user');
        localStorage.removeItem('bs_dash_auth');
        localStorage.removeItem('bs_dash_auth_time');
    }
    window.location.href = '../index.html';
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Config Manager...');
    window.configManager = new ConfiguracionManager();
});