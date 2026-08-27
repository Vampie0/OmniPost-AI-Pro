'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { CosmicSocialSplash } from '@/components/ui/CosmicSocialSplash';
import { PageTransition } from '@/components/ui/PageTransition';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    async function checkAdminAuth() {
      if (isPlaceholderUrl) {
        setIsAuthenticated(true);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_suspended')
        .eq('id', session.user.id)
        .single();

      if (
        !profile ||
        (profile.role !== 'admin' && profile.role !== 'super_admin') ||
        profile.is_suspended
      ) {
        router.replace('/login');
        return;
      }

      setIsAuthenticated(true);
    }

    checkAdminAuth();
  }, [router]);

  if (!isAuthenticated) {
    return (
      <CosmicSocialSplash
        durationMs={700}
        minimal={true}
        onFinish={() => {}}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary flex relative">
      {/* Short 600ms Splash on initial entry */}
      {showSplash && (
        <CosmicSocialSplash
          durationMs={600}
          minimal={true}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ${
          isCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        <AdminHeader onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <PageTransition>
              {children}
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
