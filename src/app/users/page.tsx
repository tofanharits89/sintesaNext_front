"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPath } from "@/lib/base-path";
import useSWR from "swr";
import { User } from "@/lib/users-store";
import { useCurrentUser } from "@/lib/use-current-user";
import { canAccessUserManagement } from "@/lib/rbac";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import locationData from "@/data/indonesia-locations.json";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json());

type FormState = {
  id?: string;
  name: string; // Nama Lengkap
  username: string;
  email: string;
  role: User["role"];
  status: User["status"];
  password?: string;
  confirmPassword?: string;
  limitKodeBA?: string;
  kdkanwil?: string; // Changed from kanwilId
  kdkppn?: string; // Changed from kppnId
  nmkanwil?: string; // Changed from kanwilName
  nmkppn?: string; // Changed from kppnName
};

export default function UsersPage() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { data, mutate, isLoading } = useSWR(apiPath("/users"), fetcher);
  const users: User[] = data?.success ? data?.data ?? [] : [];

  // Check if user has permission to access this page
  useEffect(() => {
    if (currentUser && !canAccessUserManagement(currentUser)) {
      router.push("/");
    }
  }, [currentUser, router]);

  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = query.toLowerCase();
      const hit =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);
      const roleOk = role === "all" || !role || u.role === (role as any);
      const statusOk =
        status === "all" || !status || u.status === (status as any);
      return hit && roleOk && statusOk;
    });
  }, [users, query, role, status]);

  // simple pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // create/edit dialog
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    username: "",
    email: "",
    role: "lainnya",
    status: "active",
    password: "",
    confirmPassword: "",
    limitKodeBA: "",
    kdkanwil: "",
    kdkppn: "",
  });

  // Delete confirmation dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    userId?: string;
    userName?: string;
    isBulk?: boolean;
  }>({ open: false });

  // Filter KPPN berdasarkan Kanwil yang dipilih
  const filteredKppn = useMemo(() => {
    if (!form.kdkanwil) return [];
    return locationData.kppn.filter((kppn) => kppn.kanwilId === form.kdkanwil);
  }, [form.kdkanwil]);

  function openCreate() {
    setForm({
      name: "",
      username: "",
      email: "",
      role: "lainnya",
      status: "active",
      password: "",
      confirmPassword: "",
      limitKodeBA: "",
      kdkanwil: "",
      kdkppn: "",
      nmkanwil: "",
      nmkppn: "",
    });
    setOpen(true);
  }
  function openEdit(u: User) {
    setForm({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role,
      status: u.status,
      limitKodeBA: u.limitKodeBA ?? "",
      kdkanwil: u.kdkanwil ?? "",
      kdkppn: u.kdkppn ?? "",
      nmkanwil: u.nmkanwil ?? "",
      nmkppn: u.nmkppn ?? "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name || !form.username || !form.email) {
      toast.error("Nama lengkap, username, dan email wajib diisi");
      return;
    }
    if (!form.id) {
      if (!form.password || !form.confirmPassword) {
        toast.error("Password dan konfirmasi password wajib diisi");
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error("Konfirmasi password tidak sesuai");
        return;
      }
    }
    const { password, confirmPassword, ...payload } = form;
    const method = form.id ? "PUT" : "POST";
    const bodyPayload = method === "POST" ? { ...payload, password } : payload;
    const res = await fetch(apiPath("/users"), {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(bodyPayload),
    });
    if (!res.ok) {
      // Try to surface backend error for easier debugging
      try {
        const err = await res.json();
        toast.error(err?.message || "Gagal menyimpan pengguna");
      } catch {
        toast.error("Gagal menyimpan pengguna");
      }
      return;
    }
    toast.success("Tersimpan");
    setOpen(false);
    mutate();
  }

  async function remove(id: string) {
    const res = await fetch(`${apiPath("/users")}?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) return toast.error("Gagal menghapus");
    toast.success("Pengguna berhasil dihapus");
    mutate();
  }

  async function bulkRemove() {
    if (!selected.size) return;
    const qs = Array.from(selected)
      .map((id) => `ids=${id}`)
      .join("&");
    const res = await fetch(`${apiPath("/users")}?${qs}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) return toast.error("Gagal menghapus massal");
    toast.success(`${selected.size} pengguna berhasil dihapus`);
    setSelected(new Set());
    mutate();
  }

  function handleDeleteClick(userId: string, userName: string) {
    setDeleteConfirm({ open: true, userId, userName, isBulk: false });
  }

  function handleBulkDeleteClick() {
    if (selected.size > 0) {
      setDeleteConfirm({ open: true, isBulk: true });
    }
  }

  async function handleConfirmDelete() {
    if (deleteConfirm.isBulk) {
      await bulkRemove();
    } else if (deleteConfirm.userId) {
      await remove(deleteConfirm.userId);
    }
    setDeleteConfirm({ open: false });
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (paged.every((u) => selected.has(u.id))) {
      setSelected((s) => {
        const next = new Set(s);
        paged.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelected((s) => {
        const next = new Set(s);
        paged.forEach((u) => next.add(u.id));
        return next;
      });
    }
  }

  // Show loading or redirect if no permission
  if (!currentUser || !canAccessUserManagement(currentUser)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Akses Ditolak
          </h2>
          <p className="text-sm text-muted-foreground">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Akun Manajemen</h1>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleBulkDeleteClick}
            disabled={!selected.size}
          >
            Hapus Terpilih ({selected.size})
          </Button>
          <Button onClick={openCreate}>Tambah Pengguna</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          className="h-11 max-w-xl bg-white dark:bg-neutral-900"
          placeholder="Cari nama, email, atau peran"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-2">
          <Select value={role} onValueChange={(v) => setRole(v)}>
            <SelectTrigger className="h-11 min-w-40 bg-white dark:bg-neutral-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="co_admin">Co-Admin</SelectItem>
              <SelectItem value="kantor_pusat">Kantor Pusat</SelectItem>
              <SelectItem value="kanwil_djpb">Kanwil DJPb</SelectItem>
              <SelectItem value="kppn">KPPN</SelectItem>
              <SelectItem value="lainnya">User Lainnya</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v)}>
            <SelectTrigger className="h-11 min-w-40 bg-white dark:bg-neutral-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="disabled">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border bg-white dark:bg-neutral-900">
        <Table className="[&_th]:text-center [&_td]:text-center [&_th]:px-3 [&_td]:px-3 md:[&_th]:px-4 md:[&_td]:px-4">
          <TableHeader className="bg-slate-600 dark:bg-slate-800 [&_th]:text-white [&_th]:h-12">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  onCheckedChange={() => toggleSelectAll()}
                  checked={
                    paged.length > 0 && paged.every((u) => selected.has(u.id))
                  }
                />
              </TableHead>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Kanwil</TableHead>
              <TableHead>KPPN</TableHead>
              <TableHead>Limit BA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:nth-child(even)]:bg-slate-50 dark:[&_tr:nth-child(even)]:bg-neutral-800/50">
            {paged.map((u, idx) => {
              // Get kanwil and kppn names for display
              const kanwil = u.kdkanwil
                ? locationData.kanwilDJPb.find((k) => k.id === u.kdkanwil)
                : null;
              const kppn = u.kdkppn
                ? locationData.kppn.find((k) => k.id === u.kdkppn)
                : null;

              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(u.id)}
                      onCheckedChange={() => toggleSelect(u.id)}
                    />
                  </TableCell>
                  <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="capitalize">
                    {u.role.replaceAll("_", " ")}
                  </TableCell>
                  <TableCell>{kanwil?.name ?? "-"}</TableCell>
                  <TableCell>{kppn?.name ?? "-"}</TableCell>
                  <TableCell>{u.limitKodeBA ?? "-"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        u.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                      }
                    >
                      {u.status === "active" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(u.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="space-x-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(u)}
                      aria-label="Edit pengguna"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteClick(u.id, u.name)}
                      aria-label="Hapus pengguna"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {filtered.length} data • Halaman {page} dari {pageCount}
        </div>
        <div className="space-x-2">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Sebelumnya
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
          >
            Berikutnya
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Pengguna" : "Tambah Pengguna"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            {!form.id && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Konfirmasi Password</Label>
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        confirmPassword: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    role: v as any,
                    kdkanwil: "",
                    kdkppn: "",
                  }))
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin (X)</SelectItem>
                  <SelectItem value="co_admin">Co-Admin (0)</SelectItem>
                  <SelectItem value="kantor_pusat">Kantor Pusat (1)</SelectItem>
                  <SelectItem value="kanwil_djpb">Kanwil DJPb (2)</SelectItem>
                  <SelectItem value="kppn">KPPN (3)</SelectItem>
                  <SelectItem value="lainnya">User Lainnya (4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Kanwil DJPb Selection */}
            {form.role === "kanwil_djpb" && (
              <div className="grid gap-2">
                <Label>Pilih Kanwil DJPb</Label>
                <Select
                  value={form.kdkanwil}
                  onValueChange={(v) => {
                    const selectedKanwil = locationData.kanwilDJPb.find(
                      (k) => k.id === v
                    );
                    setForm((f) => ({
                      ...f,
                      kdkanwil: v,
                      nmkanwil: selectedKanwil?.name || "",
                    }));
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Pilih Provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationData.kanwilDJPb.map((kanwil) => (
                      <SelectItem key={kanwil.id} value={kanwil.id}>
                        {kanwil.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Conditional KPPN Selection */}
            {form.role === "kppn" && (
              <>
                <div className="grid gap-2">
                  <Label>Pilih Kanwil</Label>
                  <Select
                    value={form.kdkanwil}
                    onValueChange={(v) => {
                      const selectedKanwil = locationData.kanwilDJPb.find(
                        (k) => k.id === v
                      );
                      setForm((f) => ({
                        ...f,
                        kdkanwil: v,
                        nmkanwil: selectedKanwil?.name || "",
                        kdkppn: "",
                        nmkppn: "",
                      }));
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Pilih Kanwil" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationData.kanwilDJPb.map((kanwil) => (
                        <SelectItem key={kanwil.id} value={kanwil.id}>
                          {kanwil.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.kdkanwil && (
                  <div className="grid gap-2">
                    <Label>Pilih KPPN</Label>
                    <Select
                      value={form.kdkppn}
                      onValueChange={(v) => {
                        const selectedKppn = filteredKppn.find(
                          (k) => k.id === v
                        );
                        setForm((f) => ({
                          ...f,
                          kdkppn: v,
                          nmkppn: selectedKppn?.name || "",
                        }));
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih KPPN" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredKppn.map((kppn) => (
                          <SelectItem key={kppn.id} value={kppn.id}>
                            {kppn.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            <div className="grid gap-2">
              <Label>Limit Kode BA</Label>
              <Input
                placeholder="contoh: 015 atau 015,042"
                value={form.limitKodeBA}
                onChange={(e) =>
                  setForm((f) => ({ ...f, limitKodeBA: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as any }))
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="disabled">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={save}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Konfirmasi Hapus
            </DialogTitle>
            <DialogDescription>
              {deleteConfirm.isBulk
                ? `Apakah Anda yakin ingin menghapus ${selected.size} pengguna yang dipilih? Tindakan ini tidak dapat dibatalkan.`
                : `Apakah Anda yakin ingin menghapus pengguna "${deleteConfirm.userName}"? Tindakan ini tidak dapat dibatalkan.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirm({ open: false })}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {deleteConfirm.isBulk
                ? `Hapus ${selected.size} Pengguna`
                : "Hapus Pengguna"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
