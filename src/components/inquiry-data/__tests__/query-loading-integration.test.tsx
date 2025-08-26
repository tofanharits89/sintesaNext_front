import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryManagement } from "../query-management";
import { useSavedQueries } from "@/hooks/use-saved-queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { SavedQuery } from "@/types/saved-queries";

// Mock dependencies
jest.mock("@/hooks/use-saved-queries", () => ({
  useSavedQueries: jest.fn(),
}));

jest.mock("@/hooks/use-debounce", () => ({
  useDebounce: jest.fn((value) => value),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../query-list-item", () => ({
  QueryListItem: ({ query, onLoad, onEdit, onDelete }: any) => (
    <div data-testid={`query-item-${query.id}`}>
      <div>{query.name}</div>
      <div>{query.description}</div>
      <button onClick={() => onLoad(query)} data-testid={`load-${query.id}`}>
        Load Query
      </button>
      <button onClick={() => onEdit(query.id, { name: "Updated Name" })} data-testid={`edit-${query.id}`}>
        Edit Query
      </button>
      <button onClick={() => onDelete(query.id)} data-testid={`delete-${query.id}`}>
        Delete Query
      </button>
    </div>
  ),
}));

const mockUseSavedQueries = useSavedQueries as jest.MockedFunction<typeof useSavedQueries>;

describe("QueryManagement - Query Loading Integration", () => {
  const mockQueries: SavedQuery[] = [
    {
      id: "query-1",
      name: "Test Query 1",
      description: "First test query",
      reportParams: {
        tahun: "2024",
        tipeLaporan: "bulanan",
        pembulatan: "ribuan",
      },
      activeFilters: ["filter1", "filter2"],
      filterValues: {
        filter1: {
          selection: "value1",
          kondisiCode: "eq",
          mengandungKata: "",
          jenisTampilan: "kode" as const,
        },
        filter2: {
          selection: "value2",
          kondisiCode: "contains",
          mengandungKata: "test",
          jenisTampilan: "uraian" as const,
        },
      },
      userId: "user-1",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "query-2",
      name: "Complex Query",
      description: "Query with complex filters",
      reportParams: {
        tahun: "2023",
        tipeLaporan: "tahunan",
        pembulatan: "jutaan",
      },
      activeFilters: ["filter3", "filter4", "filter5"],
      filterValues: {
        filter3: {
          selection: "complex-value",
          kondisiCode: "between",
          mengandungKata: "",
          jenisTampilan: "kode" as const,
        },
        filter4: {
          selection: "",
          kondisiCode: "is_not_null",
          mengandungKata: "",
          jenisTampilan: "uraian" as const,
        },
        filter5: {
          selection: "multi-value",
          kondisiCode: "in",
          mengandungKata: "keyword",
          jenisTampilan: "kode" as const,
        },
      },
      userId: "user-1",
      createdAt: "2024-01-02T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    },
  ];

  const mockHookReturn = {
    queries: mockQueries,
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    updateQuery: jest.fn(),
    deleteQuery: jest.fn(),
    isUpdating: false,
    isDeleting: false,
  };

  const mockProps = {
    onLoadQuery: jest.fn(),
    currentUserId: "user-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSavedQueries.mockReturnValue(mockHookReturn as any);
  });

  it("renders query list with load functionality", () => {
    render(<QueryManagement {...mockProps} />);

    expect(screen.getByText("Test Query 1")).toBeInTheDocument();
    expect(screen.getByText("Complex Query")).toBeInTheDocument();
    expect(screen.getByTestId("load-query-1")).toBeInTheDocument();
    expect(screen.getByTestId("load-query-2")).toBeInTheDocument();
  });

  it("calls onLoadQuery with correct query data when load button is clicked", async () => {
    render(<QueryManagement {...mockProps} />);

    const loadButton = screen.getByTestId("load-query-1");
    fireEvent.click(loadButton);

    expect(mockProps.onLoadQuery).toHaveBeenCalledWith(mockQueries[0]);
    expect(mockProps.onLoadQuery).toHaveBeenCalledTimes(1);
  });

  it("loads complex query with all filter data intact", async () => {
    render(<QueryManagement {...mockProps} />);

    const loadButton = screen.getByTestId("load-query-2");
    fireEvent.click(loadButton);

    expect(mockProps.onLoadQuery).toHaveBeenCalledWith(mockQueries[1]);
    
    // Verify the complex query data is passed correctly
    const calledQuery = mockProps.onLoadQuery.mock.calls[0][0];
    expect(calledQuery.reportParams).toEqual({
      tahun: "2023",
      tipeLaporan: "tahunan",
      pembulatan: "jutaan",
    });
    expect(calledQuery.activeFilters).toEqual(["filter3", "filter4", "filter5"]);
    expect(calledQuery.filterValues).toEqual({
      filter3: {
        selection: "complex-value",
        kondisiCode: "between",
        mengandungKata: "",
        jenisTampilan: "kode",
      },
      filter4: {
        selection: "",
        kondisiCode: "is_not_null",
        mengandungKata: "",
        jenisTampilan: "uraian",
      },
      filter5: {
        selection: "multi-value",
        kondisiCode: "in",
        mengandungKata: "keyword",
        jenisTampilan: "kode",
      },
    });
  });

  it("handles query editing through integration", async () => {
    render(<QueryManagement {...mockProps} />);

    const editButton = screen.getByTestId("edit-query-1");
    fireEvent.click(editButton);

    expect(mockHookReturn.updateQuery).toHaveBeenCalledWith("query-1", {
      name: "Updated Name",
    });
  });

  it("handles query deletion through integration", async () => {
    render(<QueryManagement {...mockProps} />);

    const deleteButton = screen.getByTestId("delete-query-1");
    fireEvent.click(deleteButton);

    expect(mockHookReturn.deleteQuery).toHaveBeenCalledWith("query-1");
  });

  it("shows loading state during operations", () => {
    mockUseSavedQueries.mockReturnValue({
      ...mockHookReturn,
      isLoading: true,
    } as any);

    render(<QueryManagement {...mockProps} />);

    // Should show skeleton loaders
    expect(screen.getAllByTestId(/skeleton/i)).toHaveLength(0); // Adjust based on actual skeleton implementation
    expect(screen.queryByText("Test Query 1")).not.toBeInTheDocument();
  });

  it("shows error state when loading fails", () => {
    mockUseSavedQueries.mockReturnValue({
      ...mockHookReturn,
      isLoading: false,
      error: new Error("Failed to load queries"),
      queries: [],
    } as any);

    render(<QueryManagement {...mockProps} />);

    expect(screen.getByText("Gagal Memuat Query")).toBeInTheDocument();
    expect(screen.getByText("Coba Lagi")).toBeInTheDocument();
  });

  it("shows empty state when no queries exist", () => {
    mockUseSavedQueries.mockReturnValue({
      ...mockHookReturn,
      queries: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    } as any);

    render(<QueryManagement {...mockProps} />);

    expect(screen.getByText("Belum Ada Query Tersimpan")).toBeInTheDocument();
    expect(screen.getByText("Mulai simpan query dari Query Builder untuk melihatnya di sini.")).toBeInTheDocument();
  });

  it("handles search functionality", async () => {
    render(<QueryManagement {...mockProps} />);

    const searchInput = screen.getByPlaceholderText("Cari query berdasarkan nama...");
    fireEvent.change(searchInput, { target: { value: "Test" } });

    // Should trigger search (debounced)
    expect(searchInput).toHaveValue("Test");
  });

  it("handles filter functionality", async () => {
    render(<QueryManagement {...mockProps} />);

    // Open filters
    const filterButton = screen.getByText("Filter");
    fireEvent.click(filterButton);

    // Should show filter options
    expect(screen.getByText("Tanggal Dibuat")).toBeInTheDocument();
    expect(screen.getByText("Urutkan")).toBeInTheDocument();
  });

  it("handles pagination", () => {
    mockUseSavedQueries.mockReturnValue({
      ...mockHookReturn,
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    } as any);

    render(<QueryManagement {...mockProps} />);

    expect(screen.getByText("Halaman 1 dari 3")).toBeInTheDocument();
    expect(screen.getByText("Selanjutnya")).toBeInTheDocument();
  });

  it("handles bulk operations", async () => {
    render(<QueryManagement {...mockProps} />);

    // Select all queries
    const selectAllButton = screen.getByText("Pilih Semua");
    fireEvent.click(selectAllButton);

    // Should show bulk delete option
    expect(screen.getByText("Hapus (2)")).toBeInTheDocument();
  });

  it("refreshes query list when refresh button is clicked", () => {
    render(<QueryManagement {...mockProps} />);

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    expect(mockHookReturn.refetch).toHaveBeenCalled();
  });

  it("maintains query data integrity during load operations", async () => {
    const queryWithSpecialChars: SavedQuery = {
      id: "special-query",
      name: "Query with Special Characters: @#$%",
      description: "Description with\nnewlines and\ttabs",
      reportParams: {
        tahun: "2024",
        tipeLaporan: "special-type",
        pembulatan: "custom",
      },
      activeFilters: ["filter-with-spaces", "filter_with_underscores"],
      filterValues: {
        "filter-with-spaces": {
          selection: "value with spaces",
          kondisiCode: "contains",
          mengandungKata: "keyword with spaces",
          jenisTampilan: "uraian" as const,
        },
        "filter_with_underscores": {
          selection: "value_with_underscores",
          kondisiCode: "eq",
          mengandungKata: "",
          jenisTampilan: "kode" as const,
        },
      },
      userId: "user-1",
      createdAt: "2024-01-03T00:00:00Z",
      updatedAt: "2024-01-03T00:00:00Z",
    };

    mockUseSavedQueries.mockReturnValue({
      ...mockHookReturn,
      queries: [queryWithSpecialChars],
    } as any);

    render(<QueryManagement {...mockProps} />);

    const loadButton = screen.getByTestId("load-special-query");
    fireEvent.click(loadButton);

    expect(mockProps.onLoadQuery).toHaveBeenCalledWith(queryWithSpecialChars);
    
    // Verify special characters and formatting are preserved
    const calledQuery = mockProps.onLoadQuery.mock.calls[0][0];
    expect(calledQuery.name).toBe("Query with Special Characters: @#$%");
    expect(calledQuery.description).toBe("Description with\nnewlines and\ttabs");
    expect(calledQuery.filterValues["filter-with-spaces"].selection).toBe("value with spaces");
    expect(calledQuery.filterValues["filter-with-spaces"].mengandungKata).toBe("keyword with spaces");
  });
});