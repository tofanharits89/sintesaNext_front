import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DynamicFiltersCard } from "../dynamic-filters-card";
import { useCurrentUser } from "@/lib/use-current-user";
import { useInquiryDataApi } from "@/hooks/use-inquiry-data-api";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";

// Mock dependencies
import { vi } from "vitest";

vi.mock("@/lib/use-current-user", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/hooks/use-inquiry-data-api", () => ({
  useInquiryDataApi: vi.fn(),
}));

vi.mock("../modals/simpan-modal", () => ({
  SimpanModal: ({
    open,
    activeFilters,
    reportParams,
    filterValues,
    onOpenChange,
  }: {
    open: boolean;
    activeFilters: string[];
    reportParams: {
      tahun: string;
      tipeLaporan: string;
      pembulatan: string;
    };
    filterValues: Record<string, FilterValue>;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div data-testid="simpan-modal">
      {open && (
        <div>
          <div data-testid="modal-active-filters">
            {JSON.stringify(activeFilters)}
          </div>
          <div data-testid="modal-report-params">
            {JSON.stringify(reportParams)}
          </div>
          <div data-testid="modal-filter-values">
            {JSON.stringify(filterValues)}
          </div>
          <button onClick={() => onOpenChange(false)}>Close Modal</button>
        </div>
      )}
    </div>
  ),
}));

vi.mock("../modals/tayang-modal", () => ({
  TayangModal: () => <div data-testid="tayang-modal" />,
}));

vi.mock("../modals/whatsapp-modal", () => ({
  WhatsappModal: () => <div data-testid="whatsapp-modal" />,
}));

vi.mock("../modals/lihat-sql-modal", () => ({
  LihatSqlModal: () => <div data-testid="lihat-sql-modal" />,
}));


vi.mock("../enhanced-filter-card", () => ({
  EnhancedFilterCard: ({
    filterKey,
    onRemove,
  }: {
    filterKey: string;
    onRemove: () => void;
  }) => (
    <div data-testid={`filter-card-${filterKey}`}>
      <span>{filterKey}</span>
      <button onClick={onRemove} data-testid={`remove-${filterKey}`}>
        Remove
      </button>
    </div>
  ),
}));

vi.mock("../filterRegistry", () => ({
  getFilterLabel: (key: string) => `Label for ${key}`,
  normalizeActiveFilters: (filters: string[]) => filters,
}));

const mockUseCurrentUser = vi.mocked(useCurrentUser);
const mockUseInquiryDataApi = vi.mocked(useInquiryDataApi);

describe("DynamicFiltersCard", () => {
  const mockProps = {
    activeFilters: ["filter1", "filter2"],
    reportParams: {
      tahun: "2024",
      tipeLaporan: "bulanan",
      pembulatan: "ribuan",
    },
    onRemoveFilter: vi.fn(),
    onClearAllFilters: vi.fn(),
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
    onFilterChange: vi.fn(),
    queryLoader: {
      hasUnsavedChanges: false,
      loadQuery: vi.fn(),
      validateQueryCompatibility: vi
        .fn()
        .mockReturnValue({ isValid: true, errors: [] }),
    },
  };

  const mockApiHook = {
    downloadCSV: vi.fn(),
    downloadExcel: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentUser.mockReturnValue({
      currentUser: {
        id: "user-id",
        role: "user",
        name: "Test User",
        email: "test@example.com",
      },
    });
    mockUseInquiryDataApi.mockReturnValue(
      mockApiHook as ReturnType<typeof useInquiryDataApi>
    );
  });

  it("renders active filters and action buttons", () => {
    render(<DynamicFiltersCard {...mockProps} />);

    void expect(screen.getByText("Filter Aktif dan Aksi")).toBeInTheDocument();
    expect(screen.getByText("Filter yang Aktif (2)")).toBeInTheDocument();
    expect(screen.getByTestId("filter-card-filter1")).toBeInTheDocument();
    expect(screen.getByTestId("filter-card-filter2")).toBeInTheDocument();

    // Action buttons
    expect(screen.getByText("Tayang")).toBeInTheDocument();
    expect(screen.getByText("Download Excel")).toBeInTheDocument();
    expect(screen.getByText("Download CSV")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Simpan")).toBeInTheDocument();
  });

  it("opens SimpanModal with correct props when Simpan button is clicked", async () => {
    render(<DynamicFiltersCard {...mockProps} />);

    const simpanButton = screen.getByText("Simpan");
    fireEvent.click(simpanButton);

    await waitFor(() => {
      expect(screen.getByTestId("simpan-modal")).toBeInTheDocument();
    });

    // Check that the modal receives the correct props
    expect(screen.getByTestId("modal-active-filters")).toHaveTextContent(
      JSON.stringify(mockProps.activeFilters)
    );
    expect(screen.getByTestId("modal-report-params")).toHaveTextContent(
      JSON.stringify(mockProps.reportParams)
    );
    expect(screen.getByTestId("modal-filter-values")).toHaveTextContent(
      JSON.stringify(mockProps.filterValues)
    );
  });

  it("passes complete filter state to SimpanModal", async () => {
    const complexFilterValues = {
      filter1: {
        selection: "complex-value-1",
        kondisiCode: "between",
        mengandungKata: "complex-keyword",
        jenisTampilan: "kode" as const,
        additionalData: { min: 100, max: 200 },
      },
      filter2: {
        selection: "complex-value-2",
        kondisiCode: "in",
        mengandungKata: "",
        jenisTampilan: "uraian" as const,
        multipleValues: ["val1", "val2", "val3"],
      },
    };

    const propsWithComplexFilters = {
      ...mockProps,
      filterValues: complexFilterValues as Record<string, FilterValue>,
    };

    render(<DynamicFiltersCard {...propsWithComplexFilters} />);

    const simpanButton = screen.getByText("Simpan");
    fireEvent.click(simpanButton);

    await waitFor(() => {
      expect(screen.getByTestId("simpan-modal")).toBeInTheDocument();
    });

    // Verify that complex filter values are passed correctly
    const modalFilterValues = screen.getByTestId("modal-filter-values");
    expect(modalFilterValues).toHaveTextContent(
      JSON.stringify(complexFilterValues)
    );
  });

  it("maintains backward compatibility when filterValues is empty", async () => {
    const propsWithEmptyFilterValues = {
      ...mockProps,
      filterValues: {},
    };

    render(<DynamicFiltersCard {...propsWithEmptyFilterValues} />);

    const simpanButton = screen.getByText("Simpan");
    fireEvent.click(simpanButton);

    await waitFor(() => {
      expect(screen.getByTestId("simpan-modal")).toBeInTheDocument();
    });

    // Should still pass empty object
    expect(screen.getByTestId("modal-filter-values")).toHaveTextContent("{}");
  });

  it("disables Simpan button when no active filters", () => {
    const propsWithNoFilters = {
      ...mockProps,
      activeFilters: [],
      filterValues: {},
    };

    render(<DynamicFiltersCard {...propsWithNoFilters} />);

    const simpanButton = screen.getByText("Simpan");
    expect(simpanButton).toBeDisabled();
  });

  it("shows admin-only SQL button for admin users", () => {
    mockUseCurrentUser.mockReturnValue({
      currentUser: {
        id: "admin-id",
        role: "super_admin",
        name: "Admin User",
        email: "admin@example.com",
      },
    });

    render(<DynamicFiltersCard {...mockProps} />);

    expect(screen.getByText("Lihat SQL")).toBeInTheDocument();
  });

  it("hides SQL button for regular users", () => {
    render(<DynamicFiltersCard {...mockProps} />);

    expect(screen.queryByText("Lihat SQL")).not.toBeInTheDocument();
  });


  it("calls onRemoveFilter when filter remove button is clicked", () => {
    render(<DynamicFiltersCard {...mockProps} />);

    const removeButton = screen.getByTestId("remove-filter1");
    fireEvent.click(removeButton);

    expect(mockProps.onRemoveFilter).toHaveBeenCalledWith("filter1");
  });

  it("calls onClearAllFilters when clear all button is clicked", () => {
    render(<DynamicFiltersCard {...mockProps} />);

    const clearAllButton = screen.getByText("Hapus Semua");
    fireEvent.click(clearAllButton);

    expect(mockProps.onClearAllFilters).toHaveBeenCalled();
  });

  it("shows empty state when no active filters", () => {
    const propsWithNoFilters = {
      ...mockProps,
      activeFilters: [],
      filterValues: {},
    };

    render(<DynamicFiltersCard {...propsWithNoFilters} />);

    expect(
      screen.getByText("Tidak ada filter yang aktif.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Aktifkan filter pada kartu "Filter Parameters" di atas.'
      )
    ).toBeInTheDocument();
  });

  it("handles download operations correctly", async () => {
    render(<DynamicFiltersCard {...mockProps} />);

    // Test Excel download
    const excelButton = screen.getByText("Download Excel");
    fireEvent.click(excelButton);

    expect(mockApiHook.downloadExcel).toHaveBeenCalledWith(
      mockProps.activeFilters,
      mockProps.filterValues,
      mockProps.reportParams
    );

    // Test CSV download
    const csvButton = screen.getByText("Download CSV");
    fireEvent.click(csvButton);

    expect(mockApiHook.downloadCSV).toHaveBeenCalledWith(
      mockProps.activeFilters,
      mockProps.filterValues,
      mockProps.reportParams
    );
  });

  it("disables action buttons when loading", () => {
    mockUseInquiryDataApi.mockReturnValue({
      ...mockApiHook,
      isLoading: true,
    } as any);

    render(<DynamicFiltersCard {...mockProps} />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByText("Download Excel")).toBeDisabled();
    expect(screen.getByText("Download CSV")).toBeDisabled();
  });

  // NEW TESTS: hiddenFilterKeys behavior
  it("renders only visible filters and correct count when some active filters are hidden", () => {
    const propsWithHidden = {
      ...mockProps,
      activeFilters: ["filter1", "filter2", "hiddenA"],
      filterValues: {
        ...mockProps.filterValues,
        hiddenA: {
          selection: "valueHidden",
          kondisiCode: "eq",
          mengandungKata: "",
          jenisTampilan: "kode" as const,
        },
      },
      hiddenFilterKeys: ["hiddenA"],
    } as any;

    render(<DynamicFiltersCard {...propsWithHidden} />);

    // Count should reflect only visible filters
    expect(screen.getByText("Filter yang Aktif (2)")).toBeInTheDocument();

    // Visible filters are rendered
    expect(screen.getByTestId("filter-card-filter1")).toBeInTheDocument();
    expect(screen.getByTestId("filter-card-filter2")).toBeInTheDocument();

    // Hidden filter should not be rendered
    expect(screen.queryByTestId("filter-card-hiddenA")).not.toBeInTheDocument();
  });

  it("shows empty state and hides 'Hapus Semua' when all active filters are hidden", () => {
    const propsAllHidden = {
      ...mockProps,
      activeFilters: ["hiddenA"],
      filterValues: {
        hiddenA: {
          selection: "valueHidden",
          kondisiCode: "eq",
          mengandungKata: "",
          jenisTampilan: "kode" as const,
        },
      },
      hiddenFilterKeys: ["hiddenA"],
    } as any;

    render(<DynamicFiltersCard {...propsAllHidden} />);

    // Empty state appears
    expect(
      screen.getByText("Tidak ada filter yang aktif.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Aktifkan filter pada kartu "Filter Parameters" di atas.'
      )
    ).toBeInTheDocument();

    // "Hapus Semua" button should not be present
    expect(screen.queryByText("Hapus Semua")).not.toBeInTheDocument();
  });
});
