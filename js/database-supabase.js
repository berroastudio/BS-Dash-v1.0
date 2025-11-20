// js/database-supabase.js
class DatabaseSupabase {
    constructor() {
        this.supabase = window.supabaseManager?.supabase;
        this.localDb = new Database(); // Tu clase local original
        this.syncEnabled = false;
        this.init();
    }

    async init() {
        if (this.supabase) {
            await this.checkConnection();
        }
    }

    async checkConnection() {
        try {
            const { data, error } = await this.supabase.from('empresas').select('count').limit(1);
            this.syncEnabled = !error;
            console.log('🔄 Sincronización Supabase:', this.syncEnabled ? 'ACTIVA' : 'INACTIVA');
        } catch (error) {
            this.syncEnabled = false;
        }
    }

    // 🔄 MÉTODOS HÍBRIDOS (Local + Supabase)

    async getProductos() {
        if (this.syncEnabled) {
            try {
                const { data, error } = await this.supabase
                    .from('productos')
                    .select('*')
                    .eq('activo', true)
                    .order('nombre');
                
                if (!error && data) return data;
            } catch (error) {
                console.error('Error obteniendo productos de Supabase:', error);
            }
        }
        
        // Fallback a base local
        return this.localDb.getProductos();
    }

    async addProducto(producto) {
        // Agregar localmente inmediatamente
        const localProducto = this.localDb.addProducto(producto);
        
        // Sincronizar con Supabase si está disponible
        if (this.syncEnabled) {
            try {
                const { data, error } = await this.supabase
                    .from('productos')
                    .insert([{
                        ...producto,
                        id: undefined, // Supabase generará el ID
                        fecha_creacion: new Date().toISOString(),
                        fecha_actualizacion: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (!error && data) {
                    // Actualizar ID local con el de Supabase
                    this.localDb.updateProducto(localProducto.id, { supabase_id: data.id });
                    return data;
                }
            } catch (error) {
                console.error('Error sincronizando producto:', error);
                this.queueForSync('productos', 'add', producto);
            }
        }
        
        return localProducto;
    }

    async getClientes() {
        if (this.syncEnabled) {
            try {
                const { data, error } = await this.supabase
                    .from('clientes')
                    .select('*')
                    .eq('activo', true)
                    .order('nombre');
                
                if (!error && data) return data;
            } catch (error) {
                console.error('Error obteniendo clientes de Supabase:', error);
            }
        }
        
        return this.localDb.getClientes();
    }

    async addCliente(cliente) {
        const localCliente = this.localDb.addCliente(cliente);
        
        if (this.syncEnabled) {
            try {
                const { data, error } = await this.supabase
                    .from('clientes')
                    .insert([{
                        ...cliente,
                        id: undefined,
                        fecha_registro: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (!error && data) {
                    this.localDb.updateCliente(localCliente.id, { supabase_id: data.id });
                    return data;
                }
            } catch (error) {
                console.error('Error sincronizando cliente:', error);
                this.queueForSync('clientes', 'add', cliente);
            }
        }
        
        return localCliente;
    }

    async getVentas(filters = {}) {
        if (this.syncEnabled) {
            try {
                let query = this.supabase
                    .from('ventas')
                    .select('*')
                    .order('fecha', { ascending: false });

                // Aplicar filtros
                if (filters.startDate) {
                    query = query.gte('fecha', filters.startDate);
                }
                if (filters.endDate) {
                    query = query.lte('fecha', filters.endDate);
                }
                if (filters.estado) {
                    query = query.eq('estado', filters.estado);
                }

                const { data, error } = await query;
                
                if (!error && data) return data;
            } catch (error) {
                console.error('Error obteniendo ventas de Supabase:', error);
            }
        }
        
        return this.localDb.getVentas();
    }

    async addVenta(venta) {
        const localVenta = this.localDb.addVenta(venta);
        
        if (this.syncEnabled) {
            try {
                const { data, error } = await this.supabase
                    .from('ventas')
                    .insert([{
                        ...venta,
                        id: undefined,
                        fecha: new Date().toISOString(),
                        estado: 'completada'
                    }])
                    .select()
                    .single();

                if (!error && data) {
                    this.localDb.updateVenta(localVenta.id, { supabase_id: data.id });
                    
                    // Sincronizar items de venta
                    if (venta.items) {
                        await this.syncVentaItems(data.id, venta.items);
                    }
                    
                    return data;
                }
            } catch (error) {
                console.error('Error sincronizando venta:', error);
                this.queueForSync('ventas', 'add', venta);
            }
        }
        
        return localVenta;
    }

    // 📊 MÉTODOS ESPECÍFICOS PARA DASHBOARD

    async getDashboardStats() {
        if (this.syncEnabled) {
            try {
                // Obtener estadísticas en una sola consulta
                const [
                    { data: ventasHoy, error: errorVentas },
                    { data: totalClientes, error: errorClientes },
                    { data: productosBajoStock, error: errorStock },
                    { data: totalVentas, error: errorTotalVentas }
                ] = await Promise.all([
                    this.supabase
                        .from('ventas')
                        .select('total')
                        .gte('fecha', new Date().toDateString()),
                    
                    this.supabase
                        .from('clientes')
                        .select('count')
                        .eq('activo', true),
                    
                    this.supabase
                        .from('productos')
                        .select('count')
                        .lt('stock', 'stock_minimo'),
                    
                    this.supabase
                        .from('ventas')
                        .select('total')
                ]);

                if (!errorVentas && !errorClientes && !errorStock && !errorTotalVentas) {
                    return {
                        ventas_hoy: ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0),
                        total_clientes: totalClientes?.[0]?.count || 0,
                        productos_bajo_stock: productosBajoStock?.[0]?.count || 0,
                        total_ventas_mes: totalVentas.reduce((sum, v) => sum + (v.total || 0), 0),
                        ventas_count: totalVentas.length
                    };
                }
            } catch (error) {
                console.error('Error obteniendo stats de Supabase:', error);
            }
        }
        
        // Fallback a estadísticas locales
        return this.localDb.getEstadisticas();
    }

    async getUserWidgets(userId) {
        if (this.syncEnabled) {
            try {
                const { data, error } = await this.supabase
                    .from('usuario_widgets')
                    .select('widgets')
                    .eq('usuario_id', userId)
                    .single();

                if (!error && data) {
                    return data.widgets;
                }
            } catch (error) {
                console.error('Error obteniendo widgets de Supabase:', error);
            }
        }
        
        // Fallback a localStorage
        return JSON.parse(localStorage.getItem(`bs_widgets_${userId}`) || '[]');
    }

    async saveUserWidgets(userId, widgets) {
        // Guardar localmente
        localStorage.setItem(`bs_widgets_${userId}`, JSON.stringify(widgets));
        
        // Sincronizar con Supabase
        if (this.syncEnabled) {
            try {
                const { error } = await this.supabase
                    .from('usuario_widgets')
                    .upsert({
                        usuario_id: userId,
                        widgets: widgets,
                        fecha_actualizacion: new Date().toISOString()
                    });

                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Error guardando widgets en Supabase:', error);
                return false;
            }
        }
        
        return true;
    }

    async getEmpresasUsuario(userId) {
        if (this.syncEnabled) {
            try {
                const { data, error } = await this.supabase
                    .from('empresas')
                    .select('*')
                    .eq('activa', true)
                    .order('nombre');

                if (!error && data) return data;
            } catch (error) {
                console.error('Error obteniendo empresas de Supabase:', error);
            }
        }
        
        // Fallback a empresas locales
        return this.localDb.getEmpresas ? this.localDb.getEmpresas() : [];
    }

    // 🛠 MÉTODOS DE SINCRONIZACIÓN

    queueForSync(table, action, data) {
        const queue = JSON.parse(localStorage.getItem('bs_sync_queue') || '[]');
        queue.push({
            table,
            action,
            data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('bs_sync_queue', JSON.stringify(queue));
    }

    async processSyncQueue() {
        if (!this.syncEnabled) return;

        const queue = JSON.parse(localStorage.getItem('bs_sync_queue') || '[]');
        const successful = [];
        const failed = [];

        for (const item of queue) {
            try {
                let result;
                switch (item.action) {
                    case 'add':
                        result = await this.supabase
                            .from(item.table)
                            .insert([item.data])
                            .select()
                            .single();
                        break;
                    case 'update':
                        result = await this.supabase
                            .from(item.table)
                            .update(item.data)
                            .eq('id', item.data.id)
                            .select()
                            .single();
                        break;
                    case 'delete':
                        result = await this.supabase
                            .from(item.table)
                            .delete()
                            .eq('id', item.data.id);
                        break;
                }

                if (result && !result.error) {
                    successful.push(item);
                } else {
                    failed.push(item);
                }
            } catch (error) {
                failed.push(item);
            }
        }

        // Actualizar cola
        localStorage.setItem('bs_sync_queue', JSON.stringify(failed));
        
        if (successful.length > 0) {
            console.log(`✅ ${successful.length} items sincronizados`);
        }
        if (failed.length > 0) {
            console.log(`❌ ${failed.length} items fallaron en sincronización`);
        }
    }

    // 🔐 MÉTODOS DE AUTENTICACIÓN

    async login(email, password) {
        if (this.syncEnabled) {
            try {
                const { data, error } = await this.supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;
                return { success: true, user: data.user };
            } catch (error) {
                console.error('Error login con Supabase:', error);
                return { success: false, error: error.message };
            }
        }
        
        // Login local (para desarrollo/offline)
        return this.localLogin(email, password);
    }

    localLogin(email, password) {
        // Implementación simple de login local
        const users = JSON.parse(localStorage.getItem('bs_usuarios') || '[]');
        const user = users.find(u => u.email === email && u.password === this.hashPassword(password));
        
        if (user) {
            localStorage.setItem('bs_current_user', JSON.stringify(user));
            return { success: true, user };
        }
        
        return { success: false, error: 'Credenciales inválidas' };
    }

    hashPassword(password) {
        // Hash simple para desarrollo
        return btoa(password + '_bs_salt');
    }

    getCurrentUser() {
        if (this.syncEnabled && this.supabase) {
            return this.supabase.auth.getUser();
        }
        
        // Usuario local
        const userData = localStorage.getItem('bs_current_user');
        return userData ? JSON.parse(userData) : null;
    }

    // 📈 MÉTODOS DE REPORTES

    async generateSalesReport(startDate, endDate) {
        if (this.syncEnabled) {
            try {
                const { data, error } = await this.supabase
                    .from('ventas')
                    .select(`
                        *,
                        clientes (nombre),
                        venta_items (
                            productos (nombre, precio_venta),
                            cantidad,
                            subtotal
                        )
                    `)
                    .gte('fecha', startDate)
                    .lte('fecha', endDate)
                    .order('fecha', { ascending: false });

                if (!error) return data;
            } catch (error) {
                console.error('Error generando reporte de Supabase:', error);
            }
        }
        
        // Fallback a reporte local
        return this.localDb.getVentas().filter(v => {
            const fecha = new Date(v.fecha);
            return fecha >= new Date(startDate) && fecha <= new Date(endDate);
        });
    }
}

// Inicializar base de datos híbrida
window.dbSupabase = new DatabaseSupabase();