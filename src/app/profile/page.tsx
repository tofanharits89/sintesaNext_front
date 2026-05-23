"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient, prefetchCsrf } from "@/lib/api/httpClient";
import type { User } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { toast } from "sonner";
import { Save, Lock, Eye, EyeOff, Info } from "lucide-react";
import kdkanwilData from "@/data/kdkanwil.json";
import kdkppnData from "@/data/kdkppn.json";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export default function ProfilePage() {
  const {
    user: current,
    refetch,
    isLoading,
    canEditRoleAndLocation,
  } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<User["role"]>("lainnya");
  const [limitKodeBA, setLimitKodeBA] = useState("");
  const [kdkanwil, setKdkanwil] = useState("");
  const [kdkppn, setKdkppn] = useState("");
  const [nmkanwil, setNmkanwil] = useState("");
  const [nmkppn, setNmkppn] = useState("");

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile picture preview (local-only). In production, upload to storage and save URL.
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter KPPN berdasarkan Kanwil yang dipilih
  const filteredKppn = useMemo(() => {
    if (!kdkanwil) return [];
    return kdkppnData.filter((kppn) => kppn.kdkanwil === kdkanwil);
  }, [kdkanwil]);

  useEffect(() => {
    if (!current) return;
    setName(current.name ?? "");
    setUsername(current.username ?? "");
    setEmail(current.email ?? "");
    setRole(current.role ?? "lainnya");
    setLimitKodeBA(current.limitKodeBA ?? "");
    // Load Kanwil and KPPN data if available
    setKdkanwil(current.kdkanwil ?? "");
    setKdkppn(current.kdkppn ?? "");
    setNmkanwil(current.nmkanwil ?? "");
    setNmkppn(current.nmkppn ?? "");
    setAvatarUrl(current.avatar ?? undefined);
  }, [current]);

  function onPickFile() {
    fileInputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Harap pilih file gambar");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", f);

    const uploadToastId = toast.loading("Mengunggah foto profil...");

    try {
      await prefetchCsrf();
      const trace = `prof_av_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const response = await apiClient.post<any>(
        "/users/profile/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-Debug-Source": "profile.page.uploadAvatar",
            "X-Debug-Trace": trace,
          },
        },
      );

      if (response && response.success !== false) {
        toast.success("Foto profil berhasil diunggah", { id: uploadToastId });
        setAvatarUrl(response.data?.avatar || response.avatar);
        refetch();
      } else {
        toast.error(response?.message || "Gagal mengunggah foto profil", {
          id: uploadToastId,
        });
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Terjadi kesalahan saat mengunggah foto";
      toast.error(errMsg, { id: uploadToastId });
    }
  }

  async function onDeleteAvatar() {
    const deleteToastId = toast.loading("Menghapus foto profil...");
    try {
      await prefetchCsrf();
      const trace = `prof_av_del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const response = await apiClient.delete<any>("/users/profile/avatar", {
        headers: {
          "X-Debug-Source": "profile.page.deleteAvatar",
          "X-Debug-Trace": trace,
        },
      });

      if (response && response.success !== false) {
        toast.success("Foto profil berhasil dihapus", { id: deleteToastId });
        setAvatarUrl(undefined);
        refetch();
      } else {
        toast.error(response?.message || "Gagal menghapus foto profil", {
          id: deleteToastId,
        });
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Terjadi kesalahan saat menghapus foto";
      toast.error(errMsg, { id: deleteToastId });
    }
  }

  function onReset() {
    if (current) {
      setName(current.name ?? "");
      setUsername(current.username ?? "");
      setEmail(current.email ?? "");
      setRole(current.role ?? "lainnya");
      setLimitKodeBA(current.limitKodeBA ?? "");
      setKdkanwil(current.kdkanwil ?? "");
      setKdkppn(current.kdkppn ?? "");
      setNmkanwil(current.nmkanwil ?? "");
      setNmkppn(current.nmkppn ?? "");
    }
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setAvatarUrl(current?.avatar ?? undefined);
    toast.info("Perubahan dibatalkan");
    refetch();
  }

  async function onSave() {
    if (!current) {
      toast.error("Profil tidak ditemukan");
      return;
    }
    if (!name || !username || !email) {
      toast.error("Nama lengkap, username, dan email wajib diisi");
      return;
    }
    const payload: {
      name: string;
      username: string;
      email: string;
      role?: User["role"];
      limitKodeBA?: string;
      kdkanwil?: string;
      kdkppn?: string;
      nmkanwil?: string;
      nmkppn?: string;
    } = {
      // id tidak diperlukan untuk endpoint profile/me
      name,
      username,
      email,
    };

    // Hanya admin yang bisa mengubah role & lokasi
    if (canEditRoleAndLocation()) {
      payload.role = role;
      // Only include fields when they have non-empty values
      Object.assign(payload, {
        ...(limitKodeBA ? { limitKodeBA } : {}),
        ...(kdkanwil ? { kdkanwil } : {}),
        ...(kdkppn ? { kdkppn } : {}),
        ...(nmkanwil ? { nmkanwil } : {}),
        ...(nmkppn ? { nmkppn } : {}),
      });
    }

    try {
      // Ensure CSRF token is present (interceptor also fetches if missing)
      await prefetchCsrf();
      const trace = `prof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      console.log(`[Profile Page] onSave trace=${trace}`);
      const data = await apiClient.put<any>("/users/profile/me", payload, {
        headers: {
          "X-Debug-Source": "profile.page.save",
          "X-Debug-Trace": trace,
        },
      });
      if (!data || data?.success === false) {
        const message =
          data?.message || (data as any)?.error || "Gagal menyimpan profil";
        toast.error(message);
        return;
      }
      toast.success("Profil tersimpan");
      refetch();
    } catch (e: Error | unknown) {
      toast.error(
        e instanceof Error ? e.message : "Terjadi kesalahan jaringan",
      );
    }
  }

  async function onChangePassword() {
    if (!current) {
      toast.error("Profil tidak ditemukan");
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error("Mohon isi password baru dan konfirmasi password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    if (newPassword.length < 12) {
      toast.error("Password minimal 12 karakter sesuai kebijakan keamanan");
      return;
    }

    try {
      setChangingPassword(true);
      await prefetchCsrf();
      const trace = `prof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      console.log(`[Profile Page] changePassword trace=${trace}`);
      const data = await apiClient.put<any>(
        "/users/profile/me",
        {
          password: newPassword,
        },
        {
          headers: {
            "X-Debug-Source": "profile.page.changePassword",
            "X-Debug-Trace": trace,
          },
        },
      );
      if (!data || data?.success === false) {
        const message =
          data?.message || (data as any)?.error || "Gagal mengubah password";
        const errors = Array.isArray((data as any)?.errors)
          ? (data as any).errors
          : [];

        if (
          message === "Password does not meet complexity requirements" ||
          (errors.length > 0 && /Password/i.test(message || ""))
        ) {
          const title = "Password tidak memenuhi persyaratan kompleksitas";
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
          toast.error([message, ...errors].filter(Boolean).join("\n"));
        }
        return;
      }

      toast.success("Password berhasil diubah");
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      // Optionally refresh user data
      refetch();
    } catch (e: Error | unknown) {
      const respData = (e as any)?.response?.data;
      const enMsg: string | undefined = respData?.message;
      const errors: string[] = Array.isArray(respData?.errors)
        ? respData.errors
        : [];

      // Mirror the error style used in users create modal for password policy
      if (
        enMsg === "Password does not meet complexity requirements" ||
        (errors.length > 0 && /Password/i.test(enMsg || ""))
      ) {
        const title = "Password tidak memenuhi persyaratan kompleksitas";
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
        toast.error(
          e instanceof Error ? e.message : "Terjadi kesalahan jaringan",
        );
      }
    } finally {
      setChangingPassword(false);
    }
  }

  const initials = useMemo(() => {
    const parts = (name || "").trim().split(/\s+/);
    return (
      parts
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("") || "US"
    );
  }, [name]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Profil Akun</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={onReset}
            className="flex-1 sm:flex-none"
          >
            Reset
          </Button>
          <Button onClick={onSave} className="flex-1 sm:flex-none">
            <Save className="mr-2 h-4 w-4" />
            Simpan
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Avatar card */}
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow relative flex flex-col justify-center h-full min-h-[240px]">
          {/* Info Tooltip on the top right */}
          <div className="absolute top-3 right-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-muted-foreground hover:text-foreground cursor-help p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Info className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="end" className="max-w-[280px]">
                <div className="space-y-1">
                  <div>Format gambar : PNG, JPG, JPEG, WEBP, GIF.</div>
                  <div>Ukuran gambar maksimal 3MB.</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Avatar className="size-42">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={name || "Avatar"} />
              ) : (
                <AvatarFallback className="text-lg font-medium">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onPickFile}>
                {avatarUrl ? "Ganti Foto" : "Unggah Foto"}
              </Button>
              {avatarUrl && (
                <ConfirmationModal
                  trigger={
                    <Button
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      Hapus
                    </Button>
                  }
                  title="Hapus Foto Profil"
                  description="Apakah Anda yakin ingin menghapus foto profil Anda? Tindakan ini tidak dapat dibatalkan."
                  confirmText="Hapus"
                  cancelText="Batal"
                  variant="destructive"
                  onConfirm={onDeleteAvatar}
                />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onFileChange}
            />
          </div>
        </div>

        {/* Profile form */}
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <FieldGroup>
            {/* Row 1: Nama Lengkap & Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>
            </div>

            {/* Row 2: Email & Limit Kode BA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="limitKodeBA">Limit Kode BA</FieldLabel>
                <Input
                  id="limitKodeBA"
                  placeholder="contoh: 015 atau 015,042"
                  value={limitKodeBA}
                  onChange={(e) =>
                    canEditRoleAndLocation() && setLimitKodeBA(e.target.value)
                  }
                  disabled={!canEditRoleAndLocation()}
                />
                {!canEditRoleAndLocation() && (
                  <FieldDescription>
                    Limit Kode BA hanya dapat diubah oleh Administrator
                  </FieldDescription>
                )}
              </Field>
            </div>

            {/* Row 3: Role & Conditional Locations (Kanwil / KPPN) */}
            {role === "kanwil_djpb" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field>
                  <FieldLabel htmlFor="role">Role</FieldLabel>
                  <Select
                    value={role}
                    onValueChange={(v) => {
                      if (canEditRoleAndLocation()) {
                        setRole(v as User["role"]);
                        // Reset Kanwil and KPPN when role changes
                        setKdkanwil("");
                        setKdkppn("");
                        setNmkanwil("");
                        setNmkppn("");
                      }
                    }}
                    disabled={!canEditRoleAndLocation()}
                  >
                    <SelectTrigger
                      id="role"
                      className="h-11"
                      disabled={!canEditRoleAndLocation()}
                    >
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">
                        Super Admin (X)
                      </SelectItem>
                      <SelectItem value="co_admin">Co-Admin (0)</SelectItem>
                      <SelectItem value="kantor_pusat">
                        Kantor Pusat (1)
                      </SelectItem>
                      <SelectItem value="ditpa">DIT PA (1)</SelectItem>
                      <SelectItem value="kanwil_djpb">
                        Kanwil DJPb (2)
                      </SelectItem>
                      <SelectItem value="kppn">KPPN (3)</SelectItem>
                      <SelectItem value="lainnya">User Lainnya (4)</SelectItem>
                    </SelectContent>
                  </Select>
                  {!canEditRoleAndLocation() && (
                    <FieldDescription>
                      Role hanya dapat diubah oleh Administrator
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="kanwil">Kanwil DJPb</FieldLabel>
                  {canEditRoleAndLocation() ? (
                    <Select
                      value={kdkanwil}
                      onValueChange={(v) => {
                        const selectedKanwil = kdkanwilData.find(
                          (k) => k.kdkanwil === v,
                        );
                        setKdkanwil(v);
                        setNmkanwil(selectedKanwil?.nmkanwil || "");
                      }}
                    >
                      <SelectTrigger id="kanwil" className="h-11">
                        <SelectValue placeholder="Pilih Kanwil DJPb" />
                      </SelectTrigger>
                      <SelectContent>
                        {kdkanwilData.map((kanwil) => (
                          <SelectItem
                            key={kanwil.kdkanwil}
                            value={kanwil.kdkanwil}
                          >
                            {kanwil.nmkanwil}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="kanwil"
                      value={nmkanwil || "Tidak ada data"}
                      disabled
                      className="bg-muted"
                    />
                  )}
                  {!canEditRoleAndLocation() && (
                    <FieldDescription>
                      Kanwil hanya dapat diubah oleh Administrator
                    </FieldDescription>
                  )}
                </Field>
              </div>
            ) : role === "kppn" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field>
                  <FieldLabel htmlFor="role">Role</FieldLabel>
                  <Select
                    value={role}
                    onValueChange={(v) => {
                      if (canEditRoleAndLocation()) {
                        setRole(v as User["role"]);
                        // Reset Kanwil and KPPN when role changes
                        setKdkanwil("");
                        setKdkppn("");
                        setNmkanwil("");
                        setNmkppn("");
                      }
                    }}
                    disabled={!canEditRoleAndLocation()}
                  >
                    <SelectTrigger
                      id="role"
                      className="h-11"
                      disabled={!canEditRoleAndLocation()}
                    >
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">
                        Super Admin (X)
                      </SelectItem>
                      <SelectItem value="co_admin">Co-Admin (0)</SelectItem>
                      <SelectItem value="kantor_pusat">
                        Kantor Pusat (1)
                      </SelectItem>
                      <SelectItem value="ditpa">DIT PA (1)</SelectItem>
                      <SelectItem value="kanwil_djpb">
                        Kanwil DJPb (2)
                      </SelectItem>
                      <SelectItem value="kppn">KPPN (3)</SelectItem>
                      <SelectItem value="lainnya">User Lainnya (4)</SelectItem>
                    </SelectContent>
                  </Select>
                  {!canEditRoleAndLocation() && (
                    <FieldDescription>
                      Role hanya dapat diubah oleh Administrator
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="kanwil-kppn">Kanwil</FieldLabel>
                  {canEditRoleAndLocation() ? (
                    <Select
                      value={kdkanwil}
                      onValueChange={(v) => {
                        const selectedKanwil = kdkanwilData.find(
                          (k) => k.kdkanwil === v,
                        );
                        setKdkanwil(v);
                        setNmkanwil(selectedKanwil?.nmkanwil || "");
                        setKdkppn("");
                        setNmkppn("");
                      }}
                    >
                      <SelectTrigger id="kanwil-kppn" className="h-11">
                        <SelectValue placeholder="Pilih Kanwil" />
                      </SelectTrigger>
                      <SelectContent>
                        {kdkanwilData.map((kanwil) => (
                          <SelectItem
                            key={kanwil.kdkanwil}
                            value={kanwil.kdkanwil}
                          >
                            {kanwil.nmkanwil}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="kanwil-kppn"
                      value={nmkanwil || "Tidak ada data"}
                      disabled
                      className="bg-muted"
                    />
                  )}
                  {!canEditRoleAndLocation() && (
                    <FieldDescription>
                      Kanwil hanya dapat diubah oleh Administrator
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="kppn">KPPN</FieldLabel>
                  {canEditRoleAndLocation() ? (
                    kdkanwil && (
                      <Select
                        value={kdkppn}
                        onValueChange={(v) => {
                          const selectedKppn = filteredKppn.find(
                            (k) => k.kdkppn === v,
                          );
                          setKdkppn(v);
                          setNmkppn(selectedKppn?.nmkppn || "");
                        }}
                      >
                        <SelectTrigger id="kppn" className="h-11">
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
                    )
                  ) : (
                    <Input
                      id="kppn"
                      value={nmkppn || "Tidak ada data"}
                      disabled
                      className="bg-muted"
                    />
                  )}
                  {!canEditRoleAndLocation() && (
                    <FieldDescription>
                      KPPN hanya dapat diubah oleh Administrator
                    </FieldDescription>
                  )}
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field>
                  <FieldLabel htmlFor="role">Role</FieldLabel>
                  <Select
                    value={role}
                    onValueChange={(v) => {
                      if (canEditRoleAndLocation()) {
                        setRole(v as User["role"]);
                        // Reset Kanwil and KPPN when role changes
                        setKdkanwil("");
                        setKdkppn("");
                        setNmkanwil("");
                        setNmkppn("");
                      }
                    }}
                    disabled={!canEditRoleAndLocation()}
                  >
                    <SelectTrigger
                      id="role"
                      className="h-11"
                      disabled={!canEditRoleAndLocation()}
                    >
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">
                        Super Admin (X)
                      </SelectItem>
                      <SelectItem value="co_admin">Co-Admin (0)</SelectItem>
                      <SelectItem value="kantor_pusat">
                        Kantor Pusat (1)
                      </SelectItem>
                      <SelectItem value="ditpa">DIT PA (1)</SelectItem>
                      <SelectItem value="kanwil_djpb">
                        Kanwil DJPb (2)
                      </SelectItem>
                      <SelectItem value="kppn">KPPN (3)</SelectItem>
                      <SelectItem value="lainnya">User Lainnya (4)</SelectItem>
                    </SelectContent>
                  </Select>
                  {!canEditRoleAndLocation() && (
                    <FieldDescription>
                      Role hanya dapat diubah oleh Administrator
                    </FieldDescription>
                  )}
                </Field>
                <div className="hidden md:block" />
              </div>
            )}
          </FieldGroup>
        </div>
      </div>

      {/* Password change section (optional) */}
      <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Keamanan</h2>
          <Button onClick={onChangePassword} disabled={changingPassword}>
            <Lock className="mr-2 h-4 w-4" />
            {changingPassword ? "Menyimpan..." : "Ubah Password"}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field>
            <FieldLabel htmlFor="newPassword">Password Baru</FieldLabel>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Minimal 12 Karakter (terdapat huruf besar, angka & simbol)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setShowNewPassword((current) => !current)}
                aria-label={
                  showNewPassword
                    ? "Sembunyikan password baru"
                    : "Lihat password baru"
                }
              >
                {showNewPassword ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">
              Konfirmasi Password Baru
            </FieldLabel>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Konfirmasi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={
                  showConfirmPassword
                    ? "Sembunyikan konfirmasi password baru"
                    : "Lihat konfirmasi password baru"
                }
              >
                {showConfirmPassword ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 sm:w-20 sm:flex-none" />
          <Skeleton className="h-10 flex-1 sm:w-28 sm:flex-none" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Avatar card skeleton matching Avatar card */}
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="size-32 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
        </div>

        {/* Profile form skeleton matching Profile form */}
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-11 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Password change section skeleton matching Password change section */}
      <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
