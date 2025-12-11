# 🛡️ Command Gateway

### A Secure, Rule-Based Command Execution Firewall

[](https://reactjs.org/)
[](https://flask.palletsprojects.com/)
[](https://www.sqlite.org/)
[](https://vercel.com/)

**[🔴 View Live Demo](https://www.google.com/search?q=https://%5BYOUR_VERCEL_LINK%5D.vercel.app)** 

-----

## 📖 Overview

**Command Gateway** is a full-stack security platform that acts as a gatekeeper for system commands. It allows Administrators to define regex-based security rules, ensuring that only safe commands are executed while dangerous ones (like `rm -rf`) are blocked automatically.

Modeled after Cloud Access Security Brokers (CASB), this system enforces **Role-Based Access Control (RBAC)**, maintains a strict **Audit Trail**, and handles **Credit-Based Quotas**.

-----

## ✨ Key Features

  * **🛡️ Regex Rule Engine:** Dynamic allow/block lists using Regular Expressions.
  * **🧠 Intelligent Conflict Detection:** Prevents Admins from creating "Shadowed Rules" (rules that would never execute because an older rule blocks them first).
  * **💰 Credit System:** Atomic transactions ensure credits are deducted *only* when a command successfully executes.
  * **👥 Role-Based Access (RBAC):**
      * **Super Admin:** Can manage rules, view global logs, and execute commands.
      * **Junior Member:** Can only execute commands (restricted view).
  * **📜 Immutable Audit Logs:** Every action—accepted or rejected—is logged for compliance.
  * **⚡ Real-Time Feedback:** Optimistic UI updates provide an instant "Terminal-like" experience.

-----

## 🛠️ Tech Stack

  * **Frontend:** React (Vite), Tailwind CSS v3, Lucide Icons
  * **Backend:** Python 3.10+, Flask, CORS
  * **Database:** SQLite (Transactional, Zero-config)
  * **Infrastructure:** PythonAnywhere (Backend), Vercel (Frontend)

-----

## 🚀 Quick Start (Run Locally)

Follow these steps to get the project running on your own machine in under 5 minutes.

### 1\. Clone the Repository

```bash
git clone https://github.com/bhuvaneshd32/command-gateway.git
cd command-gateway
```

### 2\. Backend Setup

The backend runs on Port `5001`.

```bash
cd server
# Create virtual environment (Optional but recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install flask flask-cors

# Start the server
python app.py
```

> *The server will automatically create `gateway.db` and seed default users on the first run.*

### 3\. Frontend Setup

Open a new terminal tab. The frontend runs on Port `5173`.

```bash
cd client
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

-----

## 🧪 Usage Guide

The login screen features **Auto-fill Buttons** for easy testing. Click the cards at the bottom of the login page to fill these credentials:

| Role | API Key | Permissions |
| :--- | :--- | :--- |
| **Super Admin** | `admin-secret-key-123` | ✅ Add/Edit Rules<br>✅ View Global Logs<br>✅ Execute Commands |
| **Junior Member** | `member-key-456` | ❌ No Rules Access<br>❌ No Logs Access<br>✅ Execute Commands (Limited Credits) |

### **Test Scenarios to Try**

1.  **The "Safety" Check:**

      * Login as **Admin**.
      * Run `ls -la`. (Result: **Executed** ✅)
      * Run `rm -rf /`. (Result: **Blocked** ❌ - Rule Enforcement)

2.  **The "Conflict" Check (Advanced):**

      * Go to **Rules & Security**.
      * Try to add a rule: `^git .*` with Action **Block**.
      * Use Test String: `git status`.
      * *Result:* If a rule for `git status` already exists, the system will warn you about a **Shadow Conflict**.

3.  **The "Global Eye" Check:**

      * Go to **Global Logs**.
      * You will see a history of every command run by the Junior Member, including their rejected attempts.

-----

## 🧠 Engineering Highlights

### **1. Atomic Transactions**

We use SQLite transactions (`conn.commit()` / `conn.rollback()`) to ensure the "Wallet" (Credits) and "Audit Log" are always in sync. If a log fails to write, the credit deduction is rolled back immediately to prevent data corruption.

### **2. Smart Conflict Detection**

The backend doesn't just check for duplicate strings. It analyzes the execution order of regex rules. If you try to add a rule that is mathematically impossible to reach (because an older rule captures the trigger first), the API rejects it with a 409 Conflict error.

### **3. Production-Ready Deployment**

  * **Backend:** Hosted on **PythonAnywhere** (Persistent Filesystem) to ensure user accounts and logs are not lost on restart.
  * **Frontend:** Hosted on **Vercel** with Environment Variable injection for secure API communication.

-----

## 📂 Project Structure

```text
command-gateway/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # RulesManager, LoginScreen, LogViewer
│   │   ├── api.js          # Smart API Layer (Cloud vs Local)
│   │   └── App.jsx         # Main Logic & Routing
│
├── server/                 # Python Backend
│   ├── app.py              # Flask API Routes & Logic
│   ├── database.py         # DB Connection & Seeding Logic
│   └── gateway.db          # SQLite Database (Auto-generated)
│
└── README.md               # Documentation
```

-----

Made with ❤️ for the **Unbound Hackathon** 🚀
