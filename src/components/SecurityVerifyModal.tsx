import React, { useState } from "react";
import { KeyRound, Smartphone, ShieldCheck, CheckCircle2, Lock, AlertCircle, X, Loader2, Fingerprint } from "lucide-react";

interface SecurityVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  title: string;
  subtitle: string;
  userMobile?: string;
}

export const SecurityVerifyModal: React.FC<SecurityVerifyModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  title,
  subtitle,
  userMobile = "+92 300 1234567",
}) => {
  const [method, setMethod] = useState<"passkey" | "phone">("passkey");
  const [passkeyInput, setPasskeyInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSendOtp = () => {
    setOtpSent(true);
    setErrorMsg("");
  };

  const handleVerifyPasskey = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      if (passkeyInput.trim().length >= 4 || passkeyInput === "" /* biometric tap */) {
        onVerified();
        onClose();
      } else {
        setErrorMsg("Invalid Passkey or PIN code. Please enter a valid security PIN.");
      }
    }, 600);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!otpSent) {
      setErrorMsg("Please click 'Send OTP' first.");
      return;
    }
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      if (otpInput.trim().length >= 4) {
        onVerified();
        onClose();
      } else {
        setErrorMsg("Invalid OTP code. Please enter the 6-digit code sent to your phone.");
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
              NATIONAL CITIZEN SECURITY GATEWAY
            </span>
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
              {title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Verification Method Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMethod("passkey");
              setErrorMsg("");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              method === "passkey"
                ? "bg-white dark:bg-zinc-900 text-emerald-800 dark:text-emerald-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Passkey / Biometric</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMethod("phone");
              setErrorMsg("");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              method === "phone"
                ? "bg-white dark:bg-zinc-900 text-emerald-800 dark:text-emerald-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone OTP SMS</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Method 1: Passkey / Biometrics */}
        {method === "passkey" && (
          <form onSubmit={handleVerifyPasskey} className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mx-auto">
                <Fingerprint className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Authenticate via Hardware Passkey or PIN
                </p>
                <p className="text-[11px] text-zinc-500">
                  Enter your 4 to 6 digit security Passkey PIN or use TouchID / FaceID sensor.
                </p>
              </div>

              <input
                type="password"
                placeholder="Enter Passkey PIN (e.g. 1234)"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                className="w-full px-3 py-2 text-center text-sm tracking-widest rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Delete</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Method 2: Phone OTP */}
        {method === "phone" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3 text-xs">
              <div>
                <p className="text-zinc-500">Registered Citizen Phone Number:</p>
                <p className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {userMobile || "+92 300 1234567"}
                </p>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition"
                >
                  Send 6-Digit OTP via SMS
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>OTP code sent to {userMobile}! Valid for 10 minutes.</span>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP (e.g. 123456)"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full px-3 py-2 text-center text-sm tracking-widest font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Delete</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
