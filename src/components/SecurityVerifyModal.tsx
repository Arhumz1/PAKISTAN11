import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Fingerprint, KeyRound, Loader2, Lock, Mail, ShieldCheck, Smartphone, X } from "lucide-react";
import { UserProfile } from "../types";
import {
  confirmPhoneReauthenticationCode,
  initRecaptchaVerifier,
  normalizePhoneNumber,
  reauthenticateWithPassword,
  sendPhoneReauthenticationCode,
} from "../lib/firebase";
import { authenticatePasskeyClient, isEmbeddedIframe } from "../lib/passkey";

interface SecurityVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  title: string;
  subtitle: string;
  user?: UserProfile;
}

type VerificationMethod = "passkey" | "password" | "phone";

/**
 * A real step-up authentication screen for sensitive account changes. It never
 * accepts a locally checked PIN: Firebase re-authentication or WebAuthn must
 * finish successfully before the caller can remove an asset.
 */
export const SecurityVerifyModal: React.FC<SecurityVerifyModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  title,
  subtitle,
  user,
}) => {
  const [method, setMethod] = useState<VerificationMethod>("passkey");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const registeredPhone = normalizePhoneNumber(user?.phoneNumber || user?.mobile || "");
  const passkeyIdentifier = user?.email || user?.cnic || "";

  useEffect(() => {
    if (!isOpen) {
      setMethod("passkey");
      setPassword("");
      setOtpCode("");
      setVerificationId("");
      setIsVerifying(false);
      setErrorMsg("");
      setStatusMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const changeMethod = (nextMethod: VerificationMethod) => {
    setMethod(nextMethod);
    setErrorMsg("");
    setStatusMsg("");
  };

  const completeVerification = () => {
    onVerified();
    onClose();
  };

  const handlePasskey = async () => {
    if (!passkeyIdentifier) {
      setErrorMsg("This account has no email or CNIC available for passkey verification. Use your password or SMS instead.");
      return;
    }
    if (isEmbeddedIframe()) {
      setErrorMsg("Passkey verification requires opening the portal directly in a secure browser window.");
      return;
    }

    setErrorMsg("");
    setStatusMsg("Opening your registered passkey…");
    setIsVerifying(true);
    try {
      const result: any = await authenticatePasskeyClient(passkeyIdentifier, [], setStatusMsg);
      const verifiedUser = result?.user;
      const sameAccount =
        result?.verified &&
        verifiedUser &&
        (verifiedUser.id === user?.id ||
          (!!user?.email && verifiedUser.email?.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
          (!!user?.cnic && verifiedUser.cnic?.replace(/\D/g, "") === user.cnic.replace(/\D/g, "")));

      if (!sameAccount) {
        throw new Error("The passkey belongs to a different account. No changes were made.");
      }
      completeVerification();
    } catch (err: any) {
      setErrorMsg(err?.message || "Passkey verification did not complete. Please try again.");
    } finally {
      setIsVerifying(false);
      setStatusMsg("");
    }
  };

  const handlePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password) {
      setErrorMsg("Enter the password you use to sign in.");
      return;
    }

    setErrorMsg("");
    setIsVerifying(true);
    try {
      await reauthenticateWithPassword(password);
      completeVerification();
    } catch (err: any) {
      setErrorMsg(err?.message || "Password verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendOtp = async () => {
    if (!registeredPhone) {
      setErrorMsg("This account does not have a registered mobile number.");
      return;
    }

    setErrorMsg("");
    setStatusMsg("Sending a Firebase SMS code…");
    setIsVerifying(true);
    try {
      const verifier = initRecaptchaVerifier("security-reauth-recaptcha");
      const id = await sendPhoneReauthenticationCode(registeredPhone, verifier);
      setVerificationId(id);
      setStatusMsg(`A 6-digit code was sent to ${registeredPhone}.`);
    } catch (err: any) {
      setStatusMsg("");
      setErrorMsg(err?.message || "Unable to send the Firebase SMS code. Please try another verification method.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!verificationId) {
      setErrorMsg("Send a Firebase SMS code first.");
      return;
    }
    if (otpCode.trim().length !== 6) {
      setErrorMsg("Enter the six-digit code sent to your phone.");
      return;
    }

    setErrorMsg("");
    setIsVerifying(true);
    try {
      await confirmPhoneReauthenticationCode(verificationId, otpCode);
      completeVerification();
    } catch (err: any) {
      setErrorMsg(err?.message || "That Firebase SMS code could not be verified. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
        <button
          type="button"
          onClick={onClose}
          disabled={isVerifying}
          aria-label="Close verification"
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-3">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
              ACCOUNT RE-VERIFICATION REQUIRED
            </span>
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">{title}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">{subtitle}</p>
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-3">
          Confirm with the same real account credentials used to sign in. There is no separate deletion PIN.
        </p>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl">
          <button type="button" onClick={() => changeMethod("passkey")} className={`py-2 px-1 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition ${method === "passkey" ? "bg-white dark:bg-zinc-900 text-emerald-800 dark:text-emerald-400 shadow-sm" : "text-zinc-500"}`}>
            <Fingerprint className="w-3.5 h-3.5" /><span>Passkey</span>
          </button>
          <button type="button" onClick={() => changeMethod("password")} className={`py-2 px-1 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition ${method === "password" ? "bg-white dark:bg-zinc-900 text-emerald-800 dark:text-emerald-400 shadow-sm" : "text-zinc-500"}`}>
            <KeyRound className="w-3.5 h-3.5" /><span>Password</span>
          </button>
          <button type="button" onClick={() => changeMethod("phone")} className={`py-2 px-1 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition ${method === "phone" ? "bg-white dark:bg-zinc-900 text-emerald-800 dark:text-emerald-400 shadow-sm" : "text-zinc-500"}`}>
            <Smartphone className="w-3.5 h-3.5" /><span>SMS</span>
          </button>
        </div>

        {errorMsg && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</div>}
        {statusMsg && <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{statusMsg}</div>}

        {method === "passkey" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-center space-y-2">
              <Fingerprint className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Use the passkey registered to this account</p>
              <p className="text-[11px] text-zinc-500">Your device will show its normal Face ID, Touch ID, fingerprint, or device-PIN prompt.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={isVerifying} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs">Cancel</button>
              <button type="button" onClick={handlePasskey} disabled={isVerifying} className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-60">{isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}Verify & Delete</button>
            </div>
          </div>
        )}

        {method === "password" && (
          <form onSubmit={handlePassword} className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5"><Mail className="w-4 h-4" />Account password</label>
              <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your sign-in password" className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none" />
              <p className="text-[11px] text-zinc-500">This checks the current Firebase account. The password is not saved.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={isVerifying} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs">Cancel</button>
              <button type="submit" disabled={isVerifying} className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-60">{isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}Verify & Delete</button>
            </div>
          </form>
        )}

        {method === "phone" && (
          <form onSubmit={handleOtp} className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3 text-xs">
              <p className="text-zinc-500">Registered mobile number</p>
              <p className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">{registeredPhone || "Not available"}</p>
              {!verificationId ? <button type="button" onClick={handleSendOtp} disabled={isVerifying} className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition disabled:opacity-60">Send Firebase SMS code</button> : <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))} placeholder="Enter 6-digit code" className="w-full px-3 py-2 text-center text-sm tracking-widest font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none" />}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={isVerifying} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs">Cancel</button>
              {verificationId && <button type="submit" disabled={isVerifying} className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-60">{isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}Verify & Delete</button>}
            </div>
          </form>
        )}

        <div id="security-reauth-recaptcha" />
      </div>
    </div>
  );
};
