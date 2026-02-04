import React, { useState } from 'react';
import { 
  Sparkles, Shield, ArrowRight, Mail, 
  Lock, Eye, EyeOff, CheckCircle2, Globe, Cpu
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Mock authentication
        setTimeout(() => {
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userName', email.split('@')[0]);
            navigate('/');
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans antialiased text-slate-900">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-xl animate-in fade-in zoom-in duration-700">
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl p-8 md:p-10 relative overflow-hidden">
                    
                    {/* Header */}
                    <div className="text-center mb-6 space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black rounded-xl mb-2 shadow-lg">
                            <Sparkles size={14} className="text-white fill-white/10" />
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">SusaLabs Access</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Authorize Node</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] italic leading-loose">
                            Synchronizing secure uplink to the AI Voice Matrix.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 italic">Identity Protocol</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@susalabs.ai"
                                    className="w-full pl-16 pr-8 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-900 focus:border-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between px-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Secret Key</label>
                                <button type="button" className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Reset Logic</button>
                            </div>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full pl-16 pr-16 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-900 focus:border-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 px-6">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-600" id="remember" />
                            <label htmlFor="remember" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic cursor-pointer">Persist Session Link</label>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-black text-white p-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-blue-600 transition-all shadow-xl shadow-blue-100/50 active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? 'Authenticating...' : (
                                <>
                                    <span>Initiate Uplink</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-8 border-t border-slate-50 text-center space-y-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            New Node? <Link to="/signup" className="text-blue-600 font-black hover:underline px-2">Register Payload</Link>
                        </p>
                        <div className="flex items-center justify-center gap-6 opacity-30">
                            <div className="flex items-center gap-2">
                                <Shield size={12} />
                                <span className="text-[8px] font-black uppercase tracking-widest">SSL Encrypted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Cpu size={12} />
                                <span className="text-[8px] font-black uppercase tracking-widest">AI Audit v4</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
