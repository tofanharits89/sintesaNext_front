import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  QueryListSkeleton,
  InlineSpinner,
  QueryManagementSkeleton,
  LoadingOverlay,
  ButtonSpinner,
  SaveModalSkeleton,
  BulkOperationProgress,
} from "../loading-states";

describe("Loading States Components", () => {
  describe("QueryListSkeleton", () => {
    it("renders default number of skeleton items", () => {
      render(<QueryListSkeleton />);
      
      // Should render 3 skeleton items by default
      const skeletonItems = screen.getAllByTestId("skeleton");
      expect(skeletonItems.length).toBeGreaterThan(0);
    });

    it("renders custom number of skeleton items", () => {
      render(<QueryListSkeleton count={5} />);
      
      // Should render the specified number of skeleton containers
      const containers = document.querySelectorAll(".space-y-3");
      expect(containers).toHaveLength(5);
    });
  });

  describe("InlineSpinner", () => {
    it("renders spinner with default size", () => {
      render(<InlineSpinner />);
      
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("w-4", "h-4");
    });

    it("renders spinner with custom size", () => {
      render(<InlineSpinner size="lg" />);
      
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toHaveClass("w-6", "h-6");
    });

    it("renders spinner with text", () => {
      render(<InlineSpinner text="Loading data..." />);
      
      expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<InlineSpinner className="custom-class" />);
      
      const container = document.querySelector(".custom-class");
      expect(container).toBeInTheDocument();
    });
  });

  describe("QueryManagementSkeleton", () => {
    it("renders complete skeleton structure", () => {
      render(<QueryManagementSkeleton />);
      
      // Should have header, search, query list, and pagination sections
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(10); // Multiple skeleton elements
    });

    it("includes database icon in header", () => {
      render(<QueryManagementSkeleton />);
      
      const databaseIcon = document.querySelector("svg");
      expect(databaseIcon).toBeInTheDocument();
    });
  });

  describe("LoadingOverlay", () => {
    it("renders when visible", () => {
      render(<LoadingOverlay isVisible={true} />);
      
      const overlay = document.querySelector(".absolute.inset-0");
      expect(overlay).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("does not render when not visible", () => {
      render(<LoadingOverlay isVisible={false} />);
      
      const overlay = document.querySelector(".absolute.inset-0");
      expect(overlay).not.toBeInTheDocument();
    });

    it("renders custom text", () => {
      render(<LoadingOverlay isVisible={true} text="Saving..." />);
      
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<LoadingOverlay isVisible={true} className="custom-overlay" />);
      
      const overlay = document.querySelector(".custom-overlay");
      expect(overlay).toBeInTheDocument();
    });
  });

  describe("ButtonSpinner", () => {
    it("renders spinner with default classes", () => {
      render(<ButtonSpinner />);
      
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("w-4", "h-4");
    });

    it("applies custom className", () => {
      render(<ButtonSpinner className="custom-spinner" />);
      
      const spinner = document.querySelector(".custom-spinner");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("SaveModalSkeleton", () => {
    it("renders modal skeleton structure", () => {
      render(<SaveModalSkeleton />);
      
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(5); // Multiple skeleton elements for form
    });
  });

  describe("BulkOperationProgress", () => {
    it("renders progress with correct percentage", () => {
      render(
        <BulkOperationProgress
          completed={3}
          total={10}
          failed={1}
          operation="Deleting"
        />
      );
      
      expect(screen.getByText("Deleting...")).toBeInTheDocument();
      expect(screen.getByText("3/10")).toBeInTheDocument();
      expect(screen.getByText("30% complete")).toBeInTheDocument();
      expect(screen.getByText("1 failed")).toBeInTheDocument();
    });

    it("handles zero total correctly", () => {
      render(
        <BulkOperationProgress
          completed={0}
          total={0}
          operation="Processing"
        />
      );
      
      expect(screen.getByText("0% complete")).toBeInTheDocument();
    });

    it("does not show failed count when zero", () => {
      render(
        <BulkOperationProgress
          completed={5}
          total={10}
          failed={0}
        />
      );
      
      expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
    });

    it("renders progress bar with correct width", () => {
      render(
        <BulkOperationProgress
          completed={7}
          total={10}
        />
      );
      
      const progressBar = document.querySelector(".bg-amber-600");
      expect(progressBar).toHaveStyle({ width: "70%" });
    });
  });
});
