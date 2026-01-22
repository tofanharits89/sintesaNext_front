import React, { useState, useEffect } from "react";
import { Formik, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";

interface EditDispenProps {
  show: boolean;
  onHide: () => void;
  onUpdate?: () => void;
  setRefresh: (refresh: boolean) => void;
  id: string | number;
  token?: string;
  username?: string;
}

interface DispenData {
  id?: string | number;
  kddept: string;
  kdunit: string;
  target: number | string;
  dispensasi_blokir: number | string;
  blokir_7: number | string;
  blokir_A: number | string;
  deviasi: number | string;
}

const EditDispen: React.FC<EditDispenProps> = ({
  show,
  onHide,
  onUpdate,
  setRefresh,
  id,
  token = "",
  username = "",
}) => {
  const [data, setData] = useState<DispenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<DispenData>({
    kddept: "",
    kdunit: "",
    target: "",
    dispensasi_blokir: "",
    blokir_7: "",
    blokir_A: "",
    deviasi: "",
    id: id,
  });

  useEffect(() => {
    if (show && id) {
      getData();
    }
  }, [id, show]);

  useEffect(() => {
    if (data.length > 0) {
      const dispensasiData = data[0];
      if (dispensasiData) {
        setInitialValues({
          kddept: dispensasiData.kddept,
          kdunit: dispensasiData.kdunit,
          target: dispensasiData.target,
          dispensasi_blokir: dispensasiData.dispensasi_blokir,
          blokir_7: dispensasiData.blokir_7,
          blokir_A: dispensasiData.blokir_A,
          deviasi: dispensasiData.deviasi,
          id: id,
        });
      }
    }
  }, [data, id]);

  const getData = async () => {
    setLoading(true);

    const encodedQuery = encodeURIComponent(
      `SELECT a.id, a.kddept, a.kdunit, SUM(a.target) as target_blokir, sum(a.dispensasi_blokir) as dispensasi_blokir, SUM(a.blokir_7 + a.blokir_A) as sudah_blokir, SUM(a.target) - SUM(a.dispensasi_blokir) - SUM(a.blokir_7 + a.blokir_A) AS sisa
    FROM laporan_2023.target_blokir_perjadin a WHERE a.id=${id} GROUP BY a.id, a.kddept, a.kdunit`,
    );

    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const encryptedQuery = btoa(cleanedQuery);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BLOKIR_SATKER}/${encryptedQuery}${
        username ? `&user=${username}` : ""
      }`;

      if (!apiUrl || !process.env.NEXT_PUBLIC_API_BLOKIR_SATKER) {
        toast.error("API URL tidak terkonfigurasi");
        setLoading(false);
        return;
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result || []);
    } catch (error) {
      console.log(error);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitdata = async (
    values: DispenData,
    { setSubmitting }: any,
  ) => {
    setLoading(true);

    if (!process.env.NEXT_PUBLIC_API_BLOKIR_UPDATE_DISPEN) {
      toast.error("API URL tidak terkonfigurasi");
      setLoading(false);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_BLOKIR_UPDATE_DISPEN,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(values),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Data Berhasil Diubah");
      setRefresh(true);
      if (onUpdate) onUpdate();
      onHide();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const validationSchema = Yup.object().shape({
    dispensasi_blokir: Yup.number()
      .nullable()
      .typeError("Harus berupa angka")
      .min(0, "Harus berupa angka non-negatif atau nol")
      .integer("Harus berupa angka bulat")
      .required("Harus diisi"),
  });

  const tutupModal = () => {
    if (onUpdate) {
      onUpdate();
    }
    onHide();
  };

  if (!show) return null;

  return (
    <div
      style={{
        display: "flex",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1050,
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
      onClick={tutupModal}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          width: "90%",
          maxWidth: "1140px",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1rem",
            borderBottom: "1px solid #dee2e6",
            borderTopLeftRadius: "calc(0.3rem - 1px)",
            borderTopRightRadius: "calc(0.3rem - 1px)",
          }}
        >
          <h5 style={{ margin: 0, fontSize: "20px", fontWeight: 500 }}>
            <i
              className="bi bi-back"
              style={{
                marginRight: "1rem",
                marginLeft: "1rem",
                color: "#198754",
              }}
            ></i>
            Rekam Dispensasi Blokir
          </h5>
          <button
            type="button"
            style={{
              boxSizing: "content-box",
              width: "1em",
              height: "1em",
              padding: "0.25em 0.25em",
              color: "#000",
              background:
                "transparent url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/%3e%3c/svg%3e\") center/1em auto no-repeat",
              border: 0,
              borderRadius: "0.25rem",
              opacity: 0.5,
              cursor: "pointer",
            }}
            aria-label="Close"
            onClick={tutupModal}
          ></button>
        </div>

        <div
          style={{ position: "relative", flex: "1 1 auto", padding: "1rem" }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              wordWrap: "break-word",
              backgroundColor: "#fff",
              backgroundClip: "border-box",
              border: "1px solid rgba(0,0,0,.125)",
              borderRadius: "0.25rem",
            }}
          >
            <div style={{ flex: "1 1 auto", padding: "1.5rem 1.5rem" }}>
              <Formik
                validationSchema={validationSchema}
                onSubmit={handleSubmitdata}
                enableReinitialize={true}
                initialValues={initialValues}
              >
                {({ handleSubmit, handleChange, values }) => (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3" style={{ position: "relative" }}>
                      <div
                        className="form-floating"
                        style={{ position: "relative" }}
                      >
                        <input
                          type="number"
                          name="dispensasi_blokir"
                          value={values.dispensasi_blokir}
                          onChange={handleChange}
                          placeholder="Nilai Dispensasi"
                          className="form-control"
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "1rem 0.75rem",
                            fontSize: "1rem",
                            fontWeight: 400,
                            lineHeight: 1.5,
                            color: "#212529",
                            backgroundColor: "#fff",
                            backgroundClip: "padding-box",
                            border: "1px solid #ced4da",
                            appearance: "none",
                            borderRadius: "0.25rem",
                            transition:
                              "border-color .15s ease-in-out,box-shadow .15s ease-in-out",
                            height: "calc(3.5rem + 2px)",
                          }}
                          id="floatingInput"
                        />
                        <label
                          htmlFor="floatingInput"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            padding: "1rem 0.75rem",
                            pointerEvents: "none",
                            border: "1px solid transparent",
                            transformOrigin: "0 0",
                            transition:
                              "opacity .1s ease-in-out,transform .1s ease-in-out",
                            opacity: 0.65,
                            transform: values.dispensasi_blokir
                              ? "scale(.85) translateY(-0.5rem) translateX(0.15rem)"
                              : "scale(1)",
                          }}
                        >
                          Nilai Dispensasi
                        </label>
                      </div>
                      <ErrorMessage name="dispensasi_blokir">
                        {(msg) => (
                          <div
                            className="text-danger"
                            style={{
                              width: "100%",
                              marginTop: "0.25rem",
                              fontSize: "0.875em",
                              color: "#dc3545",
                            }}
                          >
                            {msg}
                          </div>
                        )}
                      </ErrorMessage>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "1.5rem",
                        marginBottom: "1.5rem",
                        alignItems: "flex-end", // align-items-bottom -> flex-end
                      }}
                    >
                      <hr style={{ width: "100%", visibility: "hidden" }} />
                      <div>
                        <button
                          type="submit"
                          disabled={loading}
                          style={{
                            display: "inline-block",
                            fontWeight: 400,
                            lineHeight: 1.5,
                            color: "#fff",
                            textAlign: "center",
                            textDecoration: "none",
                            verticalAlign: "middle",
                            cursor: loading ? "default" : "pointer",
                            userSelect: "none",
                            backgroundColor: "#dc3545",
                            borderColor: "#dc3545",
                            border: "1px solid transparent",
                            padding: "0.375rem 0.75rem",
                            fontSize: "1rem",
                            borderRadius: "0.25rem",
                            transition:
                              "color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out",
                            opacity: loading ? 0.65 : 1,
                          }}
                        >
                          {loading ? (
                            <>
                              <span
                                style={{
                                  display: "inline-block",
                                  width: "1rem",
                                  height: "1rem",
                                  verticalAlign: "-0.125em",
                                  border: "0.2em solid currentColor",
                                  borderRightColor: "transparent",
                                  borderRadius: "50%",
                                  animation:
                                    "spinner-border .75s linear infinite",
                                  marginRight: "0.5rem",
                                }}
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Loading...
                            </>
                          ) : (
                            "Simpan"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={tutupModal}
                          style={{
                            display: "inline-block",
                            fontWeight: 400,
                            lineHeight: 1.5,
                            color: "#fff",
                            textAlign: "center",
                            textDecoration: "none",
                            verticalAlign: "middle",
                            cursor: "pointer",
                            userSelect: "none",
                            backgroundColor: "#6c757d",
                            borderColor: "#6c757d",
                            border: "1px solid transparent",
                            padding: "0.375rem 0.75rem",
                            fontSize: "1rem",
                            borderRadius: "0.25rem",
                            transition:
                              "color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out",
                            marginLeft: "0.5rem",
                          }}
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spinner-border {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EditDispen;
