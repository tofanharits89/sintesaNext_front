"use client";

import { LandingPenilaianIku } from "@/components/transfer-daerah/penilaian-iku/landing";
import { useAuth } from "@/hooks/useAuth";

export default function PenilaianIkuPage() {
  const { user } = useAuth();

  const getLegacyRole = (role?: string) => {
    switch (role) {
      case "kppn":
        return "3";
      case "kanwil_djpb":
        return "2";
      default:
        return "0";
    }
  };

  return (
    <LandingPenilaianIku
      role={getLegacyRole(user?.role)}
      username={user?.username ?? ""}
      kdkppn={user?.kdkppn ?? ""}
    />
  );
}

export const dynamic = "force-dynamic";
