"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUnifiedAuth } from "@/lib/auth";
import { apiClient, prefetchCsrf } from "@/lib/api/httpClient";
import { User } from "@/stores/session-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import kdkanwilData from "@/data/kdkanwil.json";
import kdkppnData from "@/data/kdkppn.json";

export default function ProfilePage() {
  const { user: current, refetch } = useUnifiedAuth();

  // Check if user can edit role and location fields (only super_admin and co_admin can)
  const canEditRoleAndLocation =
    current?.role === "super_admin" || current?.role === "co_admin";

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
  }, [current]);

  function onPickFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Harap pilih file gambar");
      return;
    }
    const url = URL.createObjectURL(f);
    setAvatarUrl(url);
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
    if (canEditRoleAndLocation) {
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
      const trace = `prof_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
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
        e instanceof Error ? e.message : "Terjadi kesalahan jaringan"
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
      const trace = `prof_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      console.log(`[Profile Page] changePassword trace=${trace}`);
      const data = await apiClient.put<any>("/users/profile/me", {
        password: newPassword,
      }, {
        headers: {
          "X-Debug-Source": "profile.page.changePassword",
          "X-Debug-Trace": trace,
        },
      });
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
          e instanceof Error ? e.message : "Terjadi kesalahan jaringan"
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profil Akun</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()}>
            Reset
          </Button>
          <Button onClick={onSave}>Simpan</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Avatar card */}
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="size-24">
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
                Unggah Foto
              </Button>
              {avatarUrl && (
                <Button variant="ghost" onClick={() => setAvatarUrl(undefined)}>
                  Hapus
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Format gambar (JPG, PNG). Maks 5MB.
            </p>
          </div>
        </div>

        {/* Profile form */}
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nama Lengkap</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  if (canEditRoleAndLocation) {
                    setRole(v as User["role"]);
                    // Reset Kanwil and KPPN when role changes
                    setKdkanwil("");
                    setKdkppn("");
                    setNmkanwil("");
                    setNmkppn("");
                  }
                }}
                disabled={!canEditRoleAndLocation}
              >
                <SelectTrigger
                  className="h-11"
                  disabled={!canEditRoleAndLocation}
                >
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
              {!canEditRoleAndLocation && (
                <p className="text-xs text-muted-foreground">
                  Role hanya dapat diubah oleh Administrator
                </p>
              )}
            </div>

            {/* Conditional Kanwil DJPb Selection */}
            {role === "kanwil_djpb" && (
              <div className="grid gap-2">
                <Label>Kanwil DJPb</Label>
                {canEditRoleAndLocation ? (
                  <Select
                    value={kdkanwil}
                    onValueChange={(v) => {
                      const selectedKanwil = kdkanwilData.find(
                        (k) => k.kdkanwil === v
                      );
                      setKdkanwil(v);
                      setNmkanwil(selectedKanwil?.nmkanwil || "");
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Pilih Kanwil DJPb" />
                    </SelectTrigger>
                    <SelectContent>
                      {kdkanwilData.map((kanwil) => (
                        <SelectItem key={kanwil.kdkanwil} value={kanwil.kdkanwil}>
                          {kanwil.nmkanwil}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={nmkanwil || "Tidak ada data"}
                    disabled
                    className="bg-muted"
                  />
                )}
                {!canEditRoleAndLocation && (
                  <p className="text-xs text-muted-foreground">
                    Kanwil hanya dapat diubah oleh Administrator
                  </p>
                )}
              </div>
            )}

            {/* Conditional KPPN Selection */}
            {role === "kppn" && (
              <>
                <div className="grid gap-2">
                  <Label>Kanwil</Label>
                  {canEditRoleAndLocation ? (
                    <Select
                      value={kdkanwil}
                      onValueChange={(v) => {
                        const selectedKanwil = kdkanwilData.find(
                          (k) => k.kdkanwil === v
                        );
                        setKdkanwil(v);
                        setNmkanwil(selectedKanwil?.nmkanwil || "");
                        setKdkppn("");
                        setNmkppn("");
                      }}
                    >
                      <SelectTrigger className="h-11">
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
                  ) : (
                    <Input
                      value={nmkanwil || "Tidak ada data"}
                      disabled
                      className="bg-muted"
                    />
                  )}
                  {!canEditRoleAndLocation && (
                    <p className="text-xs text-muted-foreground">
                      Kanwil hanya dapat diubah oleh Administrator
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>KPPN</Label>
                  {canEditRoleAndLocation ? (
                    kdkanwil && (
                      <Select
                        value={kdkppn}
                        onValueChange={(v) => {
                          const selectedKppn = filteredKppn.find(
                            (k) => k.kdkppn === v
                          );
                          setKdkppn(v);
                          setNmkppn(selectedKppn?.nmkppn || "");
                        }}
                      >
                        <SelectTrigger className="h-11">
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
                      value={nmkppn || "Tidak ada data"}
                      disabled
                      className="bg-muted"
                    />
                  )}
                  {!canEditRoleAndLocation && (
                    <p className="text-xs text-muted-foreground">
                      KPPN hanya dapat diubah oleh Administrator
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label>Limit Kode BA</Label>
              <Input
                placeholder="contoh: 015 atau 015,042"
                value={limitKodeBA}
                onChange={(e) =>
                  canEditRoleAndLocation && setLimitKodeBA(e.target.value)
                }
                disabled={!canEditRoleAndLocation}
              />
              {!canEditRoleAndLocation && (
                <p className="text-xs text-muted-foreground">
                  Limit Kode BA hanya dapat diubah oleh Administrator
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password change section (optional) */}
      <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Keamanan</h2>
          <Button onClick={onChangePassword} disabled={changingPassword}>
            {changingPassword ? "Menyimpan..." : "Ubah Password"}
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Password Baru</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Konfirmasi Password Baru</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
