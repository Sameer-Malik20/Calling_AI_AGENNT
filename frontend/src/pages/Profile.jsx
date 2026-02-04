import React from 'react';
import { 
  User, Shield, Mail, Key, 
  MapPin, Calendar, Smartphone, LogOut
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'SusaLabs Admin';
    const userEmail = localStorage.getItem('userEmail') || 'admin@susalabs.ai';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header / Banner */}
            <div className="h-48 bg-black rounded-[40px] relative overflow-hidden flex items-end p-10">
                <div className="absolute top-0 right-0 p-10 opacity-20 rotate-12 scale-150">
                    <Shield size={120} className="text-white" />
                </div>
                <div className="z-10 flex items-center gap-6">
                    <div className="w-24 h-24 bg-blue-600 rounded-[32px] border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-black uppercase">
                        {userName.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none mb-2">{userName}</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">System Access Level: Root</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Account Details */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Operator Identity</h3>
                        <User size={18} className="text-blue-600" />
                    </div>

                    <div className="space-y-6">
                        <ProfileItem icon={<Mail size={16} />} label="Email Protocol" value={userEmail} />
                        <ProfileItem icon={<Smartphone size={16} />} label="Authorized Device" value="Primary Node" />
                        <ProfileItem icon={<MapPin size={16} />} label="Geolocation" value="India (Mainland)" />
                        <ProfileItem icon={<Calendar size={16} />} label="Duty Initiated" value="Jan 2026" />
                    </div>
                </div>

                {/* Security & Activity */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Authorization Core</h3>
                        <Shield size={18} className="text-blue-600" />
                    </div>

                    <div className="space-y-4">
                        <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group">
                            <div className="flex items-center gap-4">
                                <Key size={18} className="text-slate-400 group-hover:text-blue-600" />
                                <span className="text-[11px] font-black uppercase text-slate-900">Rotate Access Keys</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Last: 1H Ago</span>
                        </button>
                        
                        <div className="pt-8 border-t border-slate-50">
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-4 p-5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-2xl transition-all text-rose-600 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-rose-100/50"
                            >
                                <LogOut size={18} />
                                Terminate Session
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileItem = ({ icon, label, value }) => (
    <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
            {icon}
        </div>
        <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{value}</p>
        </div>
    </div>
);

export default Profile;
