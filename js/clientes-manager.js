// js/clientes-manager.js - CON ACCIONES COMPLETAS
console.log('👥 Cargando clientes-manager.js CON ACCIONES...');

class ClientesManager {
    constructor() {
        this.ventanaActual = 'clientes';
        this.empresaActual = '1';
        this.clientes = [];
        this.categorias = [];
        this.init();
    }

    init() {
        console.log('🎯 Inicializando gestor de clientes...');
        
        if (!this.verificarAutenticacion()) {
            return;
        }

        this.cargarDatosUsuario();
        this.configurarEventos();
        this.verificarConexionMicrosoft();
        
        console.log('✅ Gestor de clientes inicializado');
    }

    // ... (mantener todos los métodos anteriores igual hasta...)

    // ==================== ACCIONES DE CLIENTES ====================

    async verDetallesCliente(clienteId) {
        const cliente = this.clientes.find(c => c.id === clienteId);
        if (!cliente) {
            this.mostrarNotificacion('❌ Cliente no encontrado', 'error');
            return;
        }

        const modalContent = document.getElementById('clienteModalContent');
        modalContent.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <i class="bi bi-person text-white text-2xl"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-xl font-bold">${cliente.displayName}</h3>
                        <p class="text-gray-400">${cliente.companyName || 'Sin empresa'}</p>
                        <p class="text-sm text-gray-500">${cliente.jobTitle || 'Sin cargo'}</p>
                    </div>
                </div>

                <!-- Información de Contacto -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <h4 class="font-semibold text-gray-300 border-b border-gray-700 pb-2">Información de Contacto</h4>
                        <div class="space-y-3">
                            <div class="flex items-center gap-3">
                                <i class="bi bi-envelope text-blue-400"></i>
                                <div>
                                    <div class="text-sm">${cliente.emailAddresses?.[0]?.address || cliente.email || 'No email'}</div>
                                    <div class="text-xs text-gray-500">Email principal</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <i class="bi bi-telephone text-green-400"></i>
                                <div>
                                    <div class="text-sm">${cliente.businessPhones?.[0] || cliente.phone || 'No teléfono'}</div>
                                    <div class="text-xs text-gray-500">Teléfono</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <i class="bi bi-geo-alt text-orange-400"></i>
                                <div>
                                    <div class="text-sm">${cliente.officeLocation || 'Sin ubicación'}</div>
                                    <div class="text-xs text-gray-500">Ubicación</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <h4 class="font-semibold text-gray-300 border-b border-gray-700 pb-2">Información de Cliente</h4>
                        <div class="space-y-3">
                            <div class="flex items-center gap-3">
                                <i class="bi bi-tag text-purple-400"></i>
                                <div>
                                    <div class="text-sm">${cliente.clientType || 'Contacto'}</div>
                                    <div class="text-xs text-gray-500">Tipo de cliente</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <i class="bi bi-credit-card text-yellow-400"></i>
                                <div>
                                    <div class="text-sm">${cliente.billingType || 'Standard'}</div>
                                    <div class="text-xs text-gray-500">Tipo de facturación</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <i class="bi bi-whatsapp text-green-500"></i>
                                <div>
                                    <div class="text-sm">${cliente.whatsapp || 'No configurado'}</div>
                                    <div class="text-xs text-gray-500">WhatsApp</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notas -->
                ${cliente.notes ? `
                <div class="space-y-2">
                    <h4 class="font-semibold text-gray-300 border-b border-gray-700 pb-2">
                        <i class="bi bi-journal-text"></i> Notas
                    </h4>
                    <p class="text-sm bg-gray-800 bg-opacity-50 p-3 rounded-lg">${cliente.notes}</p>
                </div>
                ` : ''}

                <!-- Acciones -->
                <div class="flex gap-3 pt-4 border-t border-gray-700">
                    <button onclick="enviarWhatsAppCliente('${cliente.id}')" class="ubuntu-btn bg-green-600 bg-opacity-20 text-green-400 flex-1">
                        <i class="bi bi-whatsapp"></i> Enviar WhatsApp
                    </button>
                    <button onclick="enviarEmailClientePrompt('${cliente.id}')" class="ubuntu-btn bg-blue-600 bg-opacity-20 text-blue-400 flex-1">
                        <i class="bi bi-envelope"></i> Enviar Email
                    </button>
                    <button onclick="cerrarModalCliente()" class="ubuntu-btn bg-gray-600 bg-opacity-20 text-gray-400">
                        <i class="bi bi-x"></i> Cerrar
                    </button>
                </div>
            </div>
        `;

        document.getElementById('clienteModal').classList.remove('hidden');
    }

    async enviarWhatsAppCliente(clienteId) {
        const cliente = this.clientes.find(c => c.id === clienteId);
        if (!cliente) {
            this.mostrarNotificacion('❌ Cliente no encontrado', 'error');
            return;
        }

        const telefono = cliente.businessPhones?.[0] || cliente.whatsapp || cliente.phone;
        if (!telefono) {
            this.mostrarNotificacion('❌ Cliente no tiene número de teléfono', 'error');
            return;
        }

        // Limpiar número (solo dígitos)
        const numeroLimpio = telefono.replace(/\D/g, '');
        
        const mensaje = prompt(`¿Qué mensaje quieres enviar a ${cliente.displayName}?`, 
                              `Hola ${cliente.displayName}, me comunico de Berroa Studio. ¿Cómo estás?`);
        
        if (!mensaje) return;

        const mensajeCodificado = encodeURIComponent(mensaje);
        const whatsappUrl = `https://wa.me/${numeroLimpio}?text=${mensajeCodificado}`;
        
        // Abrir en nueva pestaña
        window.open(whatsappUrl, '_blank');
        
        this.registrarActividadWhatsApp(clienteId, mensaje);
        this.mostrarNotificacion(`📱 Mensaje preparado para ${cliente.displayName}`, 'success');
    }

    registrarActividadWhatsApp(clienteId, mensaje) {
        const actividad = {
            tipo: 'whatsapp',
            clienteId: clienteId,
            mensaje: mensaje,
            fecha: new Date().toISOString(),
            estado: 'enviado'
        };
        
        let historial = JSON.parse(localStorage.getItem('bs_whatsapp_history') || '[]');
        historial.push(actividad);
        localStorage.setItem('bs_whatsapp_history', JSON.stringify(historial));
        
        console.log('📱 Mensaje WhatsApp registrado:', actividad);
    }

    async enviarEmailCliente(clienteId, asunto, mensaje) {
        const cliente = this.clientes.find(c => c.id === clienteId);
        if (!cliente) {
            this.mostrarNotificacion('❌ Cliente no encontrado', 'error');
            return;
        }

        const email = cliente.emailAddresses?.[0]?.address || cliente.email;
        if (!email) {
            this.mostrarNotificacion('❌ Cliente no tiene email válido', 'error');
            return;
        }

        // Si está conectado a Microsoft, usar Graph API
        if (window.microsoftGraph && window.microsoftGraph.isConnected) {
            try {
                await window.microsoftGraph.sendEmail(email, asunto, mensaje);
                this.mostrarNotificacion(`✅ Email enviado a ${cliente.displayName}`, 'success');
                this.registrarActividadEmail(clienteId, asunto);
                return;
            } catch (error) {
                console.error('❌ Error enviando email por Microsoft:', error);
            }
        }

        // Fallback: Abrir cliente de email
        const emailUrl = `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
        window.location.href = emailUrl;
        
        this.registrarActividadEmail(clienteId, asunto);
        this.mostrarNotificacion(`📧 Email preparado para ${cliente.displayName}`, 'success');
    }

    registrarActividadEmail(clienteId, asunto) {
        const actividad = {
            tipo: 'email',
            clienteId: clienteId,
            asunto: asunto,
            fecha: new Date().toISOString(),
            estado: 'enviado'
        };
        
        let historial = JSON.parse(localStorage.getItem('bs_email_history') || '[]');
        historial.push(actividad);
        localStorage.setItem('bs_email_history', JSON.stringify(historial));
    }

    editarCliente(clienteId) {
        const cliente = this.clientes.find(c => c.id === clienteId);
        if (!cliente) return;

        const nuevoNombre = prompt('Nuevo nombre del cliente:', cliente.displayName);
        if (!nuevoNombre) return;

        const nuevoEmail = prompt('Nuevo email:', cliente.emailAddresses?.[0]?.address || cliente.email);
        const nuevoTelefono = prompt('Nuevo teléfono:', cliente.businessPhones?.[0] || cliente.phone);

        // Actualizar en memoria
        cliente.displayName = nuevoNombre;
        if (cliente.emailAddresses && cliente.emailAddresses[0]) {
            cliente.emailAddresses[0].address = nuevoEmail;
        } else {
            cliente.email = nuevoEmail;
        }
        if (cliente.businessPhones && cliente.businessPhones[0]) {
            cliente.businessPhones[0] = nuevoTelefono;
        } else {
            cliente.phone = nuevoTelefono;
        }

        // Actualizar en localStorage
        localStorage.setItem('bs_microsoft_contacts', JSON.stringify(this.clientes));
        
        // Actualizar vista
        this.actualizarListaClientes();
        this.mostrarNotificacion(`✅ Cliente ${nuevoNombre} actualizado`, 'success');
    }

    crearNuevaCategoria() {
        const nombreCategoria = prompt('Nombre de la nueva categoría:');
        if (!nombreCategoria) return;

        const colorCategoria = prompt('Color de la categoría (ej: #3B82F6):', '#3B82F6');
        
        const nuevaCategoria = {
            id: 'cat_' + Date.now(),
            nombre: nombreCategoria,
            color: colorCategoria,
            clientes: []
        };

        this.categorias.push(nuevaCategoria);
        localStorage.setItem('bs_clientes_categorias', JSON.stringify(this.categorias));
        
        this.mostrarNotificacion(`✅ Categoría "${nombreCategoria}" creada`, 'success');
    }

    // ==================== SISTEMA DE VENTANAS ====================

    abrirVentana(ventanaId) {
        // Ocultar ventana actual
        const ventanaActual = document.getElementById(`ventana-${this.ventanaActual}`);
        if (ventanaActual) {
            ventanaActual.classList.add('hidden');
        }
        
        const dockItemActual = document.querySelector(`.dock-item[onclick="abrirVentana('${this.ventanaActual}')"]`);
        if (dockItemActual) {
            dockItemActual.classList.remove('active');
        }

        // Mostrar nueva ventana
        const ventana = document.getElementById(`ventana-${ventanaId}`);
        if (ventana) {
            ventana.classList.remove('hidden');
            ventana.style.animation = 'none';
            setTimeout(() => {
                ventana.style.animation = 'windowOpen 0.3s ease-out';
            }, 10);
        }

        // Actualizar dock
        const nuevoDockItem = document.querySelector(`.dock-item[onclick="abrirVentana('${ventanaId}')"]`);
        if (nuevoDockItem) {
            nuevoDockItem.classList.add('active');
        }
        
        this.ventanaActual = ventanaId;

        // Cargar datos específicos de la ventana
        this.cargarDatosVentana(ventanaId);
    }

    cargarDatosVentana(ventanaId) {
        switch(ventanaId) {
            case 'categorias':
                this.cargarVentanaCategorias();
                break;
            case 'actividad':
                this.cargarVentanaActividad();
                break;
            case 'importar':
                this.cargarVentanaImportar();
                break;
        }
    }

    cargarVentanaCategorias() {
        const ventana = document.getElementById('ventana-categorias');
        if (!ventana) return;

        const contenido = ventana.querySelector('.window-content');
        contenido.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Categorías de Clientes</h3>
                    <button onclick="crearNuevaCategoria()" class="ubuntu-btn ubuntu-btn-primary">
                        <i class="bi bi-plus-circle"></i> Nueva Categoría
                    </button>
                </div>

                ${this.categorias.length === 0 ? `
                    <div class="text-center py-12 text-gray-400">
                        <i class="bi bi-tags text-4xl mb-4"></i>
                        <p class="text-lg mb-2">No hay categorías creadas</p>
                        <p class="text-sm">Crea categorías para organizar mejor tus clientes</p>
                    </div>
                ` : `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${this.categorias.map(categoria => `
                            <div class="ubuntu-glass p-4 rounded-lg border-l-4" style="border-left-color: ${categoria.color}">
                                <div class="flex justify-between items-start mb-2">
                                    <h4 class="font-semibold">${categoria.nombre}</h4>
                                    <span class="text-xs bg-gray-700 px-2 py-1 rounded">${categoria.clientes.length} clientes</span>
                                </div>
                                <p class="text-sm text-gray-400 mb-3">Organiza tus clientes por tipo o industria</p>
                                <div class="flex gap-2">
                                    <button onclick="editarCategoria('${categoria.id}')" class="ubuntu-btn text-xs">
                                        <i class="bi bi-pencil"></i> Editar
                                    </button>
                                    <button onclick="eliminarCategoria('${categoria.id}')" class="ubuntu-btn bg-red-500 bg-opacity-20 text-red-400 text-xs">
                                        <i class="bi bi-trash"></i> Eliminar
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }

    cargarVentanaActividad() {
        const ventana = document.getElementById('ventana-actividad');
        if (!ventana) return;

        const whatsappHistory = JSON.parse(localStorage.getItem('bs_whatsapp_history') || '[]');
        const emailHistory = JSON.parse(localStorage.getItem('bs_email_history') || '[]');
        const todaActividad = [...whatsappHistory, ...emailHistory].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        const contenido = ventana.querySelector('.window-content');
        contenido.innerHTML = `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold">Actividad Reciente</h3>

                ${todaActividad.length === 0 ? `
                    <div class="text-center py-12 text-gray-400">
                        <i class="bi bi-graph-up text-4xl mb-4"></i>
                        <p class="text-lg mb-2">No hay actividad registrada</p>
                        <p class="text-sm">La actividad con clientes aparecerá aquí</p>
                    </div>
                ` : `
                    <div class="space-y-3 max-h-96 overflow-y-auto">
                        ${todaActividad.slice(0, 20).map(actividad => {
                            const cliente = this.clientes.find(c => c.id === actividad.clienteId);
                            return `
                                <div class="ubuntu-glass p-3 rounded-lg flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full flex items-center justify-center ${
                                        actividad.tipo === 'whatsapp' ? 'bg-green-500' : 'bg-blue-500'
                                    }">
                                        <i class="bi bi-${actividad.tipo === 'whatsapp' ? 'whatsapp' : 'envelope'} text-white text-sm"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="text-sm font-medium">${cliente?.displayName || 'Cliente'}</div>
                                        <div class="text-xs text-gray-400">${actividad.tipo === 'whatsapp' ? 'Mensaje WhatsApp' : 'Email'} - ${actividad.asunto || actividad.mensaje?.substring(0, 50)}...</div>
                                    </div>
                                    <div class="text-xs text-gray-500">
                                        ${new Date(actividad.fecha).toLocaleDateString()}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
    }

    cargarVentanaImportar() {
        const ventana = document.getElementById('ventana-importar');
        if (!ventana) return;

        const contenido = ventana.querySelector('.window-content');
        contenido.innerHTML = `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold">Sincronización Avanzada</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Configuración de Sincronización -->
                    <div class="ubuntu-glass p-4 rounded-lg">
                        <h4 class="font-semibold mb-3">Configuración Automática</h4>
                        <div class="space-y-3">
                            <label class="flex items-center gap-2">
                                <input type="checkbox" class="rounded bg-gray-700 border-gray-600">
                                <span class="text-sm">Sincronización automática cada 24 horas</span>
                            </label>
                            <label class="flex items-center gap-2">
                                <input type="checkbox" class="rounded bg-gray-700 border-gray-600">
                                <span class="text-sm">Solo contactos con email</span>
                            </label>
                            <label class="flex items-center gap-2">
                                <input type="checkbox" class="rounded bg-gray-700 border-gray-600">
                                <span class="text-sm">Incluir contactos personales</span>
                            </label>
                        </div>
                    </div>

                    <!-- Estadísticas -->
                    <div class="ubuntu-glass p-4 rounded-lg">
                        <h4 class="font-semibold mb-3">Estadísticas</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span>Total contactos:</span>
                                <span class="font-medium">${this.clientes.length}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Con email:</span>
                                <span class="font-medium">${this.clientes.filter(c => c.emailAddresses?.[0]?.address || c.email).length}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Con teléfono:</span>
                                <span class="font-medium">${this.clientes.filter(c => c.businessPhones?.[0] || c.phone).length}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Última sincronización:</span>
                                <span class="font-medium">${new Date().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Acciones -->
                <div class="flex gap-3">
                    <button onclick="sincronizarClientes()" class="ubuntu-btn ubuntu-btn-primary">
                        <i class="bi bi-arrow-repeat"></i> Sincronizar Ahora
                    </button>
                    <button onclick="exportarClientes()" class="ubuntu-btn bg-green-600 bg-opacity-20 text-green-400">
                        <i class="bi bi-download"></i> Exportar CSV
                    </button>
                    <button onclick="limpiarCache()" class="ubuntu-btn bg-red-600 bg-opacity-20 text-red-400">
                        <i class="bi bi-trash"></i> Limpiar Cache
                    </button>
                </div>
            </div>
        `;
    }

    // ... (mantener el resto de métodos igual)
}

// ==================== FUNCIONES GLOBALES MEJORADAS ====================

function verDetallesCliente(clienteId) {
    if (window.clientesManager) {
        window.clientesManager.verDetallesCliente(clienteId);
    }
}

function enviarWhatsAppCliente(clienteId) {
    if (window.clientesManager) {
        window.clientesManager.enviarWhatsAppCliente(clienteId);
    }
}

function enviarEmailClientePrompt(clienteId) {
    const asunto = prompt('Asunto del email:');
    if (!asunto) return;
    
    const mensaje = prompt('Mensaje del email:');
    if (!mensaje) return;
    
    if (window.clientesManager) {
        window.clientesManager.enviarEmailCliente(clienteId, asunto, mensaje);
    }
}

function editarCliente(clienteId) {
    if (window.clientesManager) {
        window.clientesManager.editarCliente(clienteId);
    }
}

function crearNuevaCategoria() {
    if (window.clientesManager) {
        window.clientesManager.crearNuevaCategoria();
    }
}

function cerrarModalCliente() {
    document.getElementById('clienteModal').classList.add('hidden');
}

function exportarClientes() {
    if (window.clientesManager) {
        window.clientesManager.mostrarNotificacion('📊 Exportando clientes a CSV...', 'info');
    }
}

function limpiarCache() {
    if (confirm('¿Estás seguro de que deseas limpiar el cache de clientes?')) {
        localStorage.removeItem('bs_microsoft_contacts');
        if (window.clientesManager) {
            window.clientesManager.clientes = [];
            window.clientesManager.actualizarListaClientes();
            window.clientesManager.mostrarNotificacion('✅ Cache limpiado', 'success');
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.clientesManager = new ClientesManager();
});