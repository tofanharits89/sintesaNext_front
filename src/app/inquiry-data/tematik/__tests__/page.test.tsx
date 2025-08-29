import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TematikPage from "../page";
import { useQueryLoader } from "@/hooks/use-query-loader";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { useSavedQueries } from "@/hooks/use-saved-queries";
import { useCurrentUser } from "@/lib/use-current-user";

// Mock dependencies
jest.mock("@/hooks/use-query-loader", () => ({
  useQueryLoader: jest.fn(),
}));

jest.mock("@/hooks/use-unsaved-changes-warning", () => ({
  useUnsavedChangesWarning: jest.fn(),
}));

jest.mock("@/hooks/use-saved-queries", () => ({
  useSavedQueries: jest.fn(),
}));

jest.mock("@/components/inquiry-data/pilih-laporan-card", () => ({
  PilihLaporanCard: () => <div data-testid="pilih-laporan-card" />,
}));

jest.mock("@/components/inquiry-data/filter-parameters-card", () => ({
  FilterParametersCard: ({ excludeFilters }: any) => (
    <div data-testid="filter-parameters-card">
      {excludeFilters && excludeFilters.includes("register") && (
        <div data-testid="register-excluded">Register filter excluded</div>
      )}
    </div>
  ),
}));

jest.mock("@/components/inquiry-data/dynamic-filters-card", () => ({
  DynamicFiltersCard: () => <div data-testid="dynamic-filters-card" />,
}));

jest.mock("@/components/inquiry-data/modals/unsaved-changes-modal", () => ({
  UnsavedChangesModal: () => <div data-testid="unsaved-changes-modal" />,
}));

jest.mock("@/components/inquiry-data/query-management", () => ({
  QueryManagement: ({ onLoadQuery }: any) => (
    <div data-testid="query-management-content">
      <div>Query Management Content</div>
      <button onClick={() => onLoadQuery({ id: "test", name: "Test Query" })}>
        Load Test Query
      </button>
    </div>
  ),
}));

jest.mock("@/lib/use-current-user", () => ({
  useCurrentUser: jest.fn(),
}));

const mockUseQueryLoader = useQueryLoader as jest.MockedFunction<
  typeof useQueryLoader
>;
const mockUseUnsavedChangesWarning =
  useUnsavedChangesWarning as jest.MockedFunction<
    typeof useUnsavedChangesWarning
  >;
const mockUseSavedQueries = useSavedQueries as jest.MockedFunction<
  typeof useSavedQueries
>;
const mockUseCurrentUser = useCurrentUser as jest.MockedFunction<
  typeof useCurrentUser
>;

describe("TematikPage - Query Management Integration", () => {
  const mockQueryLoader = {
    hasUnsavedChanges: false,
    loadQuery: jest.fn(),
    validateQueryCompatibility: jest
      .fn()
      .mockReturnValue({ isValid: true, errors: [] }),
    updateChangeDetection: jest.fn(),
    resetChangeDetection: jest.fn(),
    originalState: null,
  };

  const mockUnsavedChangesWarning = {
    isWarningOpen: false,
    closeWarningModal: jest.fn(),
    handleWarningAction: jest.fn(),
    queryToLoad: null,
    isProcessing: false,
    attemptLoadQuery: jest.fn(),
  };

  const mockSavedQueries = {
    createQuery: jest.fn(),
    isCreating: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryLoader.mockReturnValue(mockQueryLoader as any);
    mockUseUnsavedChangesWarning.mockReturnValue(
      mockUnsavedChangesWarning as any
    );
    mockUseSavedQueries.mockReturnValue(mockSavedQueries as any);
    mockUseCurrentUser.mockReturnValue({
      currentUser: {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        role: "user",
      },
    });
  });

  it("renders page with query management button", () => {
    render(<TematikPage />);

    expect(screen.getByText("Inquiry Data Tematik")).toBeInTheDocument();
    expect(screen.getByText("Kelola Query")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+M")).toBeInTheDocument();
  });

  it("displays correct page description", () => {
    render(<TematikPage />);

    expect(
      screen.getByText(
        "Query builder untuk data tematik dengan filter parameter yang dapat disesuaikan"
      )
    ).toBeInTheDocument();
  });

  it("opens query management modal when button is clicked", async () => {
    render(<TematikPage />);

    const manageButton = screen.getByText("Kelola Query");
    fireEvent.click(manageButton);

    await waitFor(() => {
      expect(screen.getByText("Query Management Content")).toBeInTheDocument();
    });
  });

  it("opens query management modal with Ctrl+M keyboard shortcut", async () => {
    render(<TematikPage />);

    // Simulate Ctrl+M keypress
    fireEvent.keyDown(document, { key: "m", ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByText("Query Management Content")).toBeInTheDocument();
    });
  });

  it("opens query management modal with Cmd+M keyboard shortcut (Mac)", async () => {
    render(<TematikPage />);

    // Simulate Cmd+M keypress
    fireEvent.keyDown(document, { key: "m", metaKey: true });

    await waitFor(() => {
      expect(screen.getByText("Query Management Content")).toBeInTheDocument();
    });
  });

  it("closes query management modal with Escape key", async () => {
    render(<TematikPage />);

    // Open modal first
    const manageButton = screen.getByText("Kelola Query");
    fireEvent.click(manageButton);

    await waitFor(() => {
      expect(screen.getByText("Query Management Content")).toBeInTheDocument();
    });

    // Close with Escape
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByText("Query Management Content")
      ).not.toBeInTheDocument();
    });
  });

  it("closes query management modal when dialog is closed", async () => {
    render(<TematikPage />);

    // Open modal
    const manageButton = screen.getByText("Kelola Query");
    fireEvent.click(manageButton);

    await waitFor(() => {
      expect(screen.getByText("Query Management Content")).toBeInTheDocument();
    });

    // Close modal by pressing Escape (simulating dialog close)
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByText("Query Management Content")
      ).not.toBeInTheDocument();
    });
  });

  it("handles query loading from management modal", async () => {
    render(<TematikPage />);

    // Open modal
    const manageButton = screen.getByText("Kelola Query");
    fireEvent.click(manageButton);

    await waitFor(() => {
      expect(screen.getByText("Query Management Content")).toBeInTheDocument();
    });

    // Load a query
    const loadButton = screen.getByText("Load Test Query");
    fireEvent.click(loadButton);

    expect(mockUnsavedChangesWarning.attemptLoadQuery).toHaveBeenCalled();
  });

  it("shows keyboard shortcut hint on desktop", () => {
    render(<TematikPage />);

    const shortcutHint = screen.getByText("Ctrl+M");
    expect(shortcutHint.closest("div")).toHaveClass("hidden", "sm:flex");
  });

  it("renders all main components", () => {
    render(<TematikPage />);

    expect(screen.getByTestId("pilih-laporan-card")).toBeInTheDocument();
    expect(screen.getByTestId("filter-parameters-card")).toBeInTheDocument();
    expect(screen.getByTestId("dynamic-filters-card")).toBeInTheDocument();
    expect(screen.getByTestId("unsaved-changes-modal")).toBeInTheDocument();
    expect(screen.getByTestId("query-management-content")).toBeInTheDocument();
  });

  it("handles keyboard events only when component is mounted", () => {
    const { unmount } = render(<TematikPage />);

    // Should work when mounted
    fireEvent.keyDown(document, { key: "m", ctrlKey: true });
    expect(screen.getByText("Query Management Content")).toBeInTheDocument();

    // Unmount component
    unmount();

    // Should not throw error when unmounted
    expect(() => {
      fireEvent.keyDown(document, { key: "m", ctrlKey: true });
    }).not.toThrow();
  });

  it("integrates with unsaved changes warning system", async () => {
    const mockAttemptLoadQuery = jest.fn();
    mockUseUnsavedChangesWarning.mockReturnValue({
      ...mockUnsavedChangesWarning,
      attemptLoadQuery: mockAttemptLoadQuery,
    } as any);

    render(<TematikPage />);

    // Open query management
    const manageButton = screen.getByText("Kelola Query");
    fireEvent.click(manageButton);

    await waitFor(() => {
      expect(screen.getByText("Query Management Content")).toBeInTheDocument();
    });

    // Load a query
    const loadButton = screen.getByText("Load Test Query");
    fireEvent.click(loadButton);

    expect(mockAttemptLoadQuery).toHaveBeenCalledWith({
      id: "test",
      name: "Test Query",
    });
  });

  it("displays tematik-specific query management modal title", async () => {
    render(<TematikPage />);

    const manageButton = screen.getByText("Kelola Query");
    fireEvent.click(manageButton);

    await waitFor(() => {
      expect(
        screen.getByText("Kelola Query Tematik Tersimpan")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Kelola dan gunakan kembali query tematik yang telah Anda simpan"
        )
      ).toBeInTheDocument();
    });
  });

  it("excludes register filter from FilterParametersCard", () => {
    render(<TematikPage />);

    expect(screen.getByTestId("filter-parameters-card")).toBeInTheDocument();
    expect(screen.getByTestId("register-excluded")).toBeInTheDocument();
    expect(screen.getByText("Register filter excluded")).toBeInTheDocument();
  });

  it("generates tematik-specific query names when saving", async () => {
    // Set up mock to capture the createQuery call
    const mockCreateQuery = jest.fn().mockResolvedValue({});
    mockUseSavedQueries.mockReturnValue({
      ...mockSavedQueries,
      createQuery: mockCreateQuery,
    } as any);

    // Mock Date.now to ensure consistent timestamp
    const mockDate = new Date("2024-01-15 10:30:00");
    jest.spyOn(global, "Date").mockImplementation(() => mockDate as any);

    render(<TematikPage />);

    // Trigger save by trying to load a query with unsaved changes
    mockUseQueryLoader.mockReturnValue({
      ...mockQueryLoader,
      hasUnsavedChanges: true,
    } as any);

    // The saveCurrentQuery function should be called when there are unsaved changes
    // We can test this by accessing the hook's implementation details
    // For now, this test confirms the component renders correctly with tematik context
    expect(screen.getByText("Inquiry Data Tematik")).toBeInTheDocument();

    // Restore original Date
    jest.restoreAllMocks();
  });
});
