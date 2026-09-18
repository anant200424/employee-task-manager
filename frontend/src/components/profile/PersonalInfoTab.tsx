"use client";

import { useState, useEffect } from "react";
import {
  User,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Clock,
  RotateCcw,
  X,
  Edit2,
  Loader2,
  Trash2,
  ShieldAlert,
  Shield,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isAdminUser } from "@/lib/roleUtils";
import { api, extractApiError } from "@/lib/api";
import {
  normalizeFirstName,
  normalizeName,
  validateFirstName,
  validateName,
  validateEmail,
  validateDateOfBirth,
  validatePassword,
  validatePhoneNumber,
  getPasswordStrength,
} from "@/lib/validation";
import { PhoneField } from "@/components/auth/PhoneField";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAutosave } from "@/hooks/useAutosave";
import { AutosaveBadge } from "@/components/ui/AutosaveBadge";
import { DeleteAccountModal } from "./DeleteAccountModal";

const SESSION_KEY_EMAIL_CHANGE = "empsphere_pending_email_change";
const SESSION_KEY_PHONE_CHANGE = "empsphere_pending_phone_change";
const SESSION_KEY_IS_EDITING = "empsphere_profile_is_editing";

export const PersonalInfoTab = () => {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();

  // Personal Info State
  const [isEditing, setIsEditing] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(SESSION_KEY_IS_EDITING) === "true";
    }
    return false;
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
  );
  const [countryCode, setCountryCode] = useState(user?.countryCode || "IN");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [formBannerError, setFormBannerError] = useState<string | null>(null);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Autosave Draft for Profile Edits
  const {
    status: autosaveStatus,
    lastSaved,
    clearDraft,
  } = useAutosave({
    key: "nexus_draft_profile",
    data: { firstName, lastName, dateOfBirth },
    debounceMs: 1500,
    enabled: isEditing && (Boolean(firstName) || Boolean(lastName)),
  });

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  // ---------------------------------------------------------------------------
  // EMAIL CHANGE MODAL STATE (Phone OTP Verification with Enterprise Recovery)
  // ---------------------------------------------------------------------------
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newEmailError, setNewEmailError] = useState<string | null>(null);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailMaskedEmail, setEmailMaskedEmail] = useState("");
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [emailExpiresAt, setEmailExpiresAt] = useState(0);
  const [emailExpiresCountdown, setEmailExpiresCountdown] = useState(0);
  const [emailSessionRestored, setEmailSessionRestored] = useState(false);
  const [emailModalError, setEmailModalError] = useState<string | null>(null);
  const [emailModalLoading, setEmailModalLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // PHONE CHANGE MODAL STATE (Email OTP Verification with Enterprise Recovery)
  // ---------------------------------------------------------------------------
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneMaskedEmail, setPhoneMaskedEmail] = useState("");
  const [phonePendingFull, setPhonePendingFull] = useState("");
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);
  const [phoneExpiresAt, setPhoneExpiresAt] = useState(0);
  const [phoneExpiresCountdown, setPhoneExpiresCountdown] = useState(0);
  const [phoneSessionRestored, setPhoneSessionRestored] = useState(false);
  const [phoneModalError, setPhoneModalError] = useState<string | null>(null);
  const [phoneModalLoading, setPhoneModalLoading] = useState(false);

  // Timers for OTP Resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailResendTimer > 0) {
      timer = setTimeout(() => setEmailResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailResendTimer]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phoneResendTimer > 0) {
      timer = setTimeout(() => setPhoneResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [phoneResendTimer]);

  // Timers for OTP Validity Expiration (5-minute server window)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isEmailModalOpen && emailExpiresAt > 0) {
      const update = () => {
        const diff = Math.max(0, Math.ceil((emailExpiresAt - Date.now()) / 1000));
        setEmailExpiresCountdown(diff);
        if (diff <= 0) {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(SESSION_KEY_EMAIL_CHANGE);
          }
          setEmailModalError("Verification code has expired. Please click 'Resend Code' to dispatch a new one.");
        }
      };
      update();
      interval = setInterval(update, 1000);
    }
    return () => clearInterval(interval);
  }, [isEmailModalOpen, emailExpiresAt]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPhoneModalOpen && phoneExpiresAt > 0) {
      const update = () => {
        const diff = Math.max(0, Math.ceil((phoneExpiresAt - Date.now()) / 1000));
        setPhoneExpiresCountdown(diff);
        if (diff <= 0) {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(SESSION_KEY_PHONE_CHANGE);
          }
          setPhoneModalError("Verification code has expired. Please click 'Resend Code' to dispatch a new one.");
        }
      };
      update();
      interval = setInterval(update, 1000);
    }
    return () => clearInterval(interval);
  }, [isPhoneModalOpen, phoneExpiresAt]);

  // RESTORE PENDING SESSIONS ON PAGE REFRESH (Enterprise Rule)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check for active Email Change session
    try {
      const savedEmail = sessionStorage.getItem(SESSION_KEY_EMAIL_CHANGE);
      if (savedEmail) {
        const parsed = JSON.parse(savedEmail);
        const now = Date.now();
        if (parsed.expiresAt && now < parsed.expiresAt) {
          setNewEmail(parsed.newEmail || "");
          setEmailMaskedEmail(parsed.maskedEmail || "");
          setEmailExpiresAt(parsed.expiresAt);
          const remainingResend = Math.max(0, Math.ceil((parsed.resendAvailableAt - now) / 1000));
          setEmailResendTimer(remainingResend);
          setEmailSessionRestored(true);
          setIsEmailModalOpen(true);
        } else {
          sessionStorage.removeItem(SESSION_KEY_EMAIL_CHANGE);
          toast("Previous email verification session expired.", { icon: "ℹ️" });
        }
      }
    } catch (e) {
      sessionStorage.removeItem(SESSION_KEY_EMAIL_CHANGE);
    }

    // 2. Check for active Phone Change session
    try {
      const savedPhone = sessionStorage.getItem(SESSION_KEY_PHONE_CHANGE);
      if (savedPhone) {
        const parsed = JSON.parse(savedPhone);
        const now = Date.now();
        if (parsed.expiresAt && now < parsed.expiresAt) {
          setPhonePendingFull(parsed.pendingPhone || "");
          setPhoneMaskedEmail(parsed.maskedEmail || "");
          setPhoneExpiresAt(parsed.expiresAt);
          const remainingResend = Math.max(0, Math.ceil((parsed.resendAvailableAt - now) / 1000));
          setPhoneResendTimer(remainingResend);
          setPhoneSessionRestored(true);
          setIsPhoneModalOpen(true);
        } else {
          sessionStorage.removeItem(SESSION_KEY_PHONE_CHANGE);
          toast("Previous phone verification session expired.", { icon: "ℹ️" });
        }
      }
    } catch (e) {
      sessionStorage.removeItem(SESSION_KEY_PHONE_CHANGE);
    }
  }, []);

  // Sync state if user context changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setCountryCode(user.countryCode || "IN");
      setPhoneNumber(user.phoneNumber || "");
      if (user.dateOfBirth) {
        setDateOfBirth(new Date(user.dateOfBirth).toISOString().split("T")[0]);
      }
    }
  }, [user]);

  // ===========================================================================
  // VALIDATION HELPERS
  // ===========================================================================
  const validatePersonalField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "firstName": {
        const v = String(value || "").trim();
        if (!v) return "First name is required.";
        if (v.length < 2) return "First name must be at least 2 characters.";
        if (v.length > 40) return "First name cannot exceed 40 characters.";
        if (!/^[a-zA-Z\s'-]+$/.test(v)) return "First name can only contain letters, spaces, hyphens, and apostrophes.";
        return undefined;
      }
      case "lastName": {
        const v = String(value || "").trim();
        if (!v) return "Last name is required.";
        if (v.length < 1) return "Last name is required.";
        if (v.length > 40) return "Last name cannot exceed 40 characters.";
        if (!/^[a-zA-Z\s'-]+$/.test(v)) return "Last name can only contain letters, spaces, hyphens, and apostrophes.";
        return undefined;
      }
      case "phoneNumber": {
        return validatePhoneNumber(value, countryCode);
      }
      case "dateOfBirth": {
        if (!value) return "Date of birth is required.";
        const d = new Date(value);
        if (isNaN(d.getTime())) return "Please enter a valid date of birth.";
        const now = new Date();
        if (d > now) return "Date of birth cannot be in the future.";
        const ageDiff = now.getTime() - d.getTime();
        const ageYears = ageDiff / (1000 * 60 * 60 * 24 * 365.25);
        if (ageYears < 18) return "Enterprise policy requires personnel to be at least 18 years of age.";
        if (ageYears > 100) return "Please enter a realistic date of birth (maximum 100 years).";
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const handlePersonalBlur = (name: string) => {
    let val: any = "";
    if (name === "firstName") val = firstName;
    else if (name === "lastName") val = lastName;
    else if (name === "phoneNumber") val = phoneNumber;
    else if (name === "dateOfBirth") val = dateOfBirth;

    const err = validatePersonalField(name, val);
    setProfileErrors((prev) => ({
      ...prev,
      [name]: err || "",
    }));
  };

  const validatePwField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "currentPassword":
        return !value ? "Current password is required." : undefined;
      case "newPassword": {
        if (!value) return "Please enter your new password.";
        if (currentPassword && value === currentPassword) {
          return "New password must be different from current password.";
        }
        return validatePassword(value);
      }
      case "confirmNewPassword":
        if (!value) return "Please confirm your new password.";
        if (value !== newPassword) return "Passwords do not match.";
        return undefined;
      default:
        return undefined;
    }
  };

  const handlePwBlur = (name: string) => {
    let val = "";
    if (name === "currentPassword") val = currentPassword;
    else if (name === "newPassword") val = newPassword;
    else if (name === "confirmNewPassword") val = confirmNewPassword;

    const err = validatePwField(name, val);
    setPwErrors((prev) => ({
      ...prev,
      [name]: err || "",
    }));
  };

  // ===========================================================================
  // PROFILE SUBMIT (Detects Phone Number Changes -> Triggers Email OTP)
  // ===========================================================================
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setFormBannerError(null);

    const errs: Record<string, string> = {};
    const fnErr = validatePersonalField("firstName", firstName);
    if (fnErr) errs.firstName = fnErr;
    const lnErr = validatePersonalField("lastName", lastName);
    if (lnErr) errs.lastName = lnErr;
    const phErr = validatePersonalField("phoneNumber", phoneNumber);
    if (phErr) errs.phoneNumber = phErr;
    const dobErr = validatePersonalField("dateOfBirth", dateOfBirth);
    if (dobErr) errs.dateOfBirth = dobErr;

    setProfileErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFormBannerError("Please resolve the highlighted validation errors before submitting.");
      return;
    }

    const isPhoneChanged =
      phoneNumber.trim() !== (user?.phoneNumber || "").trim() ||
      countryCode !== (user?.countryCode || "IN");

    // If phone number is changing, trigger Email OTP Verification Flow
    if (isPhoneChanged) {
      setSavingProfile(true);
      try {
        // First save name/DOB changes if any
        const updatePayload: Record<string, any> = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        };
        if (dateOfBirth) updatePayload.dateOfBirth = dateOfBirth;
        await api.patch("/users/me", updatePayload);

        // Now initiate phone change request
        const res = await api.post("/users/profile/request-phone-change", {
          newCountryCode: countryCode,
          newPhoneNumber: phoneNumber.trim(),
        });

        const masked = res.data.data.maskedEmail;
        const pending = res.data.data.pendingPhone;
        const now = Date.now();
        const expiresAt = now + 5 * 60 * 1000;
        const resendAvailableAt = now + 60 * 1000;

        setPhoneMaskedEmail(masked);
        setPhonePendingFull(pending);
        setPhoneExpiresAt(expiresAt);
        setPhoneExpiresCountdown(300);
        setPhoneResendTimer(60);
        setPhoneOtp("");
        setPhoneModalError(null);
        setPhoneSessionRestored(false);
        setIsPhoneModalOpen(true);

        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            SESSION_KEY_PHONE_CHANGE,
            JSON.stringify({
              pendingPhone: pending,
              maskedEmail: masked,
              requestedAt: now,
              expiresAt,
              resendAvailableAt,
            }),
          );
        }
      } catch (err) {
        const { message, errors } = extractApiError(err);
        if (errors) setProfileErrors((p) => ({ ...p, ...errors }));
        setProfileMsg({ type: "error", text: message });
      } finally {
        setSavingProfile(false);
      }
      return;
    }

    // Normal profile update (no phone number change)
    setSavingProfile(true);
    try {
      const res = await api.patch("/users/me", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth || undefined,
      });
      setUser(res.data.data.user);
      setProfileMsg({ type: "success", text: "Personal information updated successfully." });
      clearDraft();
      setIsEditing(false);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_KEY_IS_EDITING);
      }
    } catch (err) {
      const { message, errors } = extractApiError(err);
      if (errors) setProfileErrors((p) => ({ ...p, ...errors }));
      setProfileMsg({ type: "error", text: message });
    } finally {
      setSavingProfile(false);
    }
  };

  // ===========================================================================
  // EMAIL CHANGE FLOW (Dispatches Phone OTP with Enterprise Session Recovery)
  // ===========================================================================
  const handleCloseEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailOtp("");
    setEmailModalError(null);
    setNewEmailError(null);
    setEmailSessionRestored(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY_EMAIL_CHANGE);
    }
  };

  const handleClosePhoneModal = () => {
    setIsPhoneModalOpen(false);
    setPhoneOtp("");
    setPhoneModalError(null);
    setPhoneSessionRestored(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY_PHONE_CHANGE);
    }
  };

  const handleNewEmailChange = (val: string) => {
    setNewEmail(val);
    if (newEmailError) setNewEmailError(null);
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(SESSION_KEY_EMAIL_CHANGE);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.newEmail = val;
          sessionStorage.setItem(SESSION_KEY_EMAIL_CHANGE, JSON.stringify(parsed));
        } catch (_) {}
      }
    }
  };

  const handleOpenEmailModal = async () => {
    setNewEmail("");
    setNewEmailError(null);
    setEmailOtp("");
    setEmailModalError(null);
    setEmailSessionRestored(false);
    setIsEmailModalOpen(true);

    setEmailModalLoading(true);
    try {
      const res = await api.post("/users/profile/request-email-change");
      const masked = res.data.data.maskedEmail;
      const now = Date.now();
      const expiresAt = now + 5 * 60 * 1000;
      const resendAvailableAt = now + 60 * 1000;

      setEmailMaskedEmail(masked);
      setEmailExpiresAt(expiresAt);
      setEmailExpiresCountdown(300);
      setEmailResendTimer(60);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          SESSION_KEY_EMAIL_CHANGE,
          JSON.stringify({
            newEmail: "",
            maskedEmail: masked,
            requestedAt: now,
            expiresAt,
            resendAvailableAt,
          }),
        );
      }
      toast.success("Verification code sent to your registered email!");
    } catch (err) {
      const { message } = extractApiError(err);
      setEmailModalError(message);
    } finally {
      setEmailModalLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (emailResendTimer > 0) return;
    setEmailModalLoading(true);
    setEmailModalError(null);
    try {
      const res = await api.post("/users/profile/request-email-change");
      const masked = res.data.data.maskedEmail;
      const now = Date.now();
      const expiresAt = now + 5 * 60 * 1000;
      const resendAvailableAt = now + 60 * 1000;

      setEmailMaskedEmail(masked);
      setEmailExpiresAt(expiresAt);
      setEmailExpiresCountdown(300);
      setEmailResendTimer(60);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          SESSION_KEY_EMAIL_CHANGE,
          JSON.stringify({
            newEmail,
            maskedEmail: masked,
            requestedAt: now,
            expiresAt,
            resendAvailableAt,
          }),
        );
      }
      toast.success("New verification code sent to your registered email!");
    } catch (err) {
      const { message } = extractApiError(err);
      setEmailModalError(message);
    } finally {
      setEmailModalLoading(false);
    }
  };

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailModalError(null);

    const emailErr = validateEmail(newEmail);
    if (emailErr) {
      setNewEmailError(emailErr);
      return;
    }
    if (newEmail.trim().toLowerCase() === (user?.email || "").toLowerCase()) {
      setNewEmailError("New email cannot be identical to your current email.");
      return;
    }
    setNewEmailError(null);

    if (!emailOtp || emailOtp.trim().length !== 6) {
      setEmailModalError("Please enter the 6-digit verification code.");
      return;
    }

    setEmailModalLoading(true);
    try {
      const res = await api.post("/users/profile/verify-email-change", {
        otp: emailOtp.trim(),
        newEmail: newEmail.trim().toLowerCase(),
      });
      setUser(res.data.data.user);
      toast.success("Work email updated successfully!");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_KEY_EMAIL_CHANGE);
      }
      setIsEmailModalOpen(false);
      setProfileMsg({ type: "success", text: "Work email updated successfully." });
    } catch (err) {
      const { message } = extractApiError(err);
      setEmailModalError(message);
    } finally {
      setEmailModalLoading(false);
    }
  };

  // ===========================================================================
  // PHONE CHANGE VERIFY FLOW (Email OTP with Enterprise Session Recovery)
  // ===========================================================================
  const handleResendPhoneOtp = async () => {
    if (phoneResendTimer > 0) return;
    setPhoneModalLoading(true);
    setPhoneModalError(null);
    try {
      const res = await api.post("/users/profile/request-phone-change", {
        newCountryCode: countryCode,
        newPhoneNumber: phoneNumber.trim(),
      });
      const masked = res.data.data.maskedEmail;
      const pending = res.data.data.pendingPhone;
      const now = Date.now();
      const expiresAt = now + 5 * 60 * 1000;
      const resendAvailableAt = now + 60 * 1000;

      setPhoneMaskedEmail(masked);
      setPhonePendingFull(pending);
      setPhoneExpiresAt(expiresAt);
      setPhoneExpiresCountdown(300);
      setPhoneResendTimer(60);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          SESSION_KEY_PHONE_CHANGE,
          JSON.stringify({
            pendingPhone: pending,
            maskedEmail: masked,
            requestedAt: now,
            expiresAt,
            resendAvailableAt,
          }),
        );
      }
      toast.success("New verification code sent to your email!");
    } catch (err) {
      const { message } = extractApiError(err);
      setPhoneModalError(message);
    } finally {
      setPhoneModalLoading(false);
    }
  };

  const handleVerifyPhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneModalError(null);

    if (!phoneOtp || phoneOtp.trim().length !== 6) {
      setPhoneModalError("Please enter the 6-digit verification code.");
      return;
    }

    setPhoneModalLoading(true);
    try {
      const res = await api.post("/users/profile/verify-phone-change", {
        otp: phoneOtp.trim(),
      });
      setUser(res.data.data.user);
      toast.success("Phone number updated successfully!");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_KEY_PHONE_CHANGE);
        sessionStorage.removeItem(SESSION_KEY_IS_EDITING);
      }
      setIsPhoneModalOpen(false);
      setIsEditing(false);
      setProfileMsg({ type: "success", text: "Phone number updated successfully." });
    } catch (err) {
      const { message } = extractApiError(err);
      setPhoneModalError(message);
    } finally {
      setPhoneModalLoading(false);
    }
  };

  // ===========================================================================
  // PASSWORD SECURITY SUBMIT
  // ===========================================================================
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    const errs: Record<string, string> = {};
    const cpErr = validatePwField("currentPassword", currentPassword);
    if (cpErr) errs.currentPassword = cpErr;
    const npErr = validatePwField("newPassword", newPassword);
    if (npErr) errs.newPassword = npErr;
    const cnpErr = validatePwField("confirmNewPassword", confirmNewPassword);
    if (cnpErr) errs.confirmNewPassword = cnpErr;

    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingPw(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
        confirmNewPassword,
      });
      toast.success("Password changed successfully! Logging out...");
      setPwMsg({ type: "success", text: "Password changed successfully. Please log in again with your new credentials." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPwErrors({});
      setTimeout(async () => {
        await logout();
        router.push("/login");
      }, 1500);
    } catch (err) {
      const { message, errors } = extractApiError(err);
      if (errors) {
        if (errors.confirmPassword && !errors.confirmNewPassword) {
          errors.confirmNewPassword = errors.confirmPassword;
        }
        setPwErrors(errors);
      }
      setPwMsg({ type: "error", text: message || "Failed to change password." });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* =====================================================================
          FORM 1: PERSONAL INFORMATION
         ===================================================================== */}
      <form
        onSubmit={handleProfileSubmit}
        noValidate
        className="rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 sm:p-8 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-[#4355CC]" />

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[20px] font-black text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-[#4355CC]" /> Personal Information
            </h3>
            <p className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Update your contact details and basic information.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isEditing && (
              <AutosaveBadge status={autosaveStatus} lastSaved={lastSaved} />
            )}
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem(SESSION_KEY_IS_EDITING, "true");
                  }
                }}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[13px] hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#4355CC]" />
                <span>Edit Details</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem(SESSION_KEY_IS_EDITING);
                  }
                  setFirstName(user?.firstName || "");
                  setLastName(user?.lastName || "");
                  setPhoneNumber(user?.phoneNumber || "");
                  setCountryCode(user?.countryCode || "IN");
                  setDateOfBirth(
                    user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
                  );
                  setProfileErrors({});
                  setFormBannerError(null);
                  clearDraft();
                }}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[13px] hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {formBannerError && (
          <div
            role="alert"
            className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 flex items-center gap-3 text-[13.5px] font-bold mb-6 animate-in fade-in duration-150"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{formBannerError}</span>
          </div>
        )}

        {profileMsg && (
          <div
            role="alert"
            className={`p-4 rounded-xl border flex items-center gap-3 text-[13.5px] font-bold mb-6 animate-in fade-in duration-150 ${
              profileMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50"
            }`}
          >
            {profileMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{profileMsg.text}</span>
          </div>
        )}

        {!isEditing ? (
          /* View Mode */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  First Name
                </span>
                <span className="text-[15px] font-bold text-slate-800 dark:text-white">
                  {user?.firstName || "—"}
                </span>
              </div>
              <div>
                <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Last Name
                </span>
                <span className="text-[15px] font-bold text-slate-800 dark:text-white">
                  {user?.lastName || "—"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Work Email
                </span>
                <span className="text-[15px] font-bold text-slate-800 dark:text-white">
                  {user?.email || "—"}
                </span>
              </div>
              <div>
                <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Phone Number
                </span>
                <span className="text-[15px] font-bold text-slate-800 dark:text-white">
                  {user?.phoneNumber ? ((user.dialCode || "+91") && user.phoneNumber.includes(user.dialCode || "+91") ? user.phoneNumber : `${user.dialCode || "+91"} ${user.phoneNumber}`) : "—"}
                </span>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${user?.role !== "admin" ? "sm:grid-cols-2" : "max-w-md"} gap-6`}>
              <div>
                <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Date of Birth
                </span>
                <span className="text-[15px] font-bold text-slate-800 dark:text-white">
                  {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("en-GB") : "—"}
                </span>
              </div>
              {user?.role !== "admin" && (
                <div>
                  <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Employee ID Code
                  </span>
                  <span className="text-[15px] font-bold text-slate-800 dark:text-white">
                    {user?.employeeId || "—"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* First Name */}
              <div>
                <label htmlFor="profile-firstName" className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  First Name <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  id="profile-firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => {
                    const clean = normalizeFirstName(e.target.value);
                    setFirstName(clean);
                    if (profileErrors.firstName) {
                      const liveErr = validateFirstName(clean);
                      setProfileErrors((p) => ({ ...p, firstName: liveErr || "" }));
                    }
                  }}
                  onBlur={() => handlePersonalBlur("firstName")}
                  placeholder="e.g. John"
                  maxLength={40}
                  aria-invalid={Boolean(profileErrors.firstName)}
                  className={`w-full rounded-xl border-2 px-4 py-2.5 text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal outline-none transition-all ${
                    profileErrors.firstName
                      ? "border-red-500 bg-red-50/40 dark:bg-red-950/20 focus:ring-4 focus:ring-red-500/10"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-[#4355CC] focus:ring-4 focus:ring-[#4355CC]/15"
                  }`}
                />
                {profileErrors.firstName && (
                  <p role="alert" className="text-[12px] font-bold text-red-700 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{profileErrors.firstName}</span>
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="profile-lastName" className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Last Name <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  id="profile-lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => {
                    const clean = normalizeName(e.target.value);
                    setLastName(clean);
                    if (profileErrors.lastName) {
                      const liveErr = validateName(clean, "Last name");
                      setProfileErrors((p) => ({ ...p, lastName: liveErr || "" }));
                    }
                  }}
                  onBlur={() => handlePersonalBlur("lastName")}
                  placeholder="e.g. Doe"
                  maxLength={40}
                  aria-invalid={Boolean(profileErrors.lastName)}
                  className={`w-full rounded-xl border-2 px-4 py-2.5 text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal outline-none transition-all ${
                    profileErrors.lastName
                      ? "border-red-500 bg-red-50/40 dark:bg-red-950/20 focus:ring-4 focus:ring-red-500/10"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-[#4355CC] focus:ring-4 focus:ring-[#4355CC]/15"
                  }`}
                />
                {profileErrors.lastName && (
                  <p role="alert" className="text-[12px] font-bold text-red-700 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{profileErrors.lastName}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Work Email with Change Trigger */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300">
                    Work Email <span className="text-slate-500 font-normal">(Verified)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenEmailModal}
                    className="text-[12px] font-bold text-[#4355CC] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Change Email</span>
                  </button>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ""}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 pl-10 pr-4 py-2.5 text-[14px] font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-[11.5px] font-medium text-slate-500">
                  Changing email requires verification code dispatched to your current email.
                </p>
              </div>

              {/* Phone Number Field */}
              <div>
                <PhoneField
                  countryIso={countryCode}
                  phoneNumber={phoneNumber}
                  onCountryChange={setCountryCode}
                  onPhoneChange={(p) => {
                    setPhoneNumber(p);
                    if (profileErrors.phoneNumber) {
                      const liveErr = validatePhoneNumber(p, countryCode);
                      setProfileErrors((prev) => ({ ...prev, phoneNumber: liveErr || "" }));
                    }
                  }}
                  onBlur={() => handlePersonalBlur("phoneNumber")}
                  error={profileErrors.phoneNumber}
                  required
                />
                <p className="mt-1 text-[11.5px] font-medium text-slate-500">
                  Changing phone requires authorization code sent to your registered email.
                </p>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${user?.role !== "admin" ? "sm:grid-cols-2" : "max-w-md"} gap-5`}>
              {/* Date of Birth */}
              <div>
                <label htmlFor="profile-dateOfBirth" className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date of Birth <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="date"
                  id="profile-dateOfBirth"
                  name="dateOfBirth"
                  value={dateOfBirth}
                  onChange={(e) => {
                    setDateOfBirth(e.target.value);
                    if (profileErrors.dateOfBirth) {
                      const liveErr = validateDateOfBirth(e.target.value);
                      setProfileErrors((p) => ({ ...p, dateOfBirth: liveErr || "" }));
                    }
                  }}
                  onBlur={() => handlePersonalBlur("dateOfBirth")}
                  aria-invalid={Boolean(profileErrors.dateOfBirth)}
                  className={`w-full rounded-xl border-2 px-4 py-2.5 text-[14px] font-bold text-slate-900 dark:text-white outline-none transition-all ${
                    profileErrors.dateOfBirth
                      ? "border-red-500 bg-red-50/40 dark:bg-red-950/20 focus:ring-4 focus:ring-red-500/10"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-[#4355CC] focus:ring-4 focus:ring-[#4355CC]/15"
                  }`}
                />
                <p className="text-[11.5px] font-medium text-slate-500 mt-1">
                  Enterprise policy requires personnel to be at least 18 years of age.
                </p>
                {profileErrors.dateOfBirth && (
                  <p role="alert" className="text-[12px] font-bold text-red-700 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{profileErrors.dateOfBirth}</span>
                  </p>
                )}
              </div>

              {/* Employee ID (Only for non-admin employees) */}
              {user?.role !== "admin" && (
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Employee ID Code <span className="text-slate-400 font-normal">(Managed by Admin)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.employeeId || "—"}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 px-4 py-2.5 text-[14px] font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-8 py-3 rounded-xl bg-[#4355CC] hover:bg-[#3644A8] text-white text-[14px] font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* =====================================================================
          FORM 2: SECURITY SETTINGS (PASSWORD UPDATE)
         ===================================================================== */}
      <form
        onSubmit={handlePasswordSubmit}
        noValidate
        className="rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 sm:p-8 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden h-fit"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800" />
        <div className="mb-6">
          <h3 className="text-[20px] font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-800 dark:text-slate-300" /> Security Settings
          </h3>
          <p className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Ensure your EmpSphere account is protected by a strong password.
          </p>
        </div>

        {pwMsg && (
          <div
            role="alert"
            className={`p-4 rounded-xl border flex items-center gap-3 text-[13.5px] font-bold mb-6 animate-in fade-in duration-150 ${
              pwMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50"
            }`}
          >
            {pwMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{pwMsg.text}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Current Password */}
          <div className="max-w-md">
            <label htmlFor="profile-currentPassword" className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Current Password <span className="text-red-600 font-bold">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPw ? "text" : "password"}
                id="profile-currentPassword"
                name="currentPassword"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (pwErrors.currentPassword) {
                    const liveErr = validatePwField("currentPassword", e.target.value);
                    setPwErrors((p) => ({ ...p, currentPassword: liveErr || "" }));
                  }
                }}
                onBlur={() => handlePwBlur("currentPassword")}
                placeholder="Enter your current password"
                aria-invalid={Boolean(pwErrors.currentPassword)}
                className={`w-full rounded-xl border-2 px-4 py-2.5 pr-11 text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal outline-none transition-all ${
                  pwErrors.currentPassword
                    ? "border-red-500 bg-red-50/40 dark:bg-red-950/20 focus:ring-4 focus:ring-red-500/10"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/15"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
                aria-label={showCurrentPw ? "Hide current password" : "Show current password"}
              >
                {showCurrentPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            {pwErrors.currentPassword && (
              <p role="alert" className="mt-1.5 text-[12px] font-bold text-red-700 flex items-center gap-1 animate-in fade-in duration-150">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{pwErrors.currentPassword}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
            {/* New Password */}
            <div>
              <label htmlFor="profile-newPassword" className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                New Password <span className="text-red-600 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  id="profile-newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (pwErrors.newPassword || pwErrors.confirmNewPassword) {
                      const liveErr = validatePwField("newPassword", e.target.value);
                      setPwErrors((p) => ({ ...p, newPassword: liveErr || "" }));
                      if (confirmNewPassword) {
                        const matchErr = e.target.value !== confirmNewPassword ? "Passwords do not match." : "";
                        setPwErrors((p) => ({ ...p, confirmNewPassword: matchErr }));
                      }
                    }
                  }}
                  onBlur={() => handlePwBlur("newPassword")}
                  placeholder="Min 8 characters (aA1@)"
                  aria-invalid={Boolean(pwErrors.newPassword)}
                  className={`w-full rounded-xl border-2 px-4 py-2.5 pr-11 text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal outline-none transition-all ${
                    pwErrors.newPassword
                      ? "border-red-500 bg-red-50/40 dark:bg-red-950/20 focus:ring-4 focus:ring-red-500/10"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/15"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
                  aria-label={showNewPw ? "Hide new password" : "Show new password"}
                >
                  {showNewPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {pwErrors.newPassword && (
                <p role="alert" className="mt-1.5 text-[12px] font-bold text-red-700 flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pwErrors.newPassword}</span>
                </p>
              )}

              {/* Real-time Enterprise Password Strength & Criteria Meter */}
              {newPassword.length > 0 && (() => {
                const strength = getPasswordStrength(newPassword);
                const scoreColors = [
                  "bg-red-500",
                  "bg-rose-500",
                  "bg-amber-500",
                  "bg-blue-500",
                  "bg-emerald-500",
                ];
                const scoreTextColor = [
                  "text-red-600 dark:text-red-400",
                  "text-rose-600 dark:text-rose-400",
                  "text-amber-600 dark:text-amber-400",
                  "text-blue-600 dark:text-blue-400",
                  "text-emerald-600 dark:text-emerald-400",
                ];

                return (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-slate-500" /> Password Security:
                      </span>
                      <span className={`font-black uppercase tracking-wider ${scoreTextColor[strength.score]}`}>
                        {strength.label}
                      </span>
                    </div>

                    {/* 4-Stage Strength Bar */}
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`h-full rounded-full transition-all duration-300 ${
                            strength.score >= step + 1
                              ? scoreColors[strength.score]
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Criteria Pills */}
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {[
                        { label: "8+ chars", met: strength.checks.length },
                        { label: "A-Z", met: strength.checks.uppercase },
                        { label: "a-z", met: strength.checks.lowercase },
                        { label: "0-9", met: strength.checks.number },
                        { label: "Symbol", met: strength.checks.special },
                      ].map((crit, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all ${
                            crit.met
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                              : "bg-slate-200/70 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400"
                          }`}
                        >
                          {crit.met ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />}
                          {crit.label}
                        </span>
                      ))}
                    </div>

                    {currentPassword && newPassword === currentPassword && (
                      <p className="text-[11.5px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Cannot be identical to current password</span>
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="profile-confirmPassword" className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Password <span className="text-red-600 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  id="profile-confirmPassword"
                  name="confirmPassword"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    if (pwErrors.confirmNewPassword) {
                      const liveErr = validatePwField("confirmNewPassword", e.target.value);
                      setPwErrors((p) => ({ ...p, confirmNewPassword: liveErr || "" }));
                    }
                  }}
                  onBlur={() => handlePwBlur("confirmNewPassword")}
                  placeholder="Re-enter new password"
                  aria-invalid={Boolean(pwErrors.confirmNewPassword)}
                  className={`w-full rounded-xl border-2 px-4 py-2.5 pr-11 text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal outline-none transition-all ${
                    pwErrors.confirmNewPassword
                      ? "border-red-500 bg-red-50/40 dark:bg-red-950/20 focus:ring-4 focus:ring-red-500/10"
                      : confirmNewPassword && confirmNewPassword === newPassword
                      ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/15"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
                  aria-label={showConfirmPw ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {pwErrors.confirmNewPassword ? (
                <p role="alert" className="mt-1.5 text-[12px] font-bold text-red-700 flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pwErrors.confirmNewPassword}</span>
                </p>
              ) : confirmNewPassword && confirmNewPassword === newPassword ? (
                <p className="mt-1.5 text-[12px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Passwords match</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="pt-8">
          <button
            type="submit"
            disabled={savingPw}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#1E293B] hover:bg-black text-white text-[14px] font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {savingPw ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating password...</span>
              </>
            ) : (
              <span>Update Security Settings</span>
            )}
          </button>
        </div>
      </form>

      {/* =====================================================================
          SECTION 3: DANGER ZONE & PERMANENT PROFILE DELETION
         ===================================================================== */}
      <div className="rounded-[24px] border border-rose-200/90 dark:border-rose-900/50 bg-white dark:bg-slate-900 p-7 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-rose-600" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-[12.5px] tracking-wider uppercase">
              <ShieldAlert className="w-4.5 h-4.5" />
              <span>Danger Zone</span>
            </div>
            <h3 className="text-[19px] font-black text-slate-900 dark:text-white">
              Permanently Delete Employee Profile
            </h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {isAdminUser(user)
                ? "Administrator and Super Administrator profiles are protected root accounts. Enterprise governance policies prevent self-deletion to maintain system stability and access continuity."
                : "Once you delete your profile, all personal information, HR documents, active login credentials, and session tokens will be permanently erased. You will be safely unassigned from all active sprint deliverables."}
            </p>
          </div>

          <div className="shrink-0">
            {isAdminUser(user) ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[12.5px] font-extrabold border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#5B5FEF]" />
                <span>Admin Profile Protected (Root Governance)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white border border-rose-200 dark:border-rose-900/60 text-[13px] font-bold transition-all shadow-2xs hover:shadow-md cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-rose-500 hover:text-white" />
                <span>Delete My Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Professional Account Deletion Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      {/* =====================================================================
          MODAL 1: EMAIL CHANGE WITH PHONE OTP VERIFICATION
         ===================================================================== */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={handleCloseEmailModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#4355CC] flex items-center justify-center shadow-2xs">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[17px] font-black text-slate-900 dark:text-white">Change Work Email</h4>
                <p className="text-[12px] text-slate-500 font-medium">Verify your email to authorize update</p>
              </div>
            </div>

            {/* Restored Session Notice */}
            {emailSessionRestored && emailExpiresCountdown > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-[12px] font-semibold text-blue-800 dark:text-blue-300 animate-in fade-in duration-150">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  Active Session Restored
                </span>
                <span className="font-mono font-bold">
                  Valid: {Math.floor(emailExpiresCountdown / 60)}m {emailExpiresCountdown % 60}s
                </span>
              </div>
            )}

            {emailModalError && (
              <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 text-[12.5px] font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{emailModalError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyEmailChange} className="space-y-4">
              {/* Info Banner */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-[12.5px] text-indigo-900 dark:text-indigo-200 font-medium space-y-1">
                <p>
                  A 6-digit verification code has been dispatched to your current registered email:
                </p>
                <p className="font-mono font-bold text-[#4355CC] dark:text-indigo-400">
                  {emailMaskedEmail || (user?.email ? `${user.email.slice(0, 3)}••••@${user.email.split("@")[1] || "gmail.com"}` : "—")}
                </p>
              </div>

              {/* New Email Input */}
              <div>
                <label className="block text-[12.5px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Work Email <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => handleNewEmailChange(e.target.value)}
                    placeholder="new.email@company.com"
                    className={`w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl text-[13.5px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all ${
                      newEmailError
                        ? "border-red-500 bg-red-50/30 dark:bg-red-950/20 ring-2 ring-red-500/10"
                        : "border-slate-300 dark:border-slate-700 focus:border-[#4355CC]"
                    }`}
                  />
                </div>
                {newEmailError && (
                  <p className="mt-1 text-[11.5px] font-bold text-red-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{newEmailError}</span>
                  </p>
                )}
              </div>

              {/* OTP Code Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12.5px] font-bold text-slate-700 dark:text-slate-300">
                    6-Digit Email Verification Code <span className="text-red-600 font-bold">*</span>
                  </label>
                  {emailResendTimer > 0 ? (
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Resend in {emailResendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendEmailOtp}
                      disabled={emailModalLoading}
                      className="text-[11.5px] font-bold text-[#4355CC] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Resend Code
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full tracking-[8px] text-center font-mono text-lg font-black py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-[#4355CC] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseEmailModal}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[13px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Discard & Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailModalLoading || emailOtp.length !== 6 || !newEmail}
                  className="flex-1 py-2.5 rounded-xl bg-[#4355CC] hover:bg-[#3644A8] text-white text-[13px] font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {emailModalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Change Email</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: PHONE CHANGE WITH EMAIL OTP VERIFICATION
         ===================================================================== */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={handleClosePhoneModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shadow-2xs">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[17px] font-black text-slate-900 dark:text-white">Verify Phone Number Change</h4>
                <p className="text-[12px] text-slate-500 font-medium">Authorizing change with email verification</p>
              </div>
            </div>

            {/* Restored Session Notice */}
            {phoneSessionRestored && phoneExpiresCountdown > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-[12px] font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-150">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  Active Session Restored
                </span>
                <span className="font-mono font-bold">
                  Valid: {Math.floor(phoneExpiresCountdown / 60)}m {phoneExpiresCountdown % 60}s
                </span>
              </div>
            )}

            {phoneModalError && (
              <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 text-[12.5px] font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{phoneModalError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPhoneChange} className="space-y-4">
              {/* Destination Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 text-[12.5px] text-emerald-900 dark:text-emerald-200 font-medium space-y-1">
                <p>
                  A 6-digit authorization code was sent to your registered email:
                </p>
                <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {phoneMaskedEmail || user?.email}
                </p>
                <p className="pt-1 text-[11.5px] text-slate-500">
                  Pending new phone: <strong>{phonePendingFull || `${countryCode} ${phoneNumber}`}</strong>
                </p>
              </div>

              {/* OTP Code Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12.5px] font-bold text-slate-700 dark:text-slate-300">
                    6-Digit Email Verification Code <span className="text-red-600 font-bold">*</span>
                  </label>
                  {phoneResendTimer > 0 ? (
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Resend in {phoneResendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendPhoneOtp}
                      disabled={phoneModalLoading}
                      className="text-[11.5px] font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Resend Code
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full tracking-[8px] text-center font-mono text-lg font-black py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClosePhoneModal}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[13px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Discard & Cancel
                </button>
                <button
                  type="submit"
                  disabled={phoneModalLoading || phoneOtp.length !== 6}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {phoneModalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Change Phone</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
