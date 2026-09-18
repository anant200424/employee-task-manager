"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdminUser } from "@/lib/roleUtils";
import EmployeesPage from "../employees/page";

export default function SuperAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isSuperAdmin = isSuperAdminUser(user);

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
