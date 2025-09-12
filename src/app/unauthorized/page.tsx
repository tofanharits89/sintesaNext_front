'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Suspense } from 'react';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams?.get('reason') ?? undefined;

  const getErrorMessage = () => {
    switch (reason) {
      case 'settings_access_denied':
        return {
          title: 'Akses Pengaturan Ditolak',
          description: 'Anda tidak memiliki izin untuk mengakses halaman pengaturan. Silakan hubungi administrator untuk mendapatkan akses yang diperlukan.',
          suggestion: 'Peran Anda saat ini tidak memiliki hak akses ke modul pengaturan sistem.'
        };
      default:
        return {
          title: 'Akses Ditolak',
          description: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
          suggestion: 'Silakan hubungi administrator sistem untuk mendapatkan akses yang diperlukan.'
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              <strong>Info:</strong> {errorInfo.suggestion}
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => router.back()} 
              variant="outline" 
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Ke Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat...</p>
        </div>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  );
}