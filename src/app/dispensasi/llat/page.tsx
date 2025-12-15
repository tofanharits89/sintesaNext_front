"use client";

import React, { useState } from "react";
import { Tab, Nav } from "react-bootstrap";
import DispenKontrak from "@/components/dispensasi/dispen-kontrak";
import DispenSPM from "@/components/dispensasi/dispen-spm";
import DispenTUP from "@/components/dispensasi/dispen-tup";
import Monitoring from "@/components/dispensasi/monitoring-dispen";

const DispensasiPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("monitoring");
  const [cek, setCek] = useState(false);
  const [id, setId] = useState("");
  const [where, setWhere] = useState("");

  return (
    <div>
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Dispensasi</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="#">Home</a>
              </li>
              <li className="breadcrumb-item active">Dispensasi</li>
            </ol>
          </nav>
        </div>
        <section className="section">
          <Tab.Container
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || "monitoring")}
          >
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="monitoring">Monitoring Dispensasi</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="kontrak">Dispensasi Kontrak</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="spm">Dispensasi SPM</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="tup">Dispensasi TUP</Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content>
              <Tab.Pane eventKey="monitoring">
                <Monitoring cek={cek} id={id} where={where} />
              </Tab.Pane>
              <Tab.Pane eventKey="kontrak">
                <DispenKontrak cek={cek} id={id} where={where} />
              </Tab.Pane>
              <Tab.Pane eventKey="spm">
                <DispenSPM cek={cek} id={id} where={where} />
              </Tab.Pane>
              <Tab.Pane eventKey="tup">
                <DispenTUP cek={cek} id={id} where={where} />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </section>
      </main>
    </div>
  );
};

export default DispensasiPage;
