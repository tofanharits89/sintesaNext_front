import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SQLModalProps {
  sqlQuery: string;
  isCopied: boolean;
  onCopy: () => void;
  onClose: () => void;
}

export const SQLModal: React.FC<SQLModalProps> = ({
  sqlQuery,
  isCopied,
  onCopy,
  onClose,
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
    <Card className="w-full max-w-4xl bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">SQL Query</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-zinc-800">
          ✕
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <pre className="p-4 bg-black rounded-lg overflow-auto max-h-[500px] text-green-400 text-xs whitespace-pre-wrap">
            {sqlQuery}
          </pre>
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2"
            onClick={onCopy}
          >
            {isCopied ? "Copied!" : "Copy SQL"}
          </Button>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);
