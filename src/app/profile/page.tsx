"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentUser } from "@/lib/use-current-user";
import { apiPath } from "@/lib/base-path";
import { User } from "@/lib/users-store";
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
// Removed unused Separator import
import { toast } from "sonner";
import kdkanwilData from "@/data/kdkanwil.json";
import kdkppnData from "@/data/kdkppn.json";

export default function ProfilePage() {
  const { currentUser: current, mutate } = useCurrentUser();

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
      payload.limitKodeBA = limitKodeBA || undefined;
      payload.kdkanwil = kdkanwil || undefined;
      payload.kdkppn = kdkppn || undefined;
      payload.nmkanwil = nmkanwil || undefined;
      payload.nmkppn = nmkppn || undefined;
    }

    try {
      const res = await fetch(apiPath("/users/profile/me"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const message =
          data?.message || data?.error || "Gagal menyimpan profil";
        toast.error(message);
        return;
      }
      toast.success("Profil tersimpan");
      mutate();
    } catch (e: Error | unknown) {
      toast.error(
        e instanceof Error ? e.message : "Terjadi kesalahan jaringan"
      );
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
          <Button variant="secondary" onClick={() => mutate()}>
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
        <h2 className="mb-4 text-base font-semibold">Keamanan</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Password Baru</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="grid gap-2">
            <Label>Konfirmasi Password Baru</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline" disabled>
            Ubah Password (coming soon)
          </Button>
        </div>
      </div>
    </div>
  );
}
