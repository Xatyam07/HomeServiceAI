"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, Calendar, CreditCard, Sparkles, MapPin, 
  ArrowRight, ShieldCheck, Clock, Zap, Wrench, Cpu, 
  Paintbrush, Flame, Shield, HelpCircle, History, 
  AlertTriangle, DollarSign, X, Check, MessageSquare, Send, UserCheck, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Provider database for matching
const MOCK_PROVIDERS: Record<string, any[]> = {
  "Electrician": [
    { name: "Amit Sharma", exp: 9, rating: 4.85, rate: 350, distance: 2.1, success: 98, response: 95 },
    { name: "Rohan Varma", exp: 5, rating: 4.5, rate: 300, distance: 1.2, success: 92, response: 88 },
    { name: "Suresh Gupta", exp: 12, rating: 4.92, rate: 500, distance: 3.5, success: 99, response: 97 }
  ],
  "Plumber": [
    { name: "Ramesh Patel", exp: 11, rating: 4.9, rate: 400, distance: 1.8, success: 97, response: 96 },
    { name: "Vikas Kumar", exp: 4, rating: 4.2, rate: 250, distance: 0.9, success: 85, response: 90 },
    { name: "Naresh Rao", exp: 15, rating: 4.95, rate: 600, distance: 4.2, success: 100, response: 99 }
  ],
  "AC Repair": [
    { name: "Karan Singh", exp: 8, rating: 4.75, rate: 450, distance: 2.7, success: 96, response: 94 },
    { name: "Vikram Dev", exp: 14, rating: 4.98, rate: 700, distance: 3.1, success: 99, response: 98 }
  ],
  "Painting": [
    { name: "Deepak Joshi", exp: 7, rating: 4.6, rate: 350, distance: 4.5, success: 94, response: 92 }
  ],
  "Pest Control": [
    { name: "Arjun Rao", exp: 10, rating: 4.8, rate: 650, distance: 5.0, success: 97, response: 95 }
  ],
  "Babysitter": [
    { name: "Pooja Hegde", exp: 6, rating: 4.9, rate: 300, distance: 2.3, success: 98, response: 98 }
  ]
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [activeStep, setActiveStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  
  // AI Diagnostics Results
  const [aiReport, setAiReport] = useState<any>(null);
  
  // Match Pros
  const [matchingPros, setMatchingPros] = useState<any[]>([]);
  const [selectedPro, setSelectedPro] = useState<any>(null);
  
  // Booking Info
  const [scheduledTime, setScheduledTime] = useState('');
  const [address, setAddress] = useState('Flat 405, Block B, Rainbow Residency, Hitec City, Hyderabad');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isPaying, setIsPaying] = useState(false);

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'ai', text: "Hello! I am your HomeSphere AI Assistant. How can I help you today? (e.g. My AC isn't cooling, tap is leaking...)" }
  ]);

  // Read URL query parameters
  useEffect(() => {
    const querySvc = searchParams.get('service');
    if (querySvc) {
      setSelectedService(querySvc);
      if (querySvc === 'Electrician') {
        setProblemDescription("Sparks coming from the bedroom light switchboard when turned on.");
      } else if (querySvc === 'Plumber') {
        setProblemDescription("Kitchen sink is leaking water underneath the wooden cabinet.");
      }
    }
  }, [searchParams]);

  // Run AI diagnosis simulation
  const runDiagnostics = () => {
    if (!selectedService) return;
    setDiagnosing(true);
    
    setTimeout(() => {
      let duration = 60;
      let complexity = "MODERATE";
      let urgency = isEmergency ? "EMERGENCY" : "HIGH";
      let laborMin = 250;
      let laborMax = 450;
      let matMin = 150;
      let matMax = 500;
      let issue = "Wiring Fault / Short Circuit";

      if (selectedService === 'Plumber') {
        issue = "P-Trap Joint Corrosion and Leakage";
        complexity = "SIMPLE";
        duration = 50;
        laborMin = 300;
        laborMax = 550;
        matMin = 250;
        matMax = 800;
      } else if (selectedService === 'AC Repair') {
        issue = "Compressor Capacitor Wear / Low Refrigerant";
        complexity = "MODERATE";
        duration = 90;
        laborMin = 500;
        laborMax = 950;
        matMin = 1200;
        matMax = 2800;
      }

      setAiReport({
        issue,
        complexity,
        urgency,
        duration: `${duration} mins`,
        laborCost: `₹${laborMin} - ₹${laborMax}`,
        materialCost: `₹${matMin} - ₹${matMax}`,
        gst: `₹${Math.round((laborMin + matMin) * 0.18)} (18% GST)`
      });

      // Calculate Smart Match scores for candidates
      const candidates = MOCK_PROVIDERS[selectedService] || MOCK_PROVIDERS["Plumber"];
      const scored = candidates.map(c => {
        // Distance score
        const distScore = Math.max(0, 100 - (c.distance * 7.5));
        const ratingScore = (c.rating / 5.0) * 100;
        const expScore = Math.min(100, (c.exp / 10.0) * 100);
        const priceScore = Math.max(0, 100 - (c.rate / 800.0) * 100);
        const relScore = (c.response * 0.4) + (c.success * 0.6);
        const total = (distScore * 0.3) + (ratingScore * 0.25) + (expScore * 0.15) + (priceScore * 0.15) + (relScore * 0.15);
        const eta = Math.max(4, Math.round(c.distance * 2.8 + 6));
        
        return {
          ...c,
          matchScore: Math.round(total),
          eta
        };
      }).sort((a, b) => b.matchScore - a.matchScore);

      setMatchingPros(scored);
      if (scored.length > 0) setSelectedPro(scored[0]);
      setDiagnosing(false);
      setActiveStep(2);
    }, 1500);
  };

  // Pay and trigger booking
  const handlePayment = () => {
    setIsPaying(true);

    const bookingPayload = {
      customerId: "5300bfd4-1a2c-4977-9876-000000000001", // Fallback seeded customer UUID
      providerId: null,
      serviceType: selectedService,
      description: problemDescription,
      address: address,
      isEmergency: isEmergency,
      laborCost: isEmergency ? selectedPro.rate + 150 : selectedPro.rate,
      materialCost: 0.0,
      totalCost: isEmergency ? Math.round((selectedPro.rate + 150) * 1.18) : Math.round(selectedPro.rate * 1.18),
      durationMin: 60,
      latitude: 17.4485,
      longitude: 78.3741
    };

    fetch('http://localhost:8000/api/bookings/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    })
    .then(res => {
      if (!res.ok) throw new Error("Booking creation failed");
      return res.json();
    })
    .then(booking => {
      // Create Razorpay Order
      const orderPayload = {
        booking_id: booking.id,
        user_id: booking.customer_id,
        amount: booking.total_cost
      };
      
      return fetch('http://localhost:8000/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      })
      .then(orderRes => orderRes.json())
      .then(order => {
        // Verify payment
        const verifyPayload = {
          booking_id: booking.id,
          razorpay_order_id: order.id,
          razorpay_payment_id: `pay_test_${Math.random().toString(36).substring(7)}`,
          signature: "test_signature_success"
        };
        
        return fetch('http://localhost:8000/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verifyPayload)
        });
      })
      .then(() => {
        setIsPaying(false);
        router.push(`/customer/track/${booking.id}`);
      });
    })
    .catch(err => {
      console.log("Using checkout client-side fallback:", err);
      setTimeout(() => {
        setIsPaying(false);
        router.push('/customer/track/demo-booking-101');
      }, 1500);
    });
  };

  // Bot handler
  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    setTimeout(() => {
      let response = "I'm checking our services list. Could you clarify if this is an Electrical, Plumbing, or AC Repair issue?";
      const lower = userText.toLowerCase();

      if (lower.includes("ac") || lower.includes("cool")) {
        response = "Detected potential AC fault. I recommend our AC Repair service. Would you like me to populate the Electrician/AC booking wizard for you?";
        setSelectedService("AC Repair");
        setProblemDescription(userText);
      } else if (lower.includes("sink") || lower.includes("leak") || lower.includes("pipe") || lower.includes("plumb")) {
        response = "Sounds like a plumbing anomaly. I have set your service category to 'Plumber'. Let's verify details in the diagnosis panel.";
        setSelectedService("Plumber");
        setProblemDescription(userText);
      } else if (lower.includes("spark") || lower.includes("switch") || lower.includes("shock") || lower.includes("wire")) {
        response = "Caution: Electrical spark detected. Urgency set to EMERGENCY. I have configured your request as Electrician. Switch off main breakers if necessary.";
        setSelectedService("Electrician");
        setIsEmergency(true);
        setProblemDescription(userText);
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: response }]);
    }, 1000);
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
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">Customer Portal</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span className="text-emerald-400">● Verified Customer</span>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Booking wizard (7 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="rounded-2xl glass p-6 border border-white/5 relative overflow-hidden">
            {/* Step header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-900 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                  {activeStep}
                </div>
                <h2 className="font-bold text-lg">
                  {activeStep === 1 && "Configure Service Request"}
                  {activeStep === 2 && "Review AI Diagnosis & Match"}
                  {activeStep === 3 && "Secure Payment & Schedule"}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={activeStep >= 1 ? "text-indigo-400" : ""}>Request</span>
                <span>•</span>
                <span className={activeStep >= 2 ? "text-indigo-400" : ""}>Diagnosis</span>
                <span>•</span>
                <span className={activeStep >= 3 ? "text-indigo-400" : ""}>Checkout</span>
              </div>
            </div>

            {/* STEP 1: CONFIGURATION */}
            {activeStep === 1 && (
              <div className="flex flex-col gap-5">
                {/* Select Service Type */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { name: 'Electrician', icon: Zap },
                      { name: 'Plumber', icon: Wrench },
                      { name: 'AC Repair', icon: Cpu },
                      { name: 'Painting', icon: Paintbrush },
                      { name: 'Pest Control', icon: Flame },
                      { name: 'Babysitter', icon: Shield }
                    ].map((svc) => {
                      const Icon = svc.icon;
                      const isSelected = selectedService === svc.name;
                      return (
                        <button
                          key={svc.name}
                          onClick={() => setSelectedService(svc.name)}
                          className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                            isSelected 
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5' 
                              : 'bg-black/20 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-xs font-semibold">{svc.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Problem details */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Problem Description</label>
                  <textarea
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    placeholder="Provide details about the fault (e.g., sink leaking under bathroom cabinet)..."
                    rows={4}
                    className="w-full p-3 rounded-xl border border-slate-900 bg-black/20 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm resize-none"
                  />
                </div>

                {/* Photo Simulation */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upload Reference Image (Optional)</label>
                  <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center hover:bg-white/5 transition-colors cursor-pointer flex flex-col items-center gap-1.5">
                    <Sparkles size={20} className="text-indigo-400 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-300">Drag photo or click to upload</span>
                    <span className="text-[10px] text-slate-500">AI extracts details automatically</span>
                  </div>
                </div>

                {/* Emergency Toggle */}
                <div className="flex items-center justify-between p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
                  <div className="flex gap-3">
                    <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200">Emergency SOS Request</span>
                      <span className="text-[10px] text-slate-400">Pings closest pros immediately for standard emergency fee (+₹150)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEmergency(!isEmergency)}
                    className={`w-12 h-6.5 rounded-full transition-all relative p-1 ${isEmergency ? 'bg-red-600' : 'bg-slate-800'}`}
                  >
                    <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform ${isEmergency ? 'translate-x-5.5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Submit button */}
                <button
                  onClick={runDiagnostics}
                  disabled={diagnosing || !selectedService || !problemDescription}
                  className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition-colors disabled:opacity-50"
                >
                  {diagnosing ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Running AI Diagnostics Models...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Diagnose Problem & Find Match</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* STEP 2: DIAGNOSIS & MATCH */}
            {activeStep === 2 && aiReport && (
              <div className="flex flex-col gap-5">
                {/* AI report card */}
                <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-900/30 flex flex-col gap-3">
                  <div className="flex justify-between items-center pb-2 border-b border-indigo-900/20">
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <Sparkles size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">AI Diagnostics Output</span>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      97% Match Score
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Isolated Anomaly</span>
                    <span className="text-sm font-bold text-slate-200 mt-0.5">{aiReport.issue}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-900/50">
                    <div>
                      <span className="text-slate-500 block">Urgency Priority</span>
                      <span className={`font-semibold ${aiReport.urgency === 'EMERGENCY' ? 'text-red-400' : 'text-slate-200'}`}>{aiReport.urgency}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Complexity</span>
                      <span className="font-semibold text-slate-200">{aiReport.complexity}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Est. Labor Cost</span>
                      <span className="font-semibold text-emerald-400">{aiReport.laborCost}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Est. Material Cost</span>
                      <span className="font-semibold text-slate-300">{aiReport.materialCost}</span>
                    </div>
                  </div>
                </div>

                {/* Match List */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matched Professionals (Smart Recommendation)</label>
                  <div className="flex flex-col gap-3">
                    {matchingPros.map((pro, index) => {
                      const isSelected = selectedPro?.name === pro.name;
                      return (
                        <div
                          key={index}
                          onClick={() => setSelectedPro(pro)}
                          className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-slate-900 border-indigo-500 shadow-md' 
                              : 'bg-black/30 border-slate-900 hover:border-slate-800'
                          }`}
                        >
                          <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-850 flex items-center justify-center text-xs font-bold border border-slate-700">
                              {pro.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div className="flex flex-col text-left">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-slate-200">{pro.name}</span>
                                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-mono">
                                  {pro.matchScore}% Match
                                </span>
                              </div>
                              <div className="flex gap-2.5 items-center mt-1 text-[10px] text-slate-500">
                                <span className="flex items-center gap-0.5 text-yellow-400">
                                  <Star size={10} className="fill-yellow-400" />
                                  <span>{pro.rating}</span>
                                </span>
                                <span>•</span>
                                <span>{pro.exp} yrs exp</span>
                                <span>•</span>
                                <span>{pro.distance} km away</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col text-right items-end gap-1">
                            <span className="text-sm font-bold text-indigo-400">₹{pro.rate}/hr</span>
                            <span className="text-[9px] text-slate-500">ETA: {pro.eta} mins</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    disabled={!selectedPro}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Proceed to Booking</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CHECKOUT */}
            {activeStep === 3 && selectedPro && (
              <div className="flex flex-col gap-5 text-left">
                {/* Review selection */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Technician</span>
                    <span className="text-sm font-bold text-slate-200">{selectedPro.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Rate</span>
                    <span className="text-sm font-bold text-indigo-400">₹{selectedPro.rate}/hr</span>
                  </div>
                </div>

                {/* Scheduling */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking Schedule</label>
                  {isEmergency ? (
                    <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs font-semibold">
                      ⚡ Dispatching immediately under EMERGENCY SOS protocol.
                    </div>
                  ) : (
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-900 bg-black/20 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  )}
                </div>

                {/* Address */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-900 bg-black/20 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Payment Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['UPI', 'Credit/Debit Card', 'Wallet'].map((method) => {
                      const isSel = paymentMethod === method;
                      return (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                            isSel 
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                              : 'bg-black/25 border-slate-900 hover:border-slate-800 text-slate-400'
                          }`}
                        >
                          {method}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bill details */}
                <div className="p-4 bg-black/30 rounded-xl border border-slate-900 text-xs flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Diagnostics Consultation (AI Model)</span>
                    <span className="text-emerald-400">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Labor (Base)</span>
                    <span>₹{selectedPro.rate}</span>
                  </div>
                  {isEmergency && (
                    <div className="flex justify-between text-red-400">
                      <span>Emergency SOS Dispatch Fee</span>
                      <span>₹150</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service CGST + SGST (18%)</span>
                    <span>₹{isEmergency ? Math.round((selectedPro.rate + 150) * 0.18) : Math.round(selectedPro.rate * 0.18)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm text-slate-200">
                    <span>Total Estimated Payment</span>
                    <span className="text-indigo-400">
                      ₹{isEmergency 
                        ? Math.round((selectedPro.rate + 150) * 1.18) 
                        : Math.round(selectedPro.rate * 1.18)
                      }
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isPaying}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {isPaying ? (
                      <>
                        <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={15} />
                        <span>Confirm & Pay Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Active bookings/history + promo blocks (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 text-left">
          {/* Diagnostic Stats Widget */}
          <div className="p-6 rounded-2xl glass border border-slate-900 flex flex-col gap-4">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <History size={15} className="text-indigo-400" />
              <span>Booking Telemetry</span>
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-slate-900">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">Active Bookings</span>
                  <span className="text-sm font-bold text-white">0</span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800 animate-pulse" />
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-slate-900">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">Total Saved via AI Diagnostics</span>
                  <span className="text-sm font-bold text-emerald-400">₹850</span>
                </div>
                <Sparkles size={14} className="text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Prompt card */}
          <div className="p-6 rounded-2xl bg-gradient-to-tr from-indigo-950/20 to-purple-950/20 border border-indigo-900/30 flex flex-col gap-3">
            <Sparkles size={24} className="text-indigo-400 animate-pulse" />
            <h4 className="font-bold text-sm text-slate-200">AI-Smart Matching Active</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We dynamically rank providers by distance, ratings, pricing, and historical callback latency. This filters out unreliable matches and saves you money.
            </p>
          </div>
        </div>
      </main>

      {/* Floating Interactive AI Assistant chatbot */}
      <div className="fixed bottom-24 right-6 z-40">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-80 h-96 rounded-2xl glass-premium border-white/10 glow-primary shadow-2xl flex flex-col overflow-hidden mb-3"
            >
              {/* Header */}
              <div className="bg-indigo-950/60 p-4 border-b border-white/5 flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">AI Diagnostics Guide</h4>
                    <span className="text-[9px] text-slate-500">Online • Smart Diagnostics</span>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-xs">
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`max-w-[80%] p-2.5 rounded-xl text-left leading-relaxed ${
                      msg.sender === 'ai' 
                        ? 'bg-slate-900 border border-slate-800 text-slate-300 mr-auto rounded-tl-none' 
                        : 'bg-indigo-600 text-white ml-auto rounded-tr-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Input field */}
              <div className="p-3 border-t border-white/5 bg-slate-950/40 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type an issue (e.g. leaking sink)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                  className="flex-1 bg-black/40 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleChatSend}
                  className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  <Send size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="flex items-center justify-center w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg glow-primary active:scale-95 transition-transform"
        >
          <MessageSquare size={20} />
        </button>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span>Synchronizing HomeSphere Dashboard...</span>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
