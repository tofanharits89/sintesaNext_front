import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  // If user is already authenticated, redirect to dashboard
  const c = await cookies();
  const token = c.get("token")?.value;
  
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      // Valid token exists, redirect to dashboard
      redirect("/dashboard");
    } catch {
      // Invalid token, let them access login page
    }
  }
  
  // No token or invalid token, show login page
  return <>{children}</>;
}
