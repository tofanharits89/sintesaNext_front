'use client';

import { useCurrentUser } from '@/lib/use-current-user';
import { canAccessSettings } from '@/lib/rbac';

export default function DebugUserPage() {
  const { currentUser, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div className="p-4">Loading user information...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug User Information</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">Current User Data:</h2>
        
        {currentUser ? (
          <div className="space-y-2">
            <p><strong>ID:</strong> {currentUser.id}</p>
            <p><strong>Name:</strong> {currentUser.name}</p>
            <p><strong>Username:</strong> {currentUser.username}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Role:</strong> <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{currentUser.role}</span></p>
            <p><strong>Status:</strong> {currentUser.status}</p>
            {currentUser.kdkanwil && <p><strong>Kode Kanwil:</strong> {currentUser.kdkanwil}</p>}
            {currentUser.nmkanwil && <p><strong>Nama Kanwil:</strong> {currentUser.nmkanwil}</p>}
            {currentUser.kdkppn && <p><strong>Kode KPPN:</strong> {currentUser.kdkppn}</p>}
            {currentUser.nmkppn && <p><strong>Nama KPPN:</strong> {currentUser.nmkppn}</p>}
          </div>
        ) : (
          <p className="text-red-500">No user data found - User might not be logged in</p>
        )}
        
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-lg font-semibold mb-2">Settings Access Check:</h3>
          <p><strong>Can Access Settings:</strong> 
            <span className={`ml-2 px-2 py-1 rounded ${
              canAccessSettings(currentUser) 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {canAccessSettings(currentUser) ? 'YES' : 'NO'}
            </span>
          </p>
          
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="font-medium mb-2">RBAC Rules for Settings Access:</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>super_admin:</strong> Full settings access (settings.edit: true)</li>
              <li>• <strong>co_admin:</strong> View settings access (settings.view: true)</li>
              <li>• <strong>Other roles:</strong> No settings access (settings.view: false)</li>
            </ul>
          </div>
          
          {currentUser && !canAccessSettings(currentUser) && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Solutions:</h4>
              <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>1. Ask admin to change your role to 'super_admin' or 'co_admin'</li>
                <li>2. Or modify RBAC permissions in /src/lib/rbac.ts to allow your role ({currentUser.role}) to access settings</li>
                <li>3. The pengaturan page redirects to settings, so both have the same access restrictions</li>
              </ol>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-lg font-semibold mb-2">Raw User Object:</h3>
          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(currentUser, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}