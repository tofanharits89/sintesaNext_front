import { useEffect, useState } from "react";

export function useGoogleMaps(apiKey?: string) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError("API key tidak tersedia");
      return;
    }

    if (typeof window === "undefined") return;
    if ((window as any).google?.maps) {
      setLoaded(true);
      return;
    }

    const existing = document.getElementById("gmaps-script");
    if (existing) {
      existing.addEventListener("load", () => setLoaded(true));
      existing.addEventListener("error", () => setError("Gagal memuat Google Maps"));
      return;
    }

    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&language=id&region=ID`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError("Gagal memuat Google Maps");
    document.body.appendChild(script);
  }, [apiKey]);

  return { loaded, error };
}
