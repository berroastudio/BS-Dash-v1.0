// js/pos-system.js - Sistema completo de POS con gestión de caja
class POSSystem {
    constructor() {
        this.carrito = [];
        this.configuracion = {};
        this.cajaAbierta = false;
        this.ventaActual = null;
        this.clienteSeleccionado = null;
        this.init();
    }

    init() {
        console.log('🔄 Iniciando sistema POS...');
        this.cargarConfiguracion();
        this.verificarEstadoCaja();
        this.cargarProductos();
        this.actualizarFechaHora();
        setInterval(() => this.actualizarFechaHora(), 1000);
        
        // Event listeners
        document.getElementById('formCaja')?.addEventListener('submit', (e) => this.gestionarCajaSubmit(e));
        document.getElementById('pagoRecibido')?.addEventListener('input', () => this.calcularCambio());
    }

    cargarConfiguracion() {
        this.configuracion = JSON.parse(localStorage.getItem('bsdash_configuracion') || '{}');
        document.getElementById('itbisPorcentaje').textContent = this.configuracion.itbisPorDefecto || 18;
    }

    verificarEstadoCaja() {
        const cajaActual = JSON.parse(localStorage.getItem('bsdash_caja_actual') || 'null');
        
        if (cajaActual && !cajaActual.fecha_cierre) {
            this.cajaAbierta = true;
            this.actualizarInterfazCaja(true, cajaActual);
        } else {
            this.cajaAbierta = false;
            this.actualizarInterfazCaja(false);
        }
    }

    actualizarInterfazCaja(abierta, datosCaja = null) {
        const estadoCaja = document.getElementById('estadoCaja');
        const btnCaja = document.getElementById('btnCaja');
        
        if (abierta) {
            estadoCaja.textContent = `Caja Abierta - $${datosCaja?.fondo_inicial || 0}`;
            estadoCaja.className = 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800';
            btnCaja.innerHTML = '<i class="bi bi-safe-fill"></i> Cerrar Caja';
            btnCaja.className = 'bs-btn bg-yellow-50 text-yellow-600 border-yellow-200';
            document.getElementById('btnProcesarVenta').disabled = false;
        } else {
            estadoCaja.textContent = 'Caja Cerrada';
            estadoCaja.className = 'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800';
            btnCaja.innerHTML = '<i class="bi bi-safe"></i> Abrir Caja';
            btnCaja.className = 'bs-btn bg-red-50 text-red-600 border-red-200';
            document.getElementById('btnProcesarVenta').disabled = true;
        }
    }

    gestionarCaja() {
        if (this.cajaAbierta) {
            this.prepararCierreCaja();
        } else {
            this.abrirModalCaja();
        }
    }

    abrirModalCaja() {
        document.getElementById('tituloModalCaja').textContent = 'Apertura de Caja';
        document.getElementById('btnAccionCaja').textContent = 'Abrir Caja';
        document.getElementById('fondoInicial').value = '0';
        document.getElementById('observacionesCaja').value = '';
        document.getElementById('modalCaja').classList.remove('hidden');
        document.getElementById('modalCaja').classList.add('flex');
    }

    prepararCierreCaja() {
        const cajaActual = JSON.parse(localStorage.getItem('bsdash_caja_actual'));
        const ventas = this.obtenerVentasDelDia();
        
        const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);
        const totalEfectivo = ventas.filter(v => v.metodo_pago === 'Efectivo')
                                  .reduce((sum, venta) => sum + venta.total, 0);
        
        const resumen = `
RESUMEN DE CAJA
---------------
Fondo Inicial: $${cajaActual.fondo_inicial}
Total Ventas: $${totalVentas.toFixed(2)}
Ventas Efectivo: $${totalEfectivo.toFixed(2)}
Total en Caja: $${(cajaActual.fondo_inicial + totalEfectivo).toFixed(2)}
        `.trim();

        if (confirm(`${resumen}\n\n¿Desea cerrar la caja?`)) {
            this.cerrarCaja();
        }
    }

    gestionarCajaSubmit(e) {
        e.preventDefault();
        
        if (this.cajaAbierta) {
            this.cerrarCaja();
        } else {
            this.abrirCaja();
        }
    }

    abrirCaja() {
        const fondoInicial = parseFloat(document.getElementById('fondoInicial').value);
        const observaciones = document.getElementById('observacionesCaja').value;

        const aperturaCaja = {
            id: Date.now(),
            fecha_apertura: new Date().toISOString(),
            fondo_inicial: fondoInicial,
            observaciones: observaciones,
            usuario: localStorage.getItem('userName') || 'Usuario',
            estado: 'abierta'
        };

        localStorage.setItem('bsdash_caja_actual', JSON.stringify(aperturaCaja));
        
        // Registrar en historial
        const historialCajas = JSON.parse(localStorage.getItem('bsdash_historial_cajas') || '[]');
        historialCajas.push(aperturaCaja);
        localStorage.setItem('bsdash_historial_cajas', JSON.stringify(historialCajas));

        this.cajaAbierta = true;
        this.actualizarInterfazCaja(true, aperturaCaja);
        this.cerrarModalCaja();
        
        alert('✅ Caja abierta correctamente');
    }

    cerrarCaja() {
        const cajaActual = JSON.parse(localStorage.getItem('bsdash_caja_actual'));
        const ventas = this.obtenerVentasDelDia();
        
        const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);
        const totalEfectivo = ventas.filter(v => v.metodo_pago === 'Efectivo')
                                  .reduce((sum, venta) => sum + venta.total, 0);

        const cierreCaja = {
            ...cajaActual,
            fecha_cierre: new Date().toISOString(),
            total_ventas: totalVentas,
            total_efectivo: totalEfectivo,
            estado: 'cerrada'
        };

        // Actualizar historial
        const historialCajas = JSON.parse(localStorage.getItem('bsdash_historial_cajas') || '[]');
        const index = historialCajas.findIndex(c => c.id === cajaActual.id);
        if (index !== -1) {
            historialCajas[index] = cierreCaja;
            localStorage.setItem('bsdash_historial_cajas', JSON.stringify(historialCajas));
        }

        localStorage.removeItem('bsdash_caja_actual');
        this.cajaAbierta = false;
        this.actualizarInterfazCaja(false);
        this.cerrarModalCaja();
        
        alert('✅ Caja cerrada correctamente');
    }

    obtenerVentasDelDia() {
        const ventas = JSON.parse(localStorage.getItem('bsdash_ventas') || '[]');
        const hoy = new Date().toDateString();
        
        return ventas.filter(venta => {
            const fechaVenta = new Date(venta.fecha).toDateString();
            return fechaVenta === hoy;
        });
    }

    cerrarModalCaja() {
        document.getElementById('modalCaja').classList.add('hidden');
        document.getElementById('modalCaja').classList.remove('flex');
    }

    // ... resto de métodos del POS (agregarAlCarrito, actualizarCarrito, etc.)
}

// Inicializar sistema POS
const posSystem = new POSSystem();