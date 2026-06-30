"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, Calendar, CreditCard, Sparkles, MapPin, 
  ArrowRight, ShieldCheck, Clock, Zap, Wrench, Cpu, 
  Paintbrush, Flame, Shield, HelpCircle, History, 
  AlertTriangle, DollarSign, X, Check, MessageSquare, Send, UserCheck, Star, LogOut, User as UserIcon,
  Mic, Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTheme } from '@/app/theme-provider';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-slate-900/40 border border-white/5 rounded-2xl animate-pulse">
      <span className="text-xs text-slate-550 font-bold uppercase tracking-wider">Loading Map...</span>
    </div>
  ),
});

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
  const { user, token, logout, refreshUserProfile } = useAuth();
  
  // States
  const [activeStep, setActiveStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  
  // Tab selections
  const [customerTab, setCustomerTab] = useState<'home' | 'bookings' | 'wallet' | 'loyalty' | 'profile' | 'support'>('home');
  const [walletBalance, setWalletBalance] = useState(1200);
  const [loyaltyPoints, setLoyaltyPoints] = useState(350);
  const [coupons, setCoupons] = useState([
    { code: 'SPHEREAI20', desc: 'Flat 20% off on all deep cleaning services', status: 'ACTIVE' },
    { code: 'FIRSTSOS', desc: 'Free emergency SOS fee on first AC repair', status: 'ACTIVE' }
  ]);
  const [supportTickets, setSupportTickets] = useState([
    { id: 'TKT-772', subject: 'Billing anomaly - double charge', status: 'OPEN', date: '2026-06-30' },
    { id: 'TKT-551', subject: 'KYC upload delay', status: 'RESOLVED', date: '2026-06-28' }
  ]);
  
  // Profile settings
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('1995-08-12');
  const [savedAddresses, setSavedAddresses] = useState([
    { label: 'Home', val: 'Flat 405, Block B, Rainbow Residency, Hitec City, Hyderabad' },
    { label: 'Office', val: 'Building 12A, Mindspace IT Park, Madhapur, Hyderabad' }
  ]);
  const [emergencyContact, setEmergencyContact] = useState({ name: 'Rahul Mishra', phone: '+91 93690 22460' });

  const [dbBookings, setDbBookings] = useState<any[]>([]);

  const loadCustomerBookings = async () => {
    if (!token || !user) return;
    try {
      const res = await fetch(`http://localhost:8000/api/bookings/?userId=${user.id}&role=CUSTOMER`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDbBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCustomerBookings();
    const interval = setInterval(loadCustomerBookings, 8000);
    return () => clearInterval(interval);
  }, [token, user]);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone || '');
      setProfilePhoto(user.profile_photo || '');
    }
  }, [user]);

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch('http://localhost:8000/api/uploads/', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setProfilePhoto(data.url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/register-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user?.email,
          name: editName,
          phone: editPhone,
          role: "CUSTOMER",
          profile_photo: profilePhoto
        })
      });
      if (response.ok) {
        await refreshUserProfile();
        alert("Profile updated successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  // AI Diagnostics Results
  const [aiReport, setAiReport] = useState<any>(null);
  
  // Match Pros
  const [matchingPros, setMatchingPros] = useState<any[]>([]);
  const [selectedPro, setSelectedPro] = useState<any>(null);
  const [cityFilter, setCityFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [expFilter, setExpFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  
  // Booking Info
  const [scheduledTime, setScheduledTime] = useState('');
  const [address, setAddress] = useState('Flat 405, Block B, Rainbow Residency, Hitec City, Hyderabad');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isPaying, setIsPaying] = useState(false);

  const { theme } = useTheme();
  const [custCoords, setCustCoords] = useState<[number, number]>([17.4485, 78.3741]);
  const [geocoding, setGeocoding] = useState(false);
  const [geoResults, setGeoResults] = useState<any[]>([]);

  const handleAddressSearch = async (query: string) => {
    if (!query) return;
    setGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setGeoResults(data);
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSelectAddress = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setCustCoords([lat, lon]);
    setAddress(item.display_name);
    setGeoResults([]);
  };

  const getProCoords = (pro: any, index: number): [number, number] => {
    const dist = parseFloat(pro.distance) || 2.5;
    const angle = (index * 45 * Math.PI) / 180;
    const latOffset = (dist * Math.sin(angle)) / 111;
    const lngOffset = (dist * Math.cos(angle)) / (111 * Math.cos(custCoords[0] * Math.PI / 180));
    return [custCoords[0] + latOffset, custCoords[1] + lngOffset];
  };

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
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
  const runDiagnostics = async () => {
    if (!selectedService) return;
    setDiagnosing(true);
    
    // 1. Simulate AI Diagnosis
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

    // 2. Query actual Database professionals via matching endpoint
    try {
      const url = new URL('http://localhost:8000/api/ai/match/search');
      url.searchParams.append('category', selectedService);
      if (cityFilter) url.searchParams.append('city', cityFilter);
      if (ratingFilter) url.searchParams.append('min_rating', ratingFilter);
      if (priceFilter) url.searchParams.append('max_price', priceFilter);
      if (expFilter) url.searchParams.append('min_experience', expFilter);
      if (verifiedFilter) url.searchParams.append('verified_only', 'true');

      const res = await fetch(url.toString(), {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      
      const scored = data.map((c: any) => {
        const distance = c.distance_km || (4.0 + Math.random() * 5);
        const distScore = Math.max(0, 100 - (distance * 7.5));
        const ratingScore = (c.rating / 5.0) * 100;
        const expScore = Math.min(100, (c.experience_yrs / 10.0) * 100);
        const priceScore = Math.max(0, 100 - (c.hourly_rate / 800.0) * 100);
        const relScore = ((c.response_rate || 90) * 0.4) + ((c.success_rate || 95) * 0.6);
        const total = (distScore * 0.3) + (ratingScore * 0.25) + (expScore * 0.15) + (priceScore * 0.15) + (relScore * 0.15);
        const eta = Math.max(4, Math.round(distance * 2.8 + 6));
        
        return {
          id: c.id,
          name: c.name,
          rating: c.rating,
          exp: c.experience_yrs,
          rate: c.hourly_rate,
          distance: distance.toFixed(1),
          matchScore: Math.round(total),
          eta
        };
      }).sort((a: any, b: any) => b.matchScore - a.matchScore);

      setMatchingPros(scored);
      if (scored.length > 0) setSelectedPro(scored[0]);
      else setSelectedPro(null);
    } catch (err) {
      console.log("Using Mock Fallbacks for matching list:", err);
      const candidates = MOCK_PROVIDERS[selectedService] || MOCK_PROVIDERS["Plumber"];
      const scored = candidates.map(c => {
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
      else setSelectedPro(null);
    } finally {
      setDiagnosing(false);
      setActiveStep(2);
    }
  };

  // Pay and trigger booking
  const handlePayment = () => {
    setIsPaying(true);

    const bookingPayload = {
      customerId: user?.id || "5300bfd4-1a2c-4977-9876-000000000001", // Fallback seeded customer UUID
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
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
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
  const handleChatSend = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;

    // Map conversation history to API payload format
    const history = chatMessages.map((m) => ({
      role: m.sender === 'ai' ? 'model' : 'user',
      content: m.text
    }));
    history.push({ role: 'user', content: textToSend });

    setChatMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    if (!customText) setChatInput('');
    setIsChatTyping(true);

    try {
      const data = await api.post('/api/ai/diagnose/chat', { messages: history });
      const response = data.response;

      // Extract recommended service to dynamically trigger categories configuration
      const lowerRes = response.toLowerCase();
      if (lowerRes.includes("ac repair")) {
        setSelectedService("AC Repair");
      } else if (lowerRes.includes("plumber")) {
        setSelectedService("Plumber");
      } else if (lowerRes.includes("electrician")) {
        setSelectedService("Electrician");
      } else if (lowerRes.includes("pest control")) {
        setSelectedService("Pest Control");
      } else if (lowerRes.includes("painting") || lowerRes.includes("painter")) {
        setSelectedService("Painting");
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: response }]);
    } catch (err) {
      console.error("Chatbot API failed:", err);
      // Fallback rule-based matching
      let response = "I'm analyzing that query. Could you clarify if this is an Electrical, Plumbing, or AC Repair issue?";
      const lower = textToSend.toLowerCase();

      if (lower.includes("ac") || lower.includes("cool")) {
        response = "### ❄️ AC Fault Detected\n\nI recommend booking our **AC Repair** service category. \n- **Estimated base labor rate**: ₹300 - ₹500/hr\n\nI have configured your wizard to **AC Repair**. Let me know if you would like to proceed.";
        setSelectedService("AC Repair");
        setProblemDescription(textToSend);
      } else if (lower.includes("sink") || lower.includes("leak") || lower.includes("pipe") || lower.includes("plumb")) {
        response = "### 🚰 Plumbing Leak/Anomaly detected\n\nI have set your active service category to **Plumber**. \n- **Average travel ETA**: 12 mins\n\nLet me know if you want me to match you with top plumbing providers.";
        setSelectedService("Plumber");
        setProblemDescription(textToSend);
      } else if (lower.includes("spark") || lower.includes("switch") || lower.includes("shock") || lower.includes("wire")) {
        response = "### ⚡ ALERT: Electrical Spark Hazard\n\n**CRITICAL ACTION**: Switch off the main breaker.\n- **Urgency**: SOS EMERGENCY\n- **Service Category**: Electrician (Assigned)\n\nWould you like me to match you to the closest verified Electrician immediately?";
        setSelectedService("Electrician");
        setIsEmergency(true);
        setProblemDescription(textToSend);
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: response }]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const handleSimulateVoice = () => {
    setVoiceRecording(true);
    setTimeout(() => {
      setVoiceRecording(false);
      handleChatSend("AC is making a rattling noise and not cooling properly.");
    }, 2000);
  };

  const handleSimulateImageUpload = () => {
    alert("Image uploaded successfully! AI is scanning reference image for diagnostics...");
    handleChatSend("Simulated image analysis: A rusted pipe joint with active leakage at 3 drops per second.");
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
            <div className="flex gap-2">
              <button 
                onClick={() => setCustomerTab('profile')}
                className={`px-3 py-1 rounded-lg border transition-all ${
                  customerTab === 'profile' 
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                    : 'bg-slate-900 border-transparent hover:border-slate-800'
                }`}
              >
                Edit Profile
              </button>
              <button 
                onClick={logout}
                className="px-3 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/20 text-red-400 border border-red-900/30 flex items-center gap-1 transition-all"
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white overflow-hidden border border-slate-800">
              {profilePhoto ? (
                <img src={profilePhoto} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.split(' ').map((n: string) => n[0]).join('') || 'JD'}</span>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Sub-header Tab Bar */}
      <div className="max-w-7xl mx-auto px-6 mt-6 flex flex-wrap gap-3 border-b border-slate-900 pb-2.5 w-full text-left">
        {[
          { id: 'home', label: 'Book Service' },
          { id: 'bookings', label: 'My Bookings' },
          { id: 'wallet', label: 'Wallet & Payments' },
          { id: 'loyalty', label: 'Loyalty & Rewards' },
          { id: 'profile', label: 'Edit Profile' },
          { id: 'support', label: 'Live Chat & Support' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCustomerTab(tab.id as any)}
            className={`px-4.5 py-2 text-xs font-bold uppercase transition-all rounded-lg ${
              customerTab === tab.id
                ? 'bg-indigo-650 text-white shadow-md'
                : 'bg-black/30 text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1">
        {customerTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            {/* Left Side: Booking Wizard (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              <div className="rounded-2xl glass p-6 border border-white/5 relative overflow-hidden">
                {/* Step header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-900 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                      {activeStep}
                    </div>
                    <h2 className="font-bold text-lg text-white">
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
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Quick Category</label>
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
                                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md' 
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

                    {/* Dropdown for all 30 categories */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">All 30 Service Categories</label>
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-900 bg-black/45 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Choose Category --</option>
                        {[
                          "Electrician", "Plumber", "Carpenter", "Painter", "AC Repair", "RO Repair", "Refrigerator Repair", 
                          "Washing Machine Repair", "TV Repair", "Laptop Repair", "Mobile Repair", "CCTV Installation", 
                          "Pest Control", "Deep Cleaning", "Sofa Cleaning", "Bathroom Cleaning", "Kitchen Cleaning", 
                          "Home Painting", "Interior Designer", "Appliance Installation", "Packers & Movers", "Home Tutor", 
                          "Fitness Trainer", "Yoga Instructor", "Beautician", "Makeup Artist", "Pet Care", "Elder Care", 
                          "Babysitter", "Driver on Demand"
                        ].map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Advanced matching filters */}
                    <div className="p-4 bg-black/25 border border-slate-900 rounded-xl flex flex-col gap-3">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Advanced Matching Filters</span>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500">Service City</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Hyderabad"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            className="p-2.5 rounded-lg border border-slate-900 bg-black/35 text-slate-300 focus:outline-none"
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500">Min Rating</label>
                          <select 
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                            className="p-2.5 rounded-lg border border-slate-900 bg-black/35 text-slate-300 focus:outline-none"
                          >
                            <option value="">All Ratings</option>
                            <option value="4.0">4.0+ Stars</option>
                            <option value="4.5">4.5+ Stars</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500">Max Hourly Price (₹/hr)</label>
                          <input 
                            type="number"
                            placeholder="e.g. 500"
                            value={priceFilter}
                            onChange={(e) => setPriceFilter(e.target.value)}
                            className="p-2.5 rounded-lg border border-slate-900 bg-black/35 text-slate-300 focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500">Min Experience (Yrs)</label>
                          <input 
                            type="number"
                            placeholder="e.g. 5"
                            value={expFilter}
                            onChange={(e) => setExpFilter(e.target.value)}
                            className="p-2.5 rounded-lg border border-slate-900 bg-black/35 text-slate-300 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900/60 mt-1">
                        <label className="text-[10px] text-slate-500 font-semibold">Verified Professionals Only</label>
                        <input 
                          type="checkbox"
                          checked={verifiedFilter}
                          onChange={(e) => setVerifiedFilter(e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-slate-900 bg-black/30 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
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
                          <span>Run AI Diagnosis & Estimate Costs</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* STEP 2: AI DIAGNOSTICS & RANK MATCH */}
                {activeStep === 2 && aiReport && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs text-left items-start">
                    {/* Left Column: Diagnostics Report & Recommendations List */}
                    <div className="lg:col-span-6 flex flex-col gap-5">
                      <div className="p-4 rounded-xl bg-indigo-950/25 border border-indigo-900/40 leading-relaxed text-slate-300">
                        <h4 className="font-extrabold text-sm text-indigo-400 flex items-center gap-1.5 uppercase mb-2">
                          <Sparkles size={14} className="animate-pulse" />
                          <span>AI Diagnostic Report Summary</span>
                        </h4>
                        <div className="flex justify-between py-1"><span className="text-slate-500">Identified Fault:</span> <span className="font-bold text-slate-200">{aiReport.issue}</span></div>
                        <div className="flex justify-between py-1"><span className="text-slate-500">Complexity Index:</span> <span className="font-bold text-slate-200">{aiReport.complexity}</span></div>
                        <div className="flex justify-between py-1"><span className="text-slate-500">Suggested Priority:</span> <span className="font-bold text-red-400">{aiReport.urgency}</span></div>
                        <div className="flex justify-between py-1 border-t border-slate-900 mt-2 pt-2"><span className="text-slate-500">Estimated Duration:</span> <span className="font-bold text-slate-200">{aiReport.duration}</span></div>
                        <div className="flex justify-between py-1"><span className="text-slate-500">Labor Estimate:</span> <span className="font-bold text-emerald-400">{aiReport.laborCost}</span></div>
                        <div className="flex justify-between py-1"><span className="text-slate-500">Material Cost Forecast:</span> <span className="font-bold text-slate-200">{aiReport.materialCost}</span></div>
                        <div className="flex justify-between py-1"><span className="text-slate-500">Service Taxes:</span> <span className="font-bold text-slate-400">{aiReport.gst}</span></div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Scored Professional Recommendations</label>
                        <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {matchingPros.length === 0 ? (
                            <span className="text-slate-500 py-4 text-center">No providers located matching your filters.</span>
                          ) : (
                            matchingPros.map((pro, idx) => (
                              <div 
                                key={pro.id || idx}
                                onClick={() => setSelectedPro(pro)}
                                className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                                  selectedPro?.name === pro.name 
                                    ? 'bg-indigo-950/20 border-indigo-500/50 shadow-md' 
                                    : 'bg-black/20 border-slate-900 hover:border-slate-800'
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-slate-850 flex items-center justify-center font-bold text-xs">
                                    {pro.name.split(' ').map((n: string) => n[0]).join('')}
                                  </div>
                                  <div className="flex flex-col gap-0.5 text-left">
                                    <span className="font-bold text-slate-200 text-sm">{pro.name}</span>
                                    <span className="text-[10px] text-slate-500">{pro.exp} yrs experience • {pro.distance} km away</span>
                                    <span className="text-[10px] text-emerald-400">Rate: ₹{pro.rate}/hr</span>
                                  </div>
                                </div>
                                <div className="text-right flex flex-col gap-1">
                                  <span className="text-indigo-400 font-extrabold text-sm font-mono">{pro.matchScore}% Match Score</span>
                                  <span className="text-[9px] text-slate-500">ETA: {pro.eta} mins travel</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <button
                          onClick={() => setActiveStep(1)}
                          className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                        >
                          Configure Filters
                        </button>
                        <button
                          onClick={() => setActiveStep(3)}
                          disabled={!selectedPro}
                          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
                        >
                          Confirm Match & Proceed
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Leaflet Map Panel */}
                    <div className="lg:col-span-6 w-full h-[400px] lg:h-[500px]">
                      <MapComponent
                        center={custCoords}
                        customerMarker={custCoords}
                        providerMarkers={matchingPros.map((pro, index) => {
                          const coords = getProCoords(pro, index);
                          return {
                            id: pro.id || `${index}`,
                            lat: coords[0],
                            lng: coords[1],
                            name: pro.name,
                            category: selectedService,
                            rate: pro.rate || 350,
                            rating: pro.rating || 4.8
                          };
                        })}
                        theme={theme}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: PAY & SCHEDULE */}
                {activeStep === 3 && selectedPro && (
                  <div className="flex flex-col gap-5 text-xs text-left">
                    <div className="p-4 rounded-xl bg-black/20 border border-slate-900 flex flex-col gap-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                        <span className="font-bold text-slate-400">Technician Details</span>
                        <span className="text-emerald-400 font-bold">Selected Match</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Technician Name:</span>
                        <span className="font-bold text-slate-200">{selectedPro.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hourly Labor Rate:</span>
                        <span className="font-bold text-slate-200">₹{selectedPro.rate}/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Travel ETA:</span>
                        <span className="font-bold text-slate-200">{selectedPro.eta} mins</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3.5">
                      <div className="flex flex-col gap-2 relative">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm Address</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="flex-1 p-3 rounded-xl border border-slate-900 bg-black/20 text-slate-200 focus:outline-none focus:border-indigo-500"
                            placeholder="Type address..."
                          />
                          <button
                            onClick={() => handleAddressSearch(address)}
                            disabled={geocoding}
                            className="px-4 bg-indigo-655 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            {geocoding ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Search size={14} />
                            )}
                            <span>Search</span>
                          </button>
                        </div>
                        
                        {/* Nominatim Suggestions dropdown */}
                        {geoResults.length > 0 && (
                          <div className="absolute top-[76px] left-0 right-0 z-45 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 flex flex-col max-h-[200px] overflow-y-auto">
                            {geoResults.map((item, index) => (
                              <button
                                key={index}
                                onClick={() => handleSelectAddress(item)}
                                className="w-full text-left p-2.5 hover:bg-slate-850 rounded-lg text-[10px] text-slate-350 leading-relaxed transition-colors border-b border-slate-950 last:border-b-0"
                              >
                                {item.display_name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Payout Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-900 bg-black/25 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="UPI">UPI Instant Pay (Razorpay Test Mode)</option>
                          <option value="Card">Visa / Mastercard (Secure Checkout)</option>
                          <option value="Wallet">Credits Wallet (Balance: ₹{walletBalance})</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-950/25 border border-indigo-900/40 rounded-xl flex flex-col gap-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Labor Charge Estimate</span>
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
                        className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePayment}
                        disabled={isPaying}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
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

            {/* Right Side Column (4 cols) */}
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
                      <span className="text-sm font-bold text-white">{dbBookings.filter(b => b.status !== 'PAYMENT_SUCCESSFUL' && b.status !== 'CANCELLED').length}</span>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
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
          </div>
        )}

        {/* My Bookings tab */}
        {customerTab === 'bookings' && (
          <div className="rounded-2xl glass p-6 border border-white/5 flex flex-col gap-4 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">My Booking Schedules</h3>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{dbBookings.length} total requests</span>
            </div>

            <div className="flex flex-col gap-4">
              {dbBookings.length === 0 ? (
                <span className="text-xs text-slate-500 py-6 text-center block">No bookings located. Book your first service above!</span>
              ) : (
                dbBookings.map((b) => (
                  <div key={b.id} className="p-4 bg-black/35 border border-slate-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="flex flex-col gap-1 text-left">
                      <span className="font-bold text-sm text-slate-200">{b.service_type}</span>
                      <span className="text-[10px] text-slate-500">{b.address}</span>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="font-bold text-indigo-400">Total: ₹{b.total_cost}</span>
                        <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                          {b.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {b.status !== 'PAYMENT_SUCCESSFUL' && b.status !== 'CANCELLED' && (
                        <Link
                          href={`/customer/track/${b.id}`}
                          className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg font-bold"
                        >
                          Track location & OTP
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Wallet & Payments tab */}
        {customerTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            <div className="lg:col-span-8 p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
              <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">My Cash Wallet</h3>
              <div className="p-6 bg-black/20 border border-slate-900 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 block">Available Credits</span>
                  <span className="text-2xl font-bold text-white mt-1 block">₹{walletBalance}</span>
                </div>
                <button
                  onClick={() => { setWalletBalance(prev => prev + 1000); alert("Credits added successfully via Razorpay Simulator!"); }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all"
                >
                  Add Money
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
              <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Loyalty Rewards Summary</h3>
              <div className="p-4 bg-black/20 border border-slate-900 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 block">Loyalty Points</span>
                  <span className="text-xl font-bold text-indigo-400 mt-1 block">{loyaltyPoints} PTS</span>
                </div>
                <Sparkles size={16} className="text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Loyalty & Rewards tab */}
        {customerTab === 'loyalty' && (
          <div className="rounded-2xl glass p-6 border border-white/5 flex flex-col gap-4 text-left">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400 pb-2 border-b border-slate-900">Active Coupon Codes & Referrals</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {coupons.map((c) => (
                <div key={c.code} className="p-4 bg-black/20 border border-slate-900 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-mono font-bold text-indigo-400 block">{c.code}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">{c.desc}</span>
                  </div>
                  <span className="text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded-full font-bold">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl mt-2 text-xs leading-relaxed">
              <span className="font-bold text-slate-200 block mb-1">Referral Rewards Program</span>
              Share your referral code <span className="font-mono font-bold text-indigo-400">HOMESPHEREAI-SATYAM</span> with friends. You will receive <span className="font-bold text-emerald-400">₹250</span> credits when they complete their first booking match!
            </div>
          </div>
        )}

        {/* Edit Profile tab */}
        {customerTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl glass border border-white/5 flex flex-col gap-6 text-left max-w-2xl mx-auto">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400 pb-2 border-b border-slate-900">Edit Customer Profile</h3>
            
            <div className="flex items-center gap-4.5 p-4 bg-black/20 border border-slate-900 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-slate-850 flex items-center justify-center font-bold text-sm overflow-hidden border border-slate-800 shrink-0">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="photo" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={24} className="opacity-55" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-slate-300">Choose Profile Picture</span>
                <input 
                  type="file" 
                  onChange={handleProfilePhotoUpload}
                  id="customer-profile-photo-upload"
                  className="hidden"
                />
                <label 
                  htmlFor="customer-profile-photo-upload"
                  className="px-3 py-1.5 border border-dashed rounded-lg border-slate-800 hover:bg-white/5 text-slate-400 cursor-pointer w-fit text-xs"
                >
                  Upload New Photo
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Full Name</label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-900 bg-black/20 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Phone Number</label>
                <input 
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-900 bg-black/20 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-900 bg-black/25 text-slate-350 focus:outline-none cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Date of Birth</label>
                <input 
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-900 bg-black/20 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Saved Addresses */}
            <div className="flex flex-col gap-2.5 text-xs font-semibold">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Saved Addresses</label>
              <div className="flex flex-col gap-2">
                {savedAddresses.map((addr, idx) => (
                  <div key={addr.label} className="p-3 bg-black/20 border border-slate-900 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{addr.label} Address</span>
                    <input 
                      type="text"
                      value={addr.val}
                      onChange={(e) => {
                        const next = [...savedAddresses];
                        next[idx].val = e.target.value;
                        setSavedAddresses(next);
                      }}
                      className="w-full bg-transparent border-none p-0 text-slate-300 focus:outline-none focus:ring-0 mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Emergency Contact Name</label>
                <input 
                  type="text"
                  value={emergencyContact.name}
                  onChange={(e) => setEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-900 bg-black/20 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Emergency Contact Phone</label>
                <input 
                  type="text"
                  value={emergencyContact.phone}
                  onChange={(e) => setEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-900 bg-black/20 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Preferences & System link */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Preferred Language</label>
                <select
                  defaultValue="English (EN-IN)"
                  className="w-full p-3 rounded-xl border border-slate-900 bg-black/25 text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option>English (EN-IN)</option>
                  <option>Hindi (HI-IN)</option>
                  <option>Telugu (TE-IN)</option>
                  <option>Tamil (TA-IN)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Linked Account Identity</label>
                <div className="p-3 bg-black/20 border border-slate-900 text-slate-400 rounded-xl">
                  {user?.email} (Google Authentication)
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSavingProfile}
              className="py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5"
            >
              {isSavingProfile ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Save Changes to PostgreSQL</span>
              )}
            </button>
          </form>
        )}

        {/* Live Chat & Support tab */}
        {customerTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            <div className="lg:col-span-8 p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
              <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Support Tickets</h3>
              
              <div className="flex flex-col gap-3 text-xs">
                {supportTickets.map((t) => (
                  <div key={t.id} className="p-4 bg-black/20 border border-slate-900 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-300 block">{t.subject}</span>
                      <span className="text-[9px] text-slate-500 mt-1 block">Ticket ID: {t.id} • Registered: {t.date}</span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                      t.status === 'OPEN'
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-900/30'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/30'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 p-6 rounded-2xl glass border border-white/5 flex flex-col gap-4">
              <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">AI Voice Assistant Guide</h3>
              <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-xs leading-relaxed text-slate-300">
                <span className="font-bold text-indigo-400 block mb-1">Hands-free bookings</span>
                You can activate the voice assistant by tapping the mic icon inside the AI assistant chat floating bubble. Use prompts like "book me a plumber for tomorrow" to schedule services via voice.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Interactive AI Assistant chatbot */}
      <div className="fixed bottom-24 right-6 z-40">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-96 h-[480px] rounded-2xl bg-slate-950/95 border border-white/10 glow-primary shadow-2xl flex flex-col overflow-hidden mb-3 backdrop-blur-xl"
            >
              {/* Header */}
              <div className="bg-indigo-950/60 p-4 border-b border-white/5 flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <div className="w-8.5 h-8.5 rounded-lg bg-indigo-650/30 text-indigo-400 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">HomeSphere Copilot AI</h4>
                    <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active • Neural Memory Linked
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-xs">
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`max-w-[85%] p-3 rounded-xl text-left leading-relaxed ${
                      msg.sender === 'ai' 
                        ? 'bg-slate-900 border border-slate-800 text-slate-350 mr-auto rounded-tl-none whitespace-pre-wrap' 
                        : 'bg-indigo-650 text-white ml-auto rounded-tr-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                
                {isChatTyping && (
                  <div className="flex gap-1.5 items-center p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 mr-auto w-fit">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}

                {voiceRecording && (
                  <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl mr-auto w-fit animate-pulse text-[10px] font-bold">
                    🎤 Recording hands-free dictation stream...
                  </div>
                )}
              </div>

              {/* Suggested quick actions */}
              <div className="px-3 py-2 border-t border-white/5 bg-slate-950/40 flex flex-wrap gap-1.5 text-[9px] text-left">
                {[
                  { label: "🚰 Sink Leak", cmd: "Kitchen sink is leaking under the wooden cabinet" },
                  { label: "❄️ AC Rattling", cmd: "AC is running but making a rattling noise" },
                  { label: "⚡ Switch Sparks", cmd: "Sparks coming from the bedroom light switch" },
                  { label: "💳 Service Rates", cmd: "Show me base service hourly rates" }
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleChatSend(s.cmd)}
                    className="px-2 py-1 rounded bg-black/45 border border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all font-semibold"
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Input field */}
              <div className="p-3 border-t border-white/5 bg-slate-950 flex items-center gap-2">
                <button
                  onClick={handleSimulateImageUpload}
                  title="Upload reference photo for AI diagnosis"
                  className="p-2 rounded-lg bg-black/40 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Paperclip size={14} />
                </button>
                
                <button
                  onClick={handleSimulateVoice}
                  title="Voice Command Dictation"
                  className={`p-2 rounded-lg transition-all ${
                    voiceRecording 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : 'bg-black/40 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mic size={14} />
                </button>

                <input
                  type="text"
                  placeholder="Ask anything or simulate dictation..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                  className="flex-1 bg-black/40 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                />
                
                <button
                  onClick={() => handleChatSend()}
                  className="p-2.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white transition-colors"
                >
                  <Send size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="flex items-center justify-center w-12 h-12 bg-indigo-650 hover:bg-indigo-600 text-white rounded-full shadow-lg glow-primary active:scale-95 transition-transform"
        >
          <MessageSquare size={20} />
        </button>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
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
    </ProtectedRoute>
  );
}
