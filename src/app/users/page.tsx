"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiPath } from "@/lib/config/base-path";
import { cn } from "@/lib/utils/utils";
import { User } from "@/lib/stores/users-store";
import { useAuth } from "@/hooks/useAuth";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
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
import { Pencil, Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { ModernUsersTable } from "@/components/lazy";
import { TableLoadingFallback, UsersPageSkeleton } from "@/components/ui/loading-fallback";
import { Suspense } from "react";
import kdkanwilData from "@/data/kdkanwil.json";
import kdkppnData from "@/data/kdkppn.json";

// CSRF helpers: backend issues XSRF-TOKEN cookie; include it as x-csrf-token on mutating requests
let __cachedCsrfToken: string | null = null;
async function ensureCsrfToken(): Promise<string | null> {
  if (__cachedCsrfToken) return __cachedCsrfToken;
  try {
    const resp = await fetch(apiPath("/csrf-token"), { credentials: "include" });
    if (!resp.ok) return null;
    const data = await resp.json().catch(() => ({} as any));
    const token = typeof data?.token === "string" && data.token.length ? data.token : null;
    __cachedCsrfToken = token || __cachedCsrfToken;
    return token;
  } catch {
    return null;
  }
}

const fetchUsers = async () => {
  const res = await fetch(apiPath("/users"), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

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
  const { user: currentUser, canManageUsers, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    enabled: !!currentUser
  });
  const users: User[] = data?.success ? data?.data ?? [] : [];

  // Check if user has permission to access this page
  useEffect(() => {
    if (!isAuthLoading && !canManageUsers()) {
      router.push("/");
    }
  }, [isAuthLoading, canManageUsers, router]);

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
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().replace("_", " ").includes(q) ||
        (u.nmkanwil?.toLowerCase().includes(q) ?? false) ||
        (u.nmkppn?.toLowerCase().includes(q) ?? false);
      const roleOk = role === "all" || !role || u.role === (role as any);
      const statusOk =
        status === "all" || !status || u.status === (status as any);
      return hit && roleOk && statusOk;
    });
  }, [users, query, role, status]);

  // pagination state for DataTable
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  // create/edit dialog
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    return kdkppnData.filter((kppn) => kppn.kdkanwil === form.kdkanwil);
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
    setShowPassword(false);
    setShowConfirmPassword(false);
    setOpen(true);

    // Force clear password fields after a short delay to ensure DOM is updated
    setTimeout(() => {
      setForm((f) => ({
        ...f,
        password: "",
        confirmPassword: "",
      }));
    }, 100);
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
    const xsrf = await ensureCsrfToken();
    const url = form.id ? apiPath(`/users/${form.id}`) : apiPath("/users");
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...(xsrf ? { "x-csrf-token": xsrf } : {}) },
      credentials: "include",
      body: JSON.stringify(bodyPayload),
    });
    if (!res.ok) {
      // Try to surface backend error for easier debugging and localize password policy errors
      try {
        const err = await res.json();
        const enMsg = err?.message || "";

        // Extract detailed error messages from backend response
        const details: string[] = [];
        if (err?.context?.field?.details && Array.isArray(err.context.field.details)) {
          details.push(...err.context.field.details);
        }
        if (Array.isArray(err?.errors)) {
          details.push(...err.errors);
        }

        const translateLine = (s: string) => {
          const map: Record<string, string> = {
            "Password must be at least 12 characters long":
              "Password harus minimal 12 karakter",
            "Password must contain at least one uppercase letter":
              "Password harus mengandung setidaknya satu huruf besar",
            "Password must contain at least one number":
              "Password harus mengandung setidaknya satu angka",
            "Password must contain at least one special character":
              "Password harus mengandung setidaknya satu karakter khusus",
            "This password has been exposed in":
              "Password ini telah terungkap dalam",
            "data breaches and cannot be used":
              "pelanggaran data dan tidak dapat digunakan",
          };
          return map[s] || s;
        };

        // If we have detailed error messages, show them with translation
        if (details.length > 0) {
          const translatedDetails = details.map(detail => translateLine(detail));
          const title = enMsg ? translateLine(enMsg) : "Gagal menyimpan pengguna";

          toast.error(title, {
            description: (
              <div className="space-y-1">
                {translatedDetails.map((detail, index) => (
                  <div key={index} className="text-sm">
                    {detail}
                  </div>
                ))}
              </div>
            ),
            duration: 12000,
          });
        } else if (
          enMsg === "Password does not meet complexity requirements" ||
          enMsg === "Password does not meet security requirements" ||
          /Password/i.test(enMsg)
        ) {
          const title = "Password tidak memenuhi persyaratan keamanan";
          // Tampilkan poin tetap sesuai permintaan pengguna
          toast.error(title, {
            description: (
              <ol className="list-decimal pl-5">
                <li>Minimal 12 karakter.</li>
                <li>Mengandung huruf besar.</li>
                <li>Mengandung angka.</li>
                <li>Mengandung karakter khusus.</li>
              </ol>
            ),
            duration: 12000,
          });
        } else {
          toast.error(translateLine(enMsg) || "Gagal menyimpan pengguna");
        }
      } catch {
        toast.error("Gagal menyimpan pengguna");
      }
      return;
    }
    toast.success("Tersimpan");
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ["users"] });
  }

  async function remove(id: string): Promise<void> {
    const xsrf = await ensureCsrfToken();
    const res = await fetch(apiPath(`/users/${id}`), {
      method: "DELETE",
      credentials: "include",
      headers: { ...(xsrf ? { "x-csrf-token": xsrf } : {}) },
    });
    if (!res.ok) {
      toast.error("Gagal menghapus");
      return;
    }
    toast.success("Pengguna berhasil dihapus");
    queryClient.invalidateQueries({ queryKey: ["users"] });
  }

  async function bulkRemove(): Promise<void> {
    if (!selected.size) return;
    const xsrf = await ensureCsrfToken();
    const ids = Array.from(selected);
    const results = await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(apiPath(`/users/${id}`), {
          method: "DELETE",
          credentials: "include",
          headers: { ...(xsrf ? { "x-csrf-token": xsrf } : {}) },
        });
        return { id, ok: res.ok };
      })
    );
    const failed = results.filter((r) => !r.ok).length;
    if (failed) {
      toast.error(`${failed} pengguna gagal dihapus`);
    }
    const successCount = ids.length - failed;
    if (successCount > 0) {
      toast.success(`${successCount} pengguna berhasil dihapus`);
    }
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["users"] });
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
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
    if (paged.every((u: User) => selected.has(u.id))) {
      setSelected((s) => {
        const next = new Set(s);
        paged.forEach((u: User) => next.delete(u.id));
        return next;
      });
    } else {
      setSelected((s) => {
        const next = new Set(s);
        paged.forEach((u: User) => next.add(u.id));
        return next;
      });
    }
  }


  // Show loading or redirect if no permission
  if (isAuthLoading) {
    return <UsersPageSkeleton />;
  }

  if (!canManageUsers()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2 text-rose-500 bg-rose-50/50 dark:bg-rose-950/20 p-8 rounded-2xl border border-rose-100 dark:border-rose-900/50 shadow-sm animate-in zoom-in-95 duration-300">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold">Akses Ditolak</h2>
          <p className="text-sm text-balance max-w-xs mx-auto text-rose-600/80 dark:text-rose-400/80">
            Anda tidak memiliki izin untuk mengakses halaman manajemen akun.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Manajemen Akun</h1>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleBulkDeleteClick}
            disabled={!selected.size}
            className="flex-1 sm:flex-none"
          >
            Hapus Terpilih ({selected.size})
          </Button>
          <Button onClick={openCreate} className="flex-1 sm:flex-none">Tambah Pengguna</Button>
        </div>
      </div>

      {isLoading ? (
        <TableLoadingFallback />
      ) : (
        <Suspense fallback={<TableLoadingFallback />}>
          <ModernUsersTable
            users={filtered}
            selected={selected}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onEdit={openEdit}
            onDelete={handleDeleteClick}
            currentPage={page}
            pageSize={pageSize}
            searchQuery={query}
            onSearchChange={(q) => {
              setQuery(q);
              setPage(1);
            }}
            roleFilter={role}
            onRoleFilterChange={(r) => {
              setRole(r);
              setPage(1);
            }}
            statusFilter={status}
            onStatusFilterChange={(s) => {
              setStatus(s);
              setPage(1);
            }}
            totalCount={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              if (size !== pageSize) {
                setPageSize(size);
                setPage(1);
              }
            }}
          />

        </Suspense>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[700px] w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90svh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {form.id ? "Edit Pengguna" : "Tambah Pengguna"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid gap-4 py-4 px-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="nama-lengkap">Nama Lengkap</FieldLabel>
                  <Input
                    id="nama-lengkap"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </Field>
                {!form.id && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Minimal 12 karakter, huruf besar, angka, dan simbol"
                          value={form.password}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, password: e.target.value }))
                          }
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          aria-label={
                            showPassword ? "Sembunyikan password" : "Lihat password"
                          }
                        >
                          {showPassword ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="confirm-password">Konfirmasi Password</FieldLabel>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Konfirmasi password"
                          value={form.confirmPassword}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              confirmPassword: e.target.value,
                            }))
                          }
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                          aria-label={
                            showConfirmPassword
                              ? "Sembunyikan konfirmasi password"
                              : "Lihat konfirmasi password"
                          }
                        >
                          {showConfirmPassword ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showConfirmPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </Field>
                  </div>
                )}                <div className={cn(
                  "grid grid-cols-1 gap-4",
                  form.role === "kanwil_djpb" && "sm:grid-cols-2",
                  form.role === "kppn" && "sm:grid-cols-3"
                )}>
                  <Field>
                    <FieldLabel htmlFor="role">Role</FieldLabel>
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
                      <SelectTrigger id="role" className="h-11">
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin (X)</SelectItem>
                        <SelectItem value="co_admin">Co-Admin (0)</SelectItem>
                        <SelectItem value="kantor_pusat">Kantor Pusat (1)</SelectItem>
                        <SelectItem value="ditpa">DIT PA (1)</SelectItem>
                        <SelectItem value="kanwil_djpb">Kanwil DJPb (2)</SelectItem>
                        <SelectItem value="kppn">KPPN (3)</SelectItem>
                        <SelectItem value="lainnya">User Lainnya (4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* Conditional Kanwil DJPb Selection */}
                  {form.role === "kanwil_djpb" && (
                    <Field>
                      <FieldLabel htmlFor="pilih-kanwil-djpb">Pilih Kanwil DJPb</FieldLabel>
                      <Select
                        value={form.kdkanwil ?? ""}
                        onValueChange={(v) => {
                          const selectedKanwil = kdkanwilData.find(
                            (k) => k.kdkanwil === v
                          );
                          setForm((f) => ({
                            ...f,
                            kdkanwil: v,
                            nmkanwil: selectedKanwil?.nmkanwil || "",
                          }));
                        }}
                      >
                        <SelectTrigger id="pilih-kanwil-djpb" className="h-11">
                          <SelectValue placeholder="Pilih Provinsi" />
                        </SelectTrigger>
                        <SelectContent>
                          {kdkanwilData.map((kanwil) => (
                            <SelectItem key={kanwil.kdkanwil} value={kanwil.kdkanwil}>
                              {kanwil.nmkanwil}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}

                  {/* Conditional KPPN Selection */}
                  {form.role === "kppn" && (
                    <>
                      <Field>
                        <FieldLabel htmlFor="pilih-kanwil-kppn">Pilih Kanwil</FieldLabel>
                        <Select
                          value={form.kdkanwil ?? ""}
                          onValueChange={(v) => {
                            const selectedKanwil = kdkanwilData.find(
                              (k) => k.kdkanwil === v
                            );
                            setForm((f) => ({
                              ...f,
                              kdkanwil: v,
                              nmkanwil: selectedKanwil?.nmkanwil || "",
                              kdkppn: "",
                              nmkppn: "",
                            }));
                          }}
                        >
                          <SelectTrigger id="pilih-kanwil-kppn" className="h-11">
                            <SelectValue placeholder="Pilih Kanwil" />
                          </SelectTrigger>
                          <SelectContent>
                            {kdkanwilData.map((kanwil) => (
                              <SelectItem key={kanwil.kdkanwil} value={kanwil.kdkanwil}>
                                {kanwil.nmkanwil}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="pilih-kppn">Pilih KPPN</FieldLabel>
                        <Select
                          disabled={!form.kdkanwil}
                          value={form.kdkppn ?? ""}
                          onValueChange={(v) => {
                            const selectedKppn = filteredKppn.find(
                              (k) => k.kdkppn === v
                            );
                            setForm((f) => ({
                              ...f,
                              kdkppn: v,
                              nmkppn: selectedKppn?.nmkppn || "",
                            }));
                          }}
                        >
                          <SelectTrigger id="pilih-kppn" className="h-11">
                            <SelectValue placeholder="Pilih KPPN" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredKppn.map((kppn) => (
                              <SelectItem key={kppn.kdkppn} value={kppn.kdkppn}>
                                {kppn.nmkppn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </>
                  )}
                </div>
                <Field>
                  <FieldLabel htmlFor="limit-kode-ba">Limit Kode BA</FieldLabel>
                  <Input
                    id="limit-kode-ba"
                    placeholder="contoh: 015 atau 015,042"
                    value={form.limitKodeBA}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, limitKodeBA: e.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, status: v as any }))
                    }
                  >
                    <SelectTrigger id="status" className="h-11">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="disabled">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
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
        <DialogContent showCloseButton={false} className="w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vw] sm:max-h-[90vh]">
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
