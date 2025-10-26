import { useState } from "react";

export const useDashboardFilters = () => {
  const [selectedKanwil, setSelectedKanwil] = useState<string>("semua");
  const [lastRefreshText, setLastRefreshText] = useState<string>("-");

  const handleKanwilChange = (value: string) => {
    setSelectedKanwil(value);
  };

  const updateLastRefreshText = (date: string | undefined) => {
    setLastRefreshText(date || "-");
  };

  return {
    selectedKanwil,
    setSelectedKanwil,
    lastRefreshText,
    setLastRefreshText: updateLastRefreshText,
    handleKanwilChange,
  };
};
