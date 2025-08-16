import { useState, useEffect } from "react";
import { toast } from "sonner";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/lib/socket";

type AdminUser = {
  id: string;
  name: string;
  username: string;
  role: string;
  email: string;
};

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get token from cookies for authentication
      const token = getAuthTokenFromCookie();
      console.log("[useAdminUsers Debug] Fetching admin users:", {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPrefix: token?.substring(0, 10) + "...",
        url: backendPath("/users/admins"),
      });

      const response = await fetch(backendPath("/users/admins"), {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      console.log("[useAdminUsers Debug] Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        console.error(
          "[useAdminUsers Debug] 401 Unauthorized - Token validation failed"
        );
        throw new Error(`Error fetching admin users: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        console.log(
          "[useAdminUsers Debug] Admin users fetched successfully:",
          data.data.length
        );
        setUsers(data.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("[useAdminUsers Debug] Fetch error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch admin users";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  return {
    adminUsers: users,
    loading,
    error,
    refreshAdminUsers: fetchAdminUsers,
  };
}
