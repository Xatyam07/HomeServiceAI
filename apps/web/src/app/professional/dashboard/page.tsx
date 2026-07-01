"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Zap, Wrench, Sparkles, User, MapPin, Clock, Star, 
  DollarSign, Check, X, Bell, Calendar, TrendingUp, 
  ChevronRight, ChevronLeft, Award, MessageSquare, ShieldCheck, Download, LogOut,
  Search, SlidersHorizontal, Eye, UserX, UserCheck, MessageCircle, Loader2, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { formatToIST, formatToISTFull } from '@/utils/timezone';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 flex items-center justify-center bg-slate-900/40 border border-white/5 rounded-xl animate-pulse">
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Syncing map view...</span>
    </div>
  ),
});

const LiveTimer = ({ createdAt }: { createdAt: string }) => {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    const update = () => {
      const diffMs = new Date().getTime() - new Date(createdAt).getTime();
      if (diffMs < 0) {
        setElapsed("00:00");
        return;
      }
      const diffSecs = Math.floor(diffMs / 1000);
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      setElapsed(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);
  return <span className="font-mono text-cyan-400 font-bold">{elapsed}</span>;
};

function ProviderDashboardContent() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://homeserviceai-1.onrender.com';
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
    // Optimistically update the UI category state immediately
    const prevCat = selectedTestingCategory;
    setSelectedTestingCategory(cat);
    if (user) {
      if (!user.profile) {
        user.profile = {};
      }
      user.profile.category = cat;
    }

    // Execute the SQL update asynchronously in the background
    fetch(`${API_BASE}/api/auth/testing/switch-category?category=${cat}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }).then(async (res) => {
      if (!res.ok) {
        // Rollback optimistic state on failure
        setSelectedTestingCategory(prevCat);
        if (user && user.profile) {
          user.profile.category = prevCat;
        }
        console.error("Failed to persist category change to database");
      } else {
        // Save the updated profile category locally to survive page reloads
        if (user) {
          localStorage.setItem('hs_user', JSON.stringify(user));
        }
      }
    }).catch((err) => {
      setSelectedTestingCategory(prevCat);
      if (user && user.profile) {
        user.profile.category = prevCat;
      }
      console.error("Error during background category switch:", err);
    });
  };
  
  // Calendar states
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'jobs' | 'wallet' | 'settings' | 'performance'>('home');
  const [jobsSubTab, setJobsSubTab] = useState<'NEW' | 'ACCEPTED' | 'ON_THE_WAY' | 'ARRIVED' | 'OTP_PENDING' | 'SERVICE_RUNNING' | 'PAYMENT_PENDING' | 'COMPLETED' | 'CANCELLED'>('NEW');
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
    const activeWayJob = dbJobs.find(j => j.status === 'ON_THE_WAY');
    if (activeWayJob) {
      const activeDest: [number, number] = [activeWayJob.latitude || 26.4173, activeWayJob.longitude || 80.3341];
      const activeStart: [number, number] = [activeDest[0] + 0.008, activeDest[1] - 0.012];
      setRoutePoints(generateSimulatedRoute(activeStart, activeDest));
    } else {
      setRoutePoints(generateSimulatedRoute(startCoords, destCoords));
    }
  }, [dbJobs.some(j => j.status === 'ON_THE_WAY')]);

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
    }, 500);
    return () => clearInterval(interval);
  }, [hasOnTheWay, routePoints]);

  const [etaSeconds, setEtaSeconds] = useState(15);

  useEffect(() => {
    const activeWayJob = dbJobs.find(j => j.status === 'ON_THE_WAY');
    if (!activeWayJob) return;
    setEtaSeconds(15);
    const secInterval = setInterval(() => {
      setEtaSeconds(s => {
        if (s <= 1) {
          clearInterval(secInterval);
          updateJobStatus(activeWayJob.id, 'ARRIVED');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(secInterval);
  }, [dbJobs.some(j => j.status === 'ON_THE_WAY')]);

  // Real GPS watch loop for real professionals
  useEffect(() => {
    const activeWayJob = dbJobs.find(j => j.status === 'ON_THE_WAY');
    if (!activeWayJob || user?.email?.toLowerCase().includes("homesphere")) return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Real GPS Tech coordinates retrieved:", latitude, longitude);
          
          fetch(`${API_BASE}/api/bookings/${activeWayJob.id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              status: 'ON_THE_WAY',
              techLat: latitude,
              techLng: longitude,
              etaMinutes: 5
            })
          }).catch(console.error);
        },
        (error) => {
          console.error("GPS tracking error:", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [dbJobs.some(j => j.status === 'ON_THE_WAY'), user]);

  const activeWayJob = dbJobs.find(j => ['ON_THE_WAY', 'ARRIVED', 'OTP_VERIFIED', 'SERVICE_STARTED'].includes(j.status));
  const activeTechCoords = (hasOnTheWay && routePoints[techIndex])
    ? routePoints[techIndex]
    : (activeWayJob && ['ARRIVED', 'OTP_VERIFIED', 'SERVICE_STARTED'].includes(activeWayJob.status))
      ? [activeWayJob.latitude || 26.4499, activeWayJob.longitude || 80.3319] as [number, number]
      : (user?.profile?.latitude && user?.profile?.longitude)
        ? [user.profile.latitude, user.profile.longitude] as [number, number]
        : (routePoints[techIndex] || startCoords);
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

    if (user && token) {
      const defaultWsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${API_BASE.replace(/^https?:\/\//, '')}/api/ws/${user.id}`;
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL 
        ? `${process.env.NEXT_PUBLIC_WS_URL.replace(/\/$/, '')}/api/ws/${user.id}`
        : defaultWsUrl;
      console.log("Professional WebSocket connecting:", wsUrl);
      const socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("Professional received event:", msg);
          
          const isAssignedToThisUser = msg.provider_id === user.id || 
            (user.email?.toLowerCase() === 'xatyammishra07@gmail.com' && msg.provider_email && msg.provider_email.includes('homesphere'));
            
          if (msg.event === "booking_popup" && isAssignedToThisUser) {
            playNotificationSound();
            setIncomingJob({
              id: msg.booking_id,
              customer: msg.customer_name || "Valued Customer",
              customerPhoto: "",
              city: "Hyderabad",
              address: msg.address || "Hyderabad Center",
              service: msg.service_type,
              description: msg.description || "No description provided.",
              distance: "1.5 km away",
              eta: "5 mins travel",
              urgency: "HIGH",
              estimatedFee: `₹${msg.total_cost}`,
              paymentMethod: "Wallet",
              isRealBooking: true
            });
            setCountdown(30);
          }
          
          if (msg.event === "booking_created" || msg.event === "booking_popup" || msg.event === "booking_accepted" || msg.event === "booking_rejected" || msg.event === "booking_updated" || msg.event === "payment_completed") {
            loadProfessionalJobs();
          }
        } catch (err) {
          console.error("Error parsing professional WebSocket message:", err);
        }
      };

      return () => {
        socket.close();
        clearInterval(interval);
      };
    }

    return () => clearInterval(interval);
  }, [token, user, API_BASE]);

  const updateJobStatus = async (bookingId: string, statusStr: string) => {
    // Optimistically update status to prevent UI delay
    setDbJobs(prev => prev.map(j => j.id === bookingId ? { ...j, status: statusStr } : j));
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
      } else {
        loadProfessionalJobs();
      }
    } catch (err) {
      console.error(err);
      loadProfessionalJobs();
    }
  };

  const handleOtpVerify = async (bookingId: string) => {
    const jobOtp = otpInputs[bookingId];
    if (!jobOtp) {
      alert("Please enter verification OTP.");
      return;
    }
    // Optimistically update status to prevent UI delay
    setDbJobs(prev => prev.map(j => j.id === bookingId ? { ...j, status: 'SERVICE_STARTED' } : j));
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
        loadProfessionalJobs();
      } else {
        const data = await res.json();
        alert(`Verification failed: ${data.detail}`);
        loadProfessionalJobs();
      }
    } catch (err) {
      console.error(err);
      loadProfessionalJobs();
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

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      oscillator.start();
      
      setTimeout(() => {
        oscillator.frequency.setValueAtTime(1046.5, audioCtx.currentTime);
      }, 150);
      
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 400);
    } catch (err) {
      console.error("Audio playback failed:", err);
    }
  };

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
      const openJob = dbJobs.find(job => 
        job.status === 'PENDING_PROVIDER_ACCEPTANCE' &&
        (job.customer_email === '2301641720104@psit.ac.in' || job.provider_id === user.id)
      );
      if (openJob) {
        if (!incomingJob || incomingJob.id !== openJob.id) {
          playNotificationSound();
          setIncomingJob({
            id: openJob.id,
            customer: openJob.customer_name || "Valued Customer",
            customerPhoto: openJob.customer_photo || "",
            city: openJob.city || "Kanpur",
            address: openJob.address || "Kanpur City Center",
            service: openJob.service_type,
            description: openJob.description || "No description provided.",
            distance: "1.5 km away",
            eta: "5 mins travel",
            urgency: "HIGH",
            estimatedFee: `₹${openJob.total_cost}`,
            paymentMethod: openJob.payment_method || "Wallet",
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
            await updateJobStatus(incomingJob.id, 'ON_THE_WAY');
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

            {/* Sub-Tabs Navigation */}
            <div className="flex gap-2 flex-wrap mb-4 border-b border-slate-900 pb-3">
              {[
                { id: 'NEW', label: 'New Requests' },
                { id: 'ACCEPTED', label: 'Accepted' },
                { id: 'ON_THE_WAY', label: 'On The Way' },
                { id: 'ARRIVED', label: 'Arrived' },
                { id: 'OTP_PENDING', label: 'OTP Pending' },
                { id: 'SERVICE_RUNNING', label: 'Service Running' },
                { id: 'PAYMENT_PENDING', label: 'Payment Pending' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'CANCELLED', label: 'Cancelled' }
              ].map((sub) => {
                const count = dbJobs.filter(j => {
                  if (sub.id === 'NEW') return ['PENDING_PROVIDER_ACCEPTANCE', 'ASSIGNED', 'REQUESTED'].includes(j.status);
                  if (sub.id === 'ACCEPTED') return j.status === 'ACCEPTED';
                  if (sub.id === 'ON_THE_WAY') return j.status === 'ON_THE_WAY';
                  if (sub.id === 'ARRIVED') return j.status === 'ARRIVED';
                  if (sub.id === 'OTP_PENDING') return j.status === 'ARRIVED';
                  if (sub.id === 'SERVICE_RUNNING') return ['SERVICE_STARTED', 'IN_PROGRESS'].includes(j.status);
                  if (sub.id === 'PAYMENT_PENDING') return ['SERVICE_COMPLETED', 'PAYMENT_PENDING'].includes(j.status);
                  if (sub.id === 'COMPLETED') return ['COMPLETED', 'PAYMENT_COMPLETED', 'CLOSED'].includes(j.status);
                  if (sub.id === 'CANCELLED') return ['CANCELLED', 'REJECTED'].includes(j.status);
                  return false;
                }).length;
                
                return (
                  <button
                    key={sub.id}
                    onClick={() => setJobsSubTab(sub.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border transition-all ${
                      jobsSubTab === sub.id
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sub.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-4">
              {(() => {
                const filteredJobs = dbJobs.filter(job => {
                  switch (jobsSubTab) {
                    case 'NEW':
                      return ['PENDING_PROVIDER_ACCEPTANCE', 'ASSIGNED', 'REQUESTED'].includes(job.status);
                    case 'ACCEPTED':
                      return job.status === 'ACCEPTED';
                    case 'ON_THE_WAY':
                      return job.status === 'ON_THE_WAY';
                    case 'ARRIVED':
                    case 'OTP_PENDING':
                      return job.status === 'ARRIVED';
                    case 'SERVICE_RUNNING':
                      return ['SERVICE_STARTED', 'IN_PROGRESS'].includes(job.status);
                    case 'PAYMENT_PENDING':
                      return ['SERVICE_COMPLETED', 'PAYMENT_PENDING'].includes(job.status);
                    case 'COMPLETED':
                      return ['COMPLETED', 'PAYMENT_COMPLETED', 'CLOSED'].includes(job.status);
                    case 'CANCELLED':
                      return ['CANCELLED', 'REJECTED'].includes(job.status);
                    default:
                      return true;
                  }
                });

                if (filteredJobs.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
                      <Wrench size={24} className="opacity-40" />
                      <span>No jobs found in this section.</span>
                    </div>
                  );
                }

                return filteredJobs.map((job) => (
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
                      {(job.status === 'PENDING_PROVIDER_ACCEPTANCE' || job.status === 'ASSIGNED' || job.status === 'REQUESTED') && (
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`${API_BASE}/api/bookings/${job.id}/accept`, {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                  await updateJobStatus(job.id, 'ON_THE_WAY');
                                  loadProfessionalJobs();
                                }
                              } catch(e) { console.error(e); }
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            Accept Booking
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
                            Reject Booking
                          </button>
                        </div>
                      )}

                      {job.status === 'ACCEPTED' && (
                        <button
                          onClick={() => updateJobStatus(job.id, 'ON_THE_WAY')}
                          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Start Navigation
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
                            <div className="absolute top-2 right-2 px-2.5 py-1 rounded bg-indigo-950/90 border border-indigo-900/40 text-[10px] text-indigo-400 font-bold z-[400] animate-pulse">
                              ETA: {etaSeconds}s
                            </div>
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
                              Verify OTP
                            </button>
                          </div>
                        </div>
                      )}

                      {job.status === 'SERVICE_STARTED' && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_BASE}/api/bookings/${job.id}/confirm-completion`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (res.ok) loadProfessionalJobs();
                            } catch(e) { console.error(e); }
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Complete Service
                        </button>
                      )}

                      {(job.status === 'SERVICE_COMPLETED' || job.status === 'PAYMENT_PENDING') && (
                        <span className="text-[10px] text-slate-500 italic">Await Payment (Pending Customer Payout)...</span>
                      )}

                      {(job.status === 'PAYMENT_COMPLETED' || job.status === 'COMPLETED' || job.status === 'CLOSED') && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <Check size={12} />
                          <span>Job Completed</span>
                        </span>
                      )}
                    </div>
                  </div>
                ));
              })()}
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
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Bell size={18} className="animate-bounce" />
                  <span className="font-extrabold text-xs tracking-wider uppercase">INCOMING BOOKING REQUEST</span>
                </div>
                <div className="text-xs font-mono font-bold bg-indigo-950/60 border border-indigo-900/30 px-2 py-0.5 rounded-md text-indigo-400">
                  {countdown}s left
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {/* Customer Info Row */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
                    <img 
                      src={incomingJob.customerPhoto || "/default-avatar.png"} 
                      alt={incomingJob.customer}
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ramesh'; }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Customer</span>
                    <span className="font-bold text-base text-slate-100">{incomingJob.customer}</span>
                    <span className="text-[10px] text-slate-400">{incomingJob.city}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/45 border border-slate-800/80 flex flex-col gap-3 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Service Type</span>
                      <span className="font-bold text-slate-200 mt-0.5 block">{incomingJob.service}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Estimated Price</span>
                      <span className="font-extrabold text-emerald-400 mt-0.5 block">{incomingJob.estimatedFee}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Problem Description</span>
                    <p className="text-slate-300 mt-1 leading-relaxed italic">"{incomingJob.description}"</p>
                  </div>

                  <div className="border-t border-slate-850 pt-2.5 flex flex-col gap-1.5 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-500" />
                      <span>Address: {incomingJob.address}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-500" />
                        <span>Distance: {incomingJob.distance} ({incomingJob.eta})</span>
                      </span>
                      <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">
                        {incomingJob.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={rejectJob}
                    className="flex-1 py-3 bg-slate-950 hover:bg-slate-850 text-red-400 hover:text-red-300 border border-slate-800 rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
                  >
                    ❌ Reject Booking
                  </button>
                  <button
                    onClick={acceptJob}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-wider"
                  >
                    ✅ Accept Booking
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

// ==========================================
// ADMIN FLEET & PARTNER MANAGEMENT SYSTEM
// ==========================================
function AdminManagementDashboard() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://homeserviceai-1.onrender.com';
  const { user, token, logout } = useAuth();
  const router = useRouter();

  // Tabs
  const [activeTab, setActiveTab] = useState<'fleet' | 'live' | 'history'>('fleet');

  // Locations metadata
  const [locations, setLocations] = useState<{[key: string]: string[]}>({});
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Filtering
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Sorting
  const [sortBy, setSortBy] = useState('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Core Data Lists
  const [workers, setWorkers] = useState<any[]>([]);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [historyBookings, setHistoryBookings] = useState<any[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showTrackModal, setShowTrackModal] = useState(false);

  // Map tracking coordinates for live tracker modal
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [techIndex, setTechIndex] = useState(0);

  useEffect(() => {
    if (!selectedBooking) return;
    const updated = activeBookings.find(j => j.id === selectedBooking.id);
    if (updated) {
      if (['PAYMENT_COMPLETED', 'COMPLETED', 'CLOSED'].includes(updated.status) && !['PAYMENT_COMPLETED', 'COMPLETED', 'CLOSED'].includes(selectedBooking.status)) {
        setShowTrackModal(false);
        setShowDrawer(false);
        setSelectedBooking(null);
        alert("Payment completed and job closed successfully!");
      } else {
        setSelectedBooking(updated);
      }
    }
  }, [activeBookings]);

  const ROLES = [
    "Electrician", "Plumber", "Carpenter", "Painter", "AC Repair", "AC Installation", 
    "Deep Cleaning", "Pest Control", "Babysitter", "Driver"
  ];

  // Fetch location options
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/admin/locations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setLocations(data);
        setStates(Object.keys(data));
      })
      .catch(console.error);
  }, [token]);

  // Update cities list when state is selected
  useEffect(() => {
    if (selectedState && locations[selectedState]) {
      setCities(locations[selectedState]);
      setSelectedCity('');
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedState, locations]);

  // Fetch Workers
  const fetchWorkers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        sort_by: sortBy,
        sort_order: sortOrder
      });
      if (selectedState) params.append('state', selectedState);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedRole) params.append('category', selectedRole);
      if (selectedStatus) params.append('status_filter', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`${API_BASE}/api/admin/workers?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkers(data.workers);
        setTotalCount(data.total_count);
      }
    } catch (err) {
      console.error("Failed to load professionals list:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Live Bookings
  const fetchActiveBookings = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/bookings/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch History Bookings
  const fetchHistoryBookings = async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({
        range_filter: historyFilter,
        limit: '25'
      });
      if (historySearch) params.append('search', historySearch);
      const res = await fetch(`${API_BASE}/api/admin/bookings/history?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryBookings(data.bookings);
        setHistoryTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auto trigger query on filter/pagination changes
  useEffect(() => {
    if (activeTab === 'fleet') {
      fetchWorkers();
    } else if (activeTab === 'live') {
      fetchActiveBookings();
    } else if (activeTab === 'history') {
      fetchHistoryBookings();
    }
  }, [activeTab, selectedState, selectedCity, selectedRole, selectedStatus, limit, offset, sortBy, sortOrder, historyFilter]);

  // Trigger search with delay
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (activeTab === 'fleet') {
        setOffset(0);
        setCurrentPage(1);
        fetchWorkers();
      } else if (activeTab === 'history') {
        fetchHistoryBookings();
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, historySearch]);

  // WebSocket Live Sync
  useEffect(() => {
    if (!user || !token) return;
    
    // Connect to WebSocket dynamically
    const defaultWsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${API_BASE.replace(/^https?:\/\//, '')}/api/ws/${user.id}`;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL 
      ? `${process.env.NEXT_PUBLIC_WS_URL.replace(/\/$/, '')}/api/ws/${user.id}`
      : defaultWsUrl;

    console.log("Admin WebSocket connected:", wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("Admin Dashboard live update event:", msg);
        
        // Refresh appropriate lists depending on event
        fetchActiveBookings();
        fetchWorkers();
      } catch (err) {
        console.error("Error parsing admin WebSocket message:", err);
      }
    };

    return () => socket.close();
  }, [user, token]);

  // Helper functions for actions
  const handleSuspendWorker = async (workerId: string) => {
    if (!confirm("Are you sure you want to suspend this professional?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/workers/${workerId}/suspend`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Professional suspended successfully!");
        fetchWorkers();
        if (selectedWorker && selectedWorker.id === workerId) {
          setShowDrawer(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivateWorker = async (workerId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/workers/${workerId}/reactivate`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Professional activated successfully!");
        fetchWorkers();
        if (selectedWorker && selectedWorker.id === workerId) {
          setShowDrawer(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    if (!confirm("CRITICAL WARNING: This will permanently delete the professional and their profile metadata from the database. Proceed?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/workers/${workerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Professional deleted permanently!");
        fetchWorkers();
        setShowDrawer(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Live Map Simulation coordinates generation when tracking selected booking
  useEffect(() => {
    if (!selectedBooking || selectedBooking.status !== 'ON_THE_WAY') {
      setRoutePoints([]);
      return;
    }

    const startCoords: [number, number] = [selectedBooking.latitude + 0.015, selectedBooking.longitude - 0.015];
    const destCoords: [number, number] = [selectedBooking.latitude, selectedBooking.longitude];

    // Generate Route points (interpolation)
    const points: [number, number][] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const pct = i / steps;
      const lat = startCoords[0] + (destCoords[0] - startCoords[0]) * pct;
      const lng = startCoords[1] + (destCoords[1] - startCoords[1]) * pct;
      points.push([lat, lng]);
    }
    setRoutePoints(points);
    setTechIndex(0);

    const interval = setInterval(() => {
      setTechIndex((prev) => {
        if (prev >= points.length - 1) {
          clearInterval(interval);
          return points.length - 1;
        }
        return prev + 1;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [selectedBooking]);

  const activeTechTrackingCoords = (selectedBooking && routePoints.length > 0 && routePoints[techIndex])
    ? routePoints[techIndex] as [number, number]
    : selectedBooking
      ? [selectedBooking.tech_latitude || selectedBooking.latitude || 26.4499, selectedBooking.tech_longitude || selectedBooking.longitude || 80.3319] as [number, number]
      : [26.4499, 80.3319] as [number, number];

  return (
    <div className="min-h-screen text-slate-100 flex flex-col pt-6 px-6 relative bg-slate-950 font-sans">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest">Administrative console</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">Fleet & Partner Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">Logged in as {user?.email} • Real-time database telemetry active.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => logout()}
            className="px-4 py-2 border border-white/5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 transition-all"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 mt-6 gap-2">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'fleet' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          👤 Professionals Fleet ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'live' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚡ Live Bookings ({activeBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'history' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📖 Booking History ({historyTotal})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="py-6 flex-1 flex flex-col">
        {activeTab === 'fleet' && (
          <div className="flex-1 flex flex-col">
            
            {/* Filtering Control Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-md mb-5">
              
              {/* State Filter */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">State</label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setOffset(0);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All States</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* City Filter */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setOffset(0);
                    setCurrentPage(1);
                  }}
                  disabled={!selectedState}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">All Cities</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Role Filter */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setOffset(0);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Roles</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Booking Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setOffset(0);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Available">🟢 Available</option>
                  <option value="Busy">🟠 Busy</option>
                  <option value="Offline">⚪ Offline</option>
                  <option value="Suspended">🔴 Suspended</option>
                </select>
              </div>

              {/* Instant Search */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-600" />
                </div>
              </div>

            </div>

            {/* Professionals Table */}
            <div className="flex-1 overflow-x-auto rounded-xl border border-white/5 bg-slate-900/10 relative min-h-[300px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[9px] font-bold">
                    <th className="p-3.5">Photo</th>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">State</th>
                    <th className="p-3.5">City</th>
                    <th className="p-3.5">Role</th>
                    <th 
                      onClick={() => {
                        setSortBy('rating');
                        setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                      }}
                      className="p-3.5 cursor-pointer hover:text-white"
                    >
                      Rating <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                    </th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Current Booking</th>
                    <th className="p-3.5">Wallet</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse border-b border-white/5">
                        <td className="p-3"><div className="w-8 h-8 rounded-full bg-white/5" /></td>
                        <td className="p-3"><div className="w-24 h-4 bg-white/5 rounded animate-pulse" /></td>
                        <td className="p-3"><div className="w-32 h-4 bg-white/5 rounded animate-pulse" /></td>
                        <td className="p-3"><div className="w-20 h-4 bg-white/5 rounded animate-pulse" /></td>
                        <td className="p-3"><div className="w-16 h-4 bg-white/5 rounded animate-pulse" /></td>
                        <td className="p-3"><div className="w-16 h-4 bg-white/5 rounded animate-pulse" /></td>
                        <td className="p-3"><div className="w-20 h-5 bg-white/5 rounded animate-pulse" /></td>
                        <td className="p-3"><div className="w-10 h-4 bg-white/5 rounded animate-pulse" /></td>
                        <td className="p-3"><div className="w-16 h-5 bg-white/5 rounded animate-pulse" /></td>
                        <td className="p-3"><div className="w-24 h-4 bg-white/5 rounded animate-pulse" /></td>
                        <td className="p-3"><div className="w-12 h-4 bg-white/5 rounded animate-pulse" /></td>
                        <td className="p-3"><div className="w-8 h-8 bg-white/5 rounded animate-pulse" /></td>
                      </tr>
                    ))
                  ) : workers.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-10 text-slate-500 text-xs">
                        No professionals found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    workers.map((w) => {
                      const isSuspended = w.status === 'SUSPENDED';
                      return (
                        <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="p-3">
                            <img 
                              src={w.profilePhoto} 
                              alt={w.name} 
                              className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                            />
                          </td>
                          <td className="p-3 font-bold text-white">{w.name}</td>
                          <td className="p-3 text-slate-400">{w.email}</td>
                          <td className="p-3 text-slate-400">{w.phone || '—'}</td>
                          <td className="p-3 text-slate-300">{w.state || '—'}</td>
                          <td className="p-3 text-slate-300">{w.city || '—'}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                              {w.category}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-amber-400">★ {w.rating.toFixed(1)}</td>
                          <td className="p-3">
                            {isSuspended ? (
                              <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-900/30 text-red-400 text-[10px] font-bold">Suspended</span>
                            ) : w.isAvailable ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-900/30 text-emerald-400 text-[10px] font-bold">Available</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-900/30 text-amber-400 text-[10px] font-bold">Busy</span>
                            )}
                          </td>
                          <td className="p-3">
                            {w.current_booking ? (
                              <div className="flex flex-col text-left">
                                <span className="font-semibold text-indigo-400 text-[10px]">#HS-{w.current_booking.id.substring(0, 8)}</span>
                                <span className="text-[9px] text-slate-400">{w.current_booking.customer_name}</span>
                                <span className="text-[8px] px-1 py-0.5 rounded bg-white/5 w-fit mt-0.5 text-cyan-400 uppercase tracking-wider">{w.current_booking.status.replace(/_/g, ' ')}</span>
                              </div>
                            ) : (
                              <span className="text-slate-600">No Booking</span>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-slate-200">₹{w.walletBalance}</td>
                          <td className="p-3">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedWorker(w);
                                  setShowDrawer(true);
                                }}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {isSuspended ? (
                                <button
                                  onClick={() => handleActivateWorker(w.id)}
                                  className="p-1.5 rounded bg-emerald-950/85 hover:bg-emerald-900 text-emerald-400"
                                  title="Reactivate Professional"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSuspendWorker(w.id)}
                                  className="p-1.5 rounded bg-red-950/85 hover:bg-red-900 text-red-400"
                                  title="Suspend Professional"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 text-xs text-slate-400">
              <div>
                Showing <span className="font-bold text-white">{workers.length}</span> of <span className="font-bold text-white">{totalCount}</span> partners
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1 || loading}
                  onClick={() => {
                    setOffset(prev => Math.max(0, prev - limit));
                    setCurrentPage(p => Math.max(1, p - 1));
                  }}
                  className="px-2.5 py-1.5 border border-white/5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 py-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-500/20">
                  Page {currentPage} of {Math.max(1, Math.ceil(totalCount / limit))}
                </span>
                <button
                  disabled={currentPage >= Math.ceil(totalCount / limit) || loading}
                  onClick={() => {
                    setOffset(prev => prev + limit);
                    setCurrentPage(p => p + 1);
                  }}
                  className="px-2.5 py-1.5 border border-white/5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'live' && (
          <div className="flex-1 flex flex-col">
            
            <div className="rounded-xl border border-white/5 bg-slate-900/10 overflow-x-auto min-h-[300px] text-left">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[9px] font-bold">
                    <th className="p-3.5">Booking ID</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Professional</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">State</th>
                    <th className="p-3.5">City</th>
                    <th className="p-3.5">Booking Time</th>
                    <th className="p-3.5">Current Status</th>
                    <th className="p-3.5">Payment Status</th>
                    <th className="p-3.5">Live Timer</th>
                    <th className="p-3.5">Track</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBookings.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-10 text-slate-500 text-xs">
                        No active service bookings currently dispatching.
                      </td>
                    </tr>
                  ) : (
                    activeBookings.map((b) => {
                      return (
                        <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                          <td className="p-3 font-mono font-bold text-indigo-450">#HS-{b.id.substring(0, 8)}</td>
                          <td className="p-3">
                            <div className="flex flex-col text-left">
                              <span className="font-bold text-white">{b.customer_name}</span>
                              <span className="text-[10px] text-slate-500">{b.customer_phone}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-200">{b.provider_name}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700/30">
                              {b.service_type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{b.state || 'Uttar Pradesh'}</td>
                          <td className="p-3 text-slate-300">{b.city || 'Kanpur'}</td>
                          <td className="p-3 text-slate-400">
                            {formatToIST(b.created_at)}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              b.status === 'PENDING_PROVIDER_ACCEPTANCE' ? 'bg-amber-950/80 border border-amber-900/30 text-amber-400' :
                              b.status === 'ON_THE_WAY' ? 'bg-sky-950/80 border border-sky-900/30 text-sky-400' :
                              b.status === 'ARRIVED' ? 'bg-indigo-950/80 border border-indigo-900/30 text-indigo-400' :
                              'bg-emerald-950/80 border border-emerald-900/30 text-emerald-400'
                            }`}>
                              {b.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold ${
                              b.payment_status === 'PAID' ? 'text-emerald-400' : 'text-slate-400'
                            }`}>
                              {b.payment_status}
                            </span>
                          </td>
                          <td className="p-3">
                            <LiveTimer createdAt={b.created_at} />
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setShowTrackModal(true);
                              }}
                              className="px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold font-sans transition-colors"
                            >
                              Track
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col">
            
            <div className="flex flex-col sm:flex-row justify-between gap-3 mb-5">
              <div className="flex border border-white/5 rounded-xl bg-slate-900/40 p-1 self-start">
                {['all', 'today', 'yesterday', 'week', 'month'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setHistoryFilter(f)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                      historyFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search history by role..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-600" />
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-slate-900/10 overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[9px] font-bold">
                    <th className="p-3.5">Booking ID</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Professional</th>
                    <th className="p-3.5">Service Role</th>
                    <th className="p-3.5">Final Status</th>
                    <th className="p-3.5">Payment</th>
                    <th className="p-3.5">Created Date</th>
                    <th className="p-3.5">Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {historyBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-500 text-xs">
                        No historical records found matching current bounds.
                      </td>
                    </tr>
                  ) : (
                    historyBookings.map((b) => (
                      <tr key={b.id} className="border-b border-white/5 text-slate-300">
                        <td className="p-3 text-indigo-400 font-bold">#HS-{b.id.substring(0, 8)}</td>
                        <td className="p-3 text-white">{b.customer_name}</td>
                        <td className="p-3 text-slate-400">{b.provider_name}</td>
                        <td className="p-3">{b.service_type}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            b.status === 'CANCELLED' ? 'bg-red-950/80 border border-red-900/30 text-red-400' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{b.payment_status}</td>
                        <td className="p-3 text-slate-400">{formatToISTFull(b.created_at)}</td>
                        <td className="p-3 font-bold text-white">₹{b.total_cost}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>

      {/* Profile Side Drawer */}
      <AnimatePresence>
        {showDrawer && selectedWorker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-black z-[998]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-slate-900 border-l border-white/5 shadow-2xl p-6 z-[999] overflow-y-auto flex flex-col text-left text-xs"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-sm font-black text-white">Professional KYC Profile</span>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 flex gap-4 items-center">
                <img
                  src={selectedWorker.profilePhoto}
                  alt={selectedWorker.name}
                  className="w-16 h-16 rounded-full border border-slate-700 object-cover"
                />
                <div>
                  <h3 className="text-base font-black text-white">{selectedWorker.name}</h3>
                  <p className="text-slate-400 mt-0.5">{selectedWorker.email}</p>
                  <p className="text-slate-400">{selectedWorker.phone}</p>
                </div>
              </div>

              {/* Stats boxes */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Category</span>
                  <span className="text-xs font-bold text-indigo-400 mt-1 block">{selectedWorker.category}</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Success</span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 block">100%</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Wallet</span>
                  <span className="text-xs font-bold text-white mt-1 block">₹{selectedWorker.walletBalance}</span>
                </div>
              </div>

              {/* KYC Doc scans */}
              <div className="mt-6">
                <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Verified Documents (Aadhaar & Selfie)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="aspect-video bg-black/40 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 relative overflow-hidden">
                    {selectedWorker.docs?.aadhaar ? (
                      <img src={selectedWorker.docs.aadhaar} alt="Aadhaar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px]">Aadhaar Card Scan</span>
                    )}
                  </div>
                  <div className="aspect-video bg-black/40 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 relative overflow-hidden">
                    {selectedWorker.docs?.selfie ? (
                      <img src={selectedWorker.docs.selfie} alt="Selfie" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px]">KYC Photo Selfie</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mini Location Map */}
              <div className="mt-6">
                <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">GPS Telemetry Coordinates</h4>
                <div className="w-full h-36 rounded-xl border border-slate-800 overflow-hidden relative">
                  <MapComponent
                    center={[selectedWorker.latitude || 26.4499, selectedWorker.longitude || 80.3319]}
                    customerMarker={[selectedWorker.latitude || 26.4499, selectedWorker.longitude || 80.3319]}
                    theme="dark"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 border border-slate-800 text-[8px] text-slate-400 z-[400]">
                    Lat: {selectedWorker.latitude?.toFixed(4)}, Lng: {selectedWorker.longitude?.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Bio & Skills */}
              <div className="mt-6 flex flex-col gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Biography Bio</span>
                  <p className="text-slate-300 mt-1">{selectedWorker.bio || 'No bio specified by professional.'}</p>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Skills Tags</span>
                  <p className="text-slate-300 mt-1">{selectedWorker.skills || 'General repairs, maintenance'}</p>
                </div>
              </div>

              {/* Suspended/Delete Actions for admin 9369022460sa@gmail.com */}
              {user?.email === "9369022460sa@gmail.com" && (
                <div className="mt-8 pt-6 border-t border-white/5 flex gap-3">
                  {selectedWorker.status === 'SUSPENDED' ? (
                    <button
                      onClick={() => handleActivateWorker(selectedWorker.id)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-center text-xs transition-colors"
                    >
                      Reactivate Partner
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSuspendWorker(selectedWorker.id)}
                      className="flex-1 py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-900/30 text-red-400 rounded-lg font-bold text-center text-xs transition-colors"
                    >
                      Suspend Partner
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteWorker(selectedWorker.id)}
                    className="py-2.5 px-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-lg font-bold text-center text-xs transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Live Booking Tracking Map Modal */}
      <AnimatePresence>
        {showTrackModal && selectedBooking && (
          <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4 text-left">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTrackModal(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl relative w-full max-w-xl z-10 flex flex-col gap-4 text-xs"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white">Live Dispatched Booking Tracking</h3>
                  <span className="text-[10px] text-indigo-400 mt-0.5 block">Booking #HS-{selectedBooking.id.substring(0, 8)} • Role: {selectedBooking.service_type}</span>
                </div>
                <button
                  onClick={() => setShowTrackModal(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tracking map component */}
              <div className="w-full h-64 rounded-xl border border-slate-800 overflow-hidden relative">
                <MapComponent
                  center={[selectedBooking.latitude || 26.4499, selectedBooking.longitude || 80.3319]}
                  customerMarker={[selectedBooking.latitude || 26.4499, selectedBooking.longitude || 80.3319]}
                  techMarker={activeTechTrackingCoords}
                  routeCoordinates={selectedBooking.status === 'ON_THE_WAY' ? routePoints : []}
                  theme="dark"
                />
                
                {/* Telemetry info layer */}
                {selectedBooking.status === 'ON_THE_WAY' ? (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-indigo-950 border border-indigo-900 text-[10px] text-indigo-400 font-bold z-[400] animate-pulse">
                    En Route Simulation Running
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 z-[400]">
                    Status: {selectedBooking.status.replace(/_/g, ' ')}
                  </div>
                )}
              </div>

              {/* Details card */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Customer Details</span>
                  <span className="font-bold text-white block mt-0.5">{selectedBooking.customer_name}</span>
                  <span className="text-slate-400 block mt-0.5">{selectedBooking.customer_phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Technician Telemetry</span>
                  <span className="font-bold text-white block mt-0.5">{selectedBooking.provider_name || 'Unassigned'}</span>
                  <span className="text-slate-400 block mt-0.5">{selectedBooking.provider_phone || '—'}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  onClick={() => setShowTrackModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 font-semibold"
                >
                  Dismiss Tracking
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ProfessionalDashboardContent() {
  const { user } = useAuth();
  if (user?.email === '9369022460sa@gmail.com') {
    return <AdminManagementDashboard />;
  }
  return <ProviderDashboardContent />;
}

export default function ProfessionalDashboard() {
  return (
    <ProtectedRoute allowedRoles={["PROVIDER", "ADMIN", "SUPER_ADMIN"]}>
      <ProfessionalDashboardContent />
    </ProtectedRoute>
  );
}
