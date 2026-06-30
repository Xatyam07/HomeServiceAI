"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Zap, Wrench, Paintbrush, Flame, Cpu, ShieldCheck, 
  MapPin, Clock, ArrowRight, Star, Sun, Moon, 
  MessageSquare, Send, Sparkles, AlertTriangle, Shield, CheckCircle2, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme-provider';

// Popular services configurations
const services = [
  { name: 'Electrician', icon: Zap, desc: 'Short circuits, wiring, switchboards', color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400' },
  { name: 'Plumber', icon: Wrench, desc: 'Leaks, clogged pipes, tap repairs', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400' },
  { name: 'AC Repair', icon: Cpu, desc: 'Gas refilling, compressor repair', color: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400' },
  { name: 'Painting', icon: Paintbrush, desc: 'Full home painting, waterproofing', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400' },
  { name: 'Pest Control', icon: Flame, desc: 'Termite, rodent, bug eradication', color: 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400' },
  { name: 'Babysitter', icon: Shield, desc: 'Certified and verified child care', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400' }
];

const faqs = [
  { q: "How does the AI diagnosis work?", a: "Simply describe your problem in natural language or upload an image. Our neural diagnostic model processes structural anomalies, matches them with historical repairs, and identifies the likely issue, necessary service, urgency, and cost estimate." },
  { q: "Are the service professionals verified?", a: "Yes, every professional undergoes thorough background checks, identity checks, and KYC documentation reviews (such as certification audits) before going active on our network." },
  { q: "How does real-time tracking work?", a: "Once your booking is accepted, you can trace the technician on an interactive map using WebSocket communication showing live coordinates, speeds, and direct chat links." },
  { q: "Are emergency SOS bookings supported?", a: "Absolutely! Toggle 'Emergency SOS' during booking to ping nearby professionals for an immediate turnaround, typically within 15-30 minutes." }
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  
  // AI assistant simulator state
  const [query, setQuery] = useState('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const presets = [
    { text: "My AC isn't cooling and sounds weird.", label: "AC Not Cooling" },
    { text: "The kitchen sink is leaking under the cabinet.", label: "Sink Leaking" },
    { text: "Sparks from my bedroom light switch.", label: "Wiring Spark" }
  ];

  const handleDiagnose = (textToDiagnose: string) => {
    if (!textToDiagnose.trim()) return;
    setIsDiagnosing(true);
    setDiagnosisResult(null);

    // Simulate AI model latency
    setTimeout(() => {
      let result = {
        issue: "General Electrical Overload / Wire Break",
        explanation: "A break in wire insulation or overloaded socket connections. Circuit diagnostics are recommended.",
        service: "Electrician",
        urgency: "MEDIUM",
        complexity: "MODERATE",
        labor: "₹250 - ₹450",
        materials: "₹150 - ₹500",
        duration: "45 mins",
        confidence: "82%"
      };

      const lower = textToDiagnose.toLowerCase();
      if (lower.includes("ac") || lower.includes("cool")) {
        result = {
          issue: "AC Compressor Overheat & Coolant Leakage",
          explanation: "Low refrigerant levels combined with debris inside the condenser coils prevents hot-air compression cycles.",
          service: "AC Repair",
          urgency: "HIGH",
          complexity: "MODERATE",
          labor: "₹500 - ₹950",
          materials: "₹1200 - ₹2800",
          duration: "90 mins",
          confidence: "94%"
        };
      } else if (lower.includes("sink") || lower.includes("leak") || lower.includes("pipe")) {
        result = {
          issue: "P-Trap Joint Corrosion and Blockage",
          explanation: "Accumulated structural grease has clogged the siphon, increasing pressure on rusted compression rings.",
          service: "Plumber",
          urgency: "HIGH",
          complexity: "SIMPLE",
          labor: "₹300 - ₹550",
          materials: "₹250 - ₹800",
          duration: "60 mins",
          confidence: "91%"
        };
      } else if (lower.includes("spark") || lower.includes("switch") || lower.includes("fire")) {
        result = {
          issue: "Switchboard Arcing & Loose Contacts",
          explanation: "Unsecured grounding or contact terminal breakdown causing electrical arcing. Switch off main MCB breaker immediately.",
          service: "Electrician",
          urgency: "EMERGENCY",
          complexity: "MODERATE",
          labor: "₹400 - ₹700",
          materials: "₹300 - ₹900",
          duration: "40 mins",
          confidence: "97%"
        };
      }

      setDiagnosisResult(result);
      setIsDiagnosing(false);
    }, 1500);
  };

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen grid-bg relative">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/10 dark:border-slate-800/50 backdrop-blur-md bg-white/60 dark:bg-slate-900/60 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              HomeSphere <span className="text-indigo-500 font-medium">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#services" className="hover:text-indigo-500 transition-colors">Services</a>
            <a href="#ai-diagnose" className="hover:text-indigo-500 transition-colors">AI Assistant</a>
            <a href="#pricing" className="hover:text-indigo-500 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-indigo-500 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link 
              href="/customer/dashboard"
              className="px-4.5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit"
          >
            <Sparkles size={12} />
            <span>Next-Generation Home Services Platform</span>
          </motion.div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            The Future of <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">Home Care</span>, Diagnosed by AI.
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl">
            Describe your problem or upload photos. Our advanced AI isolates faults instantly, estimates costs, and matches you with top-rated local technicians.
          </p>

          <div className="flex flex-wrap gap-4 mt-2">
            <Link 
              href="/customer/dashboard"
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-xl shadow-indigo-600/25 transition-all flex items-center gap-2 group"
            >
              <span>Explore Dashboard</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#ai-diagnose"
              className="px-6 py-3.5 glass hover:bg-white/10 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-800"
            >
              Test AI Diagnosis
            </a>
          </div>

          <div className="flex gap-8 border-t border-slate-200/10 pt-8 mt-4">
            <div>
              <div className="text-3xl font-extrabold text-indigo-500">98.4%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">AI Diagnostic Match</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-cyan-400">10k+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verified Technicians</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-purple-400">&lt; 30m</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Average Response Time</div>
            </div>
          </div>
        </div>

        {/* AI Assistant Showcase */}
        <div id="ai-diagnose" className="lg:col-span-5">
          <div className="w-full rounded-2xl glass-premium p-6 glow-primary relative overflow-hidden">
            {/* Ambient background blur */}
            <div className="absolute top-[-20%] left-[-20%] w-48 h-48 bg-indigo-500/20 rounded-full filter blur-2xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-48 h-48 bg-cyan-500/10 rounded-full filter blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/10">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">AI Diagnostic Assistant</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Scan & Estimate Faults Instantly</p>
              </div>
            </div>

            {/* Presets chips */}
            <div className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Quick Test Cases:</span>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(preset.text);
                      setSelectedPreset(preset.label);
                      handleDiagnose(preset.text);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      selectedPreset === preset.label
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-white/5 border-slate-200/10 hover:border-slate-300/40 text-slate-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input box */}
            <div className="mt-4 relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe your home service issue (e.g. Toilet is leaking, lights are flashing...)"
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200/10 bg-black/20 focus:bg-black/40 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              />
              <button
                onClick={() => handleDiagnose(query)}
                disabled={isDiagnosing}
                className="absolute bottom-3 right-3 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors disabled:opacity-50"
              >
                {isDiagnosing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>

            {/* Diagnostics Results Container */}
            <div className="mt-4 min-h-[120px] rounded-xl bg-black/30 border border-slate-200/5 p-4 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {isDiagnosing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center gap-3 py-6"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                      <Sparkles size={14} className="absolute inset-0 m-auto text-cyan-400 animate-pulse" />
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Running deep learning diagnostic classification...</div>
                  </motion.div>
                )}

                {!isDiagnosing && !diagnosisResult && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-slate-500 dark:text-slate-400 py-6 text-sm flex flex-col items-center gap-2"
                  >
                    <Wrench size={24} className="opacity-50" />
                    <p>Enter an issue above or click a test case to diagnose.</p>
                  </motion.div>
                )}

                {!isDiagnosing && diagnosisResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">DETECTED ISSUE</span>
                        <span className="font-bold text-sm text-indigo-400 mt-0.5">{diagnosisResult.issue}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        diagnosisResult.urgency === 'EMERGENCY' 
                          ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                          : diagnosisResult.urgency === 'HIGH'
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                          : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                      }`}>
                        {diagnosisResult.urgency}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/5 p-2 rounded-lg border border-white/5">
                      {diagnosisResult.explanation}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800 pt-2">
                      <div>
                        <span className="text-slate-500 block">Recommended Service</span>
                        <span className="font-semibold text-slate-200">{diagnosisResult.service}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Complexity</span>
                        <span className="font-semibold text-slate-200">{diagnosisResult.complexity}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Labor Cost Estimate</span>
                        <span className="font-semibold text-emerald-400">{diagnosisResult.labor}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Material Cost Range</span>
                        <span className="font-semibold text-slate-300">{diagnosisResult.materials}</span>
                      </div>
                    </div>

                    <Link 
                      href="/customer/dashboard?service=Electrician"
                      className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md active:scale-98"
                    >
                      <Zap size={12} />
                      <span>Book Instant Diagnostics Professional</span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section id="services" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200/10">
        <div className="text-center flex flex-col gap-3 max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight">AI-Verified Services</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Select one of our specialized professionals. Every job booking includes micro-level milestones, pricing estimates, and WebSocket coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc, idx) => {
            const Icon = svc.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="p-6 rounded-2xl glass border border-slate-200/10 hover:border-slate-300/20 group cursor-pointer transition-all duration-200 flex items-start gap-4"
              >
                <div className={`p-3 rounded-xl border bg-gradient-to-tr ${svc.color}`}>
                  <Icon size={22} />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors">
                    {svc.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {svc.desc}
                  </p>
                  <Link 
                    href={`/customer/dashboard?service=${svc.name}`}
                    className="text-xs font-semibold text-indigo-400 flex items-center gap-1 mt-2 group-hover:text-indigo-300 transition-colors"
                  >
                    <span>Request AI Estimate</span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left flex flex-col gap-5">
            <h2 className="text-3xl font-extrabold tracking-tight">The Modern SaaS Blueprint for Home Care</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              HomeSphere AI is built for the Indian economy, incorporating digital verification logs, instant UPI payouts, smart tracking networks, and diagnostic modeling to bypass unnecessary repair delays.
            </p>
            
            <div className="flex flex-col gap-3.5 mt-2">
              {[
                { title: "Dynamic Cost Estimation", desc: "No haggling. Receive accurate market cost ranges computed by analyzing material supplies and labor multipliers." },
                { title: "Smart Provider Matching", desc: "Our system evaluates experience records, ratings, coordinates, and feedback tags to locate the optimal provider." },
                { title: "Emergency SOS Protocol", desc: "Need immediate assistance? Switchboards smoking or water bursting? Tap SOS for priority booking dispatch." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <CheckCircle2 size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-200">{item.title}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl glass border border-slate-200/10 flex flex-col gap-3 text-left">
              <ShieldCheck size={32} className="text-indigo-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">KYC Verified</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">Technicians undergo ID checks, physical background verification, and capability mapping.</p>
            </div>
            <div className="p-6 rounded-2xl glass border border-slate-200/10 flex flex-col gap-3 text-left">
              <Clock size={32} className="text-cyan-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Live ETAs</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">Track GPS locations directly via WebSockets to see coordinates and ETA timelines.</p>
            </div>
            <div className="p-6 rounded-2xl glass border border-slate-200/10 flex flex-col gap-3 text-left">
              <MessageSquare size={32} className="text-purple-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Secure Chat</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">Discuss problems, send pictures, and coordinates through our internal sockets chat.</p>
            </div>
            <div className="p-6 rounded-2xl glass border border-slate-200/10 flex flex-col gap-3 text-left">
              <Sparkles size={32} className="text-emerald-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Loyalty Perks</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">Get cashback, referral commissions, and flat discounts on recurring maintenance plans.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20 border-t border-slate-200/10">
        <h2 className="text-3xl font-extrabold text-center tracking-tight mb-12">Frequently Asked Questions</h2>
        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="rounded-xl border border-slate-200/10 dark:bg-slate-900/30 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-5 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-slate-900 dark:text-slate-200 text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="p-5 pt-0 text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed border-t border-slate-800/10 dark:border-slate-800/30">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* App Download / Action Block */}
      <section className="max-w-7xl mx-auto px-6 py-16 mb-20">
        <div className="rounded-3xl glass-premium p-8 sm:p-12 glow-primary border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="text-left flex flex-col gap-4 max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight">Need urgent assistance?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Launch our emergency dispatch flow to find an available local professional in seconds. No upfront credit card is required.
            </p>
            <div className="flex gap-4 mt-2">
              <Link
                href="/customer/dashboard"
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center gap-1.5 active:scale-95"
              >
                <AlertTriangle size={16} />
                <span>Launch Emergency SOS Dispatch</span>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block relative w-72 h-44 rounded-xl border border-slate-700/50 bg-black/40 overflow-hidden shadow-2xl p-4">
            <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-800">
              <span>Technician Active Track</span>
              <span className="text-indigo-400 animate-pulse">● LIVE</span>
            </div>
            <div className="mt-3 flex gap-2.5 items-center">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-white">
                RP
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-slate-300">Ramesh Patel (Plumber)</span>
                <span className="text-[9px] text-slate-500">Departed • 2.1 km away</span>
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-indigo-500 rounded-full animate-pulse" />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
              <span>ETA: 7 mins</span>
              <span className="text-emerald-400">92% Match Score</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/10 dark:border-slate-800/50 py-12 dark:bg-black/40">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-4 gap-8 text-left text-sm text-slate-600 dark:text-slate-400">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-500" />
              <span className="font-extrabold text-slate-900 dark:text-white">HomeSphere AI</span>
            </div>
            <p className="text-xs leading-relaxed">
              Automating home maintenance matching and diagnostics with high-fidelity ML infrastructure.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white mb-3 text-xs tracking-widest uppercase">Roles</h5>
            <div className="flex flex-col gap-2 text-xs">
              <Link href="/customer/dashboard" className="hover:text-indigo-400 transition-colors">Customer Portal</Link>
              <Link href="/provider/dashboard" className="hover:text-indigo-400 transition-colors">Professional Portal</Link>
              <Link href="/admin/dashboard" className="hover:text-indigo-400 transition-colors">Admin Console</Link>
            </div>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white mb-3 text-xs tracking-widest uppercase">AI Tech Stack</h5>
            <div className="flex flex-col gap-2 text-xs">
              <span className="text-slate-500">Diagnosis: NLP Classifier</span>
              <span className="text-slate-500">Matching: Dynamic Distance Scoring</span>
              <span className="text-slate-500">Estimation: Dynamic Multiplier</span>
            </div>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white mb-3 text-xs tracking-widest uppercase">Office</h5>
            <p className="text-xs leading-relaxed text-slate-500">
              Level 4, Cyber Towers, Hitec City, Hyderabad, Telangana, India.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-500 border-t border-slate-200/10 dark:border-slate-800/20 pt-6 mt-8">
          © {new Date().getFullYear()} HomeSphere AI. Pair programmed with Antigravity.
        </div>
      </footer>
    </div>
  );
}
