"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/context/AuthContext";
import { api, extractApiError } from "@/lib/api";
import {
  Settings,
  Shield,
  Sliders,
  Bell,
  Eye,
  Globe,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Monitor,
  Moon,
  Sun,
  ShieldAlert,
  Download,
  Trash2,
  Clock,
  Calendar,
  Layout,
  Smartphone,
  Laptop,
  Activity,
  UserPlus,
  Palette,
  Key
} from "lucide-react";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"preferences" | "appearance" | "privacy" | "security" | "system">("preferences");
  
  // ----------------------------------------------------
  // PREFERENCES STATES
  // ----------------------------------------------------
  const [emailAlerts, setEmailAlerts] = useState(user?.notificationPreferences?.emailAlerts ?? true);
  const [pushNotifications, setPushNotifications] = useState(user?.notificationPreferences?.pushNotifications ?? false);
  const [weeklyDigest, setWeeklyDigest] = useState(user?.notificationPreferences?.weeklyDigest ?? true);
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("UTC-05:00 Eastern Time (US & Canada)");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [firstDayOfWeek, setFirstDayOfWeek] = useState("Sunday");

  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsStatus, setPrefsStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  const handleSavePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPrefs(true);
    setPrefsStatus({ type: null, message: "" });
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
      setPrefsStatus({ type: "success", message: "Preferences updated successfully." });
      setTimeout(() => setPrefsStatus({ type: null, message: "" }), 3000);
    } catch (err) {
      const { message } = extractApiError(err);
      setPrefsStatus({ type: "error", message });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // ----------------------------------------------------
  // APPEARANCE STATES
  // ----------------------------------------------------
  const [theme, setTheme] = useState<"light" | "dark" | "system">(user?.notificationPreferences?.theme || "system");
  const [density, setDensity] = useState("Comfortable");
  const [accentColor, setAccentColor] = useState("Blue");
  const [sidebarBehavior, setSidebarBehavior] = useState("Expanded");

  // ----------------------------------------------------
  // PRIVACY & DPDP STATES
  // ----------------------------------------------------
  const [dataSharingConsent, setDataSharingConsent] = useState(user?.privacySettings?.dataSharingConsent ?? false);
  const [marketingEmails, setMarketingEmails] = useState(user?.privacySettings?.marketingEmails ?? false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [privacyStatus, setPrivacyStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [exporting, setExporting] = useState(false);

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrivacy(true);
    setPrivacyStatus({ type: null, message: "" });
    try {
      const res = await api.patch("/users/me", {
        privacySettings: { dataSharingConsent, marketingEmails }
      });
      setUser(res.data.data.user);
      setPrivacyStatus({ type: "success", message: "Privacy settings updated successfully." });
      setTimeout(() => setPrivacyStatus({ type: null, message: "" }), 3000);
    } catch (err) {
      const { message } = extractApiError(err);
      setPrivacyStatus({ type: "error", message });
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleDataExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setPrivacyStatus({ type: "success", message: "Your data archive is being generated. You will receive an email shortly." });
    }, 1500);
  };

  const handleDeleteAccount = () => {
    const confirm = window.confirm("Are you absolutely sure you want to request account deletion? This action cannot be undone and will be sent to your HR administrator for approval.");
    if (confirm) {
      setPrivacyStatus({ type: "success", message: "Account deletion request has been submitted to HR." });
    }
  };

  // ----------------------------------------------------
  // SECURITY STATES
  // ----------------------------------------------------
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ type: "error", message: "All password fields are required." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "New passwords do not match." });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordStatus({ type: null, message: "" });
      await api.patch("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      setPasswordStatus({ type: "success", message: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const { message } = extractApiError(err);
      setPasswordStatus({ type: "error", message });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ----------------------------------------------------
  // SYSTEM SETTINGS (ADMIN) STATES
  // ----------------------------------------------------
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publicRegistration, setPublicRegistration] = useState(false);
  const [force2FA, setForce2FA] = useState(false);
  const [maxUploadSize, setMaxUploadSize] = useState("10MB");
  const [sessionTimeout, setSessionTimeout] = useState("30 mins");
  
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [systemSuccess, setSystemSuccess] = useState(false);

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSystem(true);
      setSystemSuccess(false);
      await new Promise(resolve => setTimeout(resolve, 600));
      setSystemSuccess(true);
      setTimeout(() => setSystemSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSystem(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <Topbar
        title="System Settings"
        subtitle="Manage your account preferences, security options, and platform configurations."
      />

      <main className="px-5 sm:px-7 lg:px-8 max-w-[1600px] mx-auto mt-6 animate-in fade-in duration-500 h-[calc(100vh-140px)]">
        
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          
          {/* ----------------------------------------------------
              SIDEBAR
              ---------------------------------------------------- */}
          <div className="w-full lg:w-[280px] shrink-0 bg-white rounded-[24px] p-5 shadow-sm space-y-1.5 h-fit border border-slate-100">
            <button
              onClick={() => setActiveTab("preferences")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all ${activeTab === 'preferences' ? 'bg-[#EEF0FF] text-[#5B5FEF]' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Sliders className="w-5 h-5 shrink-0" />
              Preferences
            </button>
            <button
              onClick={() => setActiveTab("appearance")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all ${activeTab === 'appearance' ? 'bg-[#EEF0FF] text-[#5B5FEF]' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Palette className="w-5 h-5 shrink-0" />
              Appearance & Theme
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all ${activeTab === 'privacy' ? 'bg-[#EEF0FF] text-[#5B5FEF]' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              Privacy & Data (DPDP)
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all ${activeTab === 'security' ? 'bg-[#EEF0FF] text-[#5B5FEF]' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Key className="w-5 h-5 shrink-0" />
              Security & Credentials
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("system")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all ${activeTab === 'system' ? 'bg-[#EEF0FF] text-[#5B5FEF]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Settings className="w-5 h-5 shrink-0" />
                Platform Settings
              </button>
            )}
          </div>

          {/* ----------------------------------------------------
              TAB CONTENT DISPLAY AREA
              ---------------------------------------------------- */}
          <div className="flex-1 bg-white rounded-[24px] p-6 lg:p-10 shadow-sm h-full overflow-y-auto custom-scrollbar border border-slate-100 relative">
             
             {/* Tab 1: Preferences */}
             {activeTab === "preferences" && (
               <form onSubmit={handleSavePreferences} className="space-y-8 pb-12 animate-in fade-in duration-300">
                 <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4 border-b border-slate-100">
                   <div>
                     <h3 className="text-[20px] font-black text-slate-900">Account Preferences</h3>
                     <p className="text-[13.5px] font-medium text-slate-500 mt-1">Configure your personal notifications, localization, and date formats.</p>
                   </div>
                   <button type="submit" disabled={isSavingPrefs} className="px-5 py-2.5 rounded-xl bg-[#5B5FEF] text-white text-[13px] font-bold disabled:opacity-50 shadow-md shadow-[#5B5FEF]/20 hover:bg-[#4F46E5] transition-colors">
                     {isSavingPrefs ? "Saving..." : "Save Changes"}
                   </button>
                 </div>

                 {prefsStatus.type && (
                   <div className={`flex items-start gap-3 p-4 rounded-2xl border ${prefsStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                     {prefsStatus.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />}
                     <span className="text-[13px] font-semibold">{prefsStatus.message}</span>
                   </div>
                 )}

                 {/* Notifications Section */}
                 <div>
                   <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-6">Notifications</h4>
                   <div className="space-y-6">
                     <div className="flex items-center justify-between">
                       <div className="flex items-start gap-4">
                         <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"><Bell className="w-5 h-5 text-slate-600" /></div>
                         <div>
                           <label className="text-[14.5px] font-bold text-slate-900 block">Email Alerts</label>
                           <span className="text-[13px] font-medium text-slate-500">Receive summaries, assignments, and onboarding alerts via email.</span>
                         </div>
                       </div>
                       <button type="button" onClick={() => setEmailAlerts(!emailAlerts)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${emailAlerts ? 'bg-[#5B5FEF]' : 'bg-slate-200'}`}>
                         <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${emailAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                     </div>

                     <div className="flex items-center justify-between">
                       <div className="flex items-start gap-4">
                         <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"><Monitor className="w-5 h-5 text-slate-600" /></div>
                         <div>
                           <label className="text-[14.5px] font-bold text-slate-900 block">Desktop Notification Push</label>
                           <span className="text-[13px] font-medium text-slate-500">Enable real-time notification toasts in your web browser.</span>
                         </div>
                       </div>
                       <button type="button" onClick={() => setPushNotifications(!pushNotifications)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${pushNotifications ? 'bg-[#5B5FEF]' : 'bg-slate-200'}`}>
                         <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${pushNotifications ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                     </div>

                     <div className="flex items-center justify-between">
                       <div className="flex items-start gap-4">
                         <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"><Activity className="w-5 h-5 text-slate-600" /></div>
                         <div>
                           <label className="text-[14.5px] font-bold text-slate-900 block">Weekly Digest Emails</label>
                           <span className="text-[13px] font-medium text-slate-500">A summary email sent every Monday morning with your pending tasks.</span>
                         </div>
                       </div>
                       <button type="button" onClick={() => setWeeklyDigest(!weeklyDigest)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${weeklyDigest ? 'bg-[#5B5FEF]' : 'bg-slate-200'}`}>
                         <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${weeklyDigest ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                     </div>
                   </div>
                 </div>

                 {/* Localization Section */}
                 <div className="pt-6 border-t border-slate-100">
                   <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-6">Regional & Localization</h4>
                   <div className="space-y-6">
                     
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div className="flex items-start gap-4">
                         <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"><Globe className="w-5 h-5 text-slate-600" /></div>
                         <div>
                           <label className="text-[14.5px] font-bold text-slate-900 block">Language Preference</label>
                           <span className="text-[13px] font-medium text-slate-500">Set the default language for the employee workspace environment.</span>
                         </div>
                       </div>
                       <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-bold text-slate-700 focus:outline-none cursor-pointer">
                         <option value="English">English</option>
                         <option value="Hindi">Hindi (हिंदी)</option>
                         <option value="Spanish">Spanish (Español)</option>
                         <option value="French">French (Français)</option>
                       </select>
                     </div>

                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div className="flex items-start gap-4">
                         <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"><Clock className="w-5 h-5 text-slate-600" /></div>
                         <div>
                           <label className="text-[14.5px] font-bold text-slate-900 block">Timezone</label>
                           <span className="text-[13px] font-medium text-slate-500">Used for calendar invites and task due dates.</span>
                         </div>
                       </div>
                       <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-bold text-slate-700 focus:outline-none cursor-pointer">
                         <option value="UTC-08:00 Pacific Time">UTC-08:00 Pacific Time</option>
                         <option value="UTC-05:00 Eastern Time (US & Canada)">UTC-05:00 Eastern Time (US)</option>
                         <option value="UTC+00:00 Greenwich Mean Time">UTC+00:00 GMT</option>
                         <option value="UTC+05:30 Indian Standard Time">UTC+05:30 IST</option>
                       </select>
                     </div>

                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div className="flex items-start gap-4">
                         <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"><Calendar className="w-5 h-5 text-slate-600" /></div>
                         <div>
                           <label className="text-[14.5px] font-bold text-slate-900 block">Date Format</label>
                           <span className="text-[13px] font-medium text-slate-500">How dates should be displayed across the dashboard.</span>
                         </div>
                       </div>
                       <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-bold text-slate-700 focus:outline-none cursor-pointer">
                         <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                         <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                         <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                       </select>
                     </div>

                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div className="flex items-start gap-4">
                         <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"><Layout className="w-5 h-5 text-slate-600" /></div>
                         <div>
                           <label className="text-[14.5px] font-bold text-slate-900 block">First Day of the Week</label>
                           <span className="text-[13px] font-medium text-slate-500">Affects calendar views and weekly reporting.</span>
                         </div>
                       </div>
                       <select value={firstDayOfWeek} onChange={(e) => setFirstDayOfWeek(e.target.value)} className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-bold text-slate-700 focus:outline-none cursor-pointer">
                         <option value="Sunday">Sunday</option>
                         <option value="Monday">Monday</option>
                       </select>
                     </div>

                   </div>
                 </div>
               </form>
             )}

             {/* Tab 2: Appearance & Theme */}
             {activeTab === "appearance" && (
               <form onSubmit={handleSavePreferences} className="space-y-8 pb-12 animate-in fade-in duration-300">
                 <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4 border-b border-slate-100">
                   <div>
                     <h3 className="text-[20px] font-black text-slate-900">Appearance & Theme</h3>
                     <p className="text-[13.5px] font-medium text-slate-500 mt-1">Customize the visual display, density, and colors of EmpSphere.</p>
                   </div>
                   <button type="submit" disabled={isSavingPrefs} className="px-5 py-2.5 rounded-xl bg-[#5B5FEF] text-white text-[13px] font-bold disabled:opacity-50 shadow-md shadow-[#5B5FEF]/20 hover:bg-[#4F46E5] transition-colors">
                     {isSavingPrefs ? "Saving..." : "Save Appearance"}
                   </button>
                 </div>

                 {prefsStatus.type && (
                   <div className={`flex items-start gap-3 p-4 rounded-2xl border ${prefsStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                     {prefsStatus.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />}
                     <span className="text-[13px] font-semibold">{prefsStatus.message}</span>
                   </div>
                 )}

                 {/* Display Mode */}
                 <div>
                   <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-4">Display Mode</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <button type="button" onClick={() => setTheme("light")} className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-[#5B5FEF] bg-[#EEF0FF] text-[#5B5FEF]' : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'}`}>
                       <Sun className="w-8 h-8 mb-3" />
                       <span className="text-[14px] font-bold">Light Mode</span>
                     </button>
                     <button type="button" onClick={() => setTheme("dark")} className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-[#5B5FEF] bg-[#EEF0FF] text-[#5B5FEF]' : 'border-slate-200 hover:border-slate-300 bg-slate-900 text-slate-400'}`}>
                       <Moon className="w-8 h-8 mb-3" />
                       <span className="text-[14px] font-bold">Dark Mode</span>
                     </button>
                     <button type="button" onClick={() => setTheme("system")} className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${theme === 'system' ? 'border-[#5B5FEF] bg-[#EEF0FF] text-[#5B5FEF]' : 'border-slate-200 hover:border-slate-300 bg-slate-100 text-slate-600'}`}>
                       <Monitor className="w-8 h-8 mb-3" />
                       <span className="text-[14px] font-bold">System Default</span>
                     </button>
                   </div>
                 </div>

                 {/* Interface Layout */}
                 <div className="pt-6 border-t border-slate-100">
                   <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-6">Interface Layout</h4>
                   
                   <div className="space-y-6">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div>
                         <label className="text-[14.5px] font-bold text-slate-900 block">Information Density</label>
                         <span className="text-[13px] font-medium text-slate-500">Control the padding and spacing across tables and cards.</span>
                       </div>
                       <select value={density} onChange={(e) => setDensity(e.target.value)} className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-bold text-slate-700 focus:outline-none cursor-pointer">
                         <option value="Comfortable">Comfortable (Default)</option>
                         <option value="Compact">Compact (Dense)</option>
                       </select>
                     </div>

                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div>
                         <label className="text-[14.5px] font-bold text-slate-900 block">Sidebar Behavior</label>
                         <span className="text-[13px] font-medium text-slate-500">Set how the main navigation sidebar behaves on large screens.</span>
                       </div>
                       <select value={sidebarBehavior} onChange={(e) => setSidebarBehavior(e.target.value)} className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-bold text-slate-700 focus:outline-none cursor-pointer">
                         <option value="Expanded">Always Expanded</option>
                         <option value="Collapsed">Always Collapsed (Icons only)</option>
                         <option value="Auto-hide">Auto-hide on hover</option>
                       </select>
                     </div>

                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div>
                         <label className="text-[14.5px] font-bold text-slate-900 block">Primary Accent Color</label>
                         <span className="text-[13px] font-medium text-slate-500">Change the core branding color for buttons and active states.</span>
                       </div>
                       <div className="flex items-center gap-3">
                         {["Blue", "Purple", "Emerald", "Rose"].map((color) => (
                           <button 
                             key={color} 
                             type="button" 
                             onClick={() => setAccentColor(color)}
                             className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${accentColor === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                           >
                             <div className={`w-6 h-6 rounded-full ${color === 'Blue' ? 'bg-[#5B5FEF]' : color === 'Purple' ? 'bg-purple-500' : color === 'Emerald' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                           </button>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
               </form>
             )}

             {/* Tab 3: Privacy & Data (DPDP) */}
             {activeTab === "privacy" && (
               <div className="space-y-8 pb-12 animate-in fade-in duration-300">
                 <form onSubmit={handleSavePrivacy} className="space-y-6">
                   <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4 border-b border-slate-100">
                     <div>
                       <h3 className="text-[20px] font-black text-slate-900">Privacy & Security Controls</h3>
                       <p className="text-[13.5px] font-medium text-slate-500 mt-1">Manage data processing, active sessions, and DPDP compliance.</p>
                     </div>
                     <button type="submit" disabled={isSavingPrivacy} className="px-5 py-2.5 rounded-xl bg-[#5B5FEF] text-white text-[13px] font-bold disabled:opacity-50 shadow-md shadow-[#5B5FEF]/20 hover:bg-[#4F46E5] transition-colors">
                       {isSavingPrivacy ? "Saving..." : "Save Privacy Settings"}
                     </button>
                   </div>

                   {privacyStatus.type && (
                     <div className={`flex items-start gap-3 p-4 rounded-2xl border ${privacyStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                       {privacyStatus.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />}
                       <span className="text-[13px] font-semibold">{privacyStatus.message}</span>
                     </div>
                   )}

                   {/* Data Processing & Consents */}
                   <div>
                     <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-6">Consents</h4>
                     <div className="space-y-4">
                       <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                         <div>
                           <h4 className="text-[14.5px] font-bold text-slate-900">Data Processing Consent</h4>
                           <p className="text-[13px] text-slate-500 mt-1 max-w-2xl">Allow EmpSphere to process your usage data to improve analytics, platform stability, and performance. This data is fully anonymized.</p>
                         </div>
                         <button type="button" onClick={() => setDataSharingConsent(!dataSharingConsent)} className={`shrink-0 w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${dataSharingConsent ? 'bg-[#5B5FEF]' : 'bg-slate-300'}`}>
                           <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${dataSharingConsent ? 'translate-x-6' : 'translate-x-0'}`} />
                         </button>
                       </div>

                       <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                         <div>
                           <h4 className="text-[14.5px] font-bold text-slate-900">Marketing & Promotional Emails</h4>
                           <p className="text-[13px] text-slate-500 mt-1 max-w-2xl">Receive emails about new features, EmpSphere updates, and company-wide promotional materials.</p>
                         </div>
                         <button type="button" onClick={() => setMarketingEmails(!marketingEmails)} className={`shrink-0 w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${marketingEmails ? 'bg-[#5B5FEF]' : 'bg-slate-300'}`}>
                           <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${marketingEmails ? 'translate-x-6' : 'translate-x-0'}`} />
                         </button>
                       </div>
                     </div>
                   </div>

                   {/* Two Factor & Sessions */}
                   <div className="pt-6 border-t border-slate-100">
                     <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-6">Advanced Security</h4>
                     <div className="space-y-6">
                       
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                         <div>
                           <h4 className="text-[14.5px] font-bold text-slate-900 flex items-center gap-2">Two-Factor Authentication (2FA) <span className={`px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-bold ${twoFactorEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{twoFactorEnabled ? 'Enabled' : 'Disabled'}</span></h4>
                           <p className="text-[13px] text-slate-500 mt-1">Add an extra layer of security to your account using an authenticator app.</p>
                         </div>
                         <button type="button" onClick={() => setTwoFactorEnabled(!twoFactorEnabled)} className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-colors ${twoFactorEnabled ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-[#5B5FEF] text-white shadow-md shadow-[#5B5FEF]/20 hover:bg-[#4F46E5]'}`}>
                           {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                         </button>
                       </div>

                       <div>
                         <h4 className="text-[14.5px] font-bold text-slate-900 mb-3">Active Sessions</h4>
                         <div className="border border-slate-200 rounded-2xl overflow-hidden">
                           <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100">
                             <div className="flex items-center gap-4">
                               <div className="p-2.5 rounded-full bg-[#EEF0FF]"><Laptop className="w-5 h-5 text-[#5B5FEF]" /></div>
                               <div>
                                 <p className="text-[13.5px] font-bold text-slate-900">MacBook Pro - Chrome (Current)</p>
                                 <p className="text-[12px] font-medium text-slate-500">New York, USA • Last active: Just now</p>
                               </div>
                             </div>
                           </div>
                           <div className="flex items-center justify-between p-4 bg-white">
                             <div className="flex items-center gap-4">
                               <div className="p-2.5 rounded-full bg-slate-100"><Smartphone className="w-5 h-5 text-slate-600" /></div>
                               <div>
                                 <p className="text-[13.5px] font-bold text-slate-900">iPhone 13 - Safari</p>
                                 <p className="text-[12px] font-medium text-slate-500">New York, USA • Last active: 2 hours ago</p>
                               </div>
                             </div>
                             <button type="button" className="text-[13px] font-bold text-rose-500 hover:text-rose-700 transition-colors">Revoke</button>
                           </div>
                         </div>
                       </div>
                       
                     </div>
                   </div>
                 </form>

                 {/* Danger Zone */}
                 <div className="pt-8 border-t border-slate-100">
                   <h3 className="text-[16px] font-black text-rose-600 flex items-center gap-2 mb-4">
                     <ShieldAlert className="w-5 h-5" /> Danger Zone
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50/50 flex flex-col items-start h-full">
                       <h4 className="text-[14.5px] font-bold text-rose-900">Export Personal Data</h4>
                       <p className="text-[13px] text-rose-700/80 mt-1 mb-6 flex-1">Download a complete, machine-readable archive of your personal HR data, compliance records, and uploaded documents.</p>
                       <button 
                         onClick={handleDataExport}
                         disabled={exporting}
                         className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-700 font-bold text-[13px] hover:bg-rose-100 transition-colors shadow-sm disabled:opacity-50"
                       >
                         <Download className="w-4 h-4" /> {exporting ? "Generating Archive..." : "Request Data Export"}
                       </button>
                     </div>
                     <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50/50 flex flex-col items-start h-full">
                       <h4 className="text-[14.5px] font-bold text-rose-900">Account Deletion</h4>
                       <p className="text-[13px] text-rose-700/80 mt-1 mb-6 flex-1">Request permanent deletion of your account. This action cannot be undone and requires strict HR approval to process.</p>
                       <button 
                         onClick={handleDeleteAccount}
                         className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-[13px] hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20"
                       >
                         <Trash2 className="w-4 h-4" /> Request Deletion
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* Tab 4: Security & Credentials */}
             {activeTab === "security" && (
               <div className="space-y-8 pb-12 animate-in fade-in duration-300">
                 <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4 border-b border-slate-100">
                   <div>
                     <h3 className="text-[20px] font-black text-slate-900">Security & Credentials</h3>
                     <p className="text-[13.5px] font-medium text-slate-500 mt-1">Change your account password and review password rules.</p>
                   </div>
                 </div>

                 {passwordStatus.type && (
                   <div className={`flex items-start gap-3 p-4 rounded-2xl border ${passwordStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                     {passwordStatus.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />}
                     <span className="text-[13px] font-semibold">{passwordStatus.message}</span>
                   </div>
                 )}

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                   {/* Password Form */}
                   <form onSubmit={handleUpdatePassword} className="space-y-5">
                     <div>
                       <label className="block text-[13.5px] font-bold text-slate-700 mb-1.5">Current Password <span className="text-rose-500">*</span></label>
                       <input
                         type="password"
                         required
                         value={currentPassword}
                         onChange={(e) => setCurrentPassword(e.target.value)}
                         placeholder="••••••••"
                         className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium focus:border-[#5B5FEF] focus:outline-none transition-all shadow-sm"
                       />
                     </div>
                     <div>
                       <label className="block text-[13.5px] font-bold text-slate-700 mb-1.5">New Password <span className="text-rose-500">*</span></label>
                       <input
                         type="password"
                         required
                         value={newPassword}
                         onChange={(e) => setNewPassword(e.target.value)}
                         placeholder="••••••••"
                         className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium focus:border-[#5B5FEF] focus:outline-none transition-all shadow-sm"
                       />
                     </div>
                     <div>
                       <label className="block text-[13.5px] font-bold text-slate-700 mb-1.5">Confirm New Password <span className="text-rose-500">*</span></label>
                       <input
                         type="password"
                         required
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         placeholder="••••••••"
                         className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-medium focus:border-[#5B5FEF] focus:outline-none transition-all shadow-sm"
                       />
                     </div>

                     <button
                       type="submit"
                       disabled={isUpdatingPassword}
                       className="w-full sm:w-auto bg-[#5B5FEF] hover:bg-[#4F46E5] text-white px-6 py-3 rounded-xl text-[14px] font-bold shadow-md shadow-[#5B5FEF]/20 transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                     >
                       {isUpdatingPassword ? <><Loader2 className="w-5 h-5 animate-spin" /> Updating...</> : "Update Password"}
                     </button>
                   </form>

                   {/* Security Rules & Info */}
                   <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                     <h4 className="text-[15px] font-black text-slate-900 flex items-center gap-2 mb-4">
                       <Shield className="w-5 h-5 text-slate-700" /> Organization Security Policy
                     </h4>
                     <ul className="space-y-4 text-[13.5px] font-medium text-slate-600">
                       <li className="flex items-start gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                         <span>Passwords must be at least 8 characters long and contain a mix of uppercase letters, numbers, and symbols.</span>
                       </li>
                       <li className="flex items-start gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                         <span>Corporate policy requires you to change your password every 90 days.</span>
                       </li>
                       <li className="flex items-start gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                         <span>You cannot reuse any of your last 5 passwords.</span>
                       </li>
                       <li className="flex items-start gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                         <span>For any suspicious activity, immediately revoke active sessions from the Privacy tab or contact IT.</span>
                       </li>
                     </ul>
                     <div className="mt-8 pt-6 border-t border-slate-200">
                       <p className="text-[12.5px] font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Login IP</p>
                       <p className="text-[14px] font-mono font-bold text-slate-800">192.168.1.42 (USA)</p>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* Tab 5: System Settings (Admin Only) */}
             {activeTab === "system" && isAdmin && (
               <form onSubmit={handleSaveSystem} className="space-y-8 pb-12 animate-in fade-in duration-300">
                 <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4 border-b border-slate-100">
                   <div>
                     <h3 className="text-[20px] font-black text-slate-900">Platform System Settings</h3>
                     <p className="text-[13.5px] font-medium text-slate-500 mt-1">Configure global application variables and security parameters.</p>
                   </div>
                   <button type="submit" disabled={isSavingSystem} className="px-5 py-2.5 rounded-xl bg-[#5B5FEF] text-white text-[13px] font-bold disabled:opacity-50 shadow-md shadow-[#5B5FEF]/20 hover:bg-[#4F46E5] transition-colors">
                     {isSavingSystem ? "Saving..." : "Save Global Settings"}
                   </button>
                 </div>

                 {systemSuccess && (
                   <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                     <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                     <span className="text-[13px] font-semibold">Global system configurations saved successfully!</span>
                   </div>
                 )}

                 <div>
                   <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-6">Global Security & Access</h4>
                   <div className="space-y-6">
                     <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                       <div className="flex items-start gap-4">
                         <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm"><AlertTriangle className="w-5 h-5 text-amber-500" /></div>
                         <div>
                           <label className="text-[14.5px] font-bold text-slate-900 block">Maintenance Window Mode</label>
                           <span className="text-[13px] font-medium text-slate-500 mt-0.5 max-w-xl block">Temporarily restrict all employee logins and present the maintenance screen. Admin accounts are unaffected.</span>
                         </div>
                       </div>
                       <button type="button" onClick={() => setMaintenanceMode(!maintenanceMode)} className={`shrink-0 w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${maintenanceMode ? 'bg-amber-500' : 'bg-slate-300'}`}>
                         <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                     </div>

                     <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                       <div className="flex items-start gap-4">
                         <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm"><UserPlus className="w-5 h-5 text-[#5B5FEF]" /></div>
                         <div>
                           <label className="text-[14.5px] font-bold text-slate-900 block">Allow Public Registration</label>
                           <span className="text-[13px] font-medium text-slate-500 mt-0.5 max-w-xl block">If disabled, new accounts can only be created by an Admin via the Users dashboard (Invite Only mode).</span>
                         </div>
                       </div>
                       <button type="button" onClick={() => setPublicRegistration(!publicRegistration)} className={`shrink-0 w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${publicRegistration ? 'bg-[#5B5FEF]' : 'bg-slate-300'}`}>
                         <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${publicRegistration ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                     </div>

                     <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                       <div className="flex items-start gap-4">
                         <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm"><Shield className="w-5 h-5 text-emerald-500" /></div>
                         <div>
                           <label className="text-[14.5px] font-bold text-slate-900 block">Force 2FA Company-Wide</label>
                           <span className="text-[13px] font-medium text-slate-500 mt-0.5 max-w-xl block">Require all employees to set up and use Two-Factor Authentication on their next login.</span>
                         </div>
                       </div>
                       <button type="button" onClick={() => setForce2FA(!force2FA)} className={`shrink-0 w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${force2FA ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                         <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${force2FA ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                     </div>
                   </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100">
                   <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-6">Server Parameters</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-[14px] font-bold text-slate-900 mb-2">Max Attachment Upload Size</label>
                       <select value={maxUploadSize} onChange={(e) => setMaxUploadSize(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-bold text-slate-700 focus:outline-none cursor-pointer">
                         <option value="2MB">2MB (Lightweight - Recommended)</option>
                         <option value="5MB">5MB (Standard)</option>
                         <option value="10MB">10MB (Medium - Current)</option>
                         <option value="20MB">20MB (Maximum - Server Intensive)</option>
                       </select>
                       <p className="text-[12.5px] font-medium text-slate-500 mt-2">Maximum file size for profile pictures and document uploads.</p>
                     </div>
                     <div>
                       <label className="block text-[14px] font-bold text-slate-900 mb-2">Session Expiry Timeout</label>
                       <select value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-bold text-slate-700 focus:outline-none cursor-pointer">
                         <option value="15 mins">15 Minutes (High Security)</option>
                         <option value="30 mins">30 Minutes (Standard)</option>
                         <option value="1 hour">1 Hour</option>
                         <option value="8 hours">8 Hours (Full Working Shift)</option>
                       </select>
                       <p className="text-[12.5px] font-medium text-slate-500 mt-2">Inactivity duration before a user is automatically logged out.</p>
                     </div>
                   </div>
                 </div>
               </form>
             )}

          </div>
        </div>
      </main>
    </div>
  );
}
