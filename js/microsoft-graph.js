// js/microsoft-graph.js - CON TU URL NGROK REAL
console.log('🔗 Cargando Microsoft Graph...');

class MicrosoftGraph {
    constructor() {
        this.clientId = '1cef536e-cba9-48f3-b65b-ea7d49b0215a';
        
        // ✅ TU URL NGROK REAL
        this.redirectUri = 'https://nonderivable-unprocured-gonzalo.ngrok-free.dev/auth-callback.html';
        
        this.tenantId = 'common';
        this.scopes = [
            'openid',
            'profile', 
            'User.Read',
            'Contacts.ReadWrite',
            'Mail.Read',
            'Mail.Send'
        ].join(' ');
        
        this.accessToken = null;
        this.userProfile = null;
        this.isConnected = false;
        
        console.log('📍 Ngrok URL configurada:', this.redirectUri);
        this.init();
    }

    init() {
        console.log('🎯 Inicializando con Ngrok...');
        this.loadAuthData();
        
        // Solo procesar callback si estamos en ngrok
        if (window.location.href.includes('ngrok-free.dev')) {
            this.handleCallback();
        }
    }

    async login() {
        try {
            console.log('🚀 Iniciando OAuth con Ngrok...');
            console.log('📍 Usando:', this.redirectUri);
            
            const authUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?` +
                `client_id=${this.clientId}` +
                `&response_type=token` +
                `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
                `&scope=${encodeURIComponent(this.scopes)}` +
                `&response_mode=fragment` +
                `&state=ngrok_${Date.now()}`;
            
            console.log('🌐 Redirigiendo a Microsoft...');
            window.location.href = authUrl;
            
        } catch (error) {
            console.error('❌ Error en login:', error);
            throw error;
        }
    }

    loadAuthData() {
        try {
            const authData = JSON.parse(localStorage.getItem('bs_microsoft_auth') || '{}');
            if (authData.accessToken && authData.expiresAt > Date.now()) {
                this.accessToken = authData.accessToken;
                this.userProfile = authData.userProfile;
                this.isConnected = true;
                console.log('✅ Sesión Microsoft cargada');
            }
        } catch (error) {
            console.error('Error cargando auth:', error);
        }
    }

    saveAuthData() {
        const authData = {
            accessToken: this.accessToken,
            userProfile: this.userProfile,
            expiresAt: Date.now() + (60 * 60 * 1000)
        };
        localStorage.setItem('bs_microsoft_auth', JSON.stringify(authData));
    }

    async getUserProfile() {
        if (!this.accessToken) throw new Error('No token');

        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Error obteniendo perfil');
        return await response.json();
    }

    handleCallback() {
        console.log('🔍 Verificando callback Ngrok...', window.location.hash);
        
        if (window.location.hash.includes('access_token')) {
            console.log('✅ Token detectado via Ngrok!');
            
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            
            if (params.has('access_token')) {
                this.accessToken = params.get('access_token');
                console.log('🔑 Token obtenido via Ngrok');
                
                this.getUserProfile().then(profile => {
                    this.userProfile = profile;
                    this.isConnected = true;
                    this.saveAuthData();
                    
                    console.log('✅ Usuario autenticado:', profile.displayName);
                    
                    const userData = {
                        email: profile.mail || profile.userPrincipalName,
                        name: profile.displayName,
                        role: 'admin',
                        microsoftProfile: profile
                    };
                    
                    localStorage.setItem('bs_dash_user', JSON.stringify(userData));
                    localStorage.setItem('bs_dash_auth', 'true');
                    localStorage.setItem('bs_dash_auth_time', new Date().toISOString());
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                    
                }).catch(error => {
                    console.error('❌ Error obteniendo perfil:', error);
                });
            }
        }
    }
}

// Inicializar
window.microsoftGraph = new MicrosoftGraph();