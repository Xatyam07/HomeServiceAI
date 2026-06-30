"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, User, Wrench, LayoutTemplate, MapPin, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoleSelector() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const roles = [
    { name: 'Landing Page', path: '/', icon: LayoutTemplate, color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50' },
    { name: 'Customer Portal', path: '/customer/dashboard', icon: User, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/50' },
    { name: 'Pro Dashboard', path: '/provider/dashboard', icon: Wrench, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' },
    { name: 'Admin Console', path: '/admin/dashboard', icon: Shield, color: 'text-purple-400 bg-purple-950/40 border-purple-800/50' },
    { name: 'Live ETA Tracking', path: '/customer/track/demo-booking-101', icon: MapPin, color: 'text-amber-400 bg-amber-950/40 border-amber-800/50' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="mb-3 p-4 w-72 rounded-2xl glass glow-primary border-white/10 shadow-2xl flex flex-col gap-2"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/10 dark:border-slate-800">
              <span className="font-semibold text-sm tracking-wider uppercase text-slate-400">Demo Role Hub</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5 mt-1">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = pathname === role.path;
                return (
                  <Link 
                    key={role.path} 
                    href={role.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 ${
                      isActive 
                        ? 'bg-indigo-600 border-indigo-500 text-white font-medium scale-[1.02] shadow-lg shadow-indigo-600/30' 
                        : 'hover:bg-white/5 dark:hover:bg-slate-800/50 border-transparent text-slate-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg border ${role.color}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-sm">{role.name}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm rounded-full shadow-lg shadow-indigo-600/20 glow-primary border border-indigo-400/20 active:scale-95 transition-transform"
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
        <span>Switch View</span>
      </button>
    </div>
  );
}
