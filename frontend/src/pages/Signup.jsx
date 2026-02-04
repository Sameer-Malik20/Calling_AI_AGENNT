import React, { useState } from 'react';
import { 
  Sparkles, Shield, ArrowRight, Mail, 
  Lock, User, Smartphone, CheckCircle2, Globe, Cpu
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSignup = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userName', name);
            navigate('/');
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans antialiased text-slate-900">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-50 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-xl animate-in fade-in zoom-in duration-700">
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl p-8 md:p-10 relative overflow-hidden">
                    
                    {/* Header */}
                    <div className="text-center mb-6 space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 rounded-xl mb-2 shadow-lg">
                            <Sparkles size={14} className="text-white fill-white/10" />
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">SusaLabs Registration</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Provision Node</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] italic leading-loose">
                            Register your credentials into the global AI Voice infrastructure.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 italic">Full Identity</label>
                             <div className="relative group">
                                <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Operator Name"
                                    className="w-full pl-16 pr-8 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-900 focus:border-emerald-600 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                />
                             </div>
                        </div>

                        <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 italic">Email Uplink</label>
                             <div className="relative group">
                                <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@susalabs.ai"
                                    className="w-full pl-16 pr-8 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-900 focus:border-emerald-600 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                />
                             </div>
                        </div>

                        <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 italic">Secure Cipher</label>
                             <div className="relative group">
                                <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                                <input 
                                    type="password" 
                                    required
                                    placeholder="••••••••••••"
                                    className="w-full pl-16 pr-8 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-900 focus:border-emerald-600 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                />
                             </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-black text-white p-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100/50 active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? 'Registering...' : (
                                <>
                                    <span>Deploy My Identity</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                            Already Authorized? <Link to="/login" className="text-emerald-600 font-black hover:underline px-2">Access Portal</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
