import { useState, useEffect, useRef } from 'react';
import { Send, Terminal, Shield, Activity, RefreshCw, FileText } from 'lucide-react';
import { sendCommand, getUserInfo } from './api';
import StatusBadge from './components/StatusBadge';
import RulesManager from './components/RulesManager'; 
import AdminLogViewer from './components/AdminLogViewer';
import LoginScreen from './components/LoginScreen';

function App() {
  // 1. STATE MANAGEMENT
  const [apiKey, setApiKey] = useState(localStorage.getItem("gateway_key") || null);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]); // Local session history
  const [user, setUser] = useState({ credits: 0, role: '...' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const logsEndRef = useRef(null);

  // 2. EFFECTS
  // Load user data when API Key changes or on load
  useEffect(() => {
    if (apiKey) {
        refreshUser();
    }
  }, [apiKey]);

  // Auto-scroll local logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const refreshUser = async () => {
    const data = await getUserInfo(apiKey); 
    if (data) setUser(data);
  };

  // 3. AUTHENTICATION HANDLERS
  const handleLogin = async (key) => {
    const userData = await getUserInfo(key);
    if (userData) {
        setApiKey(key);
        localStorage.setItem("gateway_key", key); // Persist login
        setUser(userData);
    } else {
        alert("Invalid API Key");
    }
  };

  const handleLogout = () => {
    setApiKey(null);
    localStorage.removeItem("gateway_key");
    setUser({ credits: 0, role: '...' });
    setHistory([]);
    setActiveTab("dashboard");
  };

  // 4. COMMAND SUBMISSION
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const command = input;
    setInput("");
    setLoading(true);

    // Optimistic UI update for the log
    const tempId = Date.now();
    setHistory(prev => [...prev, { id: tempId, type: 'command', text: command, timestamp: new Date() }]);

    // Send to Backend
    const result = await sendCommand(command, apiKey); 
    setLoading(false);

    // Update Log with Response
    setHistory(prev => [
      ...prev, 
      { 
        id: tempId + 1, 
        type: 'response', 
        status: result.status, 
        message: result.message,
        timestamp: new Date()
      }
    ]);

    // Update Credits if successful
    if (result.new_balance !== undefined) {
      setUser(prev => ({ ...prev, credits: result.new_balance }));
    }
  };

  // 5. RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  if (!apiKey) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // 6. MAIN DASHBOARD RENDER
  return (
    <div className="min-h-screen flex bg-gray-50 font-sans text-gray-900">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Terminal className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Gateway</span>
        </div>
        
        <nav className="p-4 space-y-1">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'dashboard' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Activity className="w-4 h-4" /> Dashboard
          </button>
          
          {/* Admin-Only Tabs */}
          {user.role === 'admin' && (
            <>
              <button 
                  onClick={() => setActiveTab("rules")}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'rules' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Shield className="w-4 h-4" /> Rules & Security
              </button>
              <button 
                  onClick={() => setActiveTab("logs")}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'logs' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <FileText className="w-4 h-4" /> Global Logs
              </button>
            </>
          )}
        </nav>
        
        <div className="mt-auto p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user.username || 'User'}</p>
              <p className="text-xs text-gray-500 uppercase">{user.role}</p>
            </div>
            <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 font-medium">Logout</button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-gray-800">
            {activeTab === 'dashboard' && 'Command Center'}
            {activeTab === 'rules' && 'Security Configuration'}
            {activeTab === 'logs' && 'System Audit Logs'}
          </h1>
          <div className="flex items-center gap-4">
             <div className="bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                <span className="text-xs text-gray-500 uppercase font-bold mr-2">Credits</span>
                <span className="text-sm font-mono font-bold">{user.credits}</span>
             </div>
          </div>
        </header>

        {/* Dynamic Content Grid */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* VIEW 1: DASHBOARD (Input + Local History) */}
            {activeTab === 'dashboard' && (
              <>
                {/* Command Input Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                   <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Execute Command</h2>
                   <form onSubmit={handleSubmit} className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <span className="text-gray-400 font-mono">$</span>
                     </div>
                     <input
                       type="text"
                       className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-black focus:border-transparent transition-all font-mono text-sm"
                       placeholder="Enter system command (e.g. ls -la)..."
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                     />
                     <button 
                       type="submit" 
                       disabled={loading}
                       className="absolute right-2 top-2 p-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                     >
                       {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                     </button>
                   </form>
                </div>

                {/* Local Session Audit Log */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-700">Session Log</h3>
                    <span className="text-xs text-gray-400">Real-time updates</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-0">
                    {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Activity className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm">No commands executed yet</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100 sticky top-0">
                          <tr>
                            <th className="px-6 py-3">Time</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Details</th>
                            <th className="px-6 py-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {history.map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-3 font-mono text-gray-400 text-xs">
                                 {entry.timestamp?.toLocaleTimeString()}
                              </td>
                              <td className="px-6 py-3 font-medium text-gray-700">
                                {entry.type === 'command' ? 'Input' : 'Output'}
                              </td>
                              <td className="px-6 py-3 font-mono text-gray-600">
                                 {entry.text || entry.message}
                              </td>
                              <td className="px-6 py-3 text-right">
                                 {entry.type === 'response' && <StatusBadge status={entry.status} />}
                              </td>
                            </tr>
                          ))}
                          <tr ref={logsEndRef} />
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* VIEW 2: RULES MANAGER (Admin Only) */}
            {activeTab === 'rules' && <RulesManager />}
            
            {/* VIEW 3: GLOBAL LOGS (Admin Only) */}
            {activeTab === 'logs' && <AdminLogViewer apiKey={apiKey} />}

          </div>
        </div>
      </main>
    </div>
  );
}

export default App;