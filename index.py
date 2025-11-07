import dash
from dash import html, dcc, Input, Output, State
import dash_bootstrap_components as dbc

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True
)

app.title = "BS Dash - Login"

app.layout = html.Div([
    dcc.Location(id='url', refresh=False),
    dcc.Store(id='login-status', data={'isLoggedIn': False}),
    
    html.Div(className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8", children=[
        html.Div(className="sm:mx-auto sm:w-full sm:max-w-md", children=[
            html.Div(className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10", children=[
                html.Div(className="text-center mb-8", children=[
                    html.Div(className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center", children=[
                        html.I(className="bi bi-grid-3x3-gap-fill text-white")
                    ]),
                    html.H2("BS Dash", className="mt-6 text-3xl font-extrabold text-gray-900"),
                    html.P("Inicia sesión en tu cuenta", className="mt-2 text-sm text-gray-600")
                ]),
                
                html.Div(className="space-y-6", children=[
                    html.Div(children=[
                        dbc.Label("Usuario", className="block text-sm font-medium text-gray-700"),
                        dbc.Input(
                            id="username",
                            type="text",
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                            placeholder="Ingresa tu usuario"
                        )
                    ]),
                    
                    html.Div(children=[
                        dbc.Label("Contraseña", className="block text-sm font-medium text-gray-700"),
                        dbc.Input(
                            id="password", 
                            type="password",
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                            placeholder="Ingresa tu contraseña"
                        )
                    ]),
                    
                    html.Div(children=[
                        dbc.Button(
                            "Iniciar Sesión",
                            id="login-btn",
                            color="primary",
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        )
                    ]),
                    
                    html.Div(id="login-feedback", className="text-center")
                ])
            ])
        ])
    ])
])

@app.callback(
    [Output('url', 'pathname'),
     Output('login-feedback', 'children')],
    [Input('login-btn', 'n_clicks')],
    [State('username', 'value'),
     State('password', 'value')]
)
def login(n_clicks, username, password):
    if n_clicks:
        if username == "admin" and password == "admin":  # Credenciales simples
            return "/dashboard", dbc.Alert("✅ Login exitoso", color="success")
        else:
            return dash.no_update, dbc.Alert("❌ Usuario o contraseña incorrectos", color="danger")
    return dash.no_update, ""

if __name__ == '__main__':
    print("🔐 Servidor de Login en: http://localhost:8051")
    app.run(debug=False, host='0.0.0.0', port=8051)