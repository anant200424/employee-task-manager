"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import EmployeesPage from "../employees/page";

export default function SuperAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const rawRole = String(user?.role || "").toLowerCase().trim();
  const sysRole = String(user?.systemRole || "").toLowerCase().trim();
  const email = String(user?.email || "").toLowerCase().trim();
  const isSuperAdmin =
    sysRole === "super_admin" ||
    rawRole.includes("super") ||
    email === "superadmin@empsphere.io";

  useEffect(() => {
    if (!isLoading && user && !isSuperAdmin) {
      router.replace("/admin");
    }
  }, [isLoading, user, isSuperAdmin, router]);

  if (!isLoading && (!user || !isSuperAdmin)) {
    return null;
  }

  return <EmployeesPage isSuperAdminRoute={true} />;
}
