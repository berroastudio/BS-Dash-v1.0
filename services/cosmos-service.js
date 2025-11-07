// services/cosmos-service.js
class CosmosDBService {
    constructor() {
        this.isConnected = false;
        this.useCloud = false;
    }

    async connect() {
        if (!window.azureConfig.isCosmosConfigured()) {
            console.warn('⚠️ Cosmos DB no configurado - usando modo local');
            this.useCloud = false;
            return false;
        }

        try {
            console.log('🔗 Conectando a Cosmos DB...');
            // Simulación de conexión exitosa
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.isConnected = true;
            this.useCloud = true;
            console.log('✅ Conectado a Cosmos DB');
            return true;
        } catch (error) {
            console.error('❌ Error conectando a Cosmos DB:', error);
            this.useCloud = false;
            return false;
        }
    }

    async createItem(item, type = 'default') {
        if (this.useCloud || await this.connect()) {
            return this._createCloudItem(item, type);
        } else {
            return this._createLocalItem(item, type);
        }
    }

    async readItems(type = null) {
        if (this.useCloud || await this.connect()) {
            return this._readCloudItems(type);
        } else {
            return this._readLocalItems(type);
        }
    }

    async updateItem(id, updatedItem, type) {
        if (this.useCloud || await this.connect()) {
            return this._updateCloudItem(id, updatedItem, type);
        } else {
            return this._updateLocalItem(id, updatedItem, type);
        }
    }

    async deleteItem(id, type) {
        if (this.useCloud || await this.connect()) {
            return this._deleteCloudItem(id, type);
        } else {
            return this._deleteLocalItem(id, type);
        }
    }

    // Métodos para Cloud (simulación)
    _createCloudItem(item, type) {
        const items = JSON.parse(localStorage.getItem(`cosmos_${type}`) || '[]');
        item.id = item.id || `cosmos-${Date.now()}`;
        item.type = type;
        item._ts = Date.now();
        item.createdAt = new Date().toISOString();
        items.push(item);
        localStorage.setItem(`cosmos_${type}`, JSON.stringify(items));
        
        console.log(`✅ Item creado en Cosmos DB (${type}):`, item.id);
        return item;
    }

    _readCloudItems(type) {
        if (type) {
            return JSON.parse(localStorage.getItem(`cosmos_${type}`) || '[]');
        }
        const allItems = [];
        const keys = Object.keys(localStorage).filter(key => key.startsWith('cosmos_'));
        keys.forEach(key => {
            const items = JSON.parse(localStorage.getItem(key) || '[]');
            allItems.push(...items);
        });
        return allItems;
    }

    _updateCloudItem(id, updatedItem, type) {
        const items = JSON.parse(localStorage.getItem(`cosmos_${type}`) || '[]');
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updatedItem, updatedAt: new Date().toISOString() };
            localStorage.setItem(`cosmos_${type}`, JSON.stringify(items));
            return items[index];
        }
        return null;
    }

    _deleteCloudItem(id, type) {
        const items = JSON.parse(localStorage.getItem(`cosmos_${type}`) || '[]');
        const filteredItems = items.filter(item => item.id !== id);
        localStorage.setItem(`cosmos_${type}`, JSON.stringify(filteredItems));
        return true;
    }

    // Métodos para Local (fallback)
    _createLocalItem(item, type) {
        const items = JSON.parse(localStorage.getItem(`local_${type}`) || '[]');
        item.id = item.id || `local-${Date.now()}`;
        item.type = type;
        item.createdAt = new Date().toISOString();
        items.push(item);
        localStorage.setItem(`local_${type}`, JSON.stringify(items));
        console.log(`📁 Item creado localmente (${type}):`, item.id);
        return item;
    }

    _readLocalItems(type) {
        if (type) {
            return JSON.parse(localStorage.getItem(`local_${type}`) || '[]');
        }
        return [];
    }

    _updateLocalItem(id, updatedItem, type) {
        const items = JSON.parse(localStorage.getItem(`local_${type}`) || '[]');
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updatedItem };
            localStorage.setItem(`local_${type}`, JSON.stringify(items));
            return items[index];
        }
        return null;
    }

    _deleteLocalItem(id, type) {
        const items = JSON.parse(localStorage.getItem(`local_${type}`) || '[]');
        const filteredItems = items.filter(item => item.id !== id);
        localStorage.setItem(`local_${type}`, JSON.stringify(filteredItems));
        return true;
    }

    // Backup y sincronización
    async backupToCloud() {
        if (!this.useCloud && !await this.connect()) {
            throw new Error('No se pudo conectar a Azure para backup');
        }

        const backupData = {
            clientes: JSON.parse(localStorage.getItem('bsdash_clientes') || '[]'),
            productos: JSON.parse(localStorage.getItem('bsdash_productos') || '[]'),
            configuracion: JSON.parse(localStorage.getItem('bsdash_configuracion') || '{}'),
            backupDate: new Date().toISOString()
        };

        await this.createItem({
            type: 'backup',
            data: backupData,
            description: 'Backup automático BS-Dash'
        }, 'system');

        console.log('✅ Backup completado en Azure Cosmos DB');
        return true;
    }

    async syncFromCloud() {
        if (!this.useCloud && !await this.connect()) {
            throw new Error('No se pudo conectar a Azure para sincronización');
        }

        const backups = await this.readItems('system');
        const latestBackup = backups
            .filter(b => b.type === 'backup')
            .sort((a, b) => new Date(b.backupDate) - new Date(a.backupDate))[0];

        if (latestBackup && latestBackup.data) {
            localStorage.setItem('bsdash_clientes', JSON.stringify(latestBackup.data.clientes || []));
            localStorage.setItem('bsdash_productos', JSON.stringify(latestBackup.data.productos || []));
            localStorage.setItem('bsdash_configuracion', JSON.stringify(latestBackup.data.configuracion || {}));
            
            console.log('✅ Sincronización desde Azure completada');
            return true;
        }
        
        return false;
    }
}

// Instancia global
window.cosmosService = new CosmosDBService();