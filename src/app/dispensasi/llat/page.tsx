"use client";

import React, { useState } from "react";
import { Tab, Nav, Card } from "react-bootstrap";
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
    <>
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Dispensasi</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/">Home</a>
              </li>
              <li className="breadcrumb-item active">Dispensasi</li>
            </ol>
          </nav>
        </div>

        <section className="section">
          <Card className="mt-1 p-2 card-container">
            <Card.Body className="data-user fade-in">
              <Tab.Container
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || "monitoring")}
              >
                <Nav variant="tabs" className="nav-tabs mb-0">
                  <Nav.Item>
                    <Nav.Link eventKey="monitoring" className="nav-link">
                      Monitoring Dispensasi
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="kontrak" className="nav-link">
                      Dispensasi Kontrak
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="spm" className="nav-link">
                      Dispensasi SPM
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="tup" className="nav-link">
                      Dispensasi TUP
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content className="tab-content mt-0">
                  <Tab.Pane eventKey="monitoring" className="tab-pane">
                    <Monitoring cek={cek} id={id} where={where} />
                  </Tab.Pane>
                  <Tab.Pane eventKey="kontrak" className="tab-pane">
                    <DispenKontrak cek={cek} id={id} where={where} />
                  </Tab.Pane>
                  <Tab.Pane eventKey="spm" className="tab-pane">
                    <DispenSPM cek={cek} id={id} where={where} />
                  </Tab.Pane>
                  <Tab.Pane eventKey="tup" className="tab-pane">
                    <DispenTUP cek={cek} id={id} where={where} />
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </Card.Body>
          </Card>
        </section>
      </main>
    </>
  );
};

export default DispensasiPage;
