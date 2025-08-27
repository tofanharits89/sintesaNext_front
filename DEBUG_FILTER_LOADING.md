# Debug Filter Loading Issue

## Problem
Filter loading works from "Kelola Query" modal but not from "Muat Query" dropdown on the main page.

## Debugging Added

I've added console.log statements to track the data flow:

### 1. Main Page State Changes
**File**: `frontendNEx/src/app/inquiry-data/belanja/page.tsx`
- Added logging in `onStateChange` callback to see when and what state is being updated

### 2. EnhancedFilterCard Props
**File**: `frontendNEx/src/components/inquiry-data/enhanced-filter-card.tsx`
- Added logging to see what `activeFilterValues` and `currentFilterValue` are being passed

### 3. FilterCard State Sync
**File**: `frontendNEx/src/components/inquiry-data/filter-card.tsx`
- Added logging in the `useEffect` that syncs external values with internal state

## How to Test

1. **Create a test query**:
   - Set cutOff to "09" (September)
   - Set kementerian to "001" (specific selection)
   - Save the query with a recognizable name like "Test Dropdown Loading"

2. **Test Modal Loading (should work)**:
   - Click "Kelola Query" button
   - Click the play button on your test query
   - Check browser console for debug logs
   - Verify filters show "09" and "001"

3. **Test Dropdown Loading (currently broken)**:
   - Click "Muat Query" dropdown
   - Select your test query
   - Check browser console for debug logs
   - Compare the logs with modal loading

## What to Look For

### Expected Log Sequence:
1. `[BelanjaPage] onStateChange called with:` - Shows state update
2. `[EnhancedFilterCard-cutOff] Rendering with:` - Shows props received
3. `[EnhancedFilterCard-kementerian] Rendering with:` - Shows props received
4. `[FilterCard-cutOff] useEffect triggered:` - Shows internal state sync
5. `[FilterCard-kementerian] useEffect triggered:` - Shows internal state sync

### Key Things to Check:
- Are both paths calling `onStateChange`?
- Are the `currentFilterValue` props being passed correctly?
- Are the `useEffect` hooks in FilterCard being triggered?
- Are there any differences in the data between modal and dropdown paths?

## Potential Issues to Identify

1. **State Update Issue**: `onStateChange` not called from dropdown path
2. **Prop Passing Issue**: `currentFilterValue` not passed correctly
3. **Timing Issue**: State updates happening but components not re-rendering
4. **React Batching Issue**: State updates being batched differently

## Next Steps Based on Logs

### If `onStateChange` is not called:
- Issue is in the query loading logic before reaching components

### If `onStateChange` is called but props not passed:
- Issue is in the prop passing chain (DynamicFiltersCard → EnhancedFilterCard → FilterCard)

### If props are passed but `useEffect` not triggered:
- Issue is with React dependencies or timing

### If `useEffect` is triggered but UI not updated:
- Issue is with the internal state update or rendering

## Cleanup

After debugging, remove the console.log statements by reverting the changes to:
- `frontendNEx/src/app/inquiry-data/belanja/page.tsx`
- `frontendNEx/src/components/inquiry-data/enhanced-filter-card.tsx`
- `frontendNEx/src/components/inquiry-data/filter-card.tsx`