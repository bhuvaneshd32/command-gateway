import re
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import init_db, get_db_connection

app = Flask(__name__)
CORS(app)

# Initialize DB on start
init_db()

@app.route('/', methods=['GET'])
def home():
    return "Command Gateway Backend (Python) is Running!"

# --- CORE ENDPOINT: EXECUTE COMMAND ---
@app.route('/commands', methods=['POST'])
def process_command():
    # --- SETUP: Get Input & User ---
    data = request.json
    command_text = data.get('command_text')
    api_key = request.headers.get('API-Key')

    if not command_text or not api_key:
        return jsonify({'error': 'Missing command_text or API-Key'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Authenticate User
        cursor.execute("SELECT * FROM users WHERE api_key = ?", (api_key,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'Invalid API Key'}), 401
        
        user_id = user['id']
        current_credits = user['credits']

        # ---------------------------------------------------------
        # STEP 1: Check if user has credits > 0
        # ---------------------------------------------------------
        if current_credits <= 0:
            # Reject immediately if no money in the bank
            # We log this attempt even if rejected for credits
            cursor.execute(
                "INSERT INTO audit_logs (user_id, command_text, status) VALUES (?, ?, ?)",
                (user_id, command_text, "REJECTED_NO_CREDITS")
            )
            conn.commit()
            return jsonify({
                'status': 'REJECTED', 
                'message': 'Insufficient credits',
                'new_balance': current_credits
            }), 403


        # ---------------------------------------------------------
        # STEP 2: Match against rules (First match wins)
        # ---------------------------------------------------------
        cursor.execute("SELECT * FROM rules ORDER BY id ASC") # Order ensures "first" rule checks first
        rules = cursor.fetchall()

        outcome = "REJECTED" # Default safety: Block if no rules match
        message = "Command blocked (No matching rule found)"
        matched_rule = None

        for rule in rules:
            pattern = rule['pattern']
            action = rule['action']
            
            # We use regex search to see if the command matches the pattern
            if re.search(pattern, command_text):
                # FIRST MATCH WINS: We found a match, so we decide now.
                if action == 'AUTO_ACCEPT':
                    outcome = "EXECUTED"
                    message = "Command executed successfully"
                else:
                    outcome = "REJECTED"
                    message = "Command blocked by security rule"
                
                matched_rule = rule['pattern']
                break # <--- CRITICAL: Stop the loop. First match wins.


        # ---------------------------------------------------------
        # STEP 3 & 4: Execute or Reject based on action
        # ---------------------------------------------------------
        new_balance = current_credits

        if outcome == "EXECUTED":
            # --- MOCK EXECUTION ---
            print(f"⚡️ SERVER EXECUTION: {command_text}")
            
            # DEDUCT CREDITS (Only on success)
            new_balance = current_credits - 1
            cursor.execute("UPDATE users SET credits = ? WHERE id = ?", (new_balance, user_id))


        # ---------------------------------------------------------
        # STEP 5: Audit Log & Return Status
        # ---------------------------------------------------------
        cursor.execute(
            "INSERT INTO audit_logs (user_id, command_text, status) VALUES (?, ?, ?)",
            (user_id, command_text, outcome)
        )

        conn.commit() # Save everything (Credits + Log)

        return jsonify({
            'status': outcome,
            'new_balance': new_balance,
            'message': message,
            'matched_rule': matched_rule
        })

    except Exception as e:
        conn.rollback() # If anything crashes, undo credit deduction
        print(f"Error: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500
    finally:
        conn.close()

# --- HELPER: GET USER INFO (For Frontend) ---
@app.route('/me', methods=['GET'])
def get_my_info():
    api_key = request.headers.get('API-Key')
    conn = get_db_connection()
    user = conn.execute("SELECT username, role, credits FROM users WHERE api_key = ?", (api_key,)).fetchone()
    conn.close()
    
    if user:
        return jsonify(dict(user))
    return jsonify({'error': 'Invalid API Key'}), 401

# --- RULES MANAGEMENT ENDPOINTS ---

@app.route('/rules', methods=['GET'])
def get_rules():
    conn = get_db_connection()
    rules = conn.execute("SELECT * FROM rules ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rules])

@app.route('/rules', methods=['POST'])
def add_rule():
    data = request.json
    pattern = data.get('pattern')
    action = data.get('action')
    test_string = data.get('test_string') # Optional: Used for conflict detection

    # 1. Basic Input Validation
    if not pattern or action not in ['AUTO_ACCEPT', 'AUTO_REJECT']:
        return jsonify({'error': 'Invalid data: Missing pattern or invalid action'}), 400

    # 2. Regex Syntax Validation (Security)
    try:
        re.compile(pattern)
    except re.error as e:
        return jsonify({'error': f"Invalid Regex Syntax: {str(e)}"}), 400

    conn = get_db_connection()
    try:
        # 3. DUPLICATE CHECK
        # We check if this exact pattern already exists to prevent clones.
        existing = conn.execute("SELECT id, action FROM rules WHERE pattern = ?", (pattern,)).fetchone()
        if existing:
            return jsonify({
                'error': f"Conflict: This rule already exists (ID: {existing['id']} is set to {existing['action']})"
            }), 409 # 409 Conflict

        # 4. SHADOW/CONFLICT DETECTION (The "Smart Check")
        # If the user provided a test string, we check if an EXISTING rule would catch it first.
        if test_string:
            # A. Sanity Check: Does the test string actually match the NEW rule?
            if not re.search(pattern, test_string):
                 return jsonify({'error': f"Logic Error: Your test string '{test_string}' doesn't even match your new pattern!"}), 400

            # B. Shadow Check: Does an OLD rule catch this string first?
            # We fetch all rules ordered by ID because that's the execution order.
            cursor = conn.execute("SELECT * FROM rules ORDER BY id ASC")
            existing_rules = cursor.fetchall()

            for rule in existing_rules:
                if re.search(rule['pattern'], test_string):
                    # CONFLICT FOUND!
                    return jsonify({
                        'error': f"Shadow Conflict: This rule is useless! Your test command '{test_string}' is already captured by Rule #{rule['id']} ('{rule['pattern']}') which is set to {rule['action']}."
                    }), 409

        # 5. Insert the new rule if all checks pass
        conn.execute("INSERT INTO rules (pattern, action) VALUES (?, ?)", (pattern, action))
        conn.commit()
        return jsonify({'message': 'Rule added successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/rules/<int:rule_id>', methods=['DELETE'])
def delete_rule(rule_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM rules WHERE id = ?", (rule_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Rule deleted'})

# --- ADMIN: GET GLOBAL AUDIT LOGS ---
@app.route('/admin/logs', methods=['GET'])
def get_admin_logs():
    api_key = request.headers.get('API-Key')
    conn = get_db_connection()
    
    # 1. Security Check: Is this user an Admin?
    user = conn.execute("SELECT role FROM users WHERE api_key = ?", (api_key,)).fetchone()
    if not user or user['role'] != 'admin':
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403

    # 2. Fetch Logs with Usernames
    query = '''
        SELECT 
            audit_logs.id, 
            audit_logs.timestamp, 
            audit_logs.command_text, 
            audit_logs.status, 
            users.username, 
            users.role 
        FROM audit_logs 
        JOIN users ON audit_logs.user_id = users.id 
        ORDER BY audit_logs.timestamp DESC
    '''
    logs = conn.execute(query).fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in logs])

if __name__ == '__main__':
    print("Server running on http://localhost:5000")
    app.run(port=5001, debug=True)