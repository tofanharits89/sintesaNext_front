"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Col, Row } from "react-bootstrap";
import { useAuth } from "@/hooks/useAuth";
import { AiOutlineClose } from "react-icons/ai";
import Kddept from "@/data/kddept.json";
import Kdkanwil from "@/data/kdkanwil.json";
import Kdkppn from "@/data/kdkppn.json";

interface FilterData {
  selectedKementerian: string;
  selectedKanwil: string;
  selectedKppn: string;
  tahun: string;
}

interface FilterProps {
  show: boolean;
  onHide: () => void;
  onFilter: (filterData: FilterData) => void;
}

const Filter = ({ show, onHide, onFilter }: FilterProps) => {
  const { user } = useAuth();

  const [selectedKementerian, setSelectedKementerian] = useState("00");
  const [selectedKanwil, setSelectedKanwil] = useState("00");
  const [selectedKppn, setSelectedKppn] = useState("00");
  const [tahun, setTahun] = useState("");

  const handleClose = () => {
    onHide();
  };

  const handleFilter = () => {
    const filterData: FilterData = {
      selectedKementerian,
      selectedKanwil,
      selectedKppn,
      tahun,
    };

    // Mengirim hasil filter ke komponen induk
    onFilter(filterData);

    onHide();
  };

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setTahun(currentYear.toString());
  }, []);

  const handleTahunChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTahun = event.target.value;
    setTahun(selectedTahun);
  };

  const resetFilter = () => {
    setSelectedKementerian("00");
    setSelectedKanwil("00");
    setSelectedKppn("00");

    const filterData: FilterData = {
      selectedKementerian: "00",
      selectedKanwil: "00",
      selectedKppn: "00",
      tahun: "",
    };

    // Mengirim hasil filter yang direset ke komponen induk
    onFilter(filterData);

    onHide();
  };

  const kanwilOptions = Kdkanwil.filter((kanwil) =>
    user?.role === "kanwil_djpb" ? kanwil.kdkanwil === user.kdkanwil : true
  ).map((kdkanwil, index) => (
    <option key={index} value={kdkanwil.kdkanwil}>
      {kdkanwil.kdkanwil} - {kdkanwil.nmkanwil}
    </option>
  ));

  const kppnOptions = Kdkppn.filter((kppn) =>
    user?.role === "kppn" ? kppn.kdkppn === user.kdkppn : true
  ).map((kdkppn, index) => (
    <option key={index} value={kdkppn.kdkppn}>
      {kdkppn.kdkppn} - {kdkppn.nmkppn}
    </option>
  ));

  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        animation={false}
        size="xl"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header style={{ position: "relative" }}>
          <Modal.Title style={{ fontSize: "17px", flex: 1 }}>
            <i className="bi bi-grid-3x3-gap-fill text-primary fw-bold mx-2 "></i>
            Filter Data
          </Modal.Title>

          <button
            type="button"
            className="bg-transparent border-0 p-0 text-muted"
            aria-label="Tutup"
            title="Tutup"
            onClick={handleClose}
            style={{
              position: "absolute",
              fontSize: 24,
              top: "50%",
              right: 12,
              transform: "translateY(-50%)",
              cursor: "pointer",
              zIndex: 10,
              lineHeight: 1,
            }}
          >
            <AiOutlineClose />
          </button>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Form.Group
                as={Row}
                className="mb-3"
                controlId="formPlaintextEmail"
              >
                <Col sm={6} md={6} lg={4} xl={4}>
                  <Form.Label className="w-auto text-dark">Tahun</Form.Label>
                </Col>
                <Col sm={6} md={6} lg={8} xl={8}>
                  <select
                    className="form-select"
                    value={tahun}
                    onChange={handleTahunChange}
                  >
                    <option value="">Semua Tahun</option>
                    <option value="2023">TA 2023</option>
                    <option value="2024">TA 2024</option>
                    <option value="2025">TA 2025</option>
                  </select>
                </Col>
              </Form.Group>
            </Row>
            <Row>
              <Form.Group
                as={Row}
                className="mb-3"
                controlId="formPlaintextEmail"
              >
                <Col sm={6} md={6} lg={4} xl={4}>
                  <Form.Label className="w-auto text-dark">
                    Kementerian
                  </Form.Label>
                </Col>
                <Col sm={6} md={6} lg={8} xl={8}>
                  <select
                    className="form-select"
                    value={selectedKementerian}
                    onChange={(e) => setSelectedKementerian(e.target.value)}
                  >
                    <option value="00">Semua Kementerian</option>
                    {Kddept.map((dept, index) => (
                      <option key={index} value={dept.kddept}>
                        {dept.kddept} - {dept.nmdept}
                      </option>
                    ))}
                  </select>
                </Col>
              </Form.Group>
            </Row>
            {user?.role !== "kppn" && (
              <Row>
                <Form.Group
                  as={Row}
                  className="mb-3"
                  controlId="formPlaintextPassword"
                >
                  <Col sm={6} md={6} lg={4} xl={4}>
                    <Form.Label className="w-auto text-dark">Kanwil</Form.Label>
                  </Col>
                  <Col sm={6} md={6} lg={8} xl={8}>
                    <select
                      className="form-select"
                      value={selectedKanwil}
                      onChange={(e) => setSelectedKanwil(e.target.value)}
                    >
                      {user?.role !== "kanwil_djpb" && (
                        <option value="00">Semua Kanwil</option>
                      )}
                      {kanwilOptions}
                    </select>
                  </Col>
                </Form.Group>
              </Row>
            )}
            {user?.role === "kppn" && (
              <Row>
                <Form.Group
                  as={Row}
                  className="mb-3"
                  controlId="formPlaintextPassword"
                >
                  <Col sm={6} md={6} lg={4} xl={4}>
                    <Form.Label className="w-auto text-dark">Kppn</Form.Label>
                  </Col>
                  <Col sm={6} md={6} lg={8} xl={8}>
                    <select
                      className="form-select"
                      value={selectedKppn}
                      onChange={(e) => setSelectedKppn(e.target.value)}
                    >
                      {user?.role !== "kppn" && (
                        <option value="00">Semua KPPN</option>
                      )}
                      {kppnOptions}
                    </select>
                  </Col>
                </Form.Group>
              </Row>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" size="sm" onClick={handleFilter}>
            Terapkan Filter
          </Button>
          <Button variant="secondary" size="sm" onClick={resetFilter}>
            Reset Filter
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Filter;
