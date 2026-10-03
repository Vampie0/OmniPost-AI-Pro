'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { NAV_ITEMS } from '@/components/layout/AdminSidebar';

/**
 * Orientation strip. With ten sidebar sections that all look alike once you are
 * deep in one, this names the current page and gives the root a way back.
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const section = NAV_ITEMS.find((item) =>
    item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
  );

  if (!section || section.href === '/') return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs mb-2">
      <Link
        href="/"
        className="text-text-muted hover:text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-30 rounded"
      >
        Admin
      </Link>
      <ChevronRight className="w-3 h-3 text-text-muted shrink-0" />
      <span aria-current="page" className="font-bold text-text-secondary truncate">
        {section.label}
      </span>
    </nav>
  );
}
