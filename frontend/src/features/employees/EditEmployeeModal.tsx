"use client";

import { useState, useEffect } from "react";
import {
  X,
  Edit2,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Hash,
  Loader2,
  Save,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

interface UserItem {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  employeeId: string;
  email: string;
  phone: string;
  status: string;
  isBlocked: boolean;
  blockedAt?: string;
  blockedReason?: string;
  avatarUrl?: string;
}

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
  onUserUpdated: () => void;
}

export const EditEmployeeModal = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}: EditEmployeeModalProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setDepartment(user.department || "Engineering");
      setRole(user.role || "Software Engineer");
      setEmployeeId(user.employeeId || "EMP-1042");
      setPhone(user.phone === "No phone" ? "" : user.phone || "");
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("First name is required.");
      return;
    }
    if (!email.trim()) {
      toast.error("Email address is required.");
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/users/${user.id}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        department: department.trim(),
        role: role.trim(),
        employeeId: employeeId.trim().toUpperCase(),
        phoneNumber: phone.trim(),
      });
      toast.success("Employee profile updated successfully!");
      onUserUpdated();
      onClose();
    } catch (err: any) {
      console.error("Failed to update employee:", err);
      toast.error(err.response?.data?.message || "Failed to update employee.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-xl w-full flex flex-col shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#5B5FEF] flex items-center justify-center font-black">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-black text-slate-900 dark:text-white">
                Edit Employee Profile
              </h2>
              <p className="text-[12px] font-medium text-slate-500">
                Update credentials, department, and role assignments
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {/* Avatar Preview & Name Info */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-2">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-sm overflow-hidden shrink-0 shadow-xs">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "EM"
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-[14px] font-black text-slate-900 dark:text-white truncate">
                {firstName} {lastName}
              </h4>
              <p className="text-[12px] font-mono text-[#5B5FEF] font-bold">
                {employeeId}
              </p>
            </div>
          </div>

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#5B5FEF] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Last Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#5B5FEF] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#5B5FEF] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#5B5FEF] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Department & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Department
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#5B5FEF] transition-colors cursor-pointer"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Product">Product</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Role / Job Title
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#5B5FEF] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
              Employee ID Code
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                placeholder="e.g. EMP-1042"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold font-mono text-slate-900 dark:text-white outline-none focus:border-[#5B5FEF] transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[13px] font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4d51db] text-white text-[13px] font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
