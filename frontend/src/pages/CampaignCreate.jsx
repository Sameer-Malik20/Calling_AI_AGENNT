import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../config/api';
import { 
  Plus, Users, FileJson, CheckCircle2, AlertCircle, Upload, 
  ArrowRight, Sparkles, Zap, Smartphone, Globe, Layers, Shield,
  FileSpreadsheet, Trash2
} from 'lucide-react';

const CampaignCreate = () => {
    const [name, setName] = useState('');
    const [knowledgeFile, setKnowledgeFile] = useState('');
    const [numbers, setNumbers] = useState('');
    const [leadData, setLeadData] = useState([]);
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/knowledge`);
                setFiles(res.data);
                if (res.data.length > 0) setKnowledgeFile(res.data[0]);
            } catch (e) { console.error(e); }
        };
        fetchFiles();
    }, []);

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
            
            // Map common column names to name and number
            const mappedData = json.map(row => {
                const name = row.name || row.Name || row.full_name || row.Customer || 'Unknown';
                const number = row.number || row.Number || row.phone || row.Mobile || row.mobile_number;
                return { name, number };
            }).filter(item => item.number);

            setLeadData([...leadData, ...mappedData]);
        };
        reader.readAsArrayBuffer(file);
    };

    const removeLead = (index) => {
        setLeadData(leadData.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('');
        
        try {
            const manualNumbers = numbers.split('\n')
                .filter(n => n.trim() !== '')
                .map(line => {
                    const [name, num] = line.split(',').map(s => s.trim());
                    // Agar comma hai toh name aur number dono lo, nahi toh default name
                    if (num) {
                        return { name: name, number: num };
                    }
                    return { name: 'Manual Entry', number: name };
                });

            const finalLeadData = [...manualNumbers, ...leadData];
            
            if (finalLeadData.length === 0) throw new Error('Please enter at least one phone number or upload a file');

            await axios.post(`${API_BASE_URL}/api/campaigns`, {
                name,
                knowledgeFile,
                leadData: finalLeadData
            });
            
            setStatus('success');
            setName('');
            setNumbers('');
            setLeadData([]);
        } catch (err) {
            setStatus('error: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 animate-in fade-in duration-700">
            <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 mb-2">
                    <Sparkles size={14} className="fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Campaign Deployment</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Engage Target Matrix</h1>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] max-w-sm mx-auto leading-loose italic">
                    Establish global AI outreach parameters with localized SIP synchronicity.
                </p>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit} className="divide-y divide-slate-50">
                    <div className="p-10 space-y-12">
                        {/* Section 1: Identity */}
                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="w-full md:w-1/3">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Internal Identity</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Define a unique label for this outreach payload.</p>
                            </div>
                            <div className="flex-1">
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-slate-900 font-black focus:border-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-200" 
                                    placeholder="ALPHA_PRIME_2026"
                                    required
                                />
                            </div>
                        </div>

                        {/* Section 2: Wisdom Core */}
                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="w-full md:w-1/3">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Knowledge Core</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Select the personality and logic blueprint for the AI.</p>
                            </div>
                            <div className="flex-1">
                                <select 
                                    value={knowledgeFile}
                                    onChange={(e) => setKnowledgeFile(e.target.value)}
                                    className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-slate-900 font-black focus:border-blue-600 focus:bg-white outline-none transition-all cursor-pointer appearance-none"
                                >
                                    {files.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Section 3: Target Pool */}
                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="w-full md:w-1/3">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Lead Payload</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Input target numbers or upload an Excel/CSV file.</p>
                                
                                <div className="mt-6">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-all cursor-pointer">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
                                            <p className="text-[10px] font-black uppercase text-slate-500">Upload Excel/CSV</p>
                                        </div>
                                        <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                                    </label>
                                </div>
                            </div>
                            <div className="flex-1 space-y-6">
                                <textarea 
                                    rows="4"
                                    value={numbers}
                                    onChange={(e) => setNumbers(e.target.value)}
                                    className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[28px] text-slate-900 font-mono text-sm focus:border-blue-600 focus:bg-white outline-none transition-all resize-none shadow-inner"
                                    placeholder="+1 (555) 123-4567&#10;+1 (555) 987-6543"
                                ></textarea>

                                {leadData.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Imported Leads ({leadData.length})</h4>
                                        <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                            {leadData.map((lead, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-900 uppercase">{lead.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{lead.number}</p>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeLead(idx)}
                                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 px-4 italic opacity-50">
                                     <Globe size={12} className="text-blue-500" />
                                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Database check: Global Link Optimal</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-slate-400 italic">
                             <Shield size={20} />
                             <span className="text-[9px] font-black uppercase tracking-widest">Secure Handshake Authorization Required</span>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full md:w-auto px-12 py-5 bg-black text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100"></div>
                                    <span className="text-[11px] font-black uppercase tracking-widest">Syncing Matrix...</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[11px] font-black uppercase tracking-widest">Authorize Deployment</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Success/Error Notifications */}
            <div className="mt-8">
                {status === 'success' && (
                    <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[32px] flex items-center gap-6 text-emerald-900 animate-in slide-in-from-bottom-4 shadow-sm">
                        <div className="p-4 bg-emerald-500 rounded-2xl text-white shadow-lg">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-tight">Sync Completed</p>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1 italic">The AI Persona engine is now active for this payload.</p>
                        </div>
                    </div>
                )}
                {status?.startsWith('error') && (
                    <div className="bg-rose-50 border border-rose-100 p-8 rounded-[32px] flex items-center gap-6 text-rose-900 animate-in slide-in-from-bottom-4 shadow-sm">
                        <div className="p-4 bg-rose-500 rounded-2xl text-white shadow-lg">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-tight">Deployment Refused</p>
                            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1 italic">API Rejected: {status.replace('error: ', '')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignCreate;
