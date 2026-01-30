import { useState } from "react";

export const useDashboardFilters = () => {
  const [selectedKanwil, setSelectedKanwil] = useState<string>("semua");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [lastRefreshText, setLastRefreshText] = useState<string>("-");

  const handleKanwilChange = (value: string) => {
    setSelectedKanwil(value);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
  };

  const updateLastRefreshText = (date: string | undefined) => {
    setLastRefreshText(date || "-");
  };

  return {
    selectedKanwil,
    setSelectedKanwil,
    selectedYear,
    setSelectedYear,
    lastRefreshText,
    setLastRefreshText: updateLastRefreshText,
    handleKanwilChange,
    handleYearChange,
  };
};
