import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'info' | 'purple' | 'blue' | 'secondary';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    purple: 'bg-purple-100 text-purple-800 border border-purple-200',
    blue: 'bg-sky-100 text-sky-800 border border-sky-200',
    outline: 'border border-slate-200 text-slate-600',
    secondary: 'bg-slate-200 text-slate-700'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}