import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryLoaderButton } from "../query-loader-button";
import type { SavedQuery } from "@/types/saved-queries";

// Mock the hooks
jest.mock("@/hooks/use-saved-queries", () => ({
  useSavedQueries: jest.fn(),
}));

// Mock the UI components
jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dropdown-menu" data-open={open}>
      <div onClick={() => onOpenChange(!open)}>Toggle</div>
      {open && children}
    </div>
  ),
  DropdownMenuContent: ({ children }: any) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick, disabled }: any) => (
    <div
      data-testid="dropdown-item"
      onClick={disabled ? undefined : onClick}
      data-disabled={disabled}
    >
      {children}
    </div>
  ),
  DropdownMenuLabel: ({ children }: any) => (
    <div data-testid="dropdown-label">{children}</div>
  ),
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
  DropdownMenuTrigger: ({ children }: any) => children,
}));

jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input data-testid="search-input" {...props} />,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button
      data-testid="query-loader-button"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

// Mock data
const mockQueries: SavedQuery[] = [
  {
    id: "query-1",
    name: "Test Query 1",
    description: "First test query",
    reportParams: {
      tahun: "2024",
      tipeLaporan: "pagu_realisasi",
      pembulatan: "satuan",
      jenisAkumulasi: "non_akumulatif"
    },
    activeFilters: ["cutOff", "kodeKementerian"],
    filterValues: {},
    userId: "user-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T12:00:00Z"
  },
  {
    id: "query-2",
    name: "Test Query 2",
    description: "Second test query",
    reportParams: {
      tahun: "2023",
      tipeLaporan: "realisasi",
      pembulatan: "ribu",
      jenisAkumulasi: "akumulatif"
    },
    activeFilters: ["cutOff"],
    filterValues: {},
    userId: "user-1",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T12:00:00Z"
  }
];

describe("QueryLoaderButton", () => {
  const mockOnLoadQuery = jest.fn();
  const mockOnOpenQueryManagement = jest.fn();
  const mockUseSavedQueries = require("@/hooks/use-saved-queries").useSavedQueries;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSavedQueries.mockReturnValue({
      queries: mockQueries,
      isLoading: false,
      error: null,
    });
  });

  it("renders the button with correct text", () => {
    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
        onOpenQueryManagement={mockOnOpenQueryManagement}
      />
    );

    expect(screen.getByTestId("query-loader-button")).toBeInTheDocument();
    expect(screen.getByText("Muat Query")).toBeInTheDocument();
  });

  it("shows unsaved changes indicator when hasUnsavedChanges is true", () => {
    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
        hasUnsavedChanges={true}
      />
    );

    expect(screen.getByTestId("badge")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("disables button when disabled prop is true", () => {
    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
        disabled={true}
      />
    );

    expect(screen.getByTestId("query-loader-button")).toBeDisabled();
  });

  it("opens dropdown when button is clicked", () => {
    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    expect(screen.getByTestId("dropdown-menu")).toHaveAttribute("data-open", "true");
  });

  it("displays search input in dropdown", () => {
    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByTestId("search-input")).toHaveAttribute(
      "placeholder",
      "Cari query tersimpan..."
    );
  });

  it("displays loading state when queries are loading", () => {
    mockUseSavedQueries.mockReturnValue({
      queries: [],
      isLoading: true,
      error: null,
    });

    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    expect(screen.getByText("Memuat query...")).toBeInTheDocument();
  });

  it("displays error state when there's an error", () => {
    mockUseSavedQueries.mockReturnValue({
      queries: [],
      isLoading: false,
      error: new Error("Network error"),
    });

    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    expect(screen.getByText("Gagal memuat query")).toBeInTheDocument();
  });

  it("displays no queries message when no queries are available", () => {
    mockUseSavedQueries.mockReturnValue({
      queries: [],
      isLoading: false,
      error: null,
    });

    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    expect(screen.getByText("Belum ada query tersimpan")).toBeInTheDocument();
  });

  it("displays query list when queries are available", () => {
    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    expect(screen.getByText("Test Query 1")).toBeInTheDocument();
    expect(screen.getByText("Test Query 2")).toBeInTheDocument();
    expect(screen.getByText("First test query")).toBeInTheDocument();
    expect(screen.getByText("Second test query")).toBeInTheDocument();
  });

  it("calls onLoadQuery when a query item is clicked", async () => {
    mockOnLoadQuery.mockResolvedValue(undefined);

    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    const queryItems = screen.getAllByTestId("dropdown-item");
    const firstQueryItem = queryItems.find(item => 
      item.textContent?.includes("Test Query 1")
    );

    expect(firstQueryItem).toBeInTheDocument();
    fireEvent.click(firstQueryItem!);

    await waitFor(() => {
      expect(mockOnLoadQuery).toHaveBeenCalledWith(mockQueries[0]);
    });
  });

  it("filters queries based on search input", () => {
    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "Query 1" } });

    // Should trigger a re-render with filtered results
    expect(mockUseSavedQueries).toHaveBeenCalledWith({
      search: "Query 1",
      limit: 10,
    });
  });

  it("displays query management option when onOpenQueryManagement is provided", () => {
    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
        onOpenQueryManagement={mockOnOpenQueryManagement}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    expect(screen.getByText("Kelola Query")).toBeInTheDocument();
  });

  it("calls onOpenQueryManagement when query management option is clicked", () => {
    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
        onOpenQueryManagement={mockOnOpenQueryManagement}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    const managementItem = screen.getAllByTestId("dropdown-item").find(item =>
      item.textContent?.includes("Kelola Query")
    );

    expect(managementItem).toBeInTheDocument();
    fireEvent.click(managementItem!);

    expect(mockOnOpenQueryManagement).toHaveBeenCalled();
  });

  it("shows unsaved changes warning in dropdown when hasUnsavedChanges is true", () => {
    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
        hasUnsavedChanges={true}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    expect(screen.getByText("Ada perubahan yang belum disimpan")).toBeInTheDocument();
  });

  it("formats query summary correctly", () => {
    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    // Check if query summary is displayed correctly
    expect(screen.getByText("2024 • pagu_realisasi • 2 filter")).toBeInTheDocument();
    expect(screen.getByText("2023 • realisasi • 1 filter")).toBeInTheDocument();
  });

  it("handles loading state during query loading", async () => {
    mockOnLoadQuery.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    const queryItems = screen.getAllByTestId("dropdown-item");
    const firstQueryItem = queryItems.find(item => 
      item.textContent?.includes("Test Query 1")
    );

    fireEvent.click(firstQueryItem!);

    // Should show loading state
    await waitFor(() => {
      expect(firstQueryItem).toHaveAttribute("data-disabled", "true");
    });
  });

  it("closes dropdown after successful query load", async () => {
    mockOnLoadQuery.mockResolvedValue(undefined);

    render(
      <QueryLoaderButton
        onLoadQuery={mockOnLoadQuery}
      />
    );

    const button = screen.getByTestId("query-loader-button");
    fireEvent.click(button);

    expect(screen.getByTestId("dropdown-menu")).toHaveAttribute("data-open", "true");

    const queryItems = screen.getAllByTestId("dropdown-item");
    const firstQueryItem = queryItems.find(item => 
      item.textContent?.includes("Test Query 1")
    );

    fireEvent.click(firstQueryItem!);

    await waitFor(() => {
      expect(screen.getByTestId("dropdown-menu")).toHaveAttribute("data-open", "false");
    });
  });
});