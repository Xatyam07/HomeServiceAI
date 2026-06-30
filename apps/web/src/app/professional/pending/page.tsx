"use client";

import React from 'react';
import Link from 'next/link';
import { Clock, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function ProfessionalPendingContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center grid-bg p-6 text-center">
      <div className="w-full max-w-lg rounded-3xl glass-premium p-8 border border-white/10 glow-primary shadow-2xl flex flex-col items-center gap-6 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 animate-pulse">
          <Clock size={36} />
        </div>
        
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Awaiting Admin Approval
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            Your professional application is currently undergoing verification audits. Our support team is auditing your Aadhaar and KYC logs.
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
            <span className="text-slate-500">Audit Status:</span>
            <span className="font-bold text-yellow-400 animate-pulse">PENDING AUDIT</span>
          </div>
        </div>

        <div className="p-3 bg-red-950/25 border border-red-900/40 rounded-xl text-xs text-red-400 text-left font-medium leading-relaxed">
          Your account is awaiting Admin Approval. Dashboard functionality (accepting jobs, bookings, wallet, messaging, and coordinates mapping) is locked until approved.
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          <button 
            onClick={logout}
            className="w-full py-3 bg-red-950/40 hover:bg-red-900/20 text-red-400 border border-red-900/30 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
          <Link 
            href="/"
            className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-xl text-sm transition-colors block"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProfessionalPendingPage() {
  return (
    <ProtectedRoute allowedRoles={["PROVIDER"]}>
      <ProfessionalPendingContent />
    </ProtectedRoute>
  );
}
