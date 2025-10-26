import { Toaster } from "@/components/ui/sonner";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if this is a logout redirect (don't validate session if user just logged out)
  const h = await headers();
  const url = new URL(`http://dummy${h.get('x-invoke-path') || ''}`);
  const reason = url.searchParams.get('reason');
  const isLogoutRedirect = reason === 'logout' || reason === 'session_expired';

  // (Debug headers removed for production cleanliness)

  // Defense-in-depth: If middleware is skipped for any reason,
  // verify session server-side and redirect authenticated users.
  // Skip validation if user just logged out (prevents dashboard flash)
  //
  // NOTE: In production Docker, server-side validation doesn't work because:
  // - Cookies are set for the browser domain (sintesa-dev.kemenkeu.go.id)
  // - Next.js server fetch to backend (http://backend:88) is a different origin
  // - Cookies won't be forwarded in server-to-server requests
  //
  // Solution: Only validate in development, rely on middleware in production

  if (process.env.NODE_ENV !== 'production' && !isLogoutRedirect) {
    const c = await cookies();
    const cookiePairs = c.getAll().map(({ name, value }) => `${name}=${value}`);
    const cookieHeader = cookiePairs.join("; ");

    const hasAnyAuthCookie = /(?:^|;\s*)(access_token|accessToken|auth_token|authToken|token)=/.test(cookieHeader);
    if (hasAnyAuthCookie) {
      try {
        // Use server-side API URL (works in dev)
        const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:88/api/v1';
        const backendUrl = apiUrl.replace('/api/v1', '');
        const validateUrl = `${backendUrl}/api/v1/auth/validate?include=user`;

        const resp = await fetch(validateUrl, {
          method: "GET",
          headers: {
            ...(cookieHeader ? { cookie: cookieHeader } : {}),
            'Accept': 'application/json',
          },
          credentials: "include",
          cache: "no-store",
        });

        const data = await resp.json().catch(() => ({}));
        if (resp.ok && data?.success && data?.data?.valid) {
          redirect("/dashboard/utama");
        }
      } catch (e: any) {
        // Let Next.js complete the redirect (redirect() throws to signal navigation)
        if (e && typeof e === 'object' && 'digest' in e && String(e.digest).startsWith('NEXT_REDIRECT')) {
          throw e;
        }
        // ignore and show login
      }
    }
  }

  return (
    <>
      {children}
      {/* Minimal toaster for login page only - no socket notifications */}
      <Toaster
        richColors
        position="bottom-left"
        toastOptions={{
          className: "login-toast",
        }}
      />
    </>
  );
}
