import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, PhoneCall, FileText, Settings as SettingsIcon, PlayCircle, 
  BarChart3, User, Bell, ChevronRight, Sparkles, Menu, X, 
  Search, Shield, Cpu, Zap, Settings2,Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CampaignManagement from './pages/CampaignManagement';
import Logs from './pages/Logs';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { Navigate } from 'react-router-dom';
import ProfessionalAppointments from './pages/ProfessionalAppointments';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const Navigation = ({ setIsSidebarOpen, viewMode, setViewMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isSelected = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  return (
    <>
      {/* Sidebar Content */}
      <div className="flex flex-col h-full bg-white">
        <div className="p-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={() => setIsSidebarOpen(false)}>
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-white fill-white/10" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">SusaLabs</h2>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 mt-1 block">Voice AI v4</span>
            </div>
          </Link>
          <button className="lg:hidden p-2 text-slate-400" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-5 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2">Operations</div>
          <SidebarLink to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" active={isSelected('/')} onClick={() => setIsSidebarOpen(false)} />
          <SidebarLink to="/create" icon={<PhoneCall size={18} />} label="Campaigns" active={isSelected('/create')} onClick={() => setIsSidebarOpen(false)} />
          <SidebarLink to="/appointments" icon={<Calendar size={18} />} label="Appointments" active={isSelected('/appointments')} onClick={() => setIsSidebarOpen(false)} />
          <div className="px-4 py-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2">Analytics</div>
          <SidebarLink to="/logs" icon={<FileText size={18} />} label="Interaction Logs" active={isSelected('/logs')} onClick={() => setIsSidebarOpen(false)} />
          <SidebarLink to="/analytics" icon={<BarChart3 size={18} />} label="System Impact" active={isSelected('/analytics')} onClick={() => setIsSidebarOpen(false)} />
          
          <div className="px-4 py-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2">System</div>
          <SidebarLink to="/profile" icon={<User size={18} />} label="Admin Profile" active={isSelected('/profile')} onClick={() => setIsSidebarOpen(false)} />
        </nav>

        <div className="p-6 border-t border-slate-50 space-y-4">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black uppercase">
              {(localStorage.getItem('userName') || 'A').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[11px] font-black text-slate-900 truncate uppercase">{localStorage.getItem('userName') || 'Admin'}</p>
               <p className="text-[9px] font-bold text-slate-400 truncate">{localStorage.getItem('userEmail') || 'admin@susalabs.ai'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full bg-slate-50 p-4 rounded-2xl flex items-center gap-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all group"
          >
            <SettingsIcon size={18} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-[11px] font-black uppercase tracking-widest">Terminate Session</span>
          </button>
        </div>
      </div>
    </>
  );
};

const SidebarLink = ({ to, icon, label, active, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[18px] transition-all duration-300 group ${
      active 
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
        : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
    }`}
  >
    <div className={`${active ? 'text-white' : 'group-hover:text-blue-600'} transition-colors`}>{icon}</div>
    <span className={`text-[13px] font-bold tracking-tight ${active ? 'text-white' : ''}`}>{label}</span>
    {active && <ChevronRight size={14} className="ml-auto text-white/50" />}
  </Link>
);

const AppLayout = ({ viewMode, setViewMode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen bg-[#FDFDFD] overflow-hidden text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white flex flex-col z-50 transition-transform duration-300 lg:relative lg:translate-x-0 border-r border-slate-100
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Navigation setIsSidebarOpen={setIsSidebarOpen} viewMode={viewMode} setViewMode={setViewMode} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100/50 flex items-center justify-between px-4 lg:px-10 z-[40] sticky top-0">
          <div className="flex items-center gap-3 lg:gap-4">
             <button className="lg:hidden p-2.5 text-slate-900 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors" onClick={() => setIsSidebarOpen(true)}>
               <Menu size={20} />
             </button>
             <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg lg:block hidden">
                   <Cpu size={14} className="text-white" />
                </div>
                <div>
                   <h1 className="text-[10px] lg:text-xs font-black text-slate-900 tracking-[0.2em] uppercase">Control Matrix</h1>
                   <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest hidden sm:block">Real-time Node Status: Active</p>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
               <button 
                 onClick={() => setViewMode('realtime')} 
                 className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'realtime' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
               >
                 Live
               </button>
               <button 
                 onClick={() => setViewMode('history')} 
                 className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
               >
                 History
               </button>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
              <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-600 rounded-full border-2 border-white"></span>
              </button>
              <div className="h-4 w-px bg-slate-100 hidden sm:block"></div>
              <Link to="/profile" className="w-9 h-9 bg-black text-white hover:bg-blue-600 transition-all rounded-xl flex items-center justify-center text-[10px] font-black shadow-lg shadow-slate-200">SA</Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10 bg-[#FAFBFF]">
          <div className="max-w-7xl mx-auto h-full">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard viewMode={viewMode} /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CampaignManagement /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute><ProfessionalAppointments /></ProtectedRoute>} />
              <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const [viewMode, setViewMode] = useState('realtime');
  return (
    <Router>
      <AppLayout viewMode={viewMode} setViewMode={setViewMode} />
    </Router>
  );
}

export default App;
