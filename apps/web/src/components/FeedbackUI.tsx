import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Loader2, Inbox, X } from "lucide-react";

// 1. Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("HomeSphere UI Caught Exception:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-slate-950/40 border border-red-500/10 rounded-2xl backdrop-blur-md max-w-md mx-auto my-12">
          <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 animate-bounce">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider mb-2">Something Went Wrong</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            An unexpected error occurred during rendering. The interface has been sandboxed for stability.
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 2. Loading UI
interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

export function LoadingSpinner({ message = "Loading secure database streams...", size = 32 }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3">
      <Loader2 size={size} className="animate-spin text-indigo-500" />
      <span className="text-xs font-medium tracking-wide">{message}</span>
    </div>
  );
}

// 3. Empty State Component
interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center flex flex-col items-center max-w-sm mx-auto my-6 gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
        <Inbox size={20} />
      </div>
      <div>
        <h4 className="font-bold text-sm text-slate-300">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

// 4. Network Connection Error UI
interface NetworkErrorProps {
  message?: string;
  onRetry: () => void;
}

export function NetworkErrorState({ message = "Failed to sync connection with PostgreSQL services.", onRetry }: NetworkErrorProps) {
  return (
    <div className="p-6 rounded-2xl bg-rose-950/10 border border-rose-900/20 max-w-md mx-auto text-center flex flex-col items-center gap-3">
      <AlertTriangle className="text-red-400" size={24} />
      <div className="flex flex-col gap-0.5">
        <h4 className="font-bold text-xs text-red-400 uppercase tracking-wide">Backend Connection Suspended</h4>
        <span className="text-xs text-slate-400 mt-1">{message}</span>
      </div>
      <button
        onClick={onRetry}
        className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
      >
        <RefreshCw size={12} />
        <span>Retry Verification</span>
      </button>
    </div>
  );
}

// 5. Toast Notification System
interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type = "info", onClose }: ToastProps) {
  const themeColors = {
    success: "border-emerald-500/20 bg-emerald-950/90 text-emerald-300 shadow-emerald-950/20",
    error: "border-red-500/20 bg-red-950/90 text-red-300 shadow-red-950/20",
    info: "border-indigo-500/20 bg-indigo-950/90 text-indigo-300 shadow-indigo-950/20",
  };

  return (
    <div className={`fixed bottom-6 right-6 z-55 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all animate-slide-up ${themeColors[type]}`}>
      <span className="text-xs font-semibold leading-none">{message}</span>
      <button onClick={onClose} className="p-0.5 rounded hover:bg-white/10 text-current transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}
