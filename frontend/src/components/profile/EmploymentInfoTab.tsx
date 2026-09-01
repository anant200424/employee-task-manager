"use client";

import { useState } from "react";
import { Building2, CheckCircle2, AlertCircle, Edit2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, extractApiError } from "@/lib/api";

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Human Resources",
  "Finance",
  "Operations",
];

export const EmploymentInfoTab = () => {
  const { user, setUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [employeeId, setEmployeeId] = useState(user?.employeeId || "");
  const [department, setDepartment] = useState(user?.department || "Engineering");
  const [role, setRole] = useState(user?.role || "Software Engineer");
  
  const [joiningDate, setJoiningDate] = useState(
    user?.employmentInfo?.joiningDate 
      ? new Date(user.employmentInfo.joiningDate).toISOString().split("T")[0] 
      : ""
  );
  const [workLocation, setWorkLocation] = useState(user?.employmentInfo?.workLocation || "Office");
  const [employmentType, setEmploymentType] = useState(user?.employmentInfo?.employmentType || "Full-Time");
  const [manager, setManager] = useState(user?.employmentInfo?.manager || "");
  
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    
    try {
      const res = await api.patch("/users/me", {
        employeeId,
        department,
        role,
        employmentInfo: {
          joiningDate,
          workLocation,
          employmentType,
          manager
        }
      });
      setUser(res.data.data.user);
      setMsg({ type: "success", text: "Employment information updated successfully." });
      setIsEditing(false);
    } catch (err) {
      const { message } = extractApiError(err);
      setMsg({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-slate-200/60 bg-white p-7 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden animate-in fade-in duration-300"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
      
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-[20px] font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" /> Employment Information
          </h3>
          <p className="text-[13.5px] text-slate-500 mt-1 font-medium">
            Details regarding your position, department, and work setup.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button 
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-white text-slate-700 font-bold text-[13px] hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center gap-2"
            >
               <Edit2 className="w-3.5 h-3.5" /> Edit Details
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEmployeeId(user?.employeeId || "");
                setDepartment(user?.department || "Engineering");
                setRole(user?.role || "Software Engineer");
                setJoiningDate(user?.employmentInfo?.joiningDate ? new Date(user.employmentInfo.joiningDate).toISOString().split("T")[0] : "");
                setWorkLocation(user?.employmentInfo?.workLocation || "Office");
                setEmploymentType(user?.employmentInfo?.employmentType || "Full-Time");
                setManager(user?.employmentInfo?.manager || "");
              }}
              className="px-4 py-2 rounded-xl bg-white text-slate-600 font-bold text-[13px] hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center gap-2"
            >
               <X className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-[13.5px] font-bold mb-6 ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          {msg.text}
        </div>
      )}

      {!isEditing ? (
        /* View Mode */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee ID</span>
              <span className="text-[15px] font-bold text-slate-800 font-mono">{user?.employeeId || "—"}</span>
            </div>
            <div>
              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Joining</span>
              <span className="text-[15px] font-bold text-slate-800">
                {user?.employmentInfo?.joiningDate ? new Date(user.employmentInfo.joiningDate).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
          
          <div className="h-px w-full bg-slate-100 my-4" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</span>
              <span className="text-[15px] font-bold text-slate-800">{user?.department || "—"}</span>
            </div>
            <div>
              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Designation / Role</span>
              <span className="text-[15px] font-bold text-slate-800">{user?.role || "—"}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reporting Manager</span>
              <span className="text-[15px] font-bold text-slate-800">{user?.employmentInfo?.manager || "—"}</span>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100 my-4" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employment Type</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[13px] font-bold">
                {user?.employmentInfo?.employmentType || "Full-Time"}
              </span>
            </div>
            <div>
              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Work Location</span>
              <span className="text-[15px] font-bold text-slate-800">{user?.employmentInfo?.workLocation || "Office"}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Employee ID</label>
              <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-bold font-mono text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Date of Joining</label>
              <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer">
                {DEPARTMENTS.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Designation / Role</label>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Reporting Manager</label>
              <input type="text" value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Manager's Name" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Employment Type</label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer">
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Work Location</label>
              <select value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer">
                <option value="Office">Office</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[14px] font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
};
