export const formatCurrency = (value: number): string => {
  if (value >= 1000000000000) {
    const trillionValue = (value / 1000000000000).toFixed(1);
    return `Rp ${parseFloat(trillionValue).toLocaleString("id-ID")} T`;
  }
  if (value >= 1000000000) {
    const millionValue = (value / 1000000000).toFixed(1);
    return `Rp ${parseFloat(millionValue).toLocaleString("id-ID")} M`;
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
};

export const formatChartCurrency = (value: number): string => {
  if (value >= 1000000000000) {
    return `${(value / 1000000000000).toFixed(1)}T`;
  }
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}M`;
  }
  return value.toLocaleString("id-ID");
};
