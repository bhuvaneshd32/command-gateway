import { useState, useEffect } from 'react';
import { Trash2, Plus, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { getRules, addRule, deleteRule } from '../api';

export default function RulesManager() {
  const [rules, setRules] = useState([]);
  const [pattern, setPattern] = useState("");
  const [action, setAction] = useState("AUTO_REJECT");
  const [testString, setTestString] = useState(""); // <--- New State
  const [error, setError] = useState(null);         // <--- Error State

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const data = await getRules();
    // Safety check: ensure data is actually an array before trying to map it
    if (Array.isArray(data)) {
        setRules(data);
    } else {
        setRules([]); // Fallback to empty array to prevent crash
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!pattern) return;
    setError(null);
    
    // Pass the testString to the API
    const result = await addRule(pattern, action, testString);
    
    if (result === true) {
      // Success! Clear form
      setPattern("");
      setTestString("");
      loadRules();
    } else {
        // Failure! Show the backend error message
        setError(result);
    }
  };

  const handleDelete = async (id) => {
    await deleteRule(id);
    loadRules();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-700 mb-4">Security Rules Configuration</h3>
      
      {/* ERROR MESSAGE BOX (Only shows if there is an error) */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-2 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
        </div>
      )}

      {/* ADD RULE FORM */}
      <form onSubmit={handleAdd} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col gap-4">
        <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Regex Pattern</label>
                <input 
                  type="text" 
                  placeholder="e.g. ^git status$" 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                />
            </div>
            <div className="w-48">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Action</label>
                <select 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                >
                    <option value="AUTO_REJECT">🔴 Block (Reject)</option>
                    <option value="AUTO_ACCEPT">🟢 Allow (Accept)</option>
                </select>
            </div>
        </div>

        {/* NEW: TEST STRING INPUT */}
        <div className="flex gap-4 items-end">
             <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Conflict Check (Test Example)
                </label>
                <input 
                  type="text" 
                  placeholder="Optional: Enter a command to check for conflicts (e.g. 'ls -la')" 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                />
            </div>
            <button type="submit" className="bg-black text-white px-6 py-2 rounded text-sm font-medium hover:bg-gray-800 flex items-center gap-2 h-[38px]">
                <Plus className="w-4 h-4" /> Add Rule
            </button>
        </div>
      </form>

      {/* RULES LIST */}
      <div className="space-y-3">
        {rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                    {rule.action === 'AUTO_ACCEPT' 
                        ? <CheckCircle className="w-5 h-5 text-green-500" /> 
                        : <ShieldAlert className="w-5 h-5 text-red-500" />
                    }
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">
                        {rule.pattern}
                    </code>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        rule.action === 'AUTO_ACCEPT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {rule.action}
                    </span>
                    <button onClick={() => handleDelete(rule.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        ))}
        {rules.length === 0 && <p className="text-center text-gray-400 text-sm">No rules configured.</p>}
      </div>
    </div>
  );
}