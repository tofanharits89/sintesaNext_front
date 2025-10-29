import { Toaster } from "@/components/ui/sonner";

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  // Keep this layout simple and purely presentational.
  // Middleware handles all auth redirects; avoid SSR validation here to prevent race conditions.
  return (
    <>
      {children}
      <Toaster
        richColors
        position="bottom-left"
        toastOptions={{ className: "login-toast" }}
      />
    </>
  );
}
