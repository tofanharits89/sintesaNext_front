"use client";

import React, { useState } from "react";
import { Card } from "react-bootstrap";
import DispenKontrak from "@/components/dispensasi/dispen-kontrak";

const KontrakPage: React.FC = () => {
  const [cek, setCek] = useState(false);
  const [id, setId] = useState("");
  const [where, setWhere] = useState("");

  return (
    <>
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Dispensasi Kontrak</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/dispensasi/llat">Dispensasi</a>
              </li>
              <li className="breadcrumb-item active">Kontrak</li>
            </ol>
          </nav>
        </div>

        <section className="section">
          <Card className="mt-1 p-2 card-container">
            <Card.Body className="data-user fade-in">
              <DispenKontrak cek={cek} id={id} where={where} />
            </Card.Body>
          </Card>
        </section>
      </main>
    </>
  );
};

export default KontrakPage;
