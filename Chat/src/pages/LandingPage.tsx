import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  PhoneCall,
  Video,
  Lock,
  Sparkles,
  ArrowRight,
  Smile,
  Send,
  ChevronDown,
  CheckCheck,
  Paperclip,
  FileText,
  UserCheck,
  Moon,
  MessageSquarePlus,
  Play,
  Volume2,
  Mic,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import appLogo from '../assets/logo.png';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Interactive Live Demo State
  const [demoTab, setDemoTab] = useState<'chat' | 'call' | 'media'>('chat');
  const [demoMessages, setDemoMessages] = useState([
    { id: 1, sender: 'Sadasiba', text: 'Hey Barsha! Welcome to the new SB Chat app! 👋', isOutgoing: false, time: '11:15 AM' },
    { id: 2, sender: 'You', text: 'Thanks! The new purple theme and real-time speed look amazing! 💜', isOutgoing: true, time: '11:16 AM' },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTypingSim, setIsTypingSim] = useState(false);

  // Active Feature Tab
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 30;
    const y = (clientY / innerHeight - 0.5) * 30;
    setMousePos({ x, y });
  };

  const handleSendDemoMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'You',
      text: inputMsg,
      isOutgoing: true,
      time: 'Just now',
    };
    setDemoMessages((prev) => [...prev, newMsg]);
    setInputMsg('');

    // Simulate auto response after 1 second
    setIsTypingSim(true);
    setTimeout(() => {
      setIsTypingSim(false);
      setDemoMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'Sadasiba',
          text: 'Got your message instantly! WebSocket connection is sub-50ms 🚀',
          isOutgoing: false,
          time: 'Just now',
        },
      ]);
    }, 1200);
  };

  // Auto rotate feature tabs every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeatureTab((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const featureTabs = [
    {
      title: 'Instant Messaging & Replies',
      desc: 'Real-time WebSocket connection for instant chat delivery, typing indicators, read receipts, message replies, and emoji reactions.',
      icon: <Zap className="w-5 h-5 text-purple-400" />,
      badge: 'Sub-50ms Latency',
    },
    {
      title: '1-on-1 HD Voice & Video Calls',
      desc: 'Crystal-clear audio and video communication directly integrated with live call overlay controls and call logs.',
      icon: <Video className="w-5 h-5 text-fuchsia-400" />,
      badge: 'WebRTC HD',
    },
    {
      title: 'Rich Media & File Attachments',
      desc: 'Share high-resolution images, documents, audio voice notes, location pins, and contact cards effortlessly.',
      icon: <Paperclip className="w-5 h-5 text-indigo-400" />,
      badge: 'Cloud Integration',
    },
    {
      title: 'Custom Profiles & Dark Theme',
      desc: 'Personalized user profiles with Cloudinary photo uploads, status updates, and custom SB purple dark mode palette.',
      icon: <Moon className="w-5 h-5 text-violet-400" />,
      badge: 'Dark & Light Mode',
    },
  ];

  const faqs = [
    {
      q: 'What makes SB Chat different from standard chat apps?',
      a: 'SB Chat is built with real-time WebSocket architecture, delivering instant sub-50ms message delivery, HD voice/video calls, Cloudinary photo uploads, and a sleek dark purple aesthetic tailored to user performance.',
    },
    {
      q: 'Are my messages and calls secure?',
      a: 'Yes! SB Chat utilizes AES-256 encryption over secure WebSocket channels (WSS) and HTTPS protocols, ensuring your personal chats, calls, and files remain private.',
    },
    {
      q: 'Can I create groups and search for contacts?',
      a: 'Absolutely. You can search for users by name or email, start instant 1-on-1 DMs, or create group chat rooms with custom group avatars and descriptions.',
    },
    {
      q: 'Is SB Chat completely free to use?',
      a: 'Yes, SB Chat is 100% free with full access to instant messaging, call features, media sharing, and custom profile settings.',
    },
  ];

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full bg-[#090414] text-white overflow-x-hidden font-sans relative select-none"
    >
      {/* Background Lighting & Particle Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Parallax Orbs */}
        <div
          style={{ transform: `translate(${mousePos.x * 0.7}px, ${mousePos.y * 0.7}px)` }}
          className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse-orb transition-transform duration-100 ease-out"
        />
        <div
          style={{ transform: `translate(${-mousePos.x * 1}px, ${-mousePos.y * 1}px)` }}
          className="absolute top-1/2 -right-40 w-[650px] h-[650px] bg-fuchsia-600/20 rounded-full blur-[170px] animate-pulse-orb transition-transform duration-100 ease-out"
        />
        <div
          style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
          className="absolute -bottom-40 left-1/3 w-[750px] h-[750px] bg-indigo-600/20 rounded-full blur-[190px] animate-pulse-orb transition-transform duration-100 ease-out"
        />

        {/* Futuristic Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-purple-500/30 flex items-center justify-center p-1.5 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform">
            <img src={appLogo} alt="SB Chat Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
            SB Chat
          </span>
        </div>

        {/* Clean Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-purple-200/70">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#demo" className="hover:text-white transition-colors">Live Sandbox</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        {/* Single Sleek Launch App Button */}
        <button
          onClick={handleGoToLogin}
          className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#9333ea] via-[#8b5cf6] to-[#7c3aed] hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
        >
          <span>{isAuthenticated ? 'Open App' : 'Launch App'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Hero Section */}
      <main className="relative z-20 max-w-7xl mx-auto px-6 pt-10 pb-20 flex flex-col items-center text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-200 text-xs font-semibold backdrop-blur-md mb-6 shadow-inner">
          <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
          <span>Real-Time Messaging • HD Voice Calls • End-to-End Privacy</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-5xl leading-[1.1] mb-6">
          Connect Beyond Boundaries with{' '}
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-400 bg-clip-text text-transparent">
            SB Chat
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-purple-200/80 max-w-2xl font-normal leading-relaxed mb-10">
          Experience ultra-fast WebSocket chat delivery, HD audio/video calling, rich attachment sharing, and personalized purple dark mode built for seamless conversation.
        </p>

        {/* Strategic Hero Action CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button
            onClick={handleGoToLogin}
            className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[#9333ea] via-[#8b5cf6] to-[#7c3aed] hover:from-purple-600 hover:to-indigo-600 shadow-[0_0_40px_rgba(147,51,234,0.45)] hover:shadow-[0_0_60px_rgba(168,85,247,0.65)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5"
          >
            <span>{isAuthenticated ? 'Go to Workspace' : 'Get Started'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#demo"
            className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-semibold text-purple-200 bg-white/5 hover:bg-white/10 border border-purple-500/25 backdrop-blur-md hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-purple-400 fill-current" />
            <span>Try Live Sandbox</span>
          </a>
        </div>
      </main>

      {/* Interactive Live Sandbox Demo Section */}
      <section id="demo" className="relative z-20 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Interactive Preview</span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">Test the Live SB Chat Interface</h2>
          <p className="text-xs sm:text-sm text-purple-200/70 mt-2">
            Try typing a message below to test real-time WebSocket delivery simulation directly inside this page!
          </p>
        </div>

        {/* Live Mockup Capsule Container */}
        <div className="w-full rounded-3xl p-3 bg-gradient-to-b from-purple-500/30 via-purple-900/10 to-transparent border border-purple-500/30 shadow-[0_0_80px_rgba(147,51,234,0.25)] backdrop-blur-xl">
          <div className="w-full bg-[#120a21] rounded-2xl overflow-hidden border border-purple-400/20 shadow-2xl flex flex-col md:flex-row min-h-[460px]">
            
            {/* Left Mockup Sidebar */}
            <div className="w-full md:w-72 bg-[#170e2b] p-4 border-r border-purple-900/40 flex flex-col justify-between select-none">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-800/30">
                  <div className="flex items-center gap-2.5">
                    <img src={appLogo} alt="Logo" className="w-7 h-7 object-contain" />
                    <span className="font-bold text-xs text-white">SB Chat Pro</span>
                  </div>
                  <MessageSquarePlus className="w-4 h-4 text-purple-400" />
                </div>

                {/* Tab selector */}
                <div className="flex items-center gap-1 p-1 bg-black/30 rounded-xl mb-4 text-xs font-semibold">
                  <button
                    onClick={() => setDemoTab('chat')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${demoTab === 'chat' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-300/60 hover:text-white'}`}
                  >
                    Chats
                  </button>
                  <button
                    onClick={() => setDemoTab('call')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${demoTab === 'call' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-300/60 hover:text-white'}`}
                  >
                    Calls
                  </button>
                  <button
                    onClick={() => setDemoTab('media')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${demoTab === 'media' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-300/60 hover:text-white'}`}
                  >
                    Media
                  </button>
                </div>

                {/* List items */}
                {demoTab === 'chat' && (
                  <div className="space-y-2">
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-[#9333ea] to-[#7c3aed] text-white flex items-center gap-3 shadow-md">
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs flex-shrink-0">S</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold truncate">Sadasiba</h4>
                          <span className="text-[10px] opacity-80">11:16 AM</span>
                        </div>
                        <p className="text-[11px] opacity-90 truncate">hlo, barsha!</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 text-purple-200/70 flex items-center gap-3 hover:bg-white/10 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-purple-900/60 flex items-center justify-center font-bold text-xs flex-shrink-0">BB</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">Barsha Barik</h4>
                          <span className="text-[10px] text-purple-400 font-semibold">Online</span>
                        </div>
                        <p className="text-[11px] text-purple-300/60 truncate">Active now</p>
                      </div>
                    </div>
                  </div>
                )}

                {demoTab === 'call' && (
                  <div className="p-4 text-center text-xs text-purple-300/70 space-y-3">
                    <PhoneCall className="w-8 h-8 text-purple-400 mx-auto" />
                    <p className="font-semibold text-white">HD Voice & Video Call Log</p>
                    <p className="text-[11px]">Sub-50ms WebRTC voice channels enabled for 1-on-1 calls.</p>
                  </div>
                )}

                {demoTab === 'media' && (
                  <div className="p-4 text-center text-xs text-purple-300/70 space-y-3">
                    <Paperclip className="w-8 h-8 text-fuchsia-400 mx-auto" />
                    <p className="font-semibold text-white">Cloudinary Attachments</p>
                    <p className="text-[11px]">Instant document sharing, images, and voice notes.</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-purple-800/30 text-[11px] text-purple-300/60 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> WebSocket Connected
                </span>
                <Lock className="w-3.5 h-3.5 text-purple-400" />
              </div>
            </div>

            {/* Right Chat Area Sandbox */}
            <div className="flex-1 bg-[#0f071c] p-4 flex flex-col justify-between relative">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">S</div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Sadasiba</h3>
                    <p className="text-[10px] text-purple-400 font-medium">
                      {isTypingSim ? 'typing...' : 'Online'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-purple-300 transition-colors">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-purple-300 transition-colors">
                    <Video className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sandbox Messages Area */}
              <div className="space-y-3 py-4 text-xs overflow-y-auto max-h-[260px] pr-1">
                {demoMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isOutgoing ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl max-w-[80%] break-words ${
                        msg.isOutgoing
                          ? 'bg-gradient-to-br from-[#9333ea] via-[#8b5cf6] to-[#7c3aed] text-white rounded-tr-xs shadow-md shadow-purple-500/20'
                          : 'bg-white/10 text-purple-100 rounded-tl-xs border border-white/10'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                        <span>{msg.time}</span>
                        {msg.isOutgoing && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                      </div>
                    </div>
                  </div>
                ))}
                {isTypingSim && (
                  <div className="p-2 px-3 rounded-2xl bg-white/10 text-purple-300 text-xs w-fit animate-pulse">
                    Sadasiba is typing...
                  </div>
                )}
              </div>

              {/* Interactive Input Form */}
              <form onSubmit={handleSendDemoMessage} className="flex items-center gap-2 p-2 bg-white/5 rounded-full border border-purple-500/30">
                <Smile className="w-4 h-4 text-purple-300/60 ml-2 cursor-pointer" />
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Type a message to test live sandbox..."
                  className="flex-1 text-xs text-white placeholder-purple-300/40 bg-transparent outline-hidden px-1"
                />
                <button
                  type="submit"
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-[#9333ea] to-[#7c3aed] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-white cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="relative z-20 max-w-7xl mx-auto px-6 py-20 border-t border-purple-900/30">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Complete Feature Suite</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-1 mb-4">
            Everything You Need for Communication
          </h2>
          <p className="text-purple-200/70 text-sm sm:text-base">
            Detailed breakdown of all real SB Chat capabilities built into your web platform.
          </p>
        </div>

        {/* Feature Tabs Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Feature Buttons */}
          <div className="lg:col-span-5 space-y-4">
            {featureTabs.map((tab, idx) => (
              <div
                key={idx}
                onClick={() => setActiveFeatureTab(idx)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  activeFeatureTab === idx
                    ? 'bg-white/10 border-purple-500/60 shadow-lg shadow-purple-500/20 translate-x-2'
                    : 'bg-white/5 border-purple-500/15 hover:bg-white/10 text-purple-300/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {tab.icon}
                    <h3 className="text-base font-bold text-white">{tab.title}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                    {tab.badge}
                  </span>
                </div>
                <p className="text-xs text-purple-200/70 leading-relaxed">{tab.desc}</p>
              </div>
            ))}
          </div>

          {/* Right Live Feature Preview Illustration */}
          <div className="lg:col-span-7 p-8 rounded-3xl bg-gradient-to-br from-purple-950/50 via-[#130926] to-[#0c051a] border border-purple-500/30 backdrop-blur-xl shadow-2xl relative min-h-[360px] flex items-center justify-center">
            {activeFeatureTab === 0 && (
              <div className="w-full space-y-4 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
                  <Zap className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white">Sub-50ms Real-Time WebSocket Channel</h4>
                <p className="text-xs text-purple-200/70 max-w-md mx-auto leading-relaxed">
                  Messages, typing notifications, and double checkmark read receipts sync immediately across all connected browser sessions.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
                  <CheckCheck className="w-4 h-4" /> Delivered & Read Instant Status
                </div>
              </div>
            )}

            {activeFeatureTab === 1 && (
              <div className="w-full space-y-4 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-fuchsia-600/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mx-auto">
                  <Video className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white">Integrated 1-on-1 Voice & Video Calling</h4>
                <p className="text-xs text-purple-200/70 max-w-md mx-auto leading-relaxed">
                  Start high-definition WebRTC voice or video calls directly from any contact header with active call overlays and audio toggles.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="p-2.5 rounded-full bg-purple-600 text-white"><Mic className="w-4 h-4" /></span>
                  <span className="p-2.5 rounded-full bg-fuchsia-600 text-white"><Video className="w-4 h-4" /></span>
                  <span className="p-2.5 rounded-full bg-emerald-600 text-white"><Volume2 className="w-4 h-4" /></span>
                </div>
              </div>
            )}

            {activeFeatureTab === 2 && (
              <div className="w-full space-y-4 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white">Rich Attachments & Document Preview</h4>
                <p className="text-xs text-purple-200/70 max-w-md mx-auto leading-relaxed">
                  Send PDF documents, images, voice recordings, location pins, and contact cards with built-in full-screen media viewer.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs">
                  <Paperclip className="w-4 h-4 text-purple-400" /> Cloudinary Media Storage
                </div>
              </div>
            )}

            {activeFeatureTab === 3 && (
              <div className="w-full space-y-4 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white">Bespoke Dark Purple Styling</h4>
                <p className="text-xs text-purple-200/70 max-w-md mx-auto leading-relaxed">
                  Tailored color design system matching your SB logo palette across sidebars, dialogs, inputs, and settings modals.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950 border border-purple-400/30 text-purple-300 text-xs font-semibold">
                  <Moon className="w-4 h-4" /> Dark & Light Mode Toggle
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Security & System Stats Counter */}
      <section id="security" className="relative z-20 max-w-7xl mx-auto px-6 py-16 border-t border-purple-900/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-white/5 border border-purple-500/20 backdrop-blur-md">
            <p className="text-3xl sm:text-5xl font-black text-purple-300 mb-1">99.9%</p>
            <p className="text-[11px] text-purple-200/60 uppercase font-semibold">Socket Uptime</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-purple-500/20 backdrop-blur-md">
            <p className="text-3xl sm:text-5xl font-black text-purple-300 mb-1">&lt;50ms</p>
            <p className="text-[11px] text-purple-200/60 uppercase font-semibold">Latency Speed</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-purple-500/20 backdrop-blur-md">
            <p className="text-3xl sm:text-5xl font-black text-purple-300 mb-1">256-Bit</p>
            <p className="text-[11px] text-purple-200/60 uppercase font-semibold">AES Security</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-purple-500/20 backdrop-blur-md">
            <p className="text-3xl sm:text-5xl font-black text-purple-300 mb-1">100%</p>
            <p className="text-[11px] text-purple-200/60 uppercase font-semibold">Free & Unlimited</p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="relative z-20 max-w-4xl mx-auto px-6 py-20 border-t border-purple-900/30">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Got Questions?</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white/5 border border-purple-500/20 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs sm:text-sm text-purple-200/70 leading-relaxed border-t border-purple-900/30">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Launch Banner */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 py-16">
        <div className="p-10 md:p-14 rounded-3xl bg-gradient-to-r from-purple-950/80 via-[#180a30] to-indigo-950/80 border border-purple-500/40 text-center relative overflow-hidden backdrop-blur-xl shadow-[0_0_80px_rgba(147,51,234,0.3)]">
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              Ready to Start Chatting?
            </h2>
            <p className="text-purple-200/70 text-xs sm:text-sm mb-6">
              Experience the next-generation SB Chat platform today.
            </p>
            <button
              onClick={handleGoToLogin}
              className="px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#9333ea] via-[#8b5cf6] to-[#7c3aed] hover:from-purple-600 hover:to-indigo-600 shadow-xl shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>{isAuthenticated ? 'Open Chat Workspace' : 'Launch Application'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-purple-900/30 py-8 px-6 text-center text-xs text-purple-300/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={appLogo} alt="SB Chat" className="w-6 h-6 object-contain" />
            <span className="font-bold text-white">SB Chat Web Pro</span>
          </div>
          <p>© {new Date().getFullYear()} SB Chat Inc. All rights reserved.</p>
          <button
            onClick={handleGoToLogin}
            className="text-purple-300 hover:text-white font-semibold transition-colors cursor-pointer text-xs"
          >
            Launch App →
          </button>
        </div>
      </footer>
    </div>
  );
};
