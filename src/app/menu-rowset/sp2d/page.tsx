"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parameter Dasar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tahun Anggaran */}
            <div>
              <Label htmlFor="thang">Tahun Anggaran</Label>
              <Select value={thang.toString()} onValueChange={(val) => setThang(Number(val))}>
                <SelectTrigger id="thang" className="w-full mt-1.5">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Jenis Laporan */}
            <div>
              <Label htmlFor="jenlap">Jenis Laporan</Label>
              <Select value={jenlap} onValueChange={setJenlap}>
                <SelectTrigger id="jenlap" className="w-full mt-1.5">
                  <SelectValue placeholder="Pilih jenis laporan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Rowset SP2D</SelectItem>
                  <SelectItem value="2">Rowset SP2D Detail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pembulatan */}
            <div>
              <Label htmlFor="pembulatan">Pembulatan</Label>
              <Select value={pembulatan} onValueChange={setPembulatan}>
                <SelectTrigger id="pembulatan" className="w-full mt-1.5">
                  <SelectValue placeholder="Pilih pembulatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tanpa Pembulatan</SelectItem>
                  <SelectItem value="1000">Ribuan</SelectItem>
                  <SelectItem value="1000000">Jutaan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            TA: {thang}, TIPE LAPORAN: {jenlap}, AKUMULATIF:{" "}
            {akumulatif ? "TRUE" : "FALSE"}, PEMBULATAN: {pembulatan}
          </div>
          </CardContent>
        </Card>

        {/* Card 2: Switch Pilihan Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pilih Data</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="kddept"
                checked={kddept}
                onCheckedChange={(checked) => setKddept(checked === true)}
              />
              <Label htmlFor="kddept" className="text-sm cursor-pointer">
                Kementerian
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="unit"
                checked={unit}
                onCheckedChange={(checked) => setUnit(checked === true)}
              />
              <Label htmlFor="unit" className="text-sm cursor-pointer">
                Eselon I
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="kddekon"
                checked={kddekon}
                onCheckedChange={(checked) => setKddekon(checked === true)}
              />
              <Label htmlFor="kddekon" className="text-sm cursor-pointer">
                Kewenangan
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="kdkppn"
                checked={kdkppn}
                onCheckedChange={(checked) => setKdkppn(checked === true)}
              />
              <Label htmlFor="kdkppn" className="text-sm cursor-pointer">
                KPPN
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="kdsatker"
                checked={kdsatker}
                onCheckedChange={(checked) => setKdsatker(checked === true)}
              />
              <Label htmlFor="kdsatker" className="text-sm cursor-pointer">
                Satker
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="kdprogram"
                checked={kdprogram}
                onCheckedChange={(checked) => setKdprogram(checked === true)}
              />
              <Label htmlFor="kdprogram" className="text-sm cursor-pointer">
                Program
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="kdgiat"
                checked={kdgiat}
                onCheckedChange={(checked) => setKdgiat(checked === true)}
              />
              <Label htmlFor="kdgiat" className="text-sm cursor-pointer">
                Kegiatan
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="kdsdana"
                checked={kdsdana}
                onCheckedChange={(checked) => setKdsdana(checked === true)}
              />
              <Label htmlFor="kdsdana" className="text-sm cursor-pointer">
                Sumber Dana
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="kdoutput"
                checked={kdoutput}
                onCheckedChange={(checked) => setKdoutput(checked === true)}
              />
              <Label htmlFor="kdoutput" className="text-sm cursor-pointer">
                Output
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="kdakun"
                checked={kdakun}
                onCheckedChange={(checked) => setKdakun(checked === true)}
              />
              <Label htmlFor="kdakun" className="text-sm cursor-pointer">
                Akun
              </Label>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Card 3: Detail Pilihan (Conditional) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detail Pilihan</CardTitle>
          </CardHeader>
          <CardContent>
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
                  <RadioGroup
                    value={opsidept}
                    onValueChange={setopsiDept}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pilihdept" id="dept-pilih" />
                      <Label htmlFor="dept-pilih" className="text-sm">
                        Pilih K/L
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Select
                    value={dept}
                    onValueChange={setDept}
                    disabled={opsidept !== "pilihdept"}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Pilih Kementerian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="000">000 - Semua Kementerian</SelectItem>
                      <SelectItem value="015">015 - Kementerian Keuangan</SelectItem>
                      <SelectItem value="XXX">XXX - Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4">
                  <Select defaultValue="1">
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Rincian</SelectItem>
                      <SelectItem value="2">Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <RadioGroup
                    value={opsidept}
                    onValueChange={setopsiDept}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="kondisidept" id="dept-kondisi" />
                      <Label htmlFor="dept-kondisi" className="text-sm">
                        Kondisi
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Input
                    type="text"
                    value={deptkondisi}
                    onChange={(e) => setDeptkondisi(e.target.value)}
                    disabled={opsidept !== "kondisidept"}
                    placeholder="015,020,023"
                    className="w-full mt-1.5"
                  />
                </div>
                <div className="col-span-4 text-xs text-muted-foreground">
                  *) banyak KL gunakan koma, exclude gunakan tanda !
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <RadioGroup
                    value={opsidept}
                    onValueChange={setopsiDept}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="katadept" id="dept-kata" />
                      <Label htmlFor="dept-kata" className="text-sm">
                        Mengandung Kata
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Input
                    type="text"
                    value={opsikatadept}
                    onChange={(e) => setopsiKataDept(e.target.value)}
                    disabled={opsidept !== "katadept"}
                    placeholder="KEUANGAN"
                    className="w-full mt-1.5"
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
                  <RadioGroup
                    value={opsiunit}
                    onValueChange={setopsiUnit}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pilihunit" id="unit-pilih" />
                      <Label htmlFor="unit-pilih" className="text-sm">
                        Pilih Unit
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Select
                    value={kdunit}
                    onValueChange={setKdunit}
                    disabled={opsiunit !== "pilihunit"}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Pilih Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XX">XX - Semua Unit</SelectItem>
                      <SelectItem value="01">01 - Sekretariat Jenderal</SelectItem>
                      <SelectItem value="02">02 - Direktorat Jenderal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4">
                  <Select defaultValue="1">
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Rincian</SelectItem>
                      <SelectItem value="2">Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <RadioGroup
                    value={opsiunit}
                    onValueChange={setopsiUnit}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="kondisiunit" id="unit-kondisi" />
                      <Label htmlFor="unit-kondisi" className="text-sm">
                        Kondisi
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Input
                    type="text"
                    value={unitkondisi}
                    onChange={(e) => setUnitkondisi(e.target.value)}
                    disabled={opsiunit !== "kondisiunit"}
                    placeholder="01,02,03"
                    className="w-full mt-1.5"
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
                  <RadioGroup
                    value={opsidekon}
                    onValueChange={setopsiDekon}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pilihdekon" id="dekon-pilih" />
                      <Label htmlFor="dekon-pilih" className="text-sm">
                        Pilih Kewenangan
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Select
                    value={dekon}
                    onValueChange={setDekon}
                    disabled={opsidekon !== "pilihdekon"}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Pilih Kewenangan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XX">XX - Semua</SelectItem>
                      <SelectItem value="1">1 - Pusat</SelectItem>
                      <SelectItem value="2">2 - Dekonsentrasi</SelectItem>
                      <SelectItem value="3">3 - Tugas Pembantuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4">
                  <Select defaultValue="1">
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Rincian</SelectItem>
                      <SelectItem value="2">Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <RadioGroup
                    value={opsidekon}
                    onValueChange={setopsiDekon}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="kondisidekon" id="dekon-kondisi" />
                      <Label htmlFor="dekon-kondisi" className="text-sm">
                        Kondisi
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Input
                    type="text"
                    value={dekonkondisi}
                    onChange={(e) => setDekonkondisi(e.target.value)}
                    disabled={opsidekon !== "kondisidekon"}
                    placeholder="1,2"
                    className="w-full mt-1.5"
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
            <div className="mb-6 pb-6 border-b border-border">
              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2">
                  <span className="font-medium text-foreground">KPPN</span>
                </div>
                <div className="col-span-2">
                  <RadioGroup
                    value={opsikppn}
                    onValueChange={setopsikppn}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pilihkppn" id="kppn-pilih" />
                      <Label htmlFor="kppn-pilih" className="text-sm">
                        Pilih KPPN
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Select
                    value={kppn}
                    onValueChange={setKppn}
                    disabled={opsikppn !== "pilihkppn"}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Pilih KPPN" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XX">XX - Semua KPPN</SelectItem>
                      <SelectItem value="001">001 - KPPN Jakarta I</SelectItem>
                      <SelectItem value="002">002 - KPPN Jakarta II</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4">
                  <Select defaultValue="1">
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Rincian</SelectItem>
                      <SelectItem value="2">Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <RadioGroup
                    value={opsikppn}
                    onValueChange={setopsikppn}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="kondisikppn" id="kppn-kondisi" />
                      <Label htmlFor="kppn-kondisi" className="text-sm">
                        Kondisi
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Input
                    type="text"
                    value={kppnkondisi}
                    onChange={(e) => setkppnkondisi(e.target.value)}
                    disabled={opsikppn !== "kondisikppn"}
                    placeholder="001,002,003"
                    className="w-full mt-1.5"
                  />
                </div>
                <div className="col-span-4 text-xs text-muted-foreground">
                  *) banyak KPPN gunakan koma, exclude gunakan tanda !
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <RadioGroup
                    value={opsikppn}
                    onValueChange={setopsikppn}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="katakppn" id="kppn-kata" />
                      <Label htmlFor="kppn-kata" className="text-sm">
                        Mengandung Kata
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Input
                    type="text"
                    value={opsikatakppn}
                    onChange={(e) => setopsiKatakppn(e.target.value)}
                    disabled={opsikppn !== "katakppn"}
                    placeholder="JAKARTA"
                    className="w-full mt-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Satker */}
          {kdsatker && (
            <div className="mb-6 pb-6 border-b border-border">
              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2">
                  <span className="font-medium text-foreground">Satker</span>
                </div>
                <div className="col-span-2">
                  <RadioGroup
                    value={opsisatker}
                    onValueChange={setopsisatker}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pilihsatker" id="satker-pilih" />
                      <Label htmlFor="satker-pilih" className="text-sm">
                        Pilih Satker
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Input
                    type="text"
                    value={satker}
                    onChange={(e) => setSatker(e.target.value)}
                    disabled={opsisatker !== "pilihsatker"}
                    placeholder="Kode Satker"
                    className="w-full mt-1.5"
                  />
                </div>
                <div className="col-span-4">
                  <Select defaultValue="1">
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Rincian</SelectItem>
                      <SelectItem value="2">Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center mb-3">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <RadioGroup
                    value={opsisatker}
                    onValueChange={setopsisatker}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="kondisisatker" id="satker-kondisi" />
                      <Label htmlFor="satker-kondisi" className="text-sm">
                        Kondisi
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Input
                    type="text"
                    value={satkerkondisi}
                    onChange={(e) => setsatkerkondisi(e.target.value)}
                    disabled={opsisatker !== "kondisisatker"}
                    placeholder="123456,234567"
                    className="w-full mt-1.5"
                  />
                </div>
                <div className="col-span-4 text-xs text-muted-foreground">
                  *) banyak Satker gunakan koma, exclude gunakan tanda !
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2"></div>
                <div className="col-span-2">
                  <RadioGroup
                    value={opsisatker}
                    onValueChange={setopsisatker}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="katasatker" id="satker-kata" />
                      <Label htmlFor="satker-kata" className="text-sm">
                        Mengandung Kata
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="col-span-4">
                  <Input
                    type="text"
                    value={opsikatasatker}
                    onChange={(e) => setopsiKatasatker(e.target.value)}
                    disabled={opsisatker !== "katasatker"}
                    placeholder="KANTOR PUSAT"
                    className="w-full mt-1.5"
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
          </CardContent>
        </Card>

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
