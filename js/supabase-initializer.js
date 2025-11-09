// Inicializador de Datos para Supabase
class SupabaseInitializer {
    constructor(supabase) {
        this.supabase = supabase;
        this.modulosSistema = [
            { id: 'dashboard', nombre: 'Dashboard', icono: 'bi-speedometer2', descripcion: 'Panel principal del sistema', url: 'dashboard.html', categoria: 'principal', siempre_activo: true, orden: 1 },
            { id: 'facturacion', nombre: 'Facturación', icono: 'bi-receipt', descripcion: 'Sistema completo de facturación', url: 'modules/facturacion.html', categoria: 'ventas', orden: 2 },
            { id: 'inventario', nombre: 'Inventario', icono: 'bi-box-seam', descripcion: 'Gestión de stock y productos', url: 'modules/inventario.html', categoria: 'operaciones', orden: 3 },
            { id: 'pos', nombre: 'Punto de Venta', icono: 'bi-cash-coin', descripcion: 'Sistema POS para ventas rápidas', url: 'modules/pos.html', categoria: 'ventas', orden: 4 },
            { id: 'clientes', nombre: 'Clientes', icono: 'bi-people', descripcion: 'Gestión de base de clientes', url: 'modules/clientes.html', categoria: 'ventas', orden: 5 },
            { id: 'reportes', nombre: 'Reportes', icono: 'bi-graph-up', descripcion: 'Análisis y reportes del sistema', url: 'modules/reportes.html', categoria: 'analisis', orden: 6 },
            { id: 'contabilidad', nombre: 'Contabilidad', icono: 'bi-calculator', descripcion: 'Sistema contable integrado', url: 'modules/contabilidad.html', categoria: 'finanzas', orden: 7 },
            { id: 'configuracion', nombre: 'Configuración', icono: 'bi-gear', descripcion: 'Configuración del sistema', url: 'configuracion.html', categoria: 'sistema', orden: 8 },
            { id: 'empresas', nombre: 'Empresas', icono: 'bi-buildings', descripcion: 'Gestión multiempresa', url: 'modules/empresas.html', categoria: 'administracion', orden: 9 },
            { id: 'usuarios', nombre: 'Usuarios', icono: 'bi-shield-check', descripcion: 'Gestión de usuarios y permisos', url: 'modules/usuarios.html', categoria: 'administracion', orden: 10 },
            { id: 'onedrive', nombre: 'OneDrive', icono: 'bi-microsoft', descripcion: 'Integración con Microsoft OneDrive', url: 'modules/onedrive.html', categoria: 'integraciones', orden: 11 }
        ];
    }

    async inicializarSistema() {
        console.log('🎯 Inicializando sistema en Supabase...');
        
        try {
            // 1. Verificar si ya existe la empresa por defecto
            const { data: empresasExistentes, error: errorEmpresas } = await this.supabase
                .from('empresas')
                .select('id')
                .limit(1);

            if (errorEmpresas) {
                console.error('Error verificando empresas:', errorEmpresas);
                return false;
            }

            if (empresasExistentes.length === 0) {
                console.log('🏢 Creando empresa por defecto...');
                await this.crearEmpresaPorDefecto();
            } else {
                console.log('✅ Empresa ya existe en Supabase');
            }

            // 2. Verificar módulos del sistema
            await this.verificarModulosSistema();

            console.log('✅ Sistema inicializado correctamente en Supabase');
            return true;

        } catch (error) {
            console.error('❌ Error inicializando sistema:', error);
            return false;
        }
    }

    async crearEmpresaPorDefecto() {
        const empresaPorDefecto = {
            nombre: 'Berroa Studio S.R.L.',
            rnc: '131456789',
            telefono: '(809) 123-4567',
            email: 'info@berroastudio.com',
            direccion: 'Santo Domingo, República Dominicana',
            website: 'https://berroastudio.com',
            eslogan: 'Soluciones digitales innovadoras'
        };

        const { data: empresa, error } = await this.supabase
            .from('empresas')
            .insert([empresaPorDefecto])
            .select()
            .single();

        if (error) {
            console.error('Error creando empresa:', error);
            return null;
        }

        console.log('✅ Empresa creada:', empresa.id);
        return empresa;
    }

    async verificarModulosSistema() {
        // Insertar módulos si no existen
        for (const modulo of this.modulosSistema) {
            const { data: moduloExistente, error } = await this.supabase
                .from('modulos_sistema')
                .select('id')
                .eq('id', modulo.id)
                .single();

            if (error || !moduloExistente) {
                const { error: insertError } = await this.supabase
                    .from('modulos_sistema')
                    .insert([modulo]);

                if (insertError) {
                    console.error(`Error insertando módulo ${modulo.id}:`, insertError);
                } else {
                    console.log(`✅ Módulo creado: ${modulo.nombre}`);
                }
            }
        }
    }

    async asignarModulosPorDefecto(empresaId) {
        const modulosPorDefecto = ['dashboard', 'facturacion', 'inventario', 'clientes', 'configuracion'];
        
        for (const moduloId of modulosPorDefecto) {
            const { error } = await this.supabase
                .from('empresa_modulos')
                .insert([
                    { empresa_id: empresaId, modulo_id: moduloId, activo: true }
                ]);

            if (error && !error.message.includes('duplicate key')) {
                console.error(`Error asignando módulo ${moduloId}:`, error);
            }
        }
        
        console.log(`✅ Módulos por defecto asignados a empresa ${empresaId}`);
    }
}

window.SupabaseInitializer = SupabaseInitializer;