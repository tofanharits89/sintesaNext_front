"use client";

import React, { useState } from "react";
import { Card, Button, Tab, Nav } from "react-bootstrap";
import DispenSPM from "@/components/dispensasi/dispen-spm";
import DispenKontrak from "@/components/dispensasi/dispen-kontrak";
import DispenTUP from "@/components/dispensasi/dispen-tup";
import Monitoring from "@/components/dispensasi/monitoring-dispen";
import FilterData from "@/components/dispensasi/filter";
import Rekam from "@/components/dispensasi/rekam";
import { useAuth } from "@/hooks/useAuth";

const DispensasiPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [cek, setCek] = useState(false);
  const [id, setId] = useState("");
  const [where, setWhere] = useState("");
  const [showModalFilter, setShowModalFilter] = useState(false);
  const [showModalRekam, setShowModalRekam] = useState(false);
  const [filter, setFilter] = useState({
    selectedKementerian: "00",
    selectedKanwil: "00",
    selectedKppn: "00",
    tahun: "",
  });

  const handleCek = () => {
    setCek(!cek);
  };

  const handleFilterResult = (filterData: any) => {
    const { selectedKementerian, selectedKanwil, selectedKppn, tahun } =
      filterData;

    let FilterWhere = "";

    const addFilterClause = (filterVal: string, columnName: string) => {
      if (filterVal !== "00" && filterVal !== "") {
        return `${columnName} = '${filterVal}'`;
      }
      return "";
    };

    setFilter(filterData);

    const whereClauses = [
      addFilterClause(selectedKementerian, "a.kddept"),
      addFilterClause(selectedKanwil, "a.kdkanwil"),
      addFilterClause(tahun, "a.thang"),
      addFilterClause(selectedKppn, "a.kdkppn"),
    ].filter(Boolean);

    if (whereClauses.length > 0) {
      FilterWhere = "  " + whereClauses.join(" AND ");
    }

    setWhere(FilterWhere);
    handleCek();
  };

  const handleRekam = () => {
    setShowModalRekam(true);
  };

  return (
    <>
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Data Dispensasi LLAT</h1>
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
          <div className="d-flex justify-content-end text-danger mb-2">
            {role !== "lainnya" && (
              <Button
                variant="primary"
                size="sm"
                className="button my-0"
                style={{
                  padding: "5px 5px",
                  marginTop: "1px",
                  width: "150px",
                }}
                onClick={handleRekam}
              >
                Rekam Dispensasi
              </Button>
            )}
          </div>

          <Tab.Container id="dispensasi-tabs" defaultActiveKey="dispensasi-spm">
            <Nav
              variant="tabs"
              className="nav-tabs-bordered sticky-user is-sticky-user mb-1 bg-white"
              role="tablist"
            >
              <Nav.Item className="dispensasi-tab">
                <Nav.Link
                  eventKey="dispensasi-spm"
                  role="tab"
                  onClick={handleCek}
                >
                  <i className="bi bi-grid-1x2-fill text-warning fw-bold me-2"></i>
                  Dispensasi SPM
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="dispensasi-kontrak"
                  role="tab"
                  onClick={handleCek}
                >
                  <i className="bi bi-grid-fill text-success fw-bold me-2"></i>
                  Dispensasi Kontrak
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="dispensasi-tup"
                  role="tab"
                  onClick={handleCek}
                >
                  <i className="bi bi-grid-3x3-gap-fill text-indigo fw-bold mx-2 me-2"></i>
                  Dispensasi TUP
                </Nav.Link>
              </Nav.Item>
              {(role === "super_admin" ||
                role === "kanwil_djpb" ||
                role === "kppn") && (
                <Nav.Item>
                  <Nav.Link
                    eventKey="monitoring-spm"
                    role="tab"
                    onClick={handleCek}
                  >
                    <i className="bi bi-layout-wtf text-success fw-bold me-2"></i>
                    Monitoring
                  </Nav.Link>
                </Nav.Item>
              )}
              <Nav.Item>
                <span
                  className="d-flex mt-2 nav-link border-0"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowModalFilter(true)}
                >
                  <i className="bi bi-grid-3x3-gap-fill text-primary fw-bold mx-2 "></i>{" "}
                  Filter Data
                </span>
              </Nav.Item>

              <span
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {(filter.selectedKanwil !== "00" ||
                  filter.selectedKementerian !== "00" ||
                  filter.selectedKppn !== "00" ||
                  filter.tahun !== "") && (
                  <Button
                    variant="success"
                    size="sm"
                    className="my-1 mx-1 fade-in"
                  >
                    Filter Aktif
                  </Button>
                )}
                {filter.tahun !== "" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="my-1 mx-1 fade-in"
                  >
                    Tahun {filter.tahun}
                  </Button>
                )}
                {filter.selectedKementerian !== "00" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="my-1 mx-1 fade-in"
                  >
                    Kementerian {filter.selectedKementerian}
                  </Button>
                )}
                {filter.selectedKanwil !== "00" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="my-1 mx-1 fade-in"
                  >
                    Kanwil {filter.selectedKanwil}
                  </Button>
                )}
                {filter.selectedKppn !== "00" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="my-1 mx-1 fade-in"
                  >
                    Kppn {filter.selectedKppn}
                  </Button>
                )}
              </span>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="dispensasi-spm">
                <Card className="mt-1 p-2 card-container">
                  <Card.Body className="data-user fade-in">
                    <DispenSPM cek={cek} id={id} where={where} />
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="dispensasi-kontrak">
                <Card className="mt-1 p-2 card-container">
                  <Card.Body className="data-user fade-in">
                    <DispenKontrak cek={cek} id={id} where={where} />
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="dispensasi-tup">
                <Card className="mt-1 p-2 card-container">
                  <Card.Body className="data-user fade-in">
                    <DispenTUP cek={cek} id={id} where={where} />
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="monitoring-spm">
                <Card className="mt-1 p-2 card-container">
                  <Card.Body className="data-user fade-in">
                    <Monitoring cek={cek} id={id} where={where} />
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </section>
      </main>

      <Rekam show={showModalRekam} onHide={() => setShowModalRekam(false)} />

      <FilterData
        show={showModalFilter}
        onHide={() => setShowModalFilter(false)}
        onFilter={handleFilterResult}
      />
    </>
  );
};

export default DispensasiPage;
