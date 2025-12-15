"use client";

import React from "react";
import DataDispensasiKPPN from "@/components/dispensasi-kppn/data-dispensasi-kppn";

const DispensasiKPPNPage: React.FC = () => {
  return (
    <>
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Dispensasi Kontrak KPPN</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/">Home</a>
              </li>
              <li className="breadcrumb-item active">Rekam Dispensasi</li>
            </ol>
          </nav>
        </div>

        <section className="section">
          <DataDispensasiKPPN />
        </section>
      </main>
    </>
  );
};

export default DispensasiKPPNPage;
