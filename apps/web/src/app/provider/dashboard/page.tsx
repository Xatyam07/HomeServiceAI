"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Zap, Wrench, Sparkles, User, MapPin, Clock, Star, 
  DollarSign, Check, X, Bell, Calendar, TrendingUp, 
  ChevronRight, Award, MessageSquare, ShieldCheck, Download, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function ProviderDashboardContent() {
  const { user, logout, token } = useAuth();
  
  // Calendar states
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeJobs, setActiveJobs] = useState<any[]>([
    { id: "HS-9922", customer: "Pankaj Sethi", service: "Plumbing Joint Leakage", address: "Flat 202, Block C, Hill View Apts", time: "Tomorrow, 10:00 AM", fee: "₹450" }
  ]);

  // Earnings history
  const earningsData = [
    { day: "Mon", jobs: 2, amount: 800 },
    { day: "Tue", jobs: 3, amount: 1250 },
    { day: "Wed", jobs: 1, amount: 450 },
    { day: "Thu", jobs: 4, amount: 1900 },
    { day: "Fri", jobs: 3, amount: 1400 },
    { day: "Sat", jobs: 5, amount: 2200 },
    { day: "Sun", jobs: 0, amount: 0 }
  ];

  // Incoming job alert simulation
  const [incomingJob, setIncomingJob] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(25);

  useEffect(() => {
    // Generate an alert after 4 seconds for interactive demo
    const timer = setTimeout(() => {
      setIncomingJob({
        id: "HS-9942",
        customer: "Jane Doe",
        service: "Plumber (Kitchen Leakage)",
        address: "Flat 405, Rainbow Residency, Hitec City",
        distance: "1.8 km away",
        eta: "6 mins travel",
        urgency: "HIGH",
        estimatedFee: "₹850"
      });
      setCountdown(25);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Countdown clock
  useEffect(() => {
    if (!incomingJob) return;
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setIncomingJob(null);
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingJob]);

  const acceptJob = () => {
    // Add to active jobs list
    const newJob = {
      id: incomingJob.id,
      customer: incomingJob.customer,
      service: incomingJob.service,
      address: incomingJob.address,
      time: "Scheduled Now (Emergency SOS)",
      fee: incomingJob.estimatedFee
    };
    setActiveJobs(prev => [newJob, ...prev]);
    setIncomingJob(null);
  };

  const rejectJob = () => {
    setIncomingJob(null);
  };

  // Wallet
  const [walletBalance, setWalletBalance] = useState(4850);
  const [payoutStatus, setPayoutStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  // Professional Verification State
  const workerStatus = user?.status || 'APPROVED';

  const triggerPayout = () => {
    setPayoutStatus('processing');
    setTimeout(() => {
      setWalletBalance(0);
      setPayoutStatus('done');
      setTimeout(() => setPayoutStatus('idle'), 2000);
    }, 1500);
  };

  if (workerStatus === 'PENDING' || workerStatus === 'PENDING_APPROVAL') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center grid-bg p-6 text-center">
        <div className="w-full max-w-lg rounded-2xl glass-premium p-8 border-white/10 glow-primary shadow-2xl flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center animate-pulse">
            <Clock size={36} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Waiting for Admin Approval
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Your professional application is currently undergoing identity audits and certificate verifications. Our support team is auditing your Aadhaar and KYC document logs.
            </p>
          </div>
          <div className="w-full p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-left text-xs flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Applicant:</span>
              <span className="font-semibold text-slate-200">{user?.name || 'Rahul Verma'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service Category:</span>
              <span className="font-semibold text-slate-200">Onboarding Candidate</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Document Checks:</span>
              <span className="font-bold text-yellow-400 animate-pulse">PENDING AUDIT</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 w-full">
            <button 
              onClick={logout}
              className="w-full py-3 bg-red-950/40 hover:bg-red-900/20 text-red-400 border border-red-900/30 font-bold rounded-xl text-sm transition-colors"
            >
              Sign Out
            </button>
            <Link 
              href="/"
              className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-xl text-sm transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="text-xs bg-emerald-950/60 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded-full font-mono font-bold">
              Pro Terminal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Status:</span>
              <button 
                onClick={() => setIsAvailable(!isAvailable)}
                className={`font-extrabold flex items-center gap-1 ${isAvailable ? 'text-emerald-400' : 'text-slate-500'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full bg-current ${isAvailable ? 'animate-ping' : ''}`} />
                <span>{isAvailable ? 'ACTIVE & ACCEPTING' : 'OFFLINE'}</span>
              </button>
            </div>
            
            <button 
              onClick={logout}
              className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/20 text-red-400 border border-red-900/30 flex items-center gap-1 transition-all text-xs font-bold"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>

            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden border border-slate-800">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.split(' ').map((n: string) => n[0]).join('') || 'RP'}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Stats & Earnings (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Dashboard Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/60 flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Month Earnings</span>
              <span className="text-xl font-bold text-emerald-400">₹24,800</span>
              <span className="text-[9px] text-emerald-500 flex items-center gap-0.5">
                <TrendingUp size={10} />
                <span>+12% vs last month</span>
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/60 flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Acceptance Rate</span>
              <span className="text-xl font-bold text-slate-200">97.8%</span>
              <span className="text-[9px] text-indigo-400 font-medium">Top Tier Rating</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/60 flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Customer Rating</span>
              <span className="text-xl font-bold text-slate-200 flex items-center gap-1">
                <span>4.92</span>
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
              </span>
              <span className="text-[9px] text-slate-500">Based on 142 reviews</span>
            </div>
          </div>

          {/* Earnings Custom Graph */}
          <div className="p-6 rounded-2xl glass border border-white/5">
            <div className="flex justify-between items-center pb-4 border-b border-slate-900 mb-6">
              <div>
                <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">Weekly Revenue Analytics</h3>
                <span className="text-[10px] text-slate-500">Interactive revenue payouts per day</span>
              </div>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded-lg">
                Last 7 Days
              </span>
            </div>

            {/* Custom chart using styled SVGs for reliability */}
            <div className="h-48 w-full flex items-end justify-between gap-2.5 pt-4">
              {earningsData.map((d, index) => {
                const maxAmount = 2200;
                const percent = d.amount > 0 ? (d.amount / maxAmount) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] text-slate-400 font-bold font-mono">
                      {d.amount > 0 ? `₹${d.amount}` : '-'}
                    </span>
                    <div className="w-full bg-slate-900 rounded-t-lg overflow-hidden relative" style={{ height: `${percent}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-600 to-cyan-500 hover:opacity-80 transition-opacity rounded-t-lg" />
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Bookings Checklist */}
          <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Assigned Jobs Checklist</h3>
            <div className="flex flex-col gap-3.5">
              {activeJobs.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center gap-1.5">
                  <Wrench size={24} className="opacity-40" />
                  <span>No active schedules. Sit back or toggle active status.</span>
                </div>
              ) : (
                activeJobs.map((job, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-black/25 border border-slate-900 flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Wrench size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-200">{job.service}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">{job.customer} • {job.address}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right gap-1">
                      <span className="text-xs font-bold text-emerald-400">{job.fee}</span>
                      <span className="text-[9px] text-slate-500">{job.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Wallet & Navigation (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Payout Wallet */}
          <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col gap-4">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">My Wallet Payouts</h3>
            
            <div className="p-4 rounded-xl bg-black/20 border border-slate-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">Available Balance</span>
                <span className="text-2xl font-bold text-white mt-1 block">₹{walletBalance}</span>
              </div>
              <button
                onClick={triggerPayout}
                disabled={walletBalance === 0 || payoutStatus !== 'idle'}
                className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {payoutStatus === 'processing' && 'Transferring...'}
                {payoutStatus === 'done' && 'Transferred!'}
                {payoutStatus === 'idle' && 'Instant Cashout'}
              </button>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>Instant Payouts enabled via UPI</span>
              </span>
              <button className="hover:underline flex items-center gap-0.5">
                <Download size={10} />
                <span>Tax Reports (Form 16A)</span>
              </button>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-emerald-950/20 to-cyan-950/20 border border-emerald-900/30 flex gap-4 text-left">
            <Award size={36} className="text-emerald-400 shrink-0" />
            <div className="flex flex-col gap-1.5">
              <h4 className="font-bold text-sm text-slate-200">KYC Status: Verified Gold</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                You have passed all background verification checks, document audits, and have maintained a 98% service reliability rate over the last 90 days.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Floating Incoming Job Alert Simulation Banner */}
      <AnimatePresence>
        {incomingJob && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl glass-premium p-6 border-white/10 glow-primary shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                <div className="flex items-center gap-2 text-red-400">
                  <Zap size={18} className="animate-pulse" />
                  <span className="font-extrabold text-xs tracking-wider uppercase">EMERGENCY JOB DISPATCH</span>
                </div>
                <div className="text-xs font-mono font-bold bg-slate-900 px-2 py-0.5 rounded-md text-cyan-400">
                  Time: {countdown}s
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Requested Service</span>
                    <span className="font-bold text-base text-slate-200">{incomingJob.service}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Estimated Fee</span>
                    <span className="font-extrabold text-sm text-emerald-400 block mt-0.5">{incomingJob.estimatedFee}</span>
                  </div>
                </div>

                <div className="p-3 bg-black/30 border border-slate-900 rounded-xl flex flex-col gap-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <User size={12} />
                    <span>Customer: {incomingJob.customer}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    <span>Location: {incomingJob.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>Travel details: {incomingJob.distance} ({incomingJob.eta})</span>
                  </div>
                </div>

                {/* Accept/Reject triggers */}
                <div className="flex gap-4 mt-3">
                  <button
                    onClick={rejectJob}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all"
                  >
                    Decline Request
                  </button>
                  <button
                    onClick={acceptJob}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Accept Job (Go Live)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProviderDashboard() {
  return (
    <ProtectedRoute allowedRoles={["PROVIDER"]}>
      <ProviderDashboardContent />
    </ProtectedRoute>
  );
}
