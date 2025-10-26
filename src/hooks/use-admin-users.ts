import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiPath } from "@/lib/config/base-path";

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
      // Fetching admin users from API (cookies sent automatically)
      const response = await fetch(apiPath("/users/admins"), {
        credentials: "include", // Send HTTP-only cookies automatically
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Processing admin users response

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
