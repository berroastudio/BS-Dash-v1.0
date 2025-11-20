// js/two-factor-auth.js - Sistema de Autenticación de Dos Factores
console.log('🔐 Cargando sistema 2FA...');

class TwoFactorAuth {
    constructor() {
        this.secret = null;
        this.enabled = false;
        this.backupCodes = [];
        this.init();
    }

    init() {
        console.log('🎯 Inicializando sistema 2FA...');
        this.loadConfig();
    }

    loadConfig() {
        const config = JSON.parse(localStorage.getItem('bs_2fa_config') || '{}');
        this.secret = config.secret || null;
        this.enabled = config.enabled || false;
        this.backupCodes = config.backupCodes || [];
        
        console.log('📋 Configuración 2FA cargada:', { 
            enabled: this.enabled, 
            hasSecret: !!this.secret,
            backupCodesCount: this.backupCodes.length 
        });
    }

    saveConfig() {
        const config = {
            secret: this.secret,
            enabled: this.enabled,
            backupCodes: this.backupCodes,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('bs_2fa_config', JSON.stringify(config));
    }

    // Generar nuevo secreto para 2FA
    generateNewSecret() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        this.secret = secret;
        this.generateBackupCodes();
        this.saveConfig();
        
        console.log('🔑 Nuevo secreto 2FA generado');
        return secret;
    }

    // Generar códigos de respaldo
    generateBackupCodes() {
        this.backupCodes = [];
        for (let i = 0; i < 8; i++) {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            this.backupCodes.push({
                code: code,
                used: false
            });
        }
        this.saveConfig();
    }

    // Verificar código OTP
    verifyOTP(code) {
        if (!this.secret || !this.enabled) {
            console.log('❌ 2FA no está habilitado');
            return { success: false, message: '2FA no está habilitado' };
        }

        // Limpiar el código (quitar espacios)
        const cleanCode = code.replace(/\s/g, '');
        
        // Verificar si es un código de respaldo
        const backupCode = this.backupCodes.find(bc => bc.code === cleanCode && !bc.used);
        if (backupCode) {
            backupCode.used = true;
            this.saveConfig();
            console.log('✅ Código de respaldo válido');
            return { success: true, message: 'Código de respaldo válido', isBackup: true };
        }

        // Aquí iría la verificación real del código TOTP
        // Por ahora, simulamos la verificación
        const isValid = this.simulateTOTPVerification(cleanCode);
        
        if (isValid) {
            console.log('✅ Código OTP válido');
            return { success: true, message: 'Código OTP válido' };
        } else {
            console.log('❌ Código OTP inválido');
            return { success: false, message: 'Código OTP inválido' };
        }
    }

    // Simulación de verificación TOTP (en producción usarías una librería como otplib)
    simulateTOTPVerification(code) {
        // En un sistema real, aquí verificarías el código contra el secreto
        // Por ahora, aceptamos cualquier código de 6 dígitos para testing
        return /^\d{6}$/.test(code);
    }

    // Obtener QR code URL para Microsoft Authenticator
    getQRCodeURL(accountName = 'BS Dashboard', issuer = 'Berroa Studio') {
        if (!this.secret) {
            console.error('❌ No hay secreto configurado');
            return null;
        }

        const encodedIssuer = encodeURIComponent(issuer);
        const encodedAccountName = encodeURIComponent(accountName);
        
        return `otpauth://totp/${encodedIssuer}:${encodedAccountName}?secret=${this.secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
    }

    // Habilitar/deshabilitar 2FA
    setEnabled(enabled) {
        this.enabled = enabled;
        this.saveConfig();
        console.log(`🔐 2FA ${enabled ? 'habilitado' : 'deshabilitado'}`);
    }

    // Resetear configuración 2FA
    reset() {
        this.secret = null;
        this.enabled = false;
        this.backupCodes = [];
        localStorage.removeItem('bs_2fa_config');
        console.log('🔄 Configuración 2FA reseteada');
    }

    // Obtener estado
    getStatus() {
        return {
            enabled: this.enabled,
            hasSecret: !!this.secret,
            backupCodes: this.backupCodes.filter(bc => !bc.used),
            totalBackupCodes: this.backupCodes.length,
            usedBackupCodes: this.backupCodes.filter(bc => bc.used).length
        };
    }
}

// Inicializar sistema 2FA global
window.twoFactorAuth = new TwoFactorAuth();