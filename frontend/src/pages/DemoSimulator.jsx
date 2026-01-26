import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Send, User, Bot, Play, RefreshCw, Mic, MicOff, Volume2, 
    Zap, Headphones, Sparkles, MessageSquare, Waves, Smartphone, 
    Smartphone as Phone, Info, Settings2, Trash2, ArrowLeftRight, Terminal
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const DemoSimulator = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(true);
    const [knowledgeFiles, setKnowledgeFiles] = useState([]);
    const [activeKB, setActiveKB] = useState('');
    const scrollRef = useRef(null);
    const recognitionRef = useRef(null);
    
    // Use refs for fresh access in closures
    const isVoiceModeRef = useRef(isVoiceMode);
    const messagesRef = useRef(messages);

    useEffect(() => {
        isVoiceModeRef.current = isVoiceMode;
    }, [isVoiceMode]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        const fetchKB = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/knowledge`, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                if (Array.isArray(res.data)) {
                    setKnowledgeFiles(res.data);
                    if (res.data.length > 0) setActiveKB(res.data[0]);
                }
            } catch (e) { console.error("KB Fetch Error:", e); }
        };
        fetchKB();

        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                processVoiceInput(transcript);
            };

            recognition.onend = () => setIsListening(false);
            recognitionRef.current = recognition;
        }
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const playAudio = async (text) => {
        if (!isVoiceModeRef.current) return;
        try {
            const res = await axios.post(`${API_BASE_URL}/api/simulator/tts`, { text }, { 
                responseType: 'blob',
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const audio = new Audio(url);
            audio.play();
        } catch (e) { console.error("TTS Error:", e); }
    };

    const handleStartCall = async () => {
        setMessages([{ role: 'system', content: 'ESTABLISHING SECURE VOICE CHANNEL...' }]);
        setIsThinking(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/simulator/chat`, { 
                message: "GET_GREETING",
                kbFile: activeKB,
                history: []
            }, { headers: { 'ngrok-skip-browser-warning': 'true' } });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
            playAudio(res.data.response);
        } catch (e) {
            const fallback = "Hello! Sam from SusaLabs here. Do you have a moment?";
            setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
            playAudio(fallback);
        }
        setIsThinking(false);
    };

    const processVoiceInput = async (text) => {
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setIsThinking(true);
        try {
            const chatHistory = messagesRef.current.filter(m => m.role !== 'system');
            const res = await axios.post(`${API_BASE_URL}/api/simulator/chat`, {
                message: text,
                kbFile: activeKB,
                history: chatHistory
            }, { headers: { 'ngrok-skip-browser-warning': 'true' } });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
            playAudio(res.data.response);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Connection signal is weak. Could you please repeat?" }]);
        }
        setIsThinking(false);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        const msg = inputText;
        setInputText('');
        processVoiceInput(msg);
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setIsListening(true);
            recognitionRef.current?.start();
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
            {/* Header / Config Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-50">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Waves size={16} className="text-blue-600 animate-pulse" />
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI Voice Sandbox</h2>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Handshake Validation</h1>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                        <button 
                            onClick={() => setIsVoiceMode(true)}
                            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${isVoiceMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            Voice On
                        </button>
                        <button 
                            onClick={() => setIsVoiceMode(false)}
                            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${!isVoiceMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            Silent
                        </button>
                    </div>

                    <select 
                        value={activeKB}
                        onChange={(e) => setActiveKB(e.target.value)}
                        className="bg-slate-50 px-4 py-2 text-[9px] font-black text-slate-900 uppercase tracking-widest outline-none border-none rounded-xl cursor-pointer"
                    >
                        {knowledgeFiles.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>

                    <button 
                        onClick={handleStartCall}
                        className="bg-black text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-50"
                    >
                        <Play size={12} fill="currentColor" /> Initialize
                    </button>
                </div>
            </div>

            {/* Chat Node */}
            <div className="flex-1 bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col overflow-hidden relative">
                {/* Status Strip */}
                <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Active Sink</span>
                        </div>
                        <div className="h-3 w-px bg-slate-200"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AES-256 Encrypted</span>
                    </div>
                    <button onClick={() => setMessages([])} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                <Headphones size={32} className="text-slate-200" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Channel Idle</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest italic">Awaiting manual handshake initiation.</p>
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'system' ? 'justify-center my-6' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}>
                            {m.role === 'system' ? (
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] bg-slate-50/50 px-6 py-2 rounded-full border border-slate-50">{m.content}</span>
                            ) : (
                                <div className={`flex gap-5 max-w-[85%] lg:max-w-[70%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-black text-white' : 'bg-white border border-slate-100 text-blue-600'}`}>
                                        {m.role === 'user' ? <User size={18} /> : <Zap size={18} fill="currentColor" className="fill-blue-600/10" />}
                                    </div>
                                    <div className={`space-y-2 ${m.role === 'user' ? 'text-right' : ''}`}>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">{m.role === 'user' ? 'Target Input' : 'Susa AI Response'}</p>
                                        <div className={`p-6 rounded-[24px] shadow-sm text-sm font-bold leading-relaxed ${m.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white border border-slate-50 text-slate-800 rounded-tl-none'}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {isThinking && (
                        <div className="flex justify-start animate-fade">
                            <div className="flex gap-4 items-center bg-slate-50 px-6 py-4 rounded-full border border-slate-100">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-duration:800ms]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-duration:800ms] delay-100"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-duration:800ms] delay-200"></div>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Neural Sync...</span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Console */}
                <div className="p-8 bg-slate-50/30 border-t border-slate-50">
                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-4 relative">
                        <div className="flex-1 relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-blue-500 transition-colors">
                                <Terminal size={18} />
                            </div>
                            <input 
                                type="text" 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={isListening ? "Listening to voice payload..." : "Inject manual response..."}
                                className="w-full pl-16 pr-24 py-5 bg-white border-2 border-slate-50 rounded-2xl text-sm font-bold text-slate-800 focus:border-blue-600 outline-none transition-all placeholder:text-slate-200 shadow-sm"
                                disabled={messages.length === 0}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button 
                                    type="button"
                                    onClick={toggleListening}
                                    disabled={messages.length === 0}
                                    className={`p-2 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`}
                                >
                                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                </button>
                                <button 
                                    type="submit"
                                    disabled={messages.length === 0 || (!inputText.trim() && !isListening)}
                                    className="p-2 bg-black text-white rounded-xl shadow-lg hover:bg-blue-600 disabled:opacity-20 transition-all"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </form>
                    <div className="mt-4 flex items-center justify-center gap-6 opacity-30 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
                         <span>Encryption Active</span>
                         <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                         <span>Protocol TLS 1.3</span>
                         <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                         <span>v4.1.0 Stable</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoSimulator;
