"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, Clock, MessageSquare, Send, CheckCircle2, Phone, 
  Sparkles, ShieldCheck, Download, AlertTriangle, Play, ChevronRight, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import { useTheme } from '@/app/theme-provider';
import dynamic from 'next/dynamic';
import { formatToIST, formatToISTFull } from '@/utils/timezone';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-slate-900/40 border border-white/5 rounded-2xl animate-pulse">
      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syncing map view...</span>
    </div>
  ),
});

export default function TrackBooking() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://homeserviceai-1.onrender.com';
  const { token } = useAuth();
  const params = useParams();
  const bookingId = params?.id;
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewClosed, setReviewClosed] = useState(false);

  const handleReviewSubmit = async () => {
    if (!reviewComment.trim()) {
      alert("Please write a review comment.");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.is_flagged) {
          alert(`Review submitted but flagged by AI Reviewer!\nReason: ${data.flag_reason}`);
        } else {
          alert(`Review submitted successfully!\nAI Sentiment Score: ${data.ai_sentiment}`);
        }
        setReviewClosed(true);
        window.location.href = '/customer/dashboard';
      } else {
        const err = await res.json();
        alert(`Failed to submit review: ${err.detail || err.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Timeline status states
  const [currentStatus, setCurrentStatus] = useState<string>('DEPARTED');
  const [eta, setEta] = useState(8);
  const [etaSeconds, setEtaSeconds] = useState(30);
  const [otp, setOtp] = useState('----');
  const [showOtpVerified, setShowOtpVerified] = useState(false);
  const [jobProgress, setJobProgress] = useState(0);
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    if (currentStatus !== 'ON_THE_WAY') return;
    setEtaSeconds(30);
    const secInterval = setInterval(() => {
      setEtaSeconds(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(secInterval);
  }, [currentStatus]);

  useEffect(() => {
    setFormattedDate(formatToISTFull(new Date()));
  }, []);

  useEffect(() => {
    if (!token || !bookingId || bookingId === 'demo-booking-101') {
      setOtp('7742');
      return;
    }

    const loadBookingData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBookingDetails(data);
          if (data.status) {
            setCurrentStatus(data.status);
          }
          if (data.eta_minutes !== null) {
            setEta(data.eta_minutes);
          }
        }
        
        // Fetch OTP
        const otpRes = await fetch(`${API_BASE}/api/bookings/${bookingId}/otp`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (otpRes.ok) {
          const otpData = await otpRes.json();
          setOtp(otpData.otp);
        }
      } catch (err) {
        console.error("Failed to load booking telemetry:", err);
      }
    };

    loadBookingData();
    const interval = setInterval(loadBookingData, 4000);

    // WebSocket connection with production fallback
    const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || 'wss://homeserviceai-1.onrender.com').replace(/\/$/, '') + '/api/ws/' + bookingId;
    console.log("Customer WebSocket connecting:", wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("Customer received event:", msg);
        if (msg.booking_id === bookingId || msg.booking_id === String(bookingId)) {
          loadBookingData();
        }
      } catch (err) {
        console.error("Error parsing customer WebSocket message:", err);
      }
    };

    return () => {
      socket.close();
    };
  }, [token, bookingId, API_BASE]);

  // Chat with technician
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'tech', text: 'Hi! I am Ramesh Patel. I have accepted your request and I am gathering my plumbing toolkit. I will be heading your way in 2 minutes.' },
    { sender: 'tech', text: 'I am on my way now. Traffic looks normal.' }
  ]);

  // Invoice simulation
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  // Technician tracking simulation variables
  const { theme } = useTheme();
  const destCoords: [number, number] = (bookingDetails?.latitude && bookingDetails?.longitude)
    ? [bookingDetails.latitude, bookingDetails.longitude]
    : [26.4173, 80.3341];
  const startCoords: [number, number] = [
    destCoords[0] + 0.008,
    destCoords[1] - 0.012
  ];

  const [routePoints, setRoutePoints] = useState<Array<[number, number]>>([]);
  const [techIndex, setTechIndex] = useState(0);

  // Generate simulated route with multiple street intersection turns
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
    const pts = generateSimulatedRoute(startCoords, destCoords);
    setRoutePoints(pts);
  }, [bookingDetails?.latitude, bookingDetails?.longitude]);

  useEffect(() => {
    if (routePoints.length === 0 || currentStatus !== 'ON_THE_WAY') return;
    
    // Start from beginning when transit is active
    setTechIndex(0);

    const interval = setInterval(() => {
      setTechIndex((prev) => {
        const next = prev + 1;
        if (next >= routePoints.length - 1) {
          clearInterval(interval);
          return routePoints.length - 1;
        }

        const remainingPct = (routePoints.length - 1 - next) / (routePoints.length - 1);
        const nextEta = Math.max(1, Math.round(remainingPct * 15)); // ETA 15 seconds to 0 seconds
        setEta(nextEta);

        return next;
      });
    }, 1000); // 1 second intervals for exactly 15 seconds

    return () => clearInterval(interval);
  }, [routePoints, currentStatus]);

  const arrivedOrLater = ['ARRIVED', 'OTP_VERIFIED', 'IN_PROGRESS', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'COMPLETED'].includes(currentStatus);
  const activeTechCoords = (currentStatus === 'ON_THE_WAY' && routePoints[techIndex])
    ? routePoints[techIndex]
    : arrivedOrLater
      ? destCoords
      : (bookingDetails?.tech_latitude && bookingDetails?.tech_longitude)
        ? [bookingDetails.tech_latitude, bookingDetails.tech_longitude] as [number, number]
        : (routePoints[techIndex] || startCoords);

  // Job progress simulator (when status is IN_PROGRESS)
  useEffect(() => {
    if (currentStatus !== 'IN_PROGRESS') return;
    const interval = setInterval(() => {
      setJobProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCurrentStatus('COMPLETED');
          return 100;
        }
        return prev + 5;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStatus]);

  // Handle client chat message
  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: chatInput }]);
    const text = chatInput;
    setChatInput('');

    setTimeout(() => {
      let reply = "Understood. I'm parking the vehicle now.";
      if (text.toLowerCase().includes('gate') || text.toLowerCase().includes('code')) {
        reply = "Copy that, I will enter gate code at the barrier.";
      }
      setChatMessages(prev => [...prev, { sender: 'tech', text: reply }]);
    }, 1200);
  };

  // Start Job with OTP
  const verifyOtpAndStart = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp })
      });
      if (res.ok) {
        setShowOtpVerified(true);
        // Also call start service immediately
        await fetch(`${API_BASE}/api/bookings/${bookingId}/start-service`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setTimeout(() => {
          setShowOtpVerified(false);
          setCurrentStatus('SERVICE_STARTED');
        }, 1500);
      } else {
        const data = await res.json();
        alert(`Failed to verify: ${data.detail}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmCompletion = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/confirm-completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert("Completion confirmed! Payout released to technician.");
        setCurrentStatus('SERVICE_COMPLETED');
      } else {
        const data = await res.json();
        alert(`Failed to confirm: ${data.detail}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const payOutstandingInvoice = async (method: 'Wallet' | 'UPI' | 'Razorpay' | 'Cash') => {
    if (!bookingDetails) return;
    try {
      if (method === 'Wallet') {
        const res = await fetch(`${API_BASE}/api/payments/wallet/pay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            booking_id: bookingId,
            user_id: bookingDetails.customer_id,
            amount: bookingDetails.total_cost
          })
        });
        if (res.ok) {
          alert("Payment verified successfully! Outstanding balance cleared.");
          setCurrentStatus('PAYMENT_COMPLETED');
          const reloadRes = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (reloadRes.ok) {
            setBookingDetails(await reloadRes.json());
          }
        } else {
          const err = await res.json();
          alert(`Wallet payment failed: ${err.detail}`);
        }
      } else if (method === 'Cash') {
        const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'PAYMENT_COMPLETED' })
        });
        if (res.ok) {
          alert("Cash payment confirmed! Outstanding balance cleared.");
          setCurrentStatus('PAYMENT_COMPLETED');
          const reloadRes = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (reloadRes.ok) {
            setBookingDetails(await reloadRes.json());
          }
        } else {
          alert("Failed to confirm Cash payment.");
        }
      } else {
        // UPI or Razorpay
        const orderRes = await fetch(`${API_BASE}/api/payments/order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            booking_id: bookingId,
            user_id: bookingDetails.customer_id,
            amount: bookingDetails.total_cost,
            payment_type: 'FULL_AFTER'
          })
        });
        if (!orderRes.ok) throw new Error("Failed to create checkout order.");
        const order = await orderRes.json();

        const verifyRes = await fetch(`${API_BASE}/api/payments/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            booking_id: bookingId,
            razorpay_order_id: order.id,
            razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 9)}`,
            signature: "mock_signature_success"
          })
        });
        if (verifyRes.ok) {
          alert(`${method} Payment captured successfully! Outstanding balance cleared.`);
          setCurrentStatus('PAYMENT_COMPLETED');
          const reloadRes = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (reloadRes.ok) {
            setBookingDetails(await reloadRes.json());
          }
        } else {
          alert(`${method} verification failed.`);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Payment processing encountered an error.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative grid-bg">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-extrabold text-lg text-white">
              <Sparkles size={18} className="text-indigo-400" />
              <span>HomeSphere AI</span>
            </Link>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">Live Tracking</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Booking ID:</span>
            <span className="text-indigo-400 font-mono">#HS-9942A-DEL</span>
          </div>
        </div>
      </header>

      {/* Main Track Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Map Simulator Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="rounded-2xl glass p-5 border border-white/5 relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-900 mb-4">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-cyan-400" />
                <span className="font-bold text-sm">Live Location Tracking Map</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Real-Time Routing Map (Active)</span>
            </div>

            <div className="rounded-xl border border-slate-900 bg-black/40 overflow-hidden relative w-full h-[320px]">
              <MapComponent
                center={destCoords}
                customerMarker={destCoords}
                techMarker={activeTechCoords}
                routeCoordinates={routePoints}
                theme={theme}
              />
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 flex flex-col z-[400]">
                <span>Latitude: {activeTechCoords[0].toFixed(5)}</span>
                <span>Longitude: {activeTechCoords[1].toFixed(5)}</span>
              </div>
            </div>

            {/* ETA indicator */}
            <div className="grid grid-cols-3 gap-4 mt-5 p-4 rounded-xl bg-black/20 border border-slate-900">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Status</span>
                <span className="text-xs font-bold text-cyan-400 mt-1 block">
                  {currentStatus === 'PENDING_PROVIDER_ACCEPTANCE' && 'Searching...'}
                  {currentStatus === 'ACCEPTED' && 'Assigned'}
                  {currentStatus === 'ON_THE_WAY' && 'En Route'}
                  {currentStatus === 'ARRIVED' && 'Arrived'}
                  {currentStatus === 'OTP_VERIFIED' && 'OTP Verified'}
                  {currentStatus === 'SERVICE_STARTED' && 'Service Started'}
                  {currentStatus === 'SERVICE_COMPLETED' && 'Service Completed'}
                  {currentStatus === 'PAYMENT_PENDING' && 'Payment Pending'}
                  {currentStatus === 'PAYMENT_COMPLETED' && 'Payment Completed'}
                  {currentStatus === 'REVIEW_PENDING' && 'Review Pending'}
                  {currentStatus === 'CLOSED' && 'Closed'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Estimated Arrival</span>
                <span className="text-xs font-bold text-slate-200 mt-1 block">
                  {currentStatus === 'ON_THE_WAY' ? `${etaSeconds}s` : (eta > 0 ? `${eta} mins` : 'Arrived')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Verification OTP</span>
                <span className="text-xs font-bold text-indigo-400 mt-1 block font-mono">
                  {otp}
                </span>
              </div>
            </div>

            {/* Payment Outstanding Card */}
            {bookingDetails?.payment_status === 'PENDING' && (
              <div className="mt-5 p-5 rounded-2xl border border-yellow-900/30 bg-gradient-to-tr from-yellow-950/20 to-amber-950/20 text-left flex flex-col gap-3 shadow-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Sparkles size={16} className="animate-pulse" />
                    <span className="font-extrabold text-xs tracking-wider uppercase">OUTSTANDING PAYMENT DUE</span>
                  </div>
                  <span className="font-extrabold text-base text-emerald-400">₹{bookingDetails?.total_cost}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  Your service has been completed successfully. Please select a payment option to clear the invoice outstanding balance.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    onClick={() => payOutstandingInvoice('Wallet')}
                    className="py-2.5 bg-slate-900 hover:bg-slate-850 text-xs text-slate-200 border border-slate-800 rounded-xl font-bold transition-all cursor-pointer text-center"
                  >
                    Wallet
                  </button>
                  <button
                    onClick={() => payOutstandingInvoice('UPI')}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs text-white rounded-xl font-bold transition-all cursor-pointer text-center"
                  >
                    UPI
                  </button>
                  <button
                    onClick={() => payOutstandingInvoice('Razorpay')}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white rounded-xl font-bold transition-all cursor-pointer text-center"
                  >
                    Razorpay
                  </button>
                  <button
                    onClick={() => payOutstandingInvoice('Cash')}
                    className="py-2.5 bg-amber-600 hover:bg-amber-500 text-xs text-white rounded-xl font-bold transition-all cursor-pointer text-center"
                  >
                    Cash
                  </button>
                </div>
              </div>
            )}

            {/* Payment Completed & Closed Card */}
            {['PAYMENT_COMPLETED', 'COMPLETED', 'CLOSED'].includes(currentStatus) && (
              <div className="mt-5 p-5 rounded-2xl border border-emerald-900/30 bg-gradient-to-tr from-emerald-950/20 to-teal-950/20 text-left flex flex-col gap-3 shadow-lg">
                <div className="flex justify-between items-center text-emerald-450">
                  <div className="flex items-center gap-1.5 font-extrabold text-xs tracking-wider uppercase">
                    <Sparkles size={14} className="text-emerald-450 animate-pulse" />
                    <span>SERVICE COMPLETED & CLOSED</span>
                  </div>
                  <span className="font-extrabold text-xs text-emerald-400">Paid</span>
                </div>
                <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                  This booking has been completed successfully and payment is cleared. Thank you for choosing HomeSphere AI!
                </p>
                <button
                  onClick={() => window.location.href = '/customer/dashboard'}
                  className="w-full py-2.5 bg-emerald-650 hover:bg-emerald-600 text-xs text-white rounded-xl font-bold transition-all text-center"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Timeline Tracking */}
          <div className="rounded-2xl glass p-6 border border-white/5 flex flex-col gap-4">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Activity Timeline</h3>
            <div className="flex flex-col gap-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
              
              {[
                { key: 'ACCEPTED', dbKeys: ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'PAYMENT_SUCCESSFUL'], label: 'Booking Confirmed', desc: 'Ramesh Patel (Plumber) matched and accepted the job schedule.', time: '07:54 PM' },
                { key: 'ON_THE_WAY', dbKeys: ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'PAYMENT_SUCCESSFUL'], label: 'Technician Departed', desc: 'Ramesh has left transit yard with toolkit, driving along Outer Ring Road.', time: '07:56 PM' },
                { key: 'ARRIVED', dbKeys: ['ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'PAYMENT_SUCCESSFUL'], label: 'Technician Arrived', desc: 'Provider at location. Verification OTP needed to commence repair.', time: '07:58 PM' },
                { key: 'IN_PROGRESS', dbKeys: ['IN_PROGRESS', 'COMPLETED', 'PAYMENT_SUCCESSFUL'], label: 'Repair In Progress', desc: 'Replacing joint pipe gaskets and cleaning internal trap blocks.', time: '---' },
                { key: 'COMPLETED', dbKeys: ['COMPLETED', 'PAYMENT_SUCCESSFUL'], label: 'Job Finalized', desc: 'Leakage verified resolved. GST invoice generated successfully.', time: '---' }
              ].map((step, idx) => {
                const isFinished = step.dbKeys.includes(currentStatus);
                const isCurrent = currentStatus === step.key || (step.key === 'COMPLETED' && currentStatus === 'PAYMENT_SUCCESSFUL') || (step.key === 'ON_THE_WAY' && currentStatus === 'DEPARTED');

                return (
                  <div key={idx} className="flex gap-4 relative">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-colors ${
                      isFinished 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : isCurrent
                        ? 'bg-slate-950 border-cyan-400 text-cyan-400'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}>
                      {isFinished ? <CheckCircle2 size={12} className="fill-indigo-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-0.5">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold text-xs ${isCurrent ? 'text-cyan-400' : 'text-slate-200'}`}>{step.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{step.time}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 leading-normal mt-0.5">{step.desc}</span>

                      {/* Trigger Actions for Simulation */}
                      {step.key === 'ARRIVED' && isCurrent && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={verifyOtpAndStart}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Play size={10} />
                            <span>Submit OTP ({otp}) & Start Job</span>
                          </button>
                        </div>
                      )}

                      {step.key === 'IN_PROGRESS' && isCurrent && (
                        <div className="mt-2.5 flex flex-col gap-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Job Completion Progress</span>
                            <span>{jobProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${jobProgress}%` }} />
                          </div>
                        </div>
                      )}

                      {step.key === 'COMPLETED' && isFinished && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => setInvoiceOpen(true)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Download size={10} />
                            <span>Download GST Invoice (PDF)</span>
                          </button>

                          {currentStatus === 'COMPLETED' && (
                            <button
                              onClick={confirmCompletion}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-colors"
                            >
                              Confirm Completion & Payout
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>

        {/* Right Side: Provider details & Sockets Chat (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Provider Card */}
          <div className="rounded-2xl glass p-5 border border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <div className="flex gap-2.5 items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  RP
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-sm text-slate-200">Ramesh Patel</h4>
                  <span className="text-[10px] text-slate-500">Verified Plumber • 11 yrs exp</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 bg-slate-900 border border-slate-800 rounded-xl">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-[10px] text-slate-400 font-bold">Vaccinated & KYC Verified</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1 text-slate-400">
                <Phone size={12} />
                <span>+91 98450 12842</span>
              </div>
              <span className="text-slate-500">Hourly Rate: ₹400/hr</span>
            </div>
          </div>

          {/* Sockets Chat simulator */}
          <div className="rounded-2xl glass p-5 border border-white/5 flex flex-col h-[280px] overflow-hidden">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900 mb-3">
              <div className="flex items-center gap-1.5">
                <MessageSquare size={16} className="text-indigo-400" />
                <span className="font-bold text-xs text-slate-300">Live Chat with Ramesh</span>
              </div>
              <span className="text-[9px] text-emerald-400 font-mono animate-pulse">● Socket Connected</span>
            </div>

            {/* Chat message box */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3 text-xs">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`max-w-[85%] p-2 rounded-xl text-left leading-relaxed ${
                    msg.sender === 'tech' 
                      ? 'bg-slate-900 border border-slate-800 text-slate-300 mr-auto rounded-tl-none' 
                      : 'bg-indigo-600 text-white ml-auto rounded-tr-none'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="pt-2 border-t border-slate-900 flex items-center gap-2">
              <input
                type="text"
                placeholder="Message Ramesh..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                className="flex-1 bg-black/30 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleChatSend}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Invoice PDF Modal Simulator */}
      <AnimatePresence>
        {invoiceOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl glass-premium p-6 border-white/10 glow-primary shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-400" />
                  <span className="font-extrabold text-sm tracking-widest text-slate-200">GST REPAIR INVOICE</span>
                </div>
                <button 
                  onClick={() => setInvoiceOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Invoice body */}
              <div className="mt-4 flex flex-col gap-4 text-xs">
                <div className="flex justify-between border-b border-slate-900 pb-3">
                  <div>
                    <h5 className="font-bold text-slate-200 text-sm">HomeSphere AI Pvt Ltd</h5>
                    <span className="text-slate-500 mt-1 block">GSTIN: 36AAAAA1111A1Z0</span>
                    <span className="text-slate-500 block">Hitec City, Hyderabad, IN</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-300">Invoice: HS-2026-9942</span>
                    <span className="text-slate-500 mt-1 block">Date: {formattedDate || "..."}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-400">Customer Details:</span>
                  <span className="text-slate-200 font-semibold">Jane Doe</span>
                  <span className="text-slate-500">Flat 405, Rainbow Residency, Hyderabad</span>
                </div>

                <table className="w-full border-collapse mt-2 text-left">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold">
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-right">Hours/Qty</th>
                      <th className="pb-2 text-right">Rate</th>
                      <th className="pb-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    <tr className="text-slate-300">
                      <td className="py-2.5">Plumbing Diagnosis & Joint Restoration</td>
                      <td className="py-2.5 text-right">1 hr</td>
                      <td className="py-2.5 text-right">₹400</td>
                      <td className="py-2.5 text-right">₹400</td>
                    </tr>
                    <tr className="text-slate-300">
                      <td className="py-2.5">P-Trap Gasket Rings & Sealant Gels</td>
                      <td className="py-2.5 text-right">1 Unit</td>
                      <td className="py-2.5 text-right">₹320</td>
                      <td className="py-2.5 text-right">₹320</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-3 text-slate-400 text-right items-end">
                  <div className="w-48 flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-slate-200">₹720</span>
                  </div>
                  <div className="w-48 flex justify-between">
                    <span>CGST (9%):</span>
                    <span className="text-slate-200">₹64.80</span>
                  </div>
                  <div className="w-48 flex justify-between">
                    <span>SGST (9%):</span>
                    <span className="text-slate-200">₹64.80</span>
                  </div>
                  <div className="w-48 flex justify-between border-t border-slate-900 pt-2 font-bold text-sm text-indigo-400">
                    <span>Grand Total:</span>
                    <span>₹849.60</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 text-indigo-400 rounded-xl text-center font-semibold text-[10px]">
                  Thank you for using HomeSphere AI. Paid via UPI.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Review/Feedback Modal */}
      <AnimatePresence>
        {!reviewClosed && !bookingDetails?.has_review && ['COMPLETED', 'PAYMENT_SUCCESSFUL', 'PAYMENT_COMPLETED', 'REVIEW_PENDING'].includes(currentStatus) && bookingDetails?.payment_status === 'PAID' && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl glass-premium p-6 border-white/10 glow-primary shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-900 mb-4">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                  <span className="font-extrabold text-sm tracking-wider uppercase text-slate-200">Rate Your Service Experience</span>
                </div>
                <button
                  onClick={() => {
                    setReviewClosed(true);
                    window.location.href = '/customer/dashboard';
                  }}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-[10px] font-bold"
                >
                  Skip
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <p className="text-xs text-slate-400 leading-relaxed text-center">
                  Your payment has been successfully verified. Please rate your technician and help us maintain high service standards.
                </p>

                {/* Star rating selector */}
                <div className="flex items-center justify-center gap-3 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition-transform active:scale-90 hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={
                          star <= reviewRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-750"
                        }
                      />
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Share your feedback</label>
                  <textarea
                    rows={4}
                    placeholder="Write a comment about this repair..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-900 bg-black/40 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                  />
                </div>

                <button
                  onClick={handleReviewSubmit}
                  disabled={submittingReview}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submittingReview ? "Submitting to AI Reviewer..." : "Submit Review"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
