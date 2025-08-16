export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Pengaturan</h1>
      <p className="text-sm text-muted-foreground">Atur preferensi aplikasi Anda di sini.</p>
      <ul className="grid gap-4 md:grid-cols-2">
        <li className="rounded-lg border p-4">Tema, bahasa, dan notifikasi.</li>
        <li className="rounded-lg border p-4">Manajemen profil dan keamanan.</li>
      </ul>
    </div>
  );
}

