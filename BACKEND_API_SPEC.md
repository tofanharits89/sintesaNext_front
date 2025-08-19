# Backend API Specification for Carisatker

## Database Table: carisatker (v3_next database)

### Required API Endpoints

#### 1. Get All Satker with Search
**Endpoint:** `GET /api/v1/carisatker`

**Query Parameters:**
- `search` (optional): Search term for kdsatker or nmsatker
- `limit` (optional): Maximum number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "kdsatker": "000017",
      "nmsatker": "SEKRETARIAT JENDERAL",
      "email": "sekjen@kemenkeu.go.id",
      "kddept": "001",
      "nmdept": "Kementerian Keuangan",
      "kdunit": "001",
      "nmunit": "Sekretariat Jenderal",
      "kddekon": "001",
      "nmdekon": "Dekonsentrasi",
      "kdkanwil": "11",
      "nmkanwil": "Kanwil DJPb Provinsi DKI Jakarta",
      "kdkppn": "182",
      "nmkppn": "KPPN Jakarta I",
      "thang": "2025",
      "kpa": "Dr. John Doe, S.E., M.M.",
      "bendahara": "Jane Smith, S.Ak.",
      "ppspm": "Robert Johnson, S.E.",
      "npwp": "00.000.000.0-000.000",
      "statusblu": "0",
      "kdjendok": "DIPA"
    }
  ]
}
```

#### 2. Get Satker by Code
**Endpoint:** `GET /api/v1/carisatker/{kdsatker}`

**Response:**
```json
{
  "success": true,
  "data": {
    "kdsatker": "000017",
    "nmsatker": "SEKRETARIAT JENDERAL",
    "email": "sekjen@kemenkeu.go.id",
    "kddept": "001",
    "nmdept": "Kementerian Keuangan",
    "kdunit": "001",
    "nmunit": "Sekretariat Jenderal",
    "kddekon": "001",
    "nmdekon": "Dekonsentrasi",
    "kdkanwil": "11",
    "nmkanwil": "Kanwil DJPb Provinsi DKI Jakarta",
    "kdkppn": "182",
    "nmkppn": "KPPN Jakarta I",
    "thang": "2025",
    "kpa": "Dr. John Doe, S.E., M.M.",
    "bendahara": "Jane Smith, S.Ak.",
    "ppspm": "Robert Johnson, S.E.",
    "npwp": "00.000.000.0-000.000",
    "statusblu": "0",
    "kdjendok": "DIPA"
  }
}
```

### Field Mapping

| Frontend Label | Database Column | Description |
|---|---|---|
| Nama Satker | nmsatker | Nama satuan kerja |
| Email Satker | email | Email satker |
| Kementerian | kddept + nmdept | Kode dan nama departemen |
| Unit Eselon I | kdunit + nmunit | Kode dan nama unit eselon I |
| Kewenangan | kddekon + nmdekon | Kode dan nama dekonsentrasi |
| Kanwil DJPb | kdkanwil + nmkanwil | Kode dan nama kanwil |
| KPPN | kdkppn + nmkppn | Kode dan nama KPPN |
| Tahun Anggaran | thang | Tahun anggaran |
| Kuasa Pengguna Anggaran | kpa | Nama KPA |
| Bendahara | bendahara | Nama bendahara |
| PPSPM | ppspm | Nama PPSPM |
| NPWP | npwp | Nomor NPWP |
| Status BLU | statusblu | Status BLU (0/1 atau false/true) |
| Jenis Dokumen | kdjendok | Kode jenis dokumen |

### Authentication
All endpoints require Bearer token authentication via Authorization header.

### Error Responses
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### SQL Query Examples

#### Search Query
```sql
SELECT * FROM carisatker 
WHERE (kdsatker LIKE '%search%' OR nmsatker LIKE '%search%')
LIMIT 20;
```

#### Get by Code Query
```sql
SELECT * FROM carisatker 
WHERE kdsatker = 'specific_code';
```

### Notes
- Implement proper SQL injection protection
- Add appropriate indexes on kdsatker and nmsatker for search performance
- Consider implementing pagination for large result sets
- Ensure proper error handling and logging