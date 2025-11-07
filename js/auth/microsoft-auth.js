/**
 * SISTEMA DE AUTENTICACIÓN HÍBRIDO BS-DASH
 * Se integra con index.html existente - Agrega opción Microsoft
 * @author Berroa Studio
 * @version 1.0
 */

class MicrosoftAuth {
    constructor() {
        this.currentMode = this.detectEnvironment();
        this.config = this.loadConfiguration();
        this.isInitialized = false;
        this.currentUser = null;
        this.authStateCallbacks = [];
        
        console.log(`🔐 BS-Dash Auth iniciado en modo: ${this.currentMode}`);
        this.initialize();
    }

    detectEnvironment() {
        if (window.location.hostname.includes('azurestaticapps.net') || 
            window.location.hostname.includes('tu-dominio.com')) {
            return 'azure';
        }
        return 'local';
    }

    loadConfiguration() {
        const baseConfig = {
            appName: 'BS-Dash',
            version: '2.0',
            company: 'Berroa Studio'
        };

        const environmentConfigs = {
            local: {
                authType: 'local',
                database: 'localStorage',
                apiBase: '/api/local',
                features: {
                    redondeo: true,
                    multiempresa: true,
                    backupLocal: true
                }
            },
            azure: {
                authType: 'azure-ad',
                database: 'cosmos-db',
                apiBase: 'https://bs-dash-api.azurewebsites.net',
                features: {
                    redondeo: true,
                    multiempresa: true,
                    backupAuto: true,
                    microsoftIntegrations: true
                }
            }
        };

        return {
            ...baseConfig,
            ...environmentConfigs[this.currentMode],
            azureConfig: JSON.parse(localStorage.getItem('bs_azure_config') || '{}')
        };
    }

    async initialize() {
        try {
            if (this.currentMode === 'azure' && this.config.azureConfig.clientId) {
                await this.initializeMSAL();
            } else {
                this.initializeLocalAuth();
            }
            
            this.isInitialized = true;
            this.loadCurrentUser();
            this.setupAuthUI(); // Configura la interfaz de login
            
            console.log(`✅ BS-Dash Auth inicializado en modo: ${this.currentMode}`);
            
        } catch (error) {
            console.error('❌ Error inicializando auth:', error);
            this.initializeLocalAuth();
        }
    }

    /**
     * CONFIGURA LA INTERFAZ DE LOGIN EN INDEX.HTML
     */
    setupAuthUI() {
        // Espera a que cargue el DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.injectMicrosoftAuthUI());
        } else {
            this.injectMicrosoftAuthUI();
        }
    }

    /**
     * INYECTA EL BOTÓN DE MICROSOFT EN TU LOGIN ACTUAL
     */
    injectMicrosoftAuthUI() {
        const loginContainer = document.querySelector('.login-container') || 
                              document.querySelector('.container') ||
                              document.querySelector('form')?.parentElement;
        
        if (!loginContainer) {
            console.log('⏳ Contenedor de login no encontrado, reintentando...');
            setTimeout(() => this.injectMicrosoftAuthUI(), 1000);
            return;
        }

        // Crea el botón de Microsoft manteniendo tu diseño
        const microsoftBtn = document.createElement('button');
        microsoftBtn.type = 'button';
        microsoftBtn.className = 'bs-btn bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 w-full flex items-center justify-center gap-3 py-3 px-4 mt-4';
        microsoftBtn.innerHTML = `
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjEiIGhlaWdodD0iMjEiIHZpZXdCb3g9IjAgMCAyMSAyMSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjU1IDAuOTU2MDRIMC45NDA5MTFWOS44MTg0SDEwLjU1VjAuOTU2MDRaIiBmaWxsPSIjZjI1MjFlIi8+CjxwYXRoIGQ9Ik0xMC41NSAxMC41NTZIMC45NDA5MTFWMTkuNDE4SDEwLjU1VjEwLjU1NloiIGZpbGw9IiM3N2JCMDMiLz4KPHBhdGggZD0iTTIwLjA1OSAwLjk1NjA0SDEwLjQ0OTlWOS44MTg0SDIwLjA1OVYwLjk1NjA0WiIgZmlsbD0iIzAwYTFmZiIvPgo8cGF0aCBkPSJNMjAuMDU5IDEwLjU1NkgxMC40NDk5VjE5LjQxOEgyMC4wNTlWMTAuNTU2WiIgZmlsbD0iI2ZmYjAwMCIvPgo8L3N2Zz4K" width="20" height="20" alt="Microsoft">
            <span class="font-medium">Continuar con Microsoft</span>
        `;
        
        microsoftBtn.onclick = () => this.handleMicrosoftLogin();

        // Agrega el botón después del formulario existente
        const existingForm = loginContainer.querySelector('form');
        if (existingForm) {
            existingForm.parentNode.insertBefore(microsoftBtn, existingForm.nextSibling);
        } else {
            loginContainer.appendChild(microsoftBtn);
        }

        // Agrega separador visual
        const separator = document.createElement('div');
        separator.className = 'flex items-center my-4';
        separator.innerHTML = `
            <div class="flex-1 border-t border-gray-300"></div>
            <span class="mx-4 text-sm text-gray-500">o</span>
            <div class="flex-1 border-t border-gray-300"></div>
        `;
        
        microsoftBtn.parentNode.insertBefore(separator, microsoftBtn);

        console.log('✅ Botón Microsoft agregado al login');
    }

    /**
     * MANEJA EL LOGIN CON MICROSOFT
     */
    async handleMicrosoftLogin() {
        console.log('🔄 Iniciando login con Microsoft...');
        
        // Por ahora simula el login local hasta que Azure esté configurado
        if (!this.isAzureConfigured()) {
            console.log('🔧 Azure no configurado, usando login local simulado');
            
            // Simula usuario Microsoft (esto cambiará cuando Azure esté listo)
            const microsoftUser = {
                email: 'usuario@tuempresa.com',
                name: 'Usuario Microsoft',
                role: 'admin',
                avatar: null,
                lastLogin: new Date().toISOString(),
                permissions: ['dashboard', 'facturacion', 'pos', 'inventario', 'configuracion'],
                source: 'microsoft',
                environment: this.currentMode
            };

            localStorage.setItem('bs_current_user', JSON.stringify(microsoftUser));
            localStorage.setItem('bs_auth_token', 'microsoft-token-' + Date.now());
            localStorage.setItem('bs_last_login', new Date().toISOString());

            this.currentUser = microsoftUser;
            this.notifyAuthStateChange('login', microsoftUser);

            // Muestra mensaje informativo
            alert('🔧 Modo demostración: Cuando configures Azure AD, esto se conectará automáticamente con Microsoft 365');
            
            // Redirige al dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
            return;
        }

        // Aquí irá la lógica real de Azure AD cuando esté configurado
        console.log('☁️ Login con Azure AD (preparado para cuando esté configurado)');
    }

    initializeLocalAuth() {
        console.log('🔧 Usando sistema de autenticación local');
        
        window.auth = {
            login: (email, password) => this.localLogin(email, password),
            logout: () => this.localLogout(),
            getCurrentUser: () => this.getLocalUser(),
            isAuthenticated: () => this.isLocalAuthenticated(),
            getAuthMode: () => this.currentMode,
            getConfig: () => this.config,
            isAzureReady: () => this.isAzureConfigured(),
            onAuthStateChange: (callback) => this.authStateCallbacks.push(callback)
        };
    }

    async localLogin(email, password) {
        console.log(`🔐 Login local: ${email}`);
        
        // TU LÓGICA ACTUAL DE LOGIN - SE MANTIENE IGUAL
        const user = { 
            email: email,
            name: email.split('@')[0],
            role: 'admin',
            avatar: null,
            lastLogin: new Date().toISOString(),
            permissions: ['dashboard', 'facturacion', 'pos', 'inventario', 'configuracion'],
            source: 'local',
            environment: this.currentMode
        };

        localStorage.setItem('bs_current_user', JSON.stringify(user));
        localStorage.setItem('bs_auth_token', 'local-token-' + Date.now());
        localStorage.setItem('bs_last_login', new Date().toISOString());

        this.currentUser = user;
        this.notifyAuthStateChange('login', user);

        console.log('✅ Login local exitoso');
        return user;
    }

    async localLogout() {
        console.log('🚪 Cerrando sesión');
        
        const user = this.currentUser;
        localStorage.removeItem('bs_current_user');
        localStorage.removeItem('bs_auth_token');
        localStorage.removeItem('bs_last_login');
        
        this.currentUser = null;
        this.notifyAuthStateChange('logout', user);

        window.location.href = 'index.html';
    }

    getLocalUser() {
        if (this.currentUser) return this.currentUser;

        try {
            const stored = localStorage.getItem('bs_current_user');
            if (stored) {
                this.currentUser = JSON.parse(stored);
                return this.currentUser;
            }
        } catch (error) {
            console.error('Error cargando usuario:', error);
        }

        return null;
    }

    isLocalAuthenticated() {
        const user = this.getLocalUser();
        const token = localStorage.getItem('bs_auth_token');
        return !!(user && token);
    }

    async initializeMSAL() {
        console.log('☁️ Inicializando conexión Azure AD');
        this.config.azureAvailable = true;
    }

    isAzureConfigured() {
        return !!(this.config.azureConfig && this.config.azureConfig.clientId);
    }

    notifyAuthStateChange(event, user) {
        this.authStateCallbacks.forEach(callback => {
            try {
                callback(event, user, this.currentMode);
            } catch (error) {
                console.error('Error en auth callback:', error);
            }
        });
    }

    configureAzure(azureConfig) {
        console.log('⚙️ Configurando Azure AD');
        localStorage.setItem('bs_azure_config', JSON.stringify(azureConfig));
        this.config.azureConfig = azureConfig;
        this.config.azureAvailable = true;
        
        console.log('✅ Azure AD configurado - Listo para migración');
    }

    getSystemInfo() {
        return {
            mode: this.currentMode,
            config: this.config,
            user: this.currentUser,
            initialized: this.isInitialized,
            azureReady: this.isAzureConfigured(),
            timestamp: new Date().toISOString()
        };
    }
}

// Inicialización automática
console.log('🚀 Iniciando BS-Dash Authentication System...');
window.microsoftAuth = new MicrosoftAuth();

if (!window.auth) {
    window.auth = window.microsoftAuth;
}

console.log('✅ BS-Dash Authentication System cargado correctamente');