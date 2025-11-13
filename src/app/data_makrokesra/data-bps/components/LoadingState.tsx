"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoadingStateProps {
  pulseInterval?: number;
}

export function LoadingState({ pulseInterval = 600 }: LoadingStateProps) {
  const [localPulse, setLocalPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalPulse(prev => !prev);
    }, pulseInterval);

    return () => clearInterval(interval);
  }, [pulseInterval]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Memuat Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <div className="text-muted-foreground">
            Memuat data, mohon tunggu...
          </div>
        </div>

        <div className="overflow-x-auto max-w-full mt-3">
          <div className="w-full border-collapse">
            <div className="table-header-group">
              <div className="table-row">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`table-cell p-2.5 h-5 border-b border-gray-200 transition-all duration-300 ${
                      localPulse ? "bg-gray-200" : "bg-gray-50"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="table-row-group">
              {Array.from({ length: 5 }).map((_, r) => (
                <div key={r} className="table-row">
                  {Array.from({ length: 6 }).map((__, c) => (
                    <div
                      key={c}
                      className={`table-cell p-2 h-7 border-b border-gray-100 transition-all duration-300 ${
                        localPulse ? "bg-gray-100" : "bg-gray-50"
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}