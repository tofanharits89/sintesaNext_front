"use client";

import React from "react";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabs";
import { useDNF } from "./use-dnf";
import { FilterTPG, FilterBosBop } from "./components/filters";
import { TableTPG, TableBosBop } from "./components/table";
import { SQLModal } from "./components/sql-modal";

const DNF: React.FC = () => {
  const dnf = useDNF();

  return (
    <div className="dnf-container space-y-4">
      <Tabs value={dnf.activeTab} onValueChange={dnf.setActiveTab} className="w-full gap-4">
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-auto md:h-12 p-1.5 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-0">
            <TabsTrigger 
              value="tpg" 
              className="h-10 md:h-full px-4 text-sm md:text-base flex items-center justify-center whitespace-nowrap"
            >
              TPG (Tunjangan Profesi Guru)
            </TabsTrigger>
            <TabsTrigger 
              value="bos_bop" 
              className="h-10 md:h-full px-4 text-sm md:text-base flex items-center justify-center whitespace-nowrap"
            >
              BOS / BOP (Dana Bantuan Operasional)
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContents>

        <TabsContent value="tpg" className="space-y-4 pt-4">
          <FilterTPG
            selectedYear={dnf.tpgSelectedYear}
            setSelectedYear={dnf.setTpgSelectedYear}
            yearOptions={dnf.tpgYearOptions}
            selectedKanwil={dnf.tpgSelectedkanwil}
            setSelectedKanwil={dnf.setTpgSelectedkanwil}
            kanwilOptions={dnf.tpgkanwilOptions}
            selectedKppn={dnf.tpgSelectedkppn}
            setSelectedKppn={dnf.setTpgSelectedkppn}
            kppnOptions={dnf.tpgkppnOptions}
            selectedPeriode={dnf.tpgSelectedPeriode}
            setSelectedPeriode={dnf.setTpgSelectedPeriode}
            periodeOptions={dnf.tpgPeriodeOptions}
            selectedGelombang={dnf.tpgSelectedGelombang}
            setSelectedGelombang={dnf.setTpgSelectedGelombang}
            gelombangOptions={dnf.tpgGelombangOptions}
            selectedJenisTkd={dnf.tpgSelectedJenisTkd}
            setSelectedJenisTkd={dnf.setTpgSelectedJenisTkd}
            jenisTkdOptions={dnf.tpgJenisTkdOptions}
            startMonth={dnf.tpgStartMonth}
            setStartMonth={dnf.setTpgStartMonth}
            endMonth={dnf.tpgEndMonth}
            setEndMonth={dnf.setTpgEndMonth}
            role={dnf.role}
            onTayang={dnf.handleTayangTpg}
            onShowSQL={dnf.handleShowSQL}
            loading={dnf.tpgLoading}
            onDownloadCSV={dnf.handleDownloadCSV}
            onDownloadExcel={dnf.handleDownloadExcel}
            onDownloadPDF={dnf.handleDownloadPDF}
            onRefresh={dnf.handleRefresh}
          />


          {dnf.tpgShowResults && (
            <TableTPG
              data={dnf.tpgTableData}
              currentPage={dnf.tpgCurrentPage}
              setCurrentPage={dnf.setTpgCurrentPage}
              itemsPerPage={dnf.itemsPerPage}
            />
          )}
        </TabsContent>

        <TabsContent value="bos_bop" className="space-y-4 pt-4">
          <FilterBosBop
            selectedYear={dnf.bosBopSelectedYear}
            setSelectedYear={dnf.setBosBopSelectedYear}
            yearOptions={dnf.bosBopYearOptions}
            selectedKanwil={dnf.bosBopSelectedKanwil}
            setSelectedKanwil={dnf.setBosBopSelectedKanwil}
            kanwilOptions={dnf.bosBopKanwilOptions}
            selectedKppn={dnf.bosBopSelectedKppn}
            setSelectedKppn={dnf.setBosBopSelectedKppn}
            kppnOptions={dnf.bosBopKppnOptions}
            selectedProgram={dnf.bosBopSelectedProgram}
            setSelectedProgram={dnf.setBosBopSelectedProgram}
            programOptions={dnf.bosBopProgramOptions}
            selectedJenisBos={dnf.bosBopSelectedJenisBos}
            setSelectedJenisBos={dnf.setBosBopSelectedJenisBos}
            jenisBosOptions={dnf.bosBopJenisBosOptions}
            selectedJenjang={dnf.bosBopSelectedJenjang}
            setSelectedJenjang={dnf.setBosBopSelectedJenjang}
            jenjangOptions={dnf.bosBopJenjangOptions}
            startMonth={dnf.bosBopStartMonth}
            setStartMonth={dnf.setBosBopStartMonth}
            endMonth={dnf.bosBopEndMonth}
            setEndMonth={dnf.setBosBopEndMonth}
            role={dnf.role}
            onTayang={dnf.handleTayangBosBop}
            onShowSQL={dnf.handleShowSQL}
            loading={dnf.bosBopLoading}
            onDownloadCSV={dnf.handleDownloadCSV}
            onDownloadExcel={dnf.handleDownloadExcel}
            onDownloadPDF={dnf.handleDownloadPDF}
            onRefresh={dnf.handleRefresh}
          />


          {dnf.bosBopShowResults && (
            <TableBosBop
              data={dnf.bosBopTableData}
              currentPage={dnf.bosBopCurrentPage}
              setCurrentPage={dnf.setBosBopCurrentPage}
              itemsPerPage={dnf.itemsPerPage}
            />
          )}
        </TabsContent>
      </TabsContents>
    </Tabs>

      {dnf.showModalSQL && (
        <SQLModal
          sqlQuery={dnf.sqlQuery}
          isCopied={dnf.isCopied}
          onCopy={dnf.handleCopy}
          onClose={dnf.handleCloseSQL}
        />
      )}
    </div>
  );
};

export default DNF;
