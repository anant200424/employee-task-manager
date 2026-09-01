"use client";

import { useState } from "react";
import { IndianRupee, CheckCircle2, AlertCircle, Edit2, X, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, extractApiError } from "@/lib/api";

export const SalaryStructureTab = () => {
  const { user, setUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [basic, setBasic] = useState(user?.salary?.basic?.toString() || "0");
  const [hra, setHra] = useState(user?.salary?.hra?.toString() || "0");
  const [allowances, setAllowances] = useState(user?.salary?.allowances?.toString() || "0");
  const [pf, setPf] = useState(user?.salary?.pf?.toString() || "0");
  
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-calculate CTC
  const totalCTC = parseInt(basic || "0") + parseInt(hra || "0") + parseInt(allowances || "0") + parseInt(pf || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    
    try {
      const res = await api.patch("/users/me", {
        salary: {
          basic: parseInt(basic || "0"),
          hra: parseInt(hra || "0"),
          allowances: parseInt(allowances || "0"),
          pf: parseInt(pf || "0"),
          totalCTC
        }
      });
      setUser(res.data.data.user);
      setMsg({ type: "success", text: "Salary structure updated successfully." });
      setIsEditing(false);
    } catch (err) {
      const { message } = extractApiError(err);
      setMsg({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-slate-200/60 bg-white p-7 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden animate-in fade-in duration-300"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
      
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-[20px] font-black text-slate-900 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-amber-500" /> Salary Structure
          </h3>
          <p className="text-[13.5px] text-slate-500 mt-1 font-medium">
            Compensation details and breakdown.
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
                setBasic(user?.salary?.basic?.toString() || "0");
                setHra(user?.salary?.hra?.toString() || "0");
                setAllowances(user?.salary?.allowances?.toString() || "0");
                setPf(user?.salary?.pf?.toString() || "0");
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
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 flex flex-col items-center justify-center text-center">
            <span className="text-[13px] font-bold text-amber-700 uppercase tracking-wider mb-2">Total CTC (Annual)</span>
            <span className="text-4xl font-black text-amber-900 tracking-tight">
              {formatCurrency(user?.salary?.totalCTC || 0)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-[13.5px] font-bold text-slate-600">Basic Salary</span>
              <span className="text-[15px] font-black text-slate-900">{formatCurrency(user?.salary?.basic || 0)}</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-[13.5px] font-bold text-slate-600">HRA</span>
              <span className="text-[15px] font-black text-slate-900">{formatCurrency(user?.salary?.hra || 0)}</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-[13.5px] font-bold text-slate-600">Special Allowances</span>
              <span className="text-[15px] font-black text-slate-900">{formatCurrency(user?.salary?.allowances || 0)}</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-[13.5px] font-bold text-slate-600">Provident Fund (PF)</span>
              <span className="text-[15px] font-black text-slate-900">{formatCurrency(user?.salary?.pf || 0)}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 flex flex-col items-center justify-center text-center mb-6">
            <span className="text-[13px] font-bold text-amber-700 uppercase tracking-wider mb-2">Calculated CTC (Annual)</span>
            <span className="text-4xl font-black text-amber-900 tracking-tight">
              {formatCurrency(totalCTC)}
            </span>
            <span className="text-[12px] text-amber-600 font-medium mt-2 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Auto-calculated from fields below
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Basic Salary (₹)</label>
              <input type="number" value={basic} onChange={(e) => setBasic(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-bold font-mono text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">HRA (₹)</label>
              <input type="number" value={hra} onChange={(e) => setHra(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-bold font-mono text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Special Allowances (₹)</label>
              <input type="number" value={allowances} onChange={(e) => setAllowances(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-bold font-mono text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Provident Fund (₹)</label>
              <input type="number" value={pf} onChange={(e) => setPf(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-bold font-mono text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all" />
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[14px] font-bold shadow-md shadow-amber-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50">
              {saving ? "Saving..." : "Save Salary Details"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
};
