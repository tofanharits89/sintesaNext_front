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
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/hooks/useAuth";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { toast } from "sonner";
import moment from "moment";
import CekKppn from "./cek-kppn";

interface Satker {
  kdsatker: string;
  nmsatker: string;
  kdkppn: string;
}

interface FormValues {
  tanggalPermohonan: string | null;
  nomorPermohonan: string;
  satker: string;
  kppn: string;
  alasan: string;
  tanggalPersetujuan: string | null;
  nomorPersetujuan: string;
  jeniskontrak: string;
  alasanLainnya: string;
  tahun: string;
}

interface Props {
  show: boolean;
  onHide: () => void;
}

const Rekam: React.FC<Props> = ({ show, onHide }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedSatker, setSelectedSatker] = useState<Satker | null>(null);
  const [searchResults, setSearchResults] = useState<Satker[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<Satker[]>([]);
  const [sql, setSql] = useState("");
  const [jeniskontrak, setJenisKontrak] = useState("");
  const [tahun, setTahun] = useState("");
  const [kppn, setCekKppn] = useState("");
  const [isAlasan2Visible, setIsAlasan2Visible] = useState(false);
  const [isAlasan7Visible, setIsAlasan7Visible] = useState(false);

  const handleJenisChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedJenis = event.target.value;
    setJenisKontrak(selectedJenis);
  };

  const handleAlasanChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedAlasan = event.target.value;
    setIsAlasan7Visible(selectedAlasan === "07");
  };

  const handleTahunChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTahun(event.target.value);
  };

  const validationSchema = Yup.object().shape({
    tanggalPermohonan: Yup.date()
      .nullable()
      .required("Tanggal Permohonan harus diisi")
      .max(
        Yup.ref("tanggalPersetujuan"),
        "Tanggal Permohonan tidak boleh lebih besar dari Tanggal Persetujuan"
      ),
    tanggalPersetujuan: Yup.date()
      .nullable()
      .required("Tanggal Persetujuan harus diisi"),
    nomorPermohonan: Yup.string().required("Nomor Permohonan harus diisi"),
    satker: Yup.string().required("Satker harus diisi"),
    alasan: Yup.string().required("Alasan harus dipilih"),
    nomorPersetujuan: Yup.string().required("Nomor Persetujuan harus diisi"),
    kppn: Yup.string().required("harus dipilih"),
    tahun: Yup.string().required("harus dipilih"),
    jeniskontrak: Yup.string().required("harus dipilih"),
    alasanLainnya: Yup.string().when("alasan", {
      is: (alasan: string) => alasan === "07",
      then: () => Yup.string().required("Keterangan harus diisi"),
    }),
  });

  const initialValues: FormValues = {
    tanggalPermohonan: null,
    nomorPermohonan: "",
    satker: "",
    kppn: kppn,
    alasan: "",
    tanggalPersetujuan: null,
    nomorPersetujuan: "",
    jeniskontrak: jeniskontrak,
    alasanLainnya: "",
    tahun: tahun,
  };

  const handleCekKppn = (kppn: string) => {
    setCekKppn(kppn);
  };

  const handleSubmitdata = async (values: FormValues) => {
    setLoading(true);
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_SIMPANKONTRAKKPPN || "",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Data Berhasil Disimpan");
      setSearchResults([]);
      setLoading(false);
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
    }
  };

  const getData = async () => {
    let query = "SELECT kdsatker,nmsatker,kdkppn FROM dbref.t_satker_kppn_2025";

    if (kppn !== "000" && kppn !== "") {
      query += ` WHERE kdkppn='${kppn}'`;
    }

    const encryptedQuery = btoa(query);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CARISATKER}${encryptedQuery}`,
        {
          headers: {},
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result);
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsSearching(true);

    const results = data.filter((item) => {
      const kdsatkerLowerCase = item.kdsatker.toLowerCase();
      const nmsatkerLowerCase = item.nmsatker.toLowerCase();
      if (user?.role === "kppn") {
        if (item.kdkppn === user.kdkppn) {
          return (
            kdsatkerLowerCase.includes(value.toLowerCase()) ||
            nmsatkerLowerCase.includes(value.toLowerCase())
          );
        }
      } else {
        return (
          kdsatkerLowerCase.includes(value.toLowerCase()) ||
          nmsatkerLowerCase.includes(value.toLowerCase())
        );
      }

      return false;
    });

    const limitedResults = results.slice(0, 100);

    setSearchResults(limitedResults);
    setIsSearching(false);
  };

  useEffect(() => {
    getData();
  }, [kppn]);

  const handleModalClose = () => {
    setSelectedSatker(null);
    setSearchResults([]);
    setSearchTerm("");
    setCekKppn("");
    setIsAlasan7Visible(false);
    onHide();
    setJenisKontrak("");
    setTahun("");
  };

  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (show) {
      setAnimationClass("modal-body-animation-enter");
    } else {
      setAnimationClass("modal-body-animation-exit");
    }
  }, [show]);

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
          <i className="bi bi-back text-success mx-3"></i>
          Rekam Dispensasi Kontrak KPPN
        </Modal.Title>
      </Modal.Header>
      <Modal.Body
        style={{ overflow: "auto", height: "auto" }}
        className={`text-dark ${animationClass}`}
      >
        <Formik
          validationSchema={validationSchema}
          enableReinitialize={true}
          onSubmit={handleSubmitdata}
          initialValues={initialValues}
        >
          {({
            handleSubmit,
            handleChange,
            setFieldValue,
            values,
            touched,
            errors,
          }) => (
            <Container fluid>
              <Form noValidate onSubmit={handleSubmit}>
                <Row>
                  <Col sm={3} md={3} lg={3} xl={3}>
                    <Form.Group className="mb-1 mt-1">
                      <Form.Label className="fw-bold">
                        Tahun Anggaran
                      </Form.Label>
                      <Field
                        name="tahun"
                        as="select"
                        className={`form-select form-select-md text-select ${
                          touched.tahun && errors.tahun ? "is-invalid" : ""
                        }`}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          handleChange(e);
                          handleTahunChange(e);
                        }}
                      >
                        <option value="">-- Pilih Tahun --</option>
                        <option value="2024">TA 2024</option>
                        <option value="2025">TA 2025</option>
                      </Field>
                    </Form.Group>
                  </Col>
                  <Col sm={3} md={3} lg={3} xl={3}>
                    <Form.Group className="mb-1 mt-1">
                      <Form.Label className="fw-bold">
                        Jenis Dispensasi
                      </Form.Label>
                      <Field
                        name="jeniskontrak"
                        as="select"
                        className={`form-select form-select-md text-select ${
                          touched.jeniskontrak && errors.jeniskontrak
                            ? "is-invalid"
                            : ""
                        }`}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          handleChange(e);
                          handleJenisChange(e);
                        }}
                      >
                        <option value="">-- Pilih Jenis Kontrak --</option>
                        <option value="01">Kontrak</option>
                        <option value="02">Adendum Kontrak</option>
                      </Field>
                    </Form.Group>
                  </Col>
                  <Col sm={3} md={3} lg={6} xl={6}>
                    <Form.Group className="mb-1 mt-1">
                      <Form.Label className="fw-bold">KPPN</Form.Label>

                      <CekKppn
                        value={values.kppn}
                        className={`form-control ${
                          touched.kppn && errors.kppn ? "is-invalid" : ""
                        }`}
                        onChange={(e: string) => {
                          handleChange({ target: { name: "kppn", value: e } });
                          handleCekKppn(e);
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col sm={3} md={3} lg={3} xl={3}>
                    <Form.Group className="mb-1 mt-1">
                      <Form.Label className="fw-bold">
                        Tanggal Permohonan
                      </Form.Label>
                      <br />
                      <DatePicker
                        name="tanggalPermohonan"
                        selected={
                          values.tanggalPermohonan
                            ? moment(values.tanggalPermohonan).toDate()
                            : null
                        }
                        onChange={(date: Date | null) => {
                          setFieldValue(
                            "tanggalPermohonan",
                            date ? moment(date).format("YYYY-MM-DD") : null,
                            true
                          );
                        }}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Tgl Permohonan"
                        autoComplete="off"
                        timeZone="UTC"
                        className={`form-control ${
                          touched.tanggalPermohonan && errors.tanggalPermohonan
                            ? "is-invalid"
                            : ""
                        }`}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={3} md={3} lg={9} xl={9}>
                    <Form.Group className="mb-1 mt-1">
                      <Form.Label className="fw-bold">
                        Nomor Permohonan
                      </Form.Label>
                      <Field
                        name="nomorPermohonan"
                        type="text"
                        placeholder="Nomor Permohonan"
                        as={Form.Control}
                        className={`${
                          touched.nomorPermohonan && errors.nomorPermohonan
                            ? "is-invalid"
                            : ""
                        }`}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col sm={6} md={6} lg={12} xl={12}>
                    <Form.Group className="mb-1">
                      <Form.Label className="fw-bold">Satker</Form.Label>
                      <Select
                        name="satker"
                        value={selectedSatker}
                        onChange={(selectedOption: Satker | null) => {
                          setFieldValue(
                            "satker",
                            selectedOption ? selectedOption.kdsatker : ""
                          );
                          setSelectedSatker(selectedOption);
                        }}
                        options={isSearching ? [] : searchResults}
                        onInputChange={(value: string) => handleSearch(value)}
                        isSearchable={true}
                        getOptionValue={(option: Satker) => option.kdsatker}
                        getOptionLabel={(option: Satker) =>
                          `${option.kdsatker} - ${option.nmsatker}`
                        }
                        placeholder="Ketik Kode atau Nama Satker..."
                      />
                      <ErrorMessage
                        name="satker"
                        component="div"
                        className="text-danger"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col sm={3} md={3} lg={3} xl={3}>
                    <Form.Group className="mb-1 mt-1">
                      <Form.Label className="fw-bold">
                        Tanggal Persetujuan
                      </Form.Label>
                      <br />
                      <DatePicker
                        name="tanggalPersetujuan"
                        selected={
                          values.tanggalPersetujuan
                            ? moment(values.tanggalPersetujuan).toDate()
                            : null
                        }
                        onChange={(date: Date | null) => {
                          setFieldValue(
                            "tanggalPersetujuan",
                            date ? moment(date).format("YYYY-MM-DD") : null,
                            true
                          );
                        }}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Tgl Persetujuan "
                        autoComplete="off"
                        timeZone="UTC"
                        className={`form-control ${
                          touched.tanggalPersetujuan &&
                          errors.tanggalPersetujuan
                            ? "is-invalid"
                            : ""
                        }`}
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={3} md={3} lg={9} xl={9}>
                    <Form.Group className="mb-1 mt-1">
                      <Form.Label className="fw-bold">
                        Nomor Persetujuan
                      </Form.Label>
                      <Field
                        name="nomorPersetujuan"
                        onChange={handleChange}
                        type="text"
                        placeholder="Nomor Persetujuan Dispensasi"
                        as={Form.Control}
                        className={`${
                          touched.nomorPersetujuan && errors.nomorPersetujuan
                            ? "is-invalid"
                            : ""
                        }`}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col sm={6} md={6} lg={12} xl={12}>
                    <Form.Group className="mb-1">
                      <Form.Label className="fw-bold">
                        Alasan Dispensasi
                      </Form.Label>
                      {!isAlasan2Visible && (
                        <Field
                          name="alasan"
                          as="select"
                          className={`form-select form-select-md text-select ${
                            touched.alasan && errors.alasan ? "is-invalid" : ""
                          }`}
                          onChange={(
                            e: React.ChangeEvent<HTMLSelectElement>
                          ) => {
                            handleChange(e);
                            handleAlasanChange(e);
                          }}
                        >
                          <option value="">
                            --- Pilih Alasan Dispensasi ---
                          </option>
                          <option value="01">01 - Kendala pada aplikasi</option>
                          <option value="02">
                            02 - Kendala pada pejabat perbendaharaan
                          </option>
                          <option value="03">
                            03 - Kendala pada penyedia barang/jasa
                          </option>
                          <option value="04">
                            04 - Kendala administrasi (dokumen kurang lengkap)
                          </option>
                          <option value="05">
                            05 - Kendala pada revisi DIPA/MP PNBP
                          </option>
                          <option value="06">
                            06 - Kendala jaringan dan listrik
                          </option>
                          <option value="07">07 - Lainnya</option>
                        </Field>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                {isAlasan7Visible && (
                  <Row className="modal-body-animation-enter">
                    <Col sm={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Keterangan</Form.Label>
                        <Field
                          as="textarea"
                          name="alasanLainnya"
                          placeholder="Harus diisi ketika dipilih alasan dispensasi lainnya"
                          rows="3"
                          className={`form-control  ${
                            touched.alasanLainnya && errors.alasanLainnya
                              ? "is-invalid"
                              : ""
                          }`}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                <Button
                  type="submit"
                  variant="danger"
                  className="mt-3 mb-3"
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
                      &nbsp; Loading...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </Form>
            </Container>
          )}
        </Formik>
      </Modal.Body>
    </Modal>
  );
};

export default Rekam;
