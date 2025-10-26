"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role?: string;
  [key: string]: any;
}

interface DashboardContextType {
  user: User | null;
  isAuthenticated: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
  initialUser: User | null;
}

export function DashboardProvider({ children, initialUser }: DashboardProviderProps) {
  const contextValue: DashboardContextType = {
    user: initialUser,
    isAuthenticated: !!initialUser,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

export function useAuthenticatedUser() {
  const { user, isAuthenticated } = useDashboard();
  if (!isAuthenticated || !user) {
    throw new Error("User is not authenticated");
  }
  return user;
}
