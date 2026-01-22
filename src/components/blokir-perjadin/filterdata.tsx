import React, { useState, useEffect } from "react";
import Kddept from "../../data/kddept.json";

interface FilterDataProps {
  show: boolean;
  onHide: () => void;
  onFilter: (filterData: any) => void;
  role?: string;
  kdkanwil?: string;
  kdkppn?: string;
}

const FilterData: React.FC<FilterDataProps> = ({
  show,
  onHide,
  onFilter,
  role = "",
  kdkanwil = "",
  kdkppn = "",
}) => {
  const [selectedKementerian, setSelectedKementerian] = useState("00");
  const [tahun, setTahun] = useState<string | number>("");

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setTahun(currentYear);
  }, []);

  const handleClose = () => {
    onHide();
  };

  const handleFilter = () => {
    const filterData = {
      selectedKementerian,
      tahun,
    };

    onFilter(filterData);
    onHide();
  };

  const resetFilter = () => {
    setSelectedKementerian("00");

    const filterData = {
      selectedKementerian: "00",
      tahun: "",
    };

    onFilter(filterData);
    onHide();
  };

  if (!show) return null;

  return (
    <div
      style={{
        display: "flex", // Modal overlay always visible if show is true due to prior return null
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1050,
        justifyContent: "center",
        alignItems: "center", // Was implicitly centered by flex
        padding: "20px",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "0.5rem", // increased border radius
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "1140px", // xl size equivalent
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
          }}
        >
          <h5 style={{ margin: 0, fontSize: "17px", fontWeight: "bold" }}>
            <i
              className="bi bi-grid-3x3-gap-fill text-primary fw-bold mx-2 "
              style={{ color: "#0d6efd" }}
            ></i>
            Filter Data
          </h5>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              lineHeight: 1,
              color: "#000",
              opacity: 0.5,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span>&times;</span>
          </button>
        </div>

        <div style={{ padding: "1rem", overflowY: "auto" }}>
          <form>
            <div className="mb-3 row">
              <label
                htmlFor="kementerianSelect"
                className="col-sm-6 col-md-6 col-lg-4 col-xl-4 col-form-label text-dark"
                style={{ fontWeight: 500 }}
              >
                Kementerian
              </label>
              <div className="col-sm-6 col-md-6 col-lg-8 col-xl-8">
                <select
                  id="kementerianSelect"
                  className="form-select"
                  value={selectedKementerian}
                  onChange={(e) => setSelectedKementerian(e.target.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.375rem 2.25rem 0.375rem 0.75rem",
                    fontSize: "1rem",
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: "#212529",
                    backgroundColor: "#fff",
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "16px 12px",
                    border: "1px solid #ced4da",
                    borderRadius: "0.25rem",
                    appearance: "none",
                  }}
                >
                  <option value="00">Semua Kementerian</option>
                  {Kddept.map((dept: any, index: number) => (
                    <option key={index} value={dept.kddept}>
                      {dept.kddept} - {dept.nmdept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "0.75rem",
            borderTop: "1px solid #dee2e6",
            gap: "0.5rem",
          }}
        >
          <button
            type="button"
            onClick={handleFilter}
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "0.875rem",
              borderRadius: "0.2rem",
              color: "#fff",
              backgroundColor: "#dc3545",
              borderColor: "#dc3545",
              border: "1px solid transparent",
              cursor: "pointer",
              transition:
                "color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out",
            }}
          >
            Terapkan Filter
          </button>
          <button
            type="button"
            onClick={resetFilter}
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "0.875rem",
              borderRadius: "0.2rem",
              color: "#fff",
              backgroundColor: "#6c757d",
              borderColor: "#6c757d",
              border: "1px solid transparent",
              cursor: "pointer",
              transition:
                "color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out",
            }}
          >
            Reset Filter
          </button>
        </div>
      </div>
      <style>{`
        .row {
            display: flex;
            flex-wrap: wrap;
            margin-top: 0;
            margin-right: calc(-.5 * var(--bs-gutter-x));
            margin-left: calc(-.5 * var(--bs-gutter-x));
        }
        .col-sm-6 {
            flex: 0 0 auto;
            width: 50%;
        }
        .col-md-6 {
            flex: 0 0 auto;
            width: 50%;
        }
        .col-lg-4 {
            flex: 0 0 auto;
            width: 33.33333333%;
        }
        .col-xl-4 {
            flex: 0 0 auto;
            width: 33.33333333%;
        }
        .col-lg-8 {
            flex: 0 0 auto;
            width: 66.66666667%;
        }
        .col-xl-8 {
            flex: 0 0 auto;
            width: 66.66666667%;
        }
        .col-form-label {
            padding-top: calc(.375rem + 1px);
            padding-bottom: calc(.375rem + 1px);
            margin-bottom: 0;
            font-size: inherit;
            line-height: 1.5;
        }
        .mb-3 {
            margin-bottom: 1rem !important;
        }
        
        @media (min-width: 576px) {
            .col-sm-6 {
                width: 50%;
            }
        }
        @media (min-width: 768px) {
            .col-md-6 {
                width: 50%;
            }
        }
        @media (min-width: 992px) { 
            .col-lg-4 {
                width: 33.33333333%;
            }
            .col-lg-8 {
                width: 66.66666667%;
            }
        }
        @media (min-width: 1200px) {
            .col-xl-4 {
                width: 33.33333333%;
            }
            .col-xl-8 {
                width: 66.66666667%;
            }
        }
      `}</style>
    </div>
  );
};

export default FilterData;
