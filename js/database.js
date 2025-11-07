// js/database.js - Sistema de base de datos local mejorado
console.log('💾 Cargando database.js...');

class Database {
    constructor() {
        this.prefix = 'bs_dash_';
        this.version = '2.0.0';
        this.inicializarBaseDatos();
    }

    inicializarBaseDatos() {
        console.log('🔄 Inicializando base de datos...');
        
        // Inicializar colecciones si no existen
        this.inicializarColeccion('productos', this.getProductosEjemplo());
        this.inicializarColeccion('clientes', this.getClientesEjemplo());
        this.inicializarColeccion('categorias', this.getCategoriasEjemplo());
        this.inicializarColeccion('proveedores', this.getProveedoresEjemplo());
        this.inicializarColeccion('ventas', []);
        this.inicializarColeccion('movimientos_inventario', []);
        this.inicializarColeccion('cajas', []);
        
        console.log('✅ Base de datos inicializada correctamente');
    }

    inicializarColeccion(nombre, datosPorDefecto) {
        const clave = this.prefix + nombre;
        if (!localStorage.getItem(clave)) {
            localStorage.setItem(clave, JSON.stringify(datosPorDefecto));
            console.log(`📁 Colección ${nombre} inicializada`);
        }
    }

    // Métodos CRUD genéricos
    get(coleccion) {
        const clave = this.prefix + coleccion;
        try {
            return JSON.parse(localStorage.getItem(clave)) || [];
        } catch (error) {
            console.error(`❌ Error obteniendo ${coleccion}:`, error);
            return [];
        }
    }

    set(coleccion, datos) {
        const clave = this.prefix + coleccion;
        try {
            localStorage.setItem(clave, JSON.stringify(datos));
            return true;
        } catch (error) {
            console.error(`❌ Error guardando ${coleccion}:`, error);
            return false;
        }
    }

    // Productos
    getProductos() {
        return this.get('productos');
    }

    saveProductos(productos) {
        return this.set('productos', productos);
    }

    addProducto(producto) {
        const productos = this.getProductos();
        producto.id = this.generarId();
        producto.fecha_creacion = new Date().toISOString();
        producto.fecha_actualizacion = new Date().toISOString();
        
        productos.push(producto);
        this.saveProductos(productos);
        return producto;
    }

    updateProducto(id, productoData) {
        const productos = this.getProductos();
        const index = productos.findIndex(p => p.id === id);
        
        if (index !== -1) {
            productos[index] = {
                ...productos[index],
                ...productoData,
                fecha_actualizacion: new Date().toISOString()
            };
            this.saveProductos(productos);
            return productos[index];
        }
        
        return null;
    }

    deleteProducto(id) {
        const productos = this.getProductos();
        const nuevosProductos = productos.filter(p => p.id !== id);
        return this.saveProductos(nuevosProductos);
    }

    // Clientes
    getClientes() {
        return this.get('clientes');
    }

    saveClientes(clientes) {
        return this.set('clientes', clientes);
    }

    addCliente(cliente) {
        const clientes = this.getClientes();
        cliente.id = this.generarId();
        cliente.fecha_registro = new Date().toISOString();
        cliente.activo = true;
        
        clientes.push(cliente);
        this.saveClientes(clientes);
        return cliente;
    }

    updateCliente(id, clienteData) {
        const clientes = this.getClientes();
        const index = clientes.findIndex(c => c.id === id);
        
        if (index !== -1) {
            clientes[index] = {
                ...clientes[index],
                ...clienteData,
                fecha_actualizacion: new Date().toISOString()
            };
            this.saveClientes(clientes);
            return clientes[index];
        }
        
        return null;
    }

    // Ventas
    getVentas() {
        return this.get('ventas');
    }

    saveVentas(ventas) {
        return this.set('ventas', ventas);
    }

    addVenta(venta) {
        const ventas = this.getVentas();
        venta.id = this.generarId();
        venta.fecha = new Date().toISOString();
        venta.estado = 'completada';
        
        ventas.push(venta);
        this.saveVentas(ventas);
        return venta;
    }

    // Movimientos de Inventario
    getMovimientosInventario() {
        return this.get('movimientos_inventario');
    }

    addMovimientoInventario(movimiento) {
        const movimientos = this.getMovimientosInventario();
        movimiento.id = this.generarId();
        movimiento.fecha = new Date().toISOString();
        
        movimientos.push(movimiento);
        this.set('movimientos_inventario', movimientos);
        return movimiento;
    }

    // Cajas
    getCajas() {
        return this.get('cajas');
    }

    saveCajas(cajas) {
        return this.set('cajas', cajas);
    }

    addCaja(caja) {
        const cajas = this.getCajas();
        caja.id = this.generarId();
        caja.fecha_apertura = new Date().toISOString();
        caja.estado = 'abierta';
        
        cajas.push(caja);
        this.saveCajas(cajas);
        return caja;
    }

    // Métodos de utilidad
    generarId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    limpiarBaseDatos() {
        if (confirm('¿Está seguro de que desea limpiar toda la base de datos? Esta acción no se puede deshacer.')) {
            const claves = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
            claves.forEach(key => localStorage.removeItem(key));
            
            // Reinicializar
            this.inicializarBaseDatos();
            alert('✅ Base de datos limpiada correctamente');
            return true;
        }
        return false;
    }

    exportarDatos() {
        const datos = {};
        const claves = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
        
        claves.forEach(key => {
            const nombre = key.replace(this.prefix, '');
            datos[nombre] = this.get(nombre);
        });
        
        datos.metadata = {
            fecha_exportacion: new Date().toISOString(),
            version: this.version,
            total_registros: Object.values(datos).reduce((sum, arr) => sum + arr.length, 0)
        };
        
        return datos;
    }

    importarDatos(datos) {
        if (confirm('¿Está seguro de que desea importar datos? Esto sobrescribirá la información actual.')) {
            Object.keys(datos).forEach(coleccion => {
                if (coleccion !== 'metadata') {
                    this.set(coleccion, datos[coleccion]);
                }
            });
            
            alert('✅ Datos importados correctamente');
            return true;
        }
        return false;
    }

    // Datos de ejemplo
    getProductosEjemplo() {
        return [
            {
                id: 1,
                codigo: 'PROD001',
                nombre: 'Laptop HP Pavilion',
                categoria: 'Tecnología',
                subcategoria: 'Computadoras',
                precio_costo: 18000,
                precio_venta: 25000,
                precio_mayorista: 22000,
                stock: 15,
                stock_minimo: 5,
                stock_maximo: 30,
                proveedor: 'Distribuidora Nacional',
                ubicacion: 'Almacén A',
                descripcion: 'Laptop HP Pavilion 15.6" Intel Core i5',
                activo: true,
                fecha_creacion: new Date().toISOString(),
                fecha_actualizacion: new Date().toISOString()
            },
            {
                id: 2,
                codigo: 'PROD002',
                nombre: 'Mouse Inalámbrico Logitech',
                categoria: 'Tecnología',
                subcategoria: 'Accesorios',
                precio_costo: 450,
                precio_venta: 800,
                precio_mayorista: 650,
                stock: 25,
                stock_minimo: 10,
                stock_maximo: 50,
                proveedor: 'Importadora Caribe',
                ubicacion: 'Almacén B',
                descripcion: 'Mouse inalámbrico Logitech M185',
                activo: true,
                fecha_creacion: new Date().toISOString(),
                fecha_actualizacion: new Date().toISOString()
            }
        ];
    }

    getClientesEjemplo() {
        return [
            {
                id: 1,
                codigo: 'CLI001',
                nombre: 'Juan Pérez',
                tipo_identificacion: 'Cédula',
                identificacion: '00112345678',
                telefono: '809-123-4567',
                email: 'juan@email.com',
                direccion: 'Calle Principal #123, Santo Domingo',
                fecha_registro: new Date().toISOString(),
                activo: true
            },
            {
                id: 2,
                codigo: 'CLI002',
                nombre: 'Empresa XYZ S.R.L.',
                tipo_identificacion: 'RNC',
                identificacion: '123456789',
                telefono: '809-234-5678',
                email: 'contacto@empresaxyz.com',
                direccion: 'Av. Lincoln #456, Santo Domingo',
                fecha_registro: new Date().toISOString(),
                activo: true
            }
        ];
    }

    getCategoriasEjemplo() {
        return [
            'Tecnología',
            'Electrodomésticos',
            'Muebles',
            'Ropa',
            'Calzado',
            'Alimentos',
            'Bebidas',
            'Limpieza',
            'Oficina',
            'Herramientas'
        ];
    }

    getProveedoresEjemplo() {
        return [
            {
                id: 1,
                nombre: 'Distribuidora Nacional',
                contacto: '809-123-4567',
                email: 'ventas@distribuidora.com',
                direccion: 'Av. 27 de Febrero #789, Santo Domingo',
                activo: true
            },
            {
                id: 2,
                nombre: 'Importadora Caribe',
                contacto: '809-234-5678',
                email: 'info@importadoracaribe.com',
                direccion: 'Calle San Martín #321, Santiago',
                activo: true
            }
        ];
    }

    // Estadísticas
    getEstadisticas() {
        const productos = this.getProductos();
        const clientes = this.getClientes();
        const ventas = this.getVentas();
        
        const hoy = new Date().toDateString();
        const ventasHoy = ventas.filter(v => new Date(v.fecha).toDateString() === hoy);
        
        return {
            total_productos: productos.length,
            total_clientes: clientes.length,
            total_ventas: ventas.length,
            ventas_hoy: ventasHoy.length,
            total_ventas_hoy: ventasHoy.reduce((sum, v) => sum + v.total, 0),
            productos_bajo_stock: productos.filter(p => p.stock <= p.stock_minimo).length,
            productos_sin_stock: productos.filter(p => p.stock === 0).length,
            valor_inventario: productos.reduce((sum, p) => sum + (p.precio_costo * p.stock), 0)
        };
    }
}

// Inicializar base de datos
window.db = new Database();