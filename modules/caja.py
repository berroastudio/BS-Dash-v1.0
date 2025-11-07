import dash
from dash import html, dcc, Input, Output, State, callback_context, dash_table
import dash_bootstrap_components as dbc
from datetime import datetime

# Obtener la app de Dash del contexto global
app = dash.get_app()

# Importar el cash_manager de manera diferida
def get_cash_manager():
    from models.cash_management import CashManager
    return CashManager()

cash_manager = get_cash_manager()

# Layout del módulo de caja
layout = html.Div([
    html.H3("💰 Gestión de Caja", className="mb-4"),
    
    # Estado de caja
    dbc.Card([
        dbc.CardHeader("📊 Estado Actual de Caja"),
        dbc.CardBody(id="cash-status-content")
    ], className="mb-4"),
    
    # Acciones de caja
    dbc.Card([
        dbc.CardHeader("⚡ Acciones Rápidas"),
        dbc.CardBody(id="cash-actions-content")
    ], className="mb-4"),
    
    # Movimientos de caja
    dbc.Card([
        dbc.CardHeader("💸 Registrar Movimiento"),
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    dbc.Label("Tipo de Movimiento"),
                    dcc.Dropdown(
                        id="movement-type",
                        options=[
                            {"label": "💰 Ingreso", "value": "ingreso"},
                            {"label": "💳 Egreso", "value": "egreso"}
                        ],
                        placeholder="Selecciona tipo..."
                    )
                ], width=4),
                dbc.Col([
                    dbc.Label("Monto"),
                    dbc.Input(
                        id="movement-amount",
                        type="number",
                        min=0.01,
                        step=0.01,
                        placeholder="0.00"
                    )
                ], width=4),
                dbc.Col([
                    dbc.Label("Descripción"),
                    dbc.Input(
                        id="movement-description",
                        type="text",
                        placeholder="Ej: Venta #001, Compra suministros..."
                    )
                ], width=4),
            ]),
            dbc.Button(
                "💾 Registrar Movimiento",
                id="register-movement-btn",
                color="primary",
                className="mt-3",
                disabled=True
            ),
            html.Div(id="movement-feedback", className="mt-3")
        ])
    ], className="mb-4"),
    
    # Logs de caja
    dbc.Card([
        dbc.CardHeader("📋 Historial de Movimientos"),
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    dbc.Label("Filtrar por tipo:"),
                    dcc.Dropdown(
                        id="log-type-filter",
                        options=[
                            {"label": "Todos", "value": "all"},
                            {"label": "Aperturas", "value": "apertura"},
                            {"label": "Cierres", "value": "cierre"},
                            {"label": "Movimientos", "value": "movimiento"}
                        ],
                        value="all"
                    )
                ], width=4),
                dbc.Col([
                    dbc.Button("🔄 Actualizar", id="refresh-logs-btn", color="info", className="mt-4")
                ], width=4)
            ]),
            html.Div(id="cash-logs-content", className="mt-3")
        ])
    ])
])

# Callbacks para la interactividad
@app.callback(
    [Output("cash-status-content", "children"),
     Output("cash-actions-content", "children")],
    Input("url", "pathname")
)
def load_cash_status(pathname):
    """Carga el estado y acciones de caja"""
    status = cash_manager.get_cash_status()
    
    # Contenido del estado
    status_content = [
        dbc.Row([
            dbc.Col([
                html.H5("Estado:", className="mb-2"),
                dbc.Badge(
                    "ABIERTA" if status["is_open"] else "CERRADA",
                    color="success" if status["is_open"] else "secondary",
                    className="fs-6"
                )
            ], width=3),
            dbc.Col([
                html.H5("Efectivo en Caja:", className="mb-2"),
                html.H4(f"${status['current_cash']:,.2f}", 
                       className="text-success" if status["is_open"] else "text-muted")
            ], width=3),
            dbc.Col([
                html.H5("Monto Apertura:", className="mb-2"),
                html.P(f"${status['opening_amount']:,.2f}" if status['opening_amount'] else "N/A")
            ], width=3),
            dbc.Col([
                html.H5("Fecha Apertura:", className="mb-2"),
                html.P(status['opening_date'][:19] if status['opening_date'] else "N/A")
            ], width=3),
        ])
    ]
    
    # Contenido de acciones
    if status['is_open']:
        actions_content = [
            html.H5("Cerrar Caja", className="mb-3"),
            dbc.Row([
                dbc.Col([
                    dbc.Label("Monto de Cierre:"),
                    dbc.Input(
                        id="closing-amount",
                        type="number",
                        value=status['current_cash'],
                        min=0,
                        step=0.01
                    )
                ], width=4),
                dbc.Col([
                    dbc.Label("Notas:"),
                    dbc.Textarea(
                        id="closing-notes",
                        placeholder="Observaciones del cierre..."
                    )
                ], width=6),
                dbc.Col([
                    dbc.Button(
                        "🔒 Cerrar Caja", 
                        id="close-cash-btn", 
                        color="warning",
                        className="mt-4 w-100"
                    )
                ], width=2)
            ])
        ]
    else:
        actions_content = [
            html.H5("Abrir Caja", className="mb-3"),
            dbc.Row([
                dbc.Col([
                    dbc.Label("Monto de Apertura:"),
                    dbc.Input(
                        id="opening-amount",
                        type="number",
                        value=0,
                        min=0,
                        step=0.01
                    )
                ], width=4),
                dbc.Col([
                    dbc.Label("Notas:"),
                    dbc.Textarea(
                        id="opening-notes",
                        placeholder="Observaciones de apertura..."
                    )
                ], width=6),
                dbc.Col([
                    dbc.Button(
                        "🔓 Abrir Caja", 
                        id="open-cash-btn", 
                        color="success",
                        className="mt-4 w-100"
                    )
                ], width=2)
            ])
        ]
    
    return status_content, actions_content

@app.callback(
    Output("register-movement-btn", "disabled"),
    [Input("movement-type", "value"),
     Input("movement-amount", "value"),
     Input("movement-description", "value")]
)
def enable_movement_button(movement_type, amount, description):
    """Habilita el botón de registro si todos los campos están llenos"""
    return not (movement_type and amount and description)

@app.callback(
    Output("movement-feedback", "children"),
    [Input("register-movement-btn", "n_clicks")],
    [State("movement-type", "value"),
     State("movement-amount", "value"),
     State("movement-description", "value")]
)
def register_movement(n_clicks, movement_type, amount, description):
    """Registra un movimiento de caja"""
    if not n_clicks:
        return ""
    
    if not all([movement_type, amount, description]):
        return dbc.Alert("❌ Todos los campos son requeridos", color="danger")
    
    try:
        success, message = cash_manager.add_cash_movement(
            amount, movement_type, description, "user_001"
        )
        
        if success:
            return dbc.Alert(f"✅ {message}", color="success", duration=3000)
        else:
            return dbc.Alert(f"❌ {message}", color="danger")
            
    except Exception as e:
        return dbc.Alert(f"❌ Error: {str(e)}", color="danger")

@app.callback(
    Output("cash-logs-content", "children"),
    [Input("refresh-logs-btn", "n_clicks"),
     Input("log-type-filter", "value"),
     Input("url", "pathname")]
)
def load_cash_logs(n_clicks, log_type, pathname):
    """Carga los logs de caja"""
    if log_type and log_type != "all":
        logs = cash_manager.get_logs(log_type=log_type)
    else:
        logs = cash_manager.get_logs()
    
    # Ordenar logs por fecha (más recientes primero)
    logs.sort(key=lambda x: x['timestamp'], reverse=True)
    
    if not logs:
        return html.P("No hay registros disponibles.")
    
    # Crear tabla de logs
    table_data = []
    for log in logs[-20:]:  # Últimos 20 logs
        timestamp = datetime.fromisoformat(log['timestamp']).strftime("%Y-%m-%d %H:%M:%S")
        
        if log['type'] == 'apertura':
            action = "🔓 APERTURA"
            details = f"Monto: ${log['amount']:,.2f}"
            user = log.get('user_id', 'N/A')
        elif log['type'] == 'cierre':
            action = "🔒 CIERRE"
            details = f"Esperado: ${log['expected_amount']:,.2f} | Real: ${log['actual_amount']:,.2f}"
            if log['discrepancy']:
                details += f" | Diferencia: ${log['discrepancy_amount']:,.2f}"
            user = log.get('user_id', 'N/A')
        else:  # movimiento
            action = "💸 MOVIMIENTO"
            details = f"{log.get('description', '')} - ${log['amount']:,.2f}"
            user = log.get('user_id', 'N/A')
        
        table_data.append({
            "Fecha": timestamp,
            "Acción": action,
            "Detalles": details,
            "Usuario": user
        })
    
    table = dash_table.DataTable(
        columns=[
            {"name": "Fecha", "id": "Fecha", "width": "20%"},
            {"name": "Acción", "id": "Acción", "width": "15%"},
            {"name": "Detalles", "id": "Detalles", "width": "50%"},
            {"name": "Usuario", "id": "Usuario", "width": "15%"}
        ],
        data=table_data,
        style_cell={'textAlign': 'left', 'padding': '8px'},
        style_header={'backgroundColor': 'rgb(230, 230, 230)', 'fontWeight': 'bold'},
        style_data_conditional=[
            {
                'if': {'row_index': 'odd'},
                'backgroundColor': 'rgb(248, 248, 248)'
            }
        ],
        page_size=10
    )
    
    return table

@app.callback(
    Output("cash-status-content", "children", allow_duplicate=True),
    [Input("open-cash-btn", "n_clicks"),
     Input("close-cash-btn", "n_clicks")],
    [State("opening-amount", "value"),
     State("opening-notes", "value"),
     State("closing-amount", "value"),
     State("closing-notes", "value")],
    prevent_initial_call=True
)
def handle_cash_actions(open_clicks, close_clicks, opening_amount, opening_notes, closing_amount, closing_notes):
    """Maneja la apertura y cierre de caja"""
    ctx = callback_context
    if not ctx.triggered:
        return dash.no_update
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    if trigger_id == "open-cash-btn" and open_clicks:
        if not opening_amount or opening_amount <= 0:
            return dbc.Alert("❌ El monto de apertura debe ser mayor a 0", color="danger")
        
        success, message = cash_manager.open_cash("user_001", opening_amount, opening_notes or "")
        if success:
            return dbc.Alert(f"✅ {message}", color="success")
        else:
            return dbc.Alert(f"❌ {message}", color="danger")
    
    elif trigger_id == "close-cash-btn" and close_clicks:
        if not closing_amount or closing_amount < 0:
            return dbc.Alert("❌ El monto de cierre no puede ser negativo", color="danger")
        
        success, result = cash_manager.close_cash("user_001", closing_amount, closing_notes or "")
        if success:
            alert_color = "warning" if result['discrepancy'] else "success"
            discrepancy_msg = f" ⚠️ Diferencia: ${result['discrepancy_amount']:,.2f}" if result['discrepancy'] else ""
            return dbc.Alert(f"✅ {result['message']}{discrepancy_msg}", color=alert_color)
        else:
            return dbc.Alert(f"❌ {result}", color="danger")
    
    return dash.no_update