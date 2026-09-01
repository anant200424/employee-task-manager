"use client";

import { useState } from "react";
import { Bell, CheckCircle2, AlertCircle, Monitor, Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, extractApiError } from "@/lib/api";

export const PreferencesTab = () => {
  const { user, setUser } = useAuth();
  
  const [emailAlerts, setEmailAlerts] = useState(user?.notificationPreferences?.emailAlerts ?? true);
  const [pushNotifications, setPushNotifications] = useState(user?.notificationPreferences?.pushNotifications ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(user?.notificationPreferences?.weeklyDigest ?? true);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(user?.notificationPreferences?.theme || "system");
  
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    
    try {
      const res = await api.patch("/users/me", {
        notificationPreferences: {
          emailAlerts,
          pushNotifications,
          weeklyDigest,
          theme
        }
      });
      setUser(res.data.data.user);
      setMsg({ type: "success", text: "Preferences updated successfully." });
    } catch (err) {
      const { message } = extractApiError(err);
      setMsg({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <form
        onSubmit={handleSavePreferences}
        className="rounded-[24px] border border-slate-200/60 bg-white p-7 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-pink-500" />
        
        <div className="mb-8">
          <h3 className="text-[20px] font-black text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-pink-500" /> Notifications & Display
          </h3>
          <p className="text-[13.5px] text-slate-500 mt-1 font-medium">
            Customize how EmpSphere communicates with you and how it looks.
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
          <div className="pb-4 border-b border-slate-100">
            <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-4">Notification Channels</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="text-[14px] font-bold text-slate-800">Email Alerts</h4>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">Receive immediate emails for critical HR tasks and approvals.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input type="checkbox" className="sr-only peer" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="text-[14px] font-bold text-slate-800">Browser Push Notifications</h4>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">Get notified in your browser while using EmpSphere.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input type="checkbox" className="sr-only peer" checked={pushNotifications} onChange={(e) => setPushNotifications(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="text-[14px] font-bold text-slate-800">Weekly Digest</h4>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">A summary email sent every Monday morning with your pending tasks.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input type="checkbox" className="sr-only peer" checked={weeklyDigest} onChange={(e) => setWeeklyDigest(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-4">Display Theme</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 hover:border-pink-300 bg-white text-slate-600'}`}
              >
                <Sun className="w-6 h-6 mb-2" />
                <span className="text-[13px] font-bold">Light Mode</span>
              </button>
              
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 hover:border-pink-300 bg-slate-900 text-slate-400'}`}
              >
                <Moon className="w-6 h-6 mb-2" />
                <span className="text-[13px] font-bold">Dark Mode</span>
              </button>
              
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 hover:border-pink-300 bg-slate-100 text-slate-600'}`}
              >
                <Monitor className="w-6 h-6 mb-2" />
                <span className="text-[13px] font-bold">System Default</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-[14px] font-bold shadow-md shadow-pink-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50">
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
};
