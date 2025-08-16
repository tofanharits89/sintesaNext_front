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
  { role: "Penanggung Jawab", name: "Arie Suwandani W. Wirastuti", nip: "197510221995122001" },
  { role: "Project Manager", name: "Bayu Yudistira", nip: "198312142010121003" },
  { role: "Fullstack Developer", name: "Taufan Maulana Harits", nip: "198910102012101001" },
  { role: "Fullstack Developer", name: "Aln Pujo Priambodo", nip: "200109102023021004" },
  { role: "UI/UX Designer", name: "Wirasukma Legendani", nip: "199312282014111001" },
  { role: "Liaison Officer", name: "Nugraheni Vikri Puspitaningtyas", nip: "199712112019122001" },
];

// Placeholder honorable mentions (silakan ubah nama & NIP di kemudian hari)
const honorableMentions: Person[] = [
  { role: "Developer (Alumni)", name: "Rizky Pratama", nip: "198701152010121001" },
  { role: "Engineer (Alumni)", name: "Siti Rahmawati", nip: "199005202012122002" },
  { role: "Data Analyst (Alumni)", name: "Dimas Saputra", nip: "199203112015031003" },
  { role: "QA (Alumni)", name: "Putri Anindya", nip: "199411022016042004" },
  { role: "Support (Alumni)", name: "Fajar Nugroho", nip: "198806302013052005" },
];

function PhotoPlaceholder({ name }: { name: string }) {
  const initials = name
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
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <PhotoPlaceholder name={person.name} />
          <div className="min-w-0">
            <div className="mb-0.5">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 capitalize">
                {person.role}
              </Badge>
            </div>
            <div className="font-semibold leading-snug">{person.name}</div>
            <div className="text-[11px] text-muted-foreground font-mono">NIP: {person.nip}</div>
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
        <h1 className="text-2xl font-semibold tracking-tight">Tentang Kita — Profil</h1>
        <p className="text-sm text-muted-foreground">
          Mengenal para pengembang aplikasi dan apresiasi untuk rekan-rekan yang pernah berkontribusi.
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
          Mereka yang turut membangun pondasi aplikasi ini. Terima kasih atas dedikasi dan kontribusinya.
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
