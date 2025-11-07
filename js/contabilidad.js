// Inicializar gráfico
document.addEventListener('DOMContentLoaded', function() {
    initCharts();
});

function initCharts() {
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Ingresos',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Gastos',
                    data: [8000, 12000, 10000, 18000, 15000, 22000],
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Funciones de exportación PDF
function generateBalancePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFontSize(20);
    doc.setTextColor(67, 97, 238);
    doc.text('BALANCE GENERAL', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Berroa Studio - ' + new Date().toLocaleDateString(), 105, 22, { align: 'center' });
    
    // Activos
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('ACTIVOS', 20, 35);
    
    doc.autoTable({
        startY: 40,
        head: [['Descripción', 'Valor']],
        body: [
            ['Efectivo en Caja', '$8,420'],
            ['Cuentas por Cobrar', '$12,560'],
            ['Inventario', '$89,450'],
            ['Equipos', '$25,000'],
            ['Total Activos', '$135,430']
        ],
        theme: 'grid'
    });
    
    // Pasivos y Patrimonio
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(16);
    doc.text('PASIVOS Y PATRIMONIO', 20, finalY);
    
    doc.autoTable({
        startY: finalY + 5,
        head: [['Descripción', 'Valor']],
        body: [
            ['Cuentas por Pagar', '$15,670'],
            ['Préstamos', '$35,000'],
            ['Capital Social', '$50,000'],
            ['Utilidades Acumuladas', '$34,760'],
            ['Total Pasivos y Patrimonio', '$135,430']
        ],
        theme: 'grid'
    });
    
    doc.save('balance-general.pdf');
}

function generateCashFlowPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(67, 97, 238);
    doc.text('FLUJO DE EFECTIVO', 105, 15, { align: 'center' });
    
    doc.autoTable({
        startY: 25,
        head: [['Concepto', 'Entradas', 'Salidas', 'Neto']],
        body: [
            ['Actividades Operativas', '$25,430', '$12,560', '$12,870'],
            ['Actividades de Inversión', '$0', '$5,000', '-$5,000'],
            ['Actividades de Financiamiento', '$10,000', '$2,500', '$7,500'],
            ['TOTAL', '$35,430', '$20,060', '$15,370']
        ],
        theme: 'grid',
        headStyles: { fillColor: [67, 97, 238] }
    });
    
    doc.save('flujo-efectivo.pdf');
}

// Funciones de exportación Excel
async function generateIncomeStatementExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Estado de Resultados');
    
    // Título
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'ESTADO DE RESULTADOS - BERROA STUDIO';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    worksheet.mergeCells('A2:D2');
    worksheet.getCell('A2').value = 'Período: ' + new Date().toLocaleDateString();
    worksheet.getCell('A2').font = { size: 12, italic: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    
    // Encabezados
    worksheet.addRow([]);
    const headerRow = worksheet.addRow(['Concepto', 'Monto', 'Porcentaje', 'Notas']);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4361EE' }
    };
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    
    // Datos
    worksheet.addRow(['INGRESOS', '', '', '']);
    worksheet.addRow(['Ventas Netas', 45670, '100%', '']);
    worksheet.addRow(['COSTOS Y GASTOS', '', '', '']);
    worksheet.addRow(['Costos de Ventas', 22340, '48.9%', '']);
    worksheet.addRow(['Gastos Operativos', 9000, '19.7%', '']);
    worksheet.addRow(['Gastos Administrativos', 4500, '9.9%', '']);
    worksheet.addRow(['UTILIDAD BRUTA', 23330, '51.1%', '']);
    worksheet.addRow(['Impuestos (25%)', 5832.5, '12.8%', '']);
    worksheet.addRow(['UTILIDAD NETA', 17497.5, '38.3%', '']);
    
    // Formato de números
    worksheet.getColumn(2).numFmt = '"$"#,##0.00';
    
    // Autoajustar columnas
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = maxLength < 10 ? 10 : maxLength;
    });
    
    // Guardar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'estado-resultados.xlsx');
}

async function generateFullReport() {
    // Crear múltiples reportes y comprimirlos (simulado)
    alert('Generando reporte completo... Esta función generaría múltiples archivos PDF/Excel y los comprimiría en un ZIP.');
    
    // En una implementación real, aquí generarías múltiples archivos y los comprimirías
    // Por ahora solo generamos un Excel con múltiples hojas
    
    const workbook = new ExcelJS.Workbook();
    
    // Hoja 1: Balance General
    const balanceSheet = workbook.addWorksheet('Balance General');
    balanceSheet.addRow(['BALANCE GENERAL - BERROA STUDIO']);
    balanceSheet.addRow(['ACTIVOS']);
    balanceSheet.addRow(['Efectivo en Caja', '$8,420']);
    balanceSheet.addRow(['Cuentas por Cobrar', '$12,560']);
    balanceSheet.addRow(['Inventario', '$89,450']);
    balanceSheet.addRow(['Total Activos', '$110,430']);
    
    // Hoja 2: Estado de Resultados
    const incomeSheet = workbook.addWorksheet('Estado Resultados');
    incomeSheet.addRow(['ESTADO DE RESULTADOS']);
    incomeSheet.addRow(['Ventas Netas', '$45,670']);
    incomeSheet.addRow(['Utilidad Neta', '$17,497']);
    
    // Hoja 3: Flujo de Efectivo
    const cashFlowSheet = workbook.addWorksheet('Flujo Efectivo');
    cashFlowSheet.addRow(['FLUJO DE EFECTIVO']);
    cashFlowSheet.addRow(['Actividades Operativas', '$12,870']);
    cashFlowSheet.addRow(['Flujo Neto', '$15,370']);
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'reporte-completo-contabilidad.xlsx');
}