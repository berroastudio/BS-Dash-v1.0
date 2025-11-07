// Sistema de Cotizaciones - COMPLETO
let cotizaciones = [];
let cotizacionEditando = null;
let nextCotizacionId = 1;

document.addEventListener('DOMContentLoaded', function() {
    cargarCotizaciones();
    cargarClientesSelect();
});

function cargarCotizaciones() {
    const estadoFilter = document.getElementById('estadoFilter').value;
    cotizaciones = JSON.parse(localStorage.getItem('bsdash_cotizaciones') || '[]');
    
    // Actualizar next ID
    if (cotizaciones.length > 0) {
        nextCotizacionId = Math.max(...cotizaciones.map(c => c.id)) + 1;
    }

    let cotizacionesFiltradas = cotizaciones;
    
    if (estadoFilter) {
        cotizacionesFiltradas = cotizaciones.filter(c => c.estado === estadoFilter);
    }

    mostrarCotizaciones(cotizacionesFiltradas);
}

function mostrarCotizaciones(cotizaciones) {
    const tbody = document.getElementById('tablaCotizaciones');
    const noCotizaciones = document.getElementById('noCotizaciones');
    const loading = document.getElementById('loadingCotizaciones');

    loading.style.display = 'none';

    if (cotizaciones.length === 0) {
        tbody.innerHTML = '';
        noCotizaciones.classList.remove('hidden');
        return;
    }

    noCotizaciones.classList.add('hidden');
    
    tbody.innerHTML = cotizaciones.map(cotizacion => `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="py-3 px-4">
                <div class="font-medium text-blue-600">${cotizacion.numero}</div>
            </td>
            <td class="py-3 px-4">
                <div class="font-medium">${cotizacion.clienteNombre}</div>
                <div class="text-sm text-gray-500">${cotizacion.clienteIdentificacion}</div>
            </td>
            <td class="py-3 px-4 text-sm text-gray-500">
                ${new Date(cotizacion.fecha).toLocaleDateString()}
            </td>
            <td class="py-3 px-4 text-sm text-gray-500">
                ${new Date(cotizacion.vencimiento).toLocaleDateString()}
            </td>
            <td class="py-3 px-4 font-semibold">$${cotizacion.total.toFixed(2)}</td>
            <td class="py-3 px-4">
                <span class="bs-status bs-status-${cotizacion.estado}">${getEstadoText(cotizacion.estado)}</span>
            </td>
            <td class="py-3 px-4">
                <div class="flex gap-2">
                    <button onclick="verCotizacion(${cotizacion.id})" class="bs-btn bs-btn-sm bg-blue-100 text-blue-700">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button onclick="editarCotizacion(${cotizacion.id})" class="bs-btn bs-btn-sm bg-green-100 text-green-700">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button onclick="eliminarCotizacion(${cotizacion.id})" class="bs-btn bs-btn-sm bg-red-100 text-red-700">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button onclick="enviarCotizacion(${cotizacion.id})" class="bs-btn bs-btn-sm bg-purple-100 text-purple-700">
                        <i class="bi bi-send"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getEstadoText(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'enviada': 'Enviada', 
        'aceptada': 'Aceptada',
        'rechazada': 'Rechazada',
        'expirada': 'Expirada'
    };
    return estados[estado] || estado;
}

function cargarClientesSelect() {
    const clientes = db.getClientes();
    const select = document.getElementById('cotizacionCliente');
    select.innerHTML = '<option value="">Seleccionar cliente...</option>';
    
    clientes.forEach(cliente => {
        select.innerHTML += `<option value="${cliente.id}">${cliente.nombre} - ${cliente.ruc_ci}</option>`;
    });
}

function nuevaCotizacion() {
    cotizacionEditando = null;
    document.getElementById('tituloModalCotizacion').textContent = 'Nueva Cotización';
    document.getElementById('formCotizacion').reset();
    document.getElementById('itemsCotizacion').innerHTML = '';
    
    // Establecer fecha de vencimiento por defecto (15 días)
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);
    document.getElementById('cotizacionVencimiento').value = fechaVencimiento.toISOString().split('T')[0];
    
    agregarItem(); // Agregar un item vacío por defecto
    actualizarTotales();
    
    document.getElementById('modalCotizacion').classList.remove('hidden');
    document.getElementById('modalCotizacion').classList.add('flex');
}

function agregarItem() {
    const itemsContainer = document.getElementById('itemsCotizacion');
    const itemId = Date.now();
    
    itemsContainer.innerHTML += `
        <div class="grid grid-cols-12 gap-2 items-center border border-gray-200 p-3 rounded-lg" id="item-${itemId}">
            <div class="col-span-5">
                <input type="text" placeholder="Descripción" class="bs-input w-full item-descripcion" 
                       onchange="actualizarTotales()">
            </div>
            <div class="col-span-2">
                <input type="number" placeholder="Cantidad" class="bs-input w-full item-cantidad" 
                       value="1" min="1" onchange="actualizarTotales()">
            </div>
            <div class="col-span-2">
                <input type="number" placeholder="Precio" class="bs-input w-full item-precio" 
                       step="0.01" min="0" onchange="actualizarTotales()">
            </div>
            <div class="col-span-2 text-right font-semibold item-total">
                $0.00
            </div>
            <div class="col-span-1 text-center">
                <button type="button" onclick="eliminarItem(${itemId})" class="bs-btn bg-red-50 text-red-600 text-sm">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function eliminarItem(itemId) {
    const itemElement = document.getElementById(`item-${itemId}`);
    if (itemElement) {
        itemElement.remove();
        actualizarTotales();
    }
}

function actualizarTotales() {
    let subtotal = 0;
    
    document.querySelectorAll('[id^="item-"]').forEach(itemElement => {
        const cantidad = parseFloat(itemElement.querySelector('.item-cantidad').value) || 0;
        const precio = parseFloat(itemElement.querySelector('.item-precio').value) || 0;
        const totalItem = cantidad * precio;
        
        itemElement.querySelector('.item-total').textContent = `$${totalItem.toFixed(2)}`;
        subtotal += totalItem;
    });
    
    const iva = subtotal * 0.18; // 18% IVA
    const total = subtotal + iva;
    
    document.getElementById('subtotalCotizacion').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('ivaCotizacion').textContent = `$${iva.toFixed(2)}`;
    document.getElementById('totalCotizacion').textContent = `$${total.toFixed(2)}`;
}

function guardarCotizacion() {
    if (!validarCotizacion()) return;
    
    const cotizacion = obtenerDatosCotizacion();
    cotizacion.estado = 'pendiente';
    
    if (cotizacionEditando) {
        // Editar cotización existente
        const index = cotizaciones.findIndex(c => c.id === cotizacionEditando);
        if (index !== -1) {
            cotizaciones[index] = cotizacion;
        }
    } else {
        // Nueva cotización
        cotizacion.id = nextCotizacionId++;
        cotizacion.numero = `COT-${String(cotizacion.id).padStart(3, '0')}`;
        cotizacion.fecha = new Date().toISOString();
        cotizaciones.push(cotizacion);
    }
    
    localStorage.setItem('bsdash_cotizaciones', JSON.stringify(cotizaciones));
    cerrarModalCotizacion();
    cargarCotizaciones();
    alert('✅ Cotización guardada correctamente');
}

function obtenerDatosCotizacion() {
    const clienteId = document.getElementById('cotizacionCliente').value;
    const clientes = db.getClientes();
    const cliente = clientes.find(c => c.id == clienteId);
    
    const items = [];
    document.querySelectorAll('[id^="item-"]').forEach(itemElement => {
        const descripcion = itemElement.querySelector('.item-descripcion').value;
        const cantidad = parseFloat(itemElement.querySelector('.item-cantidad').value);
        const precio = parseFloat(itemElement.querySelector('.item-precio').value);
        
        if (descripcion && cantidad && precio) {
            items.push({
                descripcion,
                cantidad,
                precio,
                total: cantidad * precio
            });
        }
    });
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const iva = subtotal * 0.18;
    const total = subtotal + iva;
    
    return {
        id: cotizacionEditando || nextCotizacionId,
        numero: cotizacionEditando ? cotizaciones.find(c => c.id === cotizacionEditando).numero : `COT-${String(nextCotizacionId).padStart(3, '0')}`,
        clienteId: clienteId,
        clienteNombre: cliente ? cliente.nombre : '',
        clienteIdentificacion: cliente ? cliente.ruc_ci : '',
        fecha: cotizacionEditando ? cotizaciones.find(c => c.id === cotizacionEditando).fecha : new Date().toISOString(),
        vencimiento: document.getElementById('cotizacionVencimiento').value,
        notas: document.getElementById('cotizacionNotas').value,
        items: items,
        subtotal: subtotal,
        iva: iva,
        total: total,
        estado: 'pendiente'
    };
}

function validarCotizacion() {
    const cliente = document.getElementById('cotizacionCliente').value;
    const vencimiento = document.getElementById('cotizacionVencimiento').value;
    
    if (!cliente) {
        alert('⚠️ Debe seleccionar un cliente');
        return false;
    }
    
    if (!vencimiento) {
        alert('⚠️ Debe establecer una fecha de vencimiento');
        return false;
    }
    
    const itemsValidos = Array.from(document.querySelectorAll('[id^="item-"]')).some(itemElement => {
        const descripcion = itemElement.querySelector('.item-descripcion').value;
        const cantidad = itemElement.querySelector('.item-cantidad').value;
        const precio = itemElement.querySelector('.item-precio').value;
        return descripcion && cantidad && precio;
    });
    
    if (!itemsValidos) {
        alert('⚠️ Debe agregar al menos un producto/servicio válido');
        return false;
    }
    
    return true;
}

function editarCotizacion(id) {
    const cotizacion = cotizaciones.find(c => c.id === id);
    if (!cotizacion) return;
    
    cotizacionEditando = id;
    document.getElementById('tituloModalCotizacion').textContent = 'Editar Cotización';
    document.getElementById('formCotizacion').reset();
    document.getElementById('itemsCotizacion').innerHTML = '';
    
    // Cargar datos del cliente
    document.getElementById('cotizacionCliente').value = cotizacion.clienteId;
    document.getElementById('cotizacionVencimiento').value = cotizacion.vencimiento;
    document.getElementById('cotizacionNotas').value = cotizacion.notas || '';
    
    // Cargar items
    cotizacion.items.forEach(item => {
        agregarItem();
        const lastItem = document.querySelector('[id^="item-"]:last-child');
        lastItem.querySelector('.item-descripcion').value = item.descripcion;
        lastItem.querySelector('.item-cantidad').value = item.cantidad;
        lastItem.querySelector('.item-precio').value = item.precio;
    });
    
    actualizarTotales();
    document.getElementById('modalCotizacion').classList.remove('hidden');
    document.getElementById('modalCotizacion').classList.add('flex');
}

function eliminarCotizacion(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta cotización?')) {
        cotizaciones = cotizaciones.filter(c => c.id !== id);
        localStorage.setItem('bsdash_cotizaciones', JSON.stringify(cotizaciones));
        cargarCotizaciones();
        alert('✅ Cotización eliminada');
    }
}

function enviarCotizacion(id) {
    const cotizacion = cotizaciones.find(c => c.id === id);
    if (cotizacion) {
        cotizacion.estado = 'enviada';
        localStorage.setItem('bsdash_cotizaciones', JSON.stringify(cotizaciones));
        cargarCotizaciones();
        alert('✅ Cotización marcada como enviada');
    }
}

function verCotizacion(id) {
    const cotizacion = cotizaciones.find(c => c.id === id);
    if (!cotizacion) return;
    
    document.getElementById('numeroCotizacionVer').textContent = cotizacion.numero;
    
    const contenido = document.getElementById('contenidoCotizacion');
    contenido.innerHTML = generarHTMLCotizacion(cotizacion);
    
    document.getElementById('modalVerCotizacion').classList.remove('hidden');
    document.getElementById('modalVerCotizacion').classList.add('flex');
}

function generarHTMLCotizacion(cotizacion) {
    const empresa = JSON.parse(localStorage.getItem('bsdash_empresa') || '{}');
    
    return `
        <div class="cotizacion-template">
            <!-- Encabezado -->
            <div class="text-center mb-8 border-b pb-4">
                <h1 class="text-2xl font-bold text-gray-800">${empresa.nombre || 'Berroa Studio'}</h1>
                <p class="text-gray-600">${empresa.eslogan || 'Soluciones digitales innovadoras'}</p>
                <p class="text-sm text-gray-500">RNC: ${empresa.rnc || '123456789'} | Tel: ${empresa.telefono || '(809) 123-4567'}</p>
            </div>
            
            <!-- Información de la Cotización -->
            <div class="grid grid-cols-2 gap-8 mb-6">
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Para:</h3>
                    <p>${cotizacion.clienteNombre}</p>
                    <p>RNC/Cédula: ${cotizacion.clienteIdentificacion}</p>
                </div>
                <div class="text-right">
                    <h3 class="font-bold text-gray-800 mb-2">Cotización:</h3>
                    <p><strong>N°:</strong> ${cotizacion.numero}</p>
                    <p><strong>Fecha:</strong> ${new Date(cotizacion.fecha).toLocaleDateString()}</p>
                    <p><strong>Vence:</strong> ${new Date(cotizacion.vencimiento).toLocaleDateString()}</p>
                </div>
            </div>
            
            <!-- Items -->
            <table class="w-full mb-6">
                <thead>
                    <tr class="border-b-2 border-gray-800">
                        <th class="text-left py-2">Descripción</th>
                        <th class="text-center py-2">Cantidad</th>
                        <th class="text-right py-2">Precio Unit.</th>
                        <th class="text-right py-2">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${cotizacion.items.map(item => `
                        <tr class="border-b border-gray-200">
                            <td class="py-3">${item.descripcion}</td>
                            <td class="text-center py-3">${item.cantidad}</td>
                            <td class="text-right py-3">$${item.precio.toFixed(2)}</td>
                            <td class="text-right py-3">$${item.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <!-- Totales -->
            <div class="grid grid-cols-2 gap-8 max-w-md ml-auto">
                <div class="text-right">Subtotal:</div>
                <div class="text-right font-semibold">$${cotizacion.subtotal.toFixed(2)}</div>
                
                <div class="text-right">IVA (18%):</div>
                <div class="text-right font-semibold">$${cotizacion.iva.toFixed(2)}</div>
                
                <div class="text-right border-t pt-2 text-lg font-bold">Total:</div>
                <div class="text-right border-t pt-2 text-lg font-bold">$${cotizacion.total.toFixed(2)}</div>
            </div>
            
            <!-- Notas -->
            ${cotizacion.notas ? `
            <div class="mt-8 p-4 bg-gray-50 rounded">
                <h4 class="font-bold mb-2">Notas:</h4>
                <p>${cotizacion.notas}</p>
            </div>
            ` : ''}
            
            <!-- Estado -->
            <div class="mt-8 text-center text-sm text-gray-500">
                <p>Estado: <span class="font-semibold">${getEstadoText(cotizacion.estado)}</span></p>
            </div>
        </div>
    `;
}

function imprimirCotizacion() {
    window.print();
}

function cerrarModalCotizacion() {
    document.getElementById('modalCotizacion').classList.add('hidden');
    document.getElementById('modalCotizacion').classList.remove('flex');
}

function cerrarModalVerCotizacion() {
    document.getElementById('modalVerCotizacion').classList.add('hidden');
    document.getElementById('modalVerCotizacion').classList.remove('flex');
}

// Evento del formulario
document.getElementById('formCotizacion').addEventListener('submit', function(e) {
    e.preventDefault();
    guardarCotizacion();
});

function buscarCotizaciones() {
    const searchTerm = document.getElementById('searchCotizaciones').value.toLowerCase();
    if (!searchTerm) {
        cargarCotizaciones();
        return;
    }
    
    const cotizacionesFiltradas = cotizaciones.filter(cotizacion => 
        cotizacion.numero.toLowerCase().includes(searchTerm) ||
        cotizacion.clienteNombre.toLowerCase().includes(searchTerm) ||
        cotizacion.clienteIdentificacion.includes(searchTerm)
    );
    
    mostrarCotizaciones(cotizacionesFiltradas);
}