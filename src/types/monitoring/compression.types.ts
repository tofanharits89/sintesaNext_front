export interface CompressionStats {
  totalCompressed: number;
  totalUncompressed: number;
  compressionRatio: number;
  brotliUsage: number;
  gzipUsage: number;
  averageCompressionTime: number;
}

export interface CompressionApiResponse {
  total_compressed: number;
  total_uncompressed: number;
  compression_ratio: number;
  brotli_usage: number;
  gzip_usage: number;
  average_compression_time: number;
}

export interface CompressionAlgorithm {
  name: string;
  usage: number;
  color: string;
}