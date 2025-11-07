// ==================== SISTEMA DE BASE DE DATOS LOCAL ====================
const fileDB = {
    
    getConfig: function() {
        return JSON.parse(localStorage.getItem('bs_config') || '{}');
    },
    
    saveConfig: function(config) {
        localStorage.setItem('bs_config', JSON.stringify(config));
        return true;
    },
    
    getUsuarios: function() {
        return JSON.parse(localStorage.getItem('bs_usuarios') || '[]');
    },
    
    guardarUsuario: function(usuario) {
        try {
            const usuarios = this.getUsuarios();
            if (usuario.id) {
                const index = usuarios.findIndex(u => u.id === usuario.id);
                if (index !== -1) {
                    usuarios[index] = usuario;
                } else {
                    usuarios.push(usuario);
                }
            } else {
                usuario.id = 'user_' + Date.now();
                usuarios.push(usuario);
            }
            localStorage.setItem('bs_usuarios', JSON.stringify(usuarios));
            return true;
        } catch (error) {
            console.error('Error guardando usuario:', error);
            return false;
        }
    },
    
    getClientes: function() {
        return JSON.parse(localStorage.getItem('bs_clientes') || '[]');
    },
    
    guardarCliente: function(cliente) {
        try {
            const clientes = this.getClientes();
            if (cliente.id) {
                const index = clientes.findIndex(c => c.id === cliente.id);
                if (index !== -1) {
                    clientes[index] = cliente;
                } else {
                    clientes.push(cliente);
                }
            } else {
                cliente.id = 'cli_' + Date.now();
                clientes.push(cliente);
            }
            localStorage.setItem('bs_clientes', JSON.stringify(clientes));
            return true;
        } catch (error) {
            console.error('Error guardando cliente:', error);
            return false;
        }
    },
    
    getProductos: function() {
        return JSON.parse(localStorage.getItem('bs_productos') || '[]');
    },
    
    guardarProducto: function(producto) {
        try {
            const productos = this.getProductos();
            if (producto.id) {
                const index = productos.findIndex(p => p.id === producto.id);
                if (index !== -1) {
                    productos[index] = producto;
                } else {
                    productos.push(producto);
                }
            } else {
                producto.id = 'prod_' + Date.now();
                productos.push(producto);
            }
            localStorage.setItem('bs_productos', JSON.stringify(productos));
            return true;
        } catch (error) {
            console.error('Error guardando producto:', error);
            return false;
        }
    },
    
    getProducto: function(id) {
        const productos = this.getProductos();
        return productos.find(p => p.id === id);
    },
    
    getFacturas: function() {
        return JSON.parse(localStorage.getItem('bs_facturas') || '[]');
    },
    
    guardarFactura: function(factura) {
        try {
            const facturas = this.getFacturas();
            if (!factura.numero) {
                factura.numero = 'FAC-' + Date.now();
            }
            factura.id = 'fac_' + Date.now();
            facturas.push(factura);
            localStorage.setItem('bs_facturas', JSON.stringify(facturas));
            return true;
        } catch (error) {
            console.error('Error guardando factura:', error);
            return false;
        }
    },
    
    getInventario: function() {
        return JSON.parse(localStorage.getItem('bs_inventario') || '[]');
    },
    
    guardarMovimientoInventario: function(movimiento) {
        try {
            const inventario = this.getInventario();
            movimiento.id = 'mov_' + Date.now();
            movimiento.fecha = new Date().toISOString();
            inventario.push(movimiento);
            localStorage.setItem('bs_inventario', JSON.stringify(inventario));
            return true;
        } catch (error) {
            console.error('Error guardando movimiento:', error);
            return false;
        }
    },
    
    aplicarRedondeo: function(monto) {
        const config = this.getConfig();
        const redondeoConfig = config.redondeo || { activo: true, multiplo: 5, tipo: 'comercial' };
        
        if (!redondeoConfig.activo) {
            return {
                total: monto,
                totalOriginal: monto,
                compensacion: 0,
                redondeoAplicado: false,
                multiplo: 0
            };
        }
        
        const multiplo = redondeoConfig.multiplo || 5;
        let totalRedondeado;
        
        if (redondeoConfig.tipo === 'comercial') {
            totalRedondeado = Math.round(monto / multiplo) * multiplo;
        } else {
            totalRedondeado = Math.ceil(monto / multiplo) * multiplo;
        }
        
        const compensacion = totalRedondeado - monto;
        
        return {
            total: totalRedondeado,
            totalOriginal: monto,
            compensacion: compensacion,
            redondeoAplicado: compensacion !== 0,
            multiplo: multiplo
        };
    },
    
    formatearMonto: function(monto, incluirSimbolo = true) {
        const config = this.getConfig();
        const moneda = config.moneda || { simbolo: 'RD$', decimales: 2, separadorMiles: ',', separadorDecimal: '.' };
        
        let montoFormateado = parseFloat(monto).toFixed(moneda.decimales || 2);
        
        if (moneda.separadorMiles) {
            const partes = montoFormateado.split('.');
            partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, moneda.separadorMiles);
            montoFormateado = partes.join(moneda.separadorDecimal || '.');
        }
        
        return {
            formateado: incluirSimbolo ? `${moneda.simbolo}${montoFormateado}` : montoFormateado,
            monto: parseFloat(monto),
            simbolo: moneda.simbolo
        };
    },
    
    crearBackup: function() {
        const backup = {
            fecha: new Date().toISOString(),
            version: '1.0',
            datos: {
                config: this.getConfig(),
                usuarios: this.getUsuarios(),
                clientes: this.getClientes(),
                productos: this.getProductos(),
                facturas: this.getFacturas(),
                inventario: this.getInventario()
            }
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-bsdash-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        return true;
    },
    
    getEstadisticas: function() {
        const facturas = this.getFacturas();
        const hoy = new Date().toDateString();
        
        const ventasHoy = facturas.filter(f => 
            new Date(f.createdAt).toDateString() === hoy
        );
        
        const totalVentasHoy = ventasHoy.reduce((sum, f) => sum + f.total, 0);
        const totalProductos = this.getProductos().length;
        const totalClientes = this.getClientes().length;
        
        return {
            ventasHoy: ventasHoy.length,
            totalVentasHoy: totalVentasHoy,
            totalProductos: totalProductos,
            totalClientes: totalClientes,
            facturasTotales: facturas.length
        };
    },
    
    inicializar: function() {
        if (this.getClientes().length === 0) {
            this.guardarCliente({
                nombre: 'Consumidor Final',
                identificacion: '000-000000-0',
                tipo: 'general'
            });
        }
        
        if (Object.keys(this.getConfig()).length === 0) {
            this.saveConfig({
                empresa: 'Berroa Studio',
                moneda: { simbolo: 'RD$', decimales: 2, separadorMiles: ',', separadorDecimal: '.' },
                redondeo: { activo: true, multiplo: 5, tipo: 'comercial' },
                impuestos: { itbis: 0.18 }
            });
        }
        
        console.log('✅ Sistema BS-Dash inicializado correctamente');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    fileDB.inicializar();
});

window.fileDB = fileDB;