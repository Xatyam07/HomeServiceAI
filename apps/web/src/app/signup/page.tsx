"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Wrench, Sparkles, Mail, Lock, Phone,
  MapPin, DollarSign, Upload, ShieldCheck, AlertTriangle, ArrowRight, ArrowLeft
} from 'lucide-react';

export default function SignUpPage() {
  const { signupWithEmail, loginWithGoogle } = useAuth();
  const router = useRouter();

  // Role: 'customer' | 'provider' | null (null is initial role select step)
  const [role, setRole] = useState<'customer' | 'provider' | null>(null);

  // Form step for professional signup: 1, 2, 3
  const [proStep, setProStep] = useState(1);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Pro profile fields
  const [category, setCategory] = useState('Plumber');
  const [experience, setExperience] = useState('1');
  const [hourlyRate, setHourlyRate] = useState('150');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Document URLs (uploaded via backend `/api/uploads/`)
  const [aadhaarUrl, setAadhaarUrl] = useState('');
  const [panUrl, setPanUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');

  // Status flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // File Upload Helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(docType);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch('http://localhost:8000/api/uploads/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to upload document to server");
      }

      const data = await response.json();
      if (docType === 'aadhaar') setAadhaarUrl(data.url);
      else if (docType === 'pan') setPanUrl(data.url);
      else if (docType === 'selfie') setSelfieUrl(data.url);
      else if (docType === 'certificate') setCertificateUrl(data.url);

      setSuccessMsg(`${docType.toUpperCase()} uploaded successfully!`);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to upload ${docType}.`);
    } finally {
      setUploadingDoc(null);
    }
  };

  // Submit Customer
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password || !name) {
      setErrorMsg("Please fill in all details.");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Sign up on Firebase and create Customer record in SQL
      await signupWithEmail(email, password, name, "CUSTOMER");

      // 2. Call register-profile fallback profile seeding
      await fetch('http://localhost:8000/api/auth/register-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          phone,
          role: "CUSTOMER"
        })
      });

      router.push('/customer/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register Customer.");
      setIsSubmitting(false);
    }
  };

  // Submit Professional
  const handleProSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!aadhaarUrl || !selfieUrl) {
      setErrorMsg("Aadhaar Verification Document and Selfie are required for verification audits.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Sign up on Firebase and create PROVIDER record in SQL
      await signupWithEmail(email, password, name, "PROVIDER");

      // 2. Submit entire profile details (KYC docs, categories, pricing)
      const profileResponse = await fetch('http://localhost:8000/api/auth/register-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          phone,
          role: "PROVIDER",
          category,
          experience_yrs: parseInt(experience),
          hourly_rate: parseFloat(hourlyRate),
          skills,
          bio,
          address,
          city,
          aadhaar_url: aadhaarUrl,
          pan_url: panUrl,
          selfie_url: selfieUrl,
          certificate_url: certificateUrl
        })
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to submit onboarding profile details to the SQL backend.");
      }

      setSuccessMsg("Registration complete! Awaiting admin approval.");

      // Redirect to pending approval dashboard
      setTimeout(() => {
        router.push('/professional/pending');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete Professional onboarding.");
      setIsSubmitting(false);
    }
  };

  const handleCustomerGoogleSubmit = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle("CUSTOMER");
      router.push('/customer/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || "Google registration was cancelled.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden grid-bg">
      {/* Background Aurora Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-indigo-600/15 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-cyan-500/10 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">

        {/* Logo Hub */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-xl shadow-indigo-500/20">
            <Sparkles size={28} className="animate-pulse" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            HomeSphere <span className="text-indigo-500 font-medium">AI</span>
          </span>
          <p className="text-xs text-slate-500 tracking-wider uppercase font-semibold">User Onboarding Gateway</p>
        </div>

        {/* Onboarding Glassmorphism Box */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl glass-premium p-8 border-white/10 glow-primary shadow-2xl flex flex-col"
        >
          <AnimatePresence mode="wait">

            {/* STEP 0: CHOOSE ROLE */}
            {role === null && (
              <motion.div
                key="role-select"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col gap-6"
              >
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-200">Select Onboarding Account Type</h3>
                  <p className="text-xs text-slate-500 mt-1">Configure your HomeSphere account role below</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Option */}
                  <button
                    onClick={() => setRole('customer')}
                    className="p-6 rounded-2xl border border-slate-900 bg-black/20 hover:bg-black/40 hover:border-indigo-500/40 text-left flex flex-col gap-3 group transition-all"
                  >
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all w-fit border border-indigo-500/20">
                      <User size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors">I am a Customer</span>
                      <span className="text-[11px] text-slate-500 leading-normal">Browse home repair diagnostics, match with technicians, and pay securely.</span>
                    </div>
                  </button>

                  {/* Provider Option */}
                  <button
                    onClick={() => setRole('provider')}
                    className="p-6 rounded-2xl border border-slate-900 bg-black/20 hover:bg-black/40 hover:border-emerald-500/40 text-left flex flex-col gap-3 group transition-all"
                  >
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all w-fit border border-emerald-500/20">
                      <Wrench size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-sm text-slate-200 group-hover:text-emerald-400 transition-colors">I am a Professional</span>
                      <span className="text-[11px] text-slate-500 leading-normal">Apply to accept plumbing, electrical, deep cleaning and AC repair jobs nearby.</span>
                    </div>
                  </button>
                </div>

                <div className="text-center text-xs text-slate-500 border-t border-slate-900 pt-4 mt-2">
                  <span>Already have an account? </span>
                  <Link href="/login" className="text-indigo-400 font-bold hover:underline">Access Gate</Link>
                </div>
              </motion.div>
            )}

            {/* CUSTOMER REGISTRATION */}
            {role === 'customer' && (
              <motion.div
                key="customer-signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                  <h3 className="font-bold text-sm text-indigo-400 uppercase tracking-wider">Customer Registration</h3>
                  <button
                    onClick={() => setRole(null)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-0.5"
                  >
                    <ArrowLeft size={10} />
                    <span>Back</span>
                  </button>
                </div>

                <form onSubmit={handleCustomerSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit Customer Register</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute w-full h-[1px] bg-slate-900" />
                  <span className="relative z-10 px-3 bg-slate-950/40 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Social Onboarding</span>
                </div>

                <button
                  onClick={handleCustomerGoogleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-slate-900 hover:border-slate-800 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.636 7.643c0-.498-.045-.977-.128-1.436H7.5v2.716h4.004c-.173.931-.697 1.722-1.488 2.253v1.87h2.41c1.41-1.298 2.21-3.21 2.21-5.403z" fill="#4285F4" />
                    <path d="M7.5 14.887c1.99 0 3.659-.66 4.88-1.792l-2.41-1.87c-.668.448-1.52.714-2.47.714-1.9 0-3.51-1.284-4.084-3.007H.927v1.933a7.387 7.387 0 006.573 5.955v-.933z" fill="#34A853" />
                    <path d="M3.416 8.932A4.417 4.417 0 013.187 7.5c0-.501.085-.989.23-1.432V4.135H.927a7.388 7.388 0 000 6.73L3.416 8.932z" fill="#FBBC05" />
                    <path d="M7.5 3.057c1.083 0 2.055.372 2.82 1.104l2.115-2.115C11.155.776 9.487.113 7.5.113A7.387 7.387 0 00.927 6.068l2.49-1.933c.573-1.723 2.183-3.078 4.083-3.078z" fill="#EA4335" />
                  </svg>
                  <span>Register with Google Account</span>
                </button>
              </motion.div>
            )}

            {/* PROFESSIONAL REGISTRATION (STEP 1, 2, 3) */}
            {role === 'provider' && (
              <motion.div
                key="provider-signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left font-medium"
              >
                {/* Onboarding Wizard Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                  <div>
                    <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider">Professional Registration</h3>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Step {proStep} of 3 • Document Audits</span>
                  </div>
                  <button
                    onClick={() => proStep > 1 ? setProStep(proStep - 1) : setRole(null)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-0.5"
                  >
                    <ArrowLeft size={10} />
                    <span>Back</span>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(proStep / 3) * 100}%` }}
                  />
                </div>

                <form onSubmit={proStep === 3 ? handleProSubmit : (e) => e.preventDefault()} className="flex flex-col gap-4">

                  {/* PRO STEP 1: Basic Info */}
                  {proStep === 1 && (
                    <motion.div
                      key="pro-step-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Rahul Verma"
                          className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="rahul.verma@example.com"
                          className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98111 22233"
                          className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (name && email && phone && password) setProStep(2);
                          else setErrorMsg("Please fill in all basic fields.");
                        }}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
                      >
                        <span>Continue to Profile Settings</span>
                        <ArrowRight size={14} />
                      </button>
                    </motion.div>
                  )}

                  {/* PRO STEP 2: Professional details */}
                  {proStep === 2 && (
                    <motion.div
                      key="pro-step-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col gap-4 text-xs"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service Category</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-3.5 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {["Electrician", "Plumber", "Carpenter", "Painter", "AC Repair", "Pest Control", "Deep Cleaning", "Beautician", "Yoga Instructor", "Driver"].map(c => (
                              <option key={c} value={c} className="bg-slate-950 text-slate-200">{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience (Years)</label>
                          <input
                            type="number"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            min={0}
                            className="w-full p-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hourly Price Rate (₹/hr)</label>
                          <input
                            type="number"
                            value={hourlyRate}
                            onChange={(e) => setHourlyRate(e.target.value)}
                            min={50}
                            className="w-full p-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">City Base</label>
                          <input
                            type="text"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Hyderabad"
                            className="w-full p-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</label>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Flat 102, Hitec Tower, Kondapur"
                          className="w-full p-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skills Tags</label>
                        <input
                          type="text"
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="Switchboard Repair, Fan Rewinding, MCB Installation"
                          className="w-full p-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professional Bio</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Briefly describe your experience and work specialization..."
                          rows={3}
                          className="w-full p-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (city && address) setProStep(3);
                          else setErrorMsg("Address and City are required.");
                        }}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
                      >
                        <span>Continue to Document KYC</span>
                        <ArrowRight size={14} />
                      </button>
                    </motion.div>
                  )}

                  {/* PRO STEP 3: Document Uploads & Finish */}
                  {proStep === 3 && (
                    <motion.div
                      key="pro-step-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col gap-4 text-xs"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Onboarding Identity Check Docs (Mandatory)</span>

                      {/* File Onboarding selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Aadhaar Upload */}
                        <div className="flex flex-col gap-2 p-3.5 bg-black/20 border border-slate-900 rounded-xl">
                          <span className="font-bold text-slate-300">1. Aadhaar ID Card</span>
                          <span className="text-[9px] text-slate-500 block">PDF or image of national identity card</span>
                          <div className="relative mt-2">
                            <input
                              type="file"
                              onChange={(e) => handleFileUpload(e, 'aadhaar')}
                              className="hidden"
                              id="aadhaar-upload-file"
                            />
                            <label
                              htmlFor="aadhaar-upload-file"
                              className={`w-full py-2 border border-dashed rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-[10px] transition-colors ${aadhaarUrl
                                  ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
                                  : 'hover:bg-white/5 border-slate-800 text-slate-400'
                                }`}
                            >
                              <Upload size={12} />
                              <span>{uploadingDoc === 'aadhaar' ? 'Uploading...' : aadhaarUrl ? 'Uploaded ✓' : 'Upload Card'}</span>
                            </label>
                          </div>
                        </div>

                        {/* Selfie Upload */}
                        <div className="flex flex-col gap-2 p-3.5 bg-black/20 border border-slate-900 rounded-xl">
                          <span className="font-bold text-slate-300">2. Verification Selfie</span>
                          <span className="text-[9px] text-slate-500 block">Close-up photo of your face</span>
                          <div className="relative mt-2">
                            <input
                              type="file"
                              onChange={(e) => handleFileUpload(e, 'selfie')}
                              className="hidden"
                              id="selfie-upload-file"
                            />
                            <label
                              htmlFor="selfie-upload-file"
                              className={`w-full py-2 border border-dashed rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-[10px] transition-colors ${selfieUrl
                                  ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
                                  : 'hover:bg-white/5 border-slate-800 text-slate-400'
                                }`}
                            >
                              <Upload size={12} />
                              <span>{uploadingDoc === 'selfie' ? 'Uploading...' : selfieUrl ? 'Uploaded ✓' : 'Upload Photo'}</span>
                            </label>
                          </div>
                        </div>

                        {/* Certificates (Optional) */}
                        <div className="flex flex-col gap-2 p-3.5 bg-black/20 border border-slate-900 rounded-xl">
                          <span className="font-bold text-slate-300">3. Certifications (Optional)</span>
                          <span className="text-[9px] text-slate-500 block">Trade training / experience sheets</span>
                          <div className="relative mt-2">
                            <input
                              type="file"
                              onChange={(e) => handleFileUpload(e, 'certificate')}
                              className="hidden"
                              id="cert-upload-file"
                            />
                            <label
                              htmlFor="cert-upload-file"
                              className={`w-full py-2 border border-dashed rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-[10px] transition-colors ${certificateUrl
                                  ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
                                  : 'hover:bg-white/5 border-slate-800 text-slate-400'
                                }`}
                            >
                              <Upload size={12} />
                              <span>{uploadingDoc === 'certificate' ? 'Uploading...' : certificateUrl ? 'Uploaded ✓' : 'Upload certificate'}</span>
                            </label>
                          </div>
                        </div>

                        {/* PAN Card (Optional) */}
                        <div className="flex flex-col gap-2 p-3.5 bg-black/20 border border-slate-900 rounded-xl">
                          <span className="font-bold text-slate-300">4. PAN Card (Optional)</span>
                          <span className="text-[9px] text-slate-500 block">Tax registration card</span>
                          <div className="relative mt-2">
                            <input
                              type="file"
                              onChange={(e) => handleFileUpload(e, 'pan')}
                              className="hidden"
                              id="pan-upload-file"
                            />
                            <label
                              htmlFor="pan-upload-file"
                              className={`w-full py-2 border border-dashed rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-[10px] transition-colors ${panUrl
                                  ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
                                  : 'hover:bg-white/5 border-slate-800 text-slate-400'
                                }`}
                            >
                              <Upload size={12} />
                              <span>{uploadingDoc === 'pan' ? 'Uploading...' : panUrl ? 'Uploaded ✓' : 'Upload Card'}</span>
                            </label>
                          </div>
                        </div>

                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || !aadhaarUrl || !selfieUrl}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-1.5 mt-4 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <ShieldCheck size={14} />
                            <span>Complete Verification & Register</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}

                </form>

              </motion.div>
            )}

          </AnimatePresence>

          {/* Messages */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2 text-left"
              >
                <AlertTriangle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 text-left"
              >
                <ShieldCheck size={15} className="shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login link */}
          <div className="text-center text-xs text-slate-500 mt-6 font-medium">

            <Link
              href="/login"
              className="text-indigo-400 font-bold hover:underline"
            >
              Access Gate
            </Link>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
