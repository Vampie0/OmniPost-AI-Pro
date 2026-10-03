'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center space-y-6 border border-border">
        <div className="w-16 h-16 rounded-2xl bg-danger-10 border border-danger-30 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-danger" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-text-primary">Access Denied</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            You do not have administrator privileges to view this resource. If you believe this is an error, contact your system administrator.
          </p>
        </div>

        <button
          onClick={() => router.push('/login')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-btn-text text-sm font-bold shadow-lg shadow-glow-25 hover:opacity-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Login</span>
        </button>
      </div>
    </div>
  );
}
