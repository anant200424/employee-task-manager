"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import EmployeesPage from "../employees/page";

export default function AdminPortalPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const rawRole = String(user?.role || "").toLowerCase().trim();
  const sysRole = String(user?.systemRole || "").toLowerCase().trim();
  const isPrivileged =
    ["super_admin", "system_admin", "admin"].includes(sysRole) ||
    rawRole.includes("admin") ||
    rawRole.includes("super");

  useEffect(() => {
    if (!isLoading && user && !isPrivileged) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, isPrivileged, router]);

  if (!isLoading && (!user || !isPrivileged)) {
    return null;
  }

  return <EmployeesPage isAdminRoute={true} />;
}
