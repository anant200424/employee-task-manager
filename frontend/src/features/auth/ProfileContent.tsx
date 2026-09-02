"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  User,
  Building2,
  ShieldCheck,
  FolderOpen,
  IndianRupee,
  CheckCircle2,
  Camera,
  Trash2,
  Image as ImageIcon,
  Mail,
  Phone,
  Briefcase,
  CreditCard,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { PersonalInfoTab } from "@/components/profile/PersonalInfoTab";
import { EmploymentInfoTab } from "@/components/profile/EmploymentInfoTab";
import { ComplianceTab } from "@/components/profile/ComplianceTab";
import { DocumentsTab } from "@/components/profile/DocumentsTab";
import { SalaryStructureTab } from "@/components/profile/SalaryStructureTab";

type TabId = "personal" | "employment" | "compliance" | "documents" | "salary";

export const ProfileContent = () => {
  const { user, setUser } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [coverUrl, setCoverUrl] = useState(user?.coverUrl || "");
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [updatingCover, setUpdatingCover] = useState(false);

  const TABS = [
    { id: "personal", label: "Personal Information", icon: User },
    { id: "employment", label: "Employment Information", icon: Building2 },
    { id: "compliance", label: "Compliance & Legal", icon: ShieldCheck },
    { id: "documents", label: "Uploaded Documents", icon: FolderOpen },
    { id: "salary", label: "Salary & CTC", icon: IndianRupee },
  ];

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar image size must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      try {
        setUpdatingAvatar(true);
        const res = await api.patch("/users/me", { avatarUrl: result });
        if (res.data?.data?.user) {
          setUser(res.data.data.user);
          toast.success("Profile picture updated");
        }
      } catch (err: any) {
        toast.error("Failed to save avatar image");
      } finally {
        setUpdatingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    try {
      setUpdatingAvatar(true);
      setAvatarUrl("");
      const res = await api.patch("/users/me", { avatarUrl: "" });
      if (res.data?.data?.user) {
        setUser(res.data.data.user);
        toast.success("Profile picture removed");
      }
    } catch (err) {
      toast.error("Failed to remove profile picture");
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file for cover");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Cover banner size must be under 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setCoverUrl(result);
      try {
        setUpdatingCover(true);
        const res = await api.patch("/users/me", { coverUrl: result });
        if (res.data?.data?.user) {
          setUser(res.data.data.user);
          toast.success("Cover banner updated");
        }
      } catch (err) {
        toast.error("Failed to update cover banner");
      } finally {
        setUpdatingCover(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = async () => {
    try {
      setUpdatingCover(true);
      setCoverUrl("");
      const res = await api.patch("/users/me", { coverUrl: "" });
      if (res.data?.data?.user) {
        setUser(res.data.data.user);
        toast.success("Cover banner removed");
      }
    } catch (err) {
      toast.error("Failed to remove cover banner");
    } finally {
      setUpdatingCover(false);
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "EM";

  const isAdmin = user?.role === "admin";

  return (
    <div className="w-full min-h-screen bg-transparent pb-24 transition-colors duration-300">
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 animate-in fade-in duration-500">
        
        {/* =========================================================================
            1. CONTAINERIZED ROUNDED COVER BANNER (Eleken / YouTube / Twitter Style)
           ========================================================================= */}
        <div className="relative w-full h-44 sm:h-56 md:h-64 lg:h-72 rounded-[28px] overflow-hidden bg-[#0D1117] border border-slate-200/90 dark:border-slate-800 shadow-md select-none group">
          {coverUrl ? (
            <>
              <img
                src={coverUrl}
                alt="Profile Cover"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] flex items-center justify-center p-6 text-center">
              <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#94A3B8_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="relative z-10 max-w-xl space-y-1">
                <p className="text-sm sm:text-base font-bold text-indigo-300 tracking-wide">
                  EmpSphere Enterprise Workspace
                </p>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  Helping teams build & deliver <span className="text-amber-400">with excellence</span>
                </h2>
              </div>
            </div>
          )}

          {/* Cover Action Buttons */}
          <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 flex items-center gap-2 z-20">
            {coverUrl && (
              <button
                type="button"
                disabled={updatingCover}
                onClick={handleRemoveCover}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-rose-600 text-white text-[11.5px] font-bold shadow-md backdrop-blur-md transition-all cursor-pointer border border-white/20 active:scale-95"
                title="Remove cover banner"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
                <span className="hidden sm:inline">Remove</span>
              </button>
            )}

            <label
              htmlFor="profile-cover-upload"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-[11.5px] font-extrabold shadow-md backdrop-blur-md cursor-pointer transition-all border border-white/40 hover:shadow-lg active:scale-95"
              title="Change cover photo"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>{coverUrl ? "Change Banner" : "Upload Banner"}</span>
            </label>
            <input
              id="profile-cover-upload"
              type="file"
              accept="image/*"
              onChange={handleCoverFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* =========================================================================
            2. PROFILE IDENTITY STRIP (Circular Avatar + Rich Details on Right)
           ========================================================================= */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 px-2 sm:px-4">
          {/* Circular Avatar */}
          <div className="relative shrink-0">
            <div className="relative group">
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-3xl sm:text-4xl shadow-xl overflow-hidden border-4 border-white dark:border-slate-900 ring-2 ring-slate-200/90 dark:ring-slate-800">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user ? `${user.firstName} ${user.lastName}` : "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-slate-300 font-extrabold">{initials}</span>
                )}
              </div>

              {/* Upload Avatar Overlay */}
              <label
                htmlFor="profile-avatar-upload"
                className="absolute inset-0 bg-slate-950/65 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold cursor-pointer backdrop-blur-xs"
              >
                <Camera className="w-5 h-5 mb-1" />
                <span>Change</span>
              </label>

              {/* Camera Icon Trigger Button */}
              <label
                htmlFor="profile-avatar-upload"
                className="absolute bottom-1 right-1 p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white border-2 border-white dark:border-slate-900 shadow-md cursor-pointer transition-all active:scale-95"
                title="Change profile picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>

              {/* Delete Avatar Button */}
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute top-1 right-1 p-1.5 rounded-full bg-slate-900 hover:bg-rose-600 text-white border-2 border-white dark:border-slate-900 shadow-md cursor-pointer transition-all active:scale-95"
                  title="Remove profile picture"
                >
                  <Trash2 className="w-3 h-3 text-rose-400 hover:text-white" />
                </button>
              )}

              <input
                id="profile-avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Details on Right */}
          <div className="flex-1 space-y-2.5 text-center md:text-left pt-1">
            {/* Title & Verified Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {user ? `${user.firstName} ${user.lastName}` : "Employee Profile"}{" "}
                <span className="font-extrabold text-slate-500 dark:text-slate-400 text-lg sm:text-xl font-normal">
                  — {isAdmin ? "Enterprise Administrator" : (user?.role || "Software Engineer")}
                </span>
              </h1>
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 inline-block" />
            </div>

            {/* Handle & Core Specs */}
            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                @{user?.firstName?.toLowerCase() || "user"}{user?.lastName?.toLowerCase() || ""}
              </span>
              <span>•</span>
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 font-bold text-[12px]">
                ID: {user?.employeeId || "EMP-1042"}
              </span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {user?.department || "Engineering"} Department
              </span>
            </p>

            {/* Bio / Description */}
            <p className="text-[13.5px] text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              EmpSphere Enterprise verified staff member. Overseeing department workflows, team tasks, security compliance, and workspace productivity.
            </p>

            {/* Contact Links & Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              <span className="text-[13px] font-bold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                {user?.email}
              </span>
              {user?.phoneNumber && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    {user.dialCode} {user.phoneNumber}
                  </span>
                </>
              )}
            </div>

            {/* Subscribe / Action Pill Style Button */}
            <div className="pt-2 flex items-center justify-center md:justify-start gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("personal")}
                className="px-5 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-[13px] font-black transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>{isAdmin ? "Active System Administrator" : "Active Verified Employee"}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("employment")}
                className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[13px] font-bold transition-all cursor-pointer"
              >
                View HR Records
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls - Generous Spacing & Soft Pill Curves */}
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-[13.5px] transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm border border-blue-600"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 dark:border-slate-800 min-h-[480px]">
          {activeTab === "personal" && <PersonalInfoTab />}
          {activeTab === "employment" && <EmploymentInfoTab />}
          {activeTab === "compliance" && <ComplianceTab />}
          {activeTab === "documents" && <DocumentsTab />}
          {activeTab === "salary" && <SalaryStructureTab />}
        </div>
      </main>
    </div>
  );
};
