"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  tasks: "Tasks Board",
  employees: "Employee Directory",
  superadmin: "Super Admin Portal",
  analytics: "Analytics & Reports",
  calendar: "Calendar",
  settings: "Settings",
  profile: "My Profile",
  notifications: "Notifications",
  payslips: "Payslips & CTC",
  help: "Help & Support",
  "empty-states": "Collaboration Hub",
  events: "Events",
};

interface BreadcrumbsProps {
  customItems?: { label: string; href?: string }[];
  className?: string;
}

export const Breadcrumbs = ({ customItems, className = "" }: BreadcrumbsProps) => {
  const pathname = usePathname() || "/";

  // Build items from pathname if customItems not provided
  let items: BreadcrumbItem[] = [];

  if (customItems && customItems.length > 0) {
    items = customItems.map((item, index) => ({
      label: item.label,
      href: item.href || "#",
      isCurrent: index === customItems.length - 1,
    }));
  } else {
    // Generate from pathname
    const segments = pathname.split("/").filter(Boolean);

    // Root is always EmpSphere / Dashboard
    items.push({
      label: "EmpSphere",
      href: "/dashboard",
      isCurrent: segments.length === 0,
    });

    let cumulativePath = "";
    segments.forEach((seg, index) => {
      cumulativePath += `/${seg}`;
      const label =
        ROUTE_LABELS[seg.toLowerCase()] ||
        seg.charAt(0).toUpperCase() + seg.slice(1).replace(/[-_]/g, " ");

      items.push({
        label,
        href: cumulativePath,
        isCurrent: index === segments.length - 1,
      });
    });
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-[11px] font-semibold text-slate-400 dark:text-slate-400 select-none ${className}`}
    >
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const isFirst = idx === 0;

          return (
            <li key={`${item.href}-${idx}`} className="flex items-center gap-1.5">
              {idx > 0 && (
                <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
              )}

              {isLast ? (
                <span className="font-bold text-[#5B5FEF] dark:text-indigo-400 truncate max-w-[180px]">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                >
                  {isFirst && <Home className="w-3 h-3 shrink-0 opacity-70" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
