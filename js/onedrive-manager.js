// js/onedrive-manager.js
class OneDriveManager {
    constructor(clientId, tenantId = 'common') {
        this.clientId = clientId;
        this.tenantId = tenantId;
        this.accessToken = null;
        this.userName = null;
        this.userEmail = null;
        this.baseUrl = 'https://graph.microsoft.com/v1.0';
        this.isAuthenticated = false;
    }

    async login() {
        return new Promise((resolve, reject) => {
            try {
                // Scopes para lectura y escritura en OneDrive
                const scopes = [
                    'Files.ReadWrite.All', 
                    'User.Read', 
                    'offline_access',
                    'Sites.ReadWrite.All'
                ];
                
                const authUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?` +
                    `client_id=${this.clientId}&` +
                    `response_type=token&` +
                    `redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&` +
                    `scope=${encodeURIComponent(scopes.join(' '))}&` +
                    `response_mode=fragment&` +
                    `state=${this.generateState()}`;

                console.log('🔗 Abriendo ventana de autenticación OneDrive...');
                console.log('URL:', authUrl);

                // Abrir ventana de autenticación
                const loginWindow = window.open(
                    authUrl, 
                    'OneDrive Login', 
                    'width=600,height=700,top=100,left=100,toolbar=no,menubar=no,location=no'
                );
                
                if (!loginWindow) {
                    reject(new Error('El navegador bloqueó la ventana emergente. Por favor permite ventanas emergentes para este sitio.'));
                    return;
                }

                let authCompleted = false;
                const checkWindow = setInterval(() => {
                    try {
                        if (loginWindow.closed) {
                            clearInterval(checkWindow);
                            if (!authCompleted) {
                                reject(new Error('Ventana cerrada por el usuario'));
                            }
                            return;
                        }
                        
                        // Verificar si la URL tiene el token
                        const currentUrl = loginWindow.location.href;
                        if (currentUrl.includes('access_token') || currentUrl.includes('error')) {
                            clearInterval(checkWindow);
                            authCompleted = true;
                            
                            try {
                                const url = new URL(currentUrl);
                                const hash = url.hash.substring(1);
                                const params = new URLSearchParams(hash);
                                
                                if (params.has('access_token')) {
                                    this.accessToken = params.get('access_token');
                                    const expiresIn = parseInt(params.get('expires_in') || '3600');
                                    
                                    console.log('✅ Token de acceso obtenido');
                                    
                                    // Obtener información del usuario
                                    this.getUserInfo().then(userInfo => {
                                        this.userName = userInfo.displayName;
                                        this.userEmail = userInfo.mail || userInfo.userPrincipalName;
                                        this.isAuthenticated = true;
                                        
                                        // Guardar en localStorage
                                        this.saveAuthData();
                                        
                                        loginWindow.close();
                                        
                                        resolve({
                                            success: true,
                                            accessToken: this.accessToken,
                                            userName: this.userName,
                                            userEmail: this.userEmail,
                                            expiresIn: expiresIn
                                        });
                                    }).catch(error => {
                                        loginWindow.close();
                                        reject(error);
                                    });
                                    
                                } else if (params.has('error')) {
                                    loginWindow.close();
                                    const errorMsg = params.get('error_description') || params.get('error');
                                    reject(new Error(`Error de autenticación: ${errorMsg}`));
                                }
                            } catch (error) {
                                loginWindow.close();
                                reject(new Error('Error procesando la respuesta de autenticación'));
                            }
                        }
                    } catch (error) {
                        // Ignorar errores de cross-origin mientras la ventana carga
                    }
                }, 500);

                // Timeout después de 2 minutos
                setTimeout(() => {
                    if (!loginWindow.closed && !authCompleted) {
                        loginWindow.close();
                        clearInterval(checkWindow);
                        reject(new Error('Tiempo de espera agotado para la autenticación'));
                    }
                }, 120000);

            } catch (error) {
                console.error('❌ Error en login OneDrive:', error);
                reject(error);
            }
        });
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

    saveAuthData() {
        const authData = {
            accessToken: this.accessToken,
            userName: this.userName,
            userEmail: this.userEmail,
            clientId: this.clientId,
            tenantId: this.tenantId,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('bs_onedrive_auth', JSON.stringify(authData));
    }

    loadAuthData() {
        const authData = JSON.parse(localStorage.getItem('bs_onedrive_auth') || '{}');
        if (authData.accessToken && authData.clientId === this.clientId) {
            this.accessToken = authData.accessToken;
            this.userName = authData.userName;
            this.userEmail = authData.userEmail;
            this.isAuthenticated = true;
            return true;
        }
        return false;
    }

    clearAuthData() {
        localStorage.removeItem('bs_onedrive_auth');
        this.accessToken = null;
        this.userName = null;
        this.userEmail = null;
        this.isAuthenticated = false;
    }

    async testConnection() {
        try {
            if (!this.accessToken) {
                return {
                    success: false,
                    error: 'No autenticado. Por favor inicia sesión primero.'
                };
            }

            const response = await fetch(`${this.baseUrl}/me/drive`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const driveInfo = await response.json();
                return { 
                    success: true, 
                    message: `✅ Conectado a OneDrive como ${this.userName}`,
                    drive: driveInfo
                };
            } else {
                return { 
                    success: false, 
                    error: `Error de conexión: ${response.status} ${response.statusText}` 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async uploadBackup(backupData) {
        try {
            const fileName = `backup-bsdash-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            const fileContent = JSON.stringify(backupData, null, 2);
            
            // Crear carpeta si no existe
            const folderPath = 'BS-Dash/Backups/';
            await this.ensureFolderExists(folderPath);

            // Subir archivo
            const response = await fetch(
                `${this.baseUrl}/me/drive/root:/${folderPath}${fileName}:/content`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: fileContent
                }
            );

            if (response.ok) {
                const fileInfo = await response.json();
                console.log('✅ Backup subido exitosamente a OneDrive:', fileInfo.name);
                return { 
                    success: true, 
                    fileName: fileName,
                    fileInfo: fileInfo
                };
            } else {
                const error = await response.json();
                console.error('Error subiendo backup:', error);
                return { 
                    success: false, 
                    error: error.error?.message || `Error ${response.status}` 
                };
            }
        } catch (error) {
            console.error('Error subiendo backup:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async ensureFolderExists(folderPath) {
        const folders = folderPath.split('/').filter(f => f);
        let currentPath = '';
        
        for (const folder of folders) {
            currentPath += `/${folder}`;
            try {
                await fetch(
                    `${this.baseUrl}/me/drive/root:${currentPath}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`
                        }
                    }
                );
            } catch (error) {
                // Si no existe, crear la carpeta
                const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
                await fetch(
                    `${this.baseUrl}/me/drive/root:${parentPath}:/children`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: folder,
                            folder: {},
                            '@microsoft.graph.conflictBehavior': 'rename'
                        })
                    }
                );
            }
        }
    }

    async listBackups() {
        try {
            const response = await fetch(
                `${this.baseUrl}/me/drive/root:/BS-Dash/Backups:/children?$orderby=createdDateTime desc`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                return { 
                    success: true, 
                    files: data.value || [] 
                };
            } else {
                return { 
                    success: false, 
                    error: 'Error listando backups' 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async downloadBackup(fileId) {
        try {
            const response = await fetch(
                `${this.baseUrl}/me/drive/items/${fileId}/content`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (response.ok) {
                const backupData = await response.json();
                return { 
                    success: true, 
                    data: backupData 
                };
            } else {
                return { 
                    success: false, 
                    error: 'Error descargando backup' 
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
        this.clearAuthData();
        
        // Redirigir a logout de Microsoft
        const logoutUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/logout?` +
            `post_logout_redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}`;
        
        window.open(logoutUrl, '_blank');
    }
}