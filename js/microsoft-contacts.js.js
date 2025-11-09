// js/microsoft-contacts.js - VERSIÓN CORREGIDA
class MicrosoftContactsManager {
    constructor(clientId, tenantId = null) {
        this.clientId = clientId;
        this.tenantId = tenantId || 'common'; // Usar 'common' solo si es multi-tenant
        this.accessToken = null;
        this.baseUrl = 'https://graph.microsoft.com/v1.0';
        this.contacts = [];
        this.isMultiTenant = true; // Asumir multi-tenant por defecto
    }

    async login() {
        try {
            // Determinar el tenant a usar
            const tenant = this.isMultiTenant ? 'common' : (this.tenantId || 'organizations');
            
            const scopes = ['Contacts.ReadWrite', 'User.Read', 'offline_access'];
            const authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?` +
                `client_id=${this.clientId}&` +
                `response_type=token&` +
                `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
                `scope=${encodeURIComponent(scopes.join(' '))}&` +
                `response_mode=fragment&` +
                `state=${this.generateState()}`;

            console.log('🔗 URL de autenticación:', authUrl);

            return new Promise((resolve, reject) => {
                const loginWindow = window.open(authUrl, 'Microsoft 365 Login', 
                    'width=600,height=700,top=100,left=100');
                
                if (!loginWindow) {
                    reject(new Error('El navegador bloqueó la ventana emergente. Por favor permite ventanas emergentes para este sitio.'));
                    return;
                }

                const checkWindow = setInterval(() => {
                    try {
                        if (loginWindow.closed) {
                            clearInterval(checkWindow);
                            reject(new Error('Ventana cerrada por el usuario'));
                        }
                        
                        // Verificar si la URL tiene el token
                        const currentUrl = loginWindow.location.href;
                        if (currentUrl.includes('access_token') || currentUrl.includes('error')) {
                            clearInterval(checkWindow);
                            
                            try {
                                const url = new URL(currentUrl);
                                const hash = url.hash.substring(1);
                                const params = new URLSearchParams(hash);
                                
                                if (params.has('access_token')) {
                                    this.accessToken = params.get('access_token');
                                    
                                    this.getUserInfo().then(userInfo => {
                                        this.userName = userInfo.displayName;
                                        this.userEmail = userInfo.mail || userInfo.userPrincipalName;
                                        loginWindow.close();
                                        
                                        resolve({
                                            success: true,
                                            accessToken: this.accessToken,
                                            userName: this.userName,
                                            userEmail: this.userEmail
                                        });
                                    }).catch(error => {
                                        loginWindow.close();
                                        reject(error);
                                    });
                                } else if (params.has('error')) {
                                    loginWindow.close();
                                    reject(new Error(`Error de autenticación: ${params.get('error_description') || params.get('error')}`));
                                }
                            } catch (error) {
                                loginWindow.close();
                                reject(new Error('Error procesando la respuesta de autenticación'));
                            }
                        }
                    } catch (error) {
                        // Ignorar errores de cross-origin mientras carga
                    }
                }, 500);

                // Timeout después de 2 minutos
                setTimeout(() => {
                    if (!loginWindow.closed) {
                        loginWindow.close();
                        clearInterval(checkWindow);
                        reject(new Error('Tiempo de espera agotado para la autenticación'));
                    }
                }, 120000);
            });
        } catch (error) {
            console.error('❌ Error en login:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async getUserInfo() {
        if (!this.accessToken) {
            throw new Error('No hay token de acceso disponible');
        }

        const response = await fetch(`${this.baseUrl}/me`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error obteniendo información del usuario: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }

    async getContacts() {
        try {
            if (!this.accessToken) {
                return {
                    success: false,
                    error: 'No hay token de acceso. Por favor inicia sesión primero.'
                };
            }

            const response = await fetch(`${this.baseUrl}/me/contacts?$top=100`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.contacts = data.value || [];
                return {
                    success: true,
                    contacts: this.contacts,
                    total: this.contacts.length
                };
            } else {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                return {
                    success: false,
                    error: `Error obteniendo contactos: ${response.status} ${response.statusText}`
                };
            }
        } catch (error) {
            console.error('Error en getContacts:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async syncWithLocalContacts(localContacts) {
        try {
            if (!this.accessToken) {
                return {
                    success: false,
                    error: 'No autenticado'
                };
            }

            const results = {
                synced: 0,
                created: 0,
                updated: 0,
                errors: 0,
                details: []
            };

            // Obtener contactos existentes
            const cloudContacts = await this.getContacts();
            if (!cloudContacts.success) {
                return cloudContacts;
            }

            for (const localContact of localContacts) {
                try {
                    if (!localContact.nombre) continue;

                    // Buscar contacto existente por email o teléfono
                    const existingContact = cloudContacts.contacts.find(c => {
                        const emails = c.emailAddresses || [];
                        const phones = c.businessPhones || [];
                        const mobile = c.mobilePhone || '';
                        
                        return emails.some(e => e.address === localContact.email) ||
                               phones.includes(localContact.telefono) ||
                               mobile === localContact.telefono;
                    });

                    const contactData = {
                        givenName: localContact.nombre.split(' ')[0] || localContact.nombre,
                        surname: localContact.nombre.split(' ').slice(1).join(' ') || '',
                        emailAddresses: localContact.email ? [{
                            address: localContact.email,
                            name: localContact.nombre
                        }] : [],
                        businessPhones: localContact.telefono ? [localContact.telefono] : [],
                        mobilePhone: localContact.telefono || '',
                        companyName: localContact.empresa || 'BS-Dash Cliente',
                        jobTitle: localContact.cargo || '',
                        personalNotes: `Sincronizado desde BS-Dash - ${new Date().toLocaleString()}`
                    };

                    let result;
                    if (existingContact) {
                        result = await this.updateContact(existingContact.id, contactData);
                        if (result.success) {
                            results.updated++;
                            results.details.push(`✅ Actualizado: ${localContact.nombre}`);
                        } else {
                            results.errors++;
                            results.details.push(`❌ Error actualizando: ${localContact.nombre} - ${result.error}`);
                        }
                    } else {
                        result = await this.createContact(contactData);
                        if (result.success) {
                            results.created++;
                            results.details.push(`✅ Creado: ${localContact.nombre}`);
                        } else {
                            results.errors++;
                            results.details.push(`❌ Error creando: ${localContact.nombre} - ${result.error}`);
                        }
                    }

                    results.synced++;
                    
                    // Pequeña pausa para evitar rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    results.errors++;
                    results.details.push(`❌ Error con ${localContact.nombre}: ${error.message}`);
                }
            }

            return {
                success: results.errors === 0,
                ...results
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createContact(contactData) {
        try {
            const response = await fetch(`${this.baseUrl}/me/contacts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            if (response.ok) {
                const newContact = await response.json();
                this.contacts.push(newContact);
                return {
                    success: true,
                    contact: newContact
                };
            } else {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.error?.message || `Error ${response.status}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateContact(contactId, contactData) {
        try {
            const response = await fetch(`${this.baseUrl}/me/contacts/${contactId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            if (response.ok) {
                const updatedContact = await response.json();
                return {
                    success: true,
                    contact: updatedContact
                };
            } else {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.error?.message || `Error ${response.status}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async testConnection() {
        try {
            if (!this.accessToken) {
                return {
                    success: false,
                    error: 'No autenticado. Por favor inicia sesión primero.'
                };
            }

            const response = await fetch(`${this.baseUrl}/me`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userInfo = await response.json();
                return { 
                    success: true, 
                    message: `✅ Conectado a Microsoft 365 como ${userInfo.displayName}`,
                    user: userInfo
                };
            } else {
                return { 
                    success: false, 
                    error: `Error de autenticación: ${response.status} ${response.statusText}` 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    logout() {
        this.accessToken = null;
        this.userName = null;
        this.userEmail = null;
        this.contacts = [];
        
        // Redirigir a logout de Microsoft
        const logoutUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/logout?` +
            `post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
        
        window.open(logoutUrl, '_blank');
    }

    // Método para verificar configuración
    checkConfiguration() {
        const issues = [];
        
        if (!this.clientId) {
            issues.push('❌ Client ID no configurado');
        }
        
        if (!this.tenantId) {
            issues.push('⚠️ Tenant ID no configurado (usando "common")');
        }
        
        if (!this.isMultiTenant && this.tenantId === 'common') {
            issues.push('❌ La aplicación no está configurada como multi-tenant pero se usa endpoint /common');
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues,
            configuration: {
                clientId: this.clientId ? '✅ Configurado' : '❌ Faltante',
                tenantId: this.tenantId,
                isMultiTenant: this.isMultiTenant,
                redirectUri: window.location.origin
            }
        };
    }
}

// Inicializar globalmente
window.MicrosoftContactsManager = MicrosoftContactsManager;