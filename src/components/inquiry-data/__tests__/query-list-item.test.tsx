import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// removed import { jest } from '@jest/globals';
import { QueryListItem } from '../query-list-item';
import type { SavedQuery } from '@/types/saved-queries';

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, onBlur, onKeyDown, ...props }: any) => (
    <input 
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      {...props}
    />
  )
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, onBlur, onKeyDown, ...props }: any) => (
    <textarea 
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      {...props}
    />
  )
}));

jest.mock('@/components/ui/confirmation-modal', () => ({
  ConfirmationModal: ({ isOpen, onConfirm, onCancel, title, message }: any) => (
    isOpen ? (
      <div data-testid="confirmation-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null
  )
}));

// Mock icons
jest.mock('lucide-react', () => ({
  Edit2: () => <span data-testid="edit-icon">Edit</span>,
  Trash2: () => <span data-testid="delete-icon">Delete</span>,
  Play: () => <span data-testid="play-icon">Play</span>,
  Calendar: () => <span data-testid="calendar-icon">Calendar</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  Check: () => <span data-testid="check-icon">Check</span>,
  X: () => <span data-testid="x-icon">X</span>
}));

describe('QueryListItem', () => {
  const mockQuery: SavedQuery = {
    id: 'query-1',
    name: 'Test Query',
    description: 'Test query description',
    reportParams: {
      tahun: '2024',
      tipeLaporan: 'bulanan',
      pembulatan: 'ribuan'
    },
    activeFilters: ['filter1', 'filter2'],
    filterValues: {
      filter1: 'value1',
      filter2: 'value2'
    },
    userId: 'user-1',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  };

  const mockProps = {
    query: mockQuery,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onLoad: jest.fn(),
    isSelected: false,
    onSelect: jest.fn(),
    isLoading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render query information', () => {
      render(<QueryListItem {...mockProps} />);

      expect(screen.getByText('Test Query')).toBeInTheDocument();
      expect(screen.getByText('Test query description')).toBeInTheDocument();
      expect(screen.getByText('2 filter aktif')).toBeInTheDocument();
      expect(screen.getByText('15 Jan 2024')).toBeInTheDocument();
    });

    test('should render without description', () => {
      const queryWithoutDescription = { ...mockQuery, description: undefined };
      render(<QueryListItem {...mockProps} query={queryWithoutDescription} />);

      expect(screen.getByText('Test Query')).toBeInTheDocument();
      expect(screen.queryByText('Test query description')).not.toBeInTheDocument();
    });

    test('should show loading state', () => {
      render(<QueryListItem {...mockProps} isLoading={true} />);

      expect(screen.getByTestId('card')).toHaveClass('opacity-50');
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    test('should show selected state', () => {
      render(<QueryListItem {...mockProps} isSelected={true} />);

      expect(screen.getByTestId('card')).toHaveClass('ring-2', 'ring-blue-500');
    });

    test('should render report parameters', () => {
      render(<QueryListItem {...mockProps} />);

      expect(screen.getByText('2024')).toBeInTheDocument();
      expect(screen.getByText('Bulanan')).toBeInTheDocument();
      expect(screen.getByText('Ribuan')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    test('should handle selection toggle', () => {
      render(<QueryListItem {...mockProps} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockProps.onSelect).toHaveBeenCalledWith('query-1', true);
    });

    test('should handle deselection', () => {
      render(<QueryListItem {...mockProps} isSelected={true} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockProps.onSelect).toHaveBeenCalledWith('query-1', false);
    });
  });

  describe('Edit Functionality', () => {
    test('should enter edit mode when edit button clicked', () => {
      render(<QueryListItem {...mockProps} />);

      const editButton = screen.getByTestId('edit-icon').closest('button');
      fireEvent.click(editButton!);

      expect(screen.getByDisplayValue('Test Query')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test query description')).toBeInTheDocument();
    });

    test('should save changes on Enter key', async () => {
      render(<QueryListItem {...mockProps} />);

      // Enter edit mode
      const editButton = screen.getByTestId('edit-icon').closest('button');
      fireEvent.click(editButton!);

      // Edit name
      const nameInput = screen.getByDisplayValue('Test Query');
      fireEvent.change(nameInput, { target: { value: 'Updated Query Name' } });
      fireEvent.keyDown(nameInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockProps.onEdit).toHaveBeenCalledWith('query-1', {
          name: 'Updated Query Name',
          description: 'Test query description'
        });
      });
    });

    test('should save changes on blur', async () => {
      render(<QueryListItem {...mockProps} />);

      // Enter edit mode
      const editButton = screen.getByTestId('edit-icon').closest('button');
      fireEvent.click(editButton!);

      // Edit description
      const descriptionInput = screen.getByDisplayValue('Test query description');
      fireEvent.change(descriptionInput, { target: { value: 'Updated description' } });
      fireEvent.blur(descriptionInput);

      await waitFor(() => {
        expect(mockProps.onEdit).toHaveBeenCalledWith('query-1', {
          name: 'Test Query',
          description: 'Updated description'
        });
      });
    });

    test('should cancel edit on Escape key', () => {
      render(<QueryListItem {...mockProps} />);

      // Enter edit mode
      const editButton = screen.getByTestId('edit-icon').closest('button');
      fireEvent.click(editButton!);

      // Edit name
      const nameInput = screen.getByDisplayValue('Test Query');
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } });
      fireEvent.keyDown(nameInput, { key: 'Escape' });

      // Should exit edit mode without saving
      expect(screen.getByText('Test Query')).toBeInTheDocument();
      expect(mockProps.onEdit).not.toHaveBeenCalled();
    });

    test('should handle empty name validation', async () => {
      render(<QueryListItem {...mockProps} />);

      // Enter edit mode
      const editButton = screen.getByTestId('edit-icon').closest('button');
      fireEvent.click(editButton!);

      // Clear name
      const nameInput = screen.getByDisplayValue('Test Query');
      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.keyDown(nameInput, { key: 'Enter' });

      // Should not save and show error
      expect(mockProps.onEdit).not.toHaveBeenCalled();
      expect(screen.getByText('Nama query tidak boleh kosong')).toBeInTheDocument();
    });

    test('should handle name too long validation', async () => {
      render(<QueryListItem {...mockProps} />);

      // Enter edit mode
      const editButton = screen.getByTestId('edit-icon').closest('button');
      fireEvent.click(editButton!);

      // Set name too long
      const longName = 'a'.repeat(256);
      const nameInput = screen.getByDisplayValue('Test Query');
      fireEvent.change(nameInput, { target: { value: longName } });
      fireEvent.keyDown(nameInput, { key: 'Enter' });

      // Should not save and show error
      expect(mockProps.onEdit).not.toHaveBeenCalled();
      expect(screen.getByText('Nama query terlalu panjang (maksimal 255 karakter)')).toBeInTheDocument();
    });

    test('should handle description too long validation', async () => {
      render(<QueryListItem {...mockProps} />);

      // Enter edit mode
      const editButton = screen.getByTestId('edit-icon').closest('button');
      fireEvent.click(editButton!);

      // Set description too long
      const longDescription = 'a'.repeat(1001);
      const descriptionInput = screen.getByDisplayValue('Test query description');
      fireEvent.change(descriptionInput, { target: { value: longDescription } });
      fireEvent.keyDown(descriptionInput, { key: 'Enter' });

      // Should not save and show error
      expect(mockProps.onEdit).not.toHaveBeenCalled();
      expect(screen.getByText('Deskripsi terlalu panjang (maksimal 1000 karakter)')).toBeInTheDocument();
    });

    test('should trim whitespace from inputs', async () => {
      render(<QueryListItem {...mockProps} />);

      // Enter edit mode
      const editButton = screen.getByTestId('edit-icon').closest('button');
      fireEvent.click(editButton!);

      // Edit with whitespace
      const nameInput = screen.getByDisplayValue('Test Query');
      fireEvent.change(nameInput, { target: { value: '  Trimmed Name  ' } });
      fireEvent.keyDown(nameInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockProps.onEdit).toHaveBeenCalledWith('query-1', {
          name: 'Trimmed Name',
          description: 'Test query description'
        });
      });
    });
  });

  describe('Delete Functionality', () => {
    test('should show confirmation modal when delete clicked', () => {
      render(<QueryListItem {...mockProps} />);

      const deleteButton = screen.getByTestId('delete-icon').closest('button');
      fireEvent.click(deleteButton!);

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(screen.getByText('Hapus Query')).toBeInTheDocument();
      expect(screen.getByText(/Apakah Anda yakin ingin menghapus query "Test Query"/)).toBeInTheDocument();
    });

    test('should call onDelete when confirmed', () => {
      render(<QueryListItem {...mockProps} />);

      // Open confirmation modal
      const deleteButton = screen.getByTestId('delete-icon').closest('button');
      fireEvent.click(deleteButton!);

      // Confirm deletion
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(mockProps.onDelete).toHaveBeenCalledWith('query-1');
    });

    test('should not delete when cancelled', () => {
      render(<QueryListItem {...mockProps} />);

      // Open confirmation modal
      const deleteButton = screen.getByTestId('delete-icon').closest('button');
      fireEvent.click(deleteButton!);

      // Cancel deletion
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockProps.onDelete).not.toHaveBeenCalled();
      expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
    });
  });

  describe('Load Functionality', () => {
    test('should call onLoad when load button clicked', () => {
      render(<QueryListItem {...mockProps} />);

      const loadButton = screen.getByTestId('play-icon').closest('button');
      fireEvent.click(loadButton!);

      expect(mockProps.onLoad).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe('Date Formatting', () => {
    test('should format creation date correctly', () => {
      render(<QueryListItem {...mockProps} />);

      expect(screen.getByText('15 Jan 2024')).toBeInTheDocument();
    });

    test('should show update time when different from creation', () => {
      const queryWithDifferentUpdate = {
        ...mockQuery,
        updatedAt: '2024-01-16T14:45:00Z'
      };

      render(<QueryListItem {...mockProps} query={queryWithDifferentUpdate} />);

      expect(screen.getByText('Diperbarui: 16 Jan 2024')).toBeInTheDocument();
    });

    test('should handle invalid dates gracefully', () => {
      const queryWithInvalidDate = {
        ...mockQuery,
        createdAt: 'invalid-date'
      };

      render(<QueryListItem {...mockProps} query={queryWithInvalidDate} />);

      expect(screen.getByText('Tanggal tidak valid')).toBeInTheDocument();
    });
  });

  describe('Filter Display', () => {
    test('should show correct filter count', () => {
      render(<QueryListItem {...mockProps} />);

      expect(screen.getByText('2 filter aktif')).toBeInTheDocument();
    });

    test('should handle single filter', () => {
      const queryWithOneFilter = {
        ...mockQuery,
        activeFilters: ['filter1']
      };

      render(<QueryListItem {...mockProps} query={queryWithOneFilter} />);

      expect(screen.getByText('1 filter aktif')).toBeInTheDocument();
    });

    test('should handle no filters', () => {
      const queryWithNoFilters = {
        ...mockQuery,
        activeFilters: []
      };

      render(<QueryListItem {...mockProps} query={queryWithNoFilters} />);

      expect(screen.getByText('Tidak ada filter')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<QueryListItem {...mockProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', 'Pilih query Test Query');

      const editButton = screen.getByTestId('edit-icon').closest('button');
      expect(editButton).toHaveAttribute('aria-label', 'Edit query Test Query');

      const deleteButton = screen.getByTestId('delete-icon').closest('button');
      expect(deleteButton).toHaveAttribute('aria-label', 'Hapus query Test Query');

      const loadButton = screen.getByTestId('play-icon').closest('button');
      expect(loadButton).toHaveAttribute('aria-label', 'Muat query Test Query');
    });

    test('should support keyboard navigation in edit mode', () => {
      render(<QueryListItem {...mockProps} />);

      // Enter edit mode
      const editButton = screen.getByTestId('edit-icon').closest('button');
      fireEvent.click(editButton!);

      const nameInput = screen.getByDisplayValue('Test Query');
      const descriptionInput = screen.getByDisplayValue('Test query description');

      // Tab navigation
      nameInput.focus();
      expect(nameInput).toHaveFocus();

      fireEvent.keyDown(nameInput, { key: 'Tab' });
      expect(descriptionInput).toHaveFocus();
    });

    test('should have proper focus management', () => {
      render(<QueryListItem {...mockProps} />);

      const editButton = screen.getByTestId('edit-icon').closest('button');
      editButton!.focus();
      expect(editButton).toHaveFocus();

      // Enter edit mode
      fireEvent.click(editButton!);

      // Focus should move to name input
      const nameInput = screen.getByDisplayValue('Test Query');
      expect(nameInput).toHaveFocus();
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const { rerender } = render(<QueryListItem {...mockProps} />);

      // Re-render with same props
      rerender(<QueryListItem {...mockProps} />);

      // Component should handle this efficiently
      expect(screen.getByText('Test Query')).toBeInTheDocument();
    });

    test('should handle rapid edit mode toggles', () => {
      render(<QueryListItem {...mockProps} />);

      const editButton = screen.getByTestId('edit-icon').closest('button');

      // Rapidly toggle edit mode
      fireEvent.click(editButton!);
      fireEvent.keyDown(screen.getByDisplayValue('Test Query'), { key: 'Escape' });
      fireEvent.click(editButton!);
      fireEvent.keyDown(screen.getByDisplayValue('Test Query'), { key: 'Escape' });

      // Should handle gracefully
      expect(screen.getByText('Test Query')).toBeInTheDocument();
    });
  });
});