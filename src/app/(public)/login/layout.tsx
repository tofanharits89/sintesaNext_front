import { Toaster } from "@/components/ui/sonner";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: If middleware is skipped for any reason,
  // verify session server-side and redirect authenticated users.
  const c = await cookies();
  const cookiePairs = c.getAll().map(({ name, value }) => `${name}=${value}`);
  const cookieHeader = cookiePairs.join("; ");

  if (process.env.NODE_ENV !== 'production') {
    console.log('[LoginLayout] Cookie names:', c.getAll().map(({name})=>name));
  }

  const hasAnyAuthCookie = /(?:^|;\s*)(access_token|accessToken|auth_token|authToken|token)=/.test(cookieHeader);
  if (hasAnyAuthCookie) {
    try {
      const h = await headers();
      const proto = h.get('x-forwarded-proto') || 'http';
      const host = h.get('host') || 'localhost:3000';
      const absUrl = `${proto}://${host}/api/auth/validate?include=user`;
      const resp = await fetch(absUrl, {
        method: "GET",
        headers: { ...(cookieHeader ? { cookie: cookieHeader } : {}) },
        credentials: "include",
        cache: "no-store",
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log('[LoginLayout] /api/auth/validate status:', resp.status);
      }
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data?.success && data?.data?.valid) {
        redirect("/dashboard/utama");
      }
    } catch (e: any) {
      // Let Next.js complete the redirect (redirect() throws to signal navigation)
      if (e && typeof e === 'object' && 'digest' in e && String(e.digest).startsWith('NEXT_REDIRECT')) {
        throw e;
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log('[LoginLayout] validate fetch error:', e);
      }
      // ignore and show login
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
