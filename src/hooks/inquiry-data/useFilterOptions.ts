"use client";

import { useMemo } from "react";
import type { Option } from "@/components/inquiry-data/filters/types";

// Import JSON data from the correct location
import kddeptData from "@/components/inquiry-data/data/kddept.json";
import kdunitData from "@/components/inquiry-data/data/kdunit.json";
import kdkanwilData from "@/components/inquiry-data/data/kdkanwil.json";
import kdkppnData from "@/components/inquiry-data/data/kdkppn.json";
import kdlokasiData from "@/components/inquiry-data/data/kdlokasi.json";
import kddekonData from "@/components/inquiry-data/data/kddekon.json";
import kdkabkotaData from "@/components/inquiry-data/data/kdkabkota.json";
import kdsatkerData from "@/components/inquiry-data/data/kdsatker.json";
import kdfungsiData from "@/components/inquiry-data/data/kdfungsi.json";
import kdsfungData from "@/components/inquiry-data/data/kdsfung.json";
import kdprogramData from "@/components/inquiry-data/data/kdprogram.json";
import kdgiatData from "@/components/inquiry-data/data/kdgiat.json";
import kdoutputData from "@/components/inquiry-data/data/kdoutput.json";
import kdsoutputData from "@/components/inquiry-data/data/kdsoutput.json";
import kdakunData from "@/components/inquiry-data/data/kdakun.json";
import kdbkpkData from "@/components/inquiry-data/data/kdbkpk.json";
import kdgbkpkData from "@/components/inquiry-data/data/kdgbkpk.json";
import kdsdanaData from "@/components/inquiry-data/data/kdsdana.json";
import kdpnData from "@/components/inquiry-data/data/kdpn.json";
import kdppData from "@/components/inquiry-data/data/kdpp.json";
import kdkpData from "@/components/inquiry-data/data/kdkp.json";
import kdproyData from "@/components/inquiry-data/data/kdproy.json";
import kdmpData from "@/components/inquiry-data/data/kdmp.json";
import infIntervensiData from "@/components/inquiry-data/data/inf_intervensi.json";
import infPengeluaranData from "@/components/inquiry-data/data/inf_pengeluaran.json";
import kdprogisData from "@/components/inquiry-data/data/kdprogis.json";
import kdtemaData from "@/components/inquiry-data/data/kdtema.json";

interface UseFilterOptionsProps {
  filterKey: string;
  activeFilterValues?: Record<string, string>;
}

const commonOptions: Option[] = [{ value: "all", label: "Semua" }];

export function useFilterOptions({ filterKey, activeFilterValues = {} }: UseFilterOptionsProps): Option[] {
  return useMemo(() => {
    // Handler functions for each filter type
    const handlers: Record<string, (dependencies: Record<string, string>) => Option[]> = {
      jenisKontrak: () => [
        { value: "SYC", label: "SYC - Single Year Contract" },
        { value: "MYC", label: "MYC - Multi Years Contract" },
      ],

      jenisTemaAnggaran: () => {
        const options = (kdtemaData as Array<{ kdtema: string; nmtema: string }>).map((item) => ({
          value: item.kdtema,
          label: `${item.kdtema} - ${item.nmtema}`,
        }));
        return options; // No "Semua" option for this filter
      },

      kementerian: () => {
        const kementarianOptions = (kddeptData as Array<{ kddept: string; nmdept: string }>).map((item) => ({
          value: item.kddept,
          label: `${item.kddept} - ${item.nmdept}`,
        }));
        return [...commonOptions, ...kementarianOptions];
      },

      eselonI: (deps) => {
        const selectedKementerian = deps.kementerian;
        let eselonIData = kdunitData as Array<{ kdunit: string; nmunit: string; kddept: string }>;

        if (selectedKementerian && selectedKementerian !== "all") {
          eselonIData = eselonIData.filter((item) => item.kddept === selectedKementerian);
        }

        const eselonIOptions = eselonIData.map((item) => ({
          value: item.kdunit,
          label: `${item.kdunit} - ${item.nmunit}`,
        }));
        return [...commonOptions, ...eselonIOptions];
      },

      kanwil: (deps) => {
        const selectedProvinsi = deps.provinsi;
        let kanwilData = kdkanwilData as Array<{ kdkanwil: string; nmkanwil: string; kdlokasi: string }>;

        if (selectedProvinsi && selectedProvinsi !== "all") {
          kanwilData = kanwilData.filter((item) => item.kdlokasi === selectedProvinsi);
        }

        const kanwilOptions = kanwilData.map((item) => ({
          value: item.kdkanwil,
          label: `${item.kdkanwil} - ${item.nmkanwil}`,
        }));
        return [...commonOptions, ...kanwilOptions];
      },

      kppn: (deps) => {
        const selectedKanwil = deps.kanwil;
        let kppnData = kdkppnData as Array<{ kdkppn: string; nmkppn: string; kdkanwil: string }>;

        if (selectedKanwil && selectedKanwil !== "all") {
          kppnData = kppnData.filter((item) => item.kdkanwil === selectedKanwil);
        }

        const kppnOptions = kppnData.map((item) => ({
          value: item.kdkppn,
          label: `${item.kdkppn} - ${item.nmkppn}`,
        }));
        return [...commonOptions, ...kppnOptions];
      },

      kewenangan: () => {
        const uniqueKewenangan = new Map<string, Option>();
        (kddekonData as Array<{ kddekon: string; nmdekon: string }>).forEach((item) => {
          if (!uniqueKewenangan.has(item.kddekon)) {
            uniqueKewenangan.set(item.kddekon, {
              value: item.kddekon,
              label: `${item.kddekon} - ${item.nmdekon}`,
            });
          }
        });
        const kewenanganOptions = Array.from(uniqueKewenangan.values());
        return [...commonOptions, ...kewenanganOptions];
      },

      provinsi: () => {
        const provinsiOptions = (kdlokasiData as Array<{ kdlokasi: string; nmlokasi: string }>).map((item) => ({
          value: item.kdlokasi,
          label: `${item.kdlokasi} - ${item.nmlokasi}`,
        }));
        return [...commonOptions, ...provinsiOptions];
      },

      kabkota: (deps) => {
        const selectedProvinsi = deps.provinsi;
        let kabkotaData = (kdkabkotaData as Array<{ kdkabkota: string; nmkabkota: string; kdlokasi: string }>);

        if (selectedProvinsi && selectedProvinsi !== "all") {
          kabkotaData = kabkotaData.filter((item) => item.kdlokasi === selectedProvinsi);
        }

        const kabkotaOptions = kabkotaData.map((item) => ({
          value: item.kdkabkota,
          label: `${item.kdkabkota} - ${item.nmkabkota}`,
        }));
        return [...commonOptions, ...kabkotaOptions];
      },

      satker: (deps) => {
        const selectedKementerian = deps.kementerian;
        const selectedKanwil = deps.kanwil;
        const selectedKppn = deps.kppn;

        let satkerData = kdsatkerData as Array<{
          kdsatker: string;
          nmsatker: string;
          kddept: string;
          kdkanwil: string;
          kdkppn: string;
        }>;

        if (selectedKementerian && selectedKementerian !== "all") {
          satkerData = satkerData.filter((item) => item.kddept === selectedKementerian);
        }

        if (selectedKanwil && selectedKanwil !== "all") {
          satkerData = satkerData.filter((item) => item.kdkanwil === selectedKanwil);
        }

        if (selectedKppn && selectedKppn !== "all") {
          satkerData = satkerData.filter((item) => item.kdkppn === selectedKppn);
        }

        const satkerOptions = satkerData.map((item) => ({
          value: item.kdsatker,
          label: `${item.kdsatker} - ${item.nmsatker}`,
        }));
        return [...commonOptions, ...satkerOptions];
      },

      fungsi: () => {
        const fungsiOptions = (kdfungsiData as Array<{ kdfungsi: string; nmfungsi: string }>).map((item) => ({
          value: item.kdfungsi,
          label: `${item.kdfungsi} - ${item.nmfungsi}`,
        }));
        return [...commonOptions, ...fungsiOptions];
      },

      subFungsi: (deps) => {
        const selectedFungsi = deps.fungsi;
        let subFungsiData = kdsfungData as Array<{
          kdfungsi: string;
          kdsfung: string;
          nmsfung: string;
        }>;

        if (selectedFungsi && selectedFungsi !== "all") {
          subFungsiData = subFungsiData.filter((item) => item.kdfungsi === selectedFungsi);
        }

        const subFungsiOptions = subFungsiData.map((item) => ({
          value: item.kdsfung,
          label: `${item.kdsfung} - ${item.nmsfung}`,
        }));
        return [...commonOptions, ...subFungsiOptions];
      },

      program: (deps) => {
        const selectedKementerian = deps.kementerian;
        const selectedEselonI = deps.eselonI;
        let programData = kdprogramData as Array<{
          kdprogram: string;
          nmprogram: string;
          kddept: string;
          kdunit: string;
        }>;

        if (selectedKementerian && selectedKementerian !== "all") {
          programData = programData.filter((item) => item.kddept === selectedKementerian);
        }

        if (selectedEselonI && selectedEselonI !== "all") {
          programData = programData.filter((item) => item.kdunit === selectedEselonI);
        }

        const programOptions = programData.map((item) => ({
          value: item.kdprogram,
          label: `${item.kdprogram} - ${item.nmprogram}`,
        }));
        return [...commonOptions, ...programOptions];
      },

      kegiatan: (deps) => {
        const selectedProgram = deps.program;
        let kegiatanData = kdgiatData as Array<{
          kdgiat: string;
          nmgiat: string;
          kdprogram: string;
        }>;

        if (selectedProgram && selectedProgram !== "all") {
          kegiatanData = kegiatanData.filter((item) => item.kdprogram === selectedProgram);
        }

        const kegiatanOptions = kegiatanData.map((item) => ({
          value: item.kdgiat,
          label: `${item.kdgiat} - ${item.nmgiat}`,
        }));
        return [...commonOptions, ...kegiatanOptions];
      },

      outputKro: (deps) => {
        const selectedKementerian = deps.kementerian;
        const selectedEselonI = deps.eselonI;
        const selectedProgram = deps.program;
        const selectedKegiatan = deps.kegiatan;

        let outputData = kdoutputData as Array<{
          kdoutput: string;
          nmoutput: string;
          kddept: string;
          kdunit: string;
          kdprogram: string;
          kdgiat: string;
        }>;

        if (selectedKementerian && selectedKementerian !== "all") {
          outputData = outputData.filter((item) => item.kddept === selectedKementerian);
        }

        if (selectedEselonI && selectedEselonI !== "all") {
          outputData = outputData.filter((item) => item.kdunit === selectedEselonI);
        }

        if (selectedProgram && selectedProgram !== "all") {
          outputData = outputData.filter((item) => item.kdprogram === selectedProgram);
        }

        if (selectedKegiatan && selectedKegiatan !== "all") {
          outputData = outputData.filter((item) => item.kdgiat === selectedKegiatan);
        }

        const outputOptions = outputData.map((item) => ({
          value: item.kdoutput,
          label: `${item.kdoutput} - ${item.nmoutput}`,
        }));
        return [...commonOptions, ...outputOptions];
      },

      subOutputRo: (deps) => {
        const selectedKementerian = deps.kementerian;
        const selectedEselonI = deps.eselonI;
        const selectedProgram = deps.program;
        const selectedKegiatan = deps.kegiatan;
        const selectedOutput = deps.outputKro;

        let subOutputData = kdsoutputData as Array<{
          kdsoutput: string;
          nmsoutput: string;
          kddept: string;
          kdunit: string;
          kdprogram: string;
          kdgiat: string;
          kdoutput: string;
        }>;

        if (selectedKementerian && selectedKementerian !== "all") {
          subOutputData = subOutputData.filter((item) => item.kddept === selectedKementerian);
        }

        if (selectedEselonI && selectedEselonI !== "all") {
          subOutputData = subOutputData.filter((item) => item.kdunit === selectedEselonI);
        }

        if (selectedProgram && selectedProgram !== "all") {
          subOutputData = subOutputData.filter((item) => item.kdprogram === selectedProgram);
        }

        if (selectedKegiatan && selectedKegiatan !== "all") {
          subOutputData = subOutputData.filter((item) => item.kdgiat === selectedKegiatan);
        }

        if (selectedOutput && selectedOutput !== "all") {
          subOutputData = subOutputData.filter((item) => item.kdoutput === selectedOutput);
        }

        const subOutputOptions = subOutputData.map((item) => ({
          value: item.kdsoutput,
          label: `${item.kdsoutput} - ${item.nmsoutput}`,
        }));
        return [...commonOptions, ...subOutputOptions];
      },

      // Continue with remaining filter types...
      jenisPn: () => {
        const pnOptions = (kdpnData as Array<{ kdpn: string; nmpn: string }>).map((item) => ({
          value: item.kdpn,
          label: `${item.kdpn} - ${item.nmpn}`,
        }));
        return [...commonOptions, ...pnOptions];
      },

      programPrioritas: (deps) => {
        const selectedPn = deps.jenisPn;
        let data = kdppData as Array<{ kdpn: string; kdpp: string; nmpp: string }>;

        if (selectedPn && selectedPn !== "all") {
          data = data.filter((item) => item.kdpn === selectedPn);
        }

        const options = data.map((item) => ({
          value: item.kdpp,
          label: `${item.kdpp} - ${item.nmpp}`,
        }));
        return [...commonOptions, ...options];
      },

      kegiatanPrioritas: (deps) => {
        const selectedPn = deps.jenisPn;
        const selectedPp = deps.programPrioritas;
        let data = kdkpData as Array<{
          kdpn: string;
          kdpp: string;
          kdkp: string;
          deskripsi: string;
        }>;

        if (selectedPn && selectedPn !== "all") {
          data = data.filter((item) => item.kdpn === selectedPn);
        }

        if (selectedPp && selectedPp !== "all") {
          data = data.filter((item) => item.kdpp === selectedPp);
        }

        const options = data.map((item) => ({
          value: item.kdkp,
          label: `${item.kdkp} - ${item.deskripsi}`,
        }));
        return [...commonOptions, ...options];
      },

      proyekPrioritas: (deps) => {
        const selectedPn = deps.jenisPn;
        const selectedPp = deps.programPrioritas;
        const selectedKp = deps.kegiatanPrioritas;
        let data = kdproyData as Array<{
          kdpn: string;
          kdpp: string;
          kdkp: string;
          kdproy: string;
          deskripsi: string;
        }>;

        if (selectedPn && selectedPn !== "all") {
          data = data.filter((item) => item.kdpn === selectedPn);
        }

        if (selectedPp && selectedPp !== "all") {
          data = data.filter((item) => item.kdpp === selectedPp);
        }

        if (selectedKp && selectedKp !== "all") {
          data = data.filter((item) => item.kdkp === selectedKp);
        }

        const options = data.map((item) => ({
          value: item.kdproy,
          label: `${item.kdproy} - ${item.deskripsi}`,
        }));
        return [...commonOptions, ...options];
      },

      jenisMajorProject: () => {
        const majorProjectOptions = (kdmpData as Array<{ kdmp: string; nmmp: string }>).map((item) => ({
          value: item.kdmp,
          label: `${item.kdmp} - ${item.nmmp}`,
        }));
        return [...commonOptions, ...majorProjectOptions];
      },

      // Add more handlers as needed...
    };

    const handler = handlers[filterKey];
    return handler ? handler(activeFilterValues) : commonOptions;
  }, [filterKey, activeFilterValues]);
}
