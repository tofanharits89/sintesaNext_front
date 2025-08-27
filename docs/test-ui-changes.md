# UI Changes Summary

## Changes Made to Kelola Query Modal

### 1. Removed Duplicate Header Title
- **File**: `src/components/inquiry-data/query-management.tsx`
- **Change**: Removed the duplicate "Kelola Query Tersimpan" title and description from the content area
- **Lines removed**: The header section with Database icon, h1 title, and description paragraph

### 2. Added Description Under Modal Header Title
- **File**: `src/app/inquiry-data/belanja/page.tsx`
- **Change**: Added description text under the DialogTitle in the modal header
- **Added**: `<p className="text-sm text-muted-foreground mt-1">Kelola dan gunakan kembali query yang telah Anda simpan</p>`

### 3. Moved Refresh Button to Modal Header
- **File**: `src/app/inquiry-data/belanja/page.tsx`
- **Change**: Moved the refresh button from the QueryManagement component content to the modal header
- **Implementation**: 
  - Added refresh button in DialogHeader with flex layout
  - Added RefreshCw import
  - Created communication mechanism between modal and QueryManagement component via onRefreshReady prop
  - Updated QueryManagement component to accept onRefreshReady prop and provide refresh function to parent

### 4. Updated QueryManagement Component Interface
- **File**: `src/components/inquiry-data/query-management.tsx`
- **Changes**:
  - Added optional `onRefreshReady?: (refreshFn: () => void) => void` prop
  - Added useEffect to provide refresh function to parent component
  - Removed the header section with duplicate title and refresh button

## Result
The modal now has:
- Single title in the modal header (no duplicate)
- Description text under the title in the modal header
- Refresh button positioned in the top-right of the modal header
- Clean content area without redundant header elements

## Files Modified
1. `frontendNEx/src/app/inquiry-data/belanja/page.tsx`
2. `frontendNEx/src/components/inquiry-data/query-management.tsx`