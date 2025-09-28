"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import carisatkerData from "@/data/carisatker.json";
import { useCurrentUser } from "@/lib/use-current-user";
import { filterSatkerByUserAccess } from "@/utils/satker-rbac";

interface SatkerItem {
    kdsatker: string;
    nmsatker: string;
    kdkppn: string;
    kdkanwil: string;
}

export function SatkerSearch() {
    const [searchValue, setSearchValue] = useState("");
    const [filteredResults, setFilteredResults] = useState<SatkerItem[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const { currentUser } = useCurrentUser();

    // Filter results based on search input and user access
    useEffect(() => {
        if (searchValue.length < 2) {
            setFilteredResults([]);
            setShowResults(false);
            return;
        }

        // First filter by user's access level (role-based access control)
        const accessibleSatkers = filterSatkerByUserAccess(carisatkerData, currentUser);

        // Then filter by search term
        const filtered = accessibleSatkers.filter((item) => {
            const searchLower = searchValue.toLowerCase();
            return (
                item.kdsatker.toLowerCase().includes(searchLower) ||
                item.nmsatker.toLowerCase().includes(searchLower)
            );
        }).slice(0, 10); // Limit to 10 results for performance

        setFilteredResults(filtered);
        setShowResults(filtered.length > 0);
        setSelectedIndex(-1);
    }, [searchValue, currentUser]);

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
                {showResults && filteredResults.length > 0 && (
                    <div
                        ref={resultsRef}
                        className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
                    >
                        {filteredResults.map((satker, index) => (
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

                        {searchValue.length >= 2 && filteredResults.length === 0 && (
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