import sqlite3
import os

# Ensure the database path is absolute to avoid path issues on Render
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'gateway.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("Checking database...")

        # 1. Create Tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                api_key TEXT UNIQUE,
                role TEXT CHECK(role IN ('admin', 'member')),
                credits INTEGER DEFAULT 100
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern TEXT NOT NULL,
                action TEXT CHECK(action IN ('AUTO_ACCEPT', 'AUTO_REJECT'))
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                command_text TEXT,
                status TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')

        # 2. Force Admin Reset Logic
        admin_key = "admin-secret-key-123"
        
        # Check if Admin exists
        cursor.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
        admin_user = cursor.fetchone()

        if admin_user:
            # Admin exists -> Reset key to ensure you can login
            print(f"🔄 Admin found. Resetting API Key to: {admin_key}")
            cursor.execute("UPDATE users SET api_key = ?, credits = 9999 WHERE id = ?", (admin_key, admin_user['id']))
        else:
            # Admin missing -> Create new one
            print(f"✅ Creating Default Admin with Key: {admin_key}")
            cursor.execute(
                'INSERT INTO users (username, api_key, role, credits) VALUES (?, ?, ?, ?)', 
                ('SuperAdmin', admin_key, 'admin', 9999)
            )
            # Seed default rules
            cursor.execute("INSERT INTO rules (pattern, action) VALUES (?, ?)", ('^ls -la$', 'AUTO_ACCEPT'))
            cursor.execute("INSERT INTO rules (pattern, action) VALUES (?, ?)", ('rm -rf', 'AUTO_REJECT'))

        conn.commit()
        
    except Exception as e:
        print(f"❌ Database Initialization Error: {e}")
    finally:
        # Always close the connection at the very end
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    init_db()