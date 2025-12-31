"use client";

import React, { useState, useEffect } from "react";
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
  Table,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import {
  Formik,
  Field,
  ErrorMessage,
  FormikHelpers,
  FormikProps,
} from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { BsFillPlusSquareFill, BsTrash } from "react-icons/bs";
import moment from "moment";
import "react-datepicker/dist/react-datepicker.css";
import { AiOutlineClose } from "react-icons/ai";
import UploadSPM from "./upload-spm";

interface FormRow {
  nilaispm: string | number;
  nospm: string;
  nobast: string;
  tgspm: string | null;
  tglbast: string | null;
  status?: string;
}

interface FormValues {
  id?: string;
  tahun: string;
  formRows: FormRow[];
}

interface Rekam2Props {
  show: boolean;
  onHide: () => void;
  id?: string;
  nomor?: string;
  kdsatker?: string;
  nmsatker?: string;
  tahun?: string;
}

// Mock dependencies (replace with real implementations from your project)
const axiosJWT = { post: async (url: string, data: any, config?: any) => { } };
const token = "";
const kdlokasi = "";
const handleHttpError = (status: any, msg: string) => console.error(msg);

const DataSPM = ({ cek, id }: { cek: boolean; id: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cek && id) {
      console.log("DataSPM useEffect triggered, cek:", cek, "id:", id);
      fetchData();
    }
  }, [cek, id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = `SELECT nospm, nilspm, status, tgspm, tgbast, nobast FROM laporan_2023.dispensasi_spm_lampiran WHERE id_dispensasi = '${id}' ORDER BY id DESC`;
      console.log("DataSPM query:", query);
      const encryptedQuery = btoa(query);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      const response = await fetch(
        `${baseUrl}/dispensasi/${encryptedQuery}?limit=999&page=0`,
        {
          headers: {},
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("DataSPM response:", result);
      setData(result.result || []);
    } catch (error) {
      console.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>No.</th>
          <th>Tgl SPM</th>
          <th>No SPM</th>
          <th>Nilai SPM</th>
          <th>Tgl BAST</th>
          <th>No BAST</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{item.tgspm}</td>
            <td>{item.nospm}</td>
            <td>{new Intl.NumberFormat("id-ID").format(item.nilspm || 0)}</td>
            <td>{item.tgbast}</td>
            <td>{item.nobast}</td>
            <td>
              {item.status === "Setuju" ? (
                <span className="text-success">Disetujui</span>
              ) : (
                <span className="text-danger">Ditolak</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};



export default function Rekam2({
  show,
  onHide,
  id = "",
  nomor = "",
  kdsatker = "",
  nmsatker = "",
  tahun = String(new Date().getFullYear()),
}: Rekam2Props) {
  const [loading, setLoading] = useState(false);
  const [cek, setCek] = useState(false);
  const [cekupload, setCekupload] = useState(false);
  const [formRows, setFormRows] = useState<FormRow[]>([
    {
      nilaispm: "",
      nospm: "",
      nobast: "",
      tgspm: null,
      tglbast: null,
      status: "Setuju",
    },
  ]);

  const addRow = () => {
    setFormRows([
      ...formRows,
      {
        nilaispm: "",
        nospm: "",
        nobast: "",
        tgspm: null,
        tglbast: null,
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
    tahun,
    formRows,
  };

  const validationSchema = Yup.object().shape({
    formRows: Yup.array().of(
      Yup.object().shape({
        nospm: Yup.string().required("harus diisi"),
        nilaispm: Yup.number().required("hanya angka"),
        nobast: Yup.string().required("harus diisi"),
        tgspm: Yup.date().required("harus diisi"),
        tglbast: Yup.date().required("harus diisi"),
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
      const url = process.env.NEXT_PUBLIC_SIMPANSPM || "/api/simpan-spm";
      await axiosJWT.post(url, values, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      Swal.fire({
        html: `<div class='text-success mt-4'>Data SPM Berhasil Disimpan</div>`,
        icon: "success",
        position: "top",
        buttonsStyling: false,
        confirmButtonText: "Tutup",
      });
      setCek(true);
    } catch (error: any) {
      const { status, data: errData } = error.response || {};
      handleHttpError(
        status,
        (errData && errData.error) ||
        "Terjadi Permasalahan Koneksi atau Server Backend"
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setFormRows([
      {
        nilaispm: "",
        nospm: "",
        nobast: "",
        tgspm: null,
        tglbast: null,
        status: "Setuju",
      },
    ]);
    onHide();
  };

  const handleCek = () => {
    setCek(true);
    setCekupload(false);
  };

  const handleCekUpload = () => {
    setCekupload(true);
    setCek(false);
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
          <Modal.Title style={{ fontSize: 20 }}>
            <i className="bi bi-box-arrow-in-right text-success mx-3"></i>
            Data SPM Dispensasi
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
        <Modal.Body style={{ overflow: "auto", height: 600 }}>
          <Tab.Container defaultActiveKey="dispensasi-overview">
            <Nav
              variant="tabs"
              className="nav-tabs-bordered sticky-user is-sticky-user mb-0 mt-2"
              role="tablist"
            >
              <Nav.Item className="dispensasi-tab">
                <Nav.Link eventKey="dispensasi-overview" role="tab">
                  Rekam SPM
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
                  Data SPM
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
                    setValues,
                    touched,
                    errors,
                  }: FormikProps<FormValues>) => (
                    <Container className="mt-2">
                      <Form noValidate onSubmit={handleSubmit as any}>
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
                            className="my-2 text-primary"
                            style={{
                              fontSize: 20,
                              cursor: "pointer",
                            }}
                          />
                        </div>

                        {formRows.map((row, index) => (
                          <div key={index}>
                            <Row>
                              <Col sm={6} md={6} lg={3} xl={3}>
                                <Form.Group className="fw-normal my-1">
                                  <DatePicker
                                    name={`formRows[${index}].tgspm`}
                                    className="form-control"
                                    selected={
                                      values.formRows[index] &&
                                        values.formRows[index].tgspm
                                        ? moment(
                                          values.formRows[index].tgspm
                                        ).toDate()
                                        : null
                                    }
                                    onChange={(date: Date | null) => {
                                      if (date) {
                                        setFieldValue(
                                          `formRows[${index}].tgspm`,
                                          moment(date).format("YYYY-MM-DD")
                                        );
                                      }
                                    }}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="Tgl SPM"
                                    autoComplete="off"
                                    popperClassName="datepicker-popper"
                                    popperPlacement="bottom-start"
                                    shouldCloseOnSelect
                                    fixedHeight
                                  />
                                  <ErrorMessage
                                    name={`formRows[${index}].tgspm`}
                                    component="div"
                                    className="text-danger"
                                  />
                                </Form.Group>
                              </Col>
                              <Col sm={6} md={6} lg={5} xl={5}>
                                <Form.Group className="fw-normal my-1">
                                  <Field
                                    name={`formRows[${index}].nospm`}
                                    type="text"
                                    placeholder="Nomor SPM"
                                    as={Form.Control}
                                  />
                                  <ErrorMessage
                                    name={`formRows[${index}].nospm`}
                                    component="div"
                                    className="text-danger"
                                  />
                                </Form.Group>
                              </Col>

                              <Col sm={6} md={6} lg={4} xl={4}>
                                <Form.Group className="fw-normal my-1">
                                  <Field
                                    name={`formRows[${index}].nilaispm`}
                                    type="number"
                                    placeholder="Nilai SPM"
                                    as={Form.Control}
                                  />
                                  <ErrorMessage
                                    name={`formRows[${index}].nilaispm`}
                                    component="div"
                                    className="text-danger"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Row>
                              <Col sm={6} md={6} lg={3} xl={3}>
                                <Form.Group className="fw-normal my-1">
                                  <DatePicker
                                    name={`formRows[${index}].tglbast`}
                                    className="form-control"
                                    selected={
                                      values.formRows[index] &&
                                        values.formRows[index].tglbast
                                        ? moment(
                                          values.formRows[index].tglbast
                                        ).toDate()
                                        : null
                                    }
                                    onChange={(date: Date | null) => {
                                      if (date) {
                                        setFieldValue(
                                          `formRows[${index}].tglbast`,
                                          moment(date).format("YYYY-MM-DD")
                                        );
                                      }
                                    }}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="Tgl BAST"
                                    autoComplete="off"
                                    popperClassName="datepicker-popper"
                                    popperPlacement="bottom-start"
                                    shouldCloseOnSelect
                                    fixedHeight
                                  />
                                  <ErrorMessage
                                    name={`formRows[${index}].tglbast`}
                                    component="div"
                                    className="text-danger"
                                  />
                                </Form.Group>
                              </Col>
                              <Col sm={6} md={6} lg={9} xl={9}>
                                <Form.Group className="fw-normal my-1">
                                  <Field
                                    name={`formRows[${index}].nobast`}
                                    type="text"
                                    placeholder="Nomor BAST"
                                    as={Form.Control}
                                  />
                                  <ErrorMessage
                                    name={`formRows[${index}].nobast`}
                                    component="div"
                                    className="text-danger"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Row>
                              <Col sm={6} md={6} lg={12} xl={12}>
                                <Form.Group className="mb-0 fw-normal">
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
                            <hr />
                          </div>
                        ))}
                      </Form>
                    </Container>
                  )}
                </Formik>
              </Tab.Pane>
              <Tab.Pane eventKey="dispensasi-edit" role="tabpanel">
                <DataSPM cek={cek} id={id} />
              </Tab.Pane>
              <Tab.Pane eventKey="dispensasi-upload" role="tabpanel">
                <UploadSPM cekupload={cekupload} id={id} />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Modal.Body>
      </Modal>
    </>
  );
}
