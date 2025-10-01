import { Toaster } from "@/components/ui/sonner";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check is now handled by middleware - no need for additional checks

  // No token or invalid token, show login page with minimal toaster (no socket notifications)
  return (
    <>
      {children}
      {/* Minimal toaster for login page only - no socket notifications */}
      <Toaster
        richColors
        position="bottom-left"
        toastOptions={{
          // Only show login-related toasts, filter out socket notifications
          className: "login-toast",
        }}
      />
    </>
  );
}
