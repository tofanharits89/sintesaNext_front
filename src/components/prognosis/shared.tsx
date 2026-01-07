import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const methodDefinitions: Record<string, string> = {
    arima: "ARIMA (AutoRegressive Integrated Moving Average) adalah metode statistik klasik yang sangat efektif untuk data deret waktu yang memiliki tren dan musiman yang stabil.",
    sarima: "SARIMA (Seasonal ARIMA) adalah pengembangan dari ARIMA yang secara khusus menangani pola musiman (seasonal) dalam data, sangat cocok untuk data realisasi anggaran bulanan.",
    prophet: "Facebook Prophet adalah model forecasting yang tangguh terhadap data yang hilang (missing data) dan perubahan tren yang drastis, serta otomatis mendeteksi hari libur/event khusus.",
    xgboost: "XGBoost (Extreme Gradient Boosting) adalah algoritma Machine Learning berbasis pohon keputusan yang sangat akurat untuk menangkap pola non-linear yang kompleks dalam data keuangan.",
    random_forest: "Random Forest Regressor menggunakan kumpulan pohon keputusan untuk memprediksi nilai masa depan dengan cara rata-rata, sangat stabil dan tidak mudah mengalami overfitting.",
    lstm: "Long Short-Term Memory (LSTM) adalah arsitektur Deep Learning (RNN) yang dirancang khusus untuk mempelajari ketergantungan jangka panjang dalam data deret waktu yang sangat kompleks.",
};

export const Section = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
    <Card className={`mb-6 overflow-hidden ${className}`}>
        <CardHeader className="pb-2 pt-4 px-6 border-b">
            <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
            {children}
        </CardContent>
    </Card>
);

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col space-y-2 mb-4">
        <Label className="text-sm font-medium">
            {label}
        </Label>
        {children}
    </div>
);
