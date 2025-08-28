"use client";

import { Lock } from "lucide-react";

interface AuthRequiredCardProps {
  title: string;
  description: string;
  loginText?: string;
  onLogin?: () => void;
  className?: string;
}

export function AuthRequiredCard({
  title,
  description,
  loginText = "Login to View Data",
  onLogin = () => (window.location.href = "/login"),
  className = "rounded-lg p-6 bg-white dark:bg-neutral-900 shadow border-2 border-dashed border-yellow-300",
}: AuthRequiredCardProps) {
  return (
    <div className={className}>
      <div className="text-center">
        <Lock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {title}
        </h3>
        <p className="text-sm text-yellow-600 mb-3">{description}</p>
        <button
          onClick={onLogin}
          className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
        >
          {loginText}
        </button>
      </div>
    </div>
  );
}

