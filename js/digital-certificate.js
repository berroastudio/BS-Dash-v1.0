// js/digital-certificate.js - Sistema de Certificado Electrónico
class DigitalCertificateSystem {
    constructor() {
        this.certificate = null;
        this.privateKey = null;
        this.publicKey = null;
        this.certificateStorageKey = 'bs_dash_digital_certificate';
        this.init();
    }

    async init() {
        await this.loadExistingCertificate();
    }

    // Generar un nuevo certificado digital
    async generateCertificate(empresaInfo) {
        try {
            console.log('🔐 Generando certificado digital...');
            
            // Generar par de claves RSA
            const keyPair = await this.generateKeyPair();
            
            // Crear certificado digital
            const certificate = {
                version: '1.0',
                serialNumber: this.generateSerialNumber(),
                subject: {
                    commonName: empresaInfo.nombre,
                    organization: empresaInfo.nombre,
                    organizationalUnit: 'Sistema BS-Dash',
                    country: 'DO',
                    state: 'Distrito Nacional',
                    locality: 'Santo Domingo',
                    email: empresaInfo.email
                },
                issuer: {
                    commonName: 'BS-Dash Certificate Authority',
                    organization: 'Berroa Studio S.R.L.'
                },
                validity: {
                    notBefore: new Date(),
                    notAfter: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) // 1 año
                },
                publicKey: keyPair.publicKey,
                extensions: {
                    keyUsage: {
                        digitalSignature: true,
                        keyEncipherment: true,
                        dataEncipherment: true
                    },
                    extendedKeyUsage: {
                        clientAuth: true,
                        emailProtection: true,
                        codeSigning: true
                    },
                    subjectAltName: {
                        dns: [empresaInfo.website],
                        email: [empresaInfo.email]
                    }
                },
                signatureAlgorithm: 'RSA-SHA256',
                timestamp: new Date().toISOString()
            };

            // Firmar el certificado
            certificate.signature = await this.signCertificate(certificate, keyPair.privateKey);
            
            this.certificate = certificate;
            this.privateKey = keyPair.privateKey;
            this.publicKey = keyPair.publicKey;

            // Guardar en almacenamiento seguro
            await this.saveCertificate();

            console.log('✅ Certificado digital generado exitosamente');
            return {
                success: true,
                certificate: certificate,
                certificateId: certificate.serialNumber
            };
        } catch (error) {
            console.error('❌ Error generando certificado:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generar par de claves RSA
    async generateKeyPair() {
        return new Promise((resolve) => {
            // En un entorno real, usaríamos Web Crypto API
            // Para este ejemplo, simulamos la generación de claves
            const keyPair = {
                publicKey: this.generateRandomKey(256),
                privateKey: this.generateRandomKey(512)
            };
            
            // Simular delay de generación
            setTimeout(() => resolve(keyPair), 1000);
        });
    }

    // Generar número de serie único
    generateSerialNumber() {
        return 'BS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // Generar clave aleatoria (simulación)
    generateRandomKey(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Firmar certificado
    async signCertificate(certificate, privateKey) {
        // En un entorno real, esto firmaría con la clave privada
        // Para este ejemplo, generamos un hash simulado
        const data = JSON.stringify(certificate) + privateKey;
        return this.generateSHA256Hash(data);
    }

    // Generar hash SHA-256 (simulado)
    generateSHA256Hash(data) {
        // Simulación de hash - en producción usaría crypto.subtle.digest
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).toUpperCase();
    }

    // Verificar firma
    async verifySignature(certificate, signature, publicKey) {
        const expectedSignature = await this.signCertificate(certificate, publicKey);
        return signature === expectedSignature;
    }

    // Guardar certificado de forma segura
    async saveCertificate() {
        try {
            const certificateData = {
                certificate: this.certificate,
                privateKey: this.privateKey,
                publicKey: this.publicKey,
                timestamp: new Date().toISOString()
            };

            // Encriptar antes de guardar (simulación)
            const encryptedData = this.encryptData(JSON.stringify(certificateData));
            localStorage.setItem(this.certificateStorageKey, encryptedData);
            
            console.log('💾 Certificado guardado exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error guardando certificado:', error);
            return false;
        }
    }

    // Cargar certificado existente
    async loadExistingCertificate() {
        try {
            const encryptedData = localStorage.getItem(this.certificateStorageKey);
            if (!encryptedData) {
                console.log('ℹ️ No hay certificado existente');
                return false;
            }

            // Desencriptar (simulación)
            const decryptedData = this.decryptData(encryptedData);
            const certificateData = JSON.parse(decryptedData);

            // Verificar integridad
            const isValid = await this.verifySignature(
                certificateData.certificate,
                certificateData.certificate.signature,
                certificateData.publicKey
            );

            if (isValid) {
                this.certificate = certificateData.certificate;
                this.privateKey = certificateData.privateKey;
                this.publicKey = certificateData.publicKey;
                console.log('✅ Certificado cargado y verificado');
                return true;
            } else {
                console.error('❌ Certificado corrupto o alterado');
                this.revokeCertificate();
                return false;
            }
        } catch (error) {
            console.error('❌ Error cargando certificado:', error);
            return false;
        }
    }

    // Encriptar datos (simulación)
    encryptData(data) {
        // En producción usaría Web Crypto API
        return btoa(unescape(encodeURIComponent(data)));
    }

    // Desencriptar datos (simulación)
    decryptData(encryptedData) {
        try {
            return decodeURIComponent(escape(atob(encryptedData)));
        } catch (error) {
            throw new Error('Error desencriptando datos');
        }
    }

    // Firmar documentos
    async signDocument(documentData, documentType) {
        if (!this.certificate) {
            throw new Error('No hay certificado disponible');
        }

        const signature = {
            document: documentData,
            documentType: documentType,
            certificate: this.certificate.serialNumber,
            timestamp: new Date().toISOString(),
            hash: this.generateSHA256Hash(JSON.stringify(documentData)),
            signature: await this.signCertificate(documentData, this.privateKey),
            metadata: {
                signedBy: this.certificate.subject.commonName,
                position: 'Sistema BS-Dash',
                location: 'República Dominicana'
            }
        };

        return signature;
    }

    // Verificar firma de documento
    async verifyDocumentSignature(signedDocument) {
        try {
            const isValid = await this.verifySignature(
                signedDocument.document,
                signedDocument.signature,
                this.publicKey
            );

            return {
                isValid: isValid,
                certificate: this.certificate,
                timestamp: signedDocument.timestamp,
                signedBy: signedDocument.metadata.signedBy
            };
        } catch (error) {
            return {
                isValid: false,
                error: error.message
            };
        }
    }

    // Revocar certificado
    revokeCertificate() {
        this.certificate = null;
        this.privateKey = null;
        this.publicKey = null;
        localStorage.removeItem(this.certificateStorageKey);
        console.log('🗑️ Certificado revocado');
    }

    // Verificar validez del certificado
    isCertificateValid() {
        if (!this.certificate) return false;
        
        const now = new Date();
        const notBefore = new Date(this.certificate.validity.notBefore);
        const notAfter = new Date(this.certificate.validity.notAfter);
        
        return now >= notBefore && now <= notAfter;
    }

    // Obtener información del certificado
    getCertificateInfo() {
        if (!this.certificate) return null;

        return {
            serialNumber: this.certificate.serialNumber,
            subject: this.certificate.subject,
            issuer: this.certificate.issuer,
            validity: {
                notBefore: new Date(this.certificate.validity.notBefore),
                notAfter: new Date(this.certificate.validity.notAfter),
                isValid: this.isCertificateValid()
            },
            extensions: this.certificate.extensions,
            timestamp: this.certificate.timestamp
        };
    }

    // Exportar certificado
    exportCertificate() {
        if (!this.certificate) {
            throw new Error('No hay certificado para exportar');
        }

        const certificateData = {
            certificate: this.certificate,
            publicKey: this.publicKey,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(certificateData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bs-dash-certificate-${this.certificate.serialNumber}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Importar certificado
    async importCertificate(certificateFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Verificar certificado importado
                    const isValid = await this.verifySignature(
                        importedData.certificate,
                        importedData.certificate.signature,
                        importedData.publicKey
                    );

                    if (isValid) {
                        this.certificate = importedData.certificate;
                        this.publicKey = importedData.publicKey;
                        // Nota: La clave privada no se importa por seguridad
                        await this.saveCertificate();
                        resolve({ success: true });
                    } else {
                        reject(new Error('Certificado importado no válido'));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            reader.readAsText(certificateFile);
        });
    }
}

// Inicializar sistema globalmente
window.digitalCertificateSystem = new DigitalCertificateSystem();