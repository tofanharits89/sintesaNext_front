"use client";

import { useEffect, useState } from "react";

export default function DebugCookiesPage() {
  const [cookies, setCookies] = useState<string>("");
  const [localStorage, setLocalStorage] = useState<string>("");

  useEffect(() => {
    // Get all cookies
    const cookieString = document.cookie;
    setCookies(cookieString);

    // Get localStorage auth data
    const authData = window.localStorage.getItem("auth-session-store");
    setLocalStorage(authData || "none");
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cookie Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">All Browser Cookies:</h2>
          <pre className="whitespace-pre-wrap text-sm bg-white p-3 rounded border">
            {cookies || "No cookies found"}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">localStorage auth-session-store:</h2>
          <pre className="whitespace-pre-wrap text-sm bg-white p-3 rounded border max-h-96 overflow-auto">
            {localStorage}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Cookie Analysis:</h2>
          <div className="text-sm space-y-2">
            <p><strong>Has access_token:</strong> {cookies.includes("access_token=") ? "✅ YES" : "❌ NO"}</p>
            <p><strong>Has accessToken:</strong> {cookies.includes("accessToken=") ? "✅ YES" : "❌ NO"}</p>
            <p><strong>Has refresh_token:</strong> {cookies.includes("refresh_token=") ? "✅ YES" : "❌ NO"}</p>
            <p><strong>Has refreshToken:</strong> {cookies.includes("refreshToken=") ? "✅ YES" : "❌ NO"}</p>
            <p><strong>Has XSRF-TOKEN:</strong> {cookies.includes("XSRF-TOKEN=") ? "✅ YES" : "❌ NO"}</p>
            <p><strong>Has legacy csrf_token:</strong> {cookies.includes("csrf_token=") ? "✅ YES" : "❌ NO"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
