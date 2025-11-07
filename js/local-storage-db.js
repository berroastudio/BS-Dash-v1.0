// Base de datos simulada con localStorage
class LocalStorageDB {
    constructor() {
        this.prefix = 'bsdash_';
    }

    // Guardar datos por empresa
    guardar(tabla, datos) {
        const empresaId = empresaManager.empresaActual;
        const key = `${this.prefix}empresa_${empresaId}_${tabla}`;
        
        const existentes = this.obtenerTodos(tabla);
        if (datos.id) {
            // Actualizar
            const index = existentes.findIndex(item => item.id === datos.id);
            if (index !== -1) {
                existentes[index] = { ...existentes[index], ...datos };
            } else {
                existentes.push(datos);
            }
        } else {
            // Nuevo (generar ID)
            datos.id = Date.now().toString();
            existentes.push(datos);
        }
        
        localStorage.setItem(key, JSON.stringify(existentes));
        return datos;
    }

    // Obtener todos los registros
    obtenerTodos(tabla) {
        const empresaId = empresaManager.empresaActual;
        const key = `${this.prefix}empresa_${empresaId}_${tabla}`;
        const datos = localStorage.getItem(key);
        return datos ? JSON.parse(datos) : [];
    }

    // Ejemplo: inicializar datos de demo
    inicializarDatosDemo() {
        const clientesEmpresa1 = [
            { id: '1', nombre: 'Cliente A Empresa 1', email: 'cliente1@empresa1.com' },
            { id: '2', nombre: 'Cliente B Empresa 1', email: 'cliente2@empresa1.com' }
        ];

        const clientesEmpresa2 = [
            { id: '1', nombre: 'Cliente X Empresa 2', email: 'clienteX@empresa2.com' },
            { id: '2', nombre: 'Cliente Y Empresa 2', email: 'clienteY@empresa2.com' }
        ];

        localStorage.setItem(`${this.prefix}empresa_1_clientes`, JSON.stringify(clientesEmpresa1));
        localStorage.setItem(`${this.prefix}empresa_2_clientes`, JSON.stringify(clientesEmpresa2));
    }
}

const db = new LocalStorageDB();