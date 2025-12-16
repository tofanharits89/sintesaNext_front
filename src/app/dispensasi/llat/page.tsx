"use client";

import React from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import Link from "next/link";

const DispensasiLandingPage: React.FC = () => {
  const menuItems = [
    {
      title: "Monitoring Dispensasi",
      description: "Lihat overview dan monitoring semua dispensasi",
      href: "/dispensasi/llat/monitoring",
      icon: "📊",
      color: "primary",
    },
    {
      title: "Dispensasi SPM",
      description: "Kelola dispensasi SPM",
      href: "/dispensasi/llat/spm",
      icon: "📄",
      color: "info",
    },
    {
      title: "Dispensasi Kontrak",
      description: "Kelola dispensasi Kontrak",
      href: "/dispensasi/llat/kontrak",
      icon: "📋",
      color: "warning",
    },
    {
      title: "Dispensasi TUP",
      description: "Kelola dispensasi TUP",
      href: "/dispensasi/llat/tup",
      icon: "📑",
      color: "success",
    },
  ];

  return (
    <>
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Dispensasi - LLAT</h1>
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
          <Row className="g-3">
            {menuItems.map((item, index) => (
              <Col lg={6} xl={6} key={index}>
                <Card
                  className="card-container h-100 cursor-pointer"
                  style={{ cursor: "pointer" }}
                >
                  <Card.Body className="data-user fade-in d-flex flex-column">
                    <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>
                      {item.icon}
                    </div>
                    <h5
                      className="card-title"
                      style={{ fontWeight: 600, marginBottom: "0.5rem" }}
                    >
                      {item.title}
                    </h5>
                    <p
                      className="card-text"
                      style={{
                        color: "var(--muted-foreground)",
                        marginBottom: "1rem",
                        flex: 1,
                      }}
                    >
                      {item.description}
                    </p>
                    <Link href={item.href} className="text-decoration-none">
                      <Button variant={item.color} size="sm" className="w-100">
                        Buka →
                      </Button>
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      </main>
    </>
  );
};

export default DispensasiLandingPage;
