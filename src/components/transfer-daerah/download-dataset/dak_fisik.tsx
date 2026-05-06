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
  handleDownloadPDF as handleDownloadPDFAction,
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
    handleDownloadPDFAction(results.tableData, filters.selectedYear);
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
        hasData={results.tableData.length > 0}

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
          loadingResults={results.loadingResults}
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
