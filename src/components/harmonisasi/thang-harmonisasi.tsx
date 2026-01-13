import React, { useState } from "react";

interface ThangJenlapProps {
  jenlap?: any;
  onChange: (value: string) => void;
}

const ThangJenlap = ({ jenlap, onChange }: ThangJenlapProps) => {
  const thang = [
    // { value: "2023", label: " 2023" },
    { value: "2024", label: " 2024" },
    { value: "2025", label: " 2025" },
    { value: "2026", label: " 2026" },
  ];
  const [selectedValue, setSelectedValue] = useState("2026");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedValue = event.target.value;
    setSelectedValue(selectedValue);
    onChange(selectedValue);
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-center">
      <div className="col-span-3 md:col-span-2 lg:col-span-2 xl:col-span-2 font-medium">
        Tahun
      </div>

      <div className="col-span-8 md:col-span-7 xl:col-span-9 lg:col-span-9 jenis-laporan-option-tematik flex flex-wrap gap-2">
        {thang.map((tahun) => (
          <label key={tahun.value} className="flex items-center cursor-pointer">
            <input
              type="radio"
              className="mx-2 custom-disabled"
              name="thang"
              value={tahun.value}
              checked={selectedValue === tahun.value}
              onChange={handleChange}
            />
            {tahun.label}
          </label>
        ))}
      </div>
    </div>
  );
};

export default ThangJenlap;
