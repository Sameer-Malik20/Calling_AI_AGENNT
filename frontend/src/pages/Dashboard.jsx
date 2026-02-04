import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    PhoneCall, Users, CheckCircle, XCircle, Clock, TrendingUp, Play, 
    BarChart3, Target, Activity, ArrowUpRight, ShieldCheck, Zap, 
    Globe, History, MessageSquareText, Sparkles, Cpu, Smartphone, 
    Search, Filter, ChevronRight, Bell, MoreHorizontal
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const Dashboard = ({ viewMode }) => {
    const [stats, setStats] = useState({ total: 0, completed: 0, failed: 0, pending: 0 });
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState('latest');
    const [latestCampaign, setLatestCampaign] = useState(null);
    const [liveCalls, setLiveCalls] = useState([]);
    const [historyLogs, setHistoryLogs] = useState([]);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [testNumber, setTestNumber] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/campaigns`);
                setCampaigns(res.data);
            } catch (err) {}
        };
        fetchCampaigns();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/campaigns/${selectedCampaignId}/stats`);
                setStats(res.data);
                if (res.data.name) setLatestCampaign(res.data.name);
                
                // Fetch real logs with populated lead info
                const logsRes = await axios.get(`${API_BASE_URL}/api/logs${selectedCampaignId !== 'latest' ? `?campaignId=${selectedCampaignId}` : ''}`);
                const formattedLogs = logsRes.data.map(log => ({
                    id: log._id,
                    number: log.numberId?.number || 'Unknown',
                    name: log.numberId?.name || 'Unknown',
                    status: log.outcome === 'COMPLETED' ? 'Success' : 'Failed',
                    duration: Math.round(log.duration) + 's',
                    sentiment: 'Neutral',
                    date: new Date(log.createdAt).toLocaleString(),
                    outcome: log.outcome,
                    agent: 'Sam 3.1'
                }));
                setHistoryLogs(formattedLogs);
            } catch (err) {}
        };
        
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [viewMode, selectedCampaignId]);

    const handleStartCampaign = async () => {
        setIsStarting(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/campaigns/${selectedCampaignId}/start`);
            alert(res.data.message || "Campaign started successfully!");
        } catch (err) {
            alert("Error: " + (err.response?.data?.error || err.message));
        } finally {
            setIsStarting(false);
        }
    };

    const handleTestCall = async () => {
        if (!testNumber.trim()) return alert('Please enter a valid phone number');
        setIsConnecting(true);
        try {
            await axios.post(`${API_BASE_URL}/api/test-call`, { number: testNumber });
            setIsTestModalOpen(false);
            setTestNumber('');
        } catch (err) {
            alert("Error: " + (err.response?.data?.error || err.message));
        } finally {
            setIsConnecting(false);
        }
    };

    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-50">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
                            {viewMode === 'realtime' ? 'System Live' : 'Operation History'}
                        </h2>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        {viewMode === 'realtime' ? 'Control Insight' : 'Data Repository'}
                    </h1>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <select 
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                        className="bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:border-blue-600 transition-all cursor-pointer"
                    >
                        <option value="latest">Latest Payload</option>
                        {campaigns.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>

                    <button 
                        onClick={handleStartCampaign}
                        disabled={isStarting}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
                    >
                        <Play size={14} fill="currentColor" /> {isStarting ? 'Starting...' : 'Start Campaign'}
                    </button>
                    <button 
                        onClick={() => setIsTestModalOpen(true)}
                        className="bg-black text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Zap size={14} fill="currentColor" /> Test Handshake
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
                <StatBox label="Total Calls" value={stats.total} icon={<Users size={20} />} trend="+12%" color="blue" />
                <StatBox label="Success" value={stats.completed} icon={<CheckCircle size={20} />} trend="84%" color="emerald" />
                <StatBox 
                    label="Time used" 
                    value={!stats.duration || isNaN(stats.duration) ? '0s' : (stats.duration < 60 ? `${Math.round(stats.duration)}s` : `${(stats.duration / 60).toFixed(1)}m`)} 
                    icon={<Clock size={20} />} 
                    color="blue" 
                />
                <StatBox label="Drops" value={stats.failed} icon={<XCircle size={20} />} trend="2.1%" color="rose" />
                <StatBox label="Waitlist" value={stats.pending} icon={<Clock size={20} />} trend="Active" color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Table/Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                <Activity size={16} className="text-blue-600" /> 
                                {viewMode === 'realtime' ? 'Active Streams' : 'Call Transcript Ledger'}
                            </h3>
                            <div className="flex gap-2">
                                <button className="p-2 text-slate-400 hover:text-slate-900"><Search size={16} /></button>
                                <button className="p-2 text-slate-400 hover:text-slate-900"><Filter size={16} /></button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-x-auto">
                            {viewMode === 'realtime' && liveCalls.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 px-8 text-center space-y-6">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                        <Globe className="text-slate-200" size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Awaiting Handshake</p>
                                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">System is polling for incoming campaign payloads.</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-left min-w-[600px]">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b border-slate-50">
                                            <th className="px-4 sm:px-6 py-4">Identity</th>
                                            <th className="px-4 sm:px-6 py-4">Status</th>
                                            <th className="px-4 sm:px-6 py-4">Duration</th>
                                            <th className="px-4 sm:px-6 py-4 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {historyLogs.map(log => (
                                            <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                                                <td className="px-4 sm:px-6 py-5 flex items-center gap-3 sm:gap-4">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                                        <Smartphone size={14} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs sm:text-sm font-black text-slate-900 leading-none mb-1">{log.number}</p>
                                                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-5">
                                                    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${log.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {log.outcome}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-5 text-[11px] sm:text-xs font-bold text-slate-400">{log.duration}</td>
                                                <td className="px-4 sm:px-6 py-5 text-right text-[9px] sm:text-[10px] font-black text-slate-300 tabular-nums uppercase">{log.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    {/* Performance Progress */}
                    <div className="bg-slate-900 rounded-[32px] p-8 text-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <TrendingUp size={18} className="text-blue-400" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest">Network Health</h3>
                        </div>
                        
                        <div className="space-y-10">
                            <div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                                    <span className="text-slate-400">Conversion Rate</span>
                                    <span>{completionRate}%</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${completionRate}%` }}></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latency</p>
                                    <p className="text-xl font-black">28ms</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Jitter</p>
                                    <p className="text-xl font-black">1.2ms</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-white rounded-[32px] border border-slate-100 p-8">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                             <Sparkles size={16} className="text-blue-600" /> Optimization
                         </h3>
                         <div className="space-y-6">
                             <Tip title="Cold Start" text="Persona 'Sam' has better conversion between 9AM-11AM EST." />
                             <Tip title="Knowledge Sync" text="Ensure knowledge JSON is kept under 50KB for lowest latency." />
                         </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isTestModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl border border-slate-100">
                        <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Manual Sync</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Establish a temporary AI-to-Lead link.</p>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Target Number</label>
                                <input 
                                    type="tel" 
                                    value={testNumber}
                                    onChange={(e) => setTestNumber(e.target.value)}
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-slate-900 font-black focus:border-blue-600 focus:bg-white outline-none transition-all"
                                />
                            </div>
                            
                            <div className="flex gap-4">
                                <button onClick={() => setIsTestModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Cancel</button>
                                <button 
                                    onClick={handleTestCall}
                                    disabled={isConnecting}
                                    className="flex-[2] py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-xl shadow-blue-100"
                                >
                                    {isConnecting ? 'Connecting...' : 'Authorize Sync'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatBox = ({ label, value, icon, trend, color }) => (
    <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 p-4 sm:p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all group overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform shrink-0`}>
                {React.cloneElement(icon, { size: 16 })}
            </div>
            <div className="min-w-0">
                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">{label}</p>
                <p className="text-lg sm:text-2xl font-black text-slate-900 tabular-nums truncate">{value}</p>
            </div>
        </div>
        {trend && (
            <div className={`text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-${color}-50 text-${color}-600 uppercase shrink-0`}>
                {trend}
            </div>
        )}
    </div>
);

const Tip = ({ title, text }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{title}</p>
        <p className="text-xs font-bold text-slate-500 leading-relaxed italic">"{text}"</p>
    </div>
);

export default Dashboard;
