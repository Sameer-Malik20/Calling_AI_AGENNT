import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { 
  BarChart3, TrendingUp, Users, PhoneCall, 
  Activity, Zap, Clock, ThumbsUp, PieChart
} from 'lucide-react';

const Analytics = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        failed: 0,
        pending: 0,
        duration: 0
    });

    useEffect(() => {
        const fetchAllStats = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/campaigns`);
                setCampaigns(res.data);
                const allStats = res.data.reduce((acc, c) => {
                    if (c.stats) {
                        acc.total += (c.stats.total || 0);
                        acc.completed += (c.stats.completed || 0);
                        acc.failed += (c.stats.failed || 0);
                        acc.pending += (c.stats.pending || 0);
                        acc.duration += (Number(c.stats.duration) || 0);
                    }
                    return acc;
                }, { total: 0, completed: 0, failed: 0, pending: 0, duration: 0 });
                setStats(allStats);
            } catch (e) {
                console.error(e);
            }
        };
        fetchAllStats();
    }, []);

    const completionRate = stats.total > 0 ? Math.round((stats.completed / (stats.completed + stats.failed || 1)) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Performance Matrix</h2>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">System Impact Analysis</h1>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCard 
                    icon={<PhoneCall className="text-blue-600" />} 
                    label="Volume" 
                    value={stats.total} 
                    sub="Total Indexed Leads" 
                    trend="+12% Core Growth" 
                />
                <MetricCard 
                    icon={<Clock className="text-emerald-600" />} 
                    label="Talk Time" 
                    value={!stats.duration || isNaN(stats.duration) ? '0s' : (stats.duration < 60 ? `${Math.round(stats.duration)}s` : `${(stats.duration / 60).toFixed(1)}m`)} 
                    sub="Total Minutes Used" 
                    trend="Productive Logic"
                    color="emerald"
                />
                <MetricCard 
                    icon={<Activity className="text-amber-600" />} 
                    label="Sync Rate" 
                    value={`${completionRate}%`} 
                    sub="Handshake Efficiency" 
                    trend="High Logic Accuracy"
                    color="amber"
                />
                <MetricCard 
                    icon={<Zap className="text-blue-600" />} 
                    label="Reach" 
                    value={stats.completed} 
                    sub="Successful Uplinks" 
                    trend="Sub-Cycle Logic"
                />
            </div>

            {/* Campaign Breakdown */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Campaign Resource Usage</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic mt-1">Breakdown of time and sync metrics per payload.</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 italic text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                <th className="px-6 sm:px-8 py-4">Campaign Name</th>
                                <th className="px-6 sm:px-8 py-4 text-center">Efficiency</th>
                                <th className="px-6 sm:px-8 py-4 text-right">Minutes Used</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans">
                            {campaigns.map(c => (
                                <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 sm:px-8 py-5">
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{c.name}</p>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${c.status === 'RUNNING' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 sm:px-8 py-5 text-center">
                                        <p className="text-xs font-bold text-slate-900">
                                            {c.stats.total > 0 ? Math.round((c.stats.completed / c.stats.total) * 100) : 0}%
                                        </p>
                                    </td>
                                    <td className="px-6 sm:px-8 py-5 text-right font-black text-xs text-blue-600 tabular-nums">
                                        {!c.stats?.duration || isNaN(c.stats.duration) 
                                            ? '0s' 
                                            : (c.stats.duration < 60 
                                                ? `${Math.round(c.stats.duration)}s` 
                                                : `${(c.stats.duration / 60).toFixed(2)}m`)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group/chart">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Outreach Timeline</h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic tracking-tight">Active synchronization over 24H cycle.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                            <TrendingUp size={20} className="text-blue-600" />
                        </div>
                    </div>
                    
                    <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 px-2 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0">
                            {[1, 2, 3, 4].map((_, i) => (
                                <div key={i} className="w-full border-t border-slate-50/50 h-0"></div>
                            ))}
                        </div>

                        {[
                            30, 25, 20, 15, 10, 8, 12, 45, 70, 85, 90, 75, 
                            80, 95, 88, 70, 65, 55, 60, 50, 45, 40, 35, 30
                        ].map((h, i) => {
                            const currentHour = new Date().getHours();
                            const isActive = i === currentHour;
                            return (
                                <div key={i} className="flex-1 group relative h-full flex items-end">
                                    <div className="absolute -top-10 left-1/2 -track-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 whitespace-nowrap shadow-xl -translate-x-1/2">
                                        {i}:00 • {h}% Load
                                    </div>
                                    <div 
                                        className={`w-full rounded-t-lg transition-all duration-1000 ease-out relative ${
                                            isActive 
                                                ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_-4px_12px_rgba(37,99,235,0.3)]' 
                                                : 'bg-slate-100 group-hover:bg-blue-400'
                                        }`} 
                                        style={{ 
                                            height: `${h}%`,
                                            transitionDelay: `${i * 30}ms`
                                        }}
                                    >
                                        {isActive && (
                                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full border-2 border-blue-600 shadow-sm animate-bounce"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-8 flex justify-between px-2 italic font-black text-[8px] text-slate-300 uppercase tracking-widest border-t border-slate-50 pt-4">
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>23:59</span>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Sentiment Distribution</h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic tracking-tight">AI classification of customer intent.</p>
                        </div>
                        <PieChart size={20} className="text-blue-600" />
                    </div>
                    
                    <div className="space-y-6">
                        <SentimentBar label="Positive Protocol" percent={65} color="emerald" />
                        <SentimentBar label="Neutral Inquiry" percent={25} color="blue" />
                        <SentimentBar label="Negative Rejection" percent={10} color="rose" />
                    </div>

                    <div className="mt-12 p-6 bg-slate-50 rounded-[24px] border border-dashed border-slate-200">
                        <div className="flex items-center gap-4">
                            <ThumbsUp className="text-emerald-500" size={24} />
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-1">Agent Quality Score: 9.8</h4>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">Consistently outperforming human baseline metrics.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ icon, label, value, sub, trend, color = "blue" }) => (
    <div className="bg-white p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-500 overflow-hidden">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-transform group-hover:scale-110 duration-500 ${
            color === 'emerald' ? 'bg-emerald-50' : color === 'amber' ? 'bg-amber-50' : 'bg-blue-50'
        }`}>
            {React.cloneElement(icon, { size: 18 })}
        </div>
        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <h3 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter mb-1 sm:mb-2 truncate">{value}</h3>
        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest italic truncate">{sub}</p>
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-50 flex items-center justify-between">
            <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest ${
                color === 'rose' ? 'text-rose-500' : 'text-emerald-500'
            }`}>{trend}</span>
            <TrendingUp size={10} className="text-emerald-500 sm:w-[12px] sm:h-[12px]" />
        </div>
    </div>
);

const SentimentBar = ({ label, percent, color }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-900">{label}</span>
            <span className="text-slate-400 italic tabular-nums">{percent}%</span>
        </div>
        <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                    color === 'emerald' ? 'bg-emerald-500' : color === 'rose' ? 'bg-rose-500' : 'bg-blue-600'
                }`}
                style={{ width: `${percent}%` }}
            ></div>
        </div>
    </div>
);

export default Analytics;
