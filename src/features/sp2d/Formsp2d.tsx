import React, { useState, useEffect, useContext } from "react";
// @ts-ignore
import { Row, Col, Card, Button, Form, Spinner } from "react-bootstrap";
// @ts-ignore
import MyContext from "../../../auth/Context";
// @ts-ignore
import Thang from "../../referensi/ThangKontrak";
// @ts-ignore
import Kddept from "../../referensi/Kddept";
// import CutOff from "../../referensi/CutOff"; // Unused import
// @ts-ignore
import Kdunit from "../../referensi/Kdunit";
// @ts-ignore
import Kddekon from "../../referensi/Kddekon";

// @ts-ignore
import Kdprogram from "../../referensi/Kdprogram";
// @ts-ignore
import Kdgiat from "../../referensi/Kdgiat";
// @ts-ignore
import Kdoutput from "../../referensi/Kdoutput";
// @ts-ignore
import Kdakun from "../../referensi/Kdakun";
// @ts-ignore
import Kdsdana from "../../referensi/Kdsdana";
// @ts-ignore
import Pembulatan from "../../referensi/Pembulatan";
// @ts-ignore
import pilihanData from "../inquiry/pilihanData";

// @ts-ignore
import { Sql } from "./../../aplikasi/inquiry/hasilQuery";
// @ts-ignore
import InputDept from "../inquiry/kondisi/InputDept";
// @ts-ignore
import DeptRadio from "../inquiry/radio/deptRadio";
// @ts-ignore
import UnitRadio from "../inquiry/radio/unitRadio";
// @ts-ignore
import DekonRadio from "../inquiry/radio/dekonRadio";
// @ts-ignore
import ProgramRadio from "../inquiry/radio/programRadio";
// @ts-ignore
import KegiatanRadio from "../inquiry/radio/kegiatanRadio";
// @ts-ignore
import OutputRadio from "../inquiry/radio/outputRadio";
// @ts-ignore
import AkunRadio from "../inquiry/radio/akunRadio";
// @ts-ignore
import SdanaRadio from "../inquiry/radio/sdanaRadio";
// @ts-ignore
import GenerateCSV from "../CSV/generateCSV";

// @ts-ignore
import Kdsatker from "../../referensi/Kdsatker";
// @ts-ignore
import SatkerRadio from "../inquiry/radio/satkerRadio";
// @ts-ignore
import InputSatker from "../inquiry/kondisi/InputSatker";
import "../../layout/query.css";
// @ts-ignore
import { Simpan } from "../simpanquery/simpan";
// @ts-ignore
import InputDekon from "../inquiry/kondisi/InputDekon";
// @ts-ignore
import InputUnit from "../inquiry/kondisi/InputUnit";
// @ts-ignore
import InputKataDept from "../inquiry/kondisi/InputKataDept";
// @ts-ignore
import InputKataSatker from "../inquiry/kondisi/InputKataSatker";
// @ts-ignore
import InputKataOutput from "../inquiry/kondisi/InputKataOutput";
// @ts-ignore
import InputOutput from "../inquiry/kondisi/InputOutput";
// @ts-ignore
import InputKatakegiatan from "../inquiry/kondisi/InputKatakegiatan";
// @ts-ignore
import Inputkegiatan from "../inquiry/kondisi/Inputkegiatan";
// @ts-ignore
import InputKataProgram from "../inquiry/kondisi/InputKataProgram";
// @ts-ignore
import InputProgram from "../inquiry/kondisi/InputProgram";
// @ts-ignore
import InputKataSdana from "../inquiry/kondisi/InputKataSdana";
// @ts-ignore
import InputSdana from "../inquiry/kondisi/InputSdana";
// @ts-ignore
import InputKataAkun from "../inquiry/kondisi/InputKataAkun";
// @ts-ignore
import InputAkun from "../inquiry/kondisi/InputAkun";
// @ts-ignore
import moment from "moment";
// @ts-ignore
import InputKataKppn from "../inquiry/kondisi/InputKataKppn";
// @ts-ignore
import InputKppn from "../inquiry/kondisi/InputKppn";
// @ts-ignore
import InputKataKanwil from "../inquiry/kondisi/InputKataKanwil";
// @ts-ignore
import InputKanwil from "../inquiry/kondisi/InputKanwil";
// @ts-ignore
import Kdkanwil from "../../referensi/Kdkanwil";
// @ts-ignore
import Kdkppn from "../../referensi/Kdkppn";
// @ts-ignore
import KppnRadio from "../inquiry/radio/kppnRadio";
// @ts-ignore
import KanwilRadio from "../inquiry/radio/kanwilRadio";
// @ts-ignore
import HasilQuerySp2d from "./hasilQuerySp2d";
// @ts-ignore
import JenisLaporanRowset from "../../referensi/JenisLaporanRowset";
// @ts-ignore
import { getSQL } from "./SQLSp2d";

// Interface for Context
interface AuthContextProps {
  role: string;
  kdkppn: string;
  kdkanwil: string;
}

// Interface for Query Params used in generateSql
interface QueryParams {
  [key: string]: any; // Allow flexibility given the massive amount of dynamic keys
}

const InquirySP2D: React.FC = () => {
  const {
    role,
    kdkppn: kodekppn,
    kdkanwil: kodekanwil,
  } = useContext(MyContext) as AuthContextProps;

  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showModalsql, setShowModalsql] = useState<boolean>(false);
  const [showModalsimpan, setShowModalsimpan] = useState<boolean>(false);

  const [export2, setExport2] = useState<boolean>(false);
  const [jenlap, setJenlap] = useState<string>("1");
  const [thang, setThang] = useState<number>(new Date().getFullYear());
  const [tanggal, setTanggal] = useState<boolean>(true);

  // Boolean switches for showing sections
  const [kddept, setKddept] = useState<boolean>(true);
  const [unit, setUnit] = useState<boolean>(false);
  const [kdkanwil, setKdkanwil] = useState<boolean>(false);
  const [kdkppn, setKdkppn] = useState<boolean>(false);
  const [kdsatker, setKdsatker] = useState<boolean>(false);
  const [kddekon, setKddekon] = useState<boolean>(false);
  const [kdprogram, setKdprogram] = useState<boolean>(false);
  const [kdgiat, setKdgiat] = useState<boolean>(false);
  const [kdoutput, setKdoutput] = useState<boolean>(false);
  const [kdakun, setKdakun] = useState<boolean>(false);
  const [kdsdana, setKdsdana] = useState<boolean>(false);

  const [akumulatif, setAkumulatif] = useState<boolean>(false);

  const [cutoff, setCutoff] = useState<string>("1");
  const [dept, setDept] = useState<string>("000");
  const [kdunit, setKdunit] = useState<string>("XX");
  const [dekon, setDekon] = useState<string>("XX");
  const [prov, setProv] = useState<string>("XX"); // Keeping explicit usage despite not seeing setter used often
  const [kabkota, setKabkota] = useState<string>("XX");
  const [kanwil, setKanwil] = useState<string>("XX");
  const [kppn, setKppn] = useState<string>("XX");
  const [satker, setSatker] = useState<string>("XX");
  const [fungsi, setFungsi] = useState<string>("XX");
  const [sfungsi, setSfungsi] = useState<string>("XX"); // Keeping explicit usage
  const [program, setProgram] = useState<string>("XX");
  const [giat, setGiat] = useState<string>("XX");
  const [output, setOutput] = useState<string>("XX");
  const [akun, setAkun] = useState<string>("XX");
  const [sdana, setSdana] = useState<string>("XX");
  const [pembulatan, setPembulatan] = useState<string>("1");

  // RADIO HANDLER
  const [deptradio, setDeptradio] = useState<string>("1");
  const [unitradio, setUnitradio] = useState<string>("1");
  const [dekonradio, setDekonradio] = useState<string>("1");
  const [provradio, setProvradio] = useState<string>("1");
  const [kabkotaradio, setKabkotaradio] = useState<string>("1");
  const [kanwilradio, setKanwilradio] = useState<string>("1");
  const [kppnradio, setKppnradio] = useState<string>("1");
  const [satkerradio, setSatkerradio] = useState<string>("1");
  const [fungsiradio, setFungsiradio] = useState<string>("1");
  const [subfungsiradio, setSubfungsiradio] = useState<string>("1");
  const [programradio, setProgramradio] = useState<string>("1");
  const [kegiatanradio, setKegiatanradio] = useState<string>("1");
  const [outputradio, setOutputradio] = useState<string>("1");
  const [akunradio, setAkunradio] = useState<string>("1");
  const [sdanaradio, setSdanaradio] = useState<string>("1");

  const [sql, setSql] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [select, setSelect] = useState<string>(
    ", CAST(sum(a.pagu) AS UNSIGNED INTEGER) as PAGU, CAST(sum(a.real1) AS UNSIGNED INTEGER) as REALISASI, CAST(sum(a.blokir) AS UNSIGNED INTEGER) as BLOKIR"
  );

  const handlegetQuery = () => {
    generateSql();
    if (jenlap === "1") {
      setShowModal(true);
    } else {
    }
  };

  const handlegetQuerySQL = () => {
    generateSql();
    setShowModalsql(true);
  };
  const handleSimpan = () => {
    generateSql();
    setShowModalsimpan(true);
  };

  // HANDLE MODAL TAYANG
  const closeModal = () => {
    setShowModal(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const closeModalsql = () => {
    setShowModalsql(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const closeModalsimpan = () => {
    setShowModalsimpan(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJenlap = (jenlapopt: {
    akumulatif: boolean;
    selectedValue: string;
  }) => {
    const { akumulatif, selectedValue } = jenlapopt;
    setAkumulatif(akumulatif);
    setJenlap(selectedValue);
  };

  const handleThang = (thang: number) => {
    setThang(thang);
  };
  // Unused based on imports, but kept for logic consistency if prop passed
  // const handleCutoff = (cutoff: string) => {
  //   setCutoff(cutoff);
  // };
  const handlePembulatan = (pembulatan: string) => {
    setPembulatan(pembulatan);
  };

  useEffect(() => {
    handleCutoffcek();
  }, [thang, cutoff, pembulatan, jenlap, akumulatif, select]);

  const handleCutoffcek = () => {
    let selectkontrak =
      " ,RUPIAH,NOSP2D,TGSP2D,NOSPM,TGSPM,URAIAN,JENSP2D,JENSPM,TGPOS";

    // Unused variable 'real' - kept commented or removed in logic if not used
    // let real =
    //   ", ROUND(SUM(realisasi)/" + pembulatan + ",0) AS REALISASI_KONTRAK";

    let from = "monev" + thang + ".pa_realisasi_" + thang + " a";

    // Simplified logic as all cases seemed to do the same thing in the original code
    // Check if cutoff is between "1" and "12"
    const validCutoffs = [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
    ];

    if (validCutoffs.includes(cutoff)) {
      if (jenlap === "1") {
        setFrom(from);
        setSelect(selectkontrak);
      }
    } else {
      setFrom("");
    }
  };

  // PILIH JENIS OPTION //
  // Note: These were used in Switch components
  // const getSwitchTanggal = (tanggal: boolean) => {
  //   setTanggal(tanggal);
  //   setCutoff("1");
  // };

  // HANDLE RADIO
  const handleRadioDept = (deptRadio: string) => {
    setDeptradio(deptRadio);
  };
  const handleRadioUnit = (unitRadio: string) => {
    setUnitradio(unitRadio);
  };
  const handleRadioDekon = (dekonRadio: string) => {
    setDekonradio(dekonRadio);
  };
  const handleRadioSatker = (satkerRadio: string) => {
    setSatkerradio(satkerRadio);
  };
  const handleRadioProgram = (programRadio: string) => {
    setProgramradio(programRadio);
  };
  const handleRadioKegiatan = (kegiatanRadio: string) => {
    setKegiatanradio(kegiatanRadio);
  };
  const handleRadioOutput = (outputRadio: string) => {
    setOutputradio(outputRadio);
  };
  const handleRadioAkun = (akunRadio: string) => {
    setAkunradio(akunRadio);
  };
  const handleRadioSdana = (sdanaRadio: string) => {
    setSdanaradio(sdanaRadio);
  };
  const handleRadioKanwil = (kanwilRadio: string) => {
    setKanwilradio(kanwilRadio);
  };
  const handleRadioKppn = (kppnRadio: string) => {
    setKppnradio(kppnRadio);
  };

  // KONDISI FUNCTIONS (some were commented out in original)
  // function deptKondisiPilih(event: React.ChangeEvent<HTMLInputElement>) {
  //   const isChecked = event.target.checked;
  //   const value = isChecked ? 5 : 0;
  //   setDeptkondisipilih(value);
  //   setDept("000");
  // }
  // function satkerKondisiPilih(event: React.ChangeEvent<HTMLInputElement>) {
  //   const isChecked = event.target.checked;
  //   const value = isChecked ? 5 : 0;
  //   setSatkerkondisipilih(value);
  //   setSatker("SEMUASATKER");
  // }

  const generateSql = () => {
    const queryParams: QueryParams = {
      thang,
      jenlap,
      role,
      kodekppn,
      kodekanwil,
      deptradio,
      dept,
      deptkondisipilih,
      deptkondisi,
      kdunit,
      unitkondisipilih,
      unitkondisi,
      unitradio,
      dekon,
      dekonradio,
      prov,
      provradio,
      kabkota,
      kabkotaradio,
      kanwil,
      kanwilradio,
      kppn,
      kppnradio,
      satker,
      satkerradio,
      satkerkondisi,
      fungsi,
      fungsiradio,
      subfungsiradio,
      program,
      programradio,
      giat,
      kegiatanradio,
      output,
      outputradio,
      akun,
      akunradio,
      sdana,
      sdanaradio,
      select,
      from,
      opsidept,
      opsikatadept,
      opsiunit,
      opsikataunit,
      opsidekon,
      dekonkondisi,
      kppnkondisipilih,
      kppnkondisi,
      opsikppn,
      opsikatakppn,
      kanwilkondisipilih,
      kanwilkondisi,
      opsikanwil,
      opsikatakanwil,
      programkondisipilih,
      programkondisi,
      opsiprogram,
      opsikataprogram,
      giatkondisipilih,
      giatkondisi,
      opsigiat,
      opsikatagiat,
      outputkondisipilih,
      outputkondisi,
      opsioutput,
      opsikataoutput,
      akunkondisipilih,
      akunkondisi,
      opsiakun,
      opsikataakun,
      opsisdana,
      opsikatasdana,
      sdanakondisi,
      pembulatan,
      opsikatasatker,
      opsisatker,
    };

    // Assuming getSQL returns a string and might modify params side-effect (though risky pattern)
    // or just return string. Calling twice in original code, following pattern.
    getSQL(queryParams);
    const query = getSQL(queryParams);
    setSql(query);
  };

  const handleStatus = (status: boolean, total: number) => {
    setLoadingStatus(status);
    setExport2(status);

    if (total === 0) {
      setLoadingStatus(false);
    }
  };

  // HANDLE KDDEPT
  const [deptkondisi, setDeptkondisi] = useState<string>("");
  const [deptkondisipilih, setDeptkondisipilih] = useState<number>(0);
  const [opsikatadept, setopsiKataDept] = useState<string>("");
  const [opsidept, setopsiDept] = useState<string>("pilihdept");

  const handleKddept = (dept: string) => {
    setDept(dept);
    setopsiDept("pilihdept");

    if (dept === "XXX") {
      setProgram("XX");
      setGiat("XX");
      setKdunit("XX");
      setOutput("XX");
    } else if (dept === "000") {
      setProgram("XX");
      setGiat("XX");
      setKdunit("00");
      setOutput("XX");
    }
  };

  const getSwitchKddept = (kddept: boolean) => {
    setKddept(kddept);
    setDeptradio("1");
    if (kddept) {
      setDept("000");
    } else {
      setDept("XXX");
      setopsiKataDept("");
      setDeptkondisi("");
    }
  };

  const handledeptKondisi = (deptInput: string) => {
    setDeptkondisi(deptInput);
  };
  const handledeptKondisiKata = (deptkata: string) => {
    setopsiKataDept(deptkata);
  };
  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setopsiDept(event.target.value);
    const isChecked = event.target.value;
    const value = isChecked === "pilihdept" ? 5 : 0;
    setDeptkondisipilih(value);
    value === 0 ? setDeptradio("2") : setDeptradio("1");
  };

  // HANDLE KDUNIT
  const [unitkondisi, setUnitkondisi] = useState<string>("");
  const [opsikataunit, setopsiKataUnit] = useState<string>("");
  const [unitkondisipilih, setUnitkondisipilih] = useState<number>(0);
  const [opsiunit, setopsiUnit] = useState<string>("pilihunit");

  const handleUnit = (kdunit: string) => {
    setKdunit(kdunit);
  };
  const getSwitchUnit = (unit: boolean) => {
    setUnit(unit);
    if (unit) {
      setKdunit("00");
    } else {
      setKdunit("XX");
      setUnitkondisi("");
      setopsiKataUnit("");
    }
  };
  const handleunitKondisi = (unitInput: string) => {
    setUnitkondisi(unitInput);
  };
  // Unused but defined in logic
  // const handleunitKondisiKata = (unitkata: string) => {
  //   setopsiKataUnit(unitkata);
  // };
  const handleRadioChangeUnit = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setopsiUnit(event.target.value);
    const isChecked = event.target.value;
    const value = isChecked === "pilihunit" ? 5 : 0;
    setUnitkondisipilih(value);
  };

  // HANDLE KEWENANGAN
  const [dekonkondisi, setDekonkondisi] = useState<string>("");
  const [dekonkondisipilih, setDekonkondisipilih] = useState<number>(0);
  const [opsidekon, setopsiDekon] = useState<string>("pilihdekon");

  const handleDekon = (dekon: string) => {
    setDekon(dekon);
  };
  const getSwitchDekon = (kddekon: boolean) => {
    setKddekon(kddekon);
    if (kddekon) {
      setDekon("00");
    } else {
      setDekon("XX");
      setDekonkondisi("");
    }
  };

  const handledekonKondisi = (dekonInput: string) => {
    setDekonkondisi(dekonInput);
  };

  const handleRadioChangeDekon = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setopsiDekon(event.target.value);
    const isChecked = event.target.value;
    const value = isChecked === "pilihdekon" ? 5 : 0;
    setDekonkondisipilih(value);
  };

  // HANDLE KDKANWIL
  const [kanwilkondisi, setkanwilkondisi] = useState<string>("");
  const [opsikatakanwil, setopsiKatakanwil] = useState<string>("");

  const handleKanwil = (kanwil: string) => {
    setKanwil(kanwil);
    if (kanwil === "XX") {
      setKabkota("XX");
    }
  };
  const getSwitchkanwil = (kdkanwil: boolean) => {
    setKdkanwil(kdkanwil);
    if (kdkanwil) {
      setKanwil("00");
    } else {
      setkanwilkondisi("");
      setopsiKatakanwil("");
      setKanwil("XX");
    }
  };

  const [kanwilkondisipilih, setkanwilkondisipilih] = useState<number>(0);
  const [opsikanwil, setopsikanwil] = useState<string>("pilihkanwil");

  const handlekanwilKondisi = (kanwilInput: string) => {
    setkanwilkondisi(kanwilInput);
  };
  const handlekanwilKondisiKata = (kanwilkata: string) => {
    setopsiKatakanwil(kanwilkata);
  };
  const handleRadioChangekanwil = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setopsikanwil(event.target.value);
    const isChecked = event.target.value;
    const value = isChecked === "pilihkanwil" ? 5 : 0;
    setkanwilkondisipilih(value);
    value === 0 ? setKanwilradio("2") : setKanwilradio("1");
  };

  // HANDLE KDKPPN
  const [kppnkondisi, setkppnkondisi] = useState<string>("");
  const [opsikatakppn, setopsiKatakppn] = useState<string>("");
  const handleKppn = (kppn: string) => {
    setKppn(kppn);
    if (kppn === "XX") {
      setKabkota("XX");
    }
  };
  const getSwitchkppn = (kdkppn: boolean) => {
    setKdkppn(kdkppn);
    if (kdkppn) {
      setKppn("00");
    } else {
      setkppnkondisi("");
      setopsiKatakppn("");
      setKppn("XX");
    }
  };

  const [kppnkondisipilih, setkppnkondisipilih] = useState<number>(0);
  const [opsikppn, setopsikppn] = useState<string>("pilihkppn");

  const handlekppnKondisi = (kppnInput: string) => {
    setkppnkondisi(kppnInput);
  };
  const handlekppnKondisiKata = (kppnkata: string) => {
    setopsiKatakppn(kppnkata);
  };
  const handleRadioChangekppn = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setopsikppn(event.target.value);
    const isChecked = event.target.value;
    const value = isChecked === "pilihkppn" ? 5 : 0;
    setkppnkondisipilih(value);
    value === 0 ? setKppnradio("2") : setKppnradio("1");
  };

  // HANDLE SATKER
  const [satkerkondisi, setsatkerkondisi] = useState<string>("");
  const [opsikatasatker, setopsiKatasatker] = useState<string>("");

  const handleSatker = (satker: string) => {
    setSatker(satker);
  };
  const getSwitchsatker = (kdsatker: boolean) => {
    setKdsatker(kdsatker);
    if (kdsatker) {
      setSatker("SEMUASATKER");
    } else {
      setsatkerkondisi("");
      setopsiKatasatker("");
      setSatker("XX");
    }
  };

  const [satkerkondisipilih, setsatkerkondisipilih] = useState<number>(0);
  const [opsisatker, setopsisatker] = useState<string>("pilihsatker");

  const handlesatkerKondisi = (satkerInput: string) => {
    setsatkerkondisi(satkerInput);
  };
  const handlesatkerKondisiKata = (satkerkata: string) => {
    setopsiKatasatker(satkerkata);
  };
  const handleRadioChangesatker = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setopsisatker(event.target.value);
    const isChecked = event.target.value;
    const value = isChecked === "pilihsatker" ? 5 : 0;
    setsatkerkondisipilih(value);
    value === 0 ? setSatkerradio("2") : setSatkerradio("1");
  };

  // HANDLE PROGRAM

  const [programkondisi, setprogramkondisi] = useState<string>("");
  const [opsikataprogram, setopsiKataprogram] = useState<string>("");

  const getSwitchprogram = (kdprogram: boolean) => {
    setKdprogram(kdprogram);
    if (kdprogram) {
      setProgram("00");
    } else {
      setprogramkondisi("");
      setopsiKataprogram("");
      setProgram("XX");
    }
  };

  const handleProgram = (program: string) => {
    setProgram(program);
  };

  const [programkondisipilih, setprogramkondisipilih] = useState<number>(0);
  const [opsiprogram, setopsiprogram] = useState<string>("pilihprogram");

  const handleprogramKondisi = (programInput: string) => {
    setprogramkondisi(programInput);
  };
  const handleprogramKondisiKata = (programkata: string) => {
    setopsiKataprogram(programkata);
  };
  const handleRadioChangeprogram = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setopsiprogram(event.target.value);
    const isChecked = event.target.value;
    const value = isChecked === "pilihprogram" ? 5 : 0;
    setprogramkondisipilih(value);
    value === 0 ? setProgramradio("2") : setProgramradio("1");
  };

  // HANDLE KDGIAT

  const [giatkondisi, setgiatkondisi] = useState<string>("");
  const [opsikatagiat, setopsiKatagiat] = useState<string>("");

  const getSwitchgiat = (kdgiat: boolean) => {
    setKdgiat(kdgiat);
    if (kdgiat) {
      setGiat("00");
    } else {
      setgiatkondisi("");
      setopsiKatagiat("");
      setGiat("XX");
    }
  };

  const handleGiat = (giat: string) => {
    setGiat(giat);
  };

  const [giatkondisipilih, setgiatkondisipilih] = useState<number>(0);
  const [opsigiat, setopsigiat] = useState<string>("pilihgiat");

  const handlekegiatanKondisi = (giatInput: string) => {
    setgiatkondisi(giatInput);
  };
  const handlekegiatanKondisiKata = (giatkata: string) => {
    setopsiKatagiat(giatkata);
  };
  const handleRadioChangekegiatan = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setopsigiat(event.target.value);
    const isChecked = event.target.value;
    const value = isChecked === "pilihgiat" ? 5 : 0;
    setgiatkondisipilih(value);
    value === 0 ? setKegiatanradio("2") : setKegiatanradio("1");
  };

  // HANDLE OUTPUT

  const [outputkondisi, setoutputkondisi] = useState<string>("");
  const [opsikataoutput, setopsiKataoutput] = useState<string>("");

  const handleOutput = (output: string) => {
    setOutput(output);
  };

  const getSwitchoutput = (kdoutput: boolean) => {
    setKdoutput(kdoutput);
    if (kdoutput) {
      setOutput("SEMUAOUTPUT");
    } else {
      setoutputkondisi("");
      setopsiKataoutput("");
      setOutput("XX");
    }
  };

  const [outputkondisipilih, setoutputkondisipilih] = useState<number>(0);
  const [opsioutput, setopsioutput] = useState<string>("pilihoutput");

  const handleoutputKondisi = (outputInput: string) => {
    setoutputkondisi(outputInput);
  };
  const handleoutputKondisiKata = (outputkata: string) => {
    setopsiKataoutput(outputkata);
  };
  const handleRadioChangekeoutputan = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setopsioutput(event.target.value);
    const isChecked = event.target.value;
    const value = isChecked === "pilihoutput" ? 5 : 0;
    setoutputkondisipilih(value);
    value === 0 ? setOutputradio("2") : setOutputradio("1");
  };

  // HANDLE AKUN

  const [akunkondisi, setakunkondisi] = useState<string>("");
  const [opsikataakun, setopsiKataakun] = useState<string>("");

  const getSwitchakun = (kdakun: boolean) => {
    setKdakun(kdakun);
    if (kdakun) {
      setAkun("AKUN");
    } else {
      setopsiakun("pilihakun");
      setakunkondisi("");
      setopsiKataakun("");
      setAkun("XX");
    }
  };
  const handleAkun = (akun: string) => {
    setAkun(akun);
  };
  const [akunkondisipilih, setakunkondisipilih] = useState<number>(0);
  const [opsiakun, setopsiakun] = useState<string>("pilihakun");

  const handleakunKondisi = (akunInput: string) => {
    setakunkondisi(akunInput);
  };
  const handleakunKondisiKata = (akunkata: string) => {
    setopsiKataakun(akunkata);
  };
  const handleRadioChangeakun = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setopsiakun(event.target.value);
    const isChecked = event.target.value;
    const value = isChecked === "pilihakun" ? 5 : 0;
    setakunkondisipilih(value);
    value === 0 ? setAkunradio("2") : setAkunradio("1");
  };

  // HANDLE SDANA

  const [sdanakondisi, setsdanakondisi] = useState<string>("");
  const [opsikatasdana, setopsiKatasdana] = useState<string>("");

  const handleSdana = (sdana: string) => {
    setSdana(sdana);
  };

  const getSwitchsdana = (kdsdana: boolean) => {
    setKdsdana(kdsdana);
    if (kdsdana) {
      setSdana("00");
    } else {
      setsdanakondisi("");
      setopsiKatasdana("");
      setSdana("XX");
    }
  };

  const [sdanakondisipilih, setsdanakondisipilih] = useState<number>(0);
  const [opsisdana, setopsisdana] = useState<string>("pilihsdana");

  const handlesdanaKondisi = (sdanaInput: string) => {
    setsdanakondisi(sdanaInput);
  };
  const handlesdanaKondisiKata = (sdanakata: string) => {
    setopsiKatasdana(sdanakata);
  };
  const handleRadioChangesdana = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setopsisdana(event.target.value);
    const isChecked = event.target.value;
    const value = isChecked === "pilihsdana" ? 5 : 0;
    setsdanakondisipilih(value);
    value === 0 ? setSdanaradio("2") : setSdanaradio("1");
  };

  return (
    <>
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Rowset SP2D</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="#">Data</a>
              </li>
              {/* <li className="breadcrumb-item">Components</li> */}
              <li className="breadcrumb-item active">SP2D</li>
            </ol>
          </nav>
        </div>

        <section className="section dashboard">
          <Row>
            <Col lg={12}>
              <Card
                style={{
                  backgroundColor: "#52525B",
                  color: "#ffffff",
                  borderRadius: "12px",
                  paddingTop: "16px",
                }}
              >
                <Card.Body>
                  <div className="bagian-query">
                    <Thang
                      value={thang}
                      jenlap={jenlap}
                      onChange={handleThang}
                    />
                    <JenisLaporanRowset
                      value={jenlap}
                      akumulatifopt={akumulatif}
                      onChange={handleJenlap}
                    />

                    <Pembulatan
                      value={pembulatan}
                      onChange={handlePembulatan}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col lg={12}>
              <Card
                style={{
                  backgroundColor: "#52525B",
                  color: "#ffffff",
                  borderRadius: "12px",
                  paddingTop: "16px",
                }}
              >
                <Card.Body>
                  <div className="bagian-query">
                    <Row>
                      <Col xs={6} md={6} lg={6} xl={3}>
                        <pilihanData.SwitchKddept onChange={getSwitchKddept} />
                      </Col>
                      <Col xs={6} md={6} lg={6} xl={3}>
                        <pilihanData.SwitchKdUnit onChange={getSwitchUnit} />
                      </Col>
                      <Col xs={6} md={6} lg={6} xl={3}>
                        <pilihanData.SwitchKddekon onChange={getSwitchDekon} />
                      </Col>
                      <Col xs={6} md={6} lg={6} xl={3}>
                        <pilihanData.SwitchKppn onChange={getSwitchkppn} />
                      </Col>
                    </Row>
                    <Row>
                      <Col xs={6} md={6} lg={6} xl={3}>
                        <pilihanData.SwitchSatker onChange={getSwitchsatker} />
                      </Col>
                      <Col xs={6} md={6} lg={6} xl={3}>
                        <pilihanData.SwitchProgram
                          onChange={getSwitchprogram}
                        />
                      </Col>
                      <Col xs={6} md={6} lg={6} xl={3}>
                        <pilihanData.SwitchKegiatan onChange={getSwitchgiat} />
                      </Col>
                      <Col xs={6} md={6} lg={6} xl={3}>
                        <pilihanData.SwitchSdana
                          onChange={getSwitchsdana}
                          jenlap={jenlap}
                          setKdsdana={setKdsdana}
                          setSdana={setSdana}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col xs={6} md={6} lg={6} xl={3}>
                        <pilihanData.SwitchOutput onChange={getSwitchoutput} />
                      </Col>
                      <Col xs={6} md={6} lg={6} xl={3}>
                        <pilihanData.SwitchAkun
                          onChange={getSwitchakun}
                          jenlap={jenlap}
                          setKdakun={setKdakun}
                          setAkun={setAkun}
                        />
                      </Col>
                    </Row>

                    <div className="fade-in mt-3">
                      TA : {thang}, TIPE LAPORAN : {jenlap}, AKUMULATIF :
                      {akumulatif ? " TRUE " : " FALSE "}, PEMBULATAN :{" "}
                      {pembulatan}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={12}>
              <Card
                className="custom-card"
                style={{
                  backgroundColor: "#52525B",
                  color: "#ffffff",
                  borderRadius: "12px",
                  paddingTop: "16px",
                }}
              >
                <Card.Body>
                  {kddept && (
                    <>
                      <Row>
                        <Col xs={2} sm={2} md={2}>
                          <span>Kementerian</span>
                        </Col>
                        <Col xs={2} sm={2} md={2}>
                          <Form.Check
                            inline
                            type="radio"
                            label="Pilih K/L"
                            value="pilihdept"
                            checked={opsidept === "pilihdept"}
                            onChange={handleRadioChange}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <span>
                            <Kddept
                              value={dept}
                              onChange={handleKddept}
                              status={opsidept}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <DeptRadio
                            deptRadio={handleRadioDept}
                            selectedValue={deptradio}
                            status={opsidept}
                            babi="tampil"
                          />
                        </Col>
                      </Row>

                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Kondisi"
                              value="kondisidept"
                              checked={opsidept === "kondisidept"}
                              onChange={handleRadioChange}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputDept
                            deptkondisi={handledeptKondisi}
                            status={opsidept}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          *) banyak KL gunakan koma, exclude gunakan tanda !
                        </Col>
                      </Row>
                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Mengandung Kata"
                              value="katadept"
                              checked={opsidept === "katadept"}
                              onChange={handleRadioChange}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputKataDept
                            opsikatadept={handledeptKondisiKata}
                            status={opsidept}
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                  {unit && (
                    <>
                      <Row>
                        <Col xs={2} sm={2} md={2}>
                          <span>Eselon I</span>
                        </Col>
                        <Col xs={2} sm={2} md={2}>
                          <Form.Check
                            inline
                            type="radio"
                            label="Pilih Unit"
                            value="pilihunit"
                            checked={opsiunit === "pilihunit"}
                            onChange={handleRadioChangeUnit}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <span>
                            <Kdunit
                              value={dept}
                              kdunit={kdunit}
                              onChange={handleUnit}
                              status={opsiunit}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <UnitRadio
                            unitRadio={handleRadioUnit}
                            selectedValue={unitradio}
                            status={opsiunit}
                          />
                        </Col>
                      </Row>

                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Kondisi"
                              value="kondisiunit"
                              checked={opsiunit === "kondisiunit"}
                              onChange={handleRadioChangeUnit}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputUnit
                            unitkondisi={handleunitKondisi}
                            status={opsiunit}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          *) banyak Unit gunakan koma, exclude gunakan tanda !
                        </Col>
                      </Row>
                    </>
                  )}
                  {kddekon && (
                    <>
                      <Row>
                        <Col xs={2} sm={2} md={2}>
                          <span className="middle fade-in ">Kewenangan</span>
                        </Col>

                        <Col xs={2} sm={2} md={2}>
                          <Form.Check
                            inline
                            type="radio"
                            label="Pilih Kewenangan"
                            value="pilihdekon"
                            checked={opsidekon === "pilihdekon"}
                            onChange={handleRadioChangeDekon}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <span>
                            <Kddekon
                              value={dekon}
                              onChange={handleDekon}
                              status={opsidekon}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <DekonRadio
                            dekonRadio={handleRadioDekon}
                            selectedValue={dekonradio}
                            status={opsidekon}
                          />
                        </Col>
                      </Row>

                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Kondisi"
                              value="kondisidekon"
                              checked={opsidekon === "kondisidekon"}
                              onChange={handleRadioChangeDekon}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputDekon
                            dekonkondisi={handledekonKondisi}
                            status={opsidekon}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          *) banyak Kewenangan gunakan koma, exclude gunakan
                          tanda !
                        </Col>
                      </Row>
                    </>
                  )}
                  {kdkanwil && (
                    <>
                      <Row>
                        <Col xs={2} sm={2} md={2}>
                          <span>Kanwil</span>
                        </Col>
                        <Col xs={2} sm={2} md={2}>
                          <Form.Check
                            inline
                            type="radio"
                            label="Pilih Kanwil"
                            value="pilihkanwil"
                            checked={opsikanwil === "pilihkanwil"}
                            onChange={handleRadioChangekanwil}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <span>
                            <Kdkanwil
                              value={kanwil}
                              onChange={handleKanwil}
                              status={opsikanwil}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <KanwilRadio
                            kanwilRadio={handleRadioKanwil}
                            selectedValue={kanwilradio}
                            status={opsikanwil}
                          />
                        </Col>
                      </Row>

                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Kondisi"
                              value="kondisikanwil"
                              checked={opsikanwil === "kondisikanwil"}
                              onChange={handleRadioChangekanwil}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputKanwil
                            kanwilkondisi={handlekanwilKondisi}
                            status={opsikanwil}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          *) banyak kanwil gunakan koma, exclude gunakan tanda !
                        </Col>
                      </Row>
                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Mengandung Kata"
                              value="katakanwil"
                              checked={opsikanwil === "katakanwil"}
                              onChange={handleRadioChangekanwil}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputKataKanwil
                            opsikatakanwil={handlekanwilKondisiKata}
                            status={opsikanwil}
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                  {kdkppn && (
                    <>
                      <Row>
                        <Col xs={2} sm={2} md={2}>
                          <span>KPPN</span>
                        </Col>
                        <Col xs={2} sm={2} md={2}>
                          <Form.Check
                            inline
                            type="radio"
                            label="Pilih KPPN"
                            value="pilihkppn"
                            checked={opsikppn === "pilihkppn"}
                            onChange={handleRadioChangekppn}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <span>
                            <Kdkppn
                              value={kppn}
                              onChange={handleKppn}
                              status={opsikppn}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <KppnRadio
                            kppnRadio={handleRadioKppn}
                            selectedValue={kppnradio}
                            status={opsikppn}
                          />
                        </Col>
                      </Row>

                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Kondisi"
                              value="kondisikppn"
                              checked={opsikppn === "kondisikppn"}
                              onChange={handleRadioChangekppn}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputKppn
                            kppnkondisi={handlekppnKondisi}
                            status={opsikppn}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          *) banyak KPPN gunakan koma, exclude gunakan tanda !
                        </Col>
                      </Row>
                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Mengandung Kata"
                              value="katakppn"
                              checked={opsikppn === "katakppn"}
                              onChange={handleRadioChangekppn}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputKataKppn
                            opsikatakppn={handlekppnKondisiKata}
                            status={opsikppn}
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                  {kdsatker && (
                    <>
                      <Row>
                        <Col xs={2} sm={2} md={2}>
                          <span className="middle fade-in ">Satker</span>
                        </Col>
                        <Col xs={2} sm={2} md={2}>
                          <Form.Check
                            inline
                            type="radio"
                            label="Pilih Satker"
                            value="pilihsatker"
                            checked={opsisatker === "pilihsatker"}
                            onChange={handleRadioChangesatker}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <span>
                            <Kdsatker
                              kddept={dept}
                              kdunit={kdunit}
                              onChange={handleSatker}
                              status={opsisatker}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <SatkerRadio
                            satkerRadio={handleRadioSatker}
                            selectedValue={satkerradio}
                            status={opsisatker}
                          />
                        </Col>
                      </Row>

                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Kondisi"
                              value="kondisisatker"
                              checked={opsisatker === "kondisisatker"}
                              onChange={handleRadioChangesatker}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputSatker
                            satkerkondisi={handlesatkerKondisi}
                            status={opsisatker}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          *) banyak Satker gunakan koma, exclude gunakan tanda !
                        </Col>
                      </Row>
                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Mengandung Kata"
                              value="katasatker"
                              checked={opsisatker === "katasatker"}
                              onChange={handleRadioChangesatker}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputKataSatker
                            opsikatasatker={handlesatkerKondisiKata}
                            status={opsisatker}
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                  {kdprogram && (
                    <>
                      <Row>
                        <Col xs={2} sm={2} md={2}>
                          <span>Program</span>
                        </Col>
                        <Col xs={2} sm={2} md={2}>
                          <Form.Check
                            inline
                            type="radio"
                            label="Pilih Program"
                            value="pilihprogram"
                            checked={opsiprogram === "pilihprogram"}
                            onChange={handleRadioChangeprogram}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <span>
                            <Kdprogram
                              kdprogram={program}
                              kddept={dept}
                              kdunit={kdunit}
                              onChange={handleProgram}
                              status={opsiprogram}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <ProgramRadio
                            programRadio={handleRadioProgram}
                            selectedValue={programradio}
                            status={opsiprogram}
                          />
                        </Col>
                      </Row>

                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Kondisi"
                              value="kondisiprogram"
                              checked={opsiprogram === "kondisiprogram"}
                              onChange={handleRadioChangeprogram}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputProgram
                            programkondisi={handleprogramKondisi}
                            status={opsiprogram}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          *) banyak Program gunakan koma, exclude gunakan tanda
                          !
                        </Col>
                      </Row>
                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Mengandung Kata"
                              value="kataprogram"
                              checked={opsiprogram === "kataprogram"}
                              onChange={handleRadioChangeprogram}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputKataProgram
                            opsikataprogram={handleprogramKondisiKata}
                            status={opsiprogram}
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                  {kdgiat && (
                    <>
                      <Row>
                        <Col xs={2} sm={2} md={2}>
                          <span>Kegiatan</span>
                        </Col>
                        <Col xs={2} sm={2} md={2}>
                          <Form.Check
                            inline
                            type="radio"
                            label="Pilih Kegiatan"
                            value="pilihgiat"
                            checked={opsigiat === "pilihgiat"}
                            onChange={handleRadioChangekegiatan}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <span>
                            <Kdgiat
                              kdgiat={giat}
                              kdprogram={program}
                              kddept={dept}
                              kdunit={kdunit}
                              onChange={handleGiat}
                              status={opsigiat}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <KegiatanRadio
                            kegiatanRadio={handleRadioKegiatan}
                            selectedValue={kegiatanradio}
                            status={opsigiat}
                          />
                        </Col>
                      </Row>

                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Kondisi"
                              value="kondisigiat"
                              checked={opsigiat === "kondisigiat"}
                              onChange={handleRadioChangekegiatan}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <Inputkegiatan
                            kegiatankondisi={handlekegiatanKondisi}
                            status={opsigiat}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          *) banyak kegiatan gunakan koma, exclude gunakan tanda
                          !
                        </Col>
                      </Row>
                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Mengandung Kata"
                              value="katagiat"
                              checked={opsigiat === "katagiat"}
                              onChange={handleRadioChangekegiatan}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputKatakegiatan
                            opsikatakegiatan={handlekegiatanKondisiKata}
                            status={opsigiat}
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                  {kdoutput && (
                    <>
                      <Row>
                        <Col xs={2} sm={2} md={2}>
                          <span className="middle fade-in ">Output</span>
                        </Col>
                        <Col xs={2} sm={2} md={2}>
                          <Form.Check
                            inline
                            type="radio"
                            label="Pilih Output"
                            value="pilihoutput"
                            checked={opsioutput === "pilihoutput"}
                            onChange={handleRadioChangekeoutputan}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <span>
                            <Kdoutput
                              kdoutput={output}
                              kdgiat={giat}
                              kdprogram={program}
                              kddept={dept}
                              kdunit={kdunit}
                              onChange={handleOutput}
                              status={opsioutput}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <OutputRadio
                            outputRadio={handleRadioOutput}
                            selectedValue={outputradio}
                            status={opsioutput}
                          />
                        </Col>
                      </Row>

                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Kondisi"
                              value="kondisioutput"
                              checked={opsioutput === "kondisioutput"}
                              onChange={handleRadioChangekeoutputan}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputOutput
                            outputkondisi={handleoutputKondisi}
                            status={opsioutput}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          *) banyak Output gunakan koma, exclude gunakan tanda !
                        </Col>
                      </Row>
                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Mengandung Kata"
                              value="kataoutput"
                              checked={opsioutput === "kataoutput"}
                              onChange={handleRadioChangekeoutputan}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputKataOutput
                            opsikataoutput={handleoutputKondisiKata}
                            status={opsioutput}
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                  {kdakun && (
                    <>
                      <Row>
                        <Col xs={2} sm={2} md={2}>
                          <span className="middle fade-in ">Detail Akun</span>
                        </Col>
                        <Col xs={2} sm={2} md={2}>
                          <Form.Check
                            inline
                            type="radio"
                            label="Pilih Akun"
                            value="pilihakun"
                            checked={opsiakun === "pilihakun"}
                            onChange={handleRadioChangeakun}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <span>
                            <Kdakun onChange={handleAkun} status={opsiakun} />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <AkunRadio
                            akunRadio={handleRadioAkun}
                            selectedValue={akunradio}
                            status={opsiakun}
                          />
                        </Col>
                      </Row>

                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Kondisi"
                              value="kondisiakun"
                              checked={opsiakun === "kondisiakun"}
                              onChange={handleRadioChangeakun}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputAkun
                            akunkondisi={handleakunKondisi}
                            status={opsiakun}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          *) banyak Akun gunakan koma, exclude gunakan tanda !
                        </Col>
                      </Row>
                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Mengandung Kata"
                              value="kataakun"
                              checked={opsiakun === "kataakun"}
                              onChange={handleRadioChangeakun}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputKataAkun
                            opsikataakun={handleakunKondisiKata}
                            status={opsiakun}
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                  {kdsdana && (
                    <>
                      <Row>
                        <Col xs={2} sm={2} md={2}>
                          <span className="middle fade-in ">Sumber Dana</span>
                        </Col>
                        <Col xs={2} sm={2} md={2}>
                          <Form.Check
                            inline
                            type="radio"
                            label="Pilih Sumber Dana"
                            value="pilihsdana"
                            checked={opsisdana === "pilihsdana"}
                            onChange={handleRadioChangesdana}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <span>
                            <Kdsdana
                              onChange={handleSdana}
                              status={opsisdana}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <SdanaRadio
                            sdanaRadio={handleRadioSdana}
                            selectedValue={sdanaradio}
                            status={opsisdana}
                          />
                        </Col>
                      </Row>

                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Kondisi"
                              value="kondisisdana"
                              checked={opsisdana === "kondisisdana"}
                              onChange={handleRadioChangesdana}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputSdana
                            sdanakondisi={handlesdanaKondisi}
                            status={opsisdana}
                          />
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          *) banyak Sumber Dana gunakan koma, exclude gunakan
                          tanda !
                        </Col>
                      </Row>
                      <Row>
                        <Col xs={2} sm={2} md={2}></Col>

                        <Col xs={2} sm={2} md={2}>
                          <span>
                            <Form.Check
                              inline
                              type="radio"
                              label="Mengandung Kata"
                              value="katasdana"
                              checked={opsisdana === "katasdana"}
                              onChange={handleRadioChangesdana}
                            />
                          </span>
                        </Col>
                        <Col xs={4} sm={4} md={4}>
                          <InputKataSdana
                            opsikatasdana={handlesdanaKondisiKata}
                            status={opsisdana}
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                  {tanggal && (
                    <>
                      <hr />
                      <div className="button-query">
                        <Row>
                          <Col lg={12}>
                            <Button
                              variant="success"
                              size="sm"
                              className="button fade-in me-2"
                              onClick={handlegetQuery}
                              disabled={loadingStatus}
                            >
                              {loadingStatus ? "Tayang" : "Tayang"}
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              className="button fade-in me-2"
                              onClick={() => {
                                setLoadingStatus(true);
                                generateSql();
                                setExport2(true);
                              }}
                              disabled={loadingStatus} // Menonaktifkan tombol saat loading
                            >
                              {loadingStatus && (
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  className="me-2"
                                  role="status"
                                  aria-hidden="true"
                                />
                              )}
                              {loadingStatus ? "Loading..." : "Download"}
                            </Button>
                            {role === "0" || role === "1" || role === "X" ? (
                              <Button
                                variant="danger"
                                size="sm"
                                className="button fade-in me-2"
                                onClick={handlegetQuerySQL}
                              >
                                SQL
                              </Button>
                            ) : null}
                            <Button
                              variant="warning"
                              size="sm"
                              className="button fade-in me-2"
                              onClick={handleSimpan}
                            >
                              Simpan
                            </Button>
                          </Col>
                        </Row>
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>
      </main>

      {jenlap === "1" && showModal ? (
        <HasilQuerySp2d
          query={sql}
          showModal={showModal}
          thang={thang}
          cutoff={cutoff}
          closeModal={closeModal}
        />
      ) : null}
      {export2 && (
        <GenerateCSV
          query3={sql}
          status={handleStatus}
          namafile={`v3_CSV_SP2D_${moment().format("DDMMYY-HHmmss")}`}
        />
      )}
      {showModalsql && (
        <Sql
          query2={sql}
          showModalsql={showModalsql}
          closeModalsql={closeModalsql}
        />
      )}
      {showModalsimpan && (
        <Simpan
          query2={sql}
          thang={thang}
          jenis="Kontrak"
          showModalsimpan={showModalsimpan}
          closeModalsimpan={closeModalsimpan}
        />
      )}
    </>
  );
};

export default InquirySP2D;
