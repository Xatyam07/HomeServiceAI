"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const isPendingPro = user.role === 'PROVIDER' && (user.status === 'PENDING' || user.status === 'PENDING_APPROVAL');

    if (isPendingPro) {
      if (pathname !== '/professional/pending') {
        router.push('/professional/pending');
      }
      return;
    }

    if (user.role === 'PROVIDER' && pathname === '/professional/pending') {
      router.push('/professional/dashboard');
      return;
    }

    // Role protection logic
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on their actual role
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          router.push('/admin/dashboard');
        } else if (user.role === 'PROVIDER') {
          router.push('/professional/dashboard');
        } else {
          router.push('/customer/dashboard');
        }
      }
    }
  }, [user, loading, router, pathname, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span>Securing session gateway...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const isPendingPro = user.role === 'PROVIDER' && (user.status === 'PENDING' || user.status === 'PENDING_APPROVAL');
  if (isPendingPro && pathname !== '/professional/pending') {
    return null; // Will redirect
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
