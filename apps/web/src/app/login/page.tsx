"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, Phone, ShieldCheck, Sparkles, 
  Eye, EyeOff, AlertTriangle, ArrowRight, ArrowLeft 
} from 'lucide-react';

export default function LoginPage() {
  const { 
    loginWithEmail, 
    loginWithGoogle, 
    loginWithPhone, 
    verifyPhoneOtp,
    forgotPassword,
    user 
  } = useAuth();
  
  const router = useRouter();

  // Login Modes: 'email' | 'phone'
  const [loginMode, setLoginMode] = useState<'email' | 'phone'>('email');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  // Show/Hide flags
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  
  // Status flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'PROVIDER') {
        const isPending = user.status === 'PENDING' || user.status === 'PENDING_APPROVAL';
        if (isPending) {
          router.push('/professional/pending');
        } else {
          router.push('/professional/dashboard');
        }
      } else {
        router.push('/customer/dashboard');
      }
    }
  }, [user, router]);

  // Actions
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!phone) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }
    setIsSubmitting(true);
    try {
      await loginWithPhone(phone, 'recaptcha-container');
      setOtpSent(true);
      setSuccessMsg("Verification code sent successfully.");
      setIsSubmitting(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send verification code. Please check the number.");
      setIsSubmitting(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!otp) {
      setErrorMsg("Please enter the 6-digit OTP code.");
      return;
    }
    setIsSubmitting(true);
    try {
      await verifyPhoneOtp(otp);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid OTP code. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in was cancelled.");
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg("Please enter your email address to reset password.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await forgotPassword(email);
      setSuccessMsg("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send reset email.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden grid-bg">
      {/* Background Aurora Orbs */}
      <motion.div 
        animate={{ 
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.9, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-indigo-600/15 rounded-full filter blur-[100px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.9, 1.1, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-cyan-500/10 rounded-full filter blur-[100px] pointer-events-none" 
      />

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo Hub */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-xl shadow-indigo-500/20">
            <Sparkles size={28} className="animate-pulse" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            HomeSphere <span className="text-indigo-500 font-medium">AI</span>
          </span>
          <p className="text-xs text-slate-500 tracking-wider uppercase font-semibold">Security Gate Log</p>
        </div>

        {/* Login Glassmorphism Box */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="rounded-3xl glass-premium p-8 border-white/10 glow-primary shadow-2xl flex flex-col"
        >
          {/* Form mode switcher */}
          <div className="flex p-1 rounded-xl bg-black/40 border border-slate-900 mb-6">
            <button
              onClick={() => { setLoginMode('email'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 ${
                loginMode === 'email' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Email Sign In
            </button>
            <button
              onClick={() => { setLoginMode('phone'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 ${
                loginMode === 'phone' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Phone OTP
            </button>
          </div>

          <AnimatePresence mode="wait">
            
            {/* EMAIL AND PASSWORD LOGIN */}
            {loginMode === 'email' && (
              <motion.form 
                key="email-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleEmailSubmit}
                className="flex flex-col gap-4.5 text-left"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@example.com"
                      className="w-full pl-10.5 pr-4 py-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[10px] text-indigo-400 hover:underline hover:text-indigo-300 transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10.5 pr-10.5 py-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2.5 mt-1 cursor-pointer select-none" onClick={() => setRememberMe(!rememberMe)}>
                  <div className={`w-4 h-4.5 rounded border flex items-center justify-center transition-colors ${
                    rememberMe ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-800 bg-black/25'
                  }`}>
                    {rememberMe && <span className="text-[10px]">✓</span>}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Keep me authenticated</span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit Verification</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* PHONE OTP LOGIN */}
            {loginMode === 'phone' && (
              <motion.form 
                key="phone-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={otpSent ? handleOtpVerify : handlePhoneSubmit}
                className="flex flex-col gap-4.5 text-left"
              >
                {!otpSent ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Number</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                        <input 
                          type="tel" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-10.5 pr-4 py-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 leading-normal mt-0.5">Please specify country prefix (e.g. +91)</span>
                    </div>

                    <div id="recaptcha-container" className="my-1.5 flex justify-center"></div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 mt-2"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Request Verification OTP</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OTP Code</label>
                        <button 
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5"
                        >
                          <ArrowLeft size={10} />
                          <span>Change Number</span>
                        </button>
                      </div>
                      <div className="relative">
                        <ShieldCheck size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                        <input 
                          type="text" 
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="123456"
                          className="w-full pl-10.5 pr-4 py-3 rounded-xl border border-slate-900 bg-black/25 focus:bg-black/40 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-center tracking-[0.25em] font-bold"
                        />
                      </div>
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
                          <span>Verify & Access Account</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </>
                )}
              </motion.form>
            )}

          </AnimatePresence>

          {/* Messages display */}
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

          {/* Social Sign In Separator */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute w-full h-[1px] bg-slate-900" />
            <span className="relative z-10 px-3 bg-slate-950/40 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Alternative Credentials</span>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-slate-900 hover:border-slate-800 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
          >
            {/* Google icon SVG */}
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.636 7.643c0-.498-.045-.977-.128-1.436H7.5v2.716h4.004c-.173.931-.697 1.722-1.488 2.253v1.87h2.41c1.41-1.298 2.21-3.21 2.21-5.403z" fill="#4285F4"/>
              <path d="M7.5 14.887c1.99 0 3.659-.66 4.88-1.792l-2.41-1.87c-.668.448-1.52.714-2.47.714-1.9 0-3.51-1.284-4.084-3.007H.927v1.933a7.387 7.387 0 006.573 5.955v-.933z" fill="#34A853"/>
              <path d="M3.416 8.932A4.417 4.417 0 013.187 7.5c0-.501.085-.989.23-1.432V4.135H.927a7.388 7.388 0 000 6.73L3.416 8.932z" fill="#FBBC05"/>
              <path d="M7.5 3.057c1.083 0 2.055.372 2.82 1.104l2.115-2.115C11.155.776 9.487.113 7.5.113A7.387 7.387 0 00.927 6.068l2.49-1.933c.573-1.723 2.183-3.078 4.083-3.078z" fill="#EA4335"/>
            </svg>
            <span>Authenticate via Google Account</span>
          </button>

          {/* Registration link */}
          <div className="text-center text-xs text-slate-500 mt-6 font-medium">
            <span>New to HomeSphere? </span>
            <Link 
              href="/signup" 
              className="text-indigo-400 font-bold hover:underline"
            >
              Register Gateway Profile
            </Link>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
