import type { Request, Response } from "express";
import logger from "../../../config/logger.js";
import { InquiryExecutionService } from "../services/inquiry-execution.service.js";

const DEFAULT_JSON_PAGE_SIZE = 50;

/**
 * Inquiry Data Controller
 * Thin HTTP layer that delegates to services
 */

const inquiryExecutionService = new InquiryExecutionService();

export const postInquiryQuery = async (req: Request, res: Response) => {
  try {
    const {
      encryptedQuery,
      format = "json",
      page = 1,
      pageSize = DEFAULT_JSON_PAGE_SIZE,
    } = ((req as any).body || {}) as any;

    if (!encryptedQuery) {
      return res.status(400).json({ success: false, error: "Encrypted query is required" });
    }

    const user = (req as any).user;

    if (format === "csv") {
      const csv = await inquiryExecutionService.executeQueryCsv(encryptedQuery, user);

      // Disable compression for CSV downloads
      res.setHeader("x-no-compression", "1");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="query_result_${Date.now()}.csv"`);
      res.setHeader("Content-Length", Buffer.byteLength(csv, "utf8").toString());
      res.setHeader("Cache-Control", "no-cache");

      return res.status(200).send(csv);
    }

    // Use lighter compression for JSON responses
    (req as any).headers = (req as any).headers || {};
    (req as any).headers["x-compression-level"] = "3";

    if (format === "excel") {
      const result = await inquiryExecutionService.executeQueryExcel(encryptedQuery, user);
      return res.status(200).json(result);
    }

    // Default: JSON with pagination
    const result = await inquiryExecutionService.executeQueryJson(
      encryptedQuery,
      user,
      page,
      pageSize,
    );
    return res.status(200).json(result);
  } catch (err: any) {
    logger.error("InquiryDataController error", {
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
};

export const previewConvertedQuery = async (req: Request, res: Response) => {
  try {
    const { encryptedQuery } = (req as any).body || {};

    if (!encryptedQuery) {
      return res.status(400).json({ success: false, error: "Encrypted query is required" });
    }

    const user = (req as any).user;
    const result = await inquiryExecutionService.previewConvertedQuery(encryptedQuery, user);

    return res.status(200).json(result);
  } catch (err: any) {
    logger.error("PreviewConvertedQuery error", {
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
};

export const getInquiryHealth = async (req: Request, res: Response) => {
  try {
    const isHealthy = await inquiryExecutionService.testConnection();
    if (!isHealthy) {
      return res.status(500).json({ success: false, error: "Database connection failed" });
    }
    return res.status(200).json({
      success: true,
      message: "Inquiry API is healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Database connection failed" });
  }
};

export default {
  postInquiryQuery,
  previewConvertedQuery,
  getInquiryHealth,
};
