// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
// import { 
//   LayoutDashboard, PhoneCall, FileText, Settings, PlayCircle, 
//   BarChart3, User, Bell, ChevronRight, Sparkles, Menu, X, 
//   Search, Shield, Cpu, Zap, Calendar
// } from 'lucide-react';
// import Dashboard from './pages/Dashboard';
// import CampaignCreate from './pages/CampaignCreate';
// import DemoSimulator from './pages/DemoSimulator';
// import Appointments from './pages/Appointments';

// const Navigation = ({ setIsSidebarOpen, viewMode, setViewMode }) => {
//   const location = useLocation();
  
//   const isSelected = (path) => location.pathname === path;

//   return (
//     <>
//       {/* Sidebar Content */}
//       <div className="flex flex-col h-full bg-white">
//         <div className="p-8 flex items-center justify-between">
//           <Link to="/" className="flex items-center gap-3" onClick={() => setIsSidebarOpen(false)}>
//             <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
//               <Sparkles size={20} className="text-white fill-white/10" />
//             </div>
//             <div>
//               <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">SusaLabs</h2>
//               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 mt-1 block">Voice AI v4</span>
//             </div>
//           </Link>
//           <button className="lg:hidden p-2 text-slate-400" onClick={() => setIsSidebarOpen(false)}>
//             <X size={20} />
//           </button>
//         </div>

//         <nav className="flex-1 px-5 py-4 space-y-1 overflow-y-auto custom-scrollbar">
//           <div className="px-4 py-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2">Operations</div>
//           <SidebarLink to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" active={isSelected('/')} onClick={() => setIsSidebarOpen(false)} />
//           <SidebarLink to="/demo" icon={<PlayCircle size={18} />} label="Simulator" active={isSelected('/demo')} onClick={() => setIsSidebarOpen(false)} />
//           <SidebarLink to="/create" icon={<PhoneCall size={18} />} label="Campaigns" active={isSelected('/create')} onClick={() => setIsSidebarOpen(false)} />
//           <SidebarLink to="/appointments" icon={<Calendar size={18} />} label="Appointments" active={isSelected('/appointments')} onClick={() => setIsSidebarOpen(false)} />
          
//           <div className="px-4 py-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2">Analytics</div>
//           <SidebarLink to="/logs" icon={<FileText size={18} />} label="Logs" active={isSelected('/logs')} onClick={() => setIsSidebarOpen(false)} />
//           <SidebarLink to="/analytics" icon={<BarChart3 size={18} />} label="Impact" active={isSelected('/analytics')} onClick={() => setIsSidebarOpen(false)} />
          
//           <div className="px-4 py-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2">System</div>
//           <SidebarLink to="/profile" icon={<User size={18} />} label="Profile" active={isSelected('/profile')} onClick={() => setIsSidebarOpen(false)} />
//           <SidebarLink to="/settings" icon={<Settings size={18} />} label="Settings" active={isSelected('/settings')} onClick={() => setIsSidebarOpen(false)} />
//         </nav>

//         <div className="p-6 border-t border-slate-50">
//           <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
//             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">SA</div>
//             <div className="flex-1 min-w-0">
//                <p className="text-[11px] font-black text-slate-900 truncate">SusaLabs Admin</p>
//                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active Link</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// const SidebarLink = ({ to, icon, label, active, onClick }) => (
//   <Link 
//     to={to} 
//     onClick={onClick}
//     className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[18px] transition-all duration-300 group ${
//       active 
//         ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
//         : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
//     }`}
//   >
//     <div className={`${active ? 'text-white' : 'group-hover:text-blue-600'} transition-colors`}>{icon}</div>
//     <span className={`text-[13px] font-bold tracking-tight ${active ? 'text-white' : ''}`}>{label}</span>
//     {active && <ChevronRight size={14} className="ml-auto text-white/50" />}
//   </Link>
// );

// const AppLayout = ({ viewMode, setViewMode }) => {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
//   return (
//     <div className="flex h-screen bg-[#FDFDFD] overflow-hidden text-slate-900 font-sans antialiased">
//       {/* Mobile Sidebar Overlay */}
//       {isSidebarOpen && (
//         <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
//       )}

//       {/* Sidebar */}
//       <aside className={`
//         fixed inset-y-0 left-0 w-64 bg-white flex flex-col z-50 transition-transform duration-300 lg:relative lg:translate-x-0 border-r border-slate-100
//         ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
//       `}>
//         <Navigation setIsSidebarOpen={setIsSidebarOpen} viewMode={viewMode} setViewMode={setViewMode} />
//       </aside>

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col min-w-0">
//         <header className="h-16 bg-white/50 backdrop-blur-md border-b border-slate-50 flex items-center justify-between px-6 lg:px-10 z-40 sticky top-0">
//           <div className="flex items-center gap-4">
//              <button className="lg:hidden p-2 text-slate-900" onClick={() => setIsSidebarOpen(true)}>
//                <Menu size={20} />
//              </button>
//              <div className="hidden sm:flex items-center gap-3">
//                 <div className="p-2 bg-blue-50 rounded-lg hidden lg:block">
//                    <Cpu size={14} className="text-blue-600" />
//                 </div>
//                 <div>
//                    <h1 className="text-xs font-black text-slate-900 tracking-[0.2em] uppercase">Control Matrix</h1>
//                 </div>
//              </div>
//           </div>

//           <div className="flex items-center gap-6">
//             <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
//                <button 
//                  onClick={() => setViewMode('realtime')} 
//                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'realtime' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
//                >
//                  Live
//                </button>
//                <button 
//                  onClick={() => setViewMode('history')} 
//                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
//                >
//                  History
//                </button>
//             </div>
            
//             <div className="flex items-center gap-4">
//               <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative">
//                 <Bell size={20} />
//                 <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
//               </button>
//               <div className="h-4 w-px bg-slate-100"></div>
//               <Link to="/create" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-100">
//                 <Plus size={14} /> New Campaign
//               </Link>
//             </div>
//           </div>
//         </header>

//         <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
//           <div className="max-w-7xl mx-auto h-full">
//             <Routes>
//               <Route path="/" element={<Dashboard viewMode={viewMode} />} />
//               <Route path="/demo" element={<DemoSimulator />} />
//               <Route path="/create" element={<CampaignCreate />} />
//               <Route path="/appointments" element={<Appointments />} />
//               <Route path="/logs" element={<Placeholder text="Voice Logs" />} />
//               <Route path="/analytics" element={<Placeholder text="Performance" />} />
//               <Route path="/profile" element={<Placeholder text="Admin Profile" />} />
//               <Route path="/settings" element={<Placeholder text="Core Configuration" />} />
//             </Routes>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// const Plus = ({ size }) => <span style={{fontSize: size}}>+</span>; // Fallback

// const App = () => {
//   const [viewMode, setViewMode] = useState('realtime');
//   return (
//     <Router>
//       <AppLayout viewMode={viewMode} setViewMode={setViewMode} />
//     </Router>
//   );
// }

// const Placeholder = ({ text }) => (
//   <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-700">
//     <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-8 shadow-inner">
//       <Zap size={32} className="text-slate-200" />
//     </div>
//     <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter italic">{text}</h2>
//     <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] max-w-xs leading-loose">
//       SusaLabs Infrastructure is synchronizing data. Portals will be operational shortly.
//     </p>
//   </div>
// );

// export default App;
