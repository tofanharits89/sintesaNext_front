import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { QueryManagement } from '../query-management';
import { useSavedQueries } from '@/hooks/use-saved-queries';
import type { SavedQuery } from '@/types/saved-queries';

// Mock the hook
jest.mock('@/hooks/use-saved-queries');
const mockUseSavedQueries = useSavedQueries as jest.MockedFunction<typeof useSavedQueries>;

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

// Mock components that might not be available in test environment
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, ...props }: any) => (
    <input onChange={onChange} {...props} />
  )
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h2 data-testid="card-title">{children}</h2>
}));

jest.mock('@/components/ui/loading-states', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
  SkeletonLoader: () => <div data-testid="skeleton-loader">Loading skeleton...</div>
}));

jest.mock('../query-list-item', () => ({
  QueryListItem: ({ query, onEdit, onDelete, onLoad }: any) => (
    <div data-testid={`query-item-${query.id}`}>
      <span>{query.name}</span>
      <button onClick={() => onEdit(query.id, { name: 'Updated Name' })}>Edit</button>
      <button onClick={() => onDelete(query.id)}>Delete</button>
      <button onClick={() => onLoad(query)}>Load</button>
    </div>
  )
}));

describe('QueryManagement', () => {
  const mockQueries: SavedQuery[] = [
    {
      id: 'query-1',
      name: 'Test Query 1',
      description: 'Description 1',
      reportParams: { tahun: '2024', tipeLaporan: 'bulanan', pembulatan: 'ribuan' },
      activeFilters: ['filter1'],
      filterValues: { filter1: 'value1' },
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'query-2',
      name: 'Test Query 2',
      description: 'Description 2',
      reportParams: { tahun: '2024', tipeLaporan: 'tahunan', pembulatan: 'jutaan' },
      activeFilters: ['filter2'],
      filterValues: { filter2: 'value2' },
      userId: 'user-1',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    }
  ];

  const mockPagination = {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1
  };

  const defaultMockReturn = {
    queries: mockQueries,
    pagination: mockPagination,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    createError: null,
    updateError: null,
    deleteError: null,
    createQuery: jest.fn(),
    updateQuery: jest.fn(),
    deleteQuery: jest.fn(),
    loadQuery: jest.fn(),
    refetch: jest.fn(),
    getQueryById: jest.fn(),
    mutate: jest.fn()
  };

  const mockOnLoadQuery = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSavedQueries.mockReturnValue(defaultMockReturn);
  });

  describe('Rendering', () => {
    test('should render query management interface', () => {
      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      expect(screen.getByText('Kelola Query Tersimpan')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Cari query...')).toBeInTheDocument();
      expect(screen.getByText('Test Query 1')).toBeInTheDocument();
      expect(screen.getByText('Test Query 2')).toBeInTheDocument();
    });

    test('should show loading state', () => {
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
        queries: []
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('should show empty state when no queries', () => {
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        queries: [],
        pagination: { ...mockPagination, total: 0 }
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      expect(screen.getByText('Belum ada query tersimpan')).toBeInTheDocument();
      expect(screen.getByText('Mulai dengan menyimpan query pertama Anda')).toBeInTheDocument();
    });

    test('should show error state', () => {
      const error = new Error('Failed to load queries');
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        error,
        queries: []
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      expect(screen.getByText('Gagal memuat query tersimpan')).toBeInTheDocument();
      expect(screen.getByText('Failed to load queries')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('should handle search input', async () => {
      const mockRefetch = jest.fn();
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        refetch: mockRefetch
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const searchInput = screen.getByPlaceholderText('Cari query...');
      fireEvent.change(searchInput, { target: { value: 'Test Query 1' } });

      // Should debounce the search
      await waitFor(() => {
        expect(mockUseSavedQueries).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Test Query 1'
          })
        );
      }, { timeout: 1000 });
    });

    test('should clear search', async () => {
      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const searchInput = screen.getByPlaceholderText('Cari query...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(mockUseSavedQueries).toHaveBeenCalledWith(
          expect.objectContaining({
            search: ''
          })
        );
      });
    });
  });

  describe('Query Operations', () => {
    test('should handle query edit', async () => {
      const mockUpdateQuery = jest.fn().mockResolvedValue({});
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        updateQuery: mockUpdateQuery
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(mockUpdateQuery).toHaveBeenCalledWith('query-1', { name: 'Updated Name' });
      });
    });

    test('should handle query delete', async () => {
      const mockDeleteQuery = jest.fn().mockResolvedValue(undefined);
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        deleteQuery: mockDeleteQuery
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteQuery).toHaveBeenCalledWith('query-1');
      });
    });

    test('should handle query load', () => {
      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const loadButton = screen.getAllByText('Load')[0];
      fireEvent.click(loadButton);

      expect(mockOnLoadQuery).toHaveBeenCalledWith(mockQueries[0]);
    });

    test('should handle edit errors', async () => {
      const mockUpdateQuery = jest.fn().mockRejectedValue(new Error('Update failed'));
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        updateQuery: mockUpdateQuery
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(mockUpdateQuery).toHaveBeenCalled();
      });
    });

    test('should handle delete errors', async () => {
      const mockDeleteQuery = jest.fn().mockRejectedValue(new Error('Delete failed'));
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        deleteQuery: mockDeleteQuery
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteQuery).toHaveBeenCalled();
      });
    });
  });

  describe('Bulk Operations', () => {
    test('should handle select all', () => {
      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      fireEvent.click(selectAllCheckbox);

      // Should select all queries
      expect(selectAllCheckbox).toBeChecked();
    });

    test('should handle bulk delete', async () => {
      const mockDeleteQuery = jest.fn().mockResolvedValue(undefined);
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        deleteQuery: mockDeleteQuery
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      // Select all queries
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      fireEvent.click(selectAllCheckbox);

      // Click bulk delete
      const bulkDeleteButton = screen.getByText('Hapus Terpilih');
      fireEvent.click(bulkDeleteButton);

      // Should call delete for each selected query
      await waitFor(() => {
        expect(mockDeleteQuery).toHaveBeenCalledTimes(2);
      });
    });

    test('should disable bulk operations when no queries selected', () => {
      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const bulkDeleteButton = screen.getByText('Hapus Terpilih');
      expect(bulkDeleteButton).toBeDisabled();
    });
  });

  describe('Pagination', () => {
    test('should show pagination when multiple pages', () => {
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3
        }
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      expect(screen.getByText('Halaman 1 dari 3')).toBeInTheDocument();
      expect(screen.getByText('25 total query')).toBeInTheDocument();
    });

    test('should handle page navigation', () => {
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3
        }
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const nextButton = screen.getByText('Selanjutnya');
      fireEvent.click(nextButton);

      expect(mockUseSavedQueries).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2
        })
      );
    });

    test('should disable navigation buttons appropriately', () => {
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3
        }
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const prevButton = screen.getByText('Sebelumnya');
      expect(prevButton).toBeDisabled();

      const nextButton = screen.getByText('Selanjutnya');
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', 'Cari query tersimpan');
      expect(screen.getByRole('checkbox', { name: /select all/i })).toBeInTheDocument();
    });

    test('should support keyboard navigation', () => {
      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const searchInput = screen.getByPlaceholderText('Cari query...');
      searchInput.focus();
      expect(searchInput).toHaveFocus();

      // Test tab navigation
      fireEvent.keyDown(searchInput, { key: 'Tab' });
    });
  });

  describe('Performance', () => {
    test('should debounce search input', async () => {
      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const searchInput = screen.getByPlaceholderText('Cari query...');
      
      // Type multiple characters quickly
      fireEvent.change(searchInput, { target: { value: 't' } });
      fireEvent.change(searchInput, { target: { value: 'te' } });
      fireEvent.change(searchInput, { target: { value: 'tes' } });
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should only trigger search once after debounce delay
      await waitFor(() => {
        expect(mockUseSavedQueries).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'test'
          })
        );
      }, { timeout: 1000 });
    });

    test('should handle rapid state changes', async () => {
      const { rerender } = render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      // Simulate rapid loading state changes
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      });

      rerender(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        isLoading: false
      });

      rerender(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      expect(screen.getByText('Test Query 1')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should show retry button on error', () => {
      const mockRefetch = jest.fn();
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        error: new Error('Network error'),
        queries: [],
        refetch: mockRefetch
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      const retryButton = screen.getByText('Coba Lagi');
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });

    test('should handle network errors gracefully', () => {
      mockUseSavedQueries.mockReturnValue({
        ...defaultMockReturn,
        error: new Error('Network connection failed'),
        queries: []
      });

      render(<QueryManagement onLoadQuery={mockOnLoadQuery} />);

      expect(screen.getByText('Gagal memuat query tersimpan')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });
  });
});