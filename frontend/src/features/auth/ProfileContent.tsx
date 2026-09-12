"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  User,
  Building2,
  ShieldCheck,
  FolderOpen,
  CheckCircle2,
  Camera,
  Trash2,
  Image as ImageIcon,
  Mail,
  Phone,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { PersonalInfoTab } from "@/components/profile/PersonalInfoTab";
import { EmploymentInfoTab } from "@/components/profile/EmploymentInfoTab";
import { ComplianceTab } from "@/components/profile/ComplianceTab";
import { DocumentsTab } from "@/components/profile/DocumentsTab";
import { SalaryStructureTab } from "@/components/profile/SalaryStructureTab";
import { UnsplashCoverModal } from "@/components/profile/UnsplashCoverModal";
import { Topbar } from "@/components/dashboard/Topbar";
import { useLanguage } from "@/context/LanguageContext";

type TabId = "personal" | "employment" | "compliance" | "documents" | "salary";

export const ProfileContent = () => {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("empsphere_profile_active_tab") as TabId;
      if (saved && ["personal", "employment", "compliance", "documents", "salary"].includes(saved)) {
        return saved;
      }
      const hash = window.location.hash.replace("#", "") as TabId;
      if (hash && ["personal", "employment", "compliance", "documents", "salary"].includes(hash)) {
        return hash;
      }
    }
    return "personal";
  });

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("empsphere_profile_active_tab", tabId);
      try {
        window.history.replaceState(null, "", `#${tabId}`);
      } catch (e) {
        // ignore history state errors
      }
    }
  };
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [coverUrl, setCoverUrl] = useState(user?.coverUrl || "");
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [updatingCover, setUpdatingCover] = useState(false);
  const [isUnsplashOpen, setIsUnsplashOpen] = useState(false);

  const TABS = [
    { id: "personal", label: "Personal Information", icon: User },
    { id: "employment", label: "Employment & Role", icon: Building2 },
    { id: "compliance", label: "Compliance & Legal", icon: ShieldCheck },
    { id: "documents", label: "Uploaded Documents", icon: FolderOpen },
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
          setAvatarUrl(res.data.data.user.avatarUrl || "");
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

  const handleSelectUnsplashCover = async (url: string) => {
    try {
      setUpdatingCover(true);
      setCoverUrl(url);
      const res = await api.patch("/users/me", { coverUrl: url });
      if (res.data?.data?.user) {
        setUser(res.data.data.user);
        toast.success("Cover banner updated from Unsplash");
      }
    } catch (err: any) {
      toast.error("Failed to update cover banner");
    } finally {
      setUpdatingCover(false);
    }
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
      <Topbar
        title={t("profile", "Profile")}
        subtitle={t("profile_subtitle", "Manage your personal credentials, workspace banner, and account security")}
      />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 animate-in fade-in duration-500">
        
        {/* =========================================================================
            HEADER CONTAINER: SLEEK COVER BANNER + SIDE-BY-SIDE PROFILE ROW
           ========================================================================= */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/90 shadow-sm overflow-hidden pb-4 sm:pb-5">
          {/* 1. Sleek Compact Cover Banner */}
          <div className="relative w-full h-28 sm:h-36 md:h-40 bg-[#0D1117] overflow-hidden select-none group">
            {coverUrl ? (
              <>
                <img
                  src={coverUrl}
                  alt="Profile Cover"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] flex items-center justify-center p-4 text-center">
                <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#94A3B8_1px,transparent_1px)] [background-size:20px_20px]" />
                <div className="relative z-10 max-w-xl space-y-0.5">
                  <p className="text-[11px] sm:text-xs font-bold text-indigo-300 tracking-wider uppercase">
                    EmpSphere Enterprise Workspace
                  </p>
                  <h2 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight">
                    Helping teams build & deliver <span className="text-amber-400">with excellence</span>
                  </h2>
                </div>
              </div>
            )}

            {/* Cover Action Buttons */}
            <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center gap-2 z-20">
              {coverUrl && (
                <button
                  type="button"
                  disabled={updatingCover}
                  onClick={handleRemoveCover}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-rose-600 text-white text-[11px] font-semibold shadow-sm backdrop-blur-md transition-all cursor-pointer border border-white/20 active:scale-95"
                  title="Remove cover banner"
                >
                  <Trash2 className="w-3 h-3 text-rose-400 group-hover:text-white" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              )}

              {/* Choose from Unsplash Modal Trigger */}
              <button
                type="button"
                disabled={updatingCover}
                onClick={() => setIsUnsplashOpen(true)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-white text-[11px] font-bold shadow-sm backdrop-blur-md cursor-pointer transition-all border border-white/30 hover:border-white/50 active:scale-95"
                title="Choose banner from Unsplash"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Unsplash</span>
              </button>

              <label
                htmlFor="profile-cover-upload"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg bg-white/95 hover:bg-white text-slate-900 text-[11px] font-bold shadow-sm backdrop-blur-md cursor-pointer transition-all border border-white/40 hover:shadow-md active:scale-95"
                title="Upload custom banner image"
              >
                <ImageIcon className="w-3 h-3 text-blue-600" />
                <span>{coverUrl ? "Custom" : "Upload"}</span>
              </label>
              <input
                id="profile-cover-upload"
                type="file"
                accept="image/*"
                disabled={updatingCover}
                onChange={handleCoverFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* 2. Cohesive Profile Identity Row (Avatar + Details side-by-side) */}
          <div className="px-4 sm:px-6 md:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 -mt-10 sm:-mt-12 md:-mt-14">
              {/* Left Group: Avatar + Details side-by-side */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3.5 sm:gap-5 min-w-0 flex-1">
                {/* Avatar */}
                <div className="relative shrink-0 z-10">
                  <div className="relative group">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-xl sm:text-2xl md:text-3xl shadow-lg overflow-hidden border-4 border-white dark:border-slate-900 ring-1 ring-slate-200/90 dark:ring-slate-800 bg-white dark:bg-slate-900">
                      {updatingAvatar ? (
                        <div className="flex flex-col items-center justify-center bg-slate-900/90 text-white w-full h-full">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                          <span className="text-[9px] font-bold mt-1 text-slate-300">Saving...</span>
                        </div>
                      ) : avatarUrl ? (
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
                    {!updatingAvatar && (
                      <label
                        htmlFor="profile-avatar-upload"
                        className="absolute inset-0 bg-slate-950/65 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold cursor-pointer backdrop-blur-xs"
                      >
                        <Camera className="w-4 h-4 mb-0.5" />
                        <span>Change</span>
                      </label>
                    )}

                    {/* Camera Icon Trigger Button */}
                    <label
                      htmlFor="profile-avatar-upload"
                      className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white border-2 border-white dark:border-slate-900 shadow cursor-pointer transition-all active:scale-95 z-20"
                      title="Upload avatar photo"
                    >
                      <Camera className="w-3 h-3" />
                    </label>

                    {/* Delete Avatar Button */}
                    {avatarUrl && !updatingAvatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute top-0 right-0 p-1 rounded-full bg-slate-900 hover:bg-rose-600 text-white border-2 border-white dark:border-slate-900 shadow cursor-pointer transition-all active:scale-95 z-20"
                        title="Remove profile picture"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-rose-400 hover:text-white" />
                      </button>
                    )}
                  </div>
                  <input
                    id="profile-avatar-upload"
                    type="file"
                    accept="image/*"
                    disabled={updatingAvatar}
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </div>

                {/* Name, Role, and Handle (Directly beside Avatar) */}
                <div className="min-w-0 flex-1 pb-0.5 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {user ? `${user.firstName} ${user.lastName}` : "Employee Profile"}
                    </h1>
                    <span className="font-semibold text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                      — {user?.employmentInfo?.designation || (isAdmin ? "Enterprise Administrator" : (user?.role || "Software Engineer"))}
                    </span>
                    {isAdmin && (
                      <span className="text-[10.5px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-800">
                        Admin
                      </span>
                    )}
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 inline-block" />
                  </div>

                  <p className="text-[12px] sm:text-[12.5px] font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">
                      @{user?.firstName?.toLowerCase() || "user"}{user?.lastName?.toLowerCase() || ""}
                    </span>
                    {!isAdmin && (
                      <>
                        <span>•</span>
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          ID: {user?.employeeId || "EMP-1042"}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {user?.department || "Engineering"} Department
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons on Right */}
              <div className="flex items-center gap-2 shrink-0 z-10 self-start sm:self-end md:self-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => handleTabChange("personal")}
                  className="px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-[11.5px] font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                  <span>{isAdmin ? "Active System Administrator" : "Active Verified Employee"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("employment")}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11.5px] font-bold transition-all cursor-pointer"
                >
                  View HR Records
                </button>
              </div>
            </div>

            {/* Compact Bio & Contact Strip */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] text-slate-600 dark:text-slate-300">
              <p className="line-clamp-1 max-w-2xl text-slate-500 dark:text-slate-400 text-[12px]">
                EmpSphere Enterprise verified staff member. Overseeing department workflows, team tasks, security compliance, and workspace productivity.
              </p>

              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <span className="font-semibold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  {user?.email}
                </span>
                {user?.phoneNumber && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      {(user.dialCode && user.phoneNumber?.includes(user.dialCode)) ? user.phoneNumber : `${user.dialCode || ""} ${user.phoneNumber || ""}`.trim()}
                    </span>
                  </>
                )}
              </div>
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
                onClick={() => handleTabChange(tab.id as TabId)}
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

        {/* Unsplash Cover Banner Modal */}
        <UnsplashCoverModal
          isOpen={isUnsplashOpen}
          currentCoverUrl={coverUrl}
          onClose={() => setIsUnsplashOpen(false)}
          onSelectCover={handleSelectUnsplashCover}
        />
      </main>
    </div>
  );
};
