// js/empresa-context.js - ACTUALIZADO
class EmpresaManager {
    constructor() {
        this.empresaActual = localStorage.getItem('empresaActual') || window.CONFIG.DEFAULT_EMPRESA.toString();
        this.init();
    }

    async init() {
        // Esperar a que la base de datos esté lista
        await this.cargarEmpresas();
        this.setupSwitcher();
        this.actualizarUI();
        this.cargarDatosEmpresa();
    }

    async cargarEmpresas() {
        this.empresas = window.dbManager.getEmpresas();
        
        // Si no hay empresas, crear la predeterminada
        if (this.empresas.length === 0) {
            console.log('🏢 Creando empresa predeterminada...');
            await window.dbManager.crearEmpresa(
                'Empresa Principal',
                'J-123456789',
                'Caracas, Venezuela',
                '+584123456789',
                '#3B82F6'
            );
            this.empresas = window.dbManager.getEmpresas();
        }
    }

    setupSwitcher() {
        const switcher = document.getElementById('empresaSwitcher');
        if (switcher) {
            // Limpiar opciones existentes
            switcher.innerHTML = '';
            
            // Agregar empresas desde la base de datos
            this.empresas.forEach(empresa => {
                const option = document.createElement('option');
                option.value = empresa.id;
                option.textContent = empresa.nombre;
                if (empresa.id.toString() === this.empresaActual) {
                    option.selected = true;
                }
                switcher.appendChild(option);
            });
            
            switcher.addEventListener('change', (e) => {
                this.cambiarEmpresa(e.target.value);
            });
        }
    }

    cambiarEmpresa(empresaId) {
        this.empresaActual = empresaId;
        localStorage.setItem('empresaActual', empresaId);
        
        this.actualizarUI();
        this.cargarDatosEmpresa();
        this.mostrarNotificacionCambio();
    }

    getEmpresaActual() {
        return window.dbManager.getEmpresa(this.empresaActual) || this.empresas[0];
    }

    actualizarUI() {
        const empresa = this.getEmpresaActual();
        if (!empresa) return;
        
        // Actualizar indicador
        const indicador = document.getElementById('empresaIndicador');
        if (indicador) {
            indicador.textContent = empresa.nombre;
            indicador.style.backgroundColor = empresa.color;
        }

        // Actualizar nombre de empresa en el dashboard
        const empresaNombre = document.getElementById('empresaNombre');
        if (empresaNombre) {
            empresaNombre.textContent = empresa.nombre;
        }

        // Actualizar color del tema
        document.documentElement.style.setProperty('--empresa-color', empresa.color);
    }

    cargarDatosEmpresa() {
        console.log(`📊 Cargando datos para: ${this.getEmpresaActual()?.nombre}`);
        this.actualizarEstadisticas();
    }

    actualizarEstadisticas() {
        const stats = window.dbManager.getEstadisticas(this.empresaActual);
        
        // Actualizar tarjetas del dashboard
        this.actualizarTarjetaVentas(stats.ventas);
        this.actualizarTarjetaProductos(stats.productos, stats.productosBajoStock);
        this.actualizarTarjetaOrdenes(stats.ordenesPendientes);
        this.actualizarTarjetaClientes(stats.clientes);
    }

    actualizarTarjetaVentas(ventas) {
        const elementos = document.querySelectorAll('[data-ventas]');
        elementos.forEach(el => {
            el.textContent = `$${ventas.toLocaleString()}`;
        });
    }

    actualizarTarjetaProductos(total, bajosStock) {
        const elementos = document.querySelectorAll('.bs-stat-card');
        elementos.forEach(el => {
            if (el.textContent.includes('Productos Stock')) {
                const h3 = el.querySelector('h3');
                if (h3) h3.textContent = total.toLocaleString();
                
                const stockBajo = el.querySelector('.text-xs');
                if (stockBajo && stockBajo.textContent.includes('bajos')) {
                    stockBajo.innerHTML = `<i class="bi bi-exclamation-triangle"></i> ${bajosStock} bajos`;
                }
            }
        });
    }

    actualizarTarjetaOrdenes(ordenesPendientes) {
        const elementos = document.querySelectorAll('.bs-stat-card');
        elementos.forEach(el => {
            if (el.textContent.includes('Órdenes Pendientes')) {
                const h3 = el.querySelector('h3');
                if (h3) h3.textContent = ordenesPendientes;
            }
        });
    }

    actualizarTarjetaClientes(clientes) {
        const elementos = document.querySelectorAll('.bs-stat-card');
        elementos.forEach(el => {
            if (el.textContent.includes('Clientes Activos')) {
                const h3 = el.querySelector('h3');
                if (h3) h3.textContent = clientes;
            }
        });
    }

    mostrarNotificacionCambio() {
        const empresa = this.getEmpresaActual();
        if (!empresa) return;

        const notificacion = document.createElement('div');
        notificacion.className = 'empresa-notificacion';
        notificacion.innerHTML = `✅ Cambiado a: <strong>${empresa.nombre}</strong>`;
        
        Object.assign(notificacion.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#10B981',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            zIndex: '1000',
            fontSize: '14px',
            fontWeight: '500'
        });
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            notificacion.remove();
        }, 3000);
    }
}

// Inicializar cuando cargue el dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que el DatabaseManager esté listo
    if (window.dbManager) {
        window.empresaManager = new EmpresaManager();
    } else {
        console.error('❌ DatabaseManager no está disponible');
    }
});