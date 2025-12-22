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
  Tab,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Formik, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { BsFillPlusSquareFill, BsTrash } from "react-icons/bs";
import { AiOutlineClose } from "react-icons/ai";
import DataTupDetail from "./dispen-tup-detail";
import UploadTup from "./upload-tup";
import moment from "moment";

interface FormRow {
  nilaitup: string | number;
  notup: string;
  tgtup: string | null;
  status: string;
}

interface FormValues {
  id: string;
  tahun: string;
  formRows: FormRow[];
}

interface RekamTupProps {
  show: boolean;
  onHide: () => void;
  id: string;
  nomor: string;
  kdsatker: string;
  nmsatker: string;
  tahun: string;
}

export default function RekamTup({
  show,
  onHide,
  id,
  nomor,
  kdsatker,
  nmsatker,
  tahun,
}: RekamTupProps) {
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [cek, setCek] = useState(false);
  const [formRows, setFormRows] = useState<FormRow[]>([
    {
      nilaitup: "",
      notup: "",
      tgtup: null,
      status: "Setuju",
    },
  ]);
  const [cekupload, setCekupload] = useState(false);

  const handleCekUpload = () => {
    setCekupload(true);
    setCek(false);
  };

  const addRow = () => {
    setFormRows([
      ...formRows,
      {
        nilaitup: "",
        notup: "",
        tgtup: null,
        status: "Setuju",
      },
    ]);
  };

  const removeRow = (index: number) => {
    const updatedRows = [...formRows];
    updatedRows.splice(index, 1);
    setFormRows(updatedRows);
  };

  const initialValues: FormValues = {
    id,
    tahun: tahun,
    formRows,
  };

  const validationSchema = Yup.object().shape({
    formRows: Yup.array().of(
      Yup.object().shape({
        notup: Yup.string().required("harus diisi"),
        nilaitup: Yup.number().required("hanya angka"),
        tgtup: Yup.date().required("harus diisi"),
        status: Yup.string().required("harus diisi"),
      })
    ),
  });

  const handleSubmitdata = async (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>
  ) => {
    setCek(false);
    setLoading(true);
    try {
      const url =
        process.env.NEXT_PUBLIC_SIMPANLAMPIRANTUP || "/api/simpan-lampiran-tup";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      Swal.fire({
        html: `<div class='text-success mt-4'>Data TUP Berhasil Disimpan</div>`,
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
      toast.success("Data TUP Berhasil Disimpan");
    } catch (error: any) {
      const message =
        error?.message || "Terjadi Permasalahan Koneksi atau Server Backend";
      toast.error(message);
      setSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setFormRows([
      {
        nilaitup: "",
        notup: "",
        tgtup: null,
        status: "Setuju",
      },
    ]);
    onHide();
  };

  const handleCek = () => {
    setCek(true);
  };

  return (
    <>
      <style>
        {`
          .datepicker-popper {
            z-index: 9999 !important;
            position: fixed !important;
          }
          .react-datepicker {
            border: 1px solid #ced4da;
            border-radius: 0.375rem;
            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
          }
        `}
      </style>
      <Modal
        show={show}
        onHide={handleModalClose}
        backdrop="static"
        keyboard={false}
        size="xl"
        animation={false}
      >
        <Modal.Header style={{ position: "relative" }}>
          <Modal.Title style={{ fontSize: "20px", flex: 1 }}>
            <i className="bi bi-box-arrow-in-right text-success mx-3"></i>
            Data Dispensasi TUP
          </Modal.Title>

          <button
            type="button"
            className="bg-transparent border-0 p-0 text-muted"
            aria-label="Tutup"
            title="Tutup"
            onClick={handleModalClose}
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
        <Modal.Body style={{ overflow: "auto", height: "600px" }}>
          <Tab.Container defaultActiveKey="dispensasi-overview">
            <Nav
              variant="tabs"
              className="nav-tabs-bordered sticky-user is-sticky-user mb-0 mt-2"
              role="tablist"
            >
              <Nav.Item className="dispensasi-tab">
                <Nav.Link eventKey="dispensasi-overview" role="tab">
                  Rekam TUP
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="dispensasi-upload"
                  role="tab"
                  onClick={handleCekUpload}
                >
                  Upload Excell
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="dispensasi-edit"
                  role="tab"
                  onClick={handleCek}
                >
                  Data TUP
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content className="pt-2">
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
                          <div key={index}>
                            <Row>
                              <Col sm={6} md={6} lg={5} xl={5}>
                                <Form.Group className="fw-normal my-1">
                                  <Field
                                    name={`formRows[${index}].notup`}
                                    type="text"
                                    placeholder="Nomor TUP"
                                    as={Form.Control}
                                  />
                                  <ErrorMessage
                                    name={`formRows[${index}].notup`}
                                    component="div"
                                    className="text-danger"
                                  />
                                </Form.Group>
                              </Col>

                              <Col sm={6} md={6} lg={3} xl={3}>
                                <Form.Group className="fw-normal my-1">
                                  <DatePicker
                                    name={`formRows[${index}].tgtup`}
                                    selected={
                                      values.formRows[index] &&
                                      values.formRows[index].tgtup
                                        ? moment(
                                            values.formRows[index].tgtup
                                          ).toDate()
                                        : null
                                    }
                                    className="form-control"
                                    onChange={(date: Date | null) => {
                                      if (date) {
                                        setFieldValue(
                                          `formRows[${index}].tgtup`,
                                          moment(date).format("YYYY-MM-DD")
                                        );
                                      }
                                    }}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="Tgl TUP"
                                    autoComplete="off"
                                    popperClassName="datepicker-popper"
                                    popperPlacement="bottom-start"
                                    shouldCloseOnSelect
                                    fixedHeight
                                  />

                                  <ErrorMessage
                                    name={`formRows[${index}].tgtup`}
                                    component="div"
                                    className="text-danger"
                                  />
                                </Form.Group>
                              </Col>

                              <Col sm={6} md={6} lg={4} xl={4}>
                                <Form.Group className="fw-normal my-1">
                                  <Field
                                    name={`formRows[${index}].nilaitup`}
                                    type="number"
                                    placeholder="Nilai TUP"
                                    as={Form.Control}
                                  />
                                  <ErrorMessage
                                    name={`formRows[${index}].nilaitup`}
                                    component="div"
                                    className="text-danger"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Row>
                              <Col sm={6} md={6} lg={12} xl={12}>
                                <Form.Group className="fw-normal my-1">
                                  <Form.Check
                                    inline
                                    type="radio"
                                    name={`formRows[${index}].status`}
                                    value="Setuju"
                                    label="Disetujui"
                                    checked={
                                      values.formRows[index] &&
                                      values.formRows[index].status === "Setuju"
                                    }
                                    onChange={() => {
                                      setFieldValue(
                                        `formRows[${index}].status`,
                                        "Setuju"
                                      );
                                    }}
                                  />
                                  <Form.Check
                                    inline
                                    type="radio"
                                    name={`formRows[${index}].status`}
                                    value="Tolak"
                                    label="Ditolak"
                                    checked={
                                      values.formRows[index] &&
                                      values.formRows[index].status === "Tolak"
                                    }
                                    onChange={() => {
                                      setFieldValue(
                                        `formRows[${index}].status`,
                                        "Tolak"
                                      );
                                    }}
                                  />
                                  <ErrorMessage
                                    name={`formRows[${index}].status`}
                                    component="div"
                                    className="text-danger"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <div className="text-end mb-2">
                              <BsTrash
                                onClick={() => removeRow(index)}
                                className="text-danger"
                                style={{
                                  fontSize: 16,
                                  cursor: "pointer",
                                }}
                              />
                            </div>
                            <hr className="text-danger" />
                          </div>
                        ))}
                      </Form>
                    </Container>
                  )}
                </Formik>
              </Tab.Pane>
              <Tab.Pane eventKey="dispensasi-edit" role="tabpanel">
                <DataTupDetail cek={cek} id={id} />
              </Tab.Pane>
              <Tab.Pane eventKey="dispensasi-upload" role="tabpanel">
                <UploadTup cekupload={cekupload} id={id} />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Modal.Body>
      </Modal>
    </>
  );
}
