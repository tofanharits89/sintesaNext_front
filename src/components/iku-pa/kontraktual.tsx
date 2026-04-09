"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function KontraktualContent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data IKI Kontraktual</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Isi konten atau tabel IKI Kontraktual akan tampil di sini.</p>
      </CardContent>
    </Card>
  );
}
