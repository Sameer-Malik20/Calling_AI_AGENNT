import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../config/api';
import { 
  Plus, Users, FileJson, CheckCircle2, AlertCircle, Upload, 
  ArrowRight, Sparkles, Zap, Smartphone, Globe, Layers, Shield,
  FileSpreadsheet, Trash2, Edit3, Save, X, ChevronDown, ListFilter,
  BarChart3, Settings2, Cpu
} from 'lucide-react';

const CampaignManagement = () => {
    const [view, setView] = useState('list'); // 'list' or 'create' or 'edit'
    const [campaigns, setCampaigns] = useState([]);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [leads, setLeads] = useState([]);
    
    // Form States
    const [name, setName] = useState('');
    const [knowledgeFile, setKnowledgeFile] = useState('');
    const [numbers, setNumbers] = useState('');
    const [leadData, setLeadData] = useState([]);
    const [availableFiles, setAvailableFiles] = useState([]);
    const [status, setStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCampaigns();
        fetchKnowledgeFiles();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/campaigns`);
            setCampaigns(res.data);
        } catch (e) { console.error("Error fetching campaigns:", e); }
    };

    const fetchKnowledgeFiles = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/knowledge`);
            setAvailableFiles(res.data);
            if (res.data.length > 0) setKnowledgeFile(res.data[0]);
        } catch (e) { console.error(e); }
    };

    const handleDeleteCampaign = async (id) => {
        if (!window.confirm("Are you sure you want to delete this campaign? All leads will be lost.")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/campaigns/${id}`);
            fetchCampaigns();
        } catch (e) { alert("Delete failed"); }
    };

    const handleEditCampaign = async (campaign) => {
        setEditingCampaign(campaign);
        setName(campaign.name);
        setKnowledgeFile(campaign.knowledgeFile);
        
        try {
            const res = await axios.get(`${API_BASE_URL}/api/campaigns/${campaign._id}/leads`);
            setLeads(res.data);
            setView('edit');
        } catch (e) { console.error(e); }
    };

    const handleUpdateLead = async (leadId, updatedData) => {
        try {
            await axios.put(`${API_BASE_URL}/api/leads/${leadId}`, updatedData);
            // Refresh local state or refetch
            setLeads(prev => prev.map(l => l._id === leadId ? { ...l, ...updatedData } : l));
        } catch (e) { alert("Update failed"); }
    };

    const handleDeleteLead = async (leadId) => {
        if (!window.confirm("Delete this lead?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/leads/${leadId}`);
            setLeads(prev => prev.filter(l => l._id !== leadId));
        } catch (e) { alert("Delete failed"); }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            
            const mappedData = json.map(row => {
                const name = row.name || row.Name || row.full_name || row.Customer || 'Unknown';
                const number = row.number || row.Number || row.phone || row.Mobile || row.mobile_number;
                return { name, number };
            }).filter(item => item.number);

            setLeadData([...leadData, ...mappedData]);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('');
        
        try {
            const manualNumbers = numbers.split('\n')
                .filter(n => n.trim() !== '')
                .map(line => {
                    const [n, num] = line.split(',').map(s => s.trim());
                    return num ? { name: n, number: num } : { name: 'Manual Entry', number: n };
                });

            const finalLeadData = [...manualNumbers, ...leadData];
            if (finalLeadData.length === 0) throw new Error('Add at least one lead');

            await axios.post(`${API_BASE_URL}/api/campaigns`, {
                name,
                knowledgeFile,
                leadData: finalLeadData
            });
            
            setStatus('success');
            setTimeout(() => {
                setView('list');
                fetchCampaigns();
                resetForm();
            }, 1500);
        } catch (err) {
            setStatus('error: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setName('');
        setNumbers('');
        setLeadData([]);
        setStatus('');
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-slate-50">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
                            Admin Matrix
                        </h2>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {view === 'list' ? 'Campaign Ledger' : view === 'create' ? 'Deploy Outreach' : 'Synchronize Leads'}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {view === 'list' ? (
                        <button 
                            onClick={() => { setView('create'); resetForm(); }}
                            className="w-full sm:w-auto bg-black text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-50"
                        >
                            <Plus size={16} /> New Payload
                        </button>
                    ) : (
                        <button 
                            onClick={() => setView('list')}
                            className="w-full sm:w-auto bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                            <X size={16} /> Go Back
                        </button>
                    )}
                </div>
            </div>

            {view === 'list' && (
                <div className="grid grid-cols-1 gap-8">
                    {/* Excel-like Table for Campaigns */}
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 italic text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        <th className="px-6 sm:px-8 py-5">Internal Name</th>
                                        <th className="px-6 sm:px-8 py-5 hidden md:table-cell">Knowledge Core</th>
                                        <th className="px-6 sm:px-8 py-5 text-center">Payload Size</th>
                                        <th className="px-6 sm:px-8 py-5 text-center">Sync Progress</th>
                                        <th className="px-6 sm:px-8 py-5 text-center hidden lg:table-cell">Lifecycle</th>
                                        <th className="px-6 sm:px-8 py-5 text-right">Matrix Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {campaigns.map(camp => (
                                        <tr key={camp._id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 sm:px-8 py-6 font-black text-slate-900 uppercase tracking-tight text-xs">
                                                {camp.name}
                                                <div className="md:hidden mt-1 text-[10px] font-bold text-slate-400">{camp.knowledgeFile}</div>
                                            </td>
                                            <td className="px-6 sm:px-8 py-6 hidden md:table-cell">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                                    <FileJson size={14} className="text-blue-500" />
                                                    {camp.knowledgeFile}
                                                </div>
                                            </td>
                                            <td className="px-6 sm:px-8 py-6 text-center tabular-nums font-black text-slate-900">
                                                {camp.stats?.total || 0}
                                            </td>
                                            <td className="px-6 sm:px-8 py-6">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-16 sm:w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                                                            style={{ width: `${camp.stats?.total > 0 ? (camp.stats.completed / camp.stats.total) * 100 : 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                                                        {camp.stats?.completed}/{camp.stats?.total} SYNCED
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 sm:px-8 py-6 text-center text-[10px] font-black italic hidden lg:table-cell">
                                                {camp.status === 'RUNNING' ? (
                                                    <span className="text-emerald-500 animate-pulse">● ACTIVE MATRIX</span>
                                                ) : (
                                                    <span className="text-slate-300">● STATIC</span>
                                                )}
                                            </td>
                                            <td className="px-6 sm:px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleEditCampaign(camp)}
                                                        className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="Edit Matrix"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteCampaign(camp._id)}
                                                        className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        title="Purge Payload"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {campaigns.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="p-6 bg-slate-50 rounded-full italic"><Cpu size={32} className="text-slate-200" /></div>
                                                    <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">No Dynamic Payloads Detected</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {(view === 'create' || view === 'edit') && (
                <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-6 duration-700">
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                        <form onSubmit={view === 'create' ? handleSubmit : (e) => e.preventDefault()} className="divide-y divide-slate-50">
                            <div className="p-10 space-y-12">
                                {/* Section 1: Identity */}
                                <div className="flex flex-col md:flex-row gap-10">
                                    <div className="w-full md:w-1/3">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Protocol Identity</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Labels must be unique for core synchronization.</p>
                                    </div>
                                    <div className="flex-1">
                                        <input 
                                            type="text" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-slate-900 font-black focus:border-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-200" 
                                            placeholder="ALPHA_PRIME_2026"
                                            required
                                            disabled={view === 'edit'}
                                        />
                                    </div>
                                </div>

                                {/* Section 2: Target Pool Management */}
                                <div className="flex flex-col md:flex-row gap-10">
                                    <div className="w-full md:w-1/3">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Lead Sync Console</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Manage, edit, or append new target identities.</p>
                                        
                                        {view === 'create' && (
                                            <div className="mt-6">
                                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-all cursor-pointer">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
                                                        <p className="text-[10px] font-black uppercase text-slate-500">Inject Excel</p>
                                                    </div>
                                                    <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        {view === 'create' && (
                                            <textarea 
                                                rows="4"
                                                value={numbers}
                                                onChange={(e) => setNumbers(e.target.value)}
                                                className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[28px] text-slate-900 font-mono text-sm focus:border-blue-600 focus:bg-white outline-none transition-all resize-none shadow-inner"
                                                placeholder="Name, Number&#10;Sam, 1001"
                                            ></textarea>
                                        )}

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                                                    Active Lead Matrix ({view === 'edit' ? leads.length : leadData.length})
                                                </h4>
                                                <ListFilter size={14} className="text-slate-300" />
                                            </div>
                                            
                                            <div className="max-h-96 overflow-y-auto pr-2 space-y-2 custom-scrollbar border border-dashed border-slate-100 p-4 rounded-3xl">
                                                {(view === 'edit' ? leads : leadData).map((lead, idx) => (
                                                    <LeadRow 
                                                        key={lead._id || idx} 
                                                        lead={lead} 
                                                        onDelete={() => view === 'edit' ? handleDeleteLead(lead._id) : setLeadData(prev => prev.filter((_, i) => i !== idx))}
                                                        onUpdate={(data) => view === 'edit' ? handleUpdateLead(lead._id, data) : setLeadData(prev => prev.map((l, i) => i === idx ? { ...l, ...data } : l))}
                                                    />
                                                ))}
                                                {(view === 'edit' ? leads : leadData).length === 0 && (
                                                    <div className="py-10 text-center opacity-30"><Smartphone size={24} className="mx-auto mb-2" /></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4 text-slate-400 italic">
                                     <Shield size={20} />
                                     <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Security Signature: VALID</span>
                                </div>
                                {view === 'create' && (
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full md:w-auto px-12 py-5 bg-black text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                                    >
                                        {isSubmitting ? 'Processing...' : 'Authorize Payload'}
                                        <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {status && (
                <div className={`fixed bottom-10 right-10 p-6 rounded-3xl border shadow-2xl animate-in slide-in-from-right-10 flex items-center gap-4 max-w-sm ${status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-rose-50 border-rose-100 text-rose-900'}`}>
                    {status === 'success' ? <CheckCircle2 className="text-emerald-500" /> : <AlertCircle className="text-rose-500" />}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">{status === 'success' ? 'SYNC SUCCESS' : 'DEPLOYMENT ERROR'}</p>
                        <p className="text-[11px] font-bold mt-1 leading-relaxed">{status === 'success' ? 'The matrix has been updated globally.' : status.replace('error: ', '')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const LeadRow = ({ lead, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(lead.name);
    const [tempNumber, setTempNumber] = useState(lead.number);

    if (isEditing) {
        return (
            <div className="flex items-center gap-3 p-3 bg-white border-2 border-blue-100 rounded-2xl shadow-sm">
                <input value={tempName} onChange={e => setTempName(e.target.value)} className="flex-1 bg-slate-50 px-3 py-2 text-[11px] font-bold rounded-lg outline-none" />
                <input value={tempNumber} onChange={e => setTempNumber(e.target.value)} className="flex-1 bg-slate-50 px-3 py-2 text-[11px] font-bold rounded-lg outline-none" />
                <button onClick={() => { onUpdate({ name: tempName, number: tempNumber }); setIsEditing(false); }} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Save size={14} /></button>
                <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={14} /></button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
            <div className="flex-1">
                <p className="text-[11px] font-black text-slate-900 shadow-slate-100 uppercase">{lead.name}</p>
                <p className="text-[10px] font-bold text-slate-400">{lead.number}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className={`mr-4 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${lead.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {lead.status || 'READY'}
                </span>
                <button onClick={() => setIsEditing(true)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-white rounded-lg transition-all"><Edit3 size={14} /></button>
                <button onClick={onDelete} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-all"><Trash2 size={14} /></button>
            </div>
        </div>
    );
}

export default CampaignManagement;
