"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useDDHeader } from "./dd-header/useDDHeader";
import { DDHeaderFilters } from "./dd-header/DDHeaderFilters";
import { DDHeaderTable } from "./dd-header/DDHeaderTable";
import { SQLModal } from "./dd-header/SQLModal";

const DD_header: React.FC = () => {
  const {
    role,
    selectedYear, setSelectedYear,
    selectedkanwil, setSelectedkanwil,
    selectedkppn, setSelectedkppn,
    selectedLokasi, setSelectedLokasi,
    startMonth, setStartMonth,
    endMonth, setEndMonth,
    yearOptions, kanwilOptions, kppnOptions, lokasiOptions,
    tableData, showResults, loadingResults,
    currentPage, setCurrentPage, itemsPerPage,
    showModalSQL, sqlQuery, isCopied,
    handleTayang, handleShowSQL, handleCloseSQL, handleCopy, handleRefresh,
    handleDownloadCSV, handleDownloadExcel, handleDownloadPDF,
  } = useDDHeader();

  return (
    <div className="dak-fisik-container">
      <div className="mb-4">
        <h3 className="mb-3 font-semibold text-lg">Dana Desa</h3>
      </div>

      {/* Filter Section */}
      <DDHeaderFilters
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        yearOptions={yearOptions}
        selectedkanwil={selectedkanwil}
        setSelectedkanwil={setSelectedkanwil}
        kanwilOptions={kanwilOptions}
        selectedkppn={selectedkppn}
        setSelectedkppn={setSelectedkppn}
        kppnOptions={kppnOptions}
        selectedLokasi={selectedLokasi}
        setSelectedLokasi={setSelectedLokasi}
        lokasiOptions={lokasiOptions}
        startMonth={startMonth}
        setStartMonth={setStartMonth}
        endMonth={endMonth}
        setEndMonth={setEndMonth}
        role={role}
        onTayang={handleTayang}
        onShowSQL={handleShowSQL}
        loadingResults={loadingResults}
        onDownloadCSV={handleDownloadCSV}
        onDownloadExcel={handleDownloadExcel}
        onDownloadPDF={handleDownloadPDF}
        onRefresh={handleRefresh}
      />


      {/* Results Section */}
      {showResults && (
        <DDHeaderTable
          tableData={tableData}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* SQL Modal */}
      <SQLModal
        isOpen={showModalSQL}
        onClose={handleCloseSQL}
        sqlQuery={sqlQuery}
        isCopied={isCopied}
        onCopy={handleCopy}
      />
    </div>
  );
};

export default DD_header;
