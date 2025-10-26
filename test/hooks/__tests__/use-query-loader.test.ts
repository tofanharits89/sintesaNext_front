import { renderHook, act } from "@testing-library/react";
import { useQueryLoader, type QueryBuilderState } from "../use-query-loader";
import type { SavedQuery, FilterValue, ReportParams } from "@/types/saved-queries";

// Mock data
const mockReportParams: ReportParams = {
  tahun: "2024",
  tipeLaporan: "pagu_realisasi",
  pembulatan: "satuan",
  jenisAkumulasi: "non_akumulatif"
};

const mockFilterValues: Record<string, FilterValue> = {
  cutOff: {
    selection: "12",
    kondisiCode: "equals",
    mengandungKata: "",
    jenisTampilan: "kode"
  },
  kodeKementerian: {
    selection: "001",
    kondisiCode: "equals",
    mengandungKata: "",
    jenisTampilan: "kode_uraian"
  }
};

const mockQueryBuilderState: QueryBuilderState = {
  activeFilters: ["cutOff", "kodeKementerian"],
  filterValues: mockFilterValues,
  reportParams: mockReportParams
};

const mockSavedQuery: SavedQuery = {
  id: "test-query-1",
  name: "Test Query",
  description: "Test query description",
  reportParams: mockReportParams,
  activeFilters: ["cutOff", "kodeKementerian"],
  filterValues: mockFilterValues,
  userId: "user-1",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
};

describe("useQueryLoader", () => {
  let mockOnStateChange: jest.Mock;
  let mockGetCurrentState: jest.Mock;

  beforeEach(() => {
    mockOnStateChange = jest.fn();
    mockGetCurrentState = jest.fn().mockReturnValue(mockQueryBuilderState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validateQueryCompatibility", () => {
    it("should validate a valid query successfully", () => {
      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const validation = result.current.validateQueryCompatibility(mockSavedQuery);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect missing report parameters", () => {
      const invalidQuery = {
        ...mockSavedQuery,
        reportParams: {
          tahun: "",
          tipeLaporan: "",
          pembulatan: ""
        }
      };

      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const validation = result.current.validateQueryCompatibility(invalidQuery);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Parameter tahun tidak ditemukan");
      expect(validation.errors).toContain("Parameter tipe laporan tidak ditemukan");
      expect(validation.errors).toContain("Parameter pembulatan tidak ditemukan");
    });

    it("should detect missing active filters", () => {
      const invalidQuery = {
        ...mockSavedQuery,
        activeFilters: []
      };

      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const validation = result.current.validateQueryCompatibility(invalidQuery);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Query tidak memiliki filter aktif");
    });

    it("should detect missing filter values", () => {
      const invalidQuery = {
        ...mockSavedQuery,
        filterValues: {}
      };

      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const validation = result.current.validateQueryCompatibility(invalidQuery);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Filter berikut tidak memiliki nilai: cutOff, kodeKementerian");
    });

    it("should detect invalid filter value structure", () => {
      const invalidQuery = {
        ...mockSavedQuery,
        filterValues: {
          cutOff: {
            selection: "12",
            kondisiCode: "", // Missing kondisi code
            mengandungKata: "",
            jenisTampilan: "kode"
          }
        }
      };

      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const validation = result.current.validateQueryCompatibility(invalidQuery);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Filter "cutOff" tidak memiliki kondisi yang valid');
    });

    it("should validate null conditions correctly", () => {
      const queryWithNullCondition = {
        ...mockSavedQuery,
        filterValues: {
          cutOff: {
            selection: "",
            kondisiCode: "is_null",
            mengandungKata: "",
            jenisTampilan: "kode"
          }
        }
      };

      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const validation = result.current.validateQueryCompatibility(queryWithNullCondition);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe("detectUnsavedChanges", () => {
    it("should detect no changes when states are identical", () => {
      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const hasChanges = result.current.detectUnsavedChanges(
        mockQueryBuilderState,
        mockQueryBuilderState
      );

      expect(hasChanges).toBe(false);
    });

    it("should detect changes in report parameters", () => {
      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const modifiedState = {
        ...mockQueryBuilderState,
        reportParams: {
          ...mockReportParams,
          tahun: "2023"
        }
      };

      const hasChanges = result.current.detectUnsavedChanges(
        modifiedState,
        mockQueryBuilderState
      );

      expect(hasChanges).toBe(true);
    });

    it("should detect changes in active filters", () => {
      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const modifiedState = {
        ...mockQueryBuilderState,
        activeFilters: ["cutOff", "kodeKementerian", "kodeSatker"]
      };

      const hasChanges = result.current.detectUnsavedChanges(
        modifiedState,
        mockQueryBuilderState
      );

      expect(hasChanges).toBe(true);
    });

    it("should detect changes in filter values", () => {
      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const modifiedState = {
        ...mockQueryBuilderState,
        filterValues: {
          ...mockFilterValues,
          cutOff: {
            ...mockFilterValues.cutOff,
            selection: "11"
          }
        }
      };

      const hasChanges = result.current.detectUnsavedChanges(
        modifiedState,
        mockQueryBuilderState
      );

      expect(hasChanges).toBe(true);
    });

    it("should return false when original state is null", () => {
      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const hasChanges = result.current.detectUnsavedChanges(
        mockQueryBuilderState,
        null
      );

      expect(hasChanges).toBe(false);
    });
  });

  describe("restoreReportParameters", () => {
    it("should restore report parameters correctly", () => {
      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const restored = result.current.restoreReportParameters(mockSavedQuery);

      expect(restored).toEqual({
        tahun: "2024",
        tipeLaporan: "pagu_realisasi",
        pembulatan: "satuan",
        jenisAkumulasi: "non_akumulatif"
      });
    });

    it("should provide default jenisAkumulasi when missing", () => {
      const queryWithoutJenisAkumulasi = {
        ...mockSavedQuery,
        reportParams: {
          tahun: "2024",
          tipeLaporan: "pagu_realisasi",
          pembulatan: "satuan"
        }
      };

      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const restored = result.current.restoreReportParameters(queryWithoutJenisAkumulasi);

      expect(restored.jenisAkumulasi).toBe("non_akumulatif");
    });
  });

  describe("restoreFiltersAndValues", () => {
    it("should restore filters and values correctly", () => {
      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const restored = result.current.restoreFiltersAndValues(mockSavedQuery);

      expect(restored.activeFilters).toEqual(["cutOff", "kodeKementerian"]);
      expect(restored.filterValues).toEqual(mockFilterValues);
    });

    it("should ensure cutOff filter is always included", () => {
      const queryWithoutCutOff = {
        ...mockSavedQuery,
        activeFilters: ["kodeKementerian"],
        filterValues: {
          kodeKementerian: mockFilterValues.kodeKementerian
        }
      };

      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const restored = result.current.restoreFiltersAndValues(queryWithoutCutOff);

      expect(restored.activeFilters).toContain("cutOff");
      expect(restored.activeFilters[0]).toBe("cutOff");
      expect(restored.filterValues.cutOff).toBeDefined();
      expect(restored.filterValues.cutOff.jenisTampilan).toBe("kode");
    });

    it("should provide default cutOff value when missing", () => {
      const queryWithoutCutOffValue = {
        ...mockSavedQuery,
        filterValues: {
          kodeKementerian: mockFilterValues.kodeKementerian
        }
      };

      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const restored = result.current.restoreFiltersAndValues(queryWithoutCutOffValue);

      expect(restored.filterValues.cutOff).toBeDefined();
      expect(restored.filterValues.cutOff.selection).toMatch(/^\d{2}$/); // Should be current month
      expect(restored.filterValues.cutOff.jenisTampilan).toBe("kode");
    });
  });

  describe("loadQuery", () => {
    it("should load a valid query successfully", async () => {
      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const loadResult = await act(async () => {
        return await result.current.loadQuery(mockSavedQuery);
      });

      expect(loadResult.success).toBe(true);
      expect(loadResult.errors).toBeUndefined();
      expect(mockOnStateChange).toHaveBeenCalledWith({
        reportParams: mockReportParams,
        activeFilters: ["cutOff", "kodeKementerian"],
        filterValues: mockFilterValues
      });
    });

    it("should fail to load an invalid query", async () => {
      const invalidQuery = {
        ...mockSavedQuery,
        reportParams: {
          tahun: "",
          tipeLaporan: "",
          pembulatan: ""
        }
      };

      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const loadResult = await act(async () => {
        return await result.current.loadQuery(invalidQuery);
      });

      expect(loadResult.success).toBe(false);
      expect(loadResult.errors).toBeDefined();
      expect(loadResult.errors!.length).toBeGreaterThan(0);
      expect(mockOnStateChange).not.toHaveBeenCalled();
    });

    it("should handle loading errors gracefully", async () => {
      const mockOnStateChangeError = jest.fn().mockImplementation(() => {
        throw new Error("State change error");
      });

      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChangeError,
          getCurrentState: mockGetCurrentState
        })
      );

      const loadResult = await act(async () => {
        return await result.current.loadQuery(mockSavedQuery);
      });

      expect(loadResult.success).toBe(false);
      expect(loadResult.errors).toContain("Terjadi kesalahan saat memuat query. Silakan coba lagi.");
    });
  });

  describe("change detection state management", () => {
    it("should track unsaved changes correctly", () => {
      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      // Initially no unsaved changes
      expect(result.current.hasUnsavedChanges).toBe(false);

      // Set original state
      act(() => {
        result.current.setOriginalState(mockQueryBuilderState);
      });

      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.originalState).toEqual(mockQueryBuilderState);
    });

    it("should reset change detection", () => {
      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      // Set original state
      act(() => {
        result.current.setOriginalState(mockQueryBuilderState);
      });

      // Reset
      act(() => {
        result.current.resetChangeDetection();
      });

      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.originalState).toBeNull();
      expect(result.current.currentState).toBeNull();
    });

    it("should get unsaved changes status", () => {
      const { result } = renderHook(() =>
        useQueryLoader({
          onStateChange: mockOnStateChange,
          getCurrentState: mockGetCurrentState
        })
      );

      const status = result.current.getUnsavedChangesStatus();

      expect(status.hasUnsavedChanges).toBe(false);
      expect(status.currentState).toEqual(mockQueryBuilderState);
      expect(status.originalState).toBeNull();
    });
  });
});
