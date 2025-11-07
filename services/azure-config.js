// services/azure-config.js
class AzureConfig {
    constructor() {
        this.loadFromLocalStorage();
    }

    loadFromLocalStorage() {
        this.cosmosEndpoint = localStorage.getItem('cosmos_endpoint') || '';
        this.cosmosKey = localStorage.getItem('cosmos_key') || '';
        this.clientId = localStorage.getItem('azure_client_id') || '';
        this.clientSecret = localStorage.getItem('azure_client_secret') || '';
        this.tenantId = localStorage.getItem('azure_tenant_id') || '';
    }

    saveToLocalStorage(config) {
        if (config.endpoint) {
            localStorage.setItem('cosmos_endpoint', config.endpoint);
            this.cosmosEndpoint = config.endpoint;
        }
        if (config.key) {
            localStorage.setItem('cosmos_key', config.key);
            this.cosmosKey = config.key;
        }
        if (config.clientId) {
            localStorage.setItem('azure_client_id', config.clientId);
            this.clientId = config.clientId;
        }
        if (config.clientSecret) {
            localStorage.setItem('azure_client_secret', config.clientSecret);
            this.clientSecret = config.clientSecret;
        }
        if (config.tenantId) {
            localStorage.setItem('azure_tenant_id', config.tenantId);
            this.tenantId = config.tenantId;
        }
        console.log('✅ Configuración Azure guardada en localStorage');
    }

    isCosmosConfigured() {
        return !!(this.cosmosEndpoint && this.cosmosKey);
    }

    isGraphConfigured() {
        return !!(this.clientId && this.clientSecret && this.tenantId);
    }

    isAzureConfigured() {
        return this.isCosmosConfigured() && this.isGraphConfigured();
    }

    getCosmosConfig() {
        return {
            endpoint: this.cosmosEndpoint,
            key: this.cosmosKey,
            databaseId: 'bs-dash',
            containerId: 'users'
        };
    }

    getGraphConfig() {
        return {
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            tenantId: this.tenantId,
            scope: 'https://graph.microsoft.com/.default',
            rootFolder: 'bs-dash-assets'
        };
    }
}

// Instancia global
window.azureConfig = new AzureConfig();