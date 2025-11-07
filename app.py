from flask import Flask, render_template, jsonify, request, send_from_directory
import json
import os
from datetime import datetime

app = Flask(__name__, template_folder='.', static_folder='.')

class OrderManager:
    def __init__(self, data_file="data/orders.json"):
        self.data_file = data_file
        self.ensure_data_file()
    
    def ensure_data_file(self):
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
        if not os.path.exists(self.data_file):
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump({"orders": [], "next_id": 1}, f, indent=2)
    
    def create_order(self, order_data):
        with open(self.data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        order_id = data["next_id"]
        order = {
            "id": order_id,
            "order_number": f"ORD-{order_id:06d}",
            "customer": order_data.get("customer", {"name": "", "email": "", "phone": ""}),
            "items": order_data.get("items", []),
            "status": "pending",
            "total": order_data.get("total", 0),
            "payment_method": order_data.get("payment_method", "cash"),
            "notes": order_data.get("notes", ""),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        data["orders"].append(order)
        data["next_id"] += 1
        
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        return order
    
    def get_orders(self, status_filter=None):
        with open(self.data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        orders = data["orders"]
        if status_filter:
            orders = [order for order in orders if order["status"] == status_filter]
        
        return sorted(orders, key=lambda x: x["created_at"], reverse=True)

order_manager = OrderManager()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard.html')
def dashboard():
    return render_template('dashboard.html')

@app.route('/modules/<path:filename>')
def modules(filename):
    return send_from_directory('modules', filename)

@app.route('/api/orders', methods=['GET'])
def get_orders():
    status_filter = request.args.get('status')
    orders = order_manager.get_orders(status_filter)
    return jsonify(orders)

@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        order_data = request.get_json()
        new_order = order_manager.create_order(order_data)
        return jsonify({"success": True, "order": new_order})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)