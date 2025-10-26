import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  ErrorFallback,
  InlineError,
  NetworkStatus,
} from "../error-fallback";

describe("Error Fallback Components", () => {
  describe("ErrorFallback", () => {
    it("renders generic error by default", () => {
      render(<ErrorFallback error="Something went wrong" />);
      
      expect(screen.getByText("Terjadi Kesalahan")).toBeInTheDocument();
      expect(screen.getByText("Terjadi kesalahan yang tidak terduga. Silakan coba lagi.")).toBeInTheDocument();
    });

    it("renders network error variant", () => {
      render(<ErrorFallback error="Network connection failed" variant="network" />);
      
      expect(screen.getByText("Masalah Koneksi")).toBeInTheDocument();
      expect(screen.getByText("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.")).toBeInTheDocument();
    });

    it("renders server error variant", () => {
      render(<ErrorFallback error="Server error 500" variant="server" />);
      
      expect(screen.getByText("Masalah Server")).toBeInTheDocument();
      expect(screen.getByText("Server sedang mengalami masalah. Silakan coba lagi dalam beberapa saat.")).toBeInTheDocument();
    });

    it("renders validation error variant", () => {
      render(<ErrorFallback error="Validation failed" variant="validation" />);
      
      expect(screen.getByText("Data Tidak Valid")).toBeInTheDocument();
      expect(screen.getByText("Periksa kembali data yang Anda masukkan.")).toBeInTheDocument();
    });

    it("auto-detects network error from message", () => {
      render(<ErrorFallback error="Connection timeout occurred" />);
      
      expect(screen.getByText("Masalah Koneksi")).toBeInTheDocument();
    });

    it("auto-detects server error from message", () => {
      render(<ErrorFallback error="Internal server error" />);
      
      expect(screen.getByText("Masalah Server")).toBeInTheDocument();
    });

    it("auto-detects validation error from message", () => {
      render(<ErrorFallback error="Invalid input provided" />);
      
      expect(screen.getByText("Data Tidak Valid")).toBeInTheDocument();
    });

    it("renders custom title and description", () => {
      render(
        <ErrorFallback
          error="Custom error"
          title="Custom Title"
          description="Custom description"
        />
      );
      
      expect(screen.getByText("Custom Title")).toBeInTheDocument();
      expect(screen.getByText("Custom description")).toBeInTheDocument();
    });

    it("calls onRetry when retry button is clicked", () => {
      const onRetry = vi.fn();
      render(<ErrorFallback error="Test error" onRetry={onRetry} />);
      
      const retryButton = screen.getByText("Coba Lagi");
      fireEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledOnce();
    });

    it("calls onReset when reset button is clicked", () => {
      const onReset = vi.fn();
      render(<ErrorFallback error="Test error" onReset={onReset} showReset={true} />);
      
      const resetButton = screen.getByText("Reset");
      fireEvent.click(resetButton);
      
      expect(onReset).toHaveBeenCalledOnce();
    });

    it("hides retry button when showRetry is false", () => {
      render(<ErrorFallback error="Test error" showRetry={false} />);
      
      expect(screen.queryByText("Coba Lagi")).not.toBeInTheDocument();
    });

    it("shows reset button when showReset is true", () => {
      render(<ErrorFallback error="Test error" showReset={true} />);
      
      expect(screen.getByText("Reset")).toBeInTheDocument();
    });

    it("displays error message when different from description", () => {
      render(
        <ErrorFallback
          error="Specific error message"
          description="Generic description"
        />
      );
      
      expect(screen.getByText("Specific error message")).toBeInTheDocument();
      expect(screen.getByText("Generic description")).toBeInTheDocument();
    });

    it("handles Error object", () => {
      const error = new Error("Test error message");
      render(<ErrorFallback error={error} />);
      
      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<ErrorFallback error="Test error" className="custom-error" />);
      
      const container = document.querySelector(".custom-error");
      expect(container).toBeInTheDocument();
    });
  });

  describe("InlineError", () => {
    it("renders nothing when error is null", () => {
      const { container } = render(<InlineError error={null} />);
      
      expect(container.firstChild).toBeNull();
    });

    it("renders error message from string", () => {
      render(<InlineError error="Test error message" />);
      
      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("renders error message from Error object", () => {
      const error = new Error("Error object message");
      render(<InlineError error={error} />);
      
      expect(screen.getByText("Error object message")).toBeInTheDocument();
    });

    it("shows retry button when onRetry is provided", () => {
      const onRetry = vi.fn();
      render(<InlineError error="Test error" onRetry={onRetry} />);
      
      const retryButton = screen.getByText("Retry");
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledOnce();
    });

    it("does not show retry button when onRetry is not provided", () => {
      render(<InlineError error="Test error" />);
      
      expect(screen.queryByText("Retry")).not.toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<InlineError error="Test error" className="custom-inline-error" />);
      
      const alert = document.querySelector(".custom-inline-error");
      expect(alert).toBeInTheDocument();
    });
  });

  describe("NetworkStatus", () => {
    it("renders nothing when online", () => {
      const { container } = render(<NetworkStatus isOnline={true} />);
      
      expect(container.firstChild).toBeNull();
    });

    it("renders warning when offline", () => {
      render(<NetworkStatus isOnline={false} />);
      
      expect(screen.getByText("Tidak ada koneksi internet. Beberapa fitur mungkin tidak berfungsi dengan baik.")).toBeInTheDocument();
    });

    it("shows wifi off icon when offline", () => {
      render(<NetworkStatus isOnline={false} />);
      
      const wifiOffIcon = document.querySelector("svg");
      expect(wifiOffIcon).toBeInTheDocument();
    });
  });
});
