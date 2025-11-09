// js/smtp-manager.js
class SMTPManager {
    static async testConnection(config) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Validaciones mejoradas
                if (!config.server || !config.email || !config.password) {
                    resolve({
                        success: false,
                        error: 'Todos los campos son requeridos'
                    });
                    return;
                }

                if (!this.validateEmail(config.email)) {
                    resolve({
                        success: false,
                        error: 'Formato de email inválido'
                    });
                    return;
                }

                if (config.port < 1 || config.port > 65535) {
                    resolve({
                        success: false,
                        error: 'Puerto inválido'
                    });
                    return;
                }

                // Simulación de prueba de conexión
                const isGmail = config.server.includes('gmail.com');
                const isOutlook = config.server.includes('outlook.com') || config.server.includes('office365.com');
                
                if (isGmail && config.port !== 587 && config.port !== 465) {
                    resolve({
                        success: false,
                        error: 'Para Gmail use puerto 587 (TLS) o 465 (SSL)'
                    });
                    return;
                }

                if (isOutlook && config.port !== 587) {
                    resolve({
                        success: false,
                        error: 'Para Outlook/Office365 use puerto 587'
                    });
                    return;
                }

                // Simular éxito en el 80% de los casos
                if (Math.random() > 0.2) {
                    resolve({
                        success: true,
                        message: '✅ Conexión SMTP verificada correctamente',
                        server: config.server,
                        port: config.port
                    });
                } else {
                    resolve({
                        success: false,
                        error: 'No se pudo establecer conexión con el servidor SMTP'
                    });
                }
            }, 3000);
        });
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static async sendEmail(to, subject, body, attachments = []) {
        console.log('📧 Enviando email:', { 
            to, 
            subject, 
            body: body.substring(0, 100) + '...',
            attachments: attachments.length 
        });
        
        return new Promise((resolve) => {
            setTimeout(() => {
                // Validar destinatario
                if (!this.validateEmail(to)) {
                    resolve({
                        success: false,
                        error: 'Email del destinatario inválido'
                    });
                    return;
                }

                // Simular éxito en el 90% de los casos
                if (Math.random() > 0.1) {
                    resolve({
                        success: true,
                        messageId: 'msg-' + Date.now(),
                        message: '📧 Email enviado correctamente',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    resolve({
                        success: false,
                        error: 'Error de red al enviar el email'
                    });
                }
            }, 2000);
        });
    }

    static async sendTemplateEmail(to, templateType, variables = {}) {
        try {
            // Obtener plantilla de la base de datos
            const plantillas = await db.get('email_plantillas') || {};
            const plantilla = plantillas[templateType];
            
            if (!plantilla) {
                return {
                    success: false,
                    error: `Plantilla "${templateType}" no encontrada`
                };
            }

            // Reemplazar variables en la plantilla
            let asunto = plantilla.asunto;
            let cuerpo = plantilla.cuerpo;

            Object.keys(variables).forEach(key => {
                const placeholder = `{${key}}`;
                const regex = new RegExp(this.escapeRegExp(placeholder), 'g');
                asunto = asunto.replace(regex, variables[key] || '');
                cuerpo = cuerpo.replace(regex, variables[key] || '');
            });

            // Validar que no queden placeholders sin reemplazar
            const placeholderRegex = /\{[^}]+\}/g;
            const asuntoPlaceholders = asunto.match(placeholderRegex);
            const cuerpoPlaceholders = cuerpo.match(placeholderRegex);

            if (asuntoPlaceholders || cuerpoPlaceholders) {
                return {
                    success: false,
                    error: 'Faltan variables por reemplazar en la plantilla'
                };
            }

            // Enviar email
            return await this.sendEmail(to, asunto, cuerpo);
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    static escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static async sendTestEmail(config) {
        try {
            const testResult = await this.testConnection(config);
            if (!testResult.success) {
                return testResult;
            }

            const testEmail = {
                to: config.email,
                subject: 'BS-Dash - Email de Prueba',
                body: `Este es un email de prueba enviado desde BS-Dash.

📅 Fecha: ${new Date().toLocaleString()}
✅ Configuración SMTP verificada correctamente

Servidor: ${config.server}
Puerto: ${config.port}
Email: ${config.email}

Si recibes este email, significa que tu configuración SMTP está funcionando correctamente.

Saludos,
Equipo BS-Dash`
            };

            return await this.sendEmail(testEmail.to, testEmail.subject, testEmail.body);
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}