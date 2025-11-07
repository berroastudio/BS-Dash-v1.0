// services/onedrive-service.js
class OneDriveService {
    constructor() {
        this.isAuthenticated = false;
        this.useCloud = false;
    }

    async authenticate() {
        if (!window.azureConfig.isGraphConfigured()) {
            console.warn('⚠️ Microsoft Graph no configurado - usando modo local');
            this.useCloud = false;
            return false;
        }

        try {
            console.log('🔗 Autenticando con Microsoft Graph...');
            // Simulación de autenticación
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.isAuthenticated = true;
            this.useCloud = true;
            console.log('✅ Autenticado con Microsoft Graph');
            return true;
        } catch (error) {
            console.error('❌ Error autenticando con Microsoft Graph:', error);
            this.useCloud = false;
            return false;
        }
    }

    async uploadFile(file, folder = 'images') {
        if (this.useCloud || await this.authenticate()) {
            return this._uploadToCloud(file, folder);
        } else {
            return this._uploadToLocal(file, folder);
        }
    }

    async getFiles(folder = 'images') {
        if (this.useCloud || await this.authenticate()) {
            return this._getCloudFiles(folder);
        } else {
            return this._getLocalFiles(folder);
        }
    }

    async deleteFile(fileId, folder = 'images') {
        if (this.useCloud || await this.authenticate()) {
            return this._deleteCloudFile(fileId, folder);
        } else {
            return this._deleteLocalFile(fileId, folder);
        }
    }

    // Métodos para Cloud (simulación)
    async _uploadToCloud(file, folder) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    id: `cloud-${Date.now()}`,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    folder: folder,
                    url: URL.createObjectURL(file),
                    uploadedAt: new Date().toISOString(),
                    cloudId: `od-${Date.now()}`
                };

                const files = JSON.parse(localStorage.getItem('onedrive_files') || '[]');
                files.push(fileData);
                localStorage.setItem('onedrive_files', JSON.stringify(files));

                console.log('☁️ Archivo subido a OneDrive:', file.name);
                resolve(fileData);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    _getCloudFiles(folder) {
        const files = JSON.parse(localStorage.getItem('onedrive_files') || '[]');
        return files.filter(file => file.folder === folder);
    }

    _deleteCloudFile(fileId, folder) {
        const files = JSON.parse(localStorage.getItem('onedrive_files') || '[]');
        const filteredFiles = files.filter(file => file.id !== fileId);
        localStorage.setItem('onedrive_files', JSON.stringify(filteredFiles));
        return true;
    }

    // Métodos para Local (fallback)
    async _uploadToLocal(file, folder) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    id: `local-${Date.now()}`,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    folder: folder,
                    data: e.target.result,
                    uploadedAt: new Date().toISOString()
                };

                const files = JSON.parse(localStorage.getItem('local_files') || '[]');
                files.push(fileData);
                localStorage.setItem('local_files', JSON.stringify(files));

                console.log('📁 Archivo guardado localmente:', file.name);
                resolve(fileData);
            };
            reader.readAsDataURL(file);
        });
    }

    _getLocalFiles(folder) {
        const files = JSON.parse(localStorage.getItem('local_files') || '[]');
        return files.filter(file => file.folder === folder);
    }

    _deleteLocalFile(fileId, folder) {
        const files = JSON.parse(localStorage.getItem('local_files') || '[]');
        const filteredFiles = files.filter(file => file.id !== fileId);
        localStorage.setItem('local_files', JSON.stringify(filteredFiles));
        return true;
    }

    // Crear carpeta
    async createFolder(folderName) {
        if (this.useCloud || await this.authenticate()) {
            const folders = JSON.parse(localStorage.getItem('onedrive_folders') || '[]');
            const newFolder = {
                id: `folder-${Date.now()}`,
                name: folderName,
                created: new Date().toISOString(),
                cloudId: `folder-${Date.now()}`
            };
            folders.push(newFolder);
            localStorage.setItem('onedrive_folders', JSON.stringify(folders));
            return newFolder;
        }
        return null;
    }
}

// Instancia global
window.oneDriveService = new OneDriveService();