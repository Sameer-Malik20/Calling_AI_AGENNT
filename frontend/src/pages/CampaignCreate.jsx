import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { 
  Plus, Users, FileJson, CheckCircle2, AlertCircle, Upload, 
  ArrowRight, Sparkles, Zap, Smartphone, Globe, Layers, Shield
} from 'lucide-react';

const CampaignCreate = () => {
    const [name, setName] = useState('');
    const [knowledgeFile, setKnowledgeFile] = useState('');
    const [numbers, setNumbers] = useState('');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('');
        
        try {
            const numberList = numbers.split('\n').filter(n => n.trim() !== '');
            if (numberList.length === 0) throw new Error('Please enter at least one phone number');

            await axios.post(`${API_BASE_URL}/api/campaigns`, {
                name,
                knowledgeFile,
                numbers: numberList
            });
            
            setStatus('success');
            setName('');
            setNumbers('');
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
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Input target numbers in E.164 format (one per line).</p>
                            </div>
                            <div className="flex-1 space-y-4">
                                <textarea 
                                    rows="6"
                                    value={numbers}
                                    onChange={(e) => setNumbers(e.target.value)}
                                    className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[28px] text-slate-900 font-mono text-sm focus:border-blue-600 focus:bg-white outline-none transition-all resize-none shadow-inner"
                                    placeholder="+1 (555) 123-4567&#10;+1 (555) 987-6543"
                                    required
                                ></textarea>
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
