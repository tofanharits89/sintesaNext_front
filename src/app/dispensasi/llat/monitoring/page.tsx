"use client";

import React, { useState } from "react";
import { Card } from "react-bootstrap";
import Monitoring from "@/components/dispensasi/monitoring-dispen";

const MonitoringPage: React.FC = () => {
  const [cek, setCek] = useState(false);
  const [id, setId] = useState("");
  const [where, setWhere] = useState("");

  return (
    <>
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Monitoring Dispensasi</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/dispensasi/llat">Dispensasi</a>
              </li>
              <li className="breadcrumb-item active">Monitoring</li>
            </ol>
          </nav>
        </div>

        <section className="section">
          <Card className="mt-1 p-2 card-container">
            <Card.Body className="data-user fade-in">
              <Monitoring cek={cek} id={id} where={where} />
            </Card.Body>
          </Card>
        </section>
      </main>
    </>
  );
};

export default MonitoringPage;
