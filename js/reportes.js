// Funciones para Reportes de Ventas
function exportSalesPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(67, 97, 238);
    doc.text('REPORTE DE VENTAS', 105, 15, { align: 'center' });
    
    const startDate = document.getElementById('startDate').value || 'No especificada';
    const endDate = document.getElementById('endDate').value || 'No especificada';
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${startDate} - ${endDate}`, 105, 22, { align: 'center' });
    
    doc.autoTable({
        startY: 30,
        head: [['Fecha', 'Venta ID', 'Cliente', 'Productos', 'Total', 'Método Pago']],
        body: [
            ['2023-05-15', 'V00125', 'Juan Pérez', '3', '$245.00', 'Efectivo'],
            ['2023-05-14', 'V00124', 'María García', '2', '$189.50', 'Tarjeta'],
            ['2023-05-13', 'V00123', 'Carlos López', '4', '$320.75', 'Transferencia'],
            ['2023-05-12', 'V00122', 'Ana Rodríguez', '1', '$150.00', 'Efectivo'],
            ['2023-05-11', 'V00121', 'Pedro Martínez', '5', '$425.25', 'Tarjeta'],
            ['', '', '', 'TOTAL:', '$1,330.50', '']
        ],
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
        styles: { fontSize: 10 },
        columnStyles: {
            4: { cellWidth: 25 },
            5: { cellWidth: 30 }
        }
    });
    
    // Estadísticas
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('ESTADÍSTICAS:', 20, finalY);
    doc.text(`• Total de ventas: 5`, 20, finalY + 7);
    doc.text(`• Ingreso total: $1,330.50`, 20, finalY + 14);
    doc.text(`• Ticket promedio: $266.10`, 20, finalY + 21);
    doc.text(`• Método de pago más usado: Efectivo (40%)`, 20, finalY + 28);
    
    doc.save('reporte-ventas.pdf');
}

async function exportSalesExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Ventas');
    
    // Título
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'REPORTE DE VENTAS - BERROA STUDIO';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Datos
    worksheet.addRow(['Fecha', 'Venta ID', 'Cliente', 'Productos', 'Total', 'Método Pago']);
    worksheet.addRow(['2023-05-15', 'V00125', 'Juan Pérez', 3, 245.00, 'Efectivo']);
    worksheet.addRow(['2023-05-14', 'V00124', 'María García', 2, 189.50, 'Tarjeta']);
    worksheet.addRow(['2023-05-13', 'V00123', 'Carlos López', 4, 320.75, 'Transferencia']);
    worksheet.addRow(['2023-05-12', 'V00122', 'Ana Rodríguez', 1, 150.00, 'Efectivo']);
    worksheet.addRow(['2023-05-11', 'V00121', 'Pedro Martínez', 5, 425.25, 'Tarjeta']);
    worksheet.addRow(['', '', 'TOTAL', '', 1330.50, '']);
    
    // Formato
    worksheet.getColumn(5).numFmt = '"$"#,##0.00';
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'reporte-ventas.xlsx');
}

// Funciones para Reportes de Inventario
function exportInventoryPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(67, 97, 238);
    doc.text('REPORTE DE INVENTARIO', 105, 15, { align: 'center' });
    
    doc.autoTable({
        startY: 25,
        head: [['Producto', 'Categoría', 'Stock', 'Stock Mín', 'Precio', 'Valor Total']],
        body: [
            ['Laptop Gaming', 'Tecnología', 15, 5, '$1,200', '$18,000'],
            ['Mouse Inalámbrico', 'Accesorios', 45, 10, '$25', '$1,125'],
            ['Teclado Mecánico', 'Accesorios', 32, 8, '$80', '$2,560'],
            ['Monitor 24"', 'Tecnología', 12, 3, '$300', '$3,600'],
            ['Silla Ergonómica', 'Muebles', 8, 2, '$250', '$2,000'],
            ['', '', 'TOTAL', '', '', '$27,285']
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
    });
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('ANÁLISIS DE INVENTARIO:', 20, finalY);
    doc.text(`• Productos con stock bajo: 2 productos`, 20, finalY + 7);
    doc.text(`• Valor total del inventario: $89,450`, 20, finalY + 14);
    doc.text(`• Rotación estimada: 45 días`, 20, finalY + 21);
    
    doc.save('reporte-inventario.pdf');
}

async function exportInventoryExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario');
    
    worksheet.addRow(['REPORTE DE INVENTARIO']);
    worksheet.addRow(['Producto', 'Stock Actual', 'Stock Mínimo', 'Estado']);
    worksheet.addRow(['Laptop Gaming', 15, 5, 'OK']);
    worksheet.addRow(['Mouse Inalámbrico', 45, 10, 'OK']);
    worksheet.addRow(['Teclado Mecánico', 32, 8, 'OK']);
    worksheet.addRow(['Monitor 24"', 12, 3, 'OK']);
    worksheet.addRow(['Silla Ergonómica', 8, 2, 'ALERTA']);
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'reporte-inventario.xlsx');
}

// Funciones para Reportes de Clientes
function exportCustomersPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(67, 97, 238);
    doc.text('REPORTE DE CLIENTES', 105, 15, { align: 'center' });
    
    doc.autoTable({
        startY: 25,
        head: [['Cliente', 'Email', 'Teléfono', 'Compras', 'Total Gastado', 'Última Compra']],
        body: [
            ['Juan Pérez', 'juan@email.com', '809-123-4567', 8, '$2,450', '2023-05-15'],
            ['María García', 'maria@email.com', '809-234-5678', 12, '$3,890', '2023-05-14'],
            ['Carlos López', 'carlos@email.com', '809-345-6789', 5, '$1,230', '2023-05-10'],
            ['Ana Rodríguez', 'ana@email.com', '809-456-7890', 3, '$750', '2023-05-08'],
            ['Pedro Martínez', 'pedro@email.com', '809-567-8901', 7, '$1,980', '2023-05-05']
        ],
        theme: 'grid',
        headStyles: { fillColor: [168, 85, 247] }
    });
    
    doc.save('reporte-clientes.pdf');
}

// Funciones para Reportes Financieros
function exportFinancialPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(67, 97, 238);
    doc.text('REPORTE FINANCIERO COMPLETO', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Resumen Ejecutivo - ' + new Date().toLocaleDateString(), 105, 22, { align: 'center' });
    
    // Métricas principales
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('MÉTRICAS PRINCIPALES:', 20, 35);
    
    doc.autoTable({
        startY: 40,
        body: [
            ['Ingresos Totales', '$45,670'],
            ['Gastos Totales', '$22,340'],
            ['Utilidad Neta', '$23,330'],
            ['Margen de Utilidad', '51.1%'],
            ['ROI Mensual', '15.8%']
        ],
        theme: 'grid'
    });
    
    // Tendencias
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('TENDENCIAS:', 20, finalY);
    
    doc.autoTable({
        startY: finalY + 5,
        head: [['Mes', 'Ventas', 'Crecimiento']],
        body: [
            ['Enero', '$12,000', '+0%'],
            ['Febrero', '$19,000', '+58%'],
            ['Marzo', '$15,000', '-21%'],
            ['Abril', '$25,000', '+67%'],
            ['Mayo', '$22,000', '-12%'],
            ['Junio', '$30,000', '+36%']
        ],
        theme: 'grid'
    });
    
    doc.save('reporte-financiero.pdf');
}

// Funciones personalizadas
function exportCustomPDF() {
    alert('Generando PDF personalizado con los campos seleccionados...');
    // Aquí implementarías la lógica para generar PDFs basados en checkboxes seleccionados
}

async function exportCustomExcel() {
    alert('Generando Excel personalizado con los campos seleccionados...');
    // Aquí implementarías la lógica para generar Excel basado en checkboxes seleccionados
}

function exportDashboard() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(24);
    doc.setTextColor(67, 97, 238);
    doc.text('DASHBOARD EJECUTIVO', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Berroa Studio - ' + new Date().toLocaleDateString(), 105, 28, { align: 'center' });
    
    // KPIs principales
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('INDICADORES CLAVE (KPIs)', 20, 45);
    
    doc.autoTable({
        startY: 50,
        body: [
            ['Ventas del Mes', '$45,670', '↑ 12% vs mes anterior'],
            ['Clientes Activos', '156', '↑ 8% vs mes anterior'],
            ['Ticket Promedio', '$292.76', '↑ 5% vs mes anterior'],
            ['Satisfacción Cliente', '4.8/5.0', '⭐ Excelente'],
            ['Productividad', '92%', '🟢 En meta']
        ],
        theme: 'grid'
    });
    
    doc.save('dashboard-ejecutivo.pdf');
}

// Función general para generar reportes
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    alert(`Generando reporte ${reportType} para el período ${startDate} - ${endDate}`);
    
    // Aquí implementarías la lógica para generar el reporte específico
    switch(reportType) {
        case 'sales':
            exportSalesPDF();
            break;
        case 'inventory':
            exportInventoryPDF();
            break;
        case 'financial':
            exportFinancialPDF();
            break;
        case 'customers':
            exportCustomersPDF();
            break;
    }
}