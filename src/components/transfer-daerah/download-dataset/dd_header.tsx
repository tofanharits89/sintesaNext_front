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
    currentPage, setCurrentPage, itemsPerPage, setItemsPerPage,
    showModalSQL, sqlQuery, isCopied,
    handleTayang, handleShowSQL, handleCloseSQL, handleCopy,
    handleDownloadCSV, handleDownloadExcel, handleDownloadPDF,
    handleReset,
  } = useDDHeader();

  return (
    <div className="dak-fisik-container">

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
        onReset={handleReset}
        loadingResults={loadingResults}
        onDownloadCSV={handleDownloadCSV}
        onDownloadExcel={handleDownloadExcel}
        onDownloadPDF={handleDownloadPDF}
      />



      {/* Results Section */}
      <div className="mt-4">
        <DDHeaderTable
          tableData={tableData}
          showResults={showResults}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
        />
      </div>

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
