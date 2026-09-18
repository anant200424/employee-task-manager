"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Trash2,
  Lock,
  X,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { api, extractApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { isAdminUser } from "@/lib/roleUtils";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If targetUser is passed, an Admin is deleting that employee. If null/undefined, employee is deleting their own profile.
  targetUser?: {
    id: string;
    name: string;
    email: string;
    employeeId?: string;
  } | null;
  onSuccess?: () => void;
}

export const DeleteAccountModal = ({
  isOpen,
  onClose,
  targetUser,
  onSuccess,
}: DeleteAccountModalProps) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const isSelfDeletion = !targetUser || targetUser.id === user?._id;
  const targetName = targetUser ? targetUser.name : `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Your Profile";
  const targetEmail = targetUser ? targetUser.email : user?.email || "";

  const [password, setPassword] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [reason, setReason] = useState("leaving_company");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (isSelfDeletion) {
      if (isAdminUser(user)) {
        setErrorMessage(
          "Enterprise Safeguard: Administrator and Super Administrator accounts cannot be self-deleted to maintain workspace governance.",
        );
        return;
      }

      if (!password && confirmPhrase.trim().toUpperCase() !== "DELETE") {
        setErrorMessage("Please enter your account password or type 'DELETE' to confirm.");
        return;
      }
    } else {
      if (confirmPhrase.trim().toUpperCase() !== "DELETE") {
        setErrorMessage("Please type 'DELETE' to confirm permanent employee profile removal.");
        return;
      }
    }

    try {
      setLoading(true);

      if (isSelfDeletion) {
        // Self-service account deletion
        await api.delete("/users/me", {
          data: {
            password: password || undefined,
            confirmationText: confirmPhrase.trim().toUpperCase() === "DELETE" ? "DELETE" : confirmPhrase.trim(),
            reason,
          },
        });

        toast.success("Your EmpSphere employee profile has been permanently deleted.");
        onClose();
        if (logout) {
          logout();
        } else {
          router.push("/login");
        }
      } else {
        // Admin deleting employee
        await api.delete(`/users/${targetUser.id}`);
        toast.success(`Employee ${targetName} has been deleted successfully.`);
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      const { message } = extractApiError(err);
      setErrorMessage(message || "Failed to delete account. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-rose-200/80 dark:border-rose-900/50 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Danger Gradient Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-500" />

        {/* Modal Header */}
        <div className="p-6 sm:p-7 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[19px] font-black text-slate-900 dark:text-white leading-tight">
                  {isSelfDeletion ? "Delete Employee Profile" : `Delete ${targetName}`}
                </h3>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Permanent account de-registration & data removal
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="px-6 sm:px-7">
          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 text-[12.5px] font-medium space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>This action is permanent and irreversible:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1 text-[12px]">
              <li>Your login credentials, auth tokens, and active sessions will be revoked.</li>
              <li>Your personal profile details, avatar, and HR compliance records will be removed.</li>
              <li>You will be unassigned from all active sprint deliverables.</li>
            </ul>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="px-6 sm:px-7 mt-3">
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-[12px] font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleConfirmDelete} className="p-6 sm:p-7 pt-4 space-y-4">
          
          {/* Reason Selector */}
          <div>
            <label className="block text-[12px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Reason for Departure / Deletion
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
            >
              <option value="leaving_company">Transitioning to a new organization</option>
              <option value="role_change">Role change or internal transfer</option>
              <option value="privacy_preference">Privacy & data minimization preference</option>
              <option value="duplicate_account">Duplicate profile clean-up</option>
              <option value="other">Other business or personal reasons</option>
            </select>
          </div>

          {/* Security Verification: Password OR Confirmation Phrase */}
          {isSelfDeletion ? (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Confirm with Account Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter your current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:text-slate-400"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Or confirm with text
                </span>
              </div>

              <div>
                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Type <span className="font-mono text-rose-600 dark:text-rose-400 font-black">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  placeholder="Type DELETE"
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[12px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Type <span className="font-mono text-rose-600 dark:text-rose-400 font-black">DELETE</span> to confirm
              </label>
              <input
                type="text"
                placeholder="Type DELETE"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:text-slate-400"
              />
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[13px] font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || (!password && confirmPhrase.trim().toUpperCase() !== "DELETE")}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-black transition-all shadow-md shadow-rose-600/30 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting Profile...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Delete Profile</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
