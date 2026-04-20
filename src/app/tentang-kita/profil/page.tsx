"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Person = {
  role: string;
  name: string;
  nip: string;
  photoUrl?: string;
};

const coreTeam: Person[] = [
  { role: "Direktur", name: "Moudy Hermawan", nip: "197504031994031001" },
  {
    role: "Penanggung Jawab",
    name: "Zulfitri Nasran",
    nip: "197011301998031003",
  },
  {
    role: "Project Manager",
    name: "Bayu Yudistira",
    nip: "198312142010121003",
  },
  {
    role: "Fullstack Developer",
    name: "Taufan Maulana Harits",
    nip: "198910102012101001",
  },
  {
    role: "Fullstack Developer",
    name: "Aln Pujo Priambodo",
    nip: "200109102023021004",
  },
  {
    role: "UI/UX Designer",
    name: "Wirasukma Legendani",
    nip: "199312282014111001",
  },
  {
    role: "Data Analyst",
    name: "Nur Achmad Taufiq",
    nip: "200003052022011001",
  },
];

// Placeholder honorable mentions (silakan ubah nama & NIP di kemudian hari)
const honorableMentions: Person[] = [
  {
    role: "Data Analyst (Alumni)",
    name: "Nugraheni Vikri Puspitaningtyas",
    nip: "199712112019122001",
  },
  {
    role: "Fullstack Developer (Alumni)",
    name: "Yacob Yulis Setyoko",
    nip: "198307242002121004",
  },
  {
    role: "Database Engineer (Alumni)",
    name: "Restu Alam Siagian",
    nip: "199903112019121001",
  },
  {
    role: "Project Manager (Alumni)",
    name: "Catur Ery Prabowo",
    nip: "197712052002121002",
  },
  {
    role: "Data Analyst (Alumni)",
    name: "Fatqur Hidayat",
    nip: "198909232010121002",
  },
  {
    role: "Database Engineer (Alumni)",
    name: "M Fajri Natsir",
    nip: "198209052003121004",
  },
  {
    role: "Fullstack Developer (Alumni)",
    name: "Sabar Sautomo",
    nip: "198011242001121002",
  },
  {
    role: "Data Analyst (Alumni)",
    name: "I Nyoman Enri Suryanata Sulendra",
    nip: "198304072004121003",
  },
];

function PhotoPlaceholder({ name }: { name: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "US";
  return (
    <div className="h-12 w-12 shrink-0 rounded-md bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
      {initials}
    </div>
  );
}

function CompactCard({ person }: { person: Person }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="px-3">
        <div className="flex items-center gap-3">
          <PhotoPlaceholder name={person.name} />
          <div className="min-w-0">
            <div className="mb-0.5">
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5 capitalize"
              >
                {person.role}
              </Badge>
            </div>
            <div className="font-semibold leading-snug">{person.name}</div>
            <div className="text-[11px] text-muted-foreground font-mono">
              NIP: {person.nip}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Connector() {
  return <div className="mx-auto h-6 w-px bg-border" />;
}

export default function TentangKitaProfilPage() {
  const direktur = coreTeam.find((p) => p.role === "Direktur")!;
  const pj = coreTeam.find((p) => p.role === "Penanggung Jawab")!;
  const pm = coreTeam.find((p) => p.role === "Project Manager")!;
  const teknis = coreTeam.filter(
    (p) => !["Direktur", "Penanggung Jawab", "Project Manager"].includes(p.role)
  );

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tentang Kita — Profil
        </h1>
        <p className="text-sm text-muted-foreground">
          Mengenal para pengembang aplikasi dan apresiasi untuk rekan-rekan yang
          pernah berkontribusi.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Tim Pengembang</h2>
        {/* Hierarchical view */}
        <div className="max-w-3xl mx-auto">
          <div className="max-w-xl mx-auto">
            <CompactCard person={direktur} />
          </div>
          <Connector />
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CompactCard person={pj} />
            <CompactCard person={pm} />
          </div>
          <Connector />
        </div>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Tim Teknis</div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
            {teknis.map((p) => (
              <CompactCard key={p.nip} person={p} />
            ))}
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Honorable Mentions</h2>
        <p className="text-sm text-muted-foreground">
          Mereka yang turut membangun pondasi aplikasi ini. Terima kasih atas
          dedikasi dan kontribusinya.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {honorableMentions.map((p) => (
            <CompactCard key={p.nip} person={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
