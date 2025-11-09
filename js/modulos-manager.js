// Gestor de Módulos del Sistema
class ModulosManager {
    constructor() {
        this.modulos = {
            // Módulos Core (siempre disponibles)
            dashboard: {
                id: 'dashboard',
                nombre: 'Dashboard',
                icono: 'bi-speedometer2',
                descripcion: 'Panel principal del sistema',
                url: 'dashboard.html',
                categoria: 'core',
                siempreActivo: true
            },
            configuracion: {
                id: 'configuracion',
                nombre: 'Configuración',
                icono: 'bi-gear',
                descripcion: 'Configuración del sistema',
                url: 'configuracion.html',
                categoria: 'sistema',
                siempreActivo: true
            },

            // Módulos de Gestión Empresarial
            empresas: {
                id: 'empresas',
                nombre: 'Empresas',
                icono: 'bi-buildings',
                descripcion: 'Gestión multiempresa',
                url: 'modules/empresas.html',
                categoria: 'empresa'
            },
            usuarios: {
                id: 'usuarios',
                nombre: 'Usuarios',
                icono: 'bi-shield-check',
                descripcion: 'Gestión de usuarios',
                url: 'modules/usuarios.html',
                categoria: 'sistema'
            },

            // Módulos Operativos
            facturacion: {
                id: 'facturacion',
                nombre: 'Facturación',
                icono: 'bi-receipt',
                descripcion: 'Sistema de facturas electrónicas',
                url: 'modules/facturacion.html',
                categoria: 'ventas'
            },
            inventario: {
                id: 'inventario',
                nombre: 'Inventario',
                icono: 'bi-box-seam',
                descripcion: 'Gestión de stock y productos',
                url: 'modules/inventario.html',
                categoria: 'operaciones'
            },
            pos: {
                id: 'pos',
                nombre: 'Punto de Venta',
                icono: 'bi-cash-coin',
                descripcion: 'Ventas rápidas POS',
                url: 'modules/pos.html',
                categoria: 'ventas'
            },
            clientes: {
                id: 'clientes',
                nombre: 'Clientes',
                icono: 'bi-people',
                descripcion: 'Gestión de clientes',
                url: 'modules/clientes.html',
                categoria: 'ventas'
            },

            // Módulos de Reportes
            reportes: {
                id: 'reportes',
                nombre: 'Reportes',
                icono: 'bi-graph-up',
                descripcion: 'Análisis y reportes',
                url: 'modules/reportes.html',
                categoria: 'analitica'
            },
            contabilidad: {
                id: 'contabilidad',
                nombre: 'Contabilidad',
                icono: 'bi-calculator',
                descripcion: 'Sistema contable',
                url: 'modules/contabilidad.html',
                categoria: 'finanzas'
            },

            // Módulos de Integración
            onedrive: {
                id: 'onedrive',
                nombre: 'OneDrive',
                icono: 'bi-microsoft',
                descripcion: 'Integración con Microsoft OneDrive',
                url: 'modules/onedrive.html',
                categoria: 'integracion'
            },
            smtp: {
                id: 'smtp',
                nombre: 'SMTP',
                icono: 'bi-envelope',
                descripcion: 'Configuración de correo',
                url: 'modules/smtp.html',
                categoria: 'integracion'
            },
            backups: {
                id: 'backups',
                nombre: 'Backups',
                icono: 'bi-cloud-arrow-up',
                descripcion: 'Sistema de respaldos',
                url: 'modules/backups.html',
                categoria: 'sistema'
            }
        };
    }

    // Obtener módulos activos para una empresa
    getModulosActivos(empresaId = '1') {
        try {
            const modulosGuardados = localStorage.getItem(`bs_modulos_empresa_${empresaId}`);
            
            if (!modulosGuardados) {
                // Si no hay módulos guardados, usar módulos por defecto
                return this.getModulosPorDefecto();
            }
            
            const modulosIds = JSON.parse(modulosGuardados);
            const modulosActivos = [];
            
            // Agregar módulos core primero (siempre activos)
            Object.values(this.modulos).forEach(modulo => {
                if (modulo.siempreActivo) {
                    modulosActivos.push(modulo);
                }
            });
            
            // Agregar módulos activos según configuración
            modulosIds.forEach(moduloId => {
                if (this.modulos[moduloId] && !this.modulos[moduloId].siempreActivo) {
                    modulosActivos.push(this.modulos[moduloId]);
                }
            });
            
            return modulosActivos;
        } catch (error) {
            console.error('Error obteniendo módulos activos:', error);
            return this.getModulosPorDefecto();
        }
    }

    // Módulos por defecto para nuevas empresas
    getModulosPorDefecto() {
        return [
            this.modulos.dashboard,
            this.modulos.facturacion,
            this.modulos.inventario,
            this.modulos.clientes,
            this.modulos.configuracion,
            this.modulos.empresas,
            this.modulos.usuarios
        ];
    }

    // Obtener todos los módulos disponibles
    getTodosLosModulos() {
        return Object.values(this.modulos);
    }

    // Guardar configuración de módulos para una empresa
    guardarModulosEmpresa(empresaId, modulosIds) {
        try {
            // Siempre incluir módulos core
            const modulosCore = Object.values(this.modulos)
                .filter(modulo => modulo.siempreActivo)
                .map(modulo => modulo.id);
            
            const todosModulos = [...new Set([...modulosCore, ...modulosIds])];
            localStorage.setItem(`bs_modulos_empresa_${empresaId}`, JSON.stringify(todosModulos));
            return true;
        } catch (error) {
            console.error('Error guardando módulos:', error);
            return false;
        }
    }

    // Verificar si un módulo está activo
    isModuloActivo(empresaId, moduloId) {
        const modulosActivos = this.getModulosActivos(empresaId);
        return modulosActivos.some(modulo => modulo.id === moduloId);
    }

    // Obtener módulos por categoría
    getModulosPorCategoria(empresaId) {
        const modulosActivos = this.getModulosActivos(empresaId);
        const categorias = {};
        
        modulosActivos.forEach(modulo => {
            if (!categorias[modulo.categoria]) {
                categorias[modulo.categoria] = [];
            }
            categorias[modulo.categoria].push(modulo);
        });
        
        return categorias;
    }
}

// Inicializar globalmente
window.modulosManager = new ModulosManager();