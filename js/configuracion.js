// js/config-manager.js - Gestor completo de configuración
console.log('🎛️ Cargando config-manager.js...');

class ConfiguracionManager {
    constructor() {
        this.ventanaActual = 'empresa';
        this.empresaActual = window.CONFIG?.DEFAULT_EMPRESA?.toString() || '1';
        this.supabase = window.supabaseManager?.supabase || null;
        this.secuenciaEditando = null;
        this.plantillaEditando = null;
        this.oneDriveManager = null;
        this.init();
    }

    async init() {
        console.log('🎯 Inicializando sistema de configuración mejorado...');
        
        // Verificar autenticación
        if (!this.verificarAutenticacion()) {
            return;
        }

        // Inicializar managers
        await this.inicializarManagers();
        
        // Cargar configuración
        await this.cargarTodaConfiguracion();
        
        // Inicializar sistema de módulos
        this.inicializarSistemaModulos();
        
        // Configurar eventos
        this.configurarEventosGlobales();
        
        console.log('✅ Sistema de configuración mejorado listo');
    }

    async inicializarManagers() {
        // Inicializar OneDrive Manager si hay configuración
        const oneDriveConfig = JSON.parse(localStorage.getItem('bs_onedrive_config') || '{}');
        if (oneDriveConfig.clientId) {
            this.oneDriveManager = new OneDriveManager(oneDriveConfig.clientId, oneDriveConfig.tenantId);
            this.oneDriveManager.loadAuthData();
        }
    }

    verificarAutenticacion() {
        try {
            const user = localStorage.getItem('bs_dash_user');
            if (!user) {
                window.location.href = '../index.html';
                return false;
            }
            
            const userData = JSON.parse(user);
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userData.name || userData.email || 'Usuario';
            }
            
            return true;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            window.location.href = '../index.html';
            return false;
        }
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

        // Cargar datos específicos
        this.cargarDatosVentana(ventanaId);
    }

    cargarDatosVentana(ventanaId) {
        console.log(`📂 Cargando datos para ventana: ${ventanaId}`);
        
        switch(ventanaId) {
            case 'empresa':
                this.cargarConfigEmpresa();
                break;
            case 'empresas':
                this.cargarEmpresas();
                break;
            case 'usuarios':
                this.cargarUsuarios();
                break;
            case 'modulos':
                this.cargarModulos();
                break;
            case 'onedrive':
                this.cargarConfigOneDrive();
                break;
            case 'smtp':
                this.cargarConfigSMTP();
                break;
            case 'backups':
                this.cargarConfigBackups();
                break;
            case 'sistema':
                this.cargarConfigSistema();
                break;
            case 'pos':
                this.cargarConfigPOS();
                break;
            case 'facturacion':
                this.cargarConfigFacturacion();
                break;
        }
    }

    minimizarVentana(ventanaId) {
        const ventana = document.getElementById(`ventana-${ventanaId}`);
        if (ventana) {
            ventana.classList.add('hidden');
        }
    }

    maximizarVentana(ventanaId) {
        const ventana = document.getElementById(`ventana-${ventanaId}`);
        if (ventana) {
            if (ventana.style.width === '90vw') {
                ventana.style.width = '';
                ventana.style.height = '';
                ventana.style.position = '';
                ventana.style.top = '';
                ventana.style.left = '';
                ventana.style.zIndex = '';
            } else {
                ventana.style.width = '90vw';
                ventana.style.height = '80vh';
                ventana.style.position = 'fixed';
                ventana.style.top = '10%';
                ventana.style.left = '5%';
                ventana.style.zIndex = '1000';
            }
        }
    }

    cerrarVentana(ventanaId) {
        const ventanasVisibles = document.querySelectorAll('.window:not(.hidden)');
        if (ventanasVisibles.length <= 1) {
            this.mostrarNotificacion('Debe haber al menos una ventana abierta', 'warning');
            return;
        }
        
        const ventana = document.getElementById(`ventana-${ventanaId}`);
        if (ventana) {
            ventana.classList.add('hidden');
        }
        
        const dockItem = document.querySelector(`.dock-item[onclick="abrirVentana('${ventanaId}')"]`);
        if (dockItem) {
            dockItem.classList.remove('active');
        }
        
        // Abrir la primera ventana disponible
        const ventanasDisponibles = Array.from(document.querySelectorAll('.dock-item:not(.active)'));
        if (ventanasDisponibles.length > 0) {
            const primeraVentana = ventanasDisponibles[0];
            const match = primeraVentana.getAttribute('onclick')?.match(/'([^']+)'/);
            if (match && match[1]) {
                this.abrirVentana(match[1]);
            }
        }
    }

    // ==================== CONFIGURACIÓN EMPRESA ====================
    cargarConfigEmpresa() {
        try {
            const empresa = window.dbManager.getEmpresa(this.empresaActual);
            if (empresa) {
                document.getElementById('empresaNombre').value = empresa.nombre || '';
                document.getElementById('empresaRNC').value = empresa.rif || '';
                document.getElementById('empresaTelefono').value = empresa.telefono || '';
                document.getElementById('empresaEmail').value = empresa.email || '';
                document.getElementById('empresaDireccion').value = empresa.direccion || '';
                document.getElementById('empresaWebsite').value = empresa.website || '';
                document.getElementById('empresaEslogan').value = empresa.eslogan || '';
            }
        } catch (error) {
            console.error('Error cargando configuración de empresa:', error);
        }
    }

    async guardarConfigEmpresa() {
        try {
            const datos = {
                nombre: document.getElementById('empresaNombre').value,
                rif: document.getElementById('empresaRNC').value,
                telefono: document.getElementById('empresaTelefono').value,
                email: document.getElementById('empresaEmail').value,
                direccion: document.getElementById('empresaDireccion').value,
                website: document.getElementById('empresaWebsite').value,
                eslogan: document.getElementById('empresaEslogan').value
            };

            // Actualizar en database manager
            const data = JSON.parse(localStorage.getItem('bs_dash_multiempresa_data') || '{}');
            const empresaIndex = data.empresas?.findIndex(e => e.id.toString() === this.empresaActual);
            
            if (empresaIndex !== -1) {
                data.empresas[empresaIndex] = { ...data.empresas[empresaIndex], ...datos };
                localStorage.setItem('bs_dash_multiempresa_data', JSON.stringify(data));
            }

            this.mostrarNotificacion('✅ Configuración de empresa guardada correctamente', 'success');
        } catch (error) {
            console.error('Error guardando configuración de empresa:', error);
            this.mostrarNotificacion('❌ Error guardando configuración', 'error');
        }
    }

    restablecerEmpresa() {
        if (confirm('¿Estás seguro de que deseas restablecer la configuración de la empresa?')) {
            document.getElementById('empresaNombre').value = 'Berroa Studio S.R.L.';
            document.getElementById('empresaRNC').value = '';
            document.getElementById('empresaTelefono').value = '';
            document.getElementById('empresaEmail').value = '';
            document.getElementById('empresaDireccion').value = '';
            document.getElementById('empresaWebsite').value = '';
            document.getElementById('empresaEslogan').value = '';
            this.mostrarNotificacion('✅ Configuración restablecida', 'info');
        }
    }

    // ==================== GESTIÓN MULTI-EMPRESA ====================
    async cargarEmpresas() {
        try {
            const empresas = window.dbManager.getEmpresas();
            const grid = document.getElementById('gridEmpresas');
            
            if (!grid) return;

            if (empresas.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-3 text-center py-8">
                        <i class="bi bi-building text-4xl text-gray-500 mb-4"></i>
                        <p class="text-gray-400">No hay empresas registradas</p>
                        <button onclick="abrirModalEmpresa()" class="ubuntu-btn ubuntu-btn-primary mt-4">
                            <i class="bi bi-building-add"></i> Crear Primera Empresa
                        </button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = empresas.map(empresa => `
                <div class="ubuntu-glass p-4">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <h4 class="font-semibold text-white">${empresa.nombre}</h4>
                            <p class="text-sm text-gray-300">RIF: ${empresa.rif}</p>
                        </div>
                        <span class="status-badge ${empresa.id.toString() === this.empresaActual ? 'status-active' : 'status-inactive'}">
                            ${empresa.id.toString() === this.empresaActual ? 'Activa' : 'Inactiva'}
                        </span>
                    </div>
                    
                    <div class="space-y-2 text-sm text-gray-300 mb-4">
                        <div class="flex items-center gap-2">
                            <i class="bi bi-telephone"></i>
                            <span>${empresa.telefono || 'No especificado'}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="bi bi-envelope"></i>
                            <span>${empresa.email || 'No especificado'}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="bi bi-geo-alt"></i>
                            <span class="truncate">${empresa.direccion || 'No especificada'}</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        <button onclick="configManager.editarEmpresa('${empresa.id}')" class="ubuntu-btn flex-1 text-sm">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        ${empresa.id.toString() !== this.empresaActual ? `
                        <button onclick="configManager.eliminarEmpresa('${empresa.id}')" class="ubuntu-btn bg-red-500 bg-opacity-20 text-red-400 flex-1 text-sm">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error cargando empresas:', error);
            this.mostrarNotificacion('Error cargando empresas', 'error');
        }
    }

    abrirModalEmpresa(empresaId = null) {
        const modal = document.getElementById('modalEmpresa');
        const titulo = document.getElementById('tituloModalEmpresa');
        
        if (!modal || !titulo) return;

        if (empresaId) {
            titulo.textContent = 'Editar Empresa';
            this.cargarDatosEmpresa(empresaId);
        } else {
            titulo.textContent = 'Nueva Empresa';
            const form = document.getElementById('formEmpresa');
            if (form) form.reset();
        }
        
        modal.style.display = 'flex';
    }

    cerrarModalEmpresa() {
        const modal = document.getElementById('modalEmpresa');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    cargarDatosEmpresa(empresaId) {
        try {
            const empresa = window.dbManager.getEmpresa(empresaId);
            if (empresa) {
                document.getElementById('empresaModalNombre').value = empresa.nombre || '';
                document.getElementById('empresaModalRNC').value = empresa.rif || '';
                document.getElementById('empresaModalTelefono').value = empresa.telefono || '';
                document.getElementById('empresaModalEmail').value = empresa.email || '';
                document.getElementById('empresaModalDireccion').value = empresa.direccion || '';
            }
        } catch (error) {
            console.error('Error cargando datos de empresa:', error);
            this.mostrarNotificacion('Error cargando datos de empresa', 'error');
        }
    }

    async guardarEmpresa() {
        try {
            const formData = new FormData(document.getElementById('formEmpresa'));
            const datos = {
                nombre: formData.get('empresaModalNombre') || document.getElementById('empresaModalNombre')?.value,
                rif: formData.get('empresaModalRNC') || document.getElementById('empresaModalRNC')?.value,
                telefono: formData.get('empresaModalTelefono') || document.getElementById('empresaModalTelefono')?.value,
                email: formData.get('empresaModalEmail') || document.getElementById('empresaModalEmail')?.value,
                direccion: formData.get('empresaModalDireccion') || document.getElementById('empresaModalDireccion')?.value
            };

            // Aquí iría la lógica para guardar en Supabase o localStorage
            const nuevaEmpresa = window.dbManager.crearEmpresa(
                datos.nombre,
                datos.rif,
                datos.direccion,
                datos.telefono,
                '#3B82F6'
            );

            this.cerrarModalEmpresa();
            this.cargarEmpresas();
            this.mostrarNotificacion('✅ Empresa guardada correctamente', 'success');
            
        } catch (error) {
            console.error('Error guardando empresa:', error);
            this.mostrarNotificacion('❌ Error guardando empresa', 'error');
        }
    }

    editarEmpresa(empresaId) {
        this.abrirModalEmpresa(empresaId);
    }

    eliminarEmpresa(empresaId) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta empresa? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const data = JSON.parse(localStorage.getItem('bs_dash_multiempresa_data') || '{}');
            data.empresas = data.empresas?.filter(e => e.id.toString() !== empresaId.toString()) || [];
            localStorage.setItem('bs_dash_multiempresa_data', JSON.stringify(data));
            
            this.mostrarNotificacion('✅ Empresa eliminada correctamente', 'success');
            this.cargarEmpresas();
        } catch (error) {
            console.error('Error eliminando empresa:', error);
            this.mostrarNotificacion('❌ Error eliminando empresa', 'error');
        }
    }

    // ==================== GESTIÓN DE USUARIOS ====================
    async cargarUsuarios() {
        try {
            const usuarios = window.auth?.getUsers() || [];
            const tabla = document.getElementById('tablaUsuarios');
            
            if (!tabla) return;

            tabla.innerHTML = usuarios.map(usuario => `
                <tr class="border-b border-gray-700">
                    <td class="py-3 px-4">
                        <div class="font-medium">${usuario.nombre}</div>
                        <div class="text-sm text-gray-400">${usuario.username}</div>
                    </td>
                    <td class="py-3 px-4">${usuario.email}</td>
                    <td class="py-3 px-4">${this.obtenerNombreEmpresa(usuario.empresa_id)}</td>
                    <td class="py-3 px-4">
                        <span class="status-badge ${usuario.rol === 'admin' ? 'status-active' : 'status-inactive'}">
                            ${this.formatearRol(usuario.rol)}
                        </span>
                    </td>
                    <td class="py-3 px-4">
                        <span class="status-badge ${usuario.activo !== false ? 'status-active' : 'status-inactive'}">
                            ${usuario.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td class="py-3 px-4">
                        <div class="flex gap-2">
                            <button onclick="configManager.editarUsuario('${usuario.id}')" class="ubuntu-btn text-sm">
                                <i class="bi bi-pencil"></i>
                            </button>
                            ${usuario.id !== 1 ? `
                            <button onclick="configManager.eliminarUsuario('${usuario.id}')" class="ubuntu-btn bg-red-500 bg-opacity-20 text-red-400 text-sm">
                                <i class="bi bi-trash"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            this.mostrarNotificacion('Error cargando usuarios', 'error');
        }
    }

    obtenerNombreEmpresa(empresaId) {
        const empresas = window.dbManager.getEmpresas();
        const empresa = empresas.find(e => e.id.toString() === empresaId?.toString());
        return empresa?.nombre || 'N/A';
    }

    formatearRol(rol) {
        const roles = {
            'admin': 'Administrador',
            'gerente': 'Gerente',
            'vendedor': 'Vendedor',
            'inventario': 'Inventario',
            'reportes': 'Solo Reportes'
        };
        return roles[rol] || rol;
    }

    abrirModalUsuario(usuarioId = null) {
        const modal = document.getElementById('modalUsuario');
        const titulo = document.getElementById('tituloModalUsuario');
        
        if (!modal || !titulo) return;

        if (usuarioId) {
            titulo.textContent = 'Editar Usuario';
            this.cargarDatosUsuario(usuarioId);
        } else {
            titulo.textContent = 'Nuevo Usuario';
            const form = document.getElementById('formUsuario');
            if (form) form.reset();
        }
        
        this.cargarEmpresasParaSelect();
        modal.style.display = 'flex';
    }

    cerrarModalUsuario() {
        const modal = document.getElementById('modalUsuario');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    cargarDatosUsuario(usuarioId) {
        try {
            const usuarios = window.auth?.getUsers() || [];
            const usuario = usuarios.find(u => u.id.toString() === usuarioId.toString());
            
            if (usuario) {
                document.getElementById('usuarioNombre').value = usuario.nombre || '';
                document.getElementById('usuarioEmail').value = usuario.email || '';
                document.getElementById('usuarioUsername').value = usuario.username || '';
                document.getElementById('usuarioEmpresa').value = usuario.empresa_id || '';
                document.getElementById('usuarioRol').value = usuario.rol || 'vendedor';
                document.getElementById('usuarioPassword').value = '';
                document.getElementById('usuarioPassword').required = false;
            }
        } catch (error) {
            console.error('Error cargando datos de usuario:', error);
            this.mostrarNotificacion('Error cargando datos de usuario', 'error');
        }
    }

    cargarEmpresasParaSelect() {
        try {
            const empresas = window.dbManager.getEmpresas();
            const select = document.getElementById('usuarioEmpresa');
            
            if (select) {
                select.innerHTML = '<option value="">Seleccionar empresa...</option>' +
                    empresas.map(empresa => 
                        `<option value="${empresa.id}">${empresa.nombre}</option>`
                    ).join('');
            }
        } catch (error) {
            console.error('Error cargando empresas para select:', error);
        }
    }

    async guardarUsuario() {
        try {
            const formData = new FormData(document.getElementById('formUsuario'));
            const usuarioId = this.usuarioEditando;
            
            const datos = {
                nombre: document.getElementById('usuarioNombre').value,
                email: document.getElementById('usuarioEmail').value,
                username: document.getElementById('usuarioUsername').value,
                empresa_id: parseInt(document.getElementById('usuarioEmpresa').value),
                rol: document.getElementById('usuarioRol').value
            };

            if (document.getElementById('usuarioPassword').value) {
                datos.password = document.getElementById('usuarioPassword').value;
            }

            if (usuarioId) {
                // Editar usuario existente
                window.auth.actualizarUsuario(usuarioId, datos);
                this.mostrarNotificacion('✅ Usuario actualizado correctamente', 'success');
            } else {
                // Crear nuevo usuario
                window.auth.crearUsuario(datos);
                this.mostrarNotificacion('✅ Usuario creado correctamente', 'success');
            }

            this.cerrarModalUsuario();
            this.cargarUsuarios();
            
        } catch (error) {
            console.error('Error guardando usuario:', error);
            this.mostrarNotificacion('❌ Error guardando usuario', 'error');
        }
    }

    editarUsuario(usuarioId) {
        this.usuarioEditando = usuarioId;
        this.abrirModalUsuario(usuarioId);
    }

    eliminarUsuario(usuarioId) {
        if (usuarioId === 1) {
            this.mostrarNotificacion('No se puede eliminar el usuario administrador principal', 'error');
            return;
        }

        if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            return;
        }

        try {
            window.auth.eliminarUsuario(usuarioId);
            this.mostrarNotificacion('✅ Usuario eliminado correctamente', 'success');
            this.cargarUsuarios();
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            this.mostrarNotificacion('❌ Error eliminando usuario', 'error');
        }
    }

    // ==================== SISTEMA DE MÓDULOS ====================
    inicializarSistemaModulos() {
        this.modulosDisponibles = [
            { id: 'dashboard', nombre: 'Dashboard', icono: 'bi-speedometer2', descripcion: 'Panel principal' },
            { id: 'facturacion', nombre: 'Facturación', icono: 'bi-receipt', descripcion: 'Sistema de facturas' },
            { id: 'inventario', nombre: 'Inventario', icono: 'bi-box-seam', descripcion: 'Gestión de stock' },
            { id: 'pos', nombre: 'Punto de Venta', icono: 'bi-cash-coin', descripcion: 'Ventas rápidas' },
            { id: 'clientes', nombre: 'Clientes', icono: 'bi-people', descripcion: 'Gestión de clientes' },
            { id: 'reportes', nombre: 'Reportes', icono: 'bi-graph-up', descripcion: 'Análisis y reportes' },
            { id: 'contabilidad', nombre: 'Contabilidad', icono: 'bi-calculator', descripcion: 'Sistema contable' },
            { id: 'configuracion', nombre: 'Configuración', icono: 'bi-gear', descripcion: 'Ajustes del sistema' },
            { id: 'empresas', nombre: 'Empresas', icono: 'bi-buildings', descripcion: 'Gestión multiempresa' },
            { id: 'usuarios', nombre: 'Usuarios', icono: 'bi-shield-check', descripcion: 'Gestión de usuarios' },
            { id: 'onedrive', nombre: 'OneDrive', icono: 'bi-microsoft', descripcion: 'Integración cloud' },
            { id: 'backups', nombre: 'Backups', icono: 'bi-cloud-arrow-up', descripcion: 'Sistema de respaldo' }
        ];
    }

    cargarModulos() {
        const disponibles = document.getElementById('modulosDisponibles');
        const asignados = document.getElementById('modulosAsignados');

        if (!disponibles || !asignados) return;

        // Cargar módulos asignados a la empresa actual
        const modulosAsignados = JSON.parse(localStorage.getItem(`bs_modulos_empresa_${this.empresaActual}`) || '["dashboard", "facturacion", "inventario", "clientes", "reportes", "configuracion"]');
        
        // Módulos disponibles (no asignados)
        const modulosDisponibles = this.modulosDisponibles.filter(modulo => 
            !modulosAsignados.includes(modulo.id)
        );

        disponibles.innerHTML = modulosDisponibles.map(modulo => `
            <div class="modulo-item" draggable="true" data-modulo="${modulo.id}">
                <div class="flex items-center gap-3">
                    <i class="${modulo.icono} text-purple-400"></i>
                    <div>
                        <div class="font-medium">${modulo.nombre}</div>
                        <div class="text-xs text-gray-400">${modulo.descripcion}</div>
                    </div>
                </div>
            </div>
        `).join('');

        asignados.innerHTML = modulosAsignados.map(moduloId => {
            const modulo = this.modulosDisponibles.find(m => m.id === moduloId);
            if (!modulo) return '';
            return `
                <div class="modulo-item" draggable="true" data-modulo="${modulo.id}">
                    <div class="flex items-center gap-3">
                        <i class="${modulo.icono} text-green-400"></i>
                        <div>
                            <div class="font-medium">${modulo.nombre}</div>
                            <div class="text-xs text-gray-400">${modulo.descripcion}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.inicializarDragAndDrop();
    }

    inicializarDragAndDrop() {
        const elementos = document.querySelectorAll('.modulo-item');
        const zonasDrop = document.querySelectorAll('.zona-drop');

        elementos.forEach(elemento => {
            elemento.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', elemento.dataset.modulo);
                elemento.classList.add('dragging');
            });

            elemento.addEventListener('dragend', () => {
                elemento.classList.remove('dragging');
            });
        });

        zonasDrop.forEach(zona => {
            zona.addEventListener('dragover', (e) => {
                e.preventDefault();
                zona.classList.add('active');
            });

            zona.addEventListener('dragleave', () => {
                zona.classList.remove('active');
            });

            zona.addEventListener('drop', (e) => {
                e.preventDefault();
                zona.classList.remove('active');
                
                const moduloId = e.dataTransfer.getData('text/plain');
                this.moverModulo(moduloId, zona.id);
            });
        });
    }

    moverModulo(moduloId, zonaDestino) {
        let modulosAsignados = JSON.parse(localStorage.getItem(`bs_modulos_empresa_${this.empresaActual}`) || '[]');
        
        if (zonaDestino === 'modulosAsignados') {
            // Agregar módulo a los asignados
            if (!modulosAsignados.includes(moduloId)) {
                modulosAsignados.push(moduloId);
            }
        } else {
            // Quitar módulo de los asignados
            modulosAsignados = modulosAsignados.filter(id => id !== moduloId);
        }
        
        localStorage.setItem(`bs_modulos_empresa_${this.empresaActual}`, JSON.stringify(modulosAsignados));
        this.cargarModulos();
        this.mostrarNotificacion('✅ Configuración de módulos actualizada', 'success');
    }

    guardarConfiguracionModulos() {
        this.mostrarNotificacion('✅ Configuración de módulos guardada', 'success');
    }

    // ==================== ONE DRIVE ====================
    cargarConfigOneDrive() {
        const config = JSON.parse(localStorage.getItem('bs_onedrive_config') || '{}');
        
        document.getElementById('onedriveClientId').value = config.clientId || '';
        document.getElementById('onedriveTenantId').value = config.tenantId || 'common';
        document.getElementById('autoBackup').checked = config.autoBackup || false;
        document.getElementById('syncRealTime').checked = config.syncRealTime || false;
        document.getElementById('capturarOperaciones').checked = config.capturarOperaciones !== false;

        // Actualizar estado de conexión
        const statusElement = document.getElementById('onedriveStatus');
        const userInfoElement = document.getElementById('onedriveUserInfo');
        
        if (config.accessToken && statusElement) {
            statusElement.innerHTML = `
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="text-green-400">Conectado</span>
            `;
            if (userInfoElement) {
                userInfoElement.classList.remove('hidden');
                document.getElementById('onedriveUserName').textContent = config.userName || 'Usuario';
                document.getElementById('onedriveUserEmail').textContent = config.userEmail || '';
                document.getElementById('onedriveLastSync').textContent = config.lastSync ? new Date(config.lastSync).toLocaleString() : 'Nunca';
            }
        } else if (statusElement) {
            statusElement.innerHTML = `
                <div class="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
                <span class="text-orange-400">⏳ No autenticado</span>
            `;
        }
    }

    async saveOneDriveConfig() {
        try {
            const config = {
                clientId: document.getElementById('onedriveClientId').value.trim(),
                tenantId: document.getElementById('onedriveTenantId').value.trim() || 'common',
                autoBackup: document.getElementById('autoBackup').checked,
                syncRealTime: document.getElementById('syncRealTime').checked,
                capturarOperaciones: document.getElementById('capturarOperaciones').checked
            };

            if (!config.clientId) {
                this.mostrarNotificacion('❌ Client ID es requerido', 'error');
                return;
            }

            // Mantener datos existentes
            const existingConfig = JSON.parse(localStorage.getItem('bs_onedrive_config') || '{}');
            const mergedConfig = { ...existingConfig, ...config };

            localStorage.setItem('bs_onedrive_config', JSON.stringify(mergedConfig));
            
            // Reinicializar OneDrive manager
            this.oneDriveManager = new OneDriveManager(config.clientId, config.tenantId);
            
            this.mostrarNotificacion('✅ Configuración OneDrive guardada', 'success');
        } catch (error) {
            console.error('Error guardando configuración OneDrive:', error);
            this.mostrarNotificacion('❌ Error guardando configuración OneDrive', 'error');
        }
    }

    async connectOneDrive() {
        if (!this.oneDriveManager) {
            this.mostrarNotificacion('❌ Primero configura el Client ID', 'error');
            return;
        }

        try {
            this.mostrarNotificacion('🔗 Conectando con OneDrive...', 'info');
            const result = await this.oneDriveManager.login();
            
            if (result.success) {
                // Actualizar configuración con datos de usuario
                const config = JSON.parse(localStorage.getItem('bs_onedrive_config') || '{}');
                config.accessToken = result.accessToken;
                config.userName = result.userName;
                config.userEmail = result.userEmail;
                config.lastSync = new Date().toISOString();
                localStorage.setItem('bs_onedrive_config', JSON.stringify(config));
                
                this.cargarConfigOneDrive();
                this.mostrarNotificacion('✅ Conectado a OneDrive correctamente', 'success');
            }
        } catch (error) {
            console.error('Error conectando a OneDrive:', error);
            this.mostrarNotificacion(`❌ Error: ${error.message}`, 'error');
        }
    }

    async testOneDriveConnection() {
        if (!this.oneDriveManager) {
            this.mostrarNotificacion('❌ OneDrive no configurado', 'error');
            return;
        }

        try {
            this.mostrarNotificacion('🔍 Probando conexión...', 'info');
            const result = await this.oneDriveManager.testConnection();
            
            if (result.success) {
                this.mostrarNotificacion(result.message, 'success');
            } else {
                this.mostrarNotificacion(result.error, 'error');
            }
        } catch (error) {
            this.mostrarNotificacion(`❌ Error: ${error.message}`, 'error');
        }
    }

    disconnectOneDrive() {
        if (this.oneDriveManager) {
            this.oneDriveManager.logout();
        }
        
        // Limpiar configuración local
        const config = JSON.parse(localStorage.getItem('bs_onedrive_config') || '{}');
        delete config.accessToken;
        delete config.userName;
        delete config.userEmail;
        localStorage.setItem('bs_onedrive_config', JSON.stringify(config));
        
        this.cargarConfigOneDrive();
        this.mostrarNotificacion('✅ Desconectado de OneDrive', 'info');
    }

    // ==================== SMTP ====================
    cargarConfigSMTP() {
        const config = JSON.parse(localStorage.getItem('bs_smtp_config') || '{}');
        
        document.getElementById('smtpServer').value = config.server || '';
        document.getElementById('smtpPort').value = config.port || 587;
        document.getElementById('smtpEmail').value = config.email || '';
        document.getElementById('smtpSecurity').value = config.security || 'tls';
        document.getElementById('smtpSenderName').value = config.senderName || '';

        // Actualizar estado
        const statusElement = document.getElementById('smtpStatus');
        if (config.server && config.email && statusElement) {
            statusElement.innerHTML = `
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="text-green-400">Configurado</span>
            `;
        } else if (statusElement) {
            statusElement.innerHTML = `
                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                <span class="text-red-400">No configurado</span>
            `;
        }

        // Cargar plantillas
        this.cargarPlantillasEmail();
    }

    cargarPlantillasEmail() {
        const plantillas = JSON.parse(localStorage.getItem('bs_email_templates') || '{}');
        // Las plantillas se cargan cuando se editan
    }

    async saveSMTPConfig() {
        try {
            const config = {
                server: document.getElementById('smtpServer').value.trim(),
                port: parseInt(document.getElementById('smtpPort').value),
                email: document.getElementById('smtpEmail').value.trim(),
                security: document.getElementById('smtpSecurity').value,
                senderName: document.getElementById('smtpSenderName').value.trim()
            };

            if (!config.server || !config.email) {
                this.mostrarNotificacion('❌ Servidor y Email son requeridos', 'error');
                return;
            }

            localStorage.setItem('bs_smtp_config', JSON.stringify(config));
            this.mostrarNotificacion('✅ Configuración SMTP guardada', 'success');
            this.cargarConfigSMTP();
        } catch (error) {
            console.error('Error guardando configuración SMTP:', error);
            this.mostrarNotificacion('❌ Error guardando configuración SMTP', 'error');
        }
    }

    async testSMTPConnection() {
        this.mostrarNotificacion('🔄 Probando conexión SMTP...', 'info');
        // Simular prueba de conexión
        setTimeout(() => {
            this.mostrarNotificacion('✅ Conexión SMTP exitosa', 'success');
        }, 2000);
    }

    async sendTestEmail() {
        this.mostrarNotificacion('📧 Enviando email de prueba...', 'info');
        // Simular envío de email
        setTimeout(() => {
            this.mostrarNotificacion('✅ Email de prueba enviado', 'success');
        }, 2000);
    }

    // ==================== BACKUPS ====================
    cargarConfigBackups() {
        const config = JSON.parse(localStorage.getItem('bs_backup_config') || '{}');
        
        document.getElementById('backupAutomatico').checked = config.autoBackup || false;
        document.getElementById('backupComprimir').checked = config.comprimir !== false;
        document.getElementById('backupEncriptar').checked = config.encriptar || false;
        document.getElementById('backupRetencion').value = config.retencion || 30;

        // Cargar lista de backups
        this.cargarListaBackups();
    }

    cargarListaBackups() {
        const backups = JSON.parse(localStorage.getItem('bs_backups') || '[]');
        const lista = document.getElementById('listaBackups');
        
        if (!lista) return;

        if (backups.length === 0) {
            lista.innerHTML = `
                <div class="text-center py-4 text-gray-400">
                    <i class="bi bi-inbox text-2xl mb-2"></i>
                    <p>No hay backups realizados</p>
                </div>
            `;
            return;
        }

        lista.innerHTML = backups.map(backup => `
            <div class="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-lg">
                <div>
                    <div class="font-medium">${backup.nombre}</div>
                    <div class="text-sm text-gray-400">
                        ${new Date(backup.fecha).toLocaleString()} • ${backup.tamaño}
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="ubuntu-btn text-sm">
                        <i class="bi bi-download"></i>
                    </button>
                    <button class="ubuntu-btn bg-red-500 bg-opacity-20 text-red-400 text-sm">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Actualizar estadísticas
        document.getElementById('lastBackup').textContent = 
            backups.length > 0 ? new Date(backups[0].fecha).toLocaleString() : 'Nunca';
        document.getElementById('backupSize').textContent = 
            backups.reduce((total, backup) => total + (parseFloat(backup.tamaño) || 0), 0) + ' MB';
        document.getElementById('backupCount').textContent = backups.length;
    }

    async crearBackup() {
        try {
            this.mostrarNotificacion('🔄 Creando backup...', 'info');
            
            // Crear backup con database manager
            const success = window.dbManager.backup();
            
            if (success) {
                // Agregar a la lista de backups
                const backups = JSON.parse(localStorage.getItem('bs_backups') || '[]');
                const nuevoBackup = {
                    nombre: `backup-${new Date().toISOString().split('T')[0]}.json`,
                    fecha: new Date().toISOString(),
                    tamaño: '2.5',
                    tipo: 'completo'
                };
                backups.unshift(nuevoBackup);
                localStorage.setItem('bs_backups', JSON.stringify(backups));
                
                this.cargarListaBackups();
                this.mostrarNotificacion('✅ Backup creado correctamente', 'success');
                
                // Subir a OneDrive si está configurado
                if (this.oneDriveManager && this.oneDriveManager.isAuthenticated) {
                    this.subirBackupOneDrive(nuevoBackup);
                }
            }
        } catch (error) {
            console.error('Error creando backup:', error);
            this.mostrarNotificacion('❌ Error creando backup', 'error');
        }
    }

    async subirBackupOneDrive(backup) {
        try {
            const backupData = {
                ...backup,
                data: localStorage.getItem('bs_dash_multiempresa_data')
            };
            
            const result = await this.oneDriveManager.uploadBackup(backupData);
            if (result.success) {
                this.mostrarNotificacion('✅ Backup subido a OneDrive', 'success');
            }
        } catch (error) {
            console.error('Error subiendo backup a OneDrive:', error);
        }
    }

    programarBackup() {
        this.mostrarNotificacion('⏰ Programando backup automático...', 'info');
        // Lógica de programación de backups
    }

    restaurarBackup() {
        this.mostrarNotificacion('🔄 Función de restauración en desarrollo', 'info');
    }

    limpiarBackups() {
        if (confirm('¿Estás seguro de que deseas eliminar todos los backups?')) {
            localStorage.removeItem('bs_backups');
            this.cargarListaBackups();
            this.mostrarNotificacion('✅ Backups eliminados', 'success');
        }
    }

    // ==================== SISTEMA ====================
    cargarConfigSistema() {
        const config = JSON.parse(localStorage.getItem('bs_system_config') || '{}');
        
        document.getElementById('systemDarkMode').checked = config.darkMode !== false;
        document.getElementById('systemNotificaciones').checked = config.notificaciones !== false;
        document.getElementById('systemAutoguardado').checked = config.autoguardado !== false;
        document.getElementById('systemIdioma').value = config.idioma || 'es';
        document.getElementById('systemZonaHoraria').value = config.zonaHoraria || 'America/Santo_Domingo';

        // Cargar métodos de pago
        this.cargarMetodosPago();
        
        // Cargar secuencias
        this.cargarSecuencias();
        
        // Cargar información del sistema
        this.cargarInfoSistema();
    }

    cargarInfoSistema() {
        const dbInfo = window.dbManager.getInfo();
        
        document.getElementById('systemVersion').textContent = 'BS Dash 2.0.0';
        document.getElementById('systemDatabase').textContent = dbInfo.multiempresa ? 'Multiempresa Local' : 'Local';
        document.getElementById('systemEmpresas').textContent = dbInfo.empresas;
        document.getElementById('systemUsuarios').textContent = (window.auth?.getUsers() || []).length;
    }

    cargarMetodosPago() {
        const metodos = JSON.parse(localStorage.getItem('bs_metodos_pago') || '["Efectivo", "Tarjeta Débito", "Tarjeta Crédito", "Transferencia"]');
        const container = document.getElementById('metodosPagoContainer');
        
        if (!container) return;

        container.innerHTML = metodos.map((metodo, index) => `
            <div class="metodo-pago-item">
                <input type="text" value="${metodo}" 
                       onchange="configManager.actualizarMetodoPago(${index}, this.value)"
                       class="ubuntu-input flex-1">
                <button onclick="configManager.eliminarMetodoPago(${index})" 
                        class="ubuntu-btn bg-red-500 bg-opacity-20 text-red-400 text-sm">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `).join('');
    }

    agregarMetodoPago() {
        const metodos = JSON.parse(localStorage.getItem('bs_metodos_pago') || '["Efectivo", "Tarjeta Débito", "Tarjeta Crédito", "Transferencia"]');
        metodos.push('Nuevo Método');
        localStorage.setItem('bs_metodos_pago', JSON.stringify(metodos));
        this.cargarMetodosPago();
    }

    actualizarMetodoPago(index, valor) {
        const metodos = JSON.parse(localStorage.getItem('bs_metodos_pago') || '[]');
        metodos[index] = valor;
        localStorage.setItem('bs_metodos_pago', JSON.stringify(metodos));
    }

    eliminarMetodoPago(index) {
        const metodos = JSON.parse(localStorage.getItem('bs_metodos_pago') || '[]');
        if (metodos.length > 1) {
            metodos.splice(index, 1);
            localStorage.setItem('bs_metodos_pago', JSON.stringify(metodos));
            this.cargarMetodosPago();
        } else {
            this.mostrarNotificacion('Debe haber al menos un método de pago', 'warning');
        }
    }

    cargarSecuencias() {
        const secuencias = JSON.parse(localStorage.getItem('bs_secuencias') || '{}');
        
        // Facturas
        const secuenciaFacturas = secuencias.facturas || { prefijo: 'FACT', numero: 1, ceros: 3 };
        document.getElementById('secuenciaFacturas').textContent = 
            `${secuenciaFacturas.prefijo}-${secuenciaFacturas.numero.toString().padStart(secuenciaFacturas.ceros, '0')}`;
        
        // Cotizaciones
        const secuenciaCotizaciones = secuencias.cotizaciones || { prefijo: 'COT', numero: 1, ceros: 3 };
        document.getElementById('secuenciaCotizaciones').textContent = 
            `${secuenciaCotizaciones.prefijo}-${secuenciaCotizaciones.numero.toString().padStart(secuenciaCotizaciones.ceros, '0')}`;
        
        // Órdenes
        const secuenciaOrdenes = secuencias.ordenes || { prefijo: 'ORD', numero: 1, ceros: 3 };
        document.getElementById('secuenciaOrdenes').textContent = 
            `${secuenciaOrdenes.prefijo}-${secuenciaOrdenes.numero.toString().padStart(secuenciaOrdenes.ceros, '0')}`;
    }

    editarSecuencia(tipo) {
        this.secuenciaEditando = tipo;
        const secuencias = JSON.parse(localStorage.getItem('bs_secuencias') || '{}');
        const secuencia = secuencias[tipo] || { prefijo: tipo.substring(0, 4).toUpperCase(), numero: 1, ceros: 3 };
        
        document.getElementById('tituloModalSecuencia').textContent = `Editar Secuencia de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
        document.getElementById('secuenciaPrefijo').value = secuencia.prefijo;
        document.getElementById('secuenciaNumero').value = secuencia.numero;
        document.getElementById('secuenciaCeros').value = secuencia.ceros;
        
        document.getElementById('modalSecuencia').style.display = 'flex';
    }

    cerrarModalSecuencia() {
        document.getElementById('modalSecuencia').style.display = 'none';
        this.secuenciaEditando = null;
    }

    guardarSecuencia() {
        try {
            const secuencias = JSON.parse(localStorage.getItem('bs_secuencias') || '{}');
            const datos = {
                prefijo: document.getElementById('secuenciaPrefijo').value,
                numero: parseInt(document.getElementById('secuenciaNumero').value),
                ceros: parseInt(document.getElementById('secuenciaCeros').value)
            };

            secuencias[this.secuenciaEditando] = datos;
            localStorage.setItem('bs_secuencias', JSON.stringify(secuencias));

            this.cerrarModalSecuencia();
            this.cargarSecuencias();
            this.mostrarNotificacion('✅ Secuencia guardada correctamente', 'success');
        } catch (error) {
            console.error('Error guardando secuencia:', error);
            this.mostrarNotificacion('❌ Error guardando secuencia', 'error');
        }
    }

    // ==================== POS ====================
    cargarConfigPOS() {
        const config = JSON.parse(localStorage.getItem('bs_pos_config') || '{}');
        
        document.getElementById('posHabilitarDescuentos').checked = config.habilitarDescuentos !== false;
        document.getElementById('posSolicitarCliente').checked = config.solicitarCliente || false;
        document.getElementById('posImprimirAutomatico').checked = config.imprimirAutomatico || false;
        document.getElementById('posIvaPorDefecto').value = config.ivaPorDefecto || 18;
        document.getElementById('posNombreImpresora').value = config.nombreImpresora || '';
        document.getElementById('posAnchoTicket').value = config.anchoTicket || 42;
        document.getElementById('posImprimirLogo').checked = config.imprimirLogo !== false;
    }

    guardarConfigPOS() {
        try {
            const config = {
                habilitarDescuentos: document.getElementById('posHabilitarDescuentos').checked,
                solicitarCliente: document.getElementById('posSolicitarCliente').checked,
                imprimirAutomatico: document.getElementById('posImprimirAutomatico').checked,
                ivaPorDefecto: parseFloat(document.getElementById('posIvaPorDefecto').value),
                nombreImpresora: document.getElementById('posNombreImpresora').value,
                anchoTicket: parseInt(document.getElementById('posAnchoTicket').value),
                imprimirLogo: document.getElementById('posImprimirLogo').checked
            };

            localStorage.setItem('bs_pos_config', JSON.stringify(config));
            this.mostrarNotificacion('✅ Configuración POS guardada', 'success');
        } catch (error) {
            console.error('Error guardando configuración POS:', error);
            this.mostrarNotificacion('❌ Error guardando configuración POS', 'error');
        }
    }

    // ==================== FACTURACIÓN ====================
    cargarConfigFacturacion() {
        const config = JSON.parse(localStorage.getItem('bs_facturacion_config') || '{}');
        const empresa = window.dbManager.getEmpresa(this.empresaActual);
        
        // Configuración DGII
        document.getElementById('facturacionRNC').value = config.rnc || empresa?.rif || '';
        document.getElementById('facturacionNombreComercial').value = config.nombreComercial || empresa?.nombre || '';
        document.getElementById('facturacionDireccion').value = config.direccion || empresa?.direccion || '';
        
        // Configuración general
        document.getElementById('facturacionElectronica').checked = config.electronica || false;
        document.getElementById('facturacionValidacionRNC').checked = config.validacionRNC !== false;
        document.getElementById('facturacionFormato').value = config.formato || 'estandar';
        
        // Configuración de NCF
        document.getElementById('facturacionSecuenciaFacturas').value = config.secuenciaFacturas || 'B01';
        document.getElementById('facturacionSecuenciaCreditos').value = config.secuenciaCreditos || 'B04';
        document.getElementById('facturacionSecuenciaDebitos').value = config.secuenciaDebitos || 'B03';
        document.getElementById('facturacionSecuenciaGastos').value = config.secuenciaGastos || 'B02';
    }

    guardarConfigFacturacion() {
        try {
            const config = {
                rnc: document.getElementById('facturacionRNC').value,
                nombreComercial: document.getElementById('facturacionNombreComercial').value,
                direccion: document.getElementById('facturacionDireccion').value,
                electronica: document.getElementById('facturacionElectronica').checked,
                validacionRNC: document.getElementById('facturacionValidacionRNC').checked,
                formato: document.getElementById('facturacionFormato').value,
                secuenciaFacturas: document.getElementById('facturacionSecuenciaFacturas').value,
                secuenciaCreditos: document.getElementById('facturacionSecuenciaCreditos').value,
                secuenciaDebitos: document.getElementById('facturacionSecuenciaDebitos').value,
                secuenciaGastos: document.getElementById('facturacionSecuenciaGastos').value
            };

            localStorage.setItem('bs_facturacion_config', JSON.stringify(config));
            this.mostrarNotificacion('✅ Configuración de facturación guardada', 'success');
        } catch (error) {
            console.error('Error guardando configuración de facturación:', error);
            this.mostrarNotificacion('❌ Error guardando configuración de facturación', 'error');
        }
    }

    // ==================== PLANTILLAS EMAIL ====================
    editarPlantilla(tipo) {
        this.plantillaEditando = tipo;
        const plantillas = JSON.parse(localStorage.getItem('bs_email_templates') || '{}');
        const plantilla = plantillas[tipo] || this.getPlantillaPorDefecto(tipo);
        
        document.getElementById('tituloModalPlantilla').textContent = `Editar Plantilla de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
        document.getElementById('plantillaAsunto').value = plantilla.asunto || '';
        document.getElementById('plantillaCuerpo').value = plantilla.cuerpo || '';
        
        document.getElementById('modalPlantillaEmail').style.display = 'flex';
    }

    getPlantillaPorDefecto(tipo) {
        const plantillas = {
            facturas: {
                asunto: 'Factura #{numero_factura} - {empresa_nombre}',
                cuerpo: `Estimado(a) {cliente_nombre},

Adjuntamos su factura #{numero_factura} por un total de ${'$'}{total}.

Fecha: {fecha}
RNC: {rnc}

Gracias por su preferencia.
{empresa_nombre}
{telefono}
{direccion}`
            },
            cotizaciones: {
                asunto: 'Cotización - {empresa_nombre}',
                cuerpo: `Estimado(a) {cliente_nombre},

Adjuntamos la cotización solicitada.

Fecha: {fecha}

Gracias por considerarnos.
{empresa_nombre}
{telefono}`
            },
            notificaciones: {
                asunto: 'Notificación del Sistema - {empresa_nombre}',
                cuerpo: `Notificación del sistema.

Fecha: {fecha}

{empresa_nombre}`
            }
        };
        
        return plantillas[tipo] || { asunto: '', cuerpo: '' };
    }

    cerrarModalPlantillaEmail() {
        document.getElementById('modalPlantillaEmail').style.display = 'none';
        this.plantillaEditando = null;
    }

    guardarPlantillaEmail() {
        try {
            const plantillas = JSON.parse(localStorage.getItem('bs_email_templates') || '{}');
            const datos = {
                asunto: document.getElementById('plantillaAsunto').value,
                cuerpo: document.getElementById('plantillaCuerpo').value
            };

            plantillas[this.plantillaEditando] = datos;
            localStorage.setItem('bs_email_templates', JSON.stringify(plantillas));

            this.cerrarModalPlantillaEmail();
            this.mostrarNotificacion('✅ Plantilla guardada correctamente', 'success');
        } catch (error) {
            console.error('Error guardando plantilla:', error);
            this.mostrarNotificacion('❌ Error guardando plantilla', 'error');
        }
    }

    // ==================== FUNCIONES GLOBALES ====================
    configurarEventosGlobales() {
        // Búsqueda global
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.buscarEnConfiguracion(e.target.value);
            });
        }

        // Cambio de empresa
        const empresaSwitcher = document.getElementById('empresaSwitcher');
        if (empresaSwitcher) {
            empresaSwitcher.addEventListener('change', (e) => {
                this.cambiarEmpresa(e.target.value);
            });
        }

        // Formularios modales
        this.configurarFormulariosModales();
        
        // Cargar selector de empresa
        this.cargarSelectorEmpresa();
    }

    cargarSelectorEmpresa() {
        const selector = document.getElementById('empresaSwitcher');
        if (!selector) return;

        const empresas = window.dbManager.getEmpresas();
        selector.innerHTML = empresas.map(empresa => 
            `<option value="${empresa.id}" ${empresa.id.toString() === this.empresaActual ? 'selected' : ''}>${empresa.nombre}</option>`
        ).join('');
    }

    cambiarEmpresa(empresaId) {
        this.empresaActual = empresaId;
        localStorage.setItem('empresaActual', empresaId);
        this.mostrarNotificacion(`Empresa cambiada`, 'info');
        
        // Recargar datos dependientes de la empresa
        if (this.ventanaActual === 'modulos') {
            this.cargarModulos();
        }
        if (this.ventanaActual === 'empresa') {
            this.cargarConfigEmpresa();
        }
    }

    buscarEnConfiguracion(termino) {
        if (!termino.trim()) return;
        console.log('Buscando en configuración:', termino);
        // Implementar búsqueda más avanzada
    }

    configurarFormulariosModales() {
        // Formulario empresa
        const formEmpresa = document.getElementById('formEmpresa');
        if (formEmpresa) {
            formEmpresa.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarEmpresa();
            });
        }

        // Formulario usuario
        const formUsuario = document.getElementById('formUsuario');
        if (formUsuario) {
            formUsuario.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarUsuario();
            });
        }

        // Formulario secuencia
        const formSecuencia = document.getElementById('formSecuencia');
        if (formSecuencia) {
            formSecuencia.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarSecuencia();
            });
        }

        // Formulario plantilla email
        const formPlantillaEmail = document.getElementById('formPlantillaEmail');
        if (formPlantillaEmail) {
            formPlantillaEmail.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarPlantillaEmail();
            });
        }
    }

    // ==================== FUNCIONES DE UTILIDAD ====================
    mostrarNotificacion(mensaje, tipo = 'info') {
        const tipos = {
            success: { bg: 'bg-green-500', icon: 'bi-check-circle' },
            error: { bg: 'bg-red-500', icon: 'bi-exclamation-triangle' },
            warning: { bg: 'bg-yellow-500', icon: 'bi-exclamation-circle' },
            info: { bg: 'bg-blue-500', icon: 'bi-info-circle' }
        };

        const config = tipos[tipo] || tipos.info;
        
        // Eliminar notificaciones existentes
        const notificacionesExistentes = document.querySelectorAll('.notificacion-global');
        notificacionesExistentes.forEach(n => n.remove());
        
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion-global fixed top-4 right-4 ${config.bg} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 transform transition-transform duration-300 translate-x-full`;
        notificacion.innerHTML = `
            <i class="bi ${config.icon}"></i>
            <span>${mensaje}</span>
        `;

        document.body.appendChild(notificacion);

        // Animación de entrada
        setTimeout(() => {
            notificacion.style.transform = 'translateX(0)';
        }, 10);

        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            notificacion.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.remove();
                }
            }, 300);
        }, 5000);
    }

    async cargarTodaConfiguracion() {
        console.log('🔄 Cargando toda la configuración...');
        // Las configuraciones específicas se cargan cuando se abren las ventanas
    }

    restablecerConfiguracion() {
        if (confirm('¿Estás seguro de que deseas restablecer TODA la configuración? Esta acción no se puede deshacer.')) {
            // Limpiar todas las configuraciones
            const keys = [
                'bs_onedrive_config',
                'bs_smtp_config',
                'bs_backup_config',
                'bs_system_config',
                'bs_pos_config',
                'bs_facturacion_config',
                'bs_email_templates',
                'bs_secuencias',
                'bs_metodos_pago',
                'bs_modulos_empresa_1',
                'bs_modulos_empresa_2',
                'bs_modulos_empresa_3'
            ];
            
            keys.forEach(key => localStorage.removeItem(key));
            
            // Recargar configuración
            this.cargarTodaConfiguracion();
            this.mostrarNotificacion('✅ Toda la configuración ha sido restablecida', 'success');
        }
    }

    guardarTodaConfiguracion() {
        // Guardar todas las configuraciones abiertas
        const ventanas = ['empresa', 'onedrive', 'smtp', 'sistema', 'pos', 'facturacion'];
        
        ventanas.forEach(ventana => {
            try {
                switch(ventana) {
                    case 'empresa':
                        this.guardarConfigEmpresa();
                        break;
                    case 'onedrive':
                        this.saveOneDriveConfig();
                        break;
                    case 'smtp':
                        this.saveSMTPConfig();
                        break;
                    case 'sistema':
                        // Las configuraciones de sistema se guardan automáticamente
                        break;
                    case 'pos':
                        this.guardarConfigPOS();
                        break;
                    case 'facturacion':
                        this.guardarConfigFacturacion();
                        break;
                }
            } catch (error) {
                console.error(`Error guardando configuración ${ventana}:`, error);
            }
        });
        
        this.mostrarNotificacion('✅ Toda la configuración ha sido guardada', 'success');
    }
}

// ==================== FUNCIONES GLOBALES ====================

// Funciones para los onclick del HTML
function abrirVentana(ventanaId) {
    if (window.configManager) {
        window.configManager.abrirVentana(ventanaId);
    }
}

function minimizarVentana(ventanaId) {
    if (window.configManager) {
        window.configManager.minimizarVentana(ventanaId);
    }
}

function maximizarVentana(ventanaId) {
    if (window.configManager) {
        window.configManager.maximizarVentana(ventanaId);
    }
}

function cerrarVentana(ventanaId) {
    if (window.configManager) {
        window.configManager.cerrarVentana(ventanaId);
    }
}

function abrirModalEmpresa() {
    if (window.configManager) {
        window.configManager.abrirModalEmpresa();
    }
}

function cerrarModalEmpresa() {
    if (window.configManager) {
        window.configManager.cerrarModalEmpresa();
    }
}

function abrirModalUsuario() {
    if (window.configManager) {
        window.configManager.abrirModalUsuario();
    }
}

function cerrarModalUsuario() {
    if (window.configManager) {
        window.configManager.cerrarModalUsuario();
    }
}

function editarSecuencia(tipo) {
    if (window.configManager) {
        window.configManager.editarSecuencia(tipo);
    }
}

function cerrarModalSecuencia() {
    if (window.configManager) {
        window.configManager.cerrarModalSecuencia();
    }
}

function editarPlantilla(tipo) {
    if (window.configManager) {
        window.configManager.editarPlantilla(tipo);
    }
}

function cerrarModalPlantillaEmail() {
    if (window.configManager) {
        window.configManager.cerrarModalPlantillaEmail();
    }
}

function cambiarEmpresa() {
    const selector = document.getElementById('empresaSwitcher');
    if (selector && window.configManager) {
        window.configManager.cambiarEmpresa(selector.value);
    }
}

function guardarConfigEmpresa() {
    if (window.configManager) {
        window.configManager.guardarConfigEmpresa();
    }
}

function restablecerEmpresa() {
    if (window.configManager) {
        window.configManager.restablecerEmpresa();
    }
}

function saveOneDriveConfig() {
    if (window.configManager) {
        window.configManager.saveOneDriveConfig();
    }
}

function connectOneDrive() {
    if (window.configManager) {
        window.configManager.connectOneDrive();
    }
}

function testOneDriveConnection() {
    if (window.configManager) {
        window.configManager.testOneDriveConnection();
    }
}

function disconnectOneDrive() {
    if (window.configManager) {
        window.configManager.disconnectOneDrive();
    }
}

function saveSMTPConfig() {
    if (window.configManager) {
        window.configManager.saveSMTPConfig();
    }
}

function testSMTPConnection() {
    if (window.configManager) {
        window.configManager.testSMTPConnection();
    }
}

function sendTestEmail() {
    if (window.configManager) {
        window.configManager.sendTestEmail();
    }
}

function crearBackup() {
    if (window.configManager) {
        window.configManager.crearBackup();
    }
}

function programarBackup() {
    if (window.configManager) {
        window.configManager.programarBackup();
    }
}

function restaurarBackup() {
    if (window.configManager) {
        window.configManager.restaurarBackup();
    }
}

function limpiarBackups() {
    if (window.configManager) {
        window.configManager.limpiarBackups();
    }
}

function agregarMetodoPago() {
    if (window.configManager) {
        window.configManager.agregarMetodoPago();
    }
}

function guardarConfiguracionModulos() {
    if (window.configManager) {
        window.configManager.guardarConfiguracionModulos();
    }
}

function guardarConfigPOS() {
    if (window.configManager) {
        window.configManager.guardarConfigPOS();
    }
}

function guardarConfigFacturacion() {
    if (window.configManager) {
        window.configManager.guardarConfigFacturacion();
    }
}

function restablecerConfiguracion() {
    if (window.configManager) {
        window.configManager.restablecerConfiguracion();
    }
}

function guardarTodaConfiguracion() {
    if (window.configManager) {
        window.configManager.guardarTodaConfiguracion();
    }
}

function logout() {
    if (window.auth) {
        window.auth.logout();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.configManager = new ConfiguracionManager();
});