import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, Bot, AlertTriangle } from "lucide-react";
import { methodDefinitions } from "./shared";

interface PrognosisAIAnalysisProps {
    selectedMetode: string;
    predictionData: any;
}

export const PrognosisAIAnalysis = ({ selectedMetode, predictionData }: PrognosisAIAnalysisProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-700 dark:text-blue-400 font-bold">Definisi Metode: {selectedMetode.toUpperCase()}</AlertTitle>
                <AlertDescription className="text-xs mt-1 leading-relaxed text-blue-800 dark:text-blue-300">
                    {methodDefinitions[selectedMetode]}
                </AlertDescription>
            </Alert>

            {predictionData?.prediction?.ai_analysis ? (
                <Alert className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50">
                    <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <AlertTitle className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-between">
                        Analisis Kecerdasan Buatan
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-600 dark:text-white text-[10px] h-4">Confidence: {(predictionData.prediction.ai_analysis.confidence * 100).toFixed(0)}%</Badge>
                    </AlertTitle>
                    <AlertDescription className="text-emerald-800 dark:text-emerald-300">
                        <p className="text-xs mt-1 leading-relaxed">{predictionData.prediction.ai_analysis.analysis}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Risk Level:</span>
                            <Badge variant={predictionData.prediction.ai_analysis.risk_level === 'RENDAH' ? 'default' : 'destructive'}
                                className="text-[10px] h-4 leading-none min-h-[16px]">
                                {predictionData.prediction.ai_analysis.risk_level}
                            </Badge>
                        </div>
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Analisis AI Tidak Tersedia</AlertTitle>
                    <AlertDescription className="text-xs">
                        Backend monitoring tidak mendeteksi output dari modul AI Analysis. Periksa koneksi ke AI Engine.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};
