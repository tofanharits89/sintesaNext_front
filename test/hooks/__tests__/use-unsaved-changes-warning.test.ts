import { renderHook, act } from "@testing-library/react";
import { useUnsavedChangesWarning } from "../use-unsaved-changes-warning";
import type { SavedQuery } from "@/types/saved-queries";
import type { UnsavedChangesAction } from "@/components/inquiry-data/modals/unsaved-changes-modal";

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock data
const mockSavedQuery: SavedQuery = {
  id: "test-query-1",
  name: "Test Query",
  description: "Test query description",
  reportParams: {
    tahun: "2024",
    tipeLaporan: "pagu_realisasi",
    pembulatan: "satuan",
    jenisAkumulasi: "non_akumulatif"
  },
  activeFilters: ["cutOff", "kodeKementerian"],
  filterValues: {
    cutOff: {
      selection: "12",
      kondisiCode: "equals",
      mengandungKata: "",
      jenisTampilan: "kode"
    }
  },
  userId: "user-1",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
};

describe("useUnsavedChangesWarning", () => {
  let mockOnSaveCurrentQuery: jest.Mock;
  let mockOnLoadQuery: jest.Mock;
  let mockOnDiscardChanges: jest.Mock;

  beforeEach(() => {
    mockOnSaveCurrentQuery = jest.fn();
    mockOnLoadQuery = jest.fn();
    mockOnDiscardChanges = jest.fn();
    jest.clearAllMocks();
  });

  describe("attemptLoadQuery", () => {
    it("should load query directly when no unsaved changes", async () => {
      mockOnLoadQuery.mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: false,
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      let loadResult: boolean = false;
      await act(async () => {
        loadResult = await result.current.attemptLoadQuery(mockSavedQuery);
      });

      expect(loadResult).toBe(true);
      expect(mockOnLoadQuery).toHaveBeenCalledWith(mockSavedQuery);
      expect(result.current.isWarningOpen).toBe(false);
    });

    it("should show warning modal when there are unsaved changes", async () => {
      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: true,
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      let loadResult: boolean = false;
      await act(async () => {
        loadResult = await result.current.attemptLoadQuery(mockSavedQuery);
      });

      expect(loadResult).toBe(false);
      expect(mockOnLoadQuery).not.toHaveBeenCalled();
      expect(result.current.isWarningOpen).toBe(true);
      expect(result.current.queryToLoad).toEqual(mockSavedQuery);
    });

    it("should handle load query errors gracefully", async () => {
      mockOnLoadQuery.mockResolvedValue({ 
        success: false, 
        errors: ["Validation error"] 
      });

      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: false,
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      let loadResult: boolean = false;
      await act(async () => {
        loadResult = await result.current.attemptLoadQuery(mockSavedQuery);
      });

      expect(loadResult).toBe(false);
      expect(mockOnLoadQuery).toHaveBeenCalledWith(mockSavedQuery);
    });

    it("should handle load query exceptions", async () => {
      mockOnLoadQuery.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: false,
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      let loadResult: boolean = false;
      await act(async () => {
        loadResult = await result.current.attemptLoadQuery(mockSavedQuery);
      });

      expect(loadResult).toBe(false);
    });
  });

  describe("handleWarningAction", () => {
    it("should handle save_and_load action successfully", async () => {
      mockOnSaveCurrentQuery.mockResolvedValue({ success: true });
      mockOnLoadQuery.mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: true,
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      // First show the warning
      await act(async () => {
        await result.current.attemptLoadQuery(mockSavedQuery);
      });

      expect(result.current.isWarningOpen).toBe(true);

      // Then handle save and load action
      const action: UnsavedChangesAction = { 
        type: "save_and_load", 
        queryToLoad: mockSavedQuery 
      };

      await act(async () => {
        await result.current.handleWarningAction(action);
      });

      expect(mockOnSaveCurrentQuery).toHaveBeenCalled();
      expect(mockOnLoadQuery).toHaveBeenCalledWith(mockSavedQuery);
      expect(result.current.isWarningOpen).toBe(false);
    });

    it("should handle save failure in save_and_load action", async () => {
      mockOnSaveCurrentQuery.mockResolvedValue({ 
        success: false, 
        error: "Save failed" 
      });

      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: true,
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      // First show the warning
      await act(async () => {
        await result.current.attemptLoadQuery(mockSavedQuery);
      });

      // Then handle save and load action
      const action: UnsavedChangesAction = { 
        type: "save_and_load", 
        queryToLoad: mockSavedQuery 
      };

      await act(async () => {
        await result.current.handleWarningAction(action);
      });

      expect(mockOnSaveCurrentQuery).toHaveBeenCalled();
      expect(mockOnLoadQuery).not.toHaveBeenCalled();
      expect(result.current.isWarningOpen).toBe(true); // Modal should stay open
      expect(result.current.isProcessing).toBe(false);
    });

    it("should handle discard_and_load action successfully", async () => {
      mockOnLoadQuery.mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: true,
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      // First show the warning
      await act(async () => {
        await result.current.attemptLoadQuery(mockSavedQuery);
      });

      // Then handle discard and load action
      const action: UnsavedChangesAction = { 
        type: "discard_and_load", 
        queryToLoad: mockSavedQuery 
      };

      await act(async () => {
        await result.current.handleWarningAction(action);
      });

      expect(mockOnDiscardChanges).toHaveBeenCalled();
      expect(mockOnLoadQuery).toHaveBeenCalledWith(mockSavedQuery);
      expect(result.current.isWarningOpen).toBe(false);
    });

    it("should handle cancel action", async () => {
      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: true,
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      // First show the warning
      await act(async () => {
        await result.current.attemptLoadQuery(mockSavedQuery);
      });

      expect(result.current.isWarningOpen).toBe(true);

      // Then handle cancel action
      const action: UnsavedChangesAction = { type: "cancel" };

      await act(async () => {
        await result.current.handleWarningAction(action);
      });

      expect(mockOnSaveCurrentQuery).not.toHaveBeenCalled();
      expect(mockOnLoadQuery).not.toHaveBeenCalled();
      expect(result.current.isWarningOpen).toBe(false);
    });

    it("should handle action errors gracefully", async () => {
      mockOnSaveCurrentQuery.mockRejectedValue(new Error("Save error"));

      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: true,
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      // First show the warning
      await act(async () => {
        await result.current.attemptLoadQuery(mockSavedQuery);
      });

      // Then handle save and load action that will throw
      const action: UnsavedChangesAction = { 
        type: "save_and_load", 
        queryToLoad: mockSavedQuery 
      };

      await act(async () => {
        await result.current.handleWarningAction(action);
      });

      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe("forceLoadQuery", () => {
    it("should load query without checking unsaved changes", async () => {
      mockOnLoadQuery.mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: true, // Even with unsaved changes
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      let loadResult: boolean = false;
      await act(async () => {
        loadResult = await result.current.forceLoadQuery(mockSavedQuery);
      });

      expect(loadResult).toBe(true);
      expect(mockOnLoadQuery).toHaveBeenCalledWith(mockSavedQuery);
      expect(result.current.isWarningOpen).toBe(false);
    });

    it("should handle force load errors", async () => {
      mockOnLoadQuery.mockResolvedValue({ 
        success: false, 
        errors: ["Load error"] 
      });

      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: true,
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      let loadResult: boolean = false;
      await act(async () => {
        loadResult = await result.current.forceLoadQuery(mockSavedQuery);
      });

      expect(loadResult).toBe(false);
    });
  });

  describe("closeWarningModal", () => {
    it("should close modal when not processing", async () => {
      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: true,
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      // First show the warning
      await act(async () => {
        await result.current.attemptLoadQuery(mockSavedQuery);
      });

      expect(result.current.isWarningOpen).toBe(true);

      // Close the modal
      act(() => {
        result.current.closeWarningModal();
      });

      expect(result.current.isWarningOpen).toBe(false);
    });

    it("should not close modal when processing", async () => {
      mockOnSaveCurrentQuery.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      mockOnLoadQuery.mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useUnsavedChangesWarning({
          hasUnsavedChanges: true,
          onSaveCurrentQuery: mockOnSaveCurrentQuery,
          onLoadQuery: mockOnLoadQuery,
          onDiscardChanges: mockOnDiscardChanges,
        })
      );

      // First show the warning
      await act(async () => {
        await result.current.attemptLoadQuery(mockSavedQuery);
      });

      // Start processing (don't await)
      const action: UnsavedChangesAction = { 
        type: "save_and_load", 
        queryToLoad: mockSavedQuery 
      };
      
      act(() => {
        result.current.handleWarningAction(action);
      });

      // Try to close while processing
      act(() => {
        result.current.closeWarningModal();
      });

      expect(result.current.isWarningOpen).toBe(true); // Should still be open
    });
  });
});
