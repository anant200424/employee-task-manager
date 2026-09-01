"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, extractApiError } from "@/lib/api";
import {
  User,
  Building2,
  ShieldCheck,
  FolderOpen,
  IndianRupee,
  CheckCircle2,
  Camera,
  Trash2,
} from "lucide-react";

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
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const TABS = [
    { id: "personal", label: "Personal Information", icon: User },
    { id: "employment", label: "Employment Information", icon: Building2 },
    { id: "compliance", label: "Compliance", icon: ShieldCheck },
    { id: "documents", label: "Documents", icon: FolderOpen },
    { id: "salary", label: "Salary Structure", icon: IndianRupee },
  ];

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileMsg({ type: "error", text: "Please select a valid image file" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: "error", text: "Image file size must be less than 5MB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      try {
        const res = await api.patch("/users/me", { avatarUrl: result });
        setUser(res.data.data.user);
      } catch (err) {
        setProfileMsg({ type: "error", text: "Failed to upload avatar" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl("");
    try {
      const res = await api.patch("/users/me", { avatarUrl: "" });
      setUser(res.data.data.user);
    } catch (err) {
      setProfileMsg({ type: "error", text: "Failed to remove avatar" });
    }
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileMsg({ type: "error", text: "Please select a valid image file" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setProfileMsg({ type: "error", text: "Cover image file size must be less than 10MB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setCoverUrl(result);
      try {
        const res = await api.patch("/users/me", { coverUrl: result });
        setUser(res.data.data.user);
      } catch (err) {
        setProfileMsg({ type: "error", text: "Failed to upload cover image" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = async () => {
    setCoverUrl("");
    try {
      const res = await api.patch("/users/me", { coverUrl: "" });
      setUser(res.data.data.user);
    } catch (err) {
      setProfileMsg({ type: "error", text: "Failed to remove cover" });
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "EM";

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-16">
      {/* Hero Banner Section */}
      <div className="h-48 w-full bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white relative flex-shrink-0 border-b border-slate-200/60 overflow-hidden group">
        {coverUrl ? (
          <img src={coverUrl} alt="Profile Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        )}
        
        {/* Cover Image Upload/Delete Controls (Hover) */}
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {coverUrl && (
            <button
              type="button"
              onClick={handleRemoveCover}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/90 hover:bg-rose-600 text-white text-[12px] font-bold shadow-sm backdrop-blur-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Cover
            </button>
          )}
          <label
            htmlFor="profile-cover-upload"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-900 text-white text-[12px] font-bold shadow-sm backdrop-blur-sm cursor-pointer transition-colors"
          >
            <Camera className="w-3.5 h-3.5" /> Update Cover
          </label>
          <input id="profile-cover-upload" type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-5 sm:px-7 -mt-16 relative z-10 animate-in fade-in duration-500">
        
        {/* Floating Profile Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[24px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/80 flex flex-col md:flex-row items-start gap-6 sm:gap-8 relative mb-8">
          
          {/* Avatar Section */}
          <div className="relative -mt-12 sm:-mt-16 shrink-0 z-20">
            <div className="relative group">
              <label
                htmlFor="profile-avatar-upload"
                className="relative flex h-32 w-32 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-slate-100 text-4xl font-bold text-slate-400 shadow-sm overflow-hidden border-4 border-white cursor-pointer hover:scale-[1.02] transition-transform"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user ? `${user.firstName} ${user.lastName}` : "Avatar"} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center text-5xl tracking-tight text-[#4355CC]">{initials}</span>
                )}
                <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-semibold backdrop-blur-[2px]">
                  <Camera className="w-6 h-6 mb-1.5" />
                  <span>Update</span>
                </div>
                <input id="profile-avatar-upload" type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
              </label>
              
              <label htmlFor="profile-avatar-upload" className="absolute -bottom-1 -right-1 p-2.5 rounded-full bg-[#4355CC] text-white border-4 border-white cursor-pointer hover:bg-[#3446b3] transition-colors shadow-md z-10" title="Edit profile picture">
                <Camera className="w-4 h-4" />
              </label>
              
              {avatarUrl && (
                <button type="button" onClick={handleRemoveAvatar} className="absolute -top-1 -right-1 p-2.5 rounded-full bg-rose-500 text-white border-4 border-white cursor-pointer hover:bg-rose-600 transition-colors shadow-md z-10" title="Remove profile picture">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Details & Actions */}
          <div className="flex-1 w-full mt-2 sm:mt-0 z-10">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {user ? `${user.firstName} ${user.lastName}` : "Employee Profile"}
                  <CheckCircle2 className="w-6 h-6 text-[#4355CC]" />
                </h1>
                <p className="text-[14px] text-slate-500 font-medium mt-1.5 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#4355CC] text-[11px] font-bold uppercase tracking-wider">{user?.role || "Software Engineer"}</span>
                  <span className="text-slate-400 font-bold">{user?.employeeId || "EMP-1042"}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-4 mb-4 scrollbar-hide border-b border-slate-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-[14px] transition-colors whitespace-nowrap ${
                  isActive 
                    ? "bg-white text-[#4355CC] border-t-2 border-l border-r border-[#4355CC]/10 shadow-[0_-4px_10px_rgb(0,0,0,0.02)]" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#4355CC]" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
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
