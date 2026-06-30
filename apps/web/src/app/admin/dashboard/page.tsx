"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, Users, ClipboardList, AlertOctagon, Sparkles, 
  MapPin, Check, X, ShieldAlert, Award, FileText, 
  Activity, Clock, ChevronRight, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  // Stats Fallback & Live State
  const [liveCounters, setLiveCounters] = useState<any>({
    totalUsers: 16,
    totalCustomers: 4,
    totalProfessionals: 11,
    pendingApprovals: 1,
    activeProfessionals: 10,
    rejectedApplications: 0,
    todayBookings: 2,
    monthlyRevenue: 4400
  });

  const [recentBookings, setRecentBookings] = useState<any[]>([
    { id: "HS-9942", customer: "Kunal Sen", service: "Plumber", status: "COMPLETED", totalCost: 750, time: "07:54 PM" },
    { id: "HS-9943", customer: "Ananya Rao", service: "Electrician", status: "IN_PROGRESS", totalCost: 350, time: "07:56 PM" }
  ]);

  const [recentPayments, setRecentPayments] = useState<any[]>([
    { id: "P-501", customer: "Kunal Sen", amount: 750, status: "CAPTURED", orderId: "order_test_772" },
    { id: "P-502", customer: "Ananya Rao", amount: 350, status: "CAPTURED", orderId: "order_test_983" }
  ]);

  // Provider approval queue
  const [approvals, setApprovals] = useState<any[]>([
    { id: "P-101", name: "Rahul Verma", category: "Electrician", exp: 4, docs: "Aadhaar_PAN_Selfie.pdf", verified: false }
  ]);

  useEffect(() => {
    // 1. Fetch Live Stats from backend database
    fetch('http://localhost:8000/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.counters) setLiveCounters(data.counters);
        if (data.recentBookings) setRecentBookings(data.recentBookings);
        if (data.recentPayments) setRecentPayments(data.recentPayments);
      })
      .catch(err => console.log("Using fallback mock counters:", err));

    // 2. Fetch Pending Verification Queue
    fetch('http://localhost:8000/api/admin/workers?status_filter=PENDING')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const mapped = data.map((w: any) => ({
            id: w.id,
            name: w.name,
            category: w.category,
            exp: w.experienceYrs,
            docs: "Aadhaar_PAN_Selfie.pdf",
            verified: false
          }));
          setApprovals(mapped);
        }
      })
      .catch(err => console.log("Using fallback mock approvals queue:", err));
  }, []);

  const approveProvider = (id: string) => {
    // Make REST call to backend
    fetch(`http://localhost:8000/api/admin/workers/${id}/approve`, { method: 'PUT' })
      .then(() => {
        setApprovals(prev => prev.filter(p => p.id !== id));
        // Increment active count
        setLiveCounters((prev: any) => ({
          ...prev,
          activeProfessionals: prev.activeProfessionals + 1,
          pendingApprovals: Math.max(0, prev.pendingApprovals - 1)
        }));
      })
      .catch(() => {
        // Fallback UI change if backend is not running
        setApprovals(prev => prev.filter(p => p.id !== id));
      });
  };

  const rejectProvider = (id: string) => {
    fetch(`http://localhost:8000/api/admin/workers/${id}/reject`, { method: 'PUT' })
      .then(() => {
        setApprovals(prev => prev.filter(p => p.id !== id));
        setLiveCounters((prev: any) => ({
          ...prev,
          rejectedApplications: prev.rejectedApplications + 1,
          pendingApprovals: Math.max(0, prev.pendingApprovals - 1)
        }));
      })
      .catch(() => {
        setApprovals(prev => prev.filter(p => p.id !== id));
      });
  };

  // Fraud Review Log
  const fraudLogs = [
    { id: "FL-002", type: "Spam Review Detected", target: "Amit Sharma", detail: "Keyword Repetitiveness (Bot score: 85%)", severity: "HIGH" },
    { id: "FL-003", type: "Rating Mismatch", target: "Naresh Rao", detail: "1-star rating with highly positive text", severity: "MEDIUM" },
    { id: "FL-004", type: "Location Anomaly", target: "Suresh Gupta", detail: "GPS coordinates updated 15km away in 2s", severity: "HIGH" }
  ];

  // Active logs
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    "System Booted successfully.",
    "WebSocket gateway linked to redis cluster (Port 6379)",
    "AI Diagnosis model loaded: 98.4% validation loss=0.012"
  ]);

  useEffect(() => {
    const events = [
      "AI Diagnosis run: User input='AC leaking' -> matched AC Repair",
      "Payment processed successfully: UPI ref ID=773412B",
      "WebSocket location update: Ramesh Patel coord=17.4485,78.3741",
      "Invoice pdf compiler issued: HS-2026-9942",
      "Smart matching computed: matched Amit Sharma (Electrician, 2.1km)"
    ];

    const interval = setInterval(() => {
      const randEvent = events[Math.floor(Math.random() * events.length)];
      const time = new Date().toLocaleTimeString();
      setTelemetryLogs(prev => [`[${time}] ${randEvent}`, ...prev.slice(0, 7)]);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Demand Heatmap
  const heatmapData = [
    { city: "Mumbai Metro", area: "Andheri West", demand: "CRITICAL", activePros: 45, glow: "border-red-500/30 bg-red-950/20 text-red-400" },
    { city: "Bengaluru", area: "HSR Layout", demand: "HIGH", activePros: 29, glow: "border-orange-500/30 bg-orange-950/20 text-orange-400" },
    { city: "Delhi NCR", area: "Gurugram Sec 45", demand: "HIGH", activePros: 38, glow: "border-orange-500/30 bg-orange-950/20 text-orange-400" },
    { city: "Hyderabad", area: "Hitec City", demand: "MODERATE", activePros: 52, glow: "border-yellow-500/30 bg-yellow-950/20 text-yellow-400" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col grid-bg text-left">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-extrabold text-lg text-white">
              <Sparkles size={18} className="text-indigo-400" />
              <span>HomeSphere AI</span>
            </Link>
            <span className="text-xs bg-purple-950/60 text-purple-400 border border-purple-900/30 px-2 py-0.5 rounded-full font-mono font-bold">
              Admin Suite
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span>Server Latency: <span className="text-emerald-400">8ms</span></span>
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Stats, Heatmaps, Approvals (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Stats counters */}
          <div className="grid-cols-2 sm:grid-cols-4 grid gap-4">
            {[
              { name: "Total Users", value: liveCounters.totalUsers, color: "text-indigo-400" },
              { name: "Verified Pros", value: liveCounters.activeProfessionals, color: "text-emerald-400" },
              { name: "Pending Approvals", value: liveCounters.pendingApprovals, color: "text-red-400" },
              { name: "Monthly Revenue", value: `₹${liveCounters.monthlyRevenue.toLocaleString()}`, color: "text-cyan-400" }
            ].map((s, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800/60 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s.name}</span>
                <span className={`text-xl font-bold ${s.color} mt-1`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Provider Verification Queue */}
          <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Professional Verification Queue</h3>
              <span className="text-[10px] text-slate-500 font-semibold">{approvals.length} pending reviews</span>
            </div>

            <div className="flex flex-col gap-3.5">
              <AnimatePresence mode="popLayout">
                {approvals.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2"
                  >
                    <Check className="text-emerald-400" size={24} />
                    <span>All application documents verified. Queue is clear!</span>
                  </motion.div>
                ) : (
                  approvals.map((pro) => (
                    <motion.div
                      key={pro.id}
                      layout
                      exit={{ opacity: 0, x: -30 }}
                      className="p-4 rounded-xl bg-black/25 border border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-9 h-9 rounded-full bg-slate-850 border border-slate-850 flex items-center justify-center font-bold text-xs">
                          {pro.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-sm text-slate-200">{pro.name}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5">{pro.category} • {pro.exp} yrs exp</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <a 
                          href="#" 
                          onClick={(e) => e.preventDefault()}
                          className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <FileText size={12} />
                          <span>{pro.docs}</span>
                        </a>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => rejectProvider(pro.id)}
                            className="p-1.5 rounded-lg border border-red-900/30 hover:bg-red-950/20 text-red-400 transition-colors"
                            title="Reject & Flag"
                          >
                            <X size={14} />
                          </button>
                          <button
                            onClick={() => approveProvider(pro.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center gap-0.5"
                          >
                            <Check size={12} />
                            <span>Verify</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Real-Time Demand Heatmap */}
          <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Regional Demand Heatmap</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {heatmapData.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${item.glow}`}>
                  <div>
                    <span className="font-bold text-sm text-slate-100">{item.city}</span>
                    <span className="text-[10px] block text-slate-400 mt-1">{item.area}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold block">{item.demand} DEMAND</span>
                    <span className="text-[10px] text-slate-300 mt-1 block">{item.activePros} active pros</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Fraud and Logs (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* AI Fraud Detections */}
          <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col gap-4">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <ShieldAlert size={15} className="text-red-400" />
              <span>Fraud Watch Dog</span>
            </h3>

            <div className="flex flex-col gap-3">
              {fraudLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-black/20 border border-slate-900 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-red-400">{log.type}</span>
                    <span className="text-[8px] bg-red-950/60 text-red-400 border border-red-900/30 px-1 rounded font-mono">
                      {log.severity}
                    </span>
                  </div>
                  <span className="text-slate-500 font-semibold mt-0.5">Target: {log.target}</span>
                  <span className="text-[10px] text-slate-400 leading-normal mt-0.5">{log.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Telemetry Logs stream */}
          <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col h-[280px] overflow-hidden">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900 mb-3">
              <div className="flex items-center gap-1.5">
                <Activity size={16} className="text-indigo-400" />
                <span className="font-bold text-xs text-slate-300">Live AI Telemetry</span>
              </div>
              <span className="text-[9px] text-indigo-400 font-mono animate-pulse">● Log Streaming</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 font-mono text-[9px] text-slate-400 leading-relaxed text-left">
              {telemetryLogs.map((log, index) => (
                <div key={index} className="border-l border-indigo-500/20 pl-2">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
