// Microsoft Authentication Manager
class MicrosoftAuthManager {
    constructor() {
        this.msalClient = null;
        this.currentUser = null;
        this.isInitialized = false;
    }

    async initialize(clientId = null) {
        try {
            const config = {
                auth: {
                    clientId: clientId || this.getStoredClientId() || "TU_CLIENT_ID_AQUI",
                    authority: "https://login.microsoftonline.com/common",
                    redirectUri: window.location.origin
                },
                cache: {
                    cacheLocation: "localStorage",
                    storeAuthStateInCookie: false
                }
            };

            this.msalClient = new msal.PublicClientApplication(config);
            await this.msalClient.initialize();
            
            this.isInitialized = true;
            console.log('✅ Microsoft Auth Manager inicializado');
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Microsoft Auth:', error);
            return false;
        }
    }

    getStoredClientId() {
        return localStorage.getItem('microsoft_client_id');
    }

    storeClientId(clientId) {
        localStorage.setItem('microsoft_client_id', clientId);
    }

    async login() {
        if (!this.isInitialized) {
            throw new Error('Microsoft Auth no está inicializado');
        }

        try {
            const loginRequest = {
                scopes: ["User.Read", "Files.ReadWrite.All", "Mail.Read"],
                prompt: "select_account"
            };

            const response = await this.msalClient.loginPopup(loginRequest);
            this.currentUser = response.account;
            
            // Guardar información del usuario
            this.saveUserInfo(this.currentUser);
            
            return {
                success: true,
                user: this.currentUser
            };
        } catch (error) {
            console.error('Error en login Microsoft:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async logout() {
        if (this.msalClient && this.currentUser) {
            try {
                await this.msalClient.logoutPopup();
                this.currentUser = null;
                localStorage.removeItem('microsoft_user');
                console.log('✅ Sesión Microsoft cerrada');
            } catch (error) {
                console.error('Error cerrando sesión Microsoft:', error);
            }
        }
    }

    async getAccessToken() {
        if (!this.currentUser) {
            throw new Error('No hay usuario autenticado');
        }

        try {
            const tokenRequest = {
                scopes: ["User.Read", "Files.ReadWrite.All"],
                account: this.currentUser
            };

            const response = await this.msalClient.acquireTokenSilent(tokenRequest);
            return response.accessToken;
        } catch (error) {
            console.warn('Error obteniendo token silencioso, intentando popup...');
            try {
                const response = await this.msalClient.acquireTokenPopup(tokenRequest);
                return response.accessToken;
            } catch (popupError) {
                throw new Error('No se pudo obtener el token de acceso');
            }
        }
    }

    async getUserProfile() {
        try {
            const token = await this.getAccessToken();
            
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            throw error;
        }
    }

    saveUserInfo(user) {
        const userInfo = {
            id: user.homeAccountId,
            name: user.name,
            email: user.username,
            tenantId: user.tenantId,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('microsoft_user', JSON.stringify(userInfo));
    }

    getSavedUserInfo() {
        const saved = localStorage.getItem('microsoft_user');
        return saved ? JSON.parse(saved) : null;
    }

    isUserLoggedIn() {
        return this.currentUser !== null || this.getSavedUserInfo() !== null;
    }

    async handleRedirect() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const response = await this.msalClient.handleRedirectPromise();
            if (response !== null) {
                this.currentUser = response.account;
                this.saveUserInfo(this.currentUser);
                return {
                    success: true,
                    user: this.currentUser
                };
            }
        } catch (error) {
            console.error('Error manejando redirect:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Inicializar globalmente
window.microsoftAuth = new MicrosoftAuthManager();