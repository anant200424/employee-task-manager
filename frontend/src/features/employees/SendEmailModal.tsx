"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Mail,
  Send,
  Loader2,
  AlertCircle,
  Zap,
  UserPlus,
  Users,
  Search,
  Eye,
  Edit3,
  ShieldCheck,
} from "lucide-react";
import { api, extractApiError } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export interface RecipientUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
  employeeId?: string;
  avatarUrl?: string;
}

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: RecipientUser[];
  allUsers?: RecipientUser[];
  onSuccess?: () => void;
}

const QUICK_SUBJECT_SUGGESTIONS = [
  { label: "📢 Company Notice", subject: "Company Notice: Important Workspace Announcement" },
  { label: "📌 Performance Review", subject: "Performance Review: Schedule & Objectives Discussion" },
  { label: "📝 Action Required", subject: "Action Required: Update Verification Information" },
  { label: "🗓️ Meeting / Discussion", subject: "Official Meeting: Administrative Discussion Request" },
  { label: "📄 Document Request", subject: "Administrative Request: Submission of Compliance Documents" },
  { label: "ℹ️ System Update", subject: "EmpSphere Workspace: Account & Access Notice" },
];

export const SendEmailModal = ({
  isOpen,
  onClose,
  recipients: initialRecipients,
  allUsers = [],
  onSuccess,
}: SendEmailModalProps) => {
  const { user: currentUser } = useAuth();

  const [selectedRecipients, setSelectedRecipients] = useState<RecipientUser[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
  const [sending, setSending] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formBannerError, setFormBannerError] = useState<string | null>(null);

  // Add Recipient Dropdown State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedRecipients(initialRecipients);
      setSubject("");
      setMessage("");
      setPriority("normal");
      setActiveTab("compose");
      setIsAddUserOpen(false);
      setUserSearchQuery("");
      setFormErrors({});
      setFormBannerError(null);
    }
  }, [isOpen, initialRecipients]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAddUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter available users for adding
  const availableUsersToAdd = useMemo(() => {
    const selectedIds = new Set(selectedRecipients.map((r) => r.id));
    const query = userSearchQuery.toLowerCase().trim();
    return allUsers.filter((u) => {
      if (selectedIds.has(u.id)) return false;
      if (!query) return true;
      return (
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.department && u.department.toLowerCase().includes(query)) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(query))
      );
    });
  }, [allUsers, selectedRecipients, userSearchQuery]);

  const handleAddRecipient = (u: RecipientUser) => {
    setSelectedRecipients((prev) => [...prev, u]);
    setUserSearchQuery("");
  };

  const handleRemoveRecipient = (id: string) => {
    if (selectedRecipients.length === 1) {
      toast.error("At least one recipient is required.");
      return;
    }
    setSelectedRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddAllActive = () => {
    const combined = [...selectedRecipients];
    allUsers.forEach((u) => {
      if (!combined.some((c) => c.id === u.id)) {
        combined.push(u);
      }
    });
    setSelectedRecipients(combined);
    setIsAddUserOpen(false);
    toast.success(`Targeted all ${combined.length} employees.`);
  };

  const insertGreeting = (type: "individual" | "team") => {
    if (type === "individual") {
      const name = selectedRecipients[0]?.name || "Employee";
      const greeting = `Hi ${name},\n\n`;
      setMessage((prev) => (prev.startsWith("Hi ") ? prev : greeting + prev));
    } else {
      const greeting = `Hello Team,\n\n`;
      setMessage((prev) => (prev.startsWith("Hello Team") ? prev : greeting + prev));
    }
  };

  const validateField = (fieldName: string, value: string): string | undefined => {
    if (fieldName === "subject") {
      const trimmed = value.trim();
      if (!trimmed) return "Email subject line is required.";
      if (trimmed.length < 3) return "Subject must be at least 3 characters.";
      if (trimmed.length > 120) return "Subject cannot exceed 120 characters.";
      return undefined;
    }
    if (fieldName === "message") {
      const trimmed = value.trim();
      if (!trimmed) return "Email message body is required.";
      if (trimmed.length < 10) return "Message body must be at least 10 characters.";
      if (trimmed.length > 5000) return "Message body cannot exceed 5000 characters.";
      return undefined;
    }
    return undefined;
  };

  const handleBlur = (fieldName: string) => {
    let val = "";
    if (fieldName === "subject") val = subject;
    else if (fieldName === "message") val = message;

    const err = validateField(fieldName, val);
    setFormErrors((prev) => ({ ...prev, [fieldName]: err || "" }));
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (selectedRecipients.length === 0) {
      errs.recipients = "Please specify at least one recipient.";
    }

    const subErr = validateField("subject", subject);
    if (subErr) errs.subject = subErr;

    const msgErr = validateField("message", message);
    if (msgErr) errs.message = msgErr;

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFormBannerError("Please resolve all email validation errors highlighted below before dispatching.");
      toast.error("Please fix form errors before dispatching email.");
      return;
    }
    setFormBannerError(null);

    setSending(true);

    try {
      const recipientIds = selectedRecipients.map((r) => r.id);
      const res = await api.post("/users/send-email", {
        recipientIds,
        subject: subject.trim(),
        message: message.trim(),
        priority,
      });

      const sentCount = res.data?.data?.sentCount || selectedRecipients.length;
      toast.success(
        `Email successfully dispatched to ${sentCount} recipient${
          sentCount > 1 ? "s" : ""
        } via SMTP!`,
        { duration: 4500 }
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const errInfo = extractApiError(err);
      const msg = errInfo.message || "Failed to dispatch email. Please check SMTP settings.";
      setFormBannerError(msg);
      toast.error(msg);
      console.error("Email dispatch failed:", err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* =========================================================================
            1. HEADER
           ========================================================================= */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5B5FEF] to-[#4338CA] text-white flex items-center justify-center shadow-md shadow-[#5B5FEF]/25 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] sm:text-[18px] font-black text-slate-900 dark:text-white">
                  Compose Email via SMTP
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SMTP Relay
                </span>
              </div>
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                Direct email dispatch with real-time in-app notification synchronization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={sending}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =========================================================================
            2. DISPATCH METADATA & RECIPIENTS BAR
           ========================================================================= */}
        <div className="px-5 sm:px-6 py-3 bg-slate-100/60 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[12px] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5B5FEF]" />
            <span>Sender:</span>
            <span className="text-slate-900 dark:text-white font-extrabold">
              {currentUser?.firstName} {currentUser?.lastName}
            </span>
            <span className="text-slate-400 font-medium">({currentUser?.email})</span>
          </div>

          {/* Mode Switcher: Compose vs Preview */}
          <div className="flex items-center p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab("compose")}
              className={`px-3 py-1 rounded-lg text-[11.5px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "compose"
                  ? "bg-[#5B5FEF] text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Compose</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 rounded-lg text-[11.5px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-[#5B5FEF] text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Inbox Preview</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            3. SCROLLABLE BODY
           ========================================================================= */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {activeTab === "compose" ? (
            <form id="send-email-form" onSubmit={handleSendEmail} noValidate className="space-y-4">
              {/* Top Form Error Banner */}
              {formBannerError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-xl border-2 border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-[13px] font-bold text-red-700 dark:text-red-300 flex items-center gap-2 animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                  <span>{formBannerError}</span>
                </div>
              )}

              {/* Recipient Picker & Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12.5px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#5B5FEF]" />
                    <span>Recipients ({selectedRecipients.length}) <span className="text-red-500 font-black">*</span></span>
                  </label>

                  {/* Add Recipient Dropdown Toggle */}
                  {allUsers.length > 0 && (
                    <div ref={dropdownRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAddUserOpen(!isAddUserOpen)}
                        className="text-[12px] font-extrabold text-[#5B5FEF] hover:text-[#4338CA] dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Recipient</span>
                      </button>

                      {/* Dropdown Menu */}
                      {isAddUserOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2.5 z-50 animate-in fade-in zoom-in-95">
                          {/* Search inside dropdown */}
                          <div className="relative mb-2">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={userSearchQuery}
                              onChange={(e) => setUserSearchQuery(e.target.value)}
                              placeholder="Search employee by name..."
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[12px] font-semibold text-slate-900 dark:text-white outline-none focus:border-[#5B5FEF]"
                              autoFocus
                            />
                          </div>

                          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                            {availableUsersToAdd.length === 0 ? (
                              <p className="text-[12px] text-slate-400 text-center py-4">
                                No matching employees found.
                              </p>
                            ) : (
                              availableUsersToAdd.map((u) => (
                                <button
                                  type="button"
                                  key={u.id}
                                  onClick={() => handleAddRecipient(u)}
                                  className="w-full text-left p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between group transition-colors cursor-pointer"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[12.5px] font-extrabold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#5B5FEF]">
                                      {u.name}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate">
                                      {u.email} · {u.department || "Staff"}
                                    </p>
                                  </div>
                                  <span className="text-[11px] font-bold text-[#5B5FEF] opacity-0 group-hover:opacity-100 transition-opacity">
                                    + Add
                                  </span>
                                </button>
                              ))
                            )}
                          </div>

                          {/* Quick Add All Button */}
                          {availableUsersToAdd.length > 1 && (
                            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={handleAddAllActive}
                                className="w-full py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-[#5B5FEF] dark:text-indigo-400 text-[11.5px] font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Add All Remaining ({availableUsersToAdd.length})</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Recipient Chips Container */}
                <div className={`flex flex-wrap gap-1.5 p-2 rounded-2xl border-2 transition-all min-h-[46px] max-h-28 overflow-y-auto custom-scrollbar ${
                  formErrors.recipients
                    ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                }`}>
                  {selectedRecipients.map((r) => (
                    <div
                      key={r.id}
                      className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 text-[12px] font-bold shadow-2xs group"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#5B5FEF] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                        {r.avatarUrl ? (
                          <img src={r.avatarUrl} alt={r.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          r.name?.[0]?.toUpperCase() || "E"
                        )}
                      </div>
                      <span className="truncate max-w-[140px]">{r.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        &lt;{r.email}&gt;
                      </span>
                      {selectedRecipients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(r.id)}
                          className="w-4 h-4 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ml-0.5"
                          title="Remove recipient"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {formErrors.recipients && (
                  <p role="alert" className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formErrors.recipients}</span>
                  </p>
                )}
              </div>

              {/* Priority Selector */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Dispatch Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority("normal")}
                    className={`py-2 px-3 rounded-xl text-[12.5px] font-extrabold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      priority === "normal"
                        ? "bg-[#EEF2FF] text-[#5B5FEF] border-[#5B5FEF] shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Normal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority("important")}
                    className={`py-2 px-3 rounded-xl text-[12.5px] font-extrabold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      priority === "important"
                        ? "bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-950/40 dark:text-amber-300 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Important</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority("urgent")}
                    className={`py-2 px-3 rounded-xl text-[12.5px] font-extrabold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      priority === "urgent"
                        ? "bg-rose-50 text-rose-700 border-rose-500 dark:bg-rose-950/40 dark:text-rose-300 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-rose-500" />
                    <span>Urgent</span>
                  </button>
                </div>
              </div>

              {/* Subject Line */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Email Subject Line <span className="text-red-500 font-black">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (formErrors.subject) setFormErrors((prev) => ({ ...prev, subject: "" }));
                    if (formBannerError) setFormBannerError(null);
                  }}
                  onBlur={() => handleBlur("subject")}
                  placeholder="e.g. Action Required: Verification of Employee Records"
                  aria-required="true"
                  aria-invalid={Boolean(formErrors.subject)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-[13px] font-bold text-slate-900 dark:text-white outline-none transition-all ${
                    formErrors.subject
                      ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                  }`}
                />
                {formErrors.subject && (
                  <p role="alert" className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formErrors.subject}</span>
                  </p>
                )}

                {/* Quick Subject Suggestions */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1 pb-0.5">
                  <span className="text-[11px] font-bold text-slate-400 shrink-0">Quick topics:</span>
                  {QUICK_SUBJECT_SUGGESTIONS.map((item, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setSubject(item.subject);
                        if (formErrors.subject) setFormErrors((prev) => ({ ...prev, subject: "" }));
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 hover:text-[#5B5FEF] dark:hover:bg-indigo-950/40 text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Message Body <span className="text-red-500 font-black">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        selectedRecipients.length > 1
                          ? insertGreeting("team")
                          : insertGreeting("individual")
                      }
                      className="text-[11px] font-bold text-[#5B5FEF] hover:underline cursor-pointer"
                    >
                      + Insert Salutation
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {message.length} characters
                    </span>
                  </div>
                </div>

                <textarea
                  rows={7}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (formErrors.message) setFormErrors((prev) => ({ ...prev, message: "" }));
                    if (formBannerError) setFormBannerError(null);
                  }}
                  onBlur={() => handleBlur("message")}
                  placeholder="Write your email message here. Use line breaks to separate paragraphs. Recipient salutation and administrative signature are automatically formatted..."
                  aria-required="true"
                  aria-invalid={Boolean(formErrors.message)}
                  className={`w-full p-3.5 rounded-2xl border-2 text-[13px] font-medium text-slate-900 dark:text-white outline-none transition-all resize-y leading-relaxed ${
                    formErrors.message
                      ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                  }`}
                />
                {formErrors.message && (
                  <p role="alert" className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formErrors.message}</span>
                  </p>
                )}
              </div>
            </form>
          ) : (
            /* =========================================================================
                PREVIEW MODE: Rendered Email Visual
               ========================================================================= */
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-950">
              {/* Preview Banner */}
              <div className="bg-[#0F172A] p-4 text-white flex items-center justify-between border-b-2 border-[#5B5FEF]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#5B5FEF] text-white font-black text-xs flex items-center justify-center">
                    E
                  </div>
                  <span className="font-extrabold text-[15px]">EmpSphere</span>
                </div>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    priority === "urgent"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : priority === "important"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  }`}
                >
                  {priority === "urgent"
                    ? "⚡ URGENT NOTICE"
                    : priority === "important"
                    ? "📌 IMPORTANT NOTICE"
                    : "✉️ OFFICIAL DIRECT MESSAGE"}
                </span>
              </div>

              {/* Preview Content */}
              <div className="p-6 space-y-4 text-left">
                <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white">
                  {subject || "(Subject line will appear here)"}
                </h3>

                <p className="text-[13px] text-slate-600 dark:text-slate-400">
                  Dear <strong>{selectedRecipients[0]?.name || "Employee"}</strong>,
                </p>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border-l-4 border-[#5B5FEF] text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 whitespace-pre-line">
                  {message || "Your message body content will appear formatted here with appropriate paragraph spacing."}
                </div>

                <div className="p-3 bg-slate-100/70 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11.5px] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Dispatched by</span>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {currentUser?.firstName} {currentUser?.lastName}{" "}
                      <span className="text-slate-400 font-normal">
                        ({currentUser?.role === "admin" ? "System Administrator" : currentUser?.role})
                      </span>
                    </p>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">EmpSphere Secure Mailer</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            4. FOOTER CONTROLS
           ========================================================================= */}
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[13px] font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="send-email-form"
            disabled={sending || !subject.trim() || !message.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B5FEF] to-[#4338CA] hover:from-[#4d51db] hover:to-[#372ea8] text-white text-[13px] font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-[#5B5FEF]/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Dispatching via SMTP...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  Send Email to {selectedRecipients.length} Recipient
                  {selectedRecipients.length > 1 ? "s" : ""}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
