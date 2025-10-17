"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/lib/auth";
import { useSatkerSearch } from "@/hooks/use-satker-data";

interface SatkerItem {
    kdsatker: string;
    nmsatker: string;
    kdkppn: string;
    kdkanwil: string;
}

export function SatkerSearch() {
    const [searchValue, setSearchValue] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const { results: filteredResults, loading, searchSatker } = useSatkerSearch();

    // Debug: Log when results change
    useEffect(() => {
        console.log('[SatkerSearch] Results updated:', {
            count: filteredResults.length,
            loading,
            showResults,
            results: filteredResults
        });
    }, [filteredResults, loading, showResults]);

    // Search using API when user types
    useEffect(() => {
        if (searchValue.length < 2) {
            setShowResults(false);
            return;
        }

        const debounceTimer = setTimeout(() => {
            console.log('[SatkerSearch] Searching for:', searchValue);
            searchSatker(searchValue);
            setShowResults(true);
            setSelectedIndex(-1);
        }, 300); // Debounce for 300ms

        return () => clearTimeout(debounceTimer);
    }, [searchValue, searchSatker]);

    const handleSelect = (satker: SatkerItem) => {
        setShowResults(false);
        setSearchValue("");
        router.push(`/satker/${satker.kdsatker}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showResults || filteredResults.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredResults.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
                    const picked = filteredResults[selectedIndex];
                    if (picked) handleSelect(picked);
                } else if (filteredResults.length > 0) {
                    const first = filteredResults[0];
                    if (first) handleSelect(first);
                }
                break;
            case "Escape":
                setShowResults(false);
                setSelectedIndex(-1);
                break;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    };

    const handleInputFocus = () => {
        if (searchValue.length >= 2 && filteredResults.length > 0) {
            setShowResults(true);
        }
    };

    const handleInputBlur = () => {
        // Delay hiding results to allow clicking on them
        setTimeout(() => {
            setShowResults(false);
            setSelectedIndex(-1);
        }, 200);
    };

    return (
        <div className="flex-1 max-w-xl mx-auto hidden sm:flex relative">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    className="pl-9"
                    placeholder="Cari Satker (kode atau nama)..."
                    value={searchValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                />

                {/* Results dropdown */}
                {showResults && (
                    <div
                        ref={resultsRef}
                        className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
                    >
                        {loading && (
                            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                Mencari...
                            </div>
                        )}
                        
                        {!loading && filteredResults.length > 0 && filteredResults.map((satker, index) => (
                            <div
                                key={satker.kdsatker}
                                className={`px-4 py-3 cursor-pointer border-b last:border-b-0 hover:bg-muted ${index === selectedIndex ? "bg-muted" : ""
                                    }`}
                                onClick={() => handleSelect(satker)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{satker.nmsatker}</span>
                                    <span className="text-xs text-muted-foreground">
                                        Kode: {satker.kdsatker} | Kanwil: {satker.kdkanwil}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {!loading && searchValue.length >= 2 && filteredResults.length === 0 && (
                            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                Tidak ada satker ditemukan
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}