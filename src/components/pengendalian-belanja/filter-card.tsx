"use client";

import React, { useState } from "react";
import { Check, Grid3X3, RotateCcw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import Kddept from "@/data/kddept.json";

const CURRENT_YEAR = String(new Date().getFullYear()); // "2026"
const TAHUN_OPTIONS = ["2026", "2025", "2024"];

export interface FilterResult {
    tahun: string;
    kddept: string;
    exclude999: boolean;
}

interface FilterCardProps {
    onFilter: (data: FilterResult) => void;
}

export default function FilterCard({ onFilter }: FilterCardProps) {
    const [tahun, setTahun] = useState(CURRENT_YEAR);
    const [kddept, setKddept] = useState("00");
    const [exclude999, setExclude999] = useState(false);

    const selectedDept = Kddept.find((d) => d.kddept === kddept);
    const displayValue = kddept === "00" 
        ? "Semua K/L" 
        : selectedDept 
            ? `${kddept} - ${selectedDept.nmdept}`
            : kddept;

    const resetFilter = () => {
        const reset: FilterResult = { tahun: CURRENT_YEAR, kddept: "00", exclude999: false };
        setTahun(CURRENT_YEAR);
        setKddept("00");
        setExclude999(false);
        onFilter(reset);
    };

    const handleChange = (updates: Partial<FilterResult>) => {
        const data: FilterResult = { tahun, kddept, exclude999, ...updates };
        onFilter(data);
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                {/* Header row: title | checkbox + reset (inline on desktop, stacked on mobile) */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Grid3X3 className="w-5 h-5 text-primary" />
                        Filter Data
                    </CardTitle>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Exclude BA 999 checkbox — next to Reset on desktop */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="exclude999"
                                checked={exclude999}
                                onCheckedChange={(checked) => {
                                    const val = checked === true;
                                    setExclude999(val);
                                    handleChange({ exclude999: val });
                                }}
                            />
                            <Label
                                htmlFor="exclude999"
                                className="text-sm font-medium cursor-pointer select-none whitespace-nowrap"
                            >
                                Kecualikan BA 999
                            </Label>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilter}
                            className="h-8 gap-1"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    {/* Tahun */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-sm font-medium">Tahun</Label>
                        <Select
                            value={tahun}
                            onValueChange={(val) => {
                                setTahun(val);
                                handleChange({ tahun: val });
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                {TAHUN_OPTIONS.map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {t}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Kementerian/Lembaga */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-sm font-medium">Kementerian/Lembaga</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between",
                                        !kddept && "text-muted-foreground"
                                    )}
                                >
                                    {displayValue}
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="p-0"
                                align="start"
                                style={{ width: 'var(--radix-popover-trigger-width)' }}
                            >
                                <Command>
                                    <CommandInput placeholder="Cari Kementerian/Lembaga..." />
                                    <CommandList>
                                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="all"
                                                onSelect={() => {
                                                    setKddept("00");
                                                    handleChange({ kddept: "00" });
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        kddept === "00" ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                Semua K/L
                                            </CommandItem>
                                            {Kddept.map((dept) => (
                                                <CommandItem
                                                    key={dept.kddept}
                                                    value={`${dept.kddept} - ${dept.nmdept}`}
                                                    onSelect={() => {
                                                        setKddept(dept.kddept);
                                                        handleChange({ kddept: dept.kddept });
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            kddept === dept.kddept ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {dept.kddept} - {dept.nmdept}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
