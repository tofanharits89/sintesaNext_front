'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUnifiedAuth, canAccessSettings } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Settings } from 'lucide-react';

export default function PengaturanPage() {
  const router = useRouter();
  const { user: currentUser, isLoading } = useUnifiedAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Check if user has settings access permission
    if (canAccessSettings(currentUser)) {
      router.push('/settings');
    } else {
      router.push('/unauthorized?reason=settings_access_denied');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Settings className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Memeriksa Akses</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sedang memverifikasi izin akses pengaturan...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This should not be reached due to redirects above
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Terjadi Kesalahan</h3>
              <p className="text-sm text-gray-600 mt-1">
                Tidak dapat memproses permintaan akses pengaturan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
