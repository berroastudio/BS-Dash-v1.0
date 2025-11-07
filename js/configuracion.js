// Configuración del Sistema - Versión Corregida con Azure
class ConfiguracionManager {
    constructor() {
        this.initialize();
    }

    initialize() {
        console.log('⚙️ Inicializando ConfiguraciónManager...');
        this.cargarTodaConfiguracion();
    }

    cargarTodaConfiguracion() {
        this.cargarInformacionEmpresa();
        this.cargarConfiguracionPOS();
        this.cargarSecuencias();
        this.cargarUsuarios();
        this.cargarClientes();
        this.cargarConfiguracionAzure();
    }

    // Información de la Empresa
    cargarInformacionEmpresa() {
        try {
            const empresa = JSON.parse(localStorage.getItem('bsdash_empresa') || '{}');
            
            document.getElementById('empresaNombre').value = empresa.nombre || 'Berroa Studio S.R.L.';
            document.getElementById('empresaRNC').value = empresa.rnc || '';
            document.getElementById('empresaTelefono').value = empresa.telefono || '';
            document.getElementById('empresaEmail').value = empresa.email || '';
            document.getElementById('empresaDireccion').value = empresa.direccion || '';
            document.getElementById('empresaWebsite').value = empresa.website || '';
            document.getElementById('empresaEslogan').value = empresa.eslogan || '';
            
            console.log('🏢 Información de empresa cargada');
        } catch (error) {
            console.error('❌ Error cargando información de empresa:', error);
        }
    }

    guardarInformacionEmpresa() {
        try {
            const empresa = {
                nombre: document.getElementById('empresaNombre').value,
                rnc: document.getElementById('empresaRNC').value,
                telefono: document.getElementById('empresaTelefono').value,
                email: document.getElementById('empresaEmail').value,
                direccion: document.getElementById('empresaDireccion').value,
                website: document.getElementById('empresaWebsite').value,
                eslogan: document.getElementById('empresaEslogan').value
            };
            
            localStorage.setItem('bsdash_empresa', JSON.stringify(empresa));
            console.log('💾 Información de empresa guardada');
            return true;
        } catch (error) {
            console.error('❌ Error guardando información de empresa:', error);
            return false;
        }
    }

    // Configuración POS
    cargarConfiguracionPOS() {
        try {
            const metodosPago = JSON.parse(localStorage.getItem('bsdash_metodosPago') || '["Efectivo", "Tarjeta Débito", "Tarjeta Crédito", "Transferencia"]');
            const metodosContainer = document.getElementById('metodosPagoContainer');
            metodosContainer.innerHTML = '';

            metodosPago.forEach((metodo, index) => {
                metodosContainer.innerHTML += `
                    <div class="flex items-center gap-3 p-3 border border-gray-300 rounded-lg">
                        <input type="text" value="${metodo}" onchange="configuracionManager.actualizarMetodoPago(${index}, this.value)" 
                               class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <button onclick="configuracionManager.eliminarMetodoPago(${index})" class="bs-btn bg-red-50 text-red-600 border-red-200 text-sm hover:bg-red-100">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                `;
            });

            const config = JSON.parse(localStorage.getItem('bsdash_configuracion') || '{}');
            document.getElementById('habilitarDescuentos').checked = config.habilitarDescuentos || false;
            document.getElementById('solicitarCliente').checked = config.solicitarCliente || false;
            document.getElementById('imprimirAutomatico').checked = config.imprimirAutomatico || false;
            document.getElementById('ivaPorDefecto').value = config.ivaPorDefecto || 18;
            
            console.log('💳 Configuración POS cargada');
        } catch (error) {
            console.error('❌ Error cargando configuración POS:', error);
        }
    }

    agregarMetodoPago() {
        try {
            const metodosPago = JSON.parse(localStorage.getItem('bsdash_metodosPago') || '["Efectivo", "Tarjeta Débito", "Tarjeta Crédito", "Transferencia"]');
            metodosPago.push('Nuevo Método');
            localStorage.setItem('bsdash_metodosPago', JSON.stringify(metodosPago));
            this.cargarConfiguracionPOS();
            console.log('➕ Método de pago agregado');
        } catch (error) {
            console.error('❌ Error agregando método de pago:', error);
        }
    }

    actualizarMetodoPago(index, valor) {
        try {
            const metodosPago = JSON.parse(localStorage.getItem('bsdash_metodosPago') || '["Efectivo", "Tarjeta Débito", "Tarjeta Crédito", "Transferencia"]');
            metodosPago[index] = valor;
            localStorage.setItem('bsdash_metodosPago', JSON.stringify(metodosPago));
        } catch (error) {
            console.error('❌ Error actualizando método de pago:', error);
        }
    }

    eliminarMetodoPago(index) {
        try {
            const metodosPago = JSON.parse(localStorage.getItem('bsdash_metodosPago') || '["Efectivo", "Tarjeta Débito", "Tarjeta Crédito", "Transferencia"]');
            if (metodosPago.length > 1) {
                metodosPago.splice(index, 1);
                localStorage.setItem('bsdash_metodosPago', JSON.stringify(metodosPago));
                this.cargarConfiguracionPOS();
            } else {
                alert('Debe haber al menos un método de pago');
            }
        } catch (error) {
            console.error('❌ Error eliminando método de pago:', error);
        }
    }

    guardarConfiguracionPOS() {
        try {
            const config = {
                habilitarDescuentos: document.getElementById('habilitarDescuentos').checked,
                solicitarCliente: document.getElementById('solicitarCliente').checked,
                imprimirAutomatico: document.getElementById('imprimirAutomatico').checked,
                ivaPorDefecto: parseFloat(document.getElementById('ivaPorDefecto').value)
            };
            localStorage.setItem('bsdash_configuracion', JSON.stringify(config));
            console.log('💾 Configuración POS guardada');
            return true;
        } catch (error) {
            console.error('❌ Error guardando configuración POS:', error);
            return false;
        }
    }

    // Secuencias
    cargarSecuencias() {
        try {
            const secuencias = JSON.parse(localStorage.getItem('bsdash_secuencias') || '{}');
            
            const secuenciasDefault = {
                facturas: { prefijo: 'FACT', numero: 1, ceros: 3 },
                cotizaciones: { prefijo: 'COT', numero: 1, ceros: 3 },
                ordenes: { prefijo: 'ORD', numero: 1, ceros: 3 },
                reportes: { prefijo: 'REP', numero: 1, ceros: 3 }
            };
            
            const secuenciasCompletas = { ...secuenciasDefault, ...secuencias };
            
            Object.keys(secuenciasCompletas).forEach(tipo => {
                const secuencia = secuenciasCompletas[tipo];
                const numeroFormateado = secuencia.prefijo + '-' + secuencia.numero.toString().padStart(secuencia.ceros, '0');
                document.getElementById(`secuencia${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`).textContent = numeroFormateado;
            });
            
            console.log('🔢 Secuencias cargadas');
        } catch (error) {
            console.error('❌ Error cargando secuencias:', error);
        }
    }

    editarSecuencia(tipo) {
        try {
            this.secuenciaEditando = tipo;
            const secuencias = JSON.parse(localStorage.getItem('bsdash_secuencias') || '{}');
            const secuencia = secuencias[tipo] || { prefijo: tipo.substring(0, 4).toUpperCase(), numero: 1, ceros: 3 };
            
            document.getElementById('tituloModalSecuencia').textContent = `Editar Secuencia de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
            document.getElementById('secuenciaPrefijo').value = secuencia.prefijo;
            document.getElementById('secuenciaNumero').value = secuencia.numero;
            document.getElementById('secuenciaCeros').value = secuencia.ceros;
            
            document.getElementById('modalSecuencia').classList.remove('hidden');
            document.getElementById('modalSecuencia').classList.add('flex');
        } catch (error) {
            console.error('❌ Error editando secuencia:', error);
        }
    }

    cerrarModalSecuencia() {
        document.getElementById('modalSecuencia').classList.add('hidden');
        document.getElementById('modalSecuencia').classList.remove('flex');
    }

    guardarSecuencia(e) {
        e.preventDefault();
        
        try {
            const secuencia = {
                prefijo: document.getElementById('secuenciaPrefijo').value,
                numero: parseInt(document.getElementById('secuenciaNumero').value),
                ceros: parseInt(document.getElementById('secuenciaCeros').value)
            };
            
            const secuencias = JSON.parse(localStorage.getItem('bsdash_secuencias') || '{}');
            secuencias[this.secuenciaEditando] = secuencia;
            localStorage.setItem('bsdash_secuencias', JSON.stringify(secuencias));
            
            this.cerrarModalSecuencia();
            this.cargarSecuencias();
            this.mostrarNotificacion('Secuencia actualizada correctamente', 'success');
        } catch (error) {
            console.error('❌ Error guardando secuencia:', error);
            this.mostrarNotificacion('Error guardando secuencia', 'error');
        }
    }

    // Gestión de Usuarios
    cargarUsuarios() {
        try {
            const usuarios = JSON.parse(localStorage.getItem('bsdash_usuarios') || '[]');
            const tabla = document.getElementById('tablaUsuarios');
            tabla.innerHTML = '';

            if (usuarios.length === 0) {
                // Usuario por defecto
                const usuarioDefault = {
                    id: 1,
                    nombre: 'John Berroa',
                    email: 'admin@bsdash.com',
                    username: 'admin',
                    rol: 'admin',
                    activo: true
                };
                usuarios.push(usuarioDefault);
                localStorage.setItem('bsdash_usuarios', JSON.stringify(usuarios));
            }

            usuarios.forEach(usuario => {
                const rolColor = {
                    'admin': 'purple',
                    'vendedor': 'blue',
                    'inventario': 'green',
                    'reportes': 'orange'
                }[usuario.rol] || 'gray';
                
                tabla.innerHTML += `
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="py-3 px-4">
                            <div class="font-medium">${usuario.nombre}</div>
                            <div class="text-sm text-gray-500">@${usuario.username}</div>
                        </td>
                        <td class="py-3 px-4">
                            <span class="text-xs bg-${rolColor}-100 text-${rolColor}-800 px-2 py-1 rounded capitalize">${usuario.rol}</span>
                        </td>
                        <td class="py-3 px-4">
                            <span class="text-xs ${usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-2 py-1 rounded">
                                ${usuario.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td class="py-3 px-4">
                            <button onclick="configuracionManager.editarUsuario(${usuario.id})" class="bs-btn text-sm mr-2">
                                <i class="bi bi-pencil"></i>
                            </button>
                            ${usuario.id !== 1 ? `<button onclick="configuracionManager.eliminarUsuario(${usuario.id})" class="bs-btn bg-red-50 text-red-600 text-sm">
                                <i class="bi bi-trash"></i>
                            </button>` : ''}
                        </td>
                    </tr>
                `;
            });
            
            console.log('👥 Usuarios cargados');
        } catch (error) {
            console.error('❌ Error cargando usuarios:', error);
        }
    }

    abrirModalUsuario() {
        document.getElementById('tituloModalUsuario').textContent = 'Nuevo Usuario';
        document.getElementById('formUsuario').reset();
        document.getElementById('modalUsuario').classList.remove('hidden');
        document.getElementById('modalUsuario').classList.add('flex');
    }

    cerrarModalUsuario() {
        document.getElementById('modalUsuario').classList.add('hidden');
        document.getElementById('modalUsuario').classList.remove('flex');
    }

    guardarUsuario(e) {
        e.preventDefault();
        
        try {
            const usuario = {
                id: Date.now(),
                nombre: document.getElementById('usuarioNombre').value,
                email: document.getElementById('usuarioEmail').value,
                username: document.getElementById('usuarioUsername').value,
                password: document.getElementById('usuarioPassword').value,
                rol: document.getElementById('usuarioRol').value,
                activo: true
            };
            
            const usuarios = JSON.parse(localStorage.getItem('bsdash_usuarios') || '[]');
            usuarios.push(usuario);
            localStorage.setItem('bsdash_usuarios', JSON.stringify(usuarios));
            
            this.cerrarModalUsuario();
            this.cargarUsuarios();
            this.mostrarNotificacion('Usuario creado correctamente', 'success');
        } catch (error) {
            console.error('❌ Error guardando usuario:', error);
            this.mostrarNotificacion('Error guardando usuario', 'error');
        }
    }

    // Gestión de Clientes
    cargarClientes() {
        try {
            if (window.dbManager) {
                const clientes = window.dbManager.getClientes();
                const tabla = document.getElementById('tablaClientes');
                tabla.innerHTML = '';

                clientes.forEach(cliente => {
                    tabla.innerHTML += `
                        <tr class="border-b border-gray-200 hover:bg-gray-50">
                            <td class="py-3 px-4 font-mono text-sm">${cliente.codigo}</td>
                            <td class="py-3 px-4">${cliente.nombre}</td>
                            <td class="py-3 px-4 text-sm">${cliente.ruc_ci}</td>
                            <td class="py-3 px-4 text-sm">${cliente.telefono || '-'}</td>
                            <td class="py-3 px-4">
                                <button onclick="configuracionManager.editarCliente(${cliente.id})" class="bs-btn text-sm">
                                    <i class="bi bi-pencil"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
                console.log('👥 Clientes cargados desde DB Manager');
            } else {
                console.log('⚠️ DB Manager no disponible, usando localStorage');
                this.cargarClientesLocal();
            }
        } catch (error) {
            console.error('❌ Error cargando clientes:', error);
        }
    }

    cargarClientesLocal() {
        const clientes = JSON.parse(localStorage.getItem('bsdash_clientes') || '[]');
        const tabla = document.getElementById('tablaClientes');
        tabla.innerHTML = '';

        clientes.forEach(cliente => {
            tabla.innerHTML += `
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="py-3 px-4 font-mono text-sm">${cliente.codigo}</td>
                    <td class="py-3 px-4">${cliente.nombre}</td>
                    <td class="py-3 px-4 text-sm">${cliente.ruc_ci}</td>
                    <td class="py-3 px-4 text-sm">${cliente.telefono || '-'}</td>
                    <td class="py-3 px-4">
                        <button onclick="configuracionManager.editarClienteLocal('${cliente.codigo}')" class="bs-btn text-sm">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    abrirModalCliente() {
        this.clienteEditando = null;
        document.getElementById('tituloModalCliente').textContent = 'Nuevo Cliente';
        document.getElementById('formCliente').reset();
        document.getElementById('modalCliente').classList.remove('hidden');
        document.getElementById('modalCliente').classList.add('flex');
    }

    cerrarModalCliente() {
        document.getElementById('modalCliente').classList.add('hidden');
        document.getElementById('modalCliente').classList.remove('flex');
    }

    guardarCliente(e) {
        e.preventDefault();
        
        try {
            const cliente = {
                codigo: document.getElementById('clienteCodigo').value,
                nombre: document.getElementById('clienteNombre').value,
                ruc_ci: document.getElementById('clienteIdentificacion').value,
                telefono: document.getElementById('clienteTelefono').value,
                email: document.getElementById('clienteEmail').value,
                direccion: document.getElementById('clienteDireccion').value
            };

            if (window.dbManager) {
                if (this.clienteEditando) {
                    cliente.id = this.clienteEditando.id;
                    window.dbManager.actualizarCliente(cliente);
                } else {
                    window.dbManager.agregarCliente(cliente);
                }
            } else {
                // Usar localStorage como fallback
                const clientes = JSON.parse(localStorage.getItem('bsdash_clientes') || '[]');
                if (this.clienteEditando) {
                    const index = clientes.findIndex(c => c.codigo === this.clienteEditando.codigo);
                    if (index !== -1) {
                        clientes[index] = cliente;
                    }
                } else {
                    clientes.push(cliente);
                }
                localStorage.setItem('bsdash_clientes', JSON.stringify(clientes));
            }

            this.cerrarModalCliente();
            this.cargarClientes();
            this.mostrarNotificacion('Cliente guardado correctamente', 'success');
        } catch (error) {
            console.error('❌ Error guardando cliente:', error);
            this.mostrarNotificacion('Error guardando cliente', 'error');
        }
    }

    // Azure Cloud Configuration
    cargarConfiguracionAzure() {
        try {
            if (window.azureConfig) {
                document.getElementById('azureCosmosEndpoint').value = window.azureConfig.cosmosEndpoint || '';
                document.getElementById('azureCosmosKey').value = window.azureConfig.cosmosKey || '';
                document.getElementById('azureClientId').value = window.azureConfig.clientId || '';
                document.getElementById('azureClientSecret').value = window.azureConfig.clientSecret || '';
                document.getElementById('azureTenantId').value = window.azureConfig.tenantId || '';
                this.actualizarEstadoAzure();
                console.log('☁️ Configuración Azure cargada');
            }
        } catch (error) {
            console.error('❌ Error cargando configuración Azure:', error);
        }
    }

    guardarConfiguracionAzure() {
        try {
            const config = {
                endpoint: document.getElementById('azureCosmosEndpoint').value.trim(),
                key: document.getElementById('azureCosmosKey').value.trim(),
                clientId: document.getElementById('azureClientId').value.trim(),
                clientSecret: document.getElementById('azureClientSecret').value.trim(),
                tenantId: document.getElementById('azureTenantId').value.trim()
            };

            if (!config.endpoint || !config.key || !config.clientId || !config.clientSecret || !config.tenantId) {
                this.mostrarNotificacion('❌ Todos los campos de Azure son requeridos', 'error');
                return false;
            }

            window.azureConfig.saveToLocalStorage(config);
            this.actualizarEstadoAzure();
            this.mostrarNotificacion('✅ Configuración Azure guardada correctamente', 'success');
            return true;
        } catch (error) {
            console.error('❌ Error guardando configuración Azure:', error);
            this.mostrarNotificacion('❌ Error guardando configuración Azure', 'error');
            return false;
        }
    }

    async probarConexionAzure() {
        try {
            const cosmosConnected = await window.cosmosService.connect();
            const graphConnected = await window.oneDriveService.authenticate();
            
            if (cosmosConnected && graphConnected) {
                this.mostrarNotificacion('✅ Conexión Azure exitosa', 'success');
            } else if (cosmosConnected) {
                this.mostrarNotificacion('⚠️ Solo Cosmos DB conectado', 'warning');
            } else if (graphConnected) {
                this.mostrarNotificacion('⚠️ Solo OneDrive conectado', 'warning');
            } else {
                this.mostrarNotificacion('❌ Error de conexión Azure', 'error');
            }
            
            return { cosmosConnected, graphConnected };
        } catch (error) {
            this.mostrarNotificacion('❌ Error en conexión Azure', 'error');
            throw error;
        }
    }

    actualizarEstadoAzure() {
        const isConfigured = window.azureConfig && window.azureConfig.isAzureConfigured();
        console.log('🔧 Estado Azure:', isConfigured ? 'Configurado' : 'No configurado');
    }

    // Funciones generales
    personalizarPlantilla(tipo) {
        localStorage.setItem('plantillaEditando', tipo);
        window.location.href = `editor-plantillas.html?tipo=${tipo}`;
    }

    guardarTodaConfiguracion() {
        const resultados = [
            this.guardarInformacionEmpresa(),
            this.guardarConfiguracionPOS(),
            this.guardarConfiguracionAzure()
        ];
        
        if (resultados.every(r => r)) {
            this.mostrarNotificacion('✅ Toda la configuración ha sido guardada correctamente', 'success');
        } else {
            this.mostrarNotificacion('⚠️ Algunas configuraciones no se pudieron guardar', 'error');
        }
    }

    restablecerConfiguracion() {
        if (confirm('¿Estás seguro de que deseas restablecer toda la configuración a los valores por defecto? Esto no se puede deshacer.')) {
            localStorage.removeItem('bsdash_empresa');
            localStorage.removeItem('bsdash_configuracion');
            localStorage.removeItem('bsdash_metodosPago');
            localStorage.removeItem('bsdash_secuencias');
            localStorage.removeItem('bsdash_usuarios');
            localStorage.removeItem('bsdash_clientes');
            
            this.mostrarNotificacion('Configuración restablecida. Recargando...', 'info');
            setTimeout(() => location.reload(), 1000);
        }
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        const notificacion = document.createElement('div');
        notificacion.textContent = mensaje;
        
        const colors = {
            success: '#10B981',
            error: '#EF4444', 
            info: '#3B82F6'
        };
        
        Object.assign(notificacion.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: colors[tipo] || colors.info,
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            zIndex: '10000',
            fontSize: '14px',
            fontWeight: '500'
        });
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            notificacion.remove();
        }, 4000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.configuracionManager = new ConfiguracionManager();
    
    // Configurar event listeners
    document.getElementById('formSecuencia')?.addEventListener('submit', (e) => window.configuracionManager.guardarSecuencia(e));
    document.getElementById('formUsuario')?.addEventListener('submit', (e) => window.configuracionManager.guardarUsuario(e));
    document.getElementById('formCliente')?.addEventListener('submit', (e) => window.configuracionManager.guardarCliente(e));
});

// Funciones globales para los botones
function agregarMetodoPago() { window.configuracionManager?.agregarMetodoPago(); }
function editarSecuencia(tipo) { window.configuracionManager?.editarSecuencia(tipo); }
function cerrarModalSecuencia() { window.configuracionManager?.cerrarModalSecuencia(); }
function abrirModalUsuario() { window.configuracionManager?.abrirModalUsuario(); }
function cerrarModalUsuario() { window.configuracionManager?.cerrarModalUsuario(); }
function abrirModalCliente() { window.configuracionManager?.abrirModalCliente(); }
function cerrarModalCliente() { window.configuracionManager?.cerrarModalCliente(); }
function personalizarPlantilla(tipo) { window.configuracionManager?.personalizarPlantilla(tipo); }
function guardarTodaConfiguracion() { window.configuracionManager?.guardarTodaConfiguracion(); }
function restablecerConfiguracion() { window.configuracionManager?.restablecerConfiguracion(); }s