"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface PageContextType {
  isNotFoundPage: boolean;
  setIsNotFoundPage: (isNotFound: boolean) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageProvider({ children }: { children: ReactNode }) {
  const [isNotFoundPage, setIsNotFoundPage] = useState(false);

  return (
    <PageContext.Provider value={{ isNotFoundPage, setIsNotFoundPage }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error("usePageContext must be used within a PageProvider");
  }
  return context;
}
