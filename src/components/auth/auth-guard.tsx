import React from "react";

// Trust middleware.ts to protect routes and redirect unauthenticated users.
// If execution reaches this component, assume the user is authenticated.
export async function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
