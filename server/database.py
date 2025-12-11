import sqlite3

def get_db_connection():
    conn = sqlite3.connect('gateway.db')
    conn.row_factory = sqlite3.Row # Allows accessing columns by name
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("Checking database...")

    # 1. Create Tables (Same as before)
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

    # --- THE FIX: FORCE ADMIN RESET ---
    admin_key = "admin-secret-key-123"
    
    # Check if Admin exists
    cursor.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    admin_user = cursor.fetchone()

    if admin_user:
        # Admin exists -> UPDATE their key to be sure it matches
        print(f"🔄 Admin found. Resetting API Key to: {admin_key}")
        cursor.execute("UPDATE users SET api_key = ?, credits = 9999 WHERE id = ?", (admin_key, admin_user[0]))
    else:
        # Admin missing -> CREATE them
        print(f"✅ Creating Default Admin with Key: {admin_key}")
        cursor.execute(
            'INSERT INTO users (username, api_key, role, credits) VALUES (?, ?, ?, ?)', 
            ('SuperAdmin', admin_key, 'admin', 9999)
        )
        # Seed default rules only if new
        cursor.execute("INSERT INTO rules (pattern, action) VALUES (?, ?)", ('^ls -la$', 'AUTO_ACCEPT'))
        cursor.execute("INSERT INTO rules (pattern, action) VALUES (?, ?)", ('rm -rf', 'AUTO_REJECT'))

    conn.commit()
    conn.close()

    # 4. Seed Default Admin (Only if table is empty)
    cursor.execute('SELECT count(*) FROM users')
    count = cursor.fetchone()[0]
    
    if count == 0:
        admin_key = "admin-secret-key-123"
        cursor.execute(
            'INSERT INTO users (username, api_key, role, credits) VALUES (?, ?, ?, ?)', 
            ('SuperAdmin', admin_key, 'admin', 9999)
        )
        
        # Seed default rules
        cursor.execute("INSERT INTO rules (pattern, action) VALUES (?, ?)", ('^ls -la$', 'AUTO_ACCEPT'))
        cursor.execute("INSERT INTO rules (pattern, action) VALUES (?, ?)", ('rm -rf', 'AUTO_REJECT'))
        
        print(f"✅ Default Admin created! API Key: {admin_key}")
    else:
        print("Database already initialized.")

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()