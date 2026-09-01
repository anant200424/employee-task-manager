"use client";

import { useState } from "react";
import { ShieldAlert, CheckCircle2, AlertCircle, FileText, Download, Trash2, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, extractApiError } from "@/lib/api";

export const PrivacyTab = () => {
  const { user, setUser } = useAuth();
  
  const [dataSharingConsent, setDataSharingConsent] = useState(user?.privacySettings?.dataSharingConsent ?? false);
  const [marketingEmails, setMarketingEmails] = useState(user?.privacySettings?.marketingEmails ?? false);
  
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    
    try {
      const res = await api.patch("/users/me", {
        privacySettings: {
          dataSharingConsent,
          marketingEmails,
        }
      });
      setUser(res.data.data.user);
      setMsg({ type: "success", text: "Privacy settings updated successfully." });
    } catch (err) {
      const { message } = extractApiError(err);
      setMsg({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleDataExport = () => {
    setExporting(true);
    // Mock export process
    setTimeout(() => {
      setExporting(false);
      setMsg({ type: "success", text: "Your data archive is being generated. You will receive an email shortly." });
    }, 1500);
  };

  const handleDeleteAccount = () => {
    const confirm = window.confirm("Are you absolutely sure you want to request account deletion? This action cannot be undone and will be sent to your HR administrator for approval.");
    if (confirm) {
      setMsg({ type: "success", text: "Account deletion request has been submitted to HR." });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <form
        onSubmit={handleSavePreferences}
        className="rounded-[24px] border border-slate-200/60 bg-white p-7 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-violet-500" />
        
        <div className="mb-8">
          <h3 className="text-[20px] font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-500" /> Digital Personal Data Protection
          </h3>
          <p className="text-[13.5px] text-slate-500 mt-1 font-medium">
            Manage how your personal data is processed and used across the EmpSphere platform.
          </p>
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

        <div className="space-y-6">
          <div className="flex items-start justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <h4 className="text-[14px] font-bold text-slate-800">Data Processing Consent</h4>
              <p className="text-[12.5px] text-slate-500 mt-1 max-w-xl">
                Allow EmpSphere to process your usage data to improve analytics, platform stability, and performance. This data is anonymized.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={dataSharingConsent}
                onChange={(e) => setDataSharingConsent(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
            </label>
          </div>

          <div className="flex items-start justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <h4 className="text-[14px] font-bold text-slate-800">Marketing & Promotional Emails</h4>
              <p className="text-[12.5px] text-slate-500 mt-1 max-w-xl">
                Receive emails about new features, EmpSphere updates, and company-wide promotional materials.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={marketingEmails}
                onChange={(e) => setMarketingEmails(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
            </label>
          </div>
        </div>

        <div className="pt-8">
          <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-[14px] font-bold shadow-md shadow-violet-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50">
            {saving ? "Saving..." : "Save Privacy Preferences"}
          </button>
        </div>
      </form>

      {/* Data Export & Deletion */}
      <div className="rounded-[24px] border border-rose-200/60 bg-white p-7 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="mb-6">
          <h3 className="text-[18px] font-black text-rose-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" /> Danger Zone & Data Export
          </h3>
          <p className="text-[13.5px] text-rose-500/80 mt-1 font-medium">
            Advanced data actions that affect your entire account history.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/30 flex flex-col items-start">
            <div className="p-2.5 rounded-xl bg-white border border-rose-100 shadow-sm mb-4">
              <FileText className="w-5 h-5 text-rose-600" />
            </div>
            <h4 className="text-[14.5px] font-bold text-slate-900">Export Personal Data</h4>
            <p className="text-[12.5px] text-slate-500 mt-1 mb-5">
              Download a complete archive of your personal HR data, documents, and compliance records.
            </p>
            <button 
              onClick={handleDataExport}
              disabled={exporting}
              className="mt-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 font-bold text-[13px] hover:bg-rose-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> {exporting ? "Generating..." : "Request Data Export"}
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/30 flex flex-col items-start">
            <div className="p-2.5 rounded-xl bg-white border border-rose-100 shadow-sm mb-4">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <h4 className="text-[14.5px] font-bold text-slate-900">Account Deletion</h4>
            <p className="text-[12.5px] text-slate-500 mt-1 mb-5">
              Request permanent deletion of your account. HR approval is required to process this request.
            </p>
            <button 
              onClick={handleDeleteAccount}
              className="mt-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 border border-rose-600 text-white font-bold text-[13px] hover:bg-rose-700 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Request Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
