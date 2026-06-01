"use client";
import { Save } from "lucide-react";
import React from "react";

interface SaveUserDataProps {
  userData?: string;
  menu?: string;
  onSave?: () => void;
}

export default function SaveUserData({ userData, menu }: SaveUserDataProps) {
  // Simple stub for save user data button / functionality
  if (!userData) return null;
  return (
    <div style={{ display: "none" }}>
      {/* Placeholder - actual implementation can store data or send to server */}
      <button
        onClick={() => console.log(`save userData=${userData} menu=${menu}`)}
      >
        <Save className="h-4 w-4 mr-1.5" /> Simpan Data Pengguna
      </button>
    </div>
  );
}
