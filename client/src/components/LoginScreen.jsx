import { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

export default function LoginScreen({ onLogin }) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key) return;
    setLoading(true);
    await onLogin(key);
    setLoading(false);
  };

  const handleAutoFill = (demoKey) => {
    setKey(demoKey);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        
        {/* Logo Section */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-md">
            <Terminal className="text-white w-7 h-7" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">Command Gateway</h2>
        <p className="text-center text-gray-500 mb-8">Enter your API Key to access the terminal.</p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">API Key</label>
            <input 
              type="password" 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent outline-none font-mono text-sm transition-all"
              placeholder="Paste key here..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoFocus
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !key}
            className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? "Authenticating..." : "Connect to Gateway"}
          </button>
        </form>
        
        {/* --- DEMO CREDENTIALS BOX --- */}
        <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">
                Demo Credentials (Tap to fill)
            </p>
            
            <div className="space-y-2">
                {/* Admin Button */}
                <button 
                    onClick={() => handleAutoFill('admin-secret-key-123')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition-all group text-left"
                >
                    <div>
                        <span className="block text-sm font-bold text-gray-700">Super Admin</span>
                        <span className="text-xs text-gray-500">Full Access (Rules & Logs)</span>
                    </div>
                    <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 font-mono text-gray-600 group-hover:text-blue-600">
                        admin...123
                    </code>
                </button>

                {/* Member Button */}
                <button 
                    onClick={() => handleAutoFill('member-key-456')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-lg transition-all group text-left"
                >
                    <div>
                        <span className="block text-sm font-bold text-gray-700">Junior Member</span>
                        <span className="text-xs text-gray-500">Restricted Access</span>
                    </div>
                    <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 font-mono text-gray-600 group-hover:text-purple-600">
                        member...456
                    </code>
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}