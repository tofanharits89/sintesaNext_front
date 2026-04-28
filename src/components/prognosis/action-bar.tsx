import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  RefreshCcw,
  Database,
  MessageCircle,
  Save,
  Loader2,
  FileSpreadsheet,
  FileText,
  FileJson,
} from "lucide-react";

interface PrognosisActionBarProps {
  loadingResults: boolean;
  handleTayang: () => void;
  handleRefresh: () => void;
  setShowModalSQL: (val: boolean) => void;
  role: string | undefined;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
}

export const PrognosisActionBar = ({
  loadingResults,
  handleTayang,
  handleRefresh,
  setShowModalSQL,
  role,
  onDownloadCSV,
  onDownloadExcel,
  onDownloadPDF,
}: PrognosisActionBarProps) => {
  return (
    <div className="bg-card border p-4 rounded-xl flex flex-wrap items-center gap-3 shadow-sm">
      <Button
        onClick={handleTayang}
        disabled={loadingResults}
        className="font-bold px-6"
      >
        {loadingResults ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang Memproses
          </>
        ) : (
          "Tayang"
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Download
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="cursor-pointer" onClick={onDownloadCSV}>
            <FileText className="mr-2 h-4 w-4 text-orange-600" /> CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={onDownloadExcel}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> EXCEL
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={onDownloadPDF}>
            <FileJson className="mr-2 h-4 w-4 text-red-600" /> PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="icon"
        onClick={handleRefresh}
        title="Refresh Halaman"
      >
        <RefreshCcw className="h-4 w-4" />
      </Button>

      {(role === "super_admin" || role === "X") && (
        <Button variant="outline" onClick={() => setShowModalSQL(true)}>
          <Database className="mr-2 h-4 w-4" /> SQL
        </Button>
      )}

      <div className="flex-1" />

      <Button variant="ghost" size="icon">
        <MessageCircle className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon">
        <Save className="h-5 w-5" />
      </Button>
    </div>
  );
};
