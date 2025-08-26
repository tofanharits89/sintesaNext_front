# Query Builder System Documentation

## Overview

The Query Builder system for Inquiry Data Belanja provides a modular and scalable solution for building dynamic SQL queries based on user-selected filters. The system encrypts queries before sending them to the backend for security and provides real-time SQL preview for admin users.

## Architecture

### Frontend Components

1. **Query Builder Hook** (`src/hooks/use-inquiry-query-builder.ts`)
   - Core logic for building SQL queries
   - Handles table mapping based on report types
   - Manages SELECT, WHERE, JOIN, GROUP BY, and ORDER BY clauses
   - Provides query encryption/decryption

2. **API Communication Hook** (`src/hooks/use-inquiry-data-api.ts`)
   - Handles API communication for query execution
   - Manages CSV and Excel downloads
   - Provides loading states and error handling

3. **Enhanced Filter Card** (`src/components/inquiry-data/enhanced-filter-card.tsx`)
   - Wrapper for the existing FilterCard component
   - Manages filter state and communicates with parent components

4. **Query Results Modal** (`src/components/inquiry-data/modals/query-results-modal.tsx`)
   - Displays query results in a paginated table
   - Provides search and sorting functionality
   - Handles CSV and Excel export

5. **Updated SQL Modal** (`src/components/inquiry-data/modals/lihat-sql-modal.tsx`)
   - Shows real-time generated SQL queries
   - Available only for admin users
   - Provides copy and download functionality

### Backend API

**Endpoint**: `/api/inquiry-data/query`

- **POST**: Execute encrypted queries
- **GET**: Health check and connection test

## Table Mapping

The system maps report types to their corresponding database tables:

| Report Type | Table Name Pattern |
|-------------|-------------------|
| Pagu APBN | `monev{year}.pagu_real_detail_harian_dipa_apbn_{year}` |
| Pagu Realisasi | `monev{year}.pagu_real_detail_harian_{year}` |
| Pagu Realisasi Bulanan | `monev{year}.pagu_real_detail_harian_{year}` |
| Pergerakan Pagu Bulanan | `monev{year}.pagu_real_detail_bulan_{year}` |
| Pergerakan Blokir Bulanan | `monev{year}.pagu_real_detail_bulan_{year}` |
| Pergerakan Blokir Bulanan Per Jenis | `monev{year}.pa_pagu_blokir_akun_{year}_bulanan` |
| Volume Output Kegiatan | `monev{year}.pagu_output_{year}_new` |

## Filter Configuration

Each filter has a configuration that defines:

- **columnName**: Database column name
- **referenceTable**: Reference table for descriptions (optional)
- **referenceDatabase**: Database containing reference table (usually `dbref`)
- **joinKey**: Column used for joining with reference table
- **nameColumn**: Column containing description text

### Example Filter Configuration

```typescript
kementerian: { 
  key: "kementerian", 
  columnName: "kddept",
  referenceTable: "t_dept",
  referenceDatabase: "dbref",
  joinKey: "kddept",
  nameColumn: "nmdept"
}
```

## Filter Display Options (Jenis Tampilan)

1. **Kode**: Show only code columns (no JOIN to reference table)
2. **Uraian**: Show only description columns (requires LEFT JOIN to reference table)
3. **Kode Uraian**: Show both code and description columns (requires LEFT JOIN to reference table)
4. **Jangan Tampilkan**: Don't show in results but can be used for filtering (no JOIN unless "mengandung kata" is used)

### JOIN Optimization

The query builder intelligently adds LEFT JOINs only when necessary:
- **No JOIN**: When `jenisTampilan` is "kode" and no "mengandung kata" filter is used
- **LEFT JOIN added**: When `jenisTampilan` is "uraian" or "kode_uraian", or when "mengandung kata" filter is used (since it needs to search in the description column)

### Smart UI Behavior

The filter interface automatically optimizes the user experience:

#### Auto-Change to "Kode Uraian"
- When user enters text in "mengandung kata" field, `jenisTampilan` automatically changes to "kode_uraian" so users can see both the code and the description they're searching for
- Visual feedback shows when auto-change occurs and explains that search is performed on description columns

#### Mutual Exclusion of Filter Types
The three filter input methods are mutually exclusive to prevent conflicting conditions:

1. **Main Selection** (dropdown): Select a specific item
2. **Kondisi** (text input): Enter multiple codes separated by commas (e.g., "001,002,003")  
3. **Mengandung Kata** (text input): Search by description text

**Behavior:**
- When one filter type is used, the other two are automatically disabled and cleared
- Visual indicators show which fields are disabled and why
- This prevents logical conflicts like "select item A AND search for text B"

**Example Flow:**
1. User selects "001" from dropdown → Kondisi and Mengandung Kata fields become disabled
2. User clears selection → All fields become enabled again
3. User types "Perdagangan" in Mengandung Kata → Selection and Kondisi fields become disabled

## Query Building Process

1. **SELECT Clause**: Built based on active filters and their display options
2. **FROM Clause**: Uses the main table based on report type and year
3. **JOIN Clauses**: Added for filters that need reference table descriptions
4. **WHERE Clause**: Built from filter selections, conditions, and search terms
5. **GROUP BY Clause**: Groups by selected columns for aggregation
6. **ORDER BY Clause**: Orders results by filter columns
7. **LIMIT Clause**: Adds performance limit (configurable)

## Security Features

1. **Query Encryption**: All queries are encrypted before transmission
2. **Query Validation**: Backend validates queries for dangerous keywords
3. **SELECT-only**: Only SELECT queries are allowed
4. **Connection Pooling**: Uses MySQL connection pooling for performance
5. **Timeout Protection**: Queries have execution timeouts

## Usage Examples

### Basic Usage

```typescript
const { buildQuery, encryptQuery } = useInquiryQueryBuilder();
const { executeQuery, downloadCSV } = useInquiryDataApi();

// Build and execute query
const result = await executeQuery(
  ['kementerian', 'satker'], // active filters
  {
    kementerian: { selection: '001', jenisTampilan: 'kode_uraian' },
    satker: { selection: 'all', jenisTampilan: 'kode' }
  }, // filter values
  {
    tahun: '2024',
    tipeLaporan: 'pagu_realisasi',
    pembulatan: 'jutaan'
  } // report parameters
);
```

### Download Data

```typescript
// Download CSV
await downloadCSV(activeFilters, filterValues, reportParams);

// Download Excel
await downloadExcel(activeFilters, filterValues, reportParams);
```

## Environment Variables

Required environment variables for the backend:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=monev
DB_PORT=3306
```

## Installation

1. Install required dependencies:
```bash
npm install xlsx mysql2
```

2. Set up environment variables in `.env.local`

3. Ensure MySQL database is accessible with proper permissions

## Performance Considerations

1. **Connection Pooling**: Uses MySQL connection pool for better performance
2. **Query Limits**: Default limit of 10,000 rows for display, 50,000 for downloads
3. **Indexing**: Ensure proper database indexes on filter columns
4. **Caching**: Consider implementing query result caching for frequently used queries

## Extending the System

### Adding New Report Types

1. Add table mapping in `TABLE_MAPPING` constant
2. Update filter configurations if needed
3. Test with sample data

### Adding New Filters

1. Add filter configuration in `FILTER_CONFIG`
2. Add corresponding JSON data file
3. Update filter labels in components
4. Test hierarchical relationships

### Adding New Export Formats

1. Extend the API endpoint to handle new formats
2. Update the frontend hooks to support new formats
3. Add UI buttons for new export options

## Troubleshooting

### Common Issues

1. **Query Timeout**: Increase timeout values or optimize query
2. **Memory Issues**: Reduce query limits or implement streaming
3. **Permission Errors**: Check database user permissions
4. **Encryption Errors**: Verify base64 encoding/decoding

### Debug Mode

Set `NODE_ENV=development` to include raw SQL queries in API responses for debugging.

## Security Best Practices

1. Always validate and sanitize user inputs
2. Use parameterized queries when possible
3. Implement proper authentication and authorization
4. Monitor query execution for suspicious patterns
5. Regular security audits of the query validation logic

## Future Enhancements

1. **Query Caching**: Implement Redis-based query result caching
2. **Streaming Downloads**: For very large datasets
3. **Query History**: Save and reuse previous queries
4. **Advanced Filters**: Date ranges, numeric ranges, etc.
5. **Query Optimization**: Automatic query optimization suggestions
6. **Real-time Updates**: WebSocket-based real-time data updates