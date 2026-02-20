"use client";

import React, { useState } from "react";
import { Grid3X3, RotateCcw } from "lucide-react";
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

import Kddept from "@/data/kddept.json";

const CURRENT_YEAR = String(new Date().getFullYear()); // "2026"
const TAHUN_OPTIONS = ["2024", "2025", "2026"];

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
                                        TA {t}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Kementerian/Lembaga */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-sm font-medium">Kementerian/Lembaga</Label>
                        <Select
                            value={kddept}
                            onValueChange={(val) => {
                                setKddept(val);
                                handleChange({ kddept: val });
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Semua K/L" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="00">Semua K/L</SelectItem>
                                {Kddept.map((dept, idx) => (
                                    <SelectItem key={idx} value={dept.kddept}>
                                        {dept.kddept} - {dept.nmdept}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
