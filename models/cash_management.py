import json
import os
from datetime import datetime

# Import corregido
from .sequences import SequenceManager

class CashManager:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.cash_file = os.path.join(data_dir, "cash_status.json")
        self.logs_file = os.path.join(data_dir, "cash_logs.json")
        self.sequence_manager = SequenceManager(data_dir)
        self._ensure_data_dir()
        self._load_data()
        print("✅ Gestor de Caja Inicializado")
    
    def _ensure_data_dir(self):
        """Asegura que exista el directorio data/"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def _load_data(self):
        """Carga el estado de caja y logs desde archivos JSON"""
        # Cargar estado de caja
        if os.path.exists(self.cash_file):
            with open(self.cash_file, 'r', encoding='utf-8') as f:
                self.cash_status = json.load(f)
        else:
            self.cash_status = {
                "is_open": False,
                "current_cash": 0.0,
                "opening_date": None,
                "opening_user": None,
                "opening_amount": 0.0,
                "last_closing": None
            }
        
        # Cargar logs
        if os.path.exists(self.logs_file):
            with open(self.logs_file, 'r', encoding='utf-8') as f:
                self.logs = json.load(f)
        else:
            self.logs = []
    
    def _save_cash_status(self):
        """Guarda el estado de caja en archivo JSON"""
        with open(self.cash_file, 'w', encoding='utf-8') as f:
            json.dump(self.cash_status, f, indent=4, ensure_ascii=False)
    
    def _save_logs(self):
        """Guarda los logs en archivo JSON"""
        with open(self.logs_file, 'w', encoding='utf-8') as f:
            json.dump(self.logs, f, indent=4, ensure_ascii=False)
    
    def open_cash(self, user_id, opening_amount, notes=""):
        """Abre la caja con un monto inicial"""
        if self.cash_status["is_open"]:
            return False, "❌ La caja ya está abierta"
        
        try:
            opening_amount = float(opening_amount)
            if opening_amount < 0:
                return False, "❌ El monto de apertura no puede ser negativo"
        except ValueError:
            return False, "❌ Monto de apertura no válido"
        
        # Actualizar estado de caja
        self.cash_status = {
            "is_open": True,
            "current_cash": opening_amount,
            "opening_date": datetime.now().isoformat(),
            "opening_user": user_id,
            "opening_amount": opening_amount,
            "last_closing": self.cash_status.get("last_closing")
        }
        
        # Crear log de apertura
        log_entry = {
            "id": self.sequence_manager.get_next_sequence("cash_closing"),
            "type": "apertura",
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
            "amount": opening_amount,
            "expected_amount": opening_amount,
            "actual_amount": opening_amount,
            "discrepancy": False,
            "discrepancy_amount": 0.0,
            "notes": notes
        }
        
        self.logs.append(log_entry)
        self._save_cash_status()
        self._save_logs()
        
        print(f"💰 Caja abierta por usuario {user_id} con ${opening_amount:,.2f}")
        return True, "✅ Caja abierta exitosamente"
    
    def close_cash(self, user_id, closing_amount, notes=""):
        """Cierra la caja con un monto final"""
        if not self.cash_status["is_open"]:
            return False, "❌ La caja no está abierta"
        
        try:
            closing_amount = float(closing_amount)
            if closing_amount < 0:
                return False, "❌ El monto de cierre no puede ser negativo"
        except ValueError:
            return False, "❌ Monto de cierre no válido"
        
        expected_amount = self.cash_status["current_cash"]
        actual_amount = closing_amount
        discrepancy = abs(expected_amount - actual_amount) > 0.01
        discrepancy_amount = actual_amount - expected_amount
        
        # Crear log de cierre
        log_entry = {
            "id": self.sequence_manager.get_next_sequence("cash_closing"),
            "type": "cierre",
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
            "expected_amount": expected_amount,
            "actual_amount": actual_amount,
            "discrepancy": discrepancy,
            "discrepancy_amount": discrepancy_amount,
            "notes": notes
        }
        
        self.logs.append(log_entry)
        
        # Actualizar estado de caja
        self.cash_status["is_open"] = False
        self.cash_status["current_cash"] = 0.0
        self.cash_status["last_closing"] = datetime.now().isoformat()
        
        self._save_cash_status()
        self._save_logs()
        
        print(f"💰 Caja cerrada por usuario {user_id}")
        print(f"   Esperado: ${expected_amount:,.2f}")
        print(f"   Real: ${actual_amount:,.2f}")
        print(f"   Diferencia: ${discrepancy_amount:,.2f}")
        
        return True, {
            "message": "✅ Caja cerrada exitosamente",
            "discrepancy": discrepancy,
            "discrepancy_amount": discrepancy_amount,
            "expected_amount": expected_amount,
            "actual_amount": actual_amount
        }
    
    def add_cash_movement(self, amount, movement_type, description="", user_id="system"):
        """Agrega un movimiento de caja (ingreso/egreso)"""
        if not self.cash_status["is_open"]:
            return False, "❌ La caja no está abierta"
        
        try:
            amount = float(amount)
            if amount <= 0:
                return False, "❌ El monto debe ser mayor a cero"
        except ValueError:
            return False, "❌ Monto no válido"
        
        if movement_type == "ingreso":
            self.cash_status["current_cash"] += amount
            movement_desc = f"Ingreso: {description}"
        elif movement_type == "egreso":
            if amount > self.cash_status["current_cash"]:
                return False, "❌ Fondos insuficientes en caja"
            self.cash_status["current_cash"] -= amount
            movement_desc = f"Egreso: {description}"
        else:
            return False, "❌ Tipo de movimiento no válido"
        
        # Registrar movimiento en logs
        movement_log = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "type": "movimiento",
            "movement_type": movement_type,
            "amount": amount,
            "description": movement_desc,
            "new_balance": self.cash_status["current_cash"]
        }
        
        self.logs.append(movement_log)
        self._save_cash_status()
        self._save_logs()
        
        print(f"💰 Movimiento de caja: {movement_type} ${amount:,.2f}")
        print(f"   Nuevo saldo: ${self.cash_status['current_cash']:,.2f}")
        
        return True, f"✅ Movimiento registrado: {movement_desc}"
    
    def get_cash_status(self):
        """Obtiene el estado actual de la caja"""
        return self.cash_status
    
    def get_cash_balance(self):
        """Obtiene el balance actual de la caja"""
        return self.cash_status["current_cash"]
    
    def is_cash_open(self):
        """Verifica si la caja está abierta"""
        return self.cash_status["is_open"]
    
    def get_logs(self, log_type=None, start_date=None, end_date=None):
        """Obtiene logs filtrados por tipo y fecha"""
        filtered_logs = self.logs
        
        if log_type:
            filtered_logs = [log for log in filtered_logs if log.get("type") == log_type]
        
        if start_date:
            filtered_logs = [log for log in filtered_logs if log["timestamp"] >= start_date]
        
        if end_date:
            filtered_logs = [log for log in filtered_logs if log["timestamp"] <= end_date]
        
        return filtered_logs
    
    def get_today_movements(self):
        """Obtiene los movimientos del día actual"""
        today = datetime.now().date().isoformat()
        today_logs = []
        
        for log in self.logs:
            log_date = datetime.fromisoformat(log["timestamp"]).date().isoformat()
            if log_date == today and log.get("type") == "movimiento":
                today_logs.append(log)
        
        return today_logs

# Solo ejecutar pruebas si se llama directamente
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 PRUEBA DEL SISTEMA DE GESTIÓN DE CAJA")
    print("="*60)
    
    # Inicializar el sistema
    cm = CashManager()
    
    # Mostrar estado inicial
    status = cm.get_cash_status()
    print(f"\n📊 ESTADO INICIAL DE CAJA:")
    print(f"   Abierta: {'Sí' if status['is_open'] else 'No'}")
    print(f"   Saldo: ${status['current_cash']:,.2f}")
    
    # Abrir caja
    print(f"\n💰 ABRIENDO CAJA...")
    success, message = cm.open_cash("user_001", 1000.50, "Apertura de caja inicial")
    print(f"   Resultado: {message}")
    
    # Agregar movimientos
    print(f"\n💸 SIMULANDO MOVIMIENTOS...")
    cm.add_cash_movement(500, "ingreso", "Venta #001", "user_001")
    cm.add_cash_movement(150.75, "ingreso", "Venta #002", "user_001")
    cm.add_cash_movement(200, "egreso", "Compra suministros", "user_001")
    
    # Mostrar estado actual
    status = cm.get_cash_status()
    print(f"\n📊 ESTADO ACTUAL DE CAJA:")
    print(f"   Abierta: {'Sí' if status['is_open'] else 'No'}")
    print(f"   Saldo: ${status['current_cash']:,.2f}")
    
    # Cerrar caja
    print(f"\n🔒 CERRANDO CAJA...")
    current_balance = cm.get_cash_balance()
    success, result = cm.close_cash("user_001", current_balance, "Cierre normal")
    
    if success:
        print(f"   Resultado: {result['message']}")
        if result['discrepancy']:
            print(f"   ⚠️  Hay discrepancia: ${result['discrepancy_amount']:,.2f}")
        else:
            print(f"   ✅ Sin discrepancias")
    
    # Mostrar logs
    print(f"\n📋 LOGS RECIENTES:")
    recent_logs = cm.get_logs()[-5:]  # Últimos 5 logs
    for log in recent_logs:
        time = datetime.fromisoformat(log['timestamp']).strftime("%H:%M:%S")
        if log['type'] == 'apertura':
            print(f"   {time} - APERTURA - ${log['amount']:,.2f}")
        elif log['type'] == 'cierre':
            print(f"   {time} - CIERRE - Esperado: ${log['expected_amount']:,.2f}, Real: ${log['actual_amount']:,.2f}")
        elif log['type'] == 'movimiento':
            print(f"   {time} - MOVIMIENTO - {log['description']} - ${log['amount']:,.2f}")
    
    print(f"\n✅ PRUEBA COMPLETADA EXITOSAMENTE")
    print("="*60)