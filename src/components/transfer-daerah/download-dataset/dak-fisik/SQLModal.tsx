import { X } from "lucide-react";
import React, { useState } from "react";

interface SQLModalProps {
  isOpen: boolean;
  onClose: () => void;
  sqlQuery: string;
}

export const SQLModal: React.FC<SQLModalProps> = ({
  isOpen,
  onClose,
  sqlQuery,
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlQuery);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="rounded-xl w-full max-w-3xl mx-4 shadow-2xl overflow-hidden">
        <div
          className="flex justify-between items-center px-6 py-4"
          style={{ backgroundColor: "#334155" }}
        >
          <h5 className="text-white font-semibold m-0">SQL Query</h5>
          <button
            onClick={onClose}
            className="text-white hover:text-zinc-300 text-xl leading-none bg-transparent border-0"
          >
            ✕
          </button>
        </div>
        <div className="p-6" style={{ backgroundColor: "#1e293b" }}>
          <button
            className="btn btn-secondary btn-sm mb-3"
            onClick={handleCopy}
          >
            {isCopied ? "Copied!" : "Copy to Clipboard"}
          </button>
          <pre
            className="rounded-md p-4 overflow-auto text-sm"
            style={{
              backgroundColor: "#0f172a",
              color: "#10b981",
              maxHeight: "300px",
            }}
          >
            {sqlQuery}
          </pre>
        </div>
        <div
          className="flex justify-end px-6 py-4"
          style={{ backgroundColor: "#334155" }}
        >
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            <X className="h-4 w-4 mr-1.5" /> Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
