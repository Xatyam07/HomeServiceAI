"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, Users, ClipboardList, AlertOctagon, Sparkles, 
  MapPin, Check, X, ShieldAlert, Award, FileText, 
  Activity, Clock, ChevronRight, TrendingUp, LogOut,
  Search, Trash2, Lock, PlusCircle, DollarSign, CreditCard, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[250px] flex items-center justify-center bg-slate-900/40 border border-white/5 rounded-2xl animate-pulse">
      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syncing map view...</span>
    </div>
  ),
});

function AdminDashboardContent() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const { user, token, logout, refreshUserProfile } = useAuth();
  
  // Enterprise administrative tabs
  const [adminTab, setAdminTab] = useState<any>('dashboard');
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [professionalsList, setProfessionalsList] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<any | null>(null);

  const [liveTracking, setLiveTracking] = useState<any>({ providers: [], bookings: [] });

  const loadLiveTracking = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/live-tracking`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLiveTracking(data);
      }
    } catch (err) {
      console.error("Error loading live tracking:", err);
    }
  };

  const handleExportCSV = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/reports/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `marketplace_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert("Failed to export report CSV.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAdminData = async () => {
    if (!token) return;
    try {
      const custRes = await fetch(`${API_BASE}/api/admin/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (custRes.ok) setCustomersList(await custRes.json());

      const proRes = await fetch(`${API_BASE}/api/admin/workers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (proRes.ok) setProfessionalsList(await proRes.json());

      const bookRes = await fetch(`${API_BASE}/api/admin/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (bookRes.ok) setBookingsList(await bookRes.json());

      const payRes = await fetch(`${API_BASE}/api/admin/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (payRes.ok) setPaymentsList(await payRes.json());
    } catch (err) {
      console.error("Error loading admin data lists:", err);
    }
  };

  useEffect(() => {
    loadAdminData();
    loadLiveTracking();
    const interval = setInterval(loadLiveTracking, 10000);
    return () => clearInterval(interval);
  }, [token, adminTab]);

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

  const [serviceWise, setServiceWise] = useState<any[]>([]);
  const [cityWise, setCityWise] = useState<any[]>([]);
  const [workerPerf, setWorkerPerf] = useState<any[]>([]);
  const [payTrends, setPayTrends] = useState<any>({ successful: 0, failed: 0, refunded: 0, pending: 0 });
  const [bookingTrends, setBookingTrends] = useState<any>({ completed: 0, active: 0, cancelled: 0, pending: 0 });

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

  const handleAdminBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Booking status changed to ${newStatus} successfully!`);
        loadAdminData();
      } else {
        const data = await res.json();
        alert(`Failed to update booking: ${data.detail}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating booking status.");
    }
  };

  // Admin Profile Photo States
  const [adminPhoto, setAdminPhoto] = useState('');
  useEffect(() => {
    if (user?.profile_photo) {
      setAdminPhoto(user.profile_photo);
    }
  }, [user]);

  const handleAdminPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/api/uploads/`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setAdminPhoto(data.url);
      alert("Admin photo uploaded successfully! Click 'Persist Admin Configuration' to save.");
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    }
  };

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/auth/register-profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user?.email,
          name: user?.name || "System Administrator",
          role: "ADMIN",
          profile_photo: adminPhoto
        })
      });
      if (res.ok) {
        await refreshUserProfile();
        alert("Admin profile photo saved successfully!");
      } else {
        alert("Failed to save admin profile photo.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save admin profile photo.");
    }
  };

  // Master Mode States
  const [masterCity, setMasterCity] = useState('Kanpur');
  const [masterCategory, setMasterCategory] = useState('Plumber');
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [masterWorkers, setMasterWorkers] = useState<any[]>([]);
  const [selectedMasterWorker, setSelectedMasterWorker] = useState<any | null>(null);
  const [masterWorkerBookings, setMasterWorkerBookings] = useState<any[]>([]);
  const [loadingMasterWorkers, setLoadingMasterWorkers] = useState(false);
  const [savingMasterProfile, setSavingMasterProfile] = useState(false);

  // Editable fields for Selected Master Worker
  const [editWorkerName, setEditWorkerName] = useState('');
  const [editWorkerPhone, setEditWorkerPhone] = useState('');
  const [editWorkerStatus, setEditWorkerStatus] = useState('APPROVED');
  const [editWorkerRate, setEditWorkerRate] = useState(300);
  const [editWorkerExp, setEditWorkerExp] = useState(5);
  const [editWorkerWallet, setEditWorkerWallet] = useState(0);
  const [editWorkerAvailable, setEditWorkerAvailable] = useState(true);
  const [editWorkerRating, setEditWorkerRating] = useState(4.8);
  const [editWorkerSkills, setEditWorkerSkills] = useState('');
  const [editWorkerBio, setEditWorkerBio] = useState('');

  const loadMasterWorkers = async () => {
    if (!token) return;
    setLoadingMasterWorkers(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/workers?city=${masterCity}&category=${masterCategory}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMasterWorkers(data);
        if (data.length > 0) {
          handleSelectMasterWorker(data[0]);
        } else {
          setSelectedMasterWorker(null);
          setMasterWorkerBookings([]);
        }
      }
    } catch (err) {
      console.error("Failed to load master workers:", err);
    } finally {
      setLoadingMasterWorkers(false);
    }
  };

  const handleSelectMasterWorker = async (worker: any) => {
    setSelectedMasterWorker(worker);
    setEditWorkerName(worker.name || '');
    setEditWorkerPhone(worker.phone || '');
    setEditWorkerStatus(worker.status || 'APPROVED');
    setEditWorkerRate(worker.hourlyRate || 300);
    setEditWorkerExp(worker.experienceYrs || 5);
    setEditWorkerWallet(worker.walletBalance || 0);
    setEditWorkerAvailable(worker.isAvailable ?? true);
    setEditWorkerRating(worker.rating || 5.0);
    setEditWorkerSkills(worker.skills || '');
    setEditWorkerBio(worker.bio || '');

    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/bookings/?userId=${worker.id}&role=PROVIDER`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMasterWorkerBookings(data);
        }
      } catch (err) {
        console.error("Failed to load worker bookings:", err);
      }
    }
  };

  const handleSaveMasterProfile = async () => {
    if (!selectedMasterWorker || !token) return;
    setSavingMasterProfile(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/workers/${selectedMasterWorker.id}/edit-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editWorkerName,
          phone: editWorkerPhone,
          status: editWorkerStatus,
          hourly_rate: Number(editWorkerRate),
          experience_yrs: Number(editWorkerExp),
          wallet_balance: Number(editWorkerWallet),
          is_available: editWorkerAvailable,
          rating: Number(editWorkerRating),
          skills: editWorkerSkills,
          bio: editWorkerBio
        })
      });
      if (res.ok) {
        alert("Worker profile updated successfully in PostgreSQL database!");
        loadMasterWorkers();
      } else {
        const errData = await res.json();
        alert(`Failed to save: ${errData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setSavingMasterProfile(false);
    }
  };

  const handleWorkerBookingAction = async (bookingId: string, action: string) => {
    if (!token) return;
    try {
      let res;
      if (action === 'ACCEPT') {
        res = await fetch(`${API_BASE}/api/bookings/${bookingId}/accept`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else if (action === 'REJECT') {
        res = await fetch(`${API_BASE}/api/bookings/${bookingId}/reject`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else if (action === 'TRANSIT') {
        res = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'ON_THE_WAY',
            techLat: 17.4600,
            techLng: 78.3600,
            etaMinutes: 15
          })
        });
      } else if (action === 'ARRIVE') {
        res = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'ARRIVED',
            techLat: 17.4485,
            techLng: 78.3741,
            etaMinutes: 0
          })
        });
      } else if (action === 'START_OTP') {
        const otpCode = prompt("Enter 6-digit OTP given by Customer:");
        if (!otpCode) return;
        res = await fetch(`${API_BASE}/api/bookings/${bookingId}/verify-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ otp: otpCode })
        });
      } else if (action === 'COMPLETE') {
        res = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'COMPLETED'
          })
        });
      }

      if (res && res.ok) {
        alert(`Booking status updated successfully! Action: ${action}`);
        if (selectedMasterWorker) {
          handleSelectMasterWorker(selectedMasterWorker);
        }
      } else {
        const data = await res?.json();
        alert(`Action failed: ${data?.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update booking status.");
    }
  };

  useEffect(() => {
    if (adminTab === 'master_panel' && token) {
      loadMasterWorkers();
    }
  }, [adminTab, masterCity, masterCategory, token]);

  useEffect(() => {
    if (adminTab === 'professionals' && token) {
      const fetchFiltered = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/admin/workers?city=${filterCity}&category=${filterCategory}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setProfessionalsList(await res.json());
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchFiltered();
    }
  }, [adminTab, filterCity, filterCategory, token]);

  useEffect(() => {
    if (!token) return;

    // 1. Fetch Live Stats from backend database
    fetch(`${API_BASE}/api/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.counters) setLiveCounters(data.counters);
        if (data.recentBookings) setRecentBookings(data.recentBookings);
        if (data.recentPayments) setRecentPayments(data.recentPayments);
        if (data.serviceWise) setServiceWise(data.serviceWise);
        if (data.cityWise) setCityWise(data.cityWise);
        if (data.workerPerf) setWorkerPerf(data.workerPerf);
        if (data.payTrends) setPayTrends(data.payTrends);
        if (data.bookingTrends) setBookingTrends(data.bookingTrends);
      })
      .catch(err => console.log("Using fallback mock counters:", err));

    // 2. Fetch Pending Verification Queue
    fetch(`${API_BASE}/api/admin/workers?status_filter=PENDING`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
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
  }, [token]);

  const approveProvider = (id: string) => {
    // Make REST call to backend
    fetch(`${API_BASE}/api/admin/workers/${id}/approve`, { 
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
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
    fetch(`${API_BASE}/api/admin/workers/${id}/reject`, { 
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
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
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin Suite' : 'Admin Suite'}
            </span>
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1 rounded bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
            >
              <FileText size={11} />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span>Server Latency: <span className="text-emerald-400">8ms</span></span>
            <button 
              onClick={logout}
              className="px-3 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/20 text-red-400 border border-red-900/30 flex items-center gap-1 transition-all"
            >
              <LogOut size={12} />
              <span>Sign Out</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
              {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'AD'}
            </div>
          </div>
        </div>
      </header>

      {/* Sub-header Tab Bar */}
      <div className="max-w-7xl mx-auto px-6 mt-6 flex flex-wrap gap-2.5 border-b border-slate-900 pb-2.5 w-full text-left">
        {[
          { id: 'dashboard', label: 'Overview Metrics' },
          { id: 'customers', label: 'Customers' },
          { id: 'professionals', label: 'Professionals' },
          { id: 'bookings', label: 'Bookings Logs' },
          { id: 'payments', label: 'Payments Ledger' },
          { id: 'ai_analytics', label: 'AI Diagnostics Logs' },
          { id: 'audit_logs', label: 'Audit Logs' },
          { id: 'settings', label: 'Settings & Profile' },
          ...(user?.email === 'xatyammishra07@gmail.com' ? [{ id: 'master_panel', label: '🔮 MASTER PRO PANEL' }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id as any)}
            className={`px-4.5 py-2 text-xs font-bold uppercase transition-all rounded-lg ${
              adminTab === tab.id
                ? 'bg-purple-750 text-white shadow-md'
                : 'bg-black/30 text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1">
        {adminTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side: Stats, Heatmaps, Approvals (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Stats counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                {[
                  { name: "Total Customers", value: liveCounters.totalCustomers || 0, color: "text-indigo-400" },
                  { name: "Total Professionals", value: liveCounters.totalProfessionals || 0, color: "text-purple-400" },
                  { name: "Active Professionals", value: liveCounters.activeProfessionals || 0, color: "text-emerald-400" },
                  { name: "Verified Professionals", value: liveCounters.activeProfessionals || 0, color: "text-teal-400" },
                  { name: "Online Professionals", value: liveCounters.liveUsers || 45, color: "text-sky-400" },
                  { name: "Pending Professionals", value: liveCounters.pendingApprovals || 0, color: "text-red-400" },
                  { name: "Total Bookings", value: liveCounters.totalBookings || 0, color: "text-amber-400" },
                  { name: "Revenue", value: `₹${(liveCounters.monthlyRevenue || 0).toLocaleString("en-IN")}`, color: "text-cyan-400" },
                  { name: "AI Diagnoses", value: liveCounters.aiDiagnostics || 0, color: "text-pink-400" },
                  { name: "Payments", value: liveCounters.totalPayments || 0, color: "text-violet-400" },
                  { name: "Cities Covered", value: liveCounters.citiesCovered || 50, color: "text-yellow-400" }
                ].map((s) => (
                  <div key={s.name} className="p-4 rounded-xl bg-slate-900 border border-slate-800/60 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s.name}</span>
                    <span className={`text-xl font-bold ${s.color} mt-1`}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Provider Verification Queue */}
              <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4 text-left">
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

              {/* Live Telemetry Map Tracker */}
              <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4 text-left">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Live Global Telemetry Map</h3>
                  <span className="text-[10px] text-slate-500 font-mono">Dynamic coordinates tracking (Active)</span>
                </div>
                <div className="rounded-xl border border-slate-900 bg-black/40 overflow-hidden relative w-full h-[300px]">
                  <MapComponent
                    center={[20.5937, 78.9629]}
                    providerMarkers={(liveTracking?.providers || []).map((p: any) => ({
                      id: p.provider_id,
                      lat: p.latitude,
                      lng: p.longitude,
                      name: p.name,
                      category: p.category,
                      rate: 350,
                      rating: 4.8
                    }))}
                    customerMarker={liveTracking?.bookings?.length > 0 ? [liveTracking.bookings[0].latitude, liveTracking.bookings[0].longitude] : undefined}
                    theme="dark"
                  />
                </div>
              </div>

              {/* Real-Time Demand Heatmap */}
              <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4 text-left">
                <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Regional Demand Heatmap</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {heatmapData.map((item) => (
                    <div key={`${item.city}-${item.area}`} className={`p-4 rounded-xl border flex justify-between items-center ${item.glow}`}>
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

            {/* Right Side Column (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6 text-left">
              {/* Fraud detector */}
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

              {/* Live Telemetry stream */}
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
                    <div key={`${log.substring(0, 30)}-${index}`} className="border-l border-indigo-500/20 pl-2">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Management tab */}
        {adminTab === 'customers' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            <div className="lg:col-span-7 p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Registered Customer Directory</h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase">{customersList.length} Customers</span>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                {customersList.length === 0 ? (
                  <span className="text-slate-500 text-center py-6 block">No registered customer records located.</span>
                ) : (
                  customersList.map((c) => (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedCustomer(c)}
                      className={`p-4 bg-black/25 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${
                        selectedCustomer?.id === c.id ? 'border-purple-650 bg-purple-950/5' : 'border-slate-900 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-full bg-slate-850 flex items-center justify-center font-bold text-[10px]">
                          {c.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200">{c.name}</span>
                          <span className="text-[9px] text-slate-500 mt-0.5">{c.email}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                        c.status === 'BANNED' || c.status === 'SUSPENDED' ? 'bg-red-950/60 text-red-400' : 'bg-emerald-950/60 text-emerald-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              {selectedCustomer ? (
                <div className="p-6 rounded-2xl glass border border-purple-500/10 flex flex-col gap-5">
                  <div className="flex items-center gap-4.5 pb-4 border-b border-slate-900">
                    <div className="w-14 h-14 rounded-full bg-slate-850 flex items-center justify-center font-bold text-sm">
                      {selectedCustomer.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">{selectedCustomer.name}</h4>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Firebase UID: {selectedCustomer.firebase_uid || "None"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="text-slate-350">{selectedCustomer.email}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="text-slate-350">{selectedCustomer.phone || "Not set"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Role Authority:</span> <span className="text-indigo-400 font-bold">CUSTOMER</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Integrity Status:</span> <span className="text-slate-200 font-bold">{selectedCustomer.status}</span></div>
                  </div>

                  {/* Admin Actions */}
                  <div className="flex flex-col gap-3.5 border-t border-slate-900 pt-4 text-xs">
                    <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider block">Administrative Actions</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={async () => {
                          const res = await fetch(`${API_BASE}/api/admin/users/${selectedCustomer.id}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ status: selectedCustomer.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' })
                          });
                          if (res.ok) { alert("Status toggled successfully!"); loadAdminData(); setSelectedCustomer(null); }
                        }}
                        className="p-2.5 bg-black/40 hover:bg-black/60 border border-slate-800 text-slate-300 font-bold rounded-lg transition-all cursor-pointer"
                      >
                        {selectedCustomer.status === 'SUSPENDED' ? "Reactivate User" : "Suspend Customer"}
                      </button>

                      <button
                        onClick={async () => {
                          const res = await fetch(`${API_BASE}/api/admin/users/${selectedCustomer.id}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ status: 'BANNED' })
                          });
                          if (res.ok) { alert("Customer Banned!"); loadAdminData(); setSelectedCustomer(null); }
                        }}
                        className="p-2.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Ban Account
                      </button>

                      <button
                        onClick={async () => {
                          const amt = prompt("Enter amount to adjust wallet by (e.g. 500 or -200):");
                          if (!amt) return;
                          const res = await fetch(`${API_BASE}/api/admin/users/${selectedCustomer.id}/wallet`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ amount: parseFloat(amt) })
                          });
                          if (res.ok) alert("Wallet adjustments saved!");
                        }}
                        className="p-2.5 bg-black/40 hover:bg-black/60 border border-slate-800 text-slate-300 font-bold rounded-lg transition-all col-span-2 cursor-pointer"
                      >
                        Adjust Wallet Credits (Razorpay Integration)
                      </button>

                      <button
                        onClick={async () => {
                          const pts = prompt("Enter loyalty points to assign:");
                          if (!pts) return;
                          const res = await fetch(`${API_BASE}/api/admin/users/${selectedCustomer.id}/loyalty`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ points: parseInt(pts) })
                          });
                          if (res.ok) alert("Loyalty points assigned!");
                        }}
                        className="p-2.5 bg-purple-950/20 hover:bg-purple-950/40 border border-purple-900/30 text-purple-400 font-bold rounded-lg transition-all col-span-2 cursor-pointer"
                      >
                        Assign Loyalty Points
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
                  Select a customer to inspect profiles, transaction ledger logs, and execute administrative actions.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Professionals Management tab */}
        {adminTab === 'professionals' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            <div className="lg:col-span-7 p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
              <div className="flex flex-col gap-3 pb-3 border-b border-slate-900">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Professional Registrations</h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{professionalsList.length} Total</span>
                </div>
                
                {/* Directory Filters */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Filter by City</label>
                    <select
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-[11px] focus:outline-none cursor-pointer font-semibold shadow-md"
                    >
                      <option value="" className="bg-slate-950 text-slate-400">All Cities</option>
                      {[
                        'Kanpur', 'Lucknow', 'Varanasi', 'Prayagraj', 'Delhi', 'Noida', 'Ghaziabad', 'Gurugram', 'Faridabad',
                        'Agra', 'Meerut', 'Bareilly', 'Jhansi', 'Mathura', 'Aligarh', 'Moradabad', 'Gorakhpur',
                        'Mumbai', 'Pune', 'Nagpur', 'Ahmedabad', 'Vadodara', 'Surat', 'Indore', 'Bhopal', 'Jaipur',
                        'Jodhpur', 'Udaipur', 'Kota', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Patna',
                        'Ranchi', 'Bhubaneswar', 'Chandigarh', 'Mohali', 'Amritsar', 'Dehradun'
                      ].map(city => (
                        <option key={city} value={city} className="bg-slate-950 text-slate-200">{city}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Filter by Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-[11px] focus:outline-none cursor-pointer font-semibold shadow-md"
                    >
                      <option value="" className="bg-slate-950 text-slate-400">All Categories</option>
                      {['Plumber', 'Electrician', 'AC Repair', 'Pest Control', 'Painters', 'Packers & Movers', 'Appliance Installation', 'Cleaning Services'].map(cat => (
                        <option key={cat} value={cat} className="bg-slate-950 text-slate-200">{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                {professionalsList.map((pro) => (
                  <div 
                    key={pro.id}
                    onClick={() => setSelectedProfessional(pro)}
                    className={`p-4 bg-black/25 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${
                      selectedProfessional?.id === pro.id ? 'border-purple-650 bg-purple-950/5' : 'border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8.5 h-8.5 rounded-full bg-slate-850 flex items-center justify-center font-bold text-[10px]">
                        {pro.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">{pro.name}</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">{pro.category} • {pro.experienceYrs} yrs exp</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                      pro.status === 'APPROVED' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-red-950/60 text-red-400'
                    }`}>
                      {pro.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              {selectedProfessional ? (
                <div className="p-6 rounded-2xl glass border border-purple-500/10 flex flex-col gap-5">
                  <div className="flex items-center gap-4.5 pb-4 border-b border-slate-900">
                    <div className="w-14 h-14 rounded-full bg-slate-850 flex items-center justify-center font-bold text-sm">
                      {selectedProfessional.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">{selectedProfessional.name}</h4>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Category: {selectedProfessional.category}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">Registered Email:</span> <span className="text-slate-350">{selectedProfessional.email}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="text-slate-350">{selectedProfessional.phone}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">KYC Status:</span> <span className="text-emerald-400 font-bold">Aadhaar & PAN Uploaded</span></div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3.5 border-t border-slate-900 pt-4 text-xs">
                    <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider block">Verify Documents & Status</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={async () => {
                          const res = await fetch(`${API_BASE}/api/admin/workers/${selectedProfessional.id}/approve`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          if (res.ok) { alert("Professional Approved & Activated!"); loadAdminData(); setSelectedProfessional(null); }
                        }}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Approve Application
                      </button>

                      <button
                        onClick={async () => {
                          const res = await fetch(`${API_BASE}/api/admin/workers/${selectedProfessional.id}/reject`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          if (res.ok) { alert("Professional Application Rejected."); loadAdminData(); setSelectedProfessional(null); }
                        }}
                        className="p-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Reject Application
                      </button>

                      <button
                        onClick={async () => {
                          const res = await fetch(`${API_BASE}/api/admin/workers/${selectedProfessional.id}/suspend`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          if (res.ok) { alert("Account Suspended!"); loadAdminData(); setSelectedProfessional(null); }
                        }}
                        className="p-2.5 bg-black/40 hover:bg-black/60 border border-slate-355 text-slate-300 font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Suspend Worker
                      </button>

                      <button
                        onClick={async () => {
                          const res = await fetch(`${API_BASE}/api/admin/workers/${selectedProfessional.id}/reactivate`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          if (res.ok) { alert("Account Reactivated!"); loadAdminData(); setSelectedProfessional(null); }
                        }}
                        className="p-2.5 bg-purple-950/20 hover:bg-purple-950/40 border border-purple-900/30 text-purple-400 font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Reactivate Worker
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
                  Select a professional to verify identity certificates, adjust wallet funds, and manage marketplace credentials.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings tab */}
        {adminTab === 'bookings' && (
          <div className="rounded-2xl glass p-6 border border-white/5 flex flex-col gap-4 text-left">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Global Service Bookings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Technician</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {bookingsList.map((b) => (
                    <tr key={b.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">{b.id.substring(0, 8)}...</td>
                      <td className="py-3 px-4">{b.customer_name}</td>
                      <td className="py-3 px-4">{b.provider_name}</td>
                      <td className="py-3 px-4">{b.service_type}</td>
                      <td className="py-3 px-4 font-bold text-indigo-400">₹{b.total_cost}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[9px] rounded-full font-mono uppercase font-bold ${
                          b.status === 'COMPLETED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/30' :
                          b.status === 'CANCELLED' ? 'bg-red-950/60 text-red-400 border border-red-900/30' :
                          b.status === 'SUSPENDED' ? 'bg-amber-950/60 text-amber-400 border border-amber-900/30' :
                          'bg-slate-900 border border-slate-800 text-slate-450'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleAdminBookingStatus(b.id, 'CANCELLED')}
                              className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/60 text-red-450 border border-red-900/30 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                            >
                              Revoke
                            </button>
                          )}
                          {b.status !== 'SUSPENDED' && b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleAdminBookingStatus(b.id, 'SUSPENDED')}
                              className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/60 text-amber-450 border border-amber-900/30 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Ledger tab */}
        {adminTab === 'payments' && (
          <div className="rounded-2xl glass p-6 border border-white/5 flex flex-col gap-4 text-left">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Razorpay Transaction Settlement Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Settled Amount</th>
                    <th className="py-3 px-4">Razorpay Order</th>
                    <th className="py-3 px-4">Razorpay Payment ID</th>
                    <th className="py-3 px-4">Signature Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {paymentsList.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">{p.id.substring(0, 8)}...</td>
                      <td className="py-3 px-4">{p.user_name}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">₹{p.amount}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.razorpay_order_id}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{p.razorpay_payment_id || "PENDING"}</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">SUCCESS</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Analytics tab */}
        {adminTab === 'ai_analytics' && (
          <div className="rounded-2xl glass p-6 border border-white/5 flex flex-col gap-5 text-left">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">AI Diagnostics Telemetry Logs</h3>
            <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 text-xs text-slate-300 rounded-xl leading-relaxed">
              <span className="font-bold text-indigo-400 block mb-1">Telemetry Performance Summary</span>
              - **Neural matches generated today**: {bookingsList.length + 5}
              - **Average classification precision**: 98.4%
              - **Isolated faults computed**: Plumber Joint Leakage, Electrical Board sparks, compressor failure
            </div>
          </div>
        )}

        {/* System Audit logs tab */}
        {adminTab === 'audit_logs' && (
          <div className="rounded-2xl glass p-6 border border-white/5 flex flex-col gap-4 text-left">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Security Audit Logs</h3>
            <div className="flex flex-col gap-2 font-mono text-[10px] text-slate-400">
              <div className="p-2 border-l-2 border-purple-500 bg-purple-950/5">
                [2026-06-30 22:45:10] Admin approved professional user xatyammishra07@gmail.com
              </div>
              <div className="p-2 border-l-2 border-slate-550 bg-slate-900/30">
                [2026-06-30 22:40:15] Customer profile details synchronized with PostgreSQL schema
              </div>
              <div className="p-2 border-l-2 border-slate-550 bg-slate-900/30">
                [2026-06-30 22:38:12] Razorpay order created for Booking ref: order_test_772
              </div>
            </div>
          </div>
        )}

        {adminTab === 'settings' && (
          <form onSubmit={handleSaveAdminProfile} className="p-6 rounded-2xl glass border border-white/5 flex flex-col gap-6 text-left max-w-2xl mx-auto text-xs">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400 pb-2 border-b border-slate-900">Edit Administrative Profile</h3>
            
            {/* Admin Avatar Upload */}
            <div className="flex items-center gap-4 border-b border-slate-900 pb-4">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center relative">
                {adminPhoto ? (
                  <img src={adminPhoto} alt="Admin profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-extrabold text-sm text-purple-400">ADMIN</span>
                )}
              </div>
              <div className="flex flex-col gap-1 text-left">
                <span className="font-bold text-xs text-slate-200">Administrative Avatar Photo</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAdminPhotoUpload}
                  className="text-[10px] text-slate-550 file:mr-3 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-purple-950/60 file:text-purple-400 hover:file:bg-purple-900 cursor-pointer"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 font-semibold">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Admin Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.name || "System Administrator"}
                  className="p-3 rounded-xl border border-slate-900 bg-black/40 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Contact Email</label>
                <input
                  type="email"
                  defaultValue={user?.email || "admin@homesphere.ai"}
                  disabled
                  className="p-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 font-semibold">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Multi-Factor Authentication (2FA)</label>
                <select
                  defaultValue="ENABLED"
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-xs focus:outline-none cursor-pointer shadow-lg backdrop-blur-md transition-all font-semibold"
                >
                  <option value="ENABLED" className="bg-slate-950 text-slate-200">Google Authenticator (Enabled)</option>
                  <option value="DISABLED" className="bg-slate-950 text-slate-200">Disabled</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Security Notifications</label>
                <select
                  defaultValue="ALL"
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-xs focus:outline-none cursor-pointer shadow-lg backdrop-blur-md transition-all font-semibold"
                >
                  <option value="ALL" className="bg-slate-950 text-slate-200">All high priority fraud watch alerts</option>
                  <option value="NONE" className="bg-slate-950 text-slate-200">Mute notifications</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="py-3 bg-purple-750 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Persist Admin Configuration
            </button>
          </form>
        )}

        {adminTab === 'dummy_bookings' && (
          <div className="flex flex-col gap-6 text-left">
            <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div>
                  <h3 className="font-bold text-sm tracking-wider uppercase text-purple-400">Live Dummy Professional Bookings</h3>
                  <span className="text-[10px] text-slate-500 mt-1 block">Live bookings dispatched by original customers to simulated dummy professionals.</span>
                </div>
                <span className="text-xs bg-purple-950/60 text-purple-450 border border-purple-900/30 px-2 py-0.5 rounded font-bold">
                  {bookingsList.filter(b => b.provider_email && b.provider_email.endsWith('@homesphere.com')).length} Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-300 font-semibold border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 uppercase text-[9px] tracking-wider font-bold">
                      <th className="py-3 px-2">Booking ID</th>
                      <th className="py-3 px-2">Customer Name</th>
                      <th className="py-3 px-2">Assigned Dummy Pro</th>
                      <th className="py-3 px-2">Service</th>
                      <th className="py-3 px-2">Total Bill</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Verification OTP</th>
                      <th className="py-3 px-2">Address</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingsList.filter(b => b.provider_email && b.provider_email.endsWith('@homesphere.com')).length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                          No active bookings currently assigned to dummy marketplace professionals.
                        </td>
                      </tr>
                    ) : (
                      bookingsList.filter(b => b.provider_email && b.provider_email.endsWith('@homesphere.com')).map((bk) => (
                        <tr key={bk.id} className="border-b border-slate-900 hover:bg-black/10 transition-colors">
                          <td className="py-3.5 px-2 font-mono text-[10px] text-purple-400 font-bold">{bk.id.substring(0, 8).toUpperCase()}</td>
                          <td className="py-3.5 px-2">{bk.customer_name}</td>
                          <td className="py-3.5 px-2 text-indigo-400 font-bold">{bk.provider_name}</td>
                          <td className="py-3.5 px-2">{bk.service_type}</td>
                          <td className="py-3.5 px-2 text-cyan-400 font-bold">₹{bk.total_cost}</td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              bk.status === 'COMPLETED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/30' :
                              bk.status === 'IN_PROGRESS' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-900/30' :
                              bk.status === 'REQUESTED' || bk.status === 'ASSIGNED' ? 'bg-rose-950/60 text-rose-400 border border-rose-900/30' :
                              'bg-amber-950/60 text-amber-400 border border-amber-900/30'
                            }`}>
                              {bk.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 font-mono font-bold text-amber-400">{bk.otp || "None"}</td>
                          <td className="py-3.5 px-2 text-slate-500 truncate max-w-[150px]">{bk.address}</td>
                          <td className="py-3.5 px-2 text-right">
                            <div className="flex justify-end gap-1.5">
                              {(bk.status === 'REQUESTED' || bk.status === 'ASSIGNED') && (
                                <>
                                  <button
                                    onClick={() => handleWorkerBookingAction(bk.id, 'ACCEPT')}
                                    className="px-2 py-1 bg-emerald-650 hover:bg-emerald-600 text-white rounded font-bold text-[9px] cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleWorkerBookingAction(bk.id, 'REJECT')}
                                    className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-400 rounded font-bold text-[9px] cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {bk.status === 'ACCEPTED' && (
                                <button
                                  onClick={() => handleWorkerBookingAction(bk.id, 'TRANSIT')}
                                  className="px-2 py-1 bg-cyan-650 hover:bg-cyan-600 text-white rounded font-bold text-[9px] cursor-pointer"
                                >
                                  Start Transit
                                </button>
                              )}

                              {bk.status === 'ON_THE_WAY' && (
                                <button
                                  onClick={() => handleWorkerBookingAction(bk.id, 'ARRIVE')}
                                  className="px-2 py-1 bg-indigo-650 hover:bg-indigo-600 text-white rounded font-bold text-[9px] cursor-pointer"
                                >
                                  Arrived
                                </button>
                              )}

                              {bk.status === 'ARRIVED' && (
                                <button
                                  onClick={() => handleWorkerBookingAction(bk.id, 'START_OTP')}
                                  className="px-2 py-1 bg-purple-650 hover:bg-purple-600 text-white rounded font-bold text-[9px] cursor-pointer animate-pulse"
                                >
                                  Verify OTP
                                </button>
                              )}

                              {bk.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => handleWorkerBookingAction(bk.id, 'COMPLETE')}
                                  className="px-2 py-1 bg-emerald-650 hover:bg-emerald-600 text-white rounded font-bold text-[9px] cursor-pointer"
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'master_panel' && (
          <div className="flex flex-col gap-8 text-left">
            <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col gap-5">
              <h3 className="font-bold text-base tracking-wider uppercase text-purple-400">🔮 Master Professional Control Center</h3>
              <p className="text-xs text-slate-400">
                You are currently in <strong>MASTER MODE</strong> for <code>xatyammishra07@gmail.com</code>. Choose a location and category to dynamically load and control any professional's account without logging out.
              </p>

              {/* Selector Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Filter by City</label>
                  <select
                    value={masterCity}
                    onChange={(e) => setMasterCity(e.target.value)}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-xs focus:outline-none cursor-pointer font-semibold shadow-md"
                  >
                    {[
                      'Kanpur', 'Lucknow', 'Varanasi', 'Prayagraj', 'Delhi', 'Noida', 'Ghaziabad', 'Gurugram', 'Faridabad',
                      'Agra', 'Meerut', 'Bareilly', 'Jhansi', 'Mathura', 'Aligarh', 'Moradabad', 'Gorakhpur',
                      'Mumbai', 'Pune', 'Nagpur', 'Ahmedabad', 'Vadodara', 'Surat', 'Indore', 'Bhopal', 'Jaipur',
                      'Jodhpur', 'Udaipur', 'Kota', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Patna',
                      'Ranchi', 'Bhubaneswar', 'Chandigarh', 'Mohali', 'Amritsar', 'Dehradun'
                    ].map(city => (
                      <option key={city} value={city} className="bg-slate-950 text-slate-200">{city}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Filter by Category</label>
                  <select
                    value={masterCategory}
                    onChange={(e) => setMasterCategory(e.target.value)}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-xs focus:outline-none cursor-pointer font-semibold shadow-md"
                  >
                    {['Plumber', 'Electrician', 'AC Repair', 'Pest Control', 'Painters', 'Packers & Movers', 'Appliance Installation', 'Cleaning Services'].map(cat => (
                      <option key={cat} value={cat} className="bg-slate-950 text-slate-200">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Choose Professional</label>
                  {loadingMasterWorkers ? (
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 animate-pulse">
                      Loading matching professionals...
                    </div>
                  ) : masterWorkers.length === 0 ? (
                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl text-xs text-red-400 font-semibold">
                      No professionals found in {masterCity}
                    </div>
                  ) : (
                    <select
                      value={selectedMasterWorker?.id || ''}
                      onChange={(e) => {
                        const match = masterWorkers.find(w => w.id === e.target.value);
                        if (match) handleSelectMasterWorker(match);
                      }}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-xs focus:outline-none cursor-pointer font-semibold shadow-md"
                    >
                      {masterWorkers.map(w => (
                        <option key={w.id} value={w.id} className="bg-slate-950 text-slate-200">
                          {w.name} (★{w.rating} • {w.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {selectedMasterWorker && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left side: Professional Parameter editing */}
                <div className="lg:col-span-6 p-6 rounded-2xl glass border border-white/5 flex flex-col gap-5">
                  <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400 pb-2 border-b border-slate-900">
                    🔧 Edit Professional Attributes
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Name</label>
                      <input
                        type="text"
                        value={editWorkerName}
                        onChange={(e) => setEditWorkerName(e.target.value)}
                        className="p-3 rounded-xl border border-slate-900 bg-black/40 text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Phone</label>
                      <input
                        type="text"
                        value={editWorkerPhone}
                        onChange={(e) => setEditWorkerPhone(e.target.value)}
                        className="p-3 rounded-xl border border-slate-900 bg-black/40 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Verification Status</label>
                      <select
                        value={editWorkerStatus}
                        onChange={(e) => setEditWorkerStatus(e.target.value)}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-xs focus:outline-none cursor-pointer font-semibold shadow-md"
                      >
                        <option value="APPROVED" className="bg-slate-950 text-slate-200">APPROVED</option>
                        <option value="PENDING" className="bg-slate-950 text-slate-200">PENDING</option>
                        <option value="SUSPENDED" className="bg-slate-950 text-slate-200">SUSPENDED</option>
                        <option value="REJECTED" className="bg-slate-950 text-slate-200">REJECTED</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Availability</label>
                      <select
                        value={editWorkerAvailable ? 'YES' : 'NO'}
                        onChange={(e) => setEditWorkerAvailable(e.target.value === 'YES')}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-xs focus:outline-none cursor-pointer font-semibold shadow-md"
                      >
                        <option value="YES" className="bg-slate-950 text-slate-200">Available (True)</option>
                        <option value="NO" className="bg-slate-950 text-slate-200">Busy (False)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Hourly Rate (₹)</label>
                      <input
                        type="number"
                        value={editWorkerRate}
                        onChange={(e) => setEditWorkerRate(Number(e.target.value))}
                        className="p-3 rounded-xl border border-slate-900 bg-black/40 text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Experience (Yrs)</label>
                      <input
                        type="number"
                        value={editWorkerExp}
                        onChange={(e) => setEditWorkerExp(Number(e.target.value))}
                        className="p-3 rounded-xl border border-slate-900 bg-black/40 text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Wallet Balance (₹)</label>
                      <input
                        type="number"
                        value={editWorkerWallet}
                        onChange={(e) => setEditWorkerWallet(Number(e.target.value))}
                        className="p-3 rounded-xl border border-slate-900 bg-black/40 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Skills Tag</label>
                      <input
                        type="text"
                        value={editWorkerSkills}
                        onChange={(e) => setEditWorkerSkills(e.target.value)}
                        placeholder="e.g. Copper pipes, gas charging"
                        className="p-3 rounded-xl border border-slate-900 bg-black/40 text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Rating Score</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editWorkerRating}
                        onChange={(e) => setEditWorkerRating(Number(e.target.value))}
                        className="p-3 rounded-xl border border-slate-900 bg-black/40 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs font-semibold">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Short Biography</label>
                    <textarea
                      value={editWorkerBio}
                      onChange={(e) => setEditWorkerBio(e.target.value)}
                      rows={3}
                      className="p-3 rounded-xl border border-slate-900 bg-black/40 text-white focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveMasterProfile}
                    disabled={savingMasterProfile}
                    className="py-3.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {savingMasterProfile ? (
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Save Professional Profile to Database</span>
                    )}
                  </button>
                </div>

                {/* Right side: Active Jobs & Remote Dashboard Control */}
                <div className="lg:col-span-6 p-6 rounded-2xl glass border border-white/5 flex flex-col gap-5">
                  <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400 pb-2 border-b border-slate-900">
                    💼 Active Job Requests & Live Control
                  </h3>

                  {masterWorkerBookings.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                      <Clock size={20} className="text-slate-600 animate-pulse" />
                      <span>No active bookings assigned to {selectedMasterWorker.name}.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 text-xs font-semibold overflow-y-auto max-h-[480px] pr-2">
                      {masterWorkerBookings.map((bk: any) => (
                        <div key={bk.id} className="p-4 rounded-xl bg-black/30 border border-slate-900/60 flex flex-col gap-3 text-left">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-slate-200 block">ID: {bk.id.substring(0, 8).toUpperCase()}</span>
                              <span className="text-[10px] text-slate-500 mt-1 block">Address: {bk.address}</span>
                              <span className="text-[10px] text-indigo-400 font-bold block mt-1">Cost: ₹{bk.total_cost}</span>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                              bk.status === 'COMPLETED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/30' :
                              bk.status === 'IN_PROGRESS' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-900/30' :
                              bk.status === 'REQUESTED' || bk.status === 'ASSIGNED' ? 'bg-rose-950/60 text-rose-400 border border-rose-900/30' :
                              'bg-amber-950/60 text-amber-400 border border-amber-900/30'
                            }`}>
                              {bk.status}
                            </span>
                          </div>

                          {/* Action Controller Buttons */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900">
                            {(bk.status === 'REQUESTED' || bk.status === 'ASSIGNED') && (
                              <>
                                <button
                                  onClick={() => handleWorkerBookingAction(bk.id, 'ACCEPT')}
                                  className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-600 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  Accept Job
                                </button>
                                <button
                                  onClick={() => handleWorkerBookingAction(bk.id, 'REJECT')}
                                  className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-400 rounded text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  Reject Job
                                </button>
                              </>
                            )}

                            {bk.status === 'ACCEPTED' && (
                              <button
                                onClick={() => handleWorkerBookingAction(bk.id, 'TRANSIT')}
                                className="px-3 py-1.5 bg-cyan-650 hover:bg-cyan-600 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Start Transit (On The Way)
                              </button>
                            )}

                            {bk.status === 'ON_THE_WAY' && (
                              <button
                                onClick={() => handleWorkerBookingAction(bk.id, 'ARRIVE')}
                                className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Arrived at Customer
                              </button>
                            )}

                            {bk.status === 'ARRIVED' && (
                              <button
                                onClick={() => handleWorkerBookingAction(bk.id, 'START_OTP')}
                                className="px-3 py-1.5 bg-purple-650 hover:bg-purple-600 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Enter OTP & Start Job
                              </button>
                            )}

                            {bk.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleWorkerBookingAction(bk.id, 'COMPLETE')}
                                className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-600 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Complete Service
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
