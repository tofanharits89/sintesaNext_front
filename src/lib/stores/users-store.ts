import { v4 as uuidv4 } from "uuid";

export type User = {
  id: string;
  name: string; // Nama Lengkap
  username: string;
  email: string;
  role:
  | "super_admin"  // X = Super Admin
  | "co_admin"     // 0 = Co-Admin
  | "kantor_pusat" // 1 = Kantor Pusat
  | "ditpa"        // 1 = DIT PA
  | "kanwil_djpb"  // 2 = Kanwil DJPb
  | "kppn"         // 3 = KPPN
  | "lainnya";     // 4 = User Lainnya
  limitKodeBA?: string; // optional string to allow codes like "015" or multiple codes
  kdkanwil?: string; // Kode Kanwil (previously kanwilId)
  kdkppn?: string;   // Kode KPPN (previously kppnId)
  nmkanwil?: string; // Nama Kanwil (previously kanwilName)
  nmkppn?: string;   // Nama KPPN (previously kppnName)
  status: "active" | "disabled";
  createdAt: string;
};

export const ROLE_CODES = {
  super_admin: "X",
  co_admin: "0",
  kantor_pusat: "1",
  kanwil_djpb: "2",
  kppn: "3",
  lainnya: "4"
} as const;

// Mock user accounts for testing RBAC
let USERS: User[] = [
  // Super Admin account
  {
    id: uuidv4(),
    name: "Super Administrator",
    username: "superadmin",
    email: "superadmin@kemenkeu.go.id",
    role: "super_admin",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  // Co-Admin account
  {
    id: uuidv4(),
    name: "Budi Santoso",
    username: "coadmin",
    email: "coadmin@kemenkeu.go.id",
    role: "co_admin",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  // Kantor Pusat account
  {
    id: uuidv4(),
    name: "Siti Nurhaliza",
    username: "kantorpusat",
    email: "kantorpusat@kemenkeu.go.id",
    role: "kantor_pusat",
    limitKodeBA: "015",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  // Kanwil DJPb account
  {
    id: uuidv4(),
    name: "Ahmad Fauzi",
    username: "kanwil",
    email: "kanwil@kemenkeu.go.id",
    role: "kanwil_djpb",
    kdkanwil: "31",
    nmkanwil: "Kanwil DJPb Provinsi DKI Jakarta",
    limitKodeBA: "015,042",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  // KPPN account
  {
    id: uuidv4(),
    name: "Dewi Lestari",
    username: "kppn",
    email: "kppn@kemenkeu.go.id",
    role: "kppn",
    kdkanwil: "31",
    nmkanwil: "Kanwil DJPb Provinsi DKI Jakarta",
    kdkppn: "001",
    nmkppn: "KPPN Jakarta I",
    limitKodeBA: "015",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  // Regular user account
  {
    id: uuidv4(),
    name: "Andi Wijaya",
    username: "user",
    email: "user@kemenkeu.go.id",
    role: "lainnya",
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

export function listUsers() {
  return USERS;
}

export function getUser(id: string) {
  return USERS.find((u) => u.id === id);
}

export function createUser(input: Omit<User, "id" | "createdAt">) {
  const user: User = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  USERS.unshift(user);
  return user;
}

export function updateUser(id: string, patch: Partial<Omit<User, "id" | "createdAt">>) {
  const idx = USERS.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  USERS[idx] = { ...USERS[idx], ...patch } as User;
  return USERS[idx];
}

export function deleteUser(id: string) {
  const before = USERS.length;
  USERS = USERS.filter((u) => u.id !== id);
  return USERS.length < before;
}

export function deleteUsers(ids: string[]) {
  const set = new Set(ids);
  const before = USERS.length;
  USERS = USERS.filter((u) => !set.has(u.id));
  return before - USERS.length;
}

