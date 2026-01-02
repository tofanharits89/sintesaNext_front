"use client";

import React from "react";
import DataDispensasiKPPN from "@/components/dispensasi-kppn/data-dispensasi-kppn";

const DispensasiKPPNPage: React.FC = () => {
  return (
    <>
      <main className="container mx-auto p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dispensasi Kontrak KPPN</h1>
          <nav className="flex items-center text-sm text-muted-foreground mt-1">
            <a href="/" className="hover:text-primary transition-colors">Home</a>
            <span className="mx-2">/</span>
            <span className="font-medium text-foreground">Rekam Dispensasi</span>
          </nav>
        </div>

        <section>
          <DataDispensasiKPPN />
        </section>
      </main>
    </>
  );
};

export default DispensasiKPPNPage;
