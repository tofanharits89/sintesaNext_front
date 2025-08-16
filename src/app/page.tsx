import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

export default async function Home() {
  // Server-side check at root: send to dashboard if authenticated, else to login
  const c = await cookies();
  const token = c.get("token")?.value;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      redirect("/dashboard");
    } catch {
      // fall through to login
    }
  }
  redirect("/login");
}
