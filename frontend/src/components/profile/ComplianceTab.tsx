"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertCircle, Edit2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, extractApiError } from "@/lib/api";
import {
  validatePanNumber,
  validateAadharNumber,
  validateUanNumber,
} from "@/lib/validation";

export const ComplianceTab = () => {
  const { user, setUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [panNumber, setPanNumber] = useState(user?.compliance?.panNumber || "");
  const [aadharNumber, setAadharNumber] = useState(user?.compliance?.aadharNumber || "");
  const [uanNumber, setUanNumber] = useState(user?.compliance?.uanNumber || "");
  const [taxRegime, setTaxRegime] = useState<"old" | "new">(user?.compliance?.taxRegime || "new");
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "panNumber":
        return validatePanNumber(value);
      case "aadharNumber":
        return validateAadharNumber(value);
      case "uanNumber":
        return validateUanNumber(value);
      default:
        return undefined;
    }
  };

  const handleBlur = (name: string) => {
    let val = "";
    if (name === "panNumber") val = panNumber;
    else if (name === "aadharNumber") val = aadharNumber;
    else if (name === "uanNumber") val = uanNumber;

    const err = validateField(name, val);
    setFormErrors((prev) => ({
      ...prev,
      [name]: err || "",
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const panErr = validateField("panNumber", panNumber);
    if (panErr) errs.panNumber = panErr;

    const aadharErr = validateField("aadharNumber", aadharNumber);
    if (aadharErr) errs.aadharNumber = aadharErr;

    const uanErr = validateField("uanNumber", uanNumber);
    if (uanErr) errs.uanNumber = uanErr;

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!validate()) {
      setMsg({ type: "error", text: "Please fix the validation errors before saving." });
      return;
    }

    setSaving(true);
    
    try {
      const res = await api.patch("/users/me", {
        compliance: {
          panNumber: panNumber.trim().toUpperCase(),
          aadharNumber: aadharNumber.trim().replace(/\s+/g, ""),
          uanNumber: uanNumber.trim().replace(/\s+/g, ""),
          taxRegime
        }
      });
      setUser(res.data.data.user);
      setMsg({ type: "success", text: "Compliance information updated successfully." });
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

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-slate-200/60 bg-white p-7 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden animate-in fade-in duration-300"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
      
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-[20px] font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Compliance Details
          </h3>
          <p className="text-[13.5px] text-slate-500 mt-1 font-medium">
            Identity numbers and taxation preferences.
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
                setPanNumber(user?.compliance?.panNumber || "");
                setAadharNumber(user?.compliance?.aadharNumber || "");
                setUanNumber(user?.compliance?.uanNumber || "");
                setTaxRegime(user?.compliance?.taxRegime || "new");
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">PAN Number</span>
              <span className="text-[15px] font-bold text-slate-800 font-mono uppercase tracking-widest">{user?.compliance?.panNumber || "—"}</span>
            </div>
            <div>
              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aadhar Number</span>
              <span className="text-[15px] font-bold text-slate-800 font-mono tracking-widest">{user?.compliance?.aadharNumber || "—"}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">UAN (PF) Number</span>
              <span className="text-[15px] font-bold text-slate-800 font-mono tracking-widest">{user?.compliance?.uanNumber || "—"}</span>
            </div>
            <div>
              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Regime Preference</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[13px] font-bold capitalize">
                {user?.compliance?.taxRegime || "New"} Regime
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">PAN Number</label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setPanNumber(val);
                  if (formErrors.panNumber) {
                    const liveErr = validateField("panNumber", val);
                    setFormErrors((prev) => ({ ...prev, panNumber: liveErr || "" }));
                  }
                }}
                onBlur={() => handleBlur("panNumber")}
                placeholder="ABCDE1234F"
                className={`w-full rounded-xl border px-4 py-3 text-[14px] font-bold font-mono uppercase text-slate-800 outline-none transition-all ${
                  formErrors.panNumber
                    ? "border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                }`}
              />
              {formErrors.panNumber && (
                <p className="text-[12px] font-bold text-red-600 flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formErrors.panNumber}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Aadhaar Number</label>
              <input
                type="text"
                value={aadharNumber}
                onChange={(e) => {
                  setAadharNumber(e.target.value);
                  if (formErrors.aadharNumber) {
                    const liveErr = validateField("aadharNumber", e.target.value);
                    setFormErrors((prev) => ({ ...prev, aadharNumber: liveErr || "" }));
                  }
                }}
                onBlur={() => handleBlur("aadharNumber")}
                placeholder="12-digit Aadhaar"
                className={`w-full rounded-xl border px-4 py-3 text-[14px] font-bold font-mono text-slate-800 outline-none transition-all ${
                  formErrors.aadharNumber
                    ? "border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                }`}
              />
              {formErrors.aadharNumber && (
                <p className="text-[12px] font-bold text-red-600 flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formErrors.aadharNumber}</span>
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">UAN Number</label>
              <input
                type="text"
                value={uanNumber}
                onChange={(e) => {
                  setUanNumber(e.target.value);
                  if (formErrors.uanNumber) {
                    const liveErr = validateField("uanNumber", e.target.value);
                    setFormErrors((prev) => ({ ...prev, uanNumber: liveErr || "" }));
                  }
                }}
                onBlur={() => handleBlur("uanNumber")}
                placeholder="12-digit UAN"
                className={`w-full rounded-xl border px-4 py-3 text-[14px] font-bold font-mono text-slate-800 outline-none transition-all ${
                  formErrors.uanNumber
                    ? "border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                }`}
              />
              {formErrors.uanNumber && (
                <p className="text-[12px] font-bold text-red-600 flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formErrors.uanNumber}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Tax Regime</label>
              <select value={taxRegime} onChange={(e) => setTaxRegime(e.target.value as "old" | "new")} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer">
                <option value="new">New Tax Regime</option>
                <option value="old">Old Tax Regime</option>
              </select>
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[14px] font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50">
              {saving ? "Saving..." : "Save Compliance Details"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

