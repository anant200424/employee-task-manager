"use client";

import { useAuth } from "@/context/AuthContext";
import EmployeesPage from "../employees/page";

export default function AdminPortalPage() {
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) {
    return null;
  }

  return <EmployeesPage isAdminRoute={true} />;
}
