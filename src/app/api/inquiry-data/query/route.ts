import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "monev",
  port: parseInt(process.env.DB_PORT || "3306"),
  charset: "utf8mb4",
  timezone: "+00:00",
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
};

// Create connection pool for better performance
const pool = mysql.createPool({
  ...DB_CONFIG,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

interface QueryRequest {
  encryptedQuery: string;
  format?: "json" | "csv" | "excel";
  limit?: number;
}

interface QueryResponse {
  success: boolean;
  data?: any[];
  columns?: string[];
  rowCount?: number;
  executionTime?: number;
  error?: string;
  query?: string; // Only for admin users
}

// Decrypt the query
function decryptQuery(encryptedQuery: string): string {
  try {
    return decodeURIComponent(atob(encryptedQuery));
  } catch (error) {
    throw new Error("Invalid encrypted query format");
  }
}

// Validate query for security
function validateQuery(query: string): { isValid: boolean; error?: string } {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check if it's a SELECT query
  if (!normalizedQuery.startsWith("select")) {
    return { isValid: false, error: "Only SELECT queries are allowed" };
  }

  // Check for dangerous keywords
  const dangerousKeywords = [
    "drop", "delete", "insert", "update", "alter", "create", "truncate",
    "exec", "execute", "sp_", "xp_", "into outfile", "load_file",
    "union.*select", "information_schema", "mysql", "performance_schema"
  ];

  for (const keyword of dangerousKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(normalizedQuery)) {
      return { isValid: false, error: `Dangerous keyword detected: ${keyword}` };
    }
  }

  // Check for multiple statements
  if (normalizedQuery.includes(";") && !normalizedQuery.endsWith(";")) {
    return { isValid: false, error: "Multiple statements are not allowed" };
  }

  return { isValid: true };
}

// Execute query with timeout and error handling
async function executeQuery(query: string, limit?: number): Promise<{
  data: any[];
  columns: string[];
  executionTime: number;
}> {
  const startTime = Date.now();
  let connection;

  try {
    connection = await pool.getConnection();
    
    // Add LIMIT if not present and limit is specified
    let finalQuery = query.trim();
    if (limit && !finalQuery.toLowerCase().includes("limit")) {
      finalQuery += ` LIMIT ${limit}`;
    }

    // Execute query with timeout
    const [rows, fields] = await connection.execute(finalQuery);
    
    const executionTime = Date.now() - startTime;
    
    // Extract column names
    const columns = Array.isArray(fields) ? fields.map((field: any) => field.name) : [];
    
    return {
      data: Array.isArray(rows) ? rows : [],
      columns,
      executionTime,
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Convert data to CSV format
function convertToCSV(data: any[], columns: string[]): string {
  if (!data.length) return "";
  
  const csvRows = [];
  
  // Add header
  csvRows.push(columns.join(","));
  
  // Add data rows
  for (const row of data) {
    const values = columns.map(col => {
      const value = row[col];
      // Escape quotes and wrap in quotes if contains comma or quote
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  }
  
  return csvRows.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body: QueryRequest = await request.json();
    const { encryptedQuery, format = "json", limit = 10000 } = body;

    if (!encryptedQuery) {
      return NextResponse.json(
        { success: false, error: "Encrypted query is required" },
        { status: 400 }
      );
    }

    // Decrypt the query
    let query: string;
    try {
      query = decryptQuery(encryptedQuery);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Failed to decrypt query" },
        { status: 400 }
      );
    }

    // Validate the query
    const validation = validateQuery(query);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Execute the query
    const result = await executeQuery(query, limit);

    const response: QueryResponse = {
      success: true,
      data: result.data,
      columns: result.columns,
      rowCount: result.data.length,
      executionTime: result.executionTime,
    };

    // Add query to response for admin users (you can add user role check here)
    // For now, we'll include it for debugging purposes
    if (process.env.NODE_ENV === "development") {
      response.query = query;
    }

    // Handle different response formats
    switch (format) {
      case "csv":
        const csvData = convertToCSV(result.data, result.columns);
        return new NextResponse(csvData, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="query_result_${Date.now()}.csv"`,
          },
        });

      case "excel":
        // For Excel format, return JSON with a flag to handle client-side
        return NextResponse.json({
          ...response,
          format: "excel",
        });

      default:
        return NextResponse.json(response);
    }

  } catch (error) {
    console.error("Query execution error:", error);
    
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    return NextResponse.json({
      success: true,
      message: "Query API is healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Database connection failed" },
      { status: 500 }
    );
  }
}