"use client";

import { useState } from "react";
import { User, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, extractApiError } from "@/lib/api";
import { validateName, validatePassword, validatePhoneNumber } from "@/lib/validation";
import { PhoneField } from "@/components/auth/PhoneField";
import { useRouter } from "next/navigation";

export const PersonalInfoTab = () => {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : ""
  );
  const [countryCode, setCountryCode] = useState(user?.countryCode || "IN");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    const errs: Record<string, string> = {};
    const fnErr = validateName(firstName, "First name");
    if (fnErr) errs.firstName = fnErr;
    const lnErr = validateName(lastName, "Last name");
    if (lnErr) errs.lastName = lnErr;
    const phErr = validatePhoneNumber(phoneNumber, countryCode);
    if (phErr) errs.phoneNumber = phErr;
    setProfileErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingProfile(true);
    try {
      const res = await api.patch("/users/me", {
        firstName,
        lastName,
        countryCode,
        phoneNumber,
        dateOfBirth,
      });
      setUser(res.data.data.user);
      setProfileMsg({ type: "success", text: "Personal information updated successfully." });
      setIsEditing(false);
    } catch (err) {
      const { message, errors } = extractApiError(err);
      if (errors) setProfileErrors((p) => ({ ...p, ...errors }));
      setProfileMsg({ type: "error", text: message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = "Current password is required";
    const npErr = validatePassword(newPassword);
    if (npErr) errs.newPassword = npErr;
    if (newPassword !== confirmNewPassword)
      errs.confirmNewPassword = "Passwords do not match";
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingPw(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      setPwMsg({ type: "success", text: "Password changed successfully. Please log in again." });
      setTimeout(async () => {
        await logout();
        router.push("/login");
      }, 1500);
    } catch (err) {
      const { message, errors } = extractApiError(err);
      if (errors) setPwErrors((p) => ({ ...p, ...errors }));
      setPwMsg({ type: "error", text: message });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Form 1: Personal Details */}
      <form
        onSubmit={handleProfileSubmit}
        className="rounded-[24px] border border-slate-200/60 bg-white p-7 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-[#4355CC]" />
        
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-[20px] font-black text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-[#4355CC]" /> Personal Information
            </h3>
            <p className="text-[13.5px] text-slate-500 mt-1 font-medium">
              Update your contact details and basic information.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button 
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl bg-white text-slate-700 font-bold text-[13px] hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center gap-2"
              >
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                 Edit Details
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFirstName(user?.firstName || "");
                  setLastName(user?.lastName || "");
                  setPhoneNumber(user?.phoneNumber || "");
                  setDateOfBirth(user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "");
                }}
                className="px-4 py-2 rounded-xl bg-white text-slate-600 font-bold text-[13px] hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
              >
                 Cancel
              </button>
            )}
          </div>
        </div>

        {profileMsg && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-[13.5px] font-bold mb-6 ${
              profileMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {profileMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            {profileMsg.text}
          </div>
        )}

        {!isEditing ? (
          /* View Mode */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">First Name</span>
                <span className="text-[15px] font-bold text-slate-800">{user?.firstName}</span>
              </div>
              <div>
                <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Name</span>
                <span className="text-[15px] font-bold text-slate-800">{user?.lastName}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Work Email</span>
                <span className="text-[15px] font-bold text-slate-800">{user?.email}</span>
              </div>
              <div>
                <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</span>
                <span className="text-[15px] font-bold text-slate-800">
                  {user?.phoneNumber ? `${user.dialCode || "+91"} ${user.phoneNumber}` : "—"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Birth</span>
                <span className="text-[15px] font-bold text-slate-800">
                  {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">First Name <span className="text-rose-500">*</span></label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Last Name <span className="text-rose-500">*</span></label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/20 outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Work Email <span className="text-slate-400 font-normal">(Read-only)</span></label>
                <input type="email" disabled value={user?.email || ""} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-[14px] font-medium text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <PhoneField countryIso={countryCode} phoneNumber={phoneNumber} onCountryChange={setCountryCode} onPhoneChange={setPhoneNumber} error={profileErrors.phoneNumber} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="sm:w-1/2 sm:pr-2.5">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Date of Birth</label>
                <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/20 outline-none transition-all" />
              </div>
            </div>

            <div className="pt-6">
              <button type="submit" disabled={savingProfile} className="px-8 py-3 rounded-xl bg-[#4355CC] hover:bg-[#3644A8] text-white text-[14px] font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50">
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Form 2: Password Security (Always inputs) */}
      <form
        onSubmit={handlePasswordSubmit}
        className="rounded-[24px] border border-slate-200/60 bg-white p-7 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden h-fit"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800" />
        <div className="mb-6">
          <h3 className="text-[20px] font-black text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-800" /> Security Settings
          </h3>
          <p className="text-[13.5px] text-slate-500 mt-1 font-medium">
            Ensure your EmpSphere account is protected by a strong password.
          </p>
        </div>

        {pwMsg && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-[13.5px] font-bold mb-6 ${
              pwMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {pwMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            {pwMsg.text}
          </div>
        )}

        <div className="space-y-5">
          <div className="max-w-md">
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 outline-none transition-all"
            />
            {pwErrors.currentPassword && (
              <p className="mt-2 text-[13px] font-bold text-rose-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                {pwErrors.currentPassword}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                New Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 outline-none transition-all"
              />
              {pwErrors.newPassword && (
                <p className="mt-2 text-[13px] font-bold text-rose-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {pwErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 outline-none transition-all"
              />
              {pwErrors.confirmNewPassword && (
                <p className="mt-2 text-[13px] font-bold text-rose-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {pwErrors.confirmNewPassword}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8">
          <button
            type="submit"
            disabled={savingPw}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#1E293B] hover:bg-black text-white text-[14px] font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {savingPw ? "Updating password..." : "Update Security Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};
