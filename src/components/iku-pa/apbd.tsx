"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApbdContent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data IKI APBD</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Isi konten atau tabel IKI APBD akan tampil di sini.</p>
      </CardContent>
    </Card>
  );
}
