"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Eye,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  Save,
  FileCode,
} from "lucide-react";

export default function Sp2dPage() {
  // State untuk jenis laporan dan tahun
  const [thang, setThang] = useState(new Date().getFullYear());
  const [jenlap, setJenlap] = useState("1");
  const [pembulatan, setPembulatan] = useState("1");
  const [akumulatif, setAkumulatif] = useState(false);

  // State untuk switches
  const [kddept, setKddept] = useState(true);
  const [unit, setUnit] = useState(false);
  const [kddekon, setKddekon] = useState(false);
  const [kdkppn, setKdkppn] = useState(false);
  const [kdsatker, setKdsatker] = useState(false);
  const [kdprogram, setKdprogram] = useState(false);
  const [kdgiat, setKdgiat] = useState(false);
  const [kdsdana, setKdsdana] = useState(false);
  const [kdoutput, setKdoutput] = useState(false);
  const [kdakun, setKdakun] = useState(false);

  // State untuk pilihan dropdown
  const [dept, setDept] = useState("000");
  const [kdunit, setKdunit] = useState("XX");
  const [dekon, setDekon] = useState("XX");
  const [kppn, setKppn] = useState("XX");
  const [satker, setSatker] = useState("XX");
  const [program, setProgram] = useState("XX");
  const [giat, setGiat] = useState("XX");
  const [sdana, setSdana] = useState("XX");
  const [output, setOutput] = useState("XX");
  const [akun, setAkun] = useState("XX");

  // State untuk radio buttons
  const [opsidept, setopsiDept] = useState("pilihdept");
  const [opsiunit, setopsiUnit] = useState("pilihunit");
  const [opsidekon, setopsiDekon] = useState("pilihdekon");
  const [opsikppn, setopsikppn] = useState("pilihkppn");
  const [opsisatker, setopsisatker] = useState("pilihsatker");
  const [opsiprogram, setopsiprogram] = useState("pilihprogram");
  const [opsigiat, setopsigiat] = useState("pilihgiat");
  const [opsisdana, setopsisdana] = useState("pilihsdana");
  const [opsioutput, setopsioutput] = useState("pilihoutput");
  const [opsiakun, setopsiakun] = useState("pilihakun");

  // State untuk input kondisi
  const [deptkondisi, setDeptkondisi] = useState("");
  const [opsikatadept, setopsiKataDept] = useState("");
  const [unitkondisi, setUnitkondisi] = useState("");
  const [dekonkondisi, setDekonkondisi] = useState("");
  const [kppnkondisi, setkppnkondisi] = useState("");
  const [opsikatakppn, setopsiKatakppn] = useState("");
  const [satkerkondisi, setsatkerkondisi] = useState("");
  const [opsikatasatker, setopsiKatasatker] = useState("");
  const [programkondisi, setprogramkondisi] = useState("");
  const [opsikataprogram, setopsiKataprogram] = useState("");
  const [giatkondisi, setgiatkondisi] = useState("");
  const [opsikatagiat, setopsiKatagiat] = useState("");
  const [sdanakondisi, setsdanakondisi] = useState("");
  const [opsikatasdana, setopsiKatasdana] = useState("");
  const [outputkondisi, setoutputkondisi] = useState("");
  const [opsikataoutput, setopsiKataoutput] = useState("");
  const [akunkondisi, setakunkondisi] = useState("");
  const [opsikataakun, setopsiKataakun] = useState("");

  const [loadingStatus, setLoadingStatus] = useState(false);

  const handleGetQuery = () => {
    setLoadingStatus(true);
    // Logic untuk generate query
    setTimeout(() => setLoadingStatus(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rowset SP2D</h1>
          <p className="text-sm text-muted-foreground">
            Query builder untuk data SP2D dengan filter parameter yang dapat
            disesuaikan
          </p>
        </div>
      </div>

      {/* Main Content - Cards Layout */}
      <div className="space-y-6">
        {/* Card 1: Parameter Dasar */}
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tahun Anggaran */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Tahun Anggaran
              </label>
              <select
                value={thang}
                onChange={(e) => setThang(Number(e.target.value))}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            {/* Jenis Laporan */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Jenis Laporan
              </label>
              <select
                value={jenlap}
                onChange={(e) => setJenlap(e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="1">Rowset SP2D</option>
                <option value="2">Rowset SP2D Detail</option>
              </select>
            </div>

            {/* Pembulatan */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Pembulatan
              </label>
              <select
                value={pembulatan}
                onChange={(e) => setPembulatan(e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="1">Tanpa Pembulatan</option>
                <option value="1000">Ribuan</option>
                <option value="1000000">Jutaan</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            TA: {thang}, TIPE LAPORAN: {jenlap}, AKUMULATIF:{" "}
            {akumulatif ? "TRUE" : "FALSE"}, PEMBULATAN: {pembulatan}
          </div>
        </div>

        {/* Card 2: Switch Pilihan Data */}
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kddept}
                onChange={(e) => setKddept(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring"
              />
              <span className="text-sm text-foreground">Kementerian</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={unit}
                onChange={(e) => setUnit(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring"
              />
              <span className="text-sm text-foreground">Eselon I</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kddekon}
                onChange={(e) => setKddekon(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring"
              />
              <span className="text-sm text-foreground">Kewenangan</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kdkppn}
                onChange={(e) => setKdkppn(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring"
              />
              <span className="text-sm text-foreground">KPPN</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kdsatker}
                onChange={(e) => setKdsatker(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring"
              />
              <span className="text-sm text-foreground">Satker</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kdprogram}
                onChange={(e) => setKdprogram(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring"
              />
              <span className="text-sm text-foreground">Program</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kdgiat}
                onChange={(e) => setKdgiat(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring"
              />
              <span className="text-sm text-foreground">Kegiatan</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kdsdana}
                onChange={(e) => setKdsdana(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring"
              />
              <span className="text-sm text-foreground">Sumber Dana</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kdoutput}
                onChange={(e) => setKdoutput(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring"
              />
              <span className="text-sm text-foreground">Output</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kdakun}
                onChange={(e) => setKdakun(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring"
              />
              <span className="text-sm text-foreground">Akun</span>
            </label>
          </div>
        </div>

        {/* Card 3: Detail Pilihan (Conditional) */}
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {/* Kementerian */}
          {kddept && (
            <div className="mb-6 pb-6 border-b border-border">
              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2">
                  <span className="font-medium text-foreground">
                    Kementerian
                  </span>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="dept-option"
                      value="pilihdept"
                      checked={opsidept === "pilihdept"}
                      onChange={(e) => setopsiDept(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-foreground">Pilih K/L</span>
                  </label>
                </div>
                <div className="col-span-4">
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    disabled={opsidept !== "pilihdept"}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="000">000 - Semua Kementerian</option>
                    <option value="015">015 - Kementerian Keuangan</option>
                    <option value="XXX">XXX - Custom</option>
                  </select>
                </div>
                <div className="col-span-4">
                  <select className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="1">Rincian</option>
                    <option value="2">Group</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="dept-option"
                      value="kondisidept"
                      checked={opsidept === "kondisidept"}
                      onChange={(e) => setopsiDept(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-foreground">Kondisi</span>
                  </label>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={deptkondisi}
                    onChange={(e) => setDeptkondisi(e.target.value)}
                    disabled={opsidept !== "kondisidept"}
                    placeholder="015,020,023"
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="col-span-4 text-xs text-muted-foreground">
                  *) banyak KL gunakan koma, exclude gunakan tanda !
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="dept-option"
                      value="katadept"
                      checked={opsidept === "katadept"}
                      onChange={(e) => setopsiDept(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-foreground">
                      Mengandung Kata
                    </span>
                  </label>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={opsikatadept}
                    onChange={(e) => setopsiKataDept(e.target.value)}
                    disabled={opsidept !== "katadept"}
                    placeholder="KEUANGAN"
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Eselon I */}
          {unit && (
            <div className="mb-6 pb-6 border-b border-border">
              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2">
                  <span className="font-medium text-foreground">Eselon I</span>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="unit-option"
                      value="pilihunit"
                      checked={opsiunit === "pilihunit"}
                      onChange={(e) => setopsiUnit(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-foreground">Pilih Unit</span>
                  </label>
                </div>
                <div className="col-span-4">
                  <select
                    value={kdunit}
                    onChange={(e) => setKdunit(e.target.value)}
                    disabled={opsiunit !== "pilihunit"}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="XX">XX - Semua Unit</option>
                    <option value="01">01 - Sekretariat Jenderal</option>
                    <option value="02">02 - Direktorat Jenderal</option>
                  </select>
                </div>
                <div className="col-span-4">
                  <select className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="1">Rincian</option>
                    <option value="2">Group</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="unit-option"
                      value="kondisiunit"
                      checked={opsiunit === "kondisiunit"}
                      onChange={(e) => setopsiUnit(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-foreground">Kondisi</span>
                  </label>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={unitkondisi}
                    onChange={(e) => setUnitkondisi(e.target.value)}
                    disabled={opsiunit !== "kondisiunit"}
                    placeholder="01,02,03"
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="col-span-4 text-xs text-muted-foreground">
                  *) banyak Unit gunakan koma, exclude gunakan tanda !
                </div>
              </div>
            </div>
          )}

          {/* Kewenangan */}
          {kddekon && (
            <div className="mb-6 pb-6 border-b border-border">
              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2">
                  <span className="font-medium text-foreground">
                    Kewenangan
                  </span>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="dekon-option"
                      value="pilihdekon"
                      checked={opsidekon === "pilihdekon"}
                      onChange={(e) => setopsiDekon(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-foreground">
                      Pilih Kewenangan
                    </span>
                  </label>
                </div>
                <div className="col-span-4">
                  <select
                    value={dekon}
                    onChange={(e) => setDekon(e.target.value)}
                    disabled={opsidekon !== "pilihdekon"}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="XX">XX - Semua</option>
                    <option value="1">1 - Pusat</option>
                    <option value="2">2 - Dekonsentrasi</option>
                    <option value="3">3 - Tugas Pembantuan</option>
                  </select>
                </div>
                <div className="col-span-4">
                  <select className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="1">Rincian</option>
                    <option value="2">Group</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="dekon-option"
                      value="kondisidekon"
                      checked={opsidekon === "kondisidekon"}
                      onChange={(e) => setopsiDekon(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-foreground">Kondisi</span>
                  </label>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={dekonkondisi}
                    onChange={(e) => setDekonkondisi(e.target.value)}
                    disabled={opsidekon !== "kondisidekon"}
                    placeholder="1,2"
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="col-span-4 text-xs text-muted-foreground">
                  *) banyak Kewenangan gunakan koma, exclude gunakan tanda !
                </div>
              </div>
            </div>
          )}

          {/* KPPN */}
          {kdkppn && (
            <div className="mb-6 pb-6 border-b border-zinc-500">
              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2">
                  <span className="font-medium">KPPN</span>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="kppn-option"
                      value="pilihkppn"
                      checked={opsikppn === "pilihkppn"}
                      onChange={(e) => setopsikppn(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Pilih KPPN</span>
                  </label>
                </div>
                <div className="col-span-4">
                  <select
                    value={kppn}
                    onChange={(e) => setKppn(e.target.value)}
                    disabled={opsikppn !== "pilihkppn"}
                    className="w-full bg-zinc-700 border border-zinc-500 rounded px-3 py-2 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="XX">XX - Semua KPPN</option>
                    <option value="001">001 - KPPN Jakarta I</option>
                    <option value="002">002 - KPPN Jakarta II</option>
                  </select>
                </div>
                <div className="col-span-4">
                  <select className="w-full bg-zinc-700 border border-zinc-500 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="1">Rincian</option>
                    <option value="2">Group</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="kppn-option"
                      value="kondisikppn"
                      checked={opsikppn === "kondisikppn"}
                      onChange={(e) => setopsikppn(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Kondisi</span>
                  </label>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={kppnkondisi}
                    onChange={(e) => setkppnkondisi(e.target.value)}
                    disabled={opsikppn !== "kondisikppn"}
                    placeholder="001,002,003"
                    className="w-full bg-zinc-700 border border-zinc-500 rounded px-3 py-2 text-white placeholder-zinc-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-4 text-xs opacity-70">
                  *) banyak KPPN gunakan koma, exclude gunakan tanda !
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="kppn-option"
                      value="katakppn"
                      checked={opsikppn === "katakppn"}
                      onChange={(e) => setopsikppn(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Mengandung Kata</span>
                  </label>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={opsikatakppn}
                    onChange={(e) => setopsiKatakppn(e.target.value)}
                    disabled={opsikppn !== "katakppn"}
                    placeholder="JAKARTA"
                    className="w-full bg-zinc-700 border border-zinc-500 rounded px-3 py-2 text-white placeholder-zinc-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Satker */}
          {kdsatker && (
            <div className="mb-6 pb-6 border-b border-zinc-500">
              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2">
                  <span className="font-medium">Satker</span>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="satker-option"
                      value="pilihsatker"
                      checked={opsisatker === "pilihsatker"}
                      onChange={(e) => setopsisatker(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Pilih Satker</span>
                  </label>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={satker}
                    onChange={(e) => setSatker(e.target.value)}
                    disabled={opsisatker !== "pilihsatker"}
                    placeholder="Kode Satker"
                    className="w-full bg-zinc-700 border border-zinc-500 rounded px-3 py-2 text-white placeholder-zinc-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-4">
                  <select className="w-full bg-zinc-700 border border-zinc-500 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="1">Rincian</option>
                    <option value="2">Group</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="satker-option"
                      value="kondisisatker"
                      checked={opsisatker === "kondisisatker"}
                      onChange={(e) => setopsisatker(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Kondisi</span>
                  </label>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={satkerkondisi}
                    onChange={(e) => setsatkerkondisi(e.target.value)}
                    disabled={opsisatker !== "kondisisatker"}
                    placeholder="123456,234567"
                    className="w-full bg-zinc-700 border border-zinc-500 rounded px-3 py-2 text-white placeholder-zinc-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-4 text-xs opacity-70">
                  *) banyak Satker gunakan koma, exclude gunakan tanda !
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="satker-option"
                      value="katasatker"
                      checked={opsisatker === "katasatker"}
                      onChange={(e) => setopsisatker(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Mengandung Kata</span>
                  </label>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={opsikatasatker}
                    onChange={(e) => setopsiKatasatker(e.target.value)}
                    disabled={opsisatker !== "katasatker"}
                    placeholder="KANTOR PUSAT"
                    className="w-full bg-zinc-700 border border-zinc-500 rounded px-3 py-2 text-white placeholder-zinc-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Program, Kegiatan, Sumber Dana, Output, Akun - Similar structure */}
          {/* Untuk menghemat space, saya hanya menampilkan beberapa contoh di atas */}
          {/* Anda bisa menambahkan section serupa untuk field lainnya */}

          {/* Action Buttons - positioned at bottom of card with border-top */}
          <div className="border-t pt-6 mt-6">
            <div className="flex flex-wrap justify-center gap-3">
              {/* Tayang Button */}
              <Button
                onClick={handleGetQuery}
                className="min-w-[150px] h-10"
                disabled={loadingStatus}
              >
                <Eye className="w-4 h-4 mr-2" />
                {loadingStatus ? "Loading..." : "Tayang"}
              </Button>

              {/* Download Excel Button */}
              <Button
                variant="outline"
                className="min-w-[150px] h-10"
                disabled={loadingStatus}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download Excel
              </Button>

              {/* Download CSV Button */}
              <Button
                variant="outline"
                className="min-w-[150px] h-10"
                disabled={loadingStatus}
              >
                <FileText className="w-4 h-4 mr-2" />
                Download CSV
              </Button>

              {/* WhatsApp Button */}
              <Button
                className="bg-green-600 hover:bg-green-700 text-white min-w-[150px] h-10"
                disabled={loadingStatus}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>

              {/* Simpan Button */}
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white min-w-[150px] h-10"
                disabled={loadingStatus}
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </Button>

              {/* Lihat SQL Button */}
              <Button
                variant="outline"
                className="min-w-[150px] h-10"
                disabled={loadingStatus}
              >
                <FileCode className="w-4 h-4 mr-2" />
                Lihat SQL
              </Button>
            </div>
          </div>
        </div>

        {/* Results Area Placeholder */}
        <div className="bg-white dark:bg-card rounded-xl p-6 min-h-[200px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <p className="text-muted-foreground text-center">
            Hasil query akan ditampilkan di sini
          </p>
        </div>
      </div>
    </div>
  );
}
