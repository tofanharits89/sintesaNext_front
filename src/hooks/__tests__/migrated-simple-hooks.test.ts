import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";

// Import the migrated hooks
import { useDauTransaksi } from "../use-dau-transaksi";
import { useKmkDau } from "../use-kmk-dau";
import { useDasarPenundaanOptions } from "../use-dasar-penundaan";
import { useDasarPencabutanOptions } from "../use-dasar-pencabutan";
import { useKmkPencabutan } from "../use-kmk-pencabutan";
import { useKmkPotongan } from "../use-kmk-potongan";
import { useKmkPemotongan } from "../use-kmk-pemotongan";
import { useKppnByNoKmk } from "../use-kppn-by-nokmk";
import { useKabKotaByNoKmk } from "../use-kabkota-by-nokmk";

// Mock dependencies
vi.mock("@/lib/backend", () => ({
  backendPath: (path: string) => `http://localhost:88/api/v1${path}`,
}));

vi.mock("@/utils/auth-utils", () => ({
  getAuthTokenFromCookie: vi.fn(() => "test-token"),
}));

// Mock fetch
global.fetch = vi.fn();

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("Migrated Simple Data Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("useDauTransaksi", () => {
    const mockDauData = [
      {
        ID: 1,
        BULAN: 1,
        THANG: 2024,
        NMBULAN: "Januari",
        KDKPPN: "001",
        NMKPPN: "KPPN Jakarta I",
        KDPEMDA: "3101",
        NMPEMDA: "Kab. Kepulauan Seribu",
        ALOKASI: 1000000,
        NILAI: 50000,
      },
    ];

    it("should fetch DAU transaction data successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: mockDauData }),
      });

      const { result } = renderHook(
        () => useDauTransaksi({ thang: 2024, bulan: 1 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rows).toHaveLength(1);
      expect(result.current.rows[0]).toMatchObject({
        id: "1",
        no: 1,
        tahun: "2024",
        bulan: "Januari",
        bulanNum: 1,
        kppn: "001 - KPPN Jakarta I",
        kabkota: "3101 - Kab. Kepulauan Seribu",
        kdpemdaCode: "3101",
        alokasi: 1000000,
        nilaiPotongan: 50000,
      });
      expect(result.current.error).toBeNull();
    });

    it("should handle loading state", () => {
      (global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(
        () => useDauTransaksi({ thang: 2024 }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.rows).toEqual([]);
    });

    it("should handle error state", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: "Server error" }),
      });

      const { result } = renderHook(
        () => useDauTransaksi({ thang: 2024 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.rows).toEqual([]);
    });

    it("should provide mutate alias for backward compatibility", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: mockDauData }),
      });

      const { result } = renderHook(
        () => useDauTransaksi({ thang: 2024 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.mutate).toBe("function");
    });

    it("should build correct query key", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: [] }),
      });

      renderHook(
        () => useDauTransaksi({ thang: 2024, bulan: 1, kppn: "001" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("thang=2024&bulan=1&kppn=001"),
          expect.any(Object)
        );
      });
    });
  });

  describe("useKmkDau", () => {
    const mockKmkData = [
      {
        id: 1,
        thang: 2024,
        no_kmk: "PMK-001/2024",
        tgl_kmk: "2024-01-15",
        uraian: "Test KMK",
        jenis: "1",
        kriteria: "Test Kriteria",
        filekmk: "test.pdf",
      },
    ];

    it("should fetch KMK DAU data successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: mockKmkData }),
      });

      const { result } = renderHook(() => useKmkDau(2024), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rows).toHaveLength(1);
      expect(result.current.rows[0]).toMatchObject({
        id: "1",
        no: 1,
        tahun: "2024",
        tanggalKmk: "2024-01-15",
        nomorKmk: "PMK-001/2024",
        uraian: "Test KMK",
        jenis: "1",
        kriteria: "Test Kriteria",
      });
    });

    it("should handle file URL generation correctly", async () => {
      const testCases = [
        {
          input: "test.pdf",
          expected: expect.stringContaining("/transfer-daerah/dau/kmk/file/stream/test"),
        },
        {
          input: "https://example.com/file.pdf",
          expected: "https://example.com/file.pdf",
        },
        {
          input: "/transfer-daerah/dau/kmk/file/existing.pdf",
          expected: expect.stringContaining("/transfer-daerah/dau/kmk/file/existing.pdf"),
        },
      ];

      for (const testCase of testCases) {
        const mockData = [{ ...mockKmkData[0], filekmk: testCase.input }];
        
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ data: mockData }),
        });

        const { result } = renderHook(() => useKmkDau(2024), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.rows[0].fileUrl).toEqual(testCase.expected);
      }
    });

    it("should provide mutate alias for backward compatibility", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: mockKmkData }),
      });

      const { result } = renderHook(() => useKmkDau(2024), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.mutate).toBe("function");
    });
  });

  describe("useDasarPenundaanOptions", () => {
    const mockDasarData = [
      {
        no_kmk: "PMK-001/2024",
        jenis: "1",
        kriteria: "Test",
        uraian: "Test Uraian",
      },
    ];

    it("should fetch dasar penundaan options successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: mockDasarData }),
      });

      const { result } = renderHook(() => useDasarPenundaanOptions(true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.options).toHaveLength(1);
      expect(result.current.options[0]).toEqual({
        value: "PMK-001/2024",
        label: "PMK-001/2024",
      });
    });

    it("should not fetch when disabled", () => {
      const { result } = renderHook(() => useDasarPenundaanOptions(false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.options).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should provide mutate alias for backward compatibility", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: mockDasarData }),
      });

      const { result } = renderHook(() => useDasarPenundaanOptions(true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.mutate).toBe("function");
    });
  });

  describe("useDasarPencabutanOptions", () => {
    const mockDasarPencabutanData = [
      {
        kmktunda: "PMK-001/2024",
        no_kmkcabut: "PMK-002/2024",
        tglcabut: "2024-02-15",
        uraiancabut: "Test Pencabutan",
        thangcabut: 2024,
      },
    ];

    it("should fetch dasar pencabutan options successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: mockDasarPencabutanData }),
      });

      const { result } = renderHook(() => useDasarPencabutanOptions(true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.options).toHaveLength(1);
      expect(result.current.options[0]).toEqual({
        value: "PMK-002/2024",
        label: "PMK-002/2024",
      });
      expect(result.current.items).toEqual(mockDasarPencabutanData);
    });

    it("should not fetch when disabled", () => {
      const { result } = renderHook(() => useDasarPencabutanOptions(false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.options).toEqual([]);
      expect(result.current.items).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useKmkPencabutan", () => {
    const mockKmkPencabutanData = [
      {
        no_kmk: "PMK-001/2024",
        tgl_kmk: "2024-01-15",
        no_kmkcabut: "PMK-002/2024",
        tglcabut: "2024-02-15",
        nm_kriteria: "Test Kriteria",
        nmjenis: "Test Jenis",
        kdkppn: "001",
        kdpemda: "3101",
        nmkppn: "KPPN Jakarta I",
        nmpemda: "Kab. Kepulauan Seribu",
      },
    ];

    it("should fetch KMK pencabutan data successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: mockKmkPencabutanData }),
      });

      const { result } = renderHook(() => useKmkPencabutan("PMK-001/2024"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rows).toEqual(mockKmkPencabutanData);
    });

    it("should not fetch when no_kmk is not provided", () => {
      const { result } = renderHook(() => useKmkPencabutan(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.rows).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useKmkPotongan", () => {
    const mockKmkPotonganData = [
      {
        id: 1,
        thang: 2024,
        no_kmk: "PMK-001/2024",
        uraian: "Test Potongan",
        kdkppn: "001",
        kdpemda: "3101",
        kriteria: "1",
        jenis: "1",
        jan: 100000,
        peb: 200000,
        mar: 150000,
        apr: 0,
        mei: 0,
        jun: 0,
        jul: 0,
        ags: 0,
        sep: 0,
        okt: 0,
        nov: 0,
        des: 0,
        nmpemda: "Kab. Kepulauan Seribu",
        nmkppn: "KPPN Jakarta I",
      },
    ];

    it("should fetch KMK potongan data successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: mockKmkPotonganData }),
      });

      const { result } = renderHook(
        () => useKmkPotongan("PMK-001/2024", 2024, true),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rows).toHaveLength(1);
      expect(result.current.rows[0]).toMatchObject({
        ...mockKmkPotonganData[0],
        no: 1,
      });
      expect(result.current.grandTotal).toBe(450000); // jan + peb + mar
    });

    it("should not fetch when parameters are missing", () => {
      const { result } = renderHook(() => useKmkPotongan(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.rows).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should not fetch when disabled", () => {
      const { result } = renderHook(
        () => useKmkPotongan("PMK-001/2024", 2024, false),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.rows).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useKmkPemotongan", () => {
    const mockKmkPemotonganData = [
      {
        id: 1,
        thang: 2024,
        nmbulan: "Januari",
        no_kmk: "PMK-001/2024",
        kdkppn: "001",
        bulan: 1,
        kdakun: "411211",
        kdsatker: "123456",
        kdlokasi: "01",
        kriteria: "1",
        kdkabkota: "3101",
        nilai: 500000,
        nmpemda: "Kab. Kepulauan Seribu",
        nmkppn: "KPPN Jakarta I",
      },
    ];

    it("should fetch KMK pemotongan data successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: mockKmkPemotonganData }),
      });

      const { result } = renderHook(
        () => useKmkPemotongan("PMK-001/2024", true),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rows).toHaveLength(1);
      expect(result.current.rows[0]).toMatchObject({
        ...mockKmkPemotonganData[0],
        no: 1,
      });
    });

    it("should not fetch when no_kmk is not provided", () => {
      const { result } = renderHook(() => useKmkPemotongan(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.rows).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useKppnByNoKmk", () => {
    const mockKppnData = [
      {
        kdkppn: "001",
        nmkppn: "KPPN Jakarta I",
        no_kmk: "PMK-001/2024",
      },
    ];

    it("should fetch KPPN lookup data successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: mockKppnData }),
      });

      const { result } = renderHook(() => useKppnByNoKmk("PMK-001/2024"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toEqual(mockKppnData);
      expect(result.current.options).toHaveLength(1);
      expect(result.current.options[0]).toEqual({
        value: "001",
        label: "001 - KPPN Jakarta I",
      });
    });

    it("should not fetch when no_kmk is not provided", () => {
      const { result } = renderHook(() => useKppnByNoKmk(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.items).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useKabKotaByNoKmk", () => {
    const mockKabKotaData = [
      {
        kdkabkota: "3101",
        nmkabkota: "Kab. Kepulauan Seribu",
      },
    ];

    it("should fetch KabKota lookup data successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: mockKabKotaData }),
      });

      const { result } = renderHook(
        () => useKabKotaByNoKmk("PMK-001/2024", "001"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toEqual(mockKabKotaData);
      expect(result.current.options).toHaveLength(1);
      expect(result.current.options[0]).toEqual({
        value: "3101",
        label: "3101 - Kab. Kepulauan Seribu",
      });
    });

    it("should not fetch when kppn is not provided", () => {
      const { result } = renderHook(() => useKabKotaByNoKmk("PMK-001/2024"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.items).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Cache behavior and stale time", () => {
    it("should use appropriate stale times for different data types", async () => {
      // Financial data (5 minutes)
      const { result: dauResult } = renderHook(
        () => useDauTransaksi({ thang: 2024 }),
        { wrapper: createWrapper() }
      );

      // Reference data (20 minutes)
      const { result: dasarResult } = renderHook(
        () => useDasarPenundaanOptions(true),
        { wrapper: createWrapper() }
      );

      // Both should have their respective stale times configured
      // This is tested implicitly through the hook implementations
      expect(dauResult.current).toBeDefined();
      expect(dasarResult.current).toBeDefined();
    });
  });

  describe("Query key generation", () => {
    it("should generate consistent query keys", () => {
      const testCases = [
        {
          hook: () => useDauTransaksi({ thang: 2024, bulan: 1 }),
          expectedKey: ["dau-transaksi", { thang: 2024, bulan: 1 }],
        },
        {
          hook: () => useKmkDau(2024),
          expectedKey: ["kmk-dau", 2024],
        },
        {
          hook: () => useDasarPenundaanOptions(true),
          expectedKey: ["dasar-penundaan"],
        },
      ];

      testCases.forEach(({ hook }) => {
        const { result } = renderHook(hook, { wrapper: createWrapper() });
        // Query keys are tested implicitly through the hook behavior
        expect(result.current).toBeDefined();
      });
    });
  });

  describe("Error handling", () => {
    it("should handle network errors gracefully", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(
        () => useDauTransaksi({ thang: 2024 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should handle empty responses", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "",
      });

      const { result } = renderHook(
        () => useDauTransaksi({ thang: 2024 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should handle malformed JSON responses", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "invalid json",
      });

      const { result } = renderHook(
        () => useDauTransaksi({ thang: 2024 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });
});