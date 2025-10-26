"use client";

import React, { useState, useEffect } from 'react';
import { VirtualizedSelect } from '@/components/ui/virtualized-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Option } from '@/types/filters';

interface FilterInputProps {
  filterKey: string;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
  getFilterOptions: (type: string, dependencies?: Record<string, string>) => Promise<Option[]>;
  isLoading: (type: string) => boolean;
  activeFilterValues?: Record<string, string>;
  currentValue?: {
    selection?: string;
    kondisiCode?: string;
    mengandungKata?: string;
    jenisTampilan?: string;
    akunType?: string;
  };
}

export function FilterInput({
  filterKey,
  onFilterChange,
  getFilterOptions,
  isLoading,
  activeFilterValues = {},
  currentValue = {},
}: FilterInputProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      try {
        const filterOptions = await getFilterOptions(filterKey, activeFilterValues);
        setOptions(filterOptions);
      } catch (error) {
        console.error(`Failed to load options for ${filterKey}:`, error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [filterKey, activeFilterValues, getFilterOptions]);

  const handleSelectionChange = (value: string) => {
    onFilterChange(filterKey, 'selection', value);
  };

  const handleKondisiChange = (value: string) => {
    onFilterChange(filterKey, 'kondisiCode', value);
  };

  const handleMengandungKataChange = (value: string) => {
    onFilterChange(filterKey, 'mengandungKata', value);
  };

  const handleJenisTampilanChange = (value: string) => {
    onFilterChange(filterKey, 'jenisTampilan', value);
  };

  const handleAkunTypeChange = (value: string) => {
    onFilterChange(filterKey, 'akunType', value);
  };

  const isAccountFilter = filterKey === 'kdakun';

  return (
    <div className="space-y-3">
      {/* Main Selection */}
      <div className="space-y-2">
        <Label htmlFor={`${filterKey}-selection`} className="text-sm font-medium">
          Pilih {filterKey.replace(/kd/g, '').toUpperCase()}
        </Label>
        <VirtualizedSelect
          options={options}
          value={currentValue.selection || ''}
          onValueChange={handleSelectionChange}
          placeholder={`Pilih ${filterKey}...`}
          disabled={loading || isLoading(filterKey)}
          className="w-full"
        />
      </div>

      {/* Condition Selection */}
      {currentValue.selection && (
        <div className="space-y-2">
          <Label htmlFor={`${filterKey}-kondisi`} className="text-sm font-medium">
            Kondisi
          </Label>
          <Select
            value={currentValue.kondisiCode || ''}
            onValueChange={handleKondisiChange}
          >
            <SelectTrigger id={`${filterKey}-kondisi`}>
              <SelectValue placeholder="Pilih kondisi..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="=">Sama dengan (=)</SelectItem>
              <SelectItem value="!=">Tidak sama dengan (!=)</SelectItem>
              <SelectItem value=">">Lebih besar dari (&gt;)</SelectItem>
              <SelectItem value=">=">Lebih besar atau sama dengan (&gt;=)</SelectItem>
              <SelectItem value="<">Lebih kecil dari (&lt;)</SelectItem>
              <SelectItem value="<=">Lebih kecil atau sama dengan (&lt;=)</SelectItem>
              <SelectItem value="LIKE">Mengandung</SelectItem>
              <SelectItem value="NOT LIKE">Tidak mengandung</SelectItem>
              <SelectItem value="IN">Di dalam (IN)</SelectItem>
              <SelectItem value="NOT IN">Tidak di dalam (NOT IN)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Text Input for LIKE conditions */}
      {currentValue.kondisiCode?.includes('LIKE') && (
        <div className="space-y-2">
          <Label htmlFor={`${filterKey}-keyword`} className="text-sm font-medium">
            Kata Kunci
          </Label>
          <Input
            id={`${filterKey}-keyword`}
            value={currentValue.mengandungKata || ''}
            onChange={(e) => handleMengandungKataChange(e.target.value)}
            placeholder="Masukkan kata kunci..."
          />
        </div>
      )}

      {/* Display Type Selection */}
      {currentValue.selection && (
        <div className="space-y-2">
          <Label htmlFor={`${filterKey}-display`} className="text-sm font-medium">
            Jenis Tampilan
          </Label>
          <Select
            value={currentValue.jenisTampilan || 'nama'}
            onValueChange={handleJenisTampilanChange}
          >
            <SelectTrigger id={`${filterKey}-display`}>
              <SelectValue placeholder="Pilih tampilan..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nama">Nama</SelectItem>
              <SelectItem value="kode">Kode</SelectItem>
              <SelectItem value="kode-nama">Kode - Nama</SelectItem>
              <SelectItem value="nama-kode">Nama (Kode)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Account Type Selection for kdakun */}
      {isAccountFilter && currentValue.selection && (
        <div className="space-y-2">
          <Label htmlFor={`${filterKey}-akun-type`} className="text-sm font-medium">
            Tipe Akun
          </Label>
          <Select
            value={currentValue.akunType || 'all'}
            onValueChange={handleAkunTypeChange}
          >
            <SelectTrigger id={`${filterKey}-akun-type`}>
              <SelectValue placeholder="Pilih tipe akun..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="aset">Aset</SelectItem>
              <SelectItem value="beban">Beban</SelectItem>
              <SelectItem value="ekuitas">Ekuitas</SelectItem>
              <SelectItem value="pendapatan">Pendapatan</SelectItem>
              <SelectItem value="kewajiban">Kewajiban</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
