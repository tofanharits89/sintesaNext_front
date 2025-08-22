import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);

export default async function EPALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard: verify JWT to access any /epa/* page
  const c = await cookies();
  const token = c.get("token")?.value;
  if (!token) {
    redirect("/login");
  }
  try {
    await jwtVerify(token, JWT_SECRET);
  } catch {
    redirect("/login");
  }
  return children as React.ReactElement;
}
