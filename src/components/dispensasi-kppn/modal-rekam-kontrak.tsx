"use client";

import React, { useState } from "react";
import {
  Modal,
  Form,
  Button,
  Container,
  Row,
  Col,
  Spinner,
  Nav,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { BsFillPlusSquareFill } from "react-icons/bs";
import { Tab } from "react-bootstrap";
import DataKontrakDetail from "./data-kontrak-detail";
import moment from "moment";

interface RekamKontrakProps {
  show: boolean;
  onHide: () => void;
  id: string;
  nomor: string;
  kdsatker: string;
  nmsatker: string;
  kdkppn: string;
}

interface FormRow {
  nilaikontrak: string;
  nokontrak: string;
  tgkontrak: string | null;
  kdkppn: string;
}

export default function ModalRekamKontrak({
  show,
  onHide,
  id,
  nomor,
  kdsatker,
  nmsatker,
  kdkppn,
}: RekamKontrakProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cek, setCek] = useState(false);
  const [formRows, setFormRows] = useState<FormRow[]>([
    {
      nilaikontrak: "",
      nokontrak: "",
      tgkontrak: null,
      kdkppn: kdkppn,
    },
  ]);

  const addRow = () => {
    setFormRows([
      ...formRows,
      {
        nilaikontrak: "",
        nokontrak: "",
        tgkontrak: null,
        kdkppn: kdkppn,
      },
    ]);
  };

  const removeRow = (index: number, values: any, setValues: any) => {
    const updatedRows = [...formRows];
    updatedRows.splice(index, 1);
    setFormRows(updatedRows);

    // Reset the form fields for the removed row
    const resetRow = {
      nilaikontrak: "",
      nokontrak: "",
      tgkontrak: null,
    };
    setValues({
      ...values,
      formRows: values.formRows.map((row: any, rowIndex: number) =>
        rowIndex === index ? resetRow : row
      ),
    });
  };

  const initialValues = {
    id,
    formRows,
    kdkppn,
  };

  const validationSchema = Yup.object().shape({
    formRows: Yup.array().of(
      Yup.object().shape({
        nokontrak: Yup.string().required("harus diisi"),
        nilaikontrak: Yup.number().required("hanya angka"),
        tgkontrak: Yup.date().required("harus diisi"),
      })
    ),
  });

  const handleSubmitdata = async (formRows: any, { setSubmitting }: any) => {
    setCek(false);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SIMPANLAMPIRANKONTRAKKPPN}`,
        {
          method: "POST",
          headers: {
            // Authorization: `Bearer ${user?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formRows),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setLoading(false);
      Swal.fire({
        html: `<div className='text-success mt-4'>Data Kontrak Berhasil Disimpan</div>`,
        icon: "success",
        position: "top",
        buttonsStyling: false,
        customClass: {
          popup: "swal2-animation",
          container: "swal2-animation",
          confirmButton: "swal2-confirm",
          icon: "swal2-icon",
        },
        confirmButtonText: "Tutup",
      });
      setCek(true);
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setFormRows([
      {
        nilaikontrak: "",
        nokontrak: "",
        tgkontrak: null,
        kdkppn: kdkppn,
      },
    ]);

    onHide();
  };

  const handleCek = () => {
    setCek(true);
  };

  return (
    <Modal
      show={show}
      onHide={handleModalClose}
      backdrop="static"
      keyboard={false}
      size="xl"
      animation={false}
    >
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "20px" }}>
          <i className="bi bi-box-arrow-in-right text-success mx-3"></i>
          Data Dispensasi Kontrak
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ overflow: "auto", height: "600px" }}>
        <Tab.Container defaultActiveKey="dispensasi-overview">
          <Nav
            variant="tabs"
            className="nav-tabs-bordered sticky-user is-sticky-user mb-0 mt-2"
            role="tablist"
          >
            <Nav.Item className="dispensasi-tab">
              <Nav.Link eventKey="dispensasi-overview" role="tab">
                Rekam Kontrak
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="dispensasi-edit"
                role="tab"
                onClick={handleCek}
              >
                Data Kontrak
              </Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content className="pt-2">
            {user?.role !== "kanwil_djpb" && (
              <Tab.Pane eventKey="dispensasi-overview" role="tabpanel">
                <Formik
                  validationSchema={validationSchema}
                  onSubmit={handleSubmitdata}
                  initialValues={initialValues}
                >
                  {({
                    handleSubmit,
                    setFieldValue,
                    values,
                    setValues,
                    touched,
                    errors,
                  }) => (
                    <Container className="mt-2">
                      <Form noValidate onSubmit={handleSubmit}>
                        <div className="d-flex justify-content-between align-bottom">
                          <span className="fw-bold text-success">
                            SATKER : {nmsatker} ({kdsatker}) <br />
                            Nomor Permohonan : {nomor}
                          </span>
                          <span>
                            <Button
                              type="submit"
                              size="sm"
                              variant="danger"
                              className="mt-1 mb-0"
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                  />
                                  Loading...
                                </>
                              ) : (
                                "Simpan Data"
                              )}
                            </Button>
                          </span>
                        </div>

                        <hr />
                        <div className="text-end">
                          <BsFillPlusSquareFill
                            onClick={addRow}
                            className="my-1 text-primary"
                            style={{
                              fontSize: "20px",
                              cursor: "pointer",
                            }}
                          />
                        </div>
                        {formRows.map((row, index) => (
                          <Row key={index}>
                            <Col sm={6} md={6} lg={5} xl={5}>
                              <Form.Group className="fw-normal my-1">
                                <Field
                                  name={`formRows[${index}].nokontrak`}
                                  type="text"
                                  placeholder="Nomor Kontrak/ Adendum"
                                  as={Form.Control}
                                />
                                <ErrorMessage
                                  name={`formRows[${index}].nokontrak`}
                                  component="div"
                                  className="text-danger"
                                />
                              </Form.Group>
                            </Col>

                            <Col sm={6} md={6} lg={3} xl={3}>
                              <Form.Group className="fw-normal my-1">
                                <DatePicker
                                  name={`formRows[${index}].tgkontrak`}
                                  className="form-control"
                                  selected={
                                    values.formRows[index] &&
                                    values.formRows[index].tgkontrak
                                      ? moment(
                                          values.formRows[index].tgkontrak
                                        ).toDate()
                                      : null
                                  }
                                  onChange={(date) => {
                                    setFieldValue(
                                      `formRows[${index}].tgkontrak`,
                                      moment(date).format("YYYY-MM-DD")
                                    );
                                  }}
                                  dateFormat="dd/MM/yyyy"
                                  placeholderText="Tgl Kontrak"
                                  autoComplete="off"
                                />
                                <ErrorMessage
                                  name={`formRows[${index}].tgkontrak`}
                                  component="div"
                                  className="text-danger"
                                />
                              </Form.Group>
                            </Col>

                            <Col sm={6} md={6} lg={4} xl={4}>
                              <Form.Group className="fw-normal my-1">
                                <Field
                                  name={`formRows[${index}].nilaikontrak`}
                                  type="number"
                                  placeholder="Nilai Kontrak"
                                  as={Form.Control}
                                />
                                <ErrorMessage
                                  name={`formRows[${index}].nilaikontrak`}
                                  component="div"
                                  className="text-danger"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        ))}
                      </Form>
                    </Container>
                  )}
                </Formik>
              </Tab.Pane>
            )}
            <Tab.Pane eventKey="dispensasi-edit" role="tabpanel">
              <DataKontrakDetail cek={cek} id={id} />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>
    </Modal>
  );
}
