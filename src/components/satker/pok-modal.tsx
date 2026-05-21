"use client";

import { useEffect, useRef, useState } from "react";
import { X, ExternalLink, RefreshCw, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPath } from "@/lib/config/base-path";
import * as XLSX from "xlsx";

interface PokModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokUrl: string | null;
  title?: string;
}

export function PokModal({ isOpen, onClose, pokUrl, title = "POK" }: PokModalProps) {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch POK HTML Content
  useEffect(() => {
    if (!isOpen || !pokUrl) {
      setHtmlContent("");
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchHtml = async () => {
      setLoading(true);
      setError(null);
      try {
        const proxyUrl = apiPath(
          `/satker/satudja-proxy?url=${encodeURIComponent(pokUrl)}`,
        );
        const response = await fetch(proxyUrl, { credentials: "include" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const text = await response.text();
        if (isMounted) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "text/html");
          const sectionContent = doc.querySelector("section.content");
          if (sectionContent) {
            // Remove scripts to avoid execution and noise
            sectionContent.querySelectorAll("script").forEach((el) => el.remove());
            setHtmlContent(sectionContent.outerHTML);
          } else {
            // Fallback: look for pvtTable or tableFixHead
            const tableFixHead = doc.querySelector(".tableFixHead") || doc.querySelector("table#pvtTable");
            if (tableFixHead) {
              setHtmlContent(tableFixHead.outerHTML);
            } else {
              setHtmlContent(text);
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Gagal memuat konten POK");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHtml();
    return () => {
      isMounted = false;
    };
  }, [isOpen, pokUrl, refreshTrigger]);

  // Nested Tree Table Accordion Interactivity Handler
  useEffect(() => {
    if (loading || error || !htmlContent || !contentRef.current) return;

    const table = contentRef.current.querySelector("table#pvtTable");
    if (!table) return;

    // Get all rows
    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length === 0) return;

    // Parse levels from class names
    const levels = rows.map((row) => {
      const className = row.className || "";
      const levelMatch = className.match(/level-(\d+)/);
      if (levelMatch && levelMatch[1]) {
        return parseInt(levelMatch[1], 10);
      }
      return 0; // Level 0 (main rows with class 'all row-X')
    });

    // Determine parent indices for each row based on hierarchy
    const parentIndices = new Array(rows.length).fill(-1);
    const lastRowAtLevel: { [key: number]: number } = {};

    for (let i = 0; i < rows.length; i++) {
      const lvl = levels[i] ?? 0;
      lastRowAtLevel[lvl] = i;
      if (lvl > 0) {
        parentIndices[i] = lastRowAtLevel[lvl - 1] !== undefined ? lastRowAtLevel[lvl - 1] : -1;
      }
    }

    // Set attributes and add expand/collapse icons
    rows.forEach((row, i) => {
      row.setAttribute("data-index", String(i));
      row.setAttribute("data-level", String(levels[i] ?? 0));
      row.setAttribute("data-parent-index", String(parentIndices[i] ?? -1));

      const hasChildren = parentIndices.includes(i);
      if (hasChildren) {
        row.classList.add("tree-parent");
        // Detail rows are hidden (collapsed) by default
        row.setAttribute("data-expanded", "false");

        // Insert toggle icon in Uraian column (second cell, or first if only one)
        const cell = row.cells[1] || row.cells[0];
        if (cell && !cell.querySelector(".tree-toggle-icon")) {
          const toggleSpan = document.createElement("span");
          toggleSpan.className = "tree-toggle-icon";
          toggleSpan.innerHTML = "▶";
          toggleSpan.style.marginRight = "8px";
          toggleSpan.style.cursor = "pointer";
          toggleSpan.style.display = "inline-block";
          toggleSpan.style.width = "12px";
          toggleSpan.style.color = "#4a6baf";
          toggleSpan.style.fontWeight = "bold";
          cell.insertBefore(toggleSpan, cell.firstChild);
        }
        row.style.cursor = "pointer";
      }
    });

    // Update visibility of all rows based on state
    const updateVisibility = () => {
      rows.forEach((row, i) => {
        const lvl = levels[i] ?? 0;
        if (lvl === 0) {
          row.style.display = ""; // Always show main level rows
        } else {
          const parentIdx = parentIndices[i] ?? -1;
          let visible = true;
          let currentParentIdx = parentIdx;

          // A row is visible if all its ancestors are expanded
          while (currentParentIdx !== -1 && currentParentIdx !== undefined) {
            const p = rows[currentParentIdx];
            if (!p || p.getAttribute("data-expanded") !== "true") {
              visible = false;
              break;
            }
            currentParentIdx = parseInt(p.getAttribute("data-parent-index") || "-1", 10);
          }

          if (visible) {
            row.style.display = "";
            row.classList.remove("collapse");
          } else {
            row.style.display = "none";
          }
        }

        // Update chevron direction
        if (row.classList.contains("tree-parent")) {
          const icon = row.querySelector(".tree-toggle-icon");
          if (icon) {
            icon.innerHTML = row.getAttribute("data-expanded") === "true" ? "▼" : "▶";
          }
        }
      });
    };

    // Apply initial collapse visibility
    updateVisibility();

    // Click handler for row toggling
    const handleTableClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const tr = target.closest("tr");
      if (tr && tr.classList.contains("tree-parent")) {
        // Prevent toggle if clicking on links or inputs
        if (target.tagName === "A" || target.tagName === "BUTTON") {
          return;
        }

        const isExpanded = tr.getAttribute("data-expanded") === "true";
        tr.setAttribute("data-expanded", isExpanded ? "false" : "true");
        updateVisibility();
      }
    };

    table.addEventListener("click", handleTableClick as EventListener);

    return () => {
      table.removeEventListener("click", handleTableClick as EventListener);
    };
  }, [htmlContent, loading, error]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Export POK HTML table to Excel file
  const handleDownloadExcel = () => {
    const table = contentRef.current?.querySelector("table#pvtTable");
    if (!table) {
      alert("Tabel POK tidak ditemukan");
      return;
    }

    // Clone table to make sure original DOM is unmodified
    const tableCopy = table.cloneNode(true) as HTMLTableElement;

    // Clean up dynamic toggle icons from the spreadsheet columns
    tableCopy.querySelectorAll(".tree-toggle-icon").forEach((el) => {
      el.remove();
    });

    // Make all rows visible for the exported sheet
    tableCopy.querySelectorAll("tr").forEach((row) => {
      row.style.display = "";
    });

    const wb = XLSX.utils.table_to_book(tableCopy, { sheet: "POK" });
    const safeTitle = (title || "POK").replace(/[\\/:*?"<>|]/g, "_");
    XLSX.writeFile(wb, `${safeTitle}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative z-10 flex flex-col w-[95vw] max-w-5xl h-[90vh] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-[#4a6baf] text-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm truncate">{title}</span>
            {pokUrl && (
              <a
                href={pokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
                title="Buka di tab baru"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {htmlContent && !loading && !error && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownloadExcel}
                className="text-white hover:bg-white/20 h-8 w-8"
                title="Unduh Excel (XLSX)"
                aria-label="Unduh Excel"
              >
                <FileSpreadsheet className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8"
              aria-label="Tutup modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-0 bg-white dark:bg-zinc-50">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin text-[#4a6baf]" />
              <p className="text-sm">Memuat konten POK...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-red-600 px-6 text-center">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  setRefreshTrigger((prev) => prev + 1);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          )}

          {!loading && !error && htmlContent && (
            <>
              {/* Premium styling for POK table */}
              <style dangerouslySetInnerHTML={{
                __html: `
                section.content, .content {
                  padding: 0 !important;
                  margin: 0 !important;
                  background: transparent !important;
                }
                .tableFixHead {
                  overflow: auto;
                  max-height: 78vh;
                  position: relative;
                  border: 1px solid #e4e4e7;
                  border-radius: 8px;
                  margin: 8px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                  background: white;
                }
                #pvtTable {
                  border-collapse: separate;
                  border-spacing: 0;
                  width: 100%;
                  font-size: 0.85rem;
                }
                #pvtTable th {
                  position: sticky;
                  top: 0;
                  background-color: #4a6baf !important;
                  color: white !important;
                  font-weight: 600;
                  text-align: center;
                  z-index: 10;
                  box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.1);
                  border-bottom: 2px solid #3b5490;
                }
                #pvtTable th, #pvtTable td {
                  padding: 8px 12px;
                  border-bottom: 1px solid #f4f4f5;
                  border-right: 1px solid #f4f4f5;
                  vertical-align: middle;
                }
                #pvtTable th:last-child, #pvtTable td:last-child {
                  border-right: none;
                }
                #pvtTable tr.all {
                  background-color: #f8fafc;
                  font-weight: 600;
                  color: #1e293b;
                }
                #pvtTable tr.level-1 {
                  background-color: #ffffff;
                  font-weight: 500;
                  color: #334155;
                }
                #pvtTable tr.level-2 {
                  background-color: #ffffff;
                  color: #475569;
                }
                #pvtTable tr.level-3 {
                  background-color: #ffffff;
                  color: #64748b;
                }
                #pvtTable tr:hover {
                  background-color: #f1f5f9 !important;
                }
                /* Right align financial/numeric columns: Volume, Harga Satuan, Jumlah (columns 3, 4, 5) */
                #pvtTable td:nth-child(3),
                #pvtTable td:nth-child(4),
                #pvtTable td:nth-child(5) {
                  text-align: right;
                  font-variant-numeric: tabular-nums;
                }
                /* Left align first column (Kode) and second column (Uraian) */
                #pvtTable td:nth-child(1),
                #pvtTable td:nth-child(2) {
                  text-align: left;
                }
                /* Indentations for Nested Levels */
                #pvtTable tr.level-1 td:nth-child(2) { padding-left: 28px; }
                #pvtTable tr.level-2 td:nth-child(2) { padding-left: 48px; }
                #pvtTable tr.level-3 td:nth-child(2) { padding-left: 68px; }
                #pvtTable tr.level-4 td:nth-child(2) { padding-left: 88px; }
                #pvtTable tr.level-5 td:nth-child(2) { padding-left: 108px; }
                #pvtTable tr.level-6 td:nth-child(2) { padding-left: 128px; }
                
                .tree-toggle-icon {
                  transition: transform 0.15s ease-in-out;
                  font-family: monospace;
                }
              ` }} />
              <div
                ref={contentRef}
                className="pok-content p-4 text-sm"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
