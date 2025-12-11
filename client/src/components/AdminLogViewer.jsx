import { useState, useEffect } from 'react';
import { FileText, RefreshCw, Filter } from 'lucide-react';
import { getAdminLogs } from '../api';
import StatusBadge from './StatusBadge';

export default function AdminLogViewer({ apiKey }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL"); // ALL, EXECUTED, REJECTED

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getAdminLogs(apiKey);
    setLogs(data);
    setLoading(false);
  };

  // Simple client-side filtering
  const filteredLogs = logs.filter(log => {
    if (filter === "ALL") return true;
    if (filter === "EXECUTED") return log.status === "EXECUTED";
    if (filter === "REJECTED") return log.status !== "EXECUTED"; // Catches REJECTED and REJECTED_NO_CREDITS
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
      
      {/* Header with Refresh & Filter */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-700">Global System Audit</h3>
            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{logs.length} events</span>
        </div>
        
        <div className="flex gap-2">
            <select 
                className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            >
                <option value="ALL">All Events</option>
                <option value="EXECUTED">Executed Only</option>
                <option value="REJECTED">Rejected Only</option>
            </select>
            <button 
                onClick={fetchLogs} 
                className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-200 rounded-md transition-colors"
                title="Refresh Logs"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100 sticky top-0">
                <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Command</th>
                    <th className="px-6 py-3 text-right">Outcome</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-3">
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-700">{log.username}</span>
                                <span className="text-[10px] text-gray-400 uppercase">{log.role}</span>
                            </div>
                        </td>
                        <td className="px-6 py-3 font-mono text-gray-600">
                            {log.command_text}
                        </td>
                        <td className="px-6 py-3 text-right">
                            <StatusBadge status={log.status} />
                        </td>
                    </tr>
                ))}
                {filteredLogs.length === 0 && !loading && (
                    <tr>
                        <td colSpan="4" className="text-center py-8 text-gray-400">No logs found</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}