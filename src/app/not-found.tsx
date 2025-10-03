"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
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
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Kembali ke Dashboard
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="javascript:history.back()">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Halaman Sebelumnya
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';