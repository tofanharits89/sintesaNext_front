"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Modal, Button, Spinner, Card, Table } from "react-bootstrap";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
// import { io } from "socket.io-client"; // optional: keep commented until needed

interface DetailProps {
  showModal: boolean;
  handleCloseModal: () => void;
  selectedDetail?: string | null;
  token?: string | null;
  id?: string | null;
  bgcolor?: string;
}

interface UnitPenerima {
  NamaEselon3?: string;
  NamaOrganisasi?: string;
  NamaPejabat?: string;
  NipPejabat?: string;
}

interface DispoEs4 {
  UnitPenerima?: UnitPenerima;
}

interface UserPenerima {
  Nama?: string;
  Nip18?: string;
  NamaJabatan?: string;
}

interface DispoStaf {
  UserPenerima: UserPenerima;
}

interface Dispo {
  dispoEs4: DispoEs4[];
  dispoStaf: DispoStaf[];
}

interface KonseptorData {
  Data?: {
    Riwayat?: { Unit?: string }[];
    DataNd?: { Perihal?: string; TglNd?: string; NoNd?: string };
  } | null;
  Konseptor?: any;
}

export default function Detail({
  showModal,
  handleCloseModal,
  selectedDetail,
  token,
  id,
  bgcolor,
}: DetailProps) {
  const [data, setData] = useState<Dispo[] | null | []>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();
  const [loadingKonseptor, setLoadingKonseptor] = useState(false);
  const [konseptorData, setKonseptorData] = useState<KonseptorData | null>(
    null
  );
  const [namaKonseptorDanKasi, setNamaKonseptorDanKasi] = useState<string[]>(
    []
  );
  const [showKonseptorModal, setShowKonseptorModal] = useState(false);

  useEffect(() => {
    if (showModal && selectedDetail) {
      getData();
    }
  }, [showModal, selectedDetail]);

  // Commented socket code for later use - can be enabled if needed
  /*
  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_LOCAL_SOCKET_DANADESA}`);
    socket.on("syncStatus", (data) => {
      setMessage(data.message || "");
    });
    return () => {
      socket.disconnect();
    };
  }, []);
  */

  const NADINE_DETAIL = (process.env.NEXT_PUBLIC_NADINE_DETAIL as string) || "";

  const getData = async () => {
    if (!selectedDetail) return;
    setLoading(true);
    try {
      if (!NADINE_DETAIL) {
        console.error(
          "NADINE_DETAIL env not configured. Please set NEXT_PUBLIC_NADINE_DETAIL to the backend detail endpoint."
        );
        setData([]);
        setLoading(false);
        return;
      }
      const url = `${NADINE_DETAIL}/${selectedDetail}/${token}`;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        mode: "cors",
        headers: { Accept: "application/json" },
      });
      if (response.status === 401) {
        console.warn(
          "Unauthorized request to NADINE detail endpoint; user should login or refresh session."
        );
        setMessage("Unauthorized — silakan login untuk melihat detail");
        setData([]);
        setLoading(false);
        return;
      }
      const result = await response.json();

      if (
        result?.success &&
        Array.isArray(result?.data) &&
        result.data.length > 0
      ) {
        setData(result.data[0]?.dataDisposisi || []);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching detail data:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchKonseptorData = async (notaId?: string | null) => {
    if (!token || !notaId) return;
    setLoadingKonseptor(true);
    try {
      const response = await fetch(
        `https://service.kemenkeu.go.id/nadine-web/gateway/grid/konsepnaskah/DetailKonsepByNdId/${notaId}?tipedata=Konsep`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      setKonseptorData(
        result?.Data ? { Data: result.Data, Konseptor: result.Konseptor } : null
      );

      const uniqueMap = new Map<string, string>();
      result?.Data?.Riwayat?.forEach((item: any) => {
        if (item?.Unit) uniqueMap.set(item.Unit, item.Unit);
      });
      const uniqueFilteredRiwayat = [...uniqueMap.values()];
      setNamaKonseptorDanKasi(uniqueFilteredRiwayat);
    } catch (err) {
      console.error("Error fetching konseptor data:", err);
      setKonseptorData(null);
      setNamaKonseptorDanKasi([]);
    } finally {
      setLoadingKonseptor(false);
    }
  };

  const handleShowKonseptor = () => {
    if (selectedDetail) {
      fetchKonseptorData(selectedDetail);
      setShowKonseptorModal(true);
    }
  };

  const handleCloseKonseptor = () => setShowKonseptorModal(false);

  return (
    <>
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        backdrop="static"
        keyboard={false}
        size="xl"
        animation={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-envelope-fill mx-2 text-success"></i>
            Detail Nota ID : {id}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body
          style={{
            minHeight: "500px",
            overflow: "auto",
            maxHeight: "500px",
            background: bgcolor,
          }}
        >
          {message && (
            <div className="p-3 rounded mb-3 bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
              <div>{message}</div>
              {!user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/login")}
                >
                  Login
                </Button>
              )}
            </div>
          )}

          {loading ? (
            <>
              {message && (
                <p
                  className="p-3 rounded text-center"
                  style={{
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #dee2e6",
                    color: "#495057",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    marginBottom: "1rem",
                  }}
                >
                  {message}
                </p>
              )}

              <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: 300 }}
              >
                <div className="d-flex gap-2">
                  <Spinner animation="grow" variant="primary" />
                  <Spinner animation="grow" variant="success" />
                  <Spinner animation="grow" variant="danger" />
                  <Spinner animation="grow" variant="warning" />
                  <Spinner animation="grow" variant="info" />
                  <Spinner animation="grow" variant="dark" />
                </div>
              </div>
            </>
          ) : data && Array.isArray(data) && data.length > 0 ? (
            <div className="fade-in">
              {data.map((dispo: Dispo, index: number) => (
                <Card
                  key={index}
                  className="mb-3"
                  style={{ boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}
                >
                  <Card.Header
                    className="bg-primary text-white my-2"
                    style={{ padding: 10 }}
                  >
                    <h5>
                      {dispo?.dispoEs4 &&
                      dispo.dispoEs4.length > 0 &&
                      dispo.dispoEs4[0]?.UnitPenerima
                        ? dispo.dispoEs4[0].UnitPenerima?.NamaEselon3
                        : "Data Eselon 3 Tidak Tersedia"}
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div
                      style={{
                        backgroundColor: "#f0f0f0",
                        padding: 5,
                        borderRadius: 5,
                        textAlign: "center",
                        margin: 10,
                      }}
                    >
                      <h6>Eselon 4</h6>
                    </div>
                    <ul>
                      {dispo.dispoEs4.map((es4, es4Index) => (
                        <li key={es4Index}>
                          <strong>Unit : </strong>{" "}
                          {es4.UnitPenerima?.NamaOrganisasi || "Tidak tersedia"}
                          <br />
                          <strong>Nama : </strong>{" "}
                          {es4.UnitPenerima?.NamaPejabat || "Tidak tersedia"}
                          <br />
                          <strong>NIP : </strong>{" "}
                          {es4.UnitPenerima?.NipPejabat || "Tidak tersedia"}
                          <br />
                          -----------------------------------------------------
                        </li>
                      ))}
                    </ul>

                    <div
                      style={{
                        backgroundColor: "#f0f0f0",
                        padding: 5,
                        borderRadius: 5,
                        textAlign: "center",
                        margin: 10,
                      }}
                    >
                      <h6>Pelaksana</h6>
                    </div>

                    <ul>
                      {dispo.dispoStaf.map((staf, stafIndex) => (
                        <li key={stafIndex}>
                          <strong>Nama : </strong> {staf.UserPenerima?.Nama}
                          <br />
                          <strong>NIP : </strong> {staf.UserPenerima?.Nip18}
                          <br />
                          <strong>Jabatan : </strong>{" "}
                          {staf.UserPenerima?.NamaJabatan}
                          <br />
                          -----------------------------------------------------
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <p
              className="text-center text-danger fw-bold"
              style={{ verticalAlign: "middle" }}
            >
              data nota detail Nadine gagal didapatkan...
            </p>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={handleShowKonseptor}>
            Lihat Konseptor
          </Button>
          <Button variant="secondary" onClick={handleCloseModal}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showKonseptorModal}
        onHide={handleCloseKonseptor}
        backdrop="static"
        keyboard={false}
        size="lg"
        animation={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-fill mx-2 text-info"></i>Data Konseptor
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingKonseptor ? (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ height: "200px" }}
            >
              <Spinner animation="border" />
            </div>
          ) : konseptorData ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Perihal</th>
                  <th>Tanggal ND</th>
                  <th>Nomor ND</th>
                </tr>
              </thead>
              <tbody>
                {konseptorData && (
                  <tr>
                    <td>
                      {namaKonseptorDanKasi
                        ? namaKonseptorDanKasi.map((item, idx) => (
                            <div key={idx}>{item}</div>
                          ))
                        : "Tidak tersedia"}
                    </td>
                    <td>
                      {konseptorData?.Data?.DataNd?.Perihal || "Tidak tersedia"}
                    </td>
                    <td>
                      {konseptorData?.Data?.DataNd?.TglNd || "Tidak tersedia"}
                    </td>
                    <td>
                      {konseptorData?.Data?.DataNd?.NoNd || "Tidak tersedia"}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          ) : (
            <p className="text-center text-danger fw-bold">
              Data konseptor tidak tersedia
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseKonseptor}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
