"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useDakFisik } from "./dak-fisik/useDakFisik";
import { DakFisikFilters } from "./dak-fisik/DakFisikFilters";
import { DakFisikTable } from "./dak-fisik/DakFisikTable";
import { SQLModal } from "./dak-fisik/SQLModal";
import {
  SwalConfig,
  convertTableDataToCSV,
  convertTableDataToPDF,
  handleDownloadExcel,
} from "./dak-fisik/utils";

const DakFisik: React.FC = () => {
  const {
    role,
    filters,
    results,
    sql,
    actions,
  } = useDakFisik();


  const handleDownloadCSV = async () => {
    if (results.tableData.length === 0) {
      SwalConfig.fire({
        icon: "warning",
        title: "Tidak ada data",
        text: "Silakan tayang data terlebih dahulu",
      });
      return;
    }

    const csv = convertTableDataToCSV(results.tableData);
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv),
    );
    element.setAttribute("download", `dak_fisik_${filters.selectedYear}.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadPDF = async () => {
    if (results.tableData.length === 0) {
      SwalConfig.fire({
        icon: "warning",
        title: "Tidak ada data",
        text: "Silakan tayang data terlebih dahulu",
      });
      return;
    }

    const html = convertTableDataToPDF(results.tableData, filters.selectedYear);
    const element = document.createElement("div");
    element.innerHTML = html;
    element.style.display = "none";
    document.body.appendChild(element);

    window.print();
    document.body.removeChild(element);
  };

  return (
    <div className="dak-fisik-container">

      {/* Filter Section */}
      <DakFisikFilters
        {...filters}
        role={role}
        onTayang={actions.handleTayang}
        onShowSQL={actions.handleShowSQL}
        onReset={actions.handleReset}
        loadingResults={results.loadingResults}

        onDownloadCSV={handleDownloadCSV}
        onDownloadExcel={() => handleDownloadExcel(results.tableData, filters.selectedYear)}
        onDownloadPDF={handleDownloadPDF}
      />


      {/* Results Section */}
      <div className="mt-4">
        <DakFisikTable
          tableData={results.tableData}
          showResults={results.showResults}
          currentPage={results.currentPage}
          setCurrentPage={results.setCurrentPage}
          itemsPerPage={results.itemsPerPage}
          setItemsPerPage={results.setItemsPerPage}
        />
      </div>

      {/* SQL Modal */}
      <SQLModal
        isOpen={sql.showModalSQL}
        onClose={() => sql.setShowModalSQL(false)}
        sqlQuery={sql.sqlQuery}
      />
    </div>
  );
};

export default DakFisik;
