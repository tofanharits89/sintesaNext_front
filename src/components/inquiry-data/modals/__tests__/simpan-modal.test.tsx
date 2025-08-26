import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { SimpanModal } from "../simpan-modal";
import { useSavedQueries } from "@/hooks/use-saved-queries";
import type { FilterValue } from "@/types/saved-queries";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { describe } from "node:test";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { describe } from "node:test";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { it } from "date-fns/locale";
import { beforeEach } from "node:test";
import { vi } from "date-fns/locale";
import { vi } from "date-fns/locale";
import { describe } from "node:test";

// Mock dependencies
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/hooks/use-saved-queries", () => ({
  useSavedQueries: jest.fn(),
}));

const mockUseSavedQueries = useSavedQueries as jest.MockedFunction<typeof useSavedQueries>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe("SimpanModal", () => {
  const mockProps = {
    open: true,
    onOpenChange: vi.fn(),
    activeFilters: ["filter1", "filter2"],
    reportParams: {
      tahun: "2024",
      tipeLaporan: "bulanan",
      pembulatan: "ribuan",
    },
    filterValues: {
      filter1: {
        selection: "value1",
        kondisiCode: "eq",
        mengandungKata: "test",
        jenisTampilan: "kode" as const,
      },
      filter2: {
        selection: "value2",
        kondisiCode: "contains",
        mengandungKata: "example",
        jenisTampilan: "uraian" as const,
      },
    } as Record<string, FilterValue>,
    onSaveSuccess: vi.fn(),
  };

  const mockCreateQuery = jest.fn();
  const mockHookReturn = {
    createQuery: mockCreateQuery,
    isCreating: false,
    createError: null,
    queries: [
      {
        id: "existing-1",
        name: "Existing Query",
        description: "An existing query",
        reportParams: mockProps.reportParams,
        activeFilters: ["filter1"],
        filterValues: {},
        userId: "user-id",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "existing-2", 
        name: "Another Query",
        description: "Another existing query",
        reportParams: mockProps.reportParams,
        activeFilters: ["filter2"],
        filterValues: {},
        userId: "user-id",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSavedQueries.mockReturnValue(mockHookReturn as any);
  });

  it("renders modal with correct title and form fields", () => {
    render(<SimpanModal {...mockProps} />);

    expect(screen.getByText("Simpan Query")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama Query/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Deskripsi/)).toBeInTheDocument();
    expect(screen.getByText("Simpan Query")).toBeInTheDocument();
    expect(screen.getByText("Batal")).toBeInTheDocument();
  });

  it("displays query configuration summary", () => {
    render(<SimpanModal {...mockProps} />);

    expect(screen.getByText("Tahun: 2024")).toBeInTheDocument();
    expect(screen.getByText("Tipe: bulanan")).toBeInTheDocument();
    expect(screen.getByText("Pembulatan: ribuan")).toBeInTheDocument();
    expect(screen.getByText("Filter Aktif: 2")).toBeInTheDocument();
  });

  it("shows validation error when query name is empty", async () => {
    render(<SimpanModal {...mockProps} />);

    const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Nama query tidak boleh kosong")).toBeInTheDocument();
    });

    expect(mockCreateQuery).not.toHaveBeenCalled();
  });

  it("clears error when user starts typing", async () => {
    render(<SimpanModal {...mockProps} />);

    // Trigger validation error first
    const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Nama query tidak boleh kosong")).toBeInTheDocument();
    });

    // Start typing to clear error
    const nameInput = screen.getByLabelText(/Nama Query/);
    fireEvent.change(nameInput, { target: { value: "Test Query" } });

    await waitFor(() => {
      expect(screen.queryByText("Nama query tidak boleh kosong")).not.toBeInTheDocument();
    });
  });

  it("successfully saves query with valid data", async () => {
    const mockSavedQuery = {
      id: "test-id",
      name: "Test Query",
      description: "Test Description",
      reportParams: mockProps.reportParams,
      activeFilters: mockProps.activeFilters,
      filterValues: mockProps.filterValues,
      userId: "user-id",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    mockCreateQuery.mockResolvedValue(mockSavedQuery);

    render(<SimpanModal {...mockProps} />);

    // Fill form
    const nameInput = screen.getByLabelText(/Nama Query/);
    const descriptionInput = screen.getByLabelText(/Deskripsi/);
    
    fireEvent.change(nameInput, { target: { value: "Test Query" } });
    fireEvent.change(descriptionInput, { target: { value: "Test Description" } });

    // Submit form
    const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCreateQuery).toHaveBeenCalledWith({
        name: "Test Query",
        description: "Test Description",
        reportParams: mockProps.reportParams,
        activeFilters: mockProps.activeFilters,
        filterValues: mockProps.filterValues,
      });
    });

    // Check success toast
    expect(mockToast.success).toHaveBeenCalledWith(
      "Query berhasil disimpan",
      {
        description: 'Query "Test Query" telah disimpan dan dapat digunakan kembali',
      }
    );

    // Check modal closes and form resets
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(mockProps.onSaveSuccess).toHaveBeenCalledWith(mockSavedQuery);
  });

  it("handles API errors gracefully", async () => {
    const errorMessage = "Duplicate query name";
    mockCreateQuery.mockRejectedValue(new Error(errorMessage));

    render(<SimpanModal {...mockProps} />);

    // Fill form
    const nameInput = screen.getByLabelText(/Nama Query/);
    fireEvent.change(nameInput, { target: { value: "Test Query" } });

    // Submit form
    const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Check error toast
    expect(mockToast.error).toHaveBeenCalledWith(
      "Gagal menyimpan query",
      {
        description: errorMessage,
      }
    );

    // Modal should remain open
    expect(mockProps.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("shows loading state during save operation", async () => {
    mockUseSavedQueries.mockReturnValue({
      ...mockHookReturn,
      isCreating: true,
    } as any);

    render(<SimpanModal {...mockProps} />);

    const saveButton = screen.getByRole("button", { name: /Menyimpan.../ });
    expect(saveButton).toBeDisabled();
    expect(screen.getByText("Menyimpan...")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: /Batal/ });
    expect(cancelButton).toBeDisabled();
  });

  it("disables save button when query name is empty", () => {
    render(<SimpanModal {...mockProps} />);

    const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
    expect(saveButton).toBeDisabled();

    // Enable when name is provided
    const nameInput = screen.getByLabelText(/Nama Query/);
    fireEvent.change(nameInput, { target: { value: "Test Query" } });

    expect(saveButton).not.toBeDisabled();
  });

  it("prevents closing modal during save operation", () => {
    mockUseSavedQueries.mockReturnValue({
      ...mockHookReturn,
      isCreating: true,
    } as any);

    render(<SimpanModal {...mockProps} />);

    const cancelButton = screen.getByRole("button", { name: /Batal/ });
    fireEvent.click(cancelButton);

    // Modal should not close during save
    expect(mockProps.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("trims whitespace from query name and description", async () => {
    const mockSavedQuery = {
      id: "test-id",
      name: "Test Query",
      description: "Test Description",
      reportParams: mockProps.reportParams,
      activeFilters: mockProps.activeFilters,
      filterValues: mockProps.filterValues,
      userId: "user-id",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    mockCreateQuery.mockResolvedValue(mockSavedQuery);

    render(<SimpanModal {...mockProps} />);

    // Fill form with whitespace
    const nameInput = screen.getByLabelText(/Nama Query/);
    const descriptionInput = screen.getByLabelText(/Deskripsi/);
    
    fireEvent.change(nameInput, { target: { value: "  Test Query  " } });
    fireEvent.change(descriptionInput, { target: { value: "  Test Description  " } });

    // Submit form
    const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCreateQuery).toHaveBeenCalledWith({
        name: "Test Query",
        description: "Test Description",
        reportParams: mockProps.reportParams,
        activeFilters: mockProps.activeFilters,
        filterValues: mockProps.filterValues,
      });
    });
  });

  describe("Duplicate name validation", () => {
    it("shows error for duplicate query names (case-insensitive)", async () => {
      render(<SimpanModal {...mockProps} />);

      const nameInput = screen.getByLabelText(/Nama Query/);
      fireEvent.change(nameInput, { target: { value: "existing query" } }); // lowercase

      const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Nama query sudah digunakan. Silakan pilih nama yang berbeda.")).toBeInTheDocument();
      });

      expect(mockCreateQuery).not.toHaveBeenCalled();
    });

    it("shows suggested name for duplicates", async () => {
      render(<SimpanModal {...mockProps} />);

      const nameInput = screen.getByLabelText(/Nama Query/);
      fireEvent.change(nameInput, { target: { value: "Existing Query" } });

      const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Nama query sudah digunakan. Silakan pilih nama yang berbeda.")).toBeInTheDocument();
        expect(screen.getByText('"Existing Query (1)"')).toBeInTheDocument();
      });
    });

    it("applies suggested name when clicked", async () => {
      render(<SimpanModal {...mockProps} />);

      const nameInput = screen.getByLabelText(/Nama Query/);
      fireEvent.change(nameInput, { target: { value: "Existing Query" } });

      const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('"Existing Query (1)"')).toBeInTheDocument();
      });

      // Click the suggested name
      const suggestedButton = screen.getByRole("button", { name: '"Existing Query (1)"' });
      fireEvent.click(suggestedButton);

      expect(nameInput).toHaveValue("Existing Query (1)");
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText("Nama query sudah digunakan. Silakan pilih nama yang berbeda.")).not.toBeInTheDocument();
      });
    });

    it("handles server-side duplicate error with suggestion", async () => {
      const duplicateError = new Error("Query name already exists");
      mockCreateQuery.mockRejectedValue(duplicateError);

      render(<SimpanModal {...mockProps} />);

      const nameInput = screen.getByLabelText(/Nama Query/);
      fireEvent.change(nameInput, { target: { value: "New Query" } });

      const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Nama query sudah digunakan. Silakan pilih nama yang berbeda.")).toBeInTheDocument();
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        "Gagal menyimpan query",
        {
          description: 'Nama query sudah digunakan. Coba gunakan: "New Query (1)"',
        }
      );
    });

    it("generates incremental suggestions for multiple duplicates", () => {
      // Add more existing queries to test incremental suggestions
      const extendedHookReturn = {
        ...mockHookReturn,
        queries: [
          ...mockHookReturn.queries,
          {
            id: "existing-3",
            name: "Test Query (1)",
            description: "Test",
            reportParams: mockProps.reportParams,
            activeFilters: [],
            filterValues: {},
            userId: "user-id",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
          {
            id: "existing-4",
            name: "Test Query (2)",
            description: "Test",
            reportParams: mockProps.reportParams,
            activeFilters: [],
            filterValues: {},
            userId: "user-id",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      };

      mockUseSavedQueries.mockReturnValue(extendedHookReturn as any);

      render(<SimpanModal {...mockProps} />);

      const nameInput = screen.getByLabelText(/Nama Query/);
      fireEvent.change(nameInput, { target: { value: "Test Query" } });

      const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
      fireEvent.click(saveButton);

      // Should suggest "Test Query (3)" since (1) and (2) already exist
      expect(screen.getByText('"Test Query (3)"')).toBeInTheDocument();
    });
  });

  describe("Filter data validation", () => {
    it("shows error when active filters have no filter values", async () => {
      const propsWithoutFilterValues = {
        ...mockProps,
        activeFilters: ["filter1", "filter2"],
        filterValues: {},
      };

      render(<SimpanModal {...propsWithoutFilterValues} />);

      const nameInput = screen.getByLabelText(/Nama Query/);
      fireEvent.change(nameInput, { target: { value: "Test Query" } });

      const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Data filter tidak lengkap. Pastikan semua filter memiliki nilai yang valid.")).toBeInTheDocument();
      });

      expect(mockCreateQuery).not.toHaveBeenCalled();
    });

    it("shows error when some active filters are missing values", async () => {
      const propsWithMissingValues = {
        ...mockProps,
        activeFilters: ["filter1", "filter2", "filter3"],
        filterValues: {
          filter1: mockProps.filterValues.filter1,
          filter2: mockProps.filterValues.filter2,
          // filter3 is missing
        },
      };

      render(<SimpanModal {...propsWithMissingValues} />);

      const nameInput = screen.getByLabelText(/Nama Query/);
      fireEvent.change(nameInput, { target: { value: "Test Query" } });

      const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Filter berikut tidak memiliki nilai: filter3")).toBeInTheDocument();
      });

      expect(mockCreateQuery).not.toHaveBeenCalled();
    });

    it("shows error when filter value has no condition code", async () => {
      const propsWithInvalidFilter = {
        ...mockProps,
        filterValues: {
          filter1: {
            ...mockProps.filterValues.filter1,
            kondisiCode: "", // Invalid condition
          },
          filter2: mockProps.filterValues.filter2,
        },
      };

      render(<SimpanModal {...propsWithInvalidFilter} />);

      const nameInput = screen.getByLabelText(/Nama Query/);
      fireEvent.change(nameInput, { target: { value: "Test Query" } });

      const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Filter "filter1" tidak memiliki kondisi yang valid.')).toBeInTheDocument();
      });

      expect(mockCreateQuery).not.toHaveBeenCalled();
    });

    it("shows error when filter value has no selection or keyword", async () => {
      const propsWithEmptyFilter = {
        ...mockProps,
        filterValues: {
          filter1: {
            selection: "",
            kondisiCode: "eq",
            mengandungKata: "",
            jenisTampilan: "kode" as const,
          },
          filter2: mockProps.filterValues.filter2,
        },
      };

      render(<SimpanModal {...propsWithEmptyFilter} />);

      const nameInput = screen.getByLabelText(/Nama Query/);
      fireEvent.change(nameInput, { target: { value: "Test Query" } });

      const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Filter "filter1" memerlukan nilai atau kata kunci.')).toBeInTheDocument();
      });

      expect(mockCreateQuery).not.toHaveBeenCalled();
    });

    it("allows null conditions without selection or keyword", async () => {
      const mockSavedQuery = {
        id: "test-id",
        name: "Test Query",
        description: "",
        reportParams: mockProps.reportParams,
        activeFilters: mockProps.activeFilters,
        filterValues: mockProps.filterValues,
        userId: "user-id",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockCreateQuery.mockResolvedValue(mockSavedQuery);

      const propsWithNullCondition = {
        ...mockProps,
        filterValues: {
          filter1: {
            selection: "",
            kondisiCode: "is_null",
            mengandungKata: "",
            jenisTampilan: "kode" as const,
          },
          filter2: mockProps.filterValues.filter2,
        },
      };

      render(<SimpanModal {...propsWithNullCondition} />);

      const nameInput = screen.getByLabelText(/Nama Query/);
      fireEvent.change(nameInput, { target: { value: "Test Query" } });

      const saveButton = screen.getByRole("button", { name: /Simpan Query/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateQuery).toHaveBeenCalled();
      });
    });

    it("displays filter details in the summary", () => {
      render(<SimpanModal {...mockProps} />);

      expect(screen.getByText("Filter yang akan disimpan:")).toBeInTheDocument();
      expect(screen.getByText("filter1")).toBeInTheDocument();
      expect(screen.getByText("filter2")).toBeInTheDocument();
      expect(screen.getByText("(eq: value1)")).toBeInTheDocument();
      expect(screen.getByText("(contains: example)")).toBeInTheDocument();
    });

    it("shows filter values count in summary", () => {
      render(<SimpanModal {...mockProps} />);

      expect(screen.getByText("Filter Values: 2")).toBeInTheDocument();
    });

    it("hides filter details when no active filters", () => {
      const propsWithoutFilters = {
        ...mockProps,
        activeFilters: [],
        filterValues: {},
      };

      render(<SimpanModal {...propsWithoutFilters} />);

      expect(screen.queryByText("Filter yang akan disimpan:")).not.toBeInTheDocument();
      expect(screen.queryByText("Filter Values:")).not.toBeInTheDocument();
    });
  });
});