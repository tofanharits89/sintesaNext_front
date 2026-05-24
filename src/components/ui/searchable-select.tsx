"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Pilih...",
  searchPlaceholder,
  emptyMessage = "Tidak ditemukan.",
  className,
  contentClassName,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [scrollNode, setScrollNode] = React.useState<HTMLDivElement | null>(null);

  // Use deferred value so filtering doesn't block input typing
  const deferredInput = React.useDeferredValue(inputValue);

  const selectedLabel = React.useMemo(
    () => options.find((o) => o.value === value)?.label || "",
    [options, value]
  );

  // Filter with deferred input to keep typing responsive
  const filtered = React.useMemo(() => {
    if (!deferredInput) return options;
    const lower = deferredInput.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, deferredInput]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollNode,
    estimateSize: () => 32,
    overscan: 12,
  });

  // When popover opens, show selected label as input text; when closes, reset
  React.useEffect(() => {
    if (open) {
      // Clear input so user can start typing to search immediately
      setInputValue("");
      setActiveIndex(-1);
      // Focus the input
      const timer = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(timer);
    } else {
      setInputValue("");
      setActiveIndex(-1);
    }
  }, [open]);

  // Scroll to selected item when opening (only when no search active)
  React.useEffect(() => {
    if (open && value && !deferredInput && scrollNode) {
      const idx = filtered.findIndex((o) => o.value === value);
      if (idx > 0) {
        const timer = setTimeout(
          () => virtualizer.scrollToIndex(idx, { align: "center" }),
          80
        );
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value, deferredInput, scrollNode]);

  // Reset active index when filtered results change
  React.useEffect(() => {
    setActiveIndex(-1);
  }, [filtered.length]);

  const handleSelect = React.useCallback(
    (optionValue: string) => {
      onValueChange(optionValue);
      setOpen(false);
    },
    [onValueChange]
  );

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onValueChange("");
      setInputValue("");
    },
    [onValueChange]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      // Open dropdown on arrow down if closed
      if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (!open || filtered.length === 0) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next =
            activeIndex < filtered.length - 1 ? activeIndex + 1 : 0;
          setActiveIndex(next);
          virtualizer.scrollToIndex(next, { align: "auto" });
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev =
            activeIndex > 0 ? activeIndex - 1 : filtered.length - 1;
          setActiveIndex(prev);
          virtualizer.scrollToIndex(prev, { align: "auto" });
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < filtered.length) {
            handleSelect(filtered[activeIndex]!.value);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          setOpen(false);
          break;
        }
        case "Home": {
          if (inputValue) break; // allow cursor movement in input
          e.preventDefault();
          setActiveIndex(0);
          virtualizer.scrollToIndex(0, { align: "start" });
          break;
        }
        case "End": {
          if (inputValue) break; // allow cursor movement in input
          e.preventDefault();
          const last = filtered.length - 1;
          setActiveIndex(last);
          virtualizer.scrollToIndex(last, { align: "end" });
          break;
        }
      }
    },
    [open, activeIndex, filtered, handleSelect, virtualizer, inputValue]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-disabled={disabled}
          className={cn(
            "border-input focus-within:border-ring focus-within:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-zinc-100 dark:bg-black hover:bg-zinc-200 dark:hover:bg-zinc-950 flex w-full items-center gap-2 rounded-md border px-3 py-2 shadow-xs transition-[color,box-shadow] focus-within:ring-[3px] h-9",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <input
            ref={inputRef}
            value={open ? inputValue : selectedLabel}
            readOnly={!open}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground truncate disabled:cursor-not-allowed cursor-default"
            autoComplete="off"
            spellCheck={false}
          />
          {value && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 rounded-sm opacity-50 hover:opacity-100 transition-opacity"
              tabIndex={-1}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0 border border-border rounded-md shadow-md",
          contentClassName
        )}
        align="start"
        onOpenAutoFocus={(e) => {
          // Prevent popover from stealing focus from our input
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          // Don't close if clicking inside the trigger (our input)
          const target = e.target as HTMLElement;
          if (target.closest('[role="combobox"]')) {
            e.preventDefault();
          }
        }}
      >
        {/* Virtualized list */}
        <div
          ref={setScrollNode}
          className="max-h-[240px] overflow-y-auto overflow-x-hidden p-1"
          style={{ overscrollBehavior: "contain" }}
          onWheel={(e) => e.stopPropagation()}
        >
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const option = filtered[virtualRow.index]!;
                const isSelected = option.value === value;
                const isActive = virtualRow.index === activeIndex;
                return (
                  <div
                    key={virtualRow.index}
                    data-index={virtualRow.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-sm px-2 cursor-pointer text-sm select-none",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/50 font-medium",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setActiveIndex(virtualRow.index)}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Item count indicator */}
        {filtered.length > 0 && (
          <div className="border-t px-3 py-1.5">
            <p className="text-[11px] text-muted-foreground">
              {deferredInput
                ? `${filtered.length} hasil dari ${options.length}`
                : `${options.length} item`}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
