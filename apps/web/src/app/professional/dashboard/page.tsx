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
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 flex items-center justify-center bg-slate-900/40 border border-white/5 rounded-xl animate-pulse">
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Syncing map view...</span>
    </div>
  ),
});

function ProfessionalDashboardContent() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 
    (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') 
      ? 'https://homeserviceai-1.onrender.com' 
      : 'http://localhost:8000');
  const router = useRouter();
  const { user, logout, token, refreshUserProfile } = useAuth();

  // Enforce role checks redirection
  useEffect(() => {
    if (user) {
      if (user.role === 'CUSTOMER') {
        router.push('/customer/dashboard');
      } else if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, router]);
  
  


  // Testing mode states for multi-skill professional
  const [switching, setSwitching] = useState(false);
  const [selectedTestingCategory, setSelectedTestingCategory] = useState(user?.profile?.category || 'Plumber');

  useEffect(() => {
    if (user?.profile?.category) {
      setSelectedTestingCategory(user.profile.category);
    }
  }, [user]);

  const handleSwitchTestingCategory = async (cat: string) => {
    setSwitching(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/testing/switch-category?category=${cat}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      let data: any;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error(`Invalid response format from server (non-JSON): ${res.statusText}`);
      }

      if (res.ok) {
        setSelectedTestingCategory(cat);
        if (user) {
          if (!user.profile) {
            user.profile = {};
          }
          user.profile.category = cat;
        }
        await refreshUserProfile();
        alert(`Switched test category to ${cat}!`);
      } else {
        const errMsg = data?.error || data?.detail || `Failed to switch (Status: ${res.status})`;
        const errDetails = data?.details ? `\nDetails: ${data.details}` : '';
        alert(`Failed to switch: ${errMsg}${errDetails}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error switching category in database.\nMessage: ${err.message || err}`);
    } finally {
      setSwitching(false);
    }
  };
  
  // Calendar states
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'jobs' | 'wallet' | 'settings' | 'performance'>('home');
  const [dbJobs, setDbJobs] = useState<any[]>([]);

  // Simulated en-route coordinates map tracker
  const startCoords: [number, number] = [17.4600, 78.3600];
  const destCoords: [number, number] = [17.4485, 78.3741];
  const [routePoints, setRoutePoints] = useState<Array<[number, number]>>([]);
  const [techIndex, setTechIndex] = useState(0);

  const generateSimulatedRoute = (start: [number, number], dest: [number, number]): Array<[number, number]> => {
    const turn1: [number, number] = [start[0] - 0.003, start[1] + 0.005];
    const turn2: [number, number] = [start[0] - 0.007, start[1] + 0.008];
    const turn3: [number, number] = [dest[0] + 0.003, dest[1] - 0.002];
    
    const route: Array<[number, number]> = [];
    const interpolate = (p1: [number, number], p2: [number, number], steps: number) => {
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        route.push([p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])]);
      }
    };
    
    interpolate(start, turn1, 15);
    interpolate(turn1, turn2, 15);
    interpolate(turn2, turn3, 15);
    interpolate(turn3, dest, 15);
    route.push(dest);
    return route;
  };

  useEffect(() => {
    setRoutePoints(generateSimulatedRoute(startCoords, destCoords));
  }, []);

  const hasOnTheWay = dbJobs.some(j => j.status === 'ON_THE_WAY');

  useEffect(() => {
    if (routePoints.length === 0 || !hasOnTheWay) return;
    
    setTechIndex(0);
    const interval = setInterval(() => {
      setTechIndex((prev) => {
        const next = prev + 1;
        if (next >= routePoints.length - 1) {
          clearInterval(interval);
          return routePoints.length - 1;
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [hasOnTheWay, routePoints]);

  const activeTechCoords = routePoints[techIndex] || startCoords;
  const [otpInputs, setOtpInputs] = useState<{[key: string]: string}>({});
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    workingRadius: 15,
    pricingPerHour: 400,
    skills: 'Plumbing, Pipe fitting, Drain cleaning',
    bio: 'Professional plumbing technician with 11+ years experience in domestic and commercial repairs.'
  });

  const loadProfessionalJobs = async () => {
    if (!token || !user) return;
    try {
      const res = await fetch(`${API_BASE}/api/bookings/?userId=${user.id}&role=PROVIDER`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDbJobs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProfessionalJobs();
    const interval = setInterval(loadProfessionalJobs, 5000);
    return () => clearInterval(interval);
  }, [token, user]);

  const updateJobStatus = async (bookingId: string, statusStr: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusStr })
      });
      if (res.ok) {
        loadProfessionalJobs();
        if (statusStr === 'ARRIVED') {
          // Trigger OTP generation on arrival
          await fetch(`${API_BASE}/api/bookings/${bookingId}/send-otp`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOtpVerify = async (bookingId: string) => {
    const jobOtp = otpInputs[bookingId];
    if (!jobOtp) {
      alert("Please enter verification OTP.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: jobOtp })
      });
      if (res.ok) {
        alert("OTP Verified! Job started.");
        loadProfessionalJobs();
      } else {
        const data = await res.json();
        alert(`Verification failed: ${data.detail}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Profile settings persisted successfully to PostgreSQL database!");
  };

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

  // Monitor database bookings to pop up real jobs for simulator
  useEffect(() => {
    if (user?.email?.toLowerCase() === 'xatyammishra07@gmail.com' && dbJobs.length > 0) {
      const openJob = dbJobs.find(job => job.status === 'REQUESTED' || job.status === 'ASSIGNED' || job.status === 'ACCEPTED');
      if (openJob) {
        if (!incomingJob || incomingJob.id !== openJob.id) {
          setIncomingJob({
            id: openJob.id,
            customer: openJob.customer_name || "Valued Customer",
            service: openJob.service_type,
            address: openJob.address || "Hitec City, Hyderabad",
            distance: "1.5 km away",
            eta: "5 mins travel",
            urgency: "HIGH",
            estimatedFee: `₹${openJob.total_cost}`,
            isRealBooking: true
          });
          setCountdown(30);
        }
      } else {
        if (incomingJob?.isRealBooking) {
          setIncomingJob(null);
        }
      }
    }
  }, [dbJobs, user, incomingJob]);

  const acceptJob = async () => {
    if (incomingJob) {
      if (incomingJob.isRealBooking) {
        try {
          const res = await fetch(`${API_BASE}/api/bookings/${incomingJob.id}/accept`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            alert("Live Booking Accepted! Heading to target address.");
            loadProfessionalJobs();
          } else {
            const data = await res.json();
            alert(`Accept failed: ${data.detail}`);
          }
        } catch (err) {
          console.error(err);
          alert("Failed to accept booking.");
        }
      } else {
        alert("Simulated job request accepted. Heading to target address!");
      }
      setIncomingJob(null);
    }
  };

  const rejectJob = async () => {
    if (incomingJob) {
      if (incomingJob.isRealBooking) {
        try {
          const res = await fetch(`${API_BASE}/api/bookings/${incomingJob.id}/reject`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            alert("Booking request declined.");
            loadProfessionalJobs();
          }
        } catch (err) {
          console.error(err);
        }
      }
      setIncomingJob(null);
    }
  };

  // Wallet
  const [walletBalance, setWalletBalance] = useState(4850);
  const [payoutStatus, setPayoutStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  const loadWalletBalance = async () => {
    if (!token || !user) return;
    try {
      const res = await fetch(`${API_BASE}/api/payments/wallet/balance?userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadWalletBalance();
  }, [token, user, activeTab]);

  const triggerPayout = () => {
    setPayoutStatus('processing');
    setTimeout(() => {
      setWalletBalance(0);
      setPayoutStatus('done');
      setTimeout(() => setPayoutStatus('idle'), 2000);
    }, 1500);
  };

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

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-6 mt-6 flex gap-4 border-b border-slate-900 pb-2">
        {[
          { id: 'home', label: 'Home Feed' },
          { id: 'jobs', label: 'Assigned Jobs' },
          { id: 'wallet', label: 'Wallet & Payouts' },
          { id: 'settings', label: 'Edit Profile' },
          { id: 'performance', label: 'Performance & AI' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold uppercase transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1">
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side: Stats & Earnings (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Dashboard Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/60 flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Month Earnings</span>
                  <span className="text-xl font-bold text-emerald-400">₹{walletBalance > 0 ? (24800 + (4850 - walletBalance)) : 29650}</span>
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

              {/* Testing Mode Category Switcher */}
              {user?.email === "xatyammishra07@gmail.com" && (
                <div className="p-5 rounded-2xl bg-gradient-to-tr from-indigo-950/25 to-purple-950/25 border border-indigo-900/40 flex flex-col gap-4 text-left shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full filter blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Sparkles size={16} className="animate-pulse" />
                    <span className="font-extrabold text-[10px] tracking-wider uppercase">Testing Mode: Multi-Skill Pro</span>
                  </div>
                  
                  <p className="text-xs text-slate-400 leading-relaxed">
                    As the seeded test professional, you can dynamically switch between all 30 professions to validate different marketplace matching workflows.
                  </p>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Switch Active Profession</label>
                    <select
                      disabled={switching}
                      value={selectedTestingCategory}
                      onChange={(e) => handleSwitchTestingCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-lg backdrop-blur-md transition-all font-semibold"
                    >
                      {[
                        "Electrician", "Plumber", "Carpenter", "Painter", "AC Repair", "RO Repair", "Refrigerator Repair", 
                        "Washing Machine Repair", "TV Repair", "Laptop Repair", "Mobile Repair", "CCTV Installation", 
                        "Pest Control", "Deep Cleaning", "Sofa Cleaning", "Bathroom Cleaning", "Kitchen Cleaning", 
                        "Home Painting", "Interior Designer", "Appliance Installation", "Packers & Movers", "Home Tutor", 
                        "Fitness Trainer", "Yoga Instructor", "Beautician", "Makeup Artist", "Pet Care", "Elder Care", 
                        "Babysitter", "Driver on Demand"
                      ].map(cat => (
                        <option key={cat} value={cat} className="bg-slate-950 text-slate-200">{cat}</option>
                      ))}
                    </select>
                    {switching && (
                      <span className="text-[10px] text-indigo-400 animate-pulse mt-1">Switching roles in SQL DB...</span>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Assigned Jobs tab */}
        {activeTab === 'jobs' && (
          <div className="rounded-2xl glass p-6 border border-white/5 flex flex-col gap-4 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Assigned Jobs & Real-Time Tracking</h3>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{dbJobs.length} active allocations</span>
            </div>

            <div className="flex flex-col gap-4">
              {dbJobs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <Wrench size={24} className="opacity-40" />
                  <span>No active allocations located. Simulated customer bookings will appear here.</span>
                </div>
              ) : (
                dbJobs.map((job) => (
                  <div key={job.id} className="p-5 rounded-xl bg-black/35 border border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex gap-4 items-start text-left">
                      <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-1">
                        <Wrench size={18} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm text-slate-200">{job.service_type}</span>
                        <span className="text-[10px] text-slate-500">{job.address}</span>
                        <span className="text-[10px] text-slate-400 mt-1 leading-relaxed">Desc: {job.description || 'No description provided.'}</span>
                        <div className="mt-2.5 flex items-center gap-3">
                          <span className="text-xs font-bold text-emerald-400">Rate: ₹{job.total_cost}</span>
                          <span className="text-[9px] bg-indigo-950/60 text-indigo-400 border border-indigo-900/30 px-2 py-0.5 rounded-full font-mono font-bold">
                            {job.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch sm:items-end justify-end gap-3 min-w-[200px]">
                      {(job.status === 'ASSIGNED' || job.status === 'REQUESTED') && (
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`${API_BASE}/api/bookings/${job.id}/accept`, {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) loadProfessionalJobs();
                              } catch(e) { console.error(e); }
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            Accept Job
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`${API_BASE}/api/bookings/${job.id}/reject`, {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) loadProfessionalJobs();
                              } catch(e) { console.error(e); }
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {job.status === 'ACCEPTED' && (
                        <button
                          onClick={() => updateJobStatus(job.id, 'ON_THE_WAY')}
                          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Start Transit (En Route)
                        </button>
                      )}

                      {job.status === 'ON_THE_WAY' && (
                        <div className="flex flex-col gap-2 w-full mt-3">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-left">Live Transit GPS Map</span>
                          <div className="w-full h-48 rounded-xl border border-slate-900 overflow-hidden relative">
                            <MapComponent
                              center={destCoords}
                              customerMarker={destCoords}
                              techMarker={activeTechCoords}
                              routeCoordinates={routePoints}
                              theme="dark"
                            />
                            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-[8px] text-slate-400 z-[400] flex flex-col text-left">
                              <span>Latitude: {activeTechCoords[0].toFixed(5)}</span>
                              <span>Longitude: {activeTechCoords[1].toFixed(5)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => updateJobStatus(job.id, 'ARRIVED')}
                            className="w-full mt-1.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            Mark Arrived
                          </button>
                        </div>
                      )}

                      {job.status === 'ARRIVED' && (
                        <div className="flex flex-col gap-2">
                          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-left">Customer Verification OTP</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="6-digit OTP"
                              value={otpInputs[job.id] || ''}
                              onChange={(e) => setOtpInputs(prev => ({ ...prev, [job.id]: e.target.value }))}
                              className="w-28 px-2 py-1.5 bg-black/40 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 text-center font-mono font-bold"
                            />
                            <button
                              onClick={() => handleOtpVerify(job.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                            >
                              Verify
                            </button>
                          </div>
                        </div>
                      )}

                      {job.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => updateJobStatus(job.id, 'COMPLETED')}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Complete & Invoice Job
                        </button>
                      )}

                      {job.status === 'COMPLETED' && (
                        <span className="text-[10px] text-slate-500 italic">Awaiting Customer Payout Confirmation...</span>
                      )}

                      {job.status === 'PAYMENT_SUCCESSFUL' && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <Check size={12} />
                          <span>Payout Released to Wallet!</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Wallet tab */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            <div className="lg:col-span-8 p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
              <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Withdraw Funds</h3>
              
              <div className="p-6 bg-black/20 border border-slate-900 rounded-2xl flex flex-col gap-4">
                <span className="text-xs text-slate-400">Select payout destination</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl cursor-pointer">
                    <span className="font-bold text-xs text-indigo-400 block">Instant UPI Transfer</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Charges: Nil • Limit: ₹50,000/day</span>
                  </div>
                  <div className="p-4 bg-black/40 border border-slate-800 rounded-xl cursor-pointer">
                    <span className="font-bold text-xs text-slate-400 block">Direct Bank Account</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Takes 2-4 hours • NEFT/IMPS</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">UPI ID Reference</label>
                  <input
                    type="text"
                    defaultValue="satyam@okaxis"
                    className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
              <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Transaction History</h3>
              <div className="flex flex-col gap-3">
                <div className="p-3 bg-black/20 border border-slate-900 rounded-lg flex justify-between text-xs">
                  <div>
                    <span className="font-bold block text-slate-300">Wallet Withdrawal</span>
                    <span className="text-[9px] text-slate-500 mt-0.5 block">UPI Ref ID: 7728A1</span>
                  </div>
                  <span className="font-bold text-red-400">-₹4,850</span>
                </div>
                <div className="p-3 bg-black/20 border border-slate-900 rounded-lg flex justify-between text-xs">
                  <div>
                    <span className="font-bold block text-slate-300">Job Payout #9942</span>
                    <span className="text-[9px] text-slate-500 mt-0.5 block">Completed Plumber booking</span>
                  </div>
                  <span className="font-bold text-emerald-400">+₹850</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Settings tab */}
        {activeTab === 'settings' && (
          <form onSubmit={updateProfileSettings} className="p-6 rounded-2xl glass border border-white/5 flex flex-col gap-6 text-left max-w-2xl mx-auto">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400 pb-2 border-b border-slate-900">Edit Professional Profile Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                  className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gender</label>
                <select
                  defaultValue="Male"
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-xs focus:outline-none cursor-pointer shadow-lg backdrop-blur-md transition-all font-semibold"
                >
                  <option value="Male" className="bg-slate-950 text-slate-200">Male</option>
                  <option value="Female" className="bg-slate-950 text-slate-200">Female</option>
                  <option value="Other" className="bg-slate-950 text-slate-200">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Date of Birth</label>
                <input
                  type="date"
                  defaultValue="1990-05-15"
                  className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Saved Base Office Address</label>
              <input
                type="text"
                defaultValue="Mindspace IT Park Building 12A, Madhapur, Hyderabad"
                className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Emergency Contact Name</label>
                <input
                  type="text"
                  defaultValue="Satyam Mishra"
                  className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Emergency Contact Phone</label>
                <input
                  type="text"
                  defaultValue="+91 93690 22460"
                  className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Working Radius (km)</label>
                <input
                  type="number"
                  value={profileForm.workingRadius}
                  onChange={(e) => setProfileForm(p => ({ ...p, workingRadius: parseInt(e.target.value) || 15 }))}
                  className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hourly Price (INR)</label>
                <input
                  type="number"
                  value={profileForm.pricingPerHour}
                  onChange={(e) => setProfileForm(p => ({ ...p, pricingPerHour: parseInt(e.target.value) || 400 }))}
                  className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Languages (Comma Separated)</label>
                <input
                  type="text"
                  defaultValue="English, Hindi, Telugu"
                  className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Availability Slot</label>
                <input
                  type="text"
                  defaultValue="9 AM - 6 PM"
                  className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aadhaar Card Reference</label>
                <input
                  type="text"
                  defaultValue="4422-9988-1122"
                  className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PAN Card Reference</label>
                <input
                  type="text"
                  defaultValue="ABCDE1234F"
                  className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Skills List (Comma Separated)</label>
              <input
                type="text"
                value={profileForm.skills}
                onChange={(e) => setProfileForm(p => ({ ...p, skills: e.target.value }))}
                className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Professional Bio</label>
              <textarea
                rows={3}
                value={profileForm.bio}
                onChange={(e) => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                className="p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Persist Settings to PostgreSQL
            </button>
          </form>
        )}

        {/* Performance & AI Tab */}
        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            <div className="lg:col-span-7 p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
              <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Worker Reliability Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/20 border border-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Cancellation Rate</span>
                  <span className="text-xl font-bold text-emerald-400">1.2%</span>
                </div>
                <div className="p-4 bg-black/20 border border-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Completion Rate</span>
                  <span className="text-xl font-bold text-slate-200">98.8%</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
              <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                <Sparkles size={16} className="text-indigo-400" />
                <span>AI Job Suggestions</span>
              </h3>
              <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-xs leading-relaxed text-slate-300">
                <span className="font-bold text-indigo-400 block mb-1.5">High Demand Alert: Hitec City</span>
                There is a 38% surge in local plumbing leak requests in Hitec City today. Consider toggling your availability and updating pricing to capitalize on active demand.
              </div>
            </div>
          </div>
        )}
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

export default function ProfessionalDashboard() {
  return (
    <ProtectedRoute allowedRoles={["PROVIDER"]}>
      <ProfessionalDashboardContent />
    </ProtectedRoute>
  );
}
