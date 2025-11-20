import dash
from dash import html, dcc, Input, Output, State, callback_context, dash_table
import dash_bootstrap_components as dbc

# Obtener la app de Dash del contexto global
app = dash.get_app()

# Importar el sequence_manager de manera diferida
def get_sequence_manager():
    from models.sequences import SequenceManager
    return SequenceManager()

sequence_manager = get_sequence_manager()

# Layout del módulo de secuencias
layout = html.Div([
    html.H3("🔢 Configuración de Secuencias", className="mb-4"),
    html.P("Configura los números de secuencia para facturas, cotizaciones, pagos y más.", className="text-muted"),
    
    dbc.Card([
        dbc.CardHeader("📋 Lista de Secuencias Configuradas"),
        dbc.CardBody([
            html.Div(id="sequences-table-container"),
            html.Div(id="sequences-feedback", className="mt-3")
        ])
    ], className="mb-4"),
    
    dbc.Card([
        dbc.CardHeader("⚙️ Editar Secuencia"),
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    dbc.Label("Tipo de Secuencia"),
                    dcc.Dropdown(
                        id="sequence-type-dropdown",
                        options=[
                            {"label": "📄 Cotizaciones", "value": "quotations"},
                            {"label": "🧾 Facturas", "value": "invoices"},
                            {"label": "💳 Pagos", "value": "payments"},
                            {"label": "📊 Reportes", "value": "reports"},
                            {"label": "💰 Cierres de Caja", "value": "cash_closing"}
                        ],
                        placeholder="Selecciona un tipo de secuencia..."
                    )
                ], width=6),
                dbc.Col([
                    dbc.Label("Descripción"),
                    html.Div(id="sequence-description", className="text-muted")
                ], width=6)
            ], className="mb-3"),
            
            dbc.Row([
                dbc.Col([
                    dbc.Label("Prefijo"),
                    dbc.Input(
                        id="sequence-prefix",
                        type="text",
                        placeholder="Ej: FAC, COT, PAG..."
                    )
                ], width=3),
                dbc.Col([
                    dbc.Label("Próximo Número"),
                    dbc.Input(
                        id="sequence-next-number",
                        type="number",
                        min=1,
                        placeholder="Ej: 1, 100, 1000..."
                    )
                ], width=3),
                dbc.Col([
                    dbc.Label("Dígitos (Padding)"),
                    dbc.Input(
                        id="sequence-padding",
                        type="number",
                        min=1,
                        max=10,
                        placeholder="Ej: 6 para 000001"
                    )
                ], width=3),
                dbc.Col([
                    dbc.Button("💾 Guardar Cambios", 
                              id="save-sequence-btn", 
                              color="primary",
                              className="mt-4 w-100",
                              disabled=True)
                ], width=3)
            ]),
            
            html.Div(id="sequence-preview", className="mt-3 p-3 bg-light rounded")
        ])
    ]),
    
    dbc.Card([
        dbc.CardHeader("🧪 Probar Secuencias"),
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    dbc.Label("Generar número de prueba:"),
                    dcc.Dropdown(
                        id="test-sequence-dropdown",
                        options=[
                            {"label": "Cotización", "value": "quotations"},
                            {"label": "Factura", "value": "invoices"},
                            {"label": "Pago", "value": "payments"},
                            {"label": "Reporte", "value": "reports"},
                            {"label": "Cierre Caja", "value": "cash_closing"}
                        ],
                        placeholder="Selecciona tipo para probar..."
                    )
                ], width=6),
                dbc.Col([
                    dbc.Button("🎲 Generar Número", 
                              id="generate-test-btn",
                              color="success",
                              className="mt-4 w-100",
                              disabled=True)
                ], width=6)
            ]),
            html.Div(id="test-result", className="mt-3")
        ])
    ])
])

# Callbacks para la interactividad
@app.callback(
    [Output("sequences-table-container", "children"),
     Output("sequence-description", "children")],
    Input("url", "pathname")
)
def load_sequences_table(pathname):
    """Carga la tabla de secuencias y descripción"""
    sequences = sequence_manager.get_all_sequences()
    
    # Crear tabla de datos
    table_data = []
    for seq_type, config in sequences.items():
        # Traducir nombres para mostrar
        type_names = {
            "quotations": "Cotizaciones",
            "invoices": "Facturas", 
            "payments": "Pagos",
            "reports": "Reportes",
            "cash_closing": "Cierres Caja"
        }
        
        table_data.append({
            "Tipo": type_names.get(seq_type, seq_type),
            "Prefijo": config["prefix"],
            "Próximo Número": config["next_number"],
            "Dígitos": config["padding"],
            "Ejemplo": f"{config['prefix']}-{str(config['next_number']).zfill(config['padding'])}",
            "ID": seq_type
        })
    
    # Crear tabla
    table = dash_table.DataTable(
        id='sequences-datatable',
        columns=[
            {"name": "Tipo", "id": "Tipo"},
            {"name": "Prefijo", "id": "Prefijo"},
            {"name": "Próximo N°", "id": "Próximo Número"},
            {"name": "Dígitos", "id": "Dígitos"},
            {"name": "Ejemplo", "id": "Ejemplo"}
        ],
        data=table_data,
        row_selectable='single',
        selected_rows=[],
        style_cell={'textAlign': 'left', 'padding': '10px'},
        style_header={'backgroundColor': 'rgb(230, 230, 230)', 'fontWeight': 'bold'},
        style_data_conditional=[
            {
                'if': {'row_index': 'odd'},
                'backgroundColor': 'rgb(248, 248, 248)'
            }
        ]
    )
    
    return table, "Selecciona una secuencia para editar..."

@app.callback(
    [Output("sequence-prefix", "value"),
     Output("sequence-next-number", "value"), 
     Output("sequence-padding", "value"),
     Output("sequence-description", "children"),
     Output("save-sequence-btn", "disabled")],
    [Input("sequences-datatable", "selected_rows"),
     Input("sequence-type-dropdown", "value")],
    [State("sequences-datatable", "data")]
)
def load_sequence_data(selected_rows, dropdown_value, table_data):
    """Carga los datos de la secuencia seleccionada"""
    ctx = callback_context
    if not ctx.triggered:
        return "", "", "", "Selecciona una secuencia para editar...", True
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    if trigger_id == "sequences-datatable" and selected_rows:
        # Selección desde tabla
        selected_row = selected_rows[0]
        seq_id = table_data[selected_row]["ID"]
    elif trigger_id == "sequence-type-dropdown" and dropdown_value:
        # Selección desde dropdown
        seq_id = dropdown_value
    else:
        return "", "", "", "Selecciona una secuencia para editar...", True
    
    # Cargar datos de la secuencia
    sequence_info = sequence_manager.get_sequence_info(seq_id)
    if sequence_info:
        description = sequence_info.get("description", "Sin descripción")
        return (sequence_info["prefix"], 
                sequence_info["next_number"], 
                sequence_info["padding"],
                f"📝 Editando: {description}",
                False)
    
    return "", "", "", "Secuencia no encontrada", True

@app.callback(
    Output("sequence-preview", "children"),
    [Input("sequence-prefix", "value"),
     Input("sequence-next-number", "value"),
     Input("sequence-padding", "value")]
)
def update_sequence_preview(prefix, next_number, padding):
    """Actualiza la vista previa de la secuencia"""
    if not prefix or not next_number or not padding:
        return "👆 Completa los campos para ver la vista previa"
    
    try:
        padding_int = int(padding)
        next_num_int = int(next_number)
        formatted_num = str(next_num_int).zfill(padding_int)
        preview = f"{prefix}-{formatted_num}"
        
        return html.Div([
            html.Strong("Vista previa: "),
            html.Code(preview, className="text-primary fs-5")
        ])
    except (ValueError, TypeError):
        return "❌ Valores inválidos para la vista previa"

@app.callback(
    Output("sequences-feedback", "children"),
    [Input("save-sequence-btn", "n_clicks")],
    [State("sequence-type-dropdown", "value"),
     State("sequence-prefix", "value"),
     State("sequence-next-number", "value"),
     State("sequence-padding", "value"),
     State("sequences-datatable", "selected_rows"),
     State("sequences-datatable", "data")]
)
def save_sequence_changes(n_clicks, dropdown_value, prefix, next_number, padding, selected_rows, table_data):
    """Guarda los cambios en la secuencia"""
    if not n_clicks:
        return ""
    
    # Determinar qué secuencia editar
    if dropdown_value:
        seq_id = dropdown_value
    elif selected_rows:
        seq_id = table_data[selected_rows[0]]["ID"]
    else:
        return dbc.Alert("❌ No se ha seleccionado ninguna secuencia", color="danger")
    
    # Validar campos
    if not prefix or not next_number or not padding:
        return dbc.Alert("❌ Todos los campos son requeridos", color="danger")
    
    try:
        next_num_int = int(next_number)
        padding_int = int(padding)
        
        if next_num_int < 1:
            return dbc.Alert("❌ El próximo número debe ser mayor a 0", color="danger")
        if padding_int < 1 or padding_int > 10:
            return dbc.Alert("❌ Los dígitos deben estar entre 1 y 10", color="danger")
            
    except ValueError:
        return dbc.Alert("❌ Valores numéricos inválidos", color="danger")
    
    # Actualizar secuencia
    success = sequence_manager.update_sequence(seq_id, prefix, next_num_int, padding_int)
    
    if success:
        return dbc.Alert("✅ Secuencia actualizada exitosamente", color="success", duration=4000)
    else:
        return dbc.Alert("❌ Error al actualizar la secuencia", color="danger")

@app.callback(
    [Output("generate-test-btn", "disabled"),
     Output("test-sequence-dropdown", "value")],
    [Input("test-sequence-dropdown", "value"),
     Input("sequence-type-dropdown", "value")]
)
def update_test_button(test_value, edit_value):
    """Habilita/deshabilita el botón de prueba"""
    if test_value:
        return False, test_value
    elif edit_value:
        return False, edit_value
    else:
        return True, None

@app.callback(
    Output("test-result", "children"),
    [Input("generate-test-btn", "n_clicks")],
    [State("test-sequence-dropdown", "value")]
)
def generate_test_sequence(n_clicks, sequence_type):
    """Genera un número de secuencia de prueba"""
    if not n_clicks or not sequence_type:
        return ""
    
    try:
        test_number = sequence_manager.get_next_sequence(sequence_type)
        
        type_names = {
            "quotations": "Cotización",
            "invoices": "Factura",
            "payments": "Pago", 
            "reports": "Reporte",
            "cash_closing": "Cierre de Caja"
        }
        
        return dbc.Alert([
            html.Strong(f"🎉 {type_names.get(sequence_type)} generada: "),
            html.Code(test_number, className="fs-5 text-success")
        ], color="light")
        
    except Exception as e:
        return dbc.Alert(f"❌ Error al generar secuencia: {str(e)}", color="danger")