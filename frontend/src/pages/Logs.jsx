import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { 
  FileText, Search, Filter, ArrowUpRight, 
  Smartphone, Clock, Calendar, MessageSquare,
  ChevronDown, ExternalLink, Trash2, CheckCircle2
} from 'lucide-react';

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [leadHistory, setLeadHistory] = useState({});
    const [loadingHistory, setLoadingHistory] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [logsRes, campRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/logs`),
                    axios.get(`${API_BASE_URL}/api/campaigns`)
                ]);
                setLogs(logsRes.data);
                setCampaigns(campRes.data);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleRow = async (logId, leadId) => {
        if (expandedRow === logId) {
            setExpandedRow(null);
            return;
        }

        setExpandedRow(logId);
        
        if (leadId && !leadHistory[leadId]) {
            try {
                setLoadingHistory(logId);
                const response = await axios.get(`${API_BASE_URL}/api/leads/${leadId}/call-logs`);
                setLeadHistory(prev => ({
                    ...prev,
                    [leadId]: {
                        calls: response.data.callLogs || [],
                        pending: response.data.pendingCallbacks || []
                    }
                }));
            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setLoadingHistory(null);
            }
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = (log.numberId?.number?.includes(searchTerm) || log.numberId?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCampaign = selectedCampaign === 'all' || log.numberId?.campaignId === selectedCampaign;
        return matchesSearch && matchesCampaign;
    });

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Audit Trail</h2>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Interaction Repository</h1>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search Logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:border-blue-600 outline-none transition-all w-64 shadow-sm"
                        />
                    </div>
                    <select 
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        className="px-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-blue-600 transition-all cursor-pointer shadow-sm"
                    >
                        <option value="all">All Payloads</option>
                        {campaigns.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Logs Grid */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 italic text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                <th className="px-8 py-5">Target Identity</th>
                                <th className="px-8 py-5 text-center">Outcome</th>
                                <th className="px-8 py-5 text-center">Duration</th>
                                <th className="px-8 py-5 text-center">Timestamp</th>
                                <th className="px-8 py-5 text-right">History</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLogs.map(log => (
                                <React.Fragment key={log._id}>
                                    <tr className={`group transition-all ${expandedRow === log._id ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expandedRow === log._id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                                    <Smartphone size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 leading-none mb-1 uppercase tracking-tight">{log.numberId?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 tabular-nums tracking-widest">{log.numberId?.number || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                log.outcome === 'DEMO_BOOKED' ? 'bg-blue-100 text-blue-600' :
                                                log.outcome === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                                                'bg-rose-50 text-rose-600'
                                            }`}>
                                                {log.outcome}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Clock size={12} className="text-slate-300" />
                                                <span className="text-[10px] font-black text-slate-900 tabular-nums tracking-widest">{Math.round(Number(log.duration) || 0)}s</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter italic">
                                                    {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'N/A'}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-300 tabular-nums uppercase tracking-widest">
                                                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => toggleRow(log._id, log.numberId?._id)}
                                                className={`p-3 rounded-xl transition-all shadow-sm ${expandedRow === log._id ? 'bg-blue-600 text-white shadow-blue-200 rotate-90' : 'bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                            >
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                    
                                    {/* Expanded History View */}
                                    {expandedRow === log._id && (
                                        <tr className="bg-slate-50/50 border-l-4 border-blue-600">
                                            <td colSpan="5" className="px-8 py-8">
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                                                            Full Interaction Timeline
                                                        </h4>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase italic">
                                                            ID: {log.numberId?._id || 'N/A'}
                                                        </span>
                                                    </div>

                                                    {loadingHistory === log._id ? (
                                                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                                                            <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrieving Neural Logs...</p>
                                                        </div>
                                                    ) : (leadHistory[log.numberId?._id]?.calls?.length > 0 || leadHistory[log.numberId?._id]?.pending?.length > 0) ? (
                                                        <div className="space-y-4">
                                                            {/* Render Pending Callbacks First */}
                                                            {leadHistory[log.numberId?._id]?.pending?.map((p, pidx) => (
                                                                <div key={`pending-${pidx}`} className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 shadow-sm border-dashed">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 animate-pulse">
                                                                                Planned Sequence
                                                                            </div>
                                                                            <span className="text-[10px] font-black text-amber-900 italic">
                                                                                Upcoming: {p.userTime || new Date(p.scheduledTime).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-amber-400 text-[9px] font-bold">
                                                                            <Clock size={10} className="animate-spin-slow" />
                                                                            Queued
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-[11px] font-medium text-amber-700 italic">
                                                                        "System will automatically re-engage the target at the specified interval."
                                                                    </p>
                                                                    {p.notes && <p className="text-[9px] text-amber-400 mt-2 font-bold uppercase tracking-widest">Context: {p.notes}</p>}
                                                                </div>
                                                            ))}

                                                            {/* Past Calls */}
                                                            {leadHistory[log.numberId?._id]?.calls?.map((historyLog, idx) => (
                                                                <div key={historyLog.callId || idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm group/item hover:border-blue-200 transition-all">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${historyLog.callType === 'CAMPAIGN' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                                                {historyLog.callType || 'CAMPAIGN'} CALL #{idx + 1}
                                                                            </div>
                                                                            <span className="text-[10px] font-black text-slate-900 italic">
                                                                                {new Date(historyLog.timestamp).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-slate-400 text-[9px] font-bold">
                                                                            <Clock size={10} />
                                                                            {Math.round(Number(historyLog.duration) || 0)}s
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-50 group-hover/item:border-blue-100 transition-all">
                                                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                            <MessageSquare size={10} />
                                                                            Transcript Data
                                                                        </p>
                                                                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                                                            {historyLog.messages?.map((msg, midx) => (
                                                                                <div key={midx} className="flex gap-2">
                                                                                    <span className={`text-[9px] font-black uppercase min-w-[60px] ${msg.speaker === 'AI' ? 'text-blue-600' : 'text-slate-400'}`}>
                                                                                        {msg.speaker}:
                                                                                    </span>
                                                                                    <span className="text-xs text-slate-700 font-medium leading-relaxed italic">
                                                                                        "{msg.content}"
                                                                                    </span>
                                                                                </div>
                                                                            )) || (
                                                                                <p className="text-xs text-slate-400 italic whitespace-pre-wrap leading-relaxed">
                                                                                    {historyLog.transcript}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {historyLog.outcome === 'DEMO_BOOKED' && (
                                                                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100 italic">
                                                                            <CheckCircle2 size={12} />
                                                                            Milestone: Demo Scheduled Successfully
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-10 opacity-30 italic text-xs font-black uppercase tracking-widest text-slate-400">
                                                            No Sequential Events Indexed
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {filteredLogs.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <div className="p-8 bg-slate-50 rounded-full italic"><MessageSquare size={32} className="text-slate-200" /></div>
                                            <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em]">No Logs Indexed</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Logs;
