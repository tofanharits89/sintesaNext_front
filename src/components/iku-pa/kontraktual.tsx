"use client";

import React from "react";

const subditGroups = [
  { label: "Subdit PA I", targets: [4, 4, 4, 0] },
  { label: "Subdit PA II", targets: [4, 4, 4, 0] },
  { label: "Subdit PA III", targets: [4, 4, 4, 0] },
  { label: "Subdit PA IV", targets: [4, 4, 4, 0] },
];

const triwulans = ["Tw I", "Tw II", "Tw III", "Tw IV"];

export default function KontraktualContent() {
  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="overflow-x-auto rounded-lg border border-yellow-400">
        <table className="w-full border-collapse text-xs">
          <thead>
            {/* Baris 1: Label Subdit */}
            <tr>
              {subditGroups.map((g, i) => (
                <th
                  key={g.label}
                  colSpan={8}
                  className={`bg-blue-900 text-white font-bold text-center py-2 px-4 ${
                    i < subditGroups.length - 1
                      ? "border-r-2 border-yellow-400"
                      : ""
                  }`}
                >
                  {g.label}
                </th>
              ))}
            </tr>
            {/* Baris 2: Tw + Target per kolom */}
            <tr>
              {subditGroups.map((g, gi) =>
                triwulans.map((tw, ti) => (
                  <React.Fragment key={`${gi}-${ti}`}>
                    <th
                      className={`bg-blue-900 text-white text-center py-1.5 px-3 border border-yellow-400 font-normal whitespace-nowrap min-w-[40px]`}
                    >
                      {tw}
                    </th>
                    <th
                      className={`bg-blue-900 text-white text-center py-1.5 px-3 border border-yellow-400 font-bold min-w-[28px] ${
                        ti === triwulans.length - 1 &&
                        gi < subditGroups.length - 1
                          ? "border-r-2 border-r-yellow-400"
                          : ""
                      }`}
                    >
                      {g.targets[ti]}
                    </th>
                  </React.Fragment>
                )),
              )}
            </tr>
          </thead>
        </table>
      </div>

      {/* Placeholder tabel data */}
      <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
        Tabel data IKI Kontraktual akan tampil di sini.
      </div>
    </div>
  );
}
