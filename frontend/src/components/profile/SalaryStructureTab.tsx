"use client";

import { useState } from "react";
import { IndianRupee, CheckCircle2, AlertCircle, Edit2, X, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, extractApiError } from "@/lib/api";
import { validateSalaryField } from "@/lib/validation";

export const SalaryStructureTab = () => {
  const { user, setUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [basic, setBasic] = useState(user?.salary?.basic?.toString() || "0");
  const [hra, setHra] = useState(user?.salary?.hra?.toString() || "0");
  const [allowances, setAllowances] = useState(user?.salary?.allowances?.toString() || "0");
  const [pf, setPf] = useState(user?.salary?.pf?.toString() || "0");
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-calculate CTC
  const numBasic = Math.max(0, parseInt(basic || "0") || 0);
  const numHra = Math.max(0, parseInt(hra || "0") || 0);
  const numAllowances = Math.max(0, parseInt(allowances || "0") || 0);
  const numPf = Math.max(0, parseInt(pf || "0") || 0);
  const totalCTC = numBasic + numHra + numAllowances + numPf;

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "basic":
        return validateSalaryField(value, "Basic Salary");
      case "hra":
        return validateSalaryField(value, "HRA");
      case "allowances":
        return validateSalaryField(value, "Special Allowances");
      case "pf":
        return validateSalaryField(value, "Provident Fund (PF)");
      default:
        return undefined;
    }
  };

  const handleBlur = (name: string) => {
    let val = "";
    if (name === "basic") val = basic;
    else if (name === "hra") val = hra;
    else if (name === "allowances") val = allowances;
    else if (name === "pf") val = pf;

    const err = validateField(name, val);
    setFormErrors((prev) => ({
      ...prev,
      [name]: err || "",
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const bErr = validateField("basic", basic);
    if (bErr) errs.basic = bErr;

    const hErr = validateField("hra", hra);
    if (hErr) errs.hra = hErr;

    const aErr = validateField("allowances", allowances);
    if (aErr) errs.allowances = aErr;

    const pErr = validateField("pf", pf);
    if (pErr) errs.pf = pErr;

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!validate()) {
      setMsg({ type: "error", text: "Please fix the salary validation errors before saving." });
      return;
    }

    setSaving(true);
    
    try {
      const res = await api.patch("/users/me", {
        salary: {
          basic: numBasic,
          hra: numHra,
          allowances: numAllowances,
          pf: numPf,
          totalCTC
        }
      });
      setUser(res.data.data.user);
      setMsg({ type: "success", text: "Salary structure updated successfully." });
      setIsEditing(false);
      setFormErrors({});
    } catch (err) {
      const { message, errors } = extractApiError(err);
      if (errors) setFormErrors((prev) => ({ ...prev, ...errors }));
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
                setFormErrors({});
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
              <input
                type="number"
                min="0"
                value={basic}
                onChange={(e) => {
                  setBasic(e.target.value);
                  if (formErrors.basic) {
                    const liveErr = validateField("basic", e.target.value);
                    setFormErrors((prev) => ({ ...prev, basic: liveErr || "" }));
                  }
                }}
                onBlur={() => handleBlur("basic")}
                className={`w-full rounded-xl border px-4 py-3 text-[14px] font-bold font-mono text-slate-800 outline-none transition-all ${
                  formErrors.basic
                    ? "border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
              />
              {formErrors.basic && (
                <p className="text-[12px] font-bold text-red-600 flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formErrors.basic}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">HRA (₹)</label>
              <input
                type="number"
                min="0"
                value={hra}
                onChange={(e) => {
                  setHra(e.target.value);
                  if (formErrors.hra) {
                    const liveErr = validateField("hra", e.target.value);
                    setFormErrors((prev) => ({ ...prev, hra: liveErr || "" }));
                  }
                }}
                onBlur={() => handleBlur("hra")}
                className={`w-full rounded-xl border px-4 py-3 text-[14px] font-bold font-mono text-slate-800 outline-none transition-all ${
                  formErrors.hra
                    ? "border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
              />
              {formErrors.hra && (
                <p className="text-[12px] font-bold text-red-600 flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formErrors.hra}</span>
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Special Allowances (₹)</label>
              <input
                type="number"
                min="0"
                value={allowances}
                onChange={(e) => {
                  setAllowances(e.target.value);
                  if (formErrors.allowances) {
                    const liveErr = validateField("allowances", e.target.value);
                    setFormErrors((prev) => ({ ...prev, allowances: liveErr || "" }));
                  }
                }}
                onBlur={() => handleBlur("allowances")}
                className={`w-full rounded-xl border px-4 py-3 text-[14px] font-bold font-mono text-slate-800 outline-none transition-all ${
                  formErrors.allowances
                    ? "border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
              />
              {formErrors.allowances && (
                <p className="text-[12px] font-bold text-red-600 flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formErrors.allowances}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Provident Fund (PF) (₹)</label>
              <input
                type="number"
                min="0"
                value={pf}
                onChange={(e) => {
                  setPf(e.target.value);
                  if (formErrors.pf) {
                    const liveErr = validateField("pf", e.target.value);
                    setFormErrors((prev) => ({ ...prev, pf: liveErr || "" }));
                  }
                }}
                onBlur={() => handleBlur("pf")}
                className={`w-full rounded-xl border px-4 py-3 text-[14px] font-bold font-mono text-slate-800 outline-none transition-all ${
                  formErrors.pf
                    ? "border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
              />
              {formErrors.pf && (
                <p className="text-[12px] font-bold text-red-600 flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formErrors.pf}</span>
                </p>
              )}
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

