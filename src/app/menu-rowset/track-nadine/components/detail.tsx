"use client";
import React from "react";
import Modal from "react-bootstrap/Modal";

interface DetailProps {
  showModal: boolean;
  handleCloseModal: () => void;
  selectedDetail?: string | null;
  token?: string | null;
  id?: string | null;
  bgcolor?: string;
}

export default function Detail({
  showModal,
  handleCloseModal,
  selectedDetail,
}: DetailProps) {
  return (
    <Modal show={showModal} onHide={handleCloseModal} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Detail</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>Selected detail: {selectedDetail}</div>
        {/* Add more detailed rendering here */}
      </Modal.Body>
    </Modal>
  );
}
