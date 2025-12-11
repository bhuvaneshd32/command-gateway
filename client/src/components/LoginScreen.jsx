import { useState } from 'react';
import { Terminal } from 'lucide-react';

export default function LoginScreen({ onLogin }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key) return;
    
    setLoading(true);
    // We try to fetch user info to validate the key
    // We need to import getUserInfo, but since this is a child component,
    // we will pass the validation logic or handle it here. 
    // For simplicity, we assume the parent handles the actual API check 
    // or we just pass the key up.
    
    // Let's pass it up to App.jsx to validate
    onLogin(key);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-md">
            <Terminal className="text-white w-7 h-7" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">Command Gateway</h2>
        <p className="text-center text-gray-500 mb-8">Enter your API Key to access the terminal.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">API Key</label>
            <input 
              type="password" 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent outline-none font-mono text-sm"
              placeholder="sk-..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoFocus
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !key}
            className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Connect"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
                Default Admin Key: <code className="bg-gray-100 px-1 py-0.5 rounded">admin-secret-key-123</code>
            </p>
        </div>
      </div>
    </div>
  );
}