"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { PhoneField } from "@/components/auth/PhoneField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/context/AuthContext";
import { validateName, validatePhoneNumber, validatePassword } from "@/lib/validation";
import { api, extractApiError } from "@/lib/api";
import { useRouter } from "next/navigation";
import { User, Shield, Lock, Building, Briefcase, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "Human Resources",
];

export const ProfileContent = () => {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [department, setDepartment] = useState(user?.department || "Engineering");
  const [role, setRole] = useState(user?.role || "Software Engineer");
  const [employeeId, setEmployeeId] = useState(user?.employeeId || "EMP-1042");
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth ? user.dateOfBirth.split("T")[0] : "1998-05-15"
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
        department,
        role,
        employeeId,
        dateOfBirth,
      });
      setUser(res.data.data.user);
      setProfileMsg({ type: "success", text: "EmpSphere employee profile updated successfully." });
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
    if (newPassword !== confirmNewPassword) errs.confirmNewPassword = "Passwords do not match";
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingPw(true);
    try {
      await api.patch("/auth/change-password", { currentPassword, newPassword, confirmNewPassword });
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

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "EM";

  return (
    <>
      <Topbar title="Employee Profile" subtitle="Manage your personal information, department role, and security." />

      <main className="grid grid-cols-1 gap-7 p-5 sm:p-7 lg:grid-cols-12 lg:p-8 max-w-[1400px]">
        {/* Left ID Badge Card (4 Cols) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 text-center lg:col-span-4 h-fit shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1E293B] text-2xl font-bold text-white shadow-md">
            {initials}
          </div>
          <h3 className="mt-4 text-[18px] font-bold text-slate-900">
            {user ? `${user.firstName} ${user.lastName}` : "Employee Profile"}
          </h3>
          <p className="text-[13px] text-slate-500">{user?.email}</p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-[#4355CC]">
              {user?.department || "Engineering"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700">
              {user?.role || "Software Engineer"}
            </span>
          </div>

          <div className="mt-6 w-full border-t border-slate-100 pt-5 text-left text-[13px] space-y-3">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Employee ID</span>
              <span className="font-mono font-bold text-[#4355CC]">{user?.employeeId || "EMP-1042"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Mobile</span>
              <span className="font-medium text-slate-800">
                {user?.dialCode || "+91"} {user?.phoneNumber || "9876543210"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Date of Birth</span>
              <span className="font-medium text-slate-800">
                {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "—"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Member since</span>
              <span className="font-medium text-slate-800">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "2026"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Forms (8 Cols) */}
        <div className="space-y-7 lg:col-span-8">
          
          {/* Form 1: Employee Details */}
          <form onSubmit={handleProfileSubmit} className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] space-y-5">
            <div>
              <h3 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-[#4355CC]" /> Employee Information
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Update your contact details and department assignment.
              </p>
            </div>

            {profileMsg && (
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2 text-[13px] font-medium ${
                  profileMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {profileMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                {profileMsg.text}
              </div>
            )}

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13.5px] text-slate-800 focus:border-[#4355CC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13.5px] text-slate-800 focus:border-[#4355CC] focus:outline-none"
                />
              </div>
            </div>

            {/* Email & Employee ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Work Email (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13.5px] text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13.5px] font-mono text-slate-800 focus:border-[#4355CC] focus:outline-none"
                />
              </div>
            </div>

            {/* Department & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13.5px] text-slate-800 focus:border-[#4355CC] focus:outline-none"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13.5px] text-slate-800 focus:border-[#4355CC] focus:outline-none"
                />
              </div>
            </div>

            {/* Date of Birth & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13.5px] text-slate-800 focus:border-[#4355CC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Phone Number
                </label>
                <PhoneField
                  countryIso={countryCode}
                  phoneNumber={phoneNumber}
                  onCountryChange={setCountryCode}
                  onPhoneChange={setPhoneNumber}
                  error={profileErrors.phoneNumber}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-xl bg-[#4355CC] hover:bg-[#3644A8] text-white text-[13.5px] font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? "Saving changes..." : "Save Profile Changes"}
              </button>
            </div>
          </form>

          {/* Form 2: Password Security */}
          <form onSubmit={handlePasswordSubmit} className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] space-y-5">
            <div>
              <h3 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#4355CC]" /> Change Password
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Ensure your EmpSphere account is protected by a strong password.
              </p>
            </div>

            {pwMsg && (
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2 text-[13px] font-medium ${
                  pwMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {pwMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                {pwMsg.text}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13.5px] text-slate-800 focus:border-[#4355CC] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13.5px] text-slate-800 focus:border-[#4355CC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13.5px] text-slate-800 focus:border-[#4355CC] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPw}
                className="px-6 py-2.5 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white text-[13.5px] font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {savingPw ? "Updating password..." : "Update Password"}
              </button>
            </div>
          </form>

        </div>
      </main>
    </>
  );
};
