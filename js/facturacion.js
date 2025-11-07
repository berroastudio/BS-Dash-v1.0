// js/file-database.js - SISTEMA COMPLETO ACTUALIZADO
class FileDatabase {
    constructor() {
        this.dataPath = './data/';
        this.ensureDataDirectory();
        this.initSistemaCompleto();
    }

    ensureDataDirectory() {
        console.log('📁 Sistema de archivos local inicializado');
    }

    // ==================== INICIALIZACIÓN SISTEMA COMPLETO ====================
    initSistemaCompleto() {
        console.log('🚀 Iniciando sistema completo BS-Dash...');
        
        // Inicializar datos por defecto si no existen
        this.initDatosPorDefecto();
        this.initRedondeoSystem();
        this.initDesignaciones();
        
        console.log('✅ Sistema completo inicializado');
    }

    initDatosPorDefecto() {
        // Clientes por defecto
        if (!localStorage.getItem('bs_clientes')) {
            localStorage.setItem('bs_clientes', JSON.stringify(this.getClientesDefault()));
        }

        // Productos por defecto
        if (!localStorage.getItem('bs_productos')) {
            localStorage.setItem('bs_productos', JSON.stringify(this.getProductosDefault()));
        }

        // Categorías por defecto
        if (!localStorage.getItem('bs_categorias')) {
            localStorage.setItem('bs_categorias', JSON.stringify(this.getCategoriasDefault()));
        }

        // Secuencias
        if (!localStorage.getItem('bs_secuencias')) {
            localStorage.setItem('bs_secuencias', JSON.stringify({
                facturas: { proximo: 1, prefijo: 'FACT', ceros: 3 },
                cotizaciones: { proximo: 1, prefijo: 'COT', ceros: 3 },
                ordenes: { proximo: 1, prefijo: 'ORD', ceros: 3 }
            }));
        }

        // Configuración sistema
        if (!localStorage.getItem('bs_config_sistema')) {
            localStorage.setItem('bs_config_sistema', JSON.stringify(this.getConfiguracionSistemaDefault()));
        }
    }

    initDesignaciones() {
        if (!localStorage.getItem('bs_designaciones_billetes')) {
            const designaciones = [
                { denominacion: 2000, cantidad: 0, tipo: 'billete', label: 'Billete RD$2,000' },
                { denominacion: 1000, cantidad: 0, tipo: 'billete', label: 'Billete RD$1,000' },
                { denominacion: 500, cantidad: 0, tipo: 'billete', label: 'Billete RD$500' },
                { denominacion: 200, cantidad: 0, tipo: 'billete', label: 'Billete RD$200' },
                { denominacion: 100, cantidad: 0, tipo: 'billete', label: 'Billete RD$100' },
                { denominacion: 50, cantidad: 0, tipo: 'billete', label: 'Billete RD$50' },
                { denominacion: 25, cantidad: 0, tipo: 'moneda', label: 'Moneda RD$25' },
                { denominacion: 10, cantidad: 0, tipo: 'moneda', label: 'Moneda RD$10' },
                { denominacion: 5, cantidad: 0, tipo: 'moneda', label: 'Moneda RD$5' },
                { denominacion: 1, cantidad: 0, tipo: 'moneda', label: 'Moneda RD$1' }
            ];
            localStorage.setItem('bs_designaciones_billetes', JSON.stringify(designaciones));
        }
    }

    // ==================== CLIENTES ====================
    getClientes() {
        try {
            const data = localStorage.getItem('bs_clientes');
            return data ? JSON.parse(data) : this.getClientesDefault();
        } catch (error) {
            console.error('Error leyendo clientes:', error);
            return this.getClientesDefault();
        }
    }

    getClientesDefault() {
        return [
            {
                id: 'cli_consumidor_final',
                codigo: 'CF',
                nombre: 'CONSUMIDOR FINAL',
                identificacion: '000-000000-0',
                telefono: '',
                email: '',
                direccion: '',
                tipo: 'consumidor_final',
                createdAt: new Date().toISOString()
            }
        ];
    }

    guardarCliente(cliente) {
        try {
            const clientes = this.getClientes();
            const clienteExistente = clientes.find(c => c.id === cliente.id);
            
            if (clienteExistente) {
                Object.assign(clienteExistente, cliente);
            } else {
                cliente.id = cliente.id || 'cli_' + Date.now();
                cliente.createdAt = new Date().toISOString();
                clientes.push(cliente);
            }
            
            localStorage.setItem('bs_clientes', JSON.stringify(clientes));
            console.log('✅ Cliente guardado:', cliente.nombre);
            return true;
        } catch (error) {
            console.error('Error guardando cliente:', error);
            return false;
        }
    }

    // ==================== PRODUCTOS Y CATEGORÍAS ====================
    getProductos() {
        try {
            const data = localStorage.getItem('bs_productos');
            return data ? JSON.parse(data) : this.getProductosDefault();
        } catch (error) {
            console.error('Error leyendo productos:', error);
            return this.getProductosDefault();
        }
    }

    getProductosDefault() {
        return [
            {
                id: 'prod_1',
                codigo: 'SER-001',
                nombre: 'Servicio Técnico Básico',
                descripcion: 'Diagnóstico y reparación básica de equipos',
                precio: 500.00,
                costo: 0,
                stock: 999,
                stock_minimo: 0,
                categoria: 'servicio',
                tipo: 'servicio',
                activo: true,
                createdAt: new Date().toISOString()
            }
        ];
    }

    guardarProducto(producto) {
        try {
            const productos = this.getProductos();
            const productoExistente = productos.find(p => p.id === producto.id);
            
            if (productoExistente) {
                Object.assign(productoExistente, producto);
            } else {
                producto.id = producto.id || 'prod_' + Date.now();
                producto.createdAt = new Date().toISOString();
                producto.activo = producto.activo !== undefined ? producto.activo : true;
                productos.push(producto);
            }
            
            localStorage.setItem('bs_productos', JSON.stringify(productos));
            console.log('✅ Producto guardado:', producto.nombre);
            
            // Actualizar categorías automáticamente
            this.actualizarCategorias();
            
            return true;
        } catch (error) {
            console.error('Error guardando producto:', error);
            return false;
        }
    }

    getCategorias() {
        try {
            const data = localStorage.getItem('bs_categorias');
            return data ? JSON.parse(data) : this.getCategoriasDefault();
        } catch (error) {
            console.error('Error leyendo categorías:', error);
            return this.getCategoriasDefault();
        }
    }

    getCategoriasDefault() {
        return [
            { id: 'todos', nombre: 'Todos los Productos', tipo: 'sistema' },
            { id: 'servicio', nombre: 'Servicios', tipo: 'sistema' },
            { id: 'electronica', nombre: 'Electrónica', tipo: 'usuario' },
            { id: 'oficina', nombre: 'Oficina', tipo: 'usuario' }
        ];
    }

    actualizarCategorias() {
        const productos = this.getProductos();
        const categoriasExistentes = this.getCategorias();
        const categoriasProductos = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
        
        let categoriasActualizadas = [...categoriasExistentes];
        
        categoriasProductos.forEach(categoria => {
            if (!categoriasActualizadas.find(c => c.id === categoria)) {
                categoriasActualizadas.push({
                    id: categoria,
                    nombre: categoria.charAt(0).toUpperCase() + categoria.slice(1),
                    tipo: 'usuario'
                });
            }
        });
        
        localStorage.setItem('bs_categorias', JSON.stringify(categoriasActualizadas));
        console.log('✅ Categorías actualizadas:', categoriasActualizadas.map(c => c.nombre));
    }

    // ==================== FACTURAS ====================
    getFacturas() {
        try {
            const data = localStorage.getItem('bs_facturas');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error leyendo facturas:', error);
            return [];
        }
    }

    guardarFactura(factura) {
        try {
            const facturas = this.getFacturas();
            
            // Aplicar redondeo automático
            if (factura.subtotal !== undefined && factura.total !== undefined) {
                const resultadoRedondeo = this.aplicarRedondeo(factura.total);
                factura.totalRedondeado = resultadoRedondeo.total;
                factura.compensacionRedondeo = resultadoRedondeo.compensacion;
                factura.redondeoAplicado = resultadoRedondeo.redondeoAplicado;
                factura.multiploRedondeo = resultadoRedondeo.multiplo;
                
                if (resultadoRedondeo.redondeoAplicado) {
                    factura.total = resultadoRedondeo.total;
                }
            }
            
            if (!factura.numero) {
                const secuencia = this.getSecuencia('facturas');
                factura.numero = `FACT-${secuencia.proximo.toString().padStart(3, '0')}`;
                this.incrementarSecuencia('facturas');
            }
            
            factura.id = factura.id || 'fact_' + Date.now();
            factura.createdAt = factura.createdAt || new Date().toISOString();
            factura.updatedAt = new Date().toISOString();
            
            facturas.push(factura);
            localStorage.setItem('bs_facturas', JSON.stringify(facturas));
            
            console.log('✅ Factura guardada:', factura.numero);
            return true;
        } catch (error) {
            console.error('Error guardando factura:', error);
            return false;
        }
    }

    // ==================== COTIZACIONES ====================
    getCotizaciones() {
        try {
            const data = localStorage.getItem('bs_cotizaciones');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error leyendo cotizaciones:', error);
            return [];
        }
    }

    guardarCotizacion(cotizacion) {
        try {
            const cotizaciones = this.getCotizaciones();
            
            if (!cotizacion.numero) {
                const secuencia = this.getSecuencia('cotizaciones');
                cotizacion.numero = `COT-${secuencia.proximo.toString().padStart(3, '0')}`;
                this.incrementarSecuencia('cotizaciones');
            }
            
            cotizacion.id = cotizacion.id || 'cot_' + Date.now();
            cotizacion.createdAt = cotizacion.createdAt || new Date().toISOString();
            cotizacion.updatedAt = new Date().toISOString();
            
            cotizaciones.push(cotizacion);
            localStorage.setItem('bs_cotizaciones', JSON.stringify(cotizaciones));
            
            console.log('✅ Cotización guardada:', cotizacion.numero);
            return true;
        } catch (error) {
            console.error('Error guardando cotización:', error);
            return false;
        }
    }

    // ==================== SECUENCIAS ====================
    getSecuencia(tipo) {
        const secuencias = JSON.parse(localStorage.getItem('bs_secuencias') || '{}');
        const secuenciasDefault = {
            facturas: { proximo: 1, prefijo: 'FACT', ceros: 3 },
            cotizaciones: { proximo: 1, prefijo: 'COT', ceros: 3 },
            ordenes: { proximo: 1, prefijo: 'ORD', ceros: 3 }
        };
        
        return secuencias[tipo] || secuenciasDefault[tipo];
    }

    incrementarSecuencia(tipo) {
        const secuencias = JSON.parse(localStorage.getItem('bs_secuencias') || '{}');
        if (!secuencias[tipo]) {
            secuencias[tipo] = this.getSecuencia(tipo);
        }
        secuencias[tipo].proximo++;
        localStorage.setItem('bs_secuencias', JSON.stringify(secuencias));
    }

    // ==================== SISTEMA DE REDONDEO ====================
    initRedondeoSystem() {
        const config = this.getConfiguracionSistema();
        if (config.redondeoActivo === undefined) {
            config.redondeoActivo = true;
            config.multiploRedondeo = 5;
            config.mostrarCompensacion = true;
            this.guardarConfiguracionSistema(config);
        }
    }

    aplicarRedondeo(total) {
        const config = this.getConfiguracionSistema();
        const decimales = config.decimales || 2;
        
        if (!config.redondeoActivo || config.multiploRedondeo === 1) {
            return { 
                total: this.redondearDecimales(total, decimales), 
                compensacion: 0,
                totalOriginal: this.redondearDecimales(total, decimales),
                multiplo: 1,
                redondeoAplicado: false
            };
        }
        
        const multiplo = config.multiploRedondeo || 5;
        const totalRedondeado = Math.floor(total / multiplo) * multiplo;
        const compensacion = total - totalRedondeado;
        
        return {
            total: this.redondearDecimales(totalRedondeado, decimales),
            compensacion: this.redondearDecimales(compensacion, decimales),
            totalOriginal: this.redondearDecimales(total, decimales),
            multiplo: multiplo,
            redondeoAplicado: true
        };
    }

    redondearDecimales(numero, decimales = 2) {
        return parseFloat(numero.toFixed(decimales));
    }

    getConfiguracionRedondeo() {
        const config = this.getConfiguracionSistema();
        return {
            redondeoActivo: config.redondeoActivo !== undefined ? config.redondeoActivo : true,
            multiplo: config.multiploRedondeo || 5,
            mostrarCompensacion: config.mostrarCompensacion !== undefined ? config.mostrarCompensacion : true,
            decimales: config.decimales || 2,
            moneda: config.moneda || 'RD$'
        };
    }

    guardarConfiguracionRedondeo(redondeoActivo, multiplo = 5, mostrarCompensacion = true) {
        const config = this.getConfiguracionSistema();
        config.redondeoActivo = redondeoActivo;
        config.multiploRedondeo = multiplo;
        config.mostrarCompensacion = mostrarCompensacion;
        return this.guardarConfiguracionSistema(config);
    }

    // ==================== CONFIGURACIÓN SISTEMA ====================
    getConfiguracionSistema() {
        try {
            const data = localStorage.getItem('bs_config_sistema');
            if (data) {
                return JSON.parse(data);
            }
            return this.getConfiguracionSistemaDefault();
        } catch (error) {
            console.error('Error leyendo configuración:', error);
            return this.getConfiguracionSistemaDefault();
        }
    }

    getConfiguracionSistemaDefault() {
        return {
            pais: 'RD',
            moneda: 'RD$',
            decimales: 2,
            estado: '',
            empresaActual: 1,
            redondeoActivo: true,
            multiploRedondeo: 5,
            mostrarCompensacion: true,
            email_caja: '',
            designaciones_billetes: [],
            paises: [
                {
                    codigo: 'RD',
                    nombre: 'República Dominicana',
                    moneda: 'RD$',
                    decimales: 2,
                    estados: [],
                    formato_identificacion: 'RNC/Cédula'
                },
                {
                    codigo: 'US', 
                    nombre: 'Estados Unidos',
                    moneda: 'US$',
                    decimales: 2,
                    estados: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
                    formato_identificacion: 'SSN/EIN'
                }
            ]
        };
    }

    guardarConfiguracionSistema(config) {
        try {
            localStorage.setItem('bs_config_sistema', JSON.stringify(config));
            console.log('✅ Configuración del sistema guardada');
            return true;
        } catch (error) {
            console.error('Error guardando configuración:', error);
            return false;
        }
    }

    // ==================== SISTEMA DE CAJA ====================
    getDesignacionesBilletes() {
        try {
            const data = localStorage.getItem('bs_designaciones_billetes');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error leyendo designaciones:', error);
            return [];
        }
    }

    guardarDesignacionesBilletes(designaciones) {
        try {
            localStorage.setItem('bs_designaciones_billetes', JSON.stringify(designaciones));
            console.log('✅ Designaciones de billetes guardadas');
            return true;
        } catch (error) {
            console.error('Error guardando designaciones:', error);
            return false;
        }
    }

    // ==================== UTILIDADES ====================
    generarId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    formatearMonto(monto, mostrarMoneda = true) {
        const config = this.getConfiguracionSistema();
        const resultadoRedondeo = this.aplicarRedondeo(monto);
        const moneda = mostrarMoneda ? config.moneda : '';
        
        return {
            monto: resultadoRedondeo.total,
            formateado: `${moneda}${resultadoRedondeo.total.toFixed(config.decimales)}`,
            compensacion: resultadoRedondeo.compensacion,
            compensacionFormateada: `${moneda}${Math.abs(resultadoRedondeo.compensacion).toFixed(config.decimales)}`,
            redondeoAplicado: resultadoRedondeo.redondeoAplicado
        };
    }
}

// Inicializar globalmente
console.log('🚀 Iniciando FileDatabase mejorado...');
window.fileDB = new FileDatabase();
console.log('✅ FileDatabase mejorado listo');