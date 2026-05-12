export const transformRealisasiPerJenisBelanja = (data: any) => {
  if (!data?.categories || !data?.series) return [];
  
  return data.categories.map((category: string, index: number) => {
    const pagu = data.series.find((s: any) => s.name === "Pagu DIPA")?.data[index] || 0;
    const realisasi = data.series.find((s: any) => s.name === "Realisasi")?.data[index] || 0;
    const sisaPagu = Math.max(0, pagu - realisasi);
    return {
      name: category,
      "Pagu DIPA": pagu,
      Realisasi: realisasi,
      "Sisa Pagu": sisaPagu,
    };
  });
};

export const transformKLPaguTerbesar = (data: any) => {
  if (!Array.isArray(data)) return [];
  
  return data.map((item: any) => {
    const sisaPagu = Math.max(0, item.pagu_dipa - item.realisasi);
    return {
      name: item.nama_kementerian,
      "Pagu DIPA": item.pagu_dipa,
      Realisasi: item.realisasi,
      "Sisa Pagu": sisaPagu,
    };
  });
};

export const transformKLPaguProgramTerbesar = (data: any) => {
  if (!Array.isArray(data)) return [];
  
  return data.map((item: any) => {
    const sisaPagu = Math.max(0, item.pagu_dipa - item.realisasi);
    return {
      name: item.nama_program,
      "Pagu DIPA": item.pagu_dipa,
      Realisasi: item.realisasi,
      "Sisa Pagu": sisaPagu,
    };
  });
};

export const transformTrenRealisasiBulanan = (data: any) => {
  if (!data?.categories || !data?.series) return [];
  
  return data.categories.map((category: string, index: number) => {
    const dataPoint: any = { name: category };
    data.series.forEach((serie: any) => {
      dataPoint[serie.name] = serie.data[index] || 0;
    });
    return dataPoint;
  });
};

export const transformRealisasiKLPerFungsi = (data: any) => {
  if (!data?.categories || !data?.series) return [];
  
  return data.categories.map((category: string, index: number) => {
    const paguSeries = data.series.find((s: any) => s.name === "Pagu DIPA");
    const realisasiSeries = data.series.find((s: any) => s.name === "Realisasi");
    const pagu = paguSeries?.data[index] || 0;
    const realisasi = realisasiSeries?.data[index] || 0;
    const sisaPagu = Math.max(0, pagu - realisasi);
    return {
      name: category,
      "Pagu DIPA": pagu,
      Realisasi: realisasi,
      "Sisa Pagu": sisaPagu,
    };
  });
};

export const transformPersentaseKL = (data: any) => {
  if (!Array.isArray(data)) return [];
  
  return data.map((item: any) => ({
    name: item.kode_ba,
    value: item.persentase,
    kode_ba: item.kode_ba,
    nama_ba: item.nama_ba,
  }));
};

export const getTrenRealisasiLines = (data: any) => {
  if (!data?.series) return [];
  
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"] as const;
  
  return data.series.map((serie: any, index: number) => {
    const stroke: string = colors[index % colors.length] ?? "#3b82f6";
    return { dataKey: serie.name, stroke, name: serie.name };
  });
};
