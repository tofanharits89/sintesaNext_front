"use client";

import { useState, useEffect } from "react";
import { Card, Badge, OverlayTrigger, Tooltip, Button } from "react-bootstrap";
import numeral from "numeral";
import { motion } from "motion/react";
import type { PenerimaKabItem } from "./jumlahpenerimaKab";

const ITEMS_PER_PAGE = 10;

const KabKota = ({ data }: { data: PenerimaKabItem[] }) => {
  const safeData = Array.isArray(data) ? data : [];
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(safeData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = safeData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="mt-4 mb-0">
      {currentData.map((item, idx) => (
        <motion.div
          key={idx}
          style={{ marginBottom: "4px" }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.3 }}
        >
          <Card
            className="shadow-sm bg-light border border-light card-hover hover-shadow mt-3"
            style={{
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              width: "100%",
              marginBottom: "0px",
            }}
          >
            <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-1 py-1 px-2">
              <div className="d-flex align-items-center">
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip id={`tooltip-kabkota`}>{item.kabkota}</Tooltip>
                  }
                >
                  <Card.Title className="mb-0 p-0 text-end">
                    <h6 style={{ fontSize: "0.85em", margin: 0, padding: 0 }}>
                      {item.kabkota.length > 15
                        ? item.kabkota.slice(0, 15) + "..."
                        : item.kabkota}
                    </h6>
                  </Card.Title>
                </OverlayTrigger>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Button variant="light" size="sm" className="mb-0 p-1">
                  <h6
                    style={{
                      fontSize: "1em",
                      margin: 0,
                      padding: 0,
                      fontWeight: "bold",
                    }}
                  >
                    {numeral(item.penerimakab).format("0,0")}{" "}
                    <Badge
                      bg="danger"
                      text="light"
                      className="fw-bold mx-2"
                      style={{ fontSize: "0.8em" }}
                    >
                      {numeral(item.persenpenerimakab).format("0,0")} %
                    </Badge>
                  </h6>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      ))}

      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4 mb-0">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handlePrev}
            disabled={currentPage === 1}
          >
            <i className="bi bi-chevron-left" />
          </Button>
          <span className="text-muted small">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            <i className="bi bi-chevron-right" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default KabKota;
