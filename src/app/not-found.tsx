"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { usePageContext } from '@/contexts/page-context';

export default function NotFound() {
  const { setIsNotFoundPage } = usePageContext();

  useEffect(() => {
    setIsNotFoundPage(true);
    // Also hide navbar/sidebar immediately with CSS for instant effect
    const navbar = document.querySelector('[data-navbar="true"]');
    const sidebar = document.querySelector('[data-sidebar="true"]');
    
    if (navbar) (navbar as HTMLElement).style.display = 'none';
    if (sidebar) (sidebar as HTMLElement).style.display = 'none';
    
    return () => {
      setIsNotFoundPage(false);
      // Restore navbar/sidebar visibility
      if (navbar) (navbar as HTMLElement).style.display = '';
      if (sidebar) (sidebar as HTMLElement).style.display = '';
    };
  }, [setIsNotFoundPage]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800">Halaman Tidak Ditemukan</h2>
          <p className="text-gray-600">
            Halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/login">
              <Home className="w-4 h-4 mr-2" />
              Halaman Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';