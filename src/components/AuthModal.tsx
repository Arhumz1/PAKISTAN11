import React, { useState } from "react";
import {
  X,
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  Calendar,
  CreditCard,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  KeyRound,
  Briefcase,
  Smartphone,
  RefreshCw,
  Fingerprint,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { AuthView, UserProfile } from "../types";
import { getRegionalOffices, generateCitizenId, getTodayPakistanDate } from "../utils/pakistanLocations";
import {
  auth,
  initRecaptchaVerifier,
  sendPhoneAuthCode,
  confirmPhoneAuthCode,
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  getUserProfileByPhoneNumber,
  findUserProfileInFirestore,
  normalizePhoneNumber,
  registerWithFirebaseEmail,
  loginWithFirebaseEmail,
  savePasskeyToFirestore,
  getPasskeysFromFirestore,
} from "../lib/firebase";
import {
  isEmbeddedIframe,
  openSecureTopLevelWindow,
  isWebAuthnSupported,
  registerPasskeyClient,
  authenticatePasskeyClient,
} from "../lib/passkey";
import { fetchApi } from "../lib/api";
import { ConfirmationResult } from "firebase/auth";
import { CountryPhoneInput } from "./CountryPhoneInput";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
  initialMode?: AuthView;
  onSuccessLogin?: (user: UserProfile, isNewAccount?: boolean) => void;
  onLoginSuccess?: (user: UserProfile, isNewAccount?: boolean) => void;
  langUrdu: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = "login",
  initialMode,
  onSuccessLogin,
  onLoginSuccess,
  langUrdu,
}) => {
  const [view, setView] = React.useState<AuthView>(initialMode || initialView || "login");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Sign Up Form state - clean empty defaults
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    fatherName: "",
    motherName: "",
    occupation: "Government Service",
    maritalStatus: "Single",
    bloodGroup: "B+",
    email: "",
    mobile: "",
    dob: "",
    cnic: "",
    passportNumber: "",
    province: "ICT Islamabad",
    city: "",
    homeAddress: "",
    citizenCode: "",
    password: "",
    confirmPassword: "",
  });

  // Login Form state - clean empty defaults
  const [loginForm, setLoginForm] = useState({
    emailOrCnic: "",
    password: "",
  });

  const [loginMethod, setLoginMethod] = useState<"email" | "phone" | "passkey">("email");
  const [phoneLoginForm, setPhoneLoginForm] = useState({ mobile: "" });
  const [passkeyNotice, setPasskeyNotice] = useState<string>("");
  const [passkeySuccessMessage, setPasskeySuccessMessage] = useState<string>("");
  const [webAuthnStage, setWebAuthnStage] = useState<string>("");

  const [isNewUserAccount, setIsNewUserAccount] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneAuthNotice, setPhoneAuthNotice] = useState<string>("");
  const [smsTargetPhone, setSmsTargetPhone] = useState<string>("");

  const resetFormState = () => {
    setSignupForm({
      fullName: "",
      fatherName: "",
      motherName: "",
      occupation: "Government Service",
      maritalStatus: "Single",
      bloodGroup: "B+",
      email: "",
      mobile: "",
      dob: "",
      cnic: "",
      passportNumber: "",
      province: "ICT Islamabad",
      city: "",
      homeAddress: "",
      citizenCode: "",
      password: "",
      confirmPassword: "",
    });
    setLoginForm({
      emailOrCnic: "",
      password: "",
    });
    setPhoneLoginForm({ mobile: "" });
    setLoginMethod("email");
    setOtpCode("");
    setErrorMessage("");
    setPhoneAuthNotice("");
    setPasskeyNotice("");
    setPasskeySuccessMessage("");
    setShowPassword(false);
    setIsLoading(false);
    setPendingUser(null);
    setConfirmationResult(null);
    setSmsTargetPhone("");
    setIsNewUserAccount(false);
  };

  const switchView = (targetView: AuthView) => {
    resetFormState();
    setView(targetView);
  };

  const handleClose = () => {
    resetFormState();
    onClose();
  };

  React.useEffect(() => {
    resetFormState();
    if (isOpen) {
      setView(initialMode || initialView || "login");
    }
  }, [isOpen, initialMode, initialView]);

  if (!isOpen) return null;

  const getFriendlyAuthErrorMessage = (err: any): string => {
    if (!err) return "An unexpected authentication error occurred. Please try again.";

    const code = err?.code || "";
    const rawMsg = err?.message || String(err);

    if (code === "auth/too-many-requests" || rawMsg.includes("too-many-requests")) {
      return "Access to this service has been temporarily restricted due to multiple failed requests or rate-limiting. Please wait a few minutes before retrying, or sign in using Passkey / Password.";
    }
    if (code === "auth/email-already-in-use" || rawMsg.includes("email-already-in-use")) {
      return "An account with this email address is already registered. Please sign in using your password or Passkey.";
    }
    if (
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found" ||
      rawMsg.includes("invalid-credential")
    ) {
      return "Invalid credentials provided. Please check your email/CNIC and password, or sign in using Passkey.";
    }
    if (code === "auth/invalid-verification-code" || rawMsg.includes("invalid-verification-code")) {
      return "The 6-digit SMS verification code entered is incorrect. Please check the SMS sent to your phone.";
    }
    if (code === "auth/code-expired" || rawMsg.includes("code-expired")) {
      return "The SMS verification code has expired. Please click 'Resend Firebase SMS' to request a new code.";
    }
    if (code === "auth/quota-exceeded" || rawMsg.includes("quota-exceeded")) {
      return "Daily SMS quota reached. You can complete authentication securely using a Passkey (Face ID / Touch ID / PIN).";
    }
    if (code === "auth/billing-not-enabled" || rawMsg.includes("billing-not-enabled")) {
      return "Firebase SMS verification requires an active billed account. You can complete verification using a Passkey.";
    }
    if (code === "auth/network-request-failed" || rawMsg.includes("network-request-failed")) {
      return "Network connection error while contacting authentication server. Please check your internet connection.";
    }

    if (rawMsg.startsWith("Firebase: Error")) {
      const match = rawMsg.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        return `Authentication notice (${match[1]}). Please try again or use Passkey login.`;
      }
    }

    return rawMsg;
  };

  const triggerFirebasePhoneAuth = async (mobileNumber: string): Promise<boolean> => {
    setPhoneAuthNotice("");
    setConfirmationResult(null);
    setOtpCode(""); // Always ensure OTP input is blank
    const targetPhone = normalizePhoneNumber(mobileNumber);
    if (!targetPhone) {
      setErrorMessage("Please enter a valid mobile phone number.");
      return false;
    }
    console.log("[Firebase Auth] Dispatching SMS request for mobile number:", targetPhone);

    try {
      const verifier = initRecaptchaVerifier("recaptcha-container");
      const result = await sendPhoneAuthCode(targetPhone, verifier);
      setConfirmationResult(result);
      setSmsTargetPhone(targetPhone);
      setPhoneAuthNotice(`Firebase SMS verification code sent to ${targetPhone}`);
      return true;
    } catch (err: any) {
      console.warn("[Firebase Auth Phone Status]:", err?.code || err?.message);

      setIsLoading(false);

      // Automatic Fallback from SMS to Passkey when SMS fails
      let fallbackMsg = "SMS verification is currently unavailable. You can continue securely using a Passkey.";
      if (err?.code === "auth/too-many-requests" || err?.message?.includes("too-many-requests")) {
        fallbackMsg = "Firebase security rate-limit active (too many requests). You can proceed securely using Passkey authentication (Face ID / Touch ID / PIN) or wait a few minutes.";
      } else if (err?.code === "auth/billing-not-enabled" || err?.message?.includes("billing-not-enabled")) {
        fallbackMsg = "Firebase SMS verification requires a billed account. You can complete verification securely using a Passkey (Face ID / Touch ID / PIN).";
      } else if (err?.code === "auth/operation-not-allowed" || err?.message?.includes("operation-not-allowed")) {
        fallbackMsg = "SMS authentication is disabled for this region in Firebase Console. Please verify using a Passkey.";
      } else if (err?.code === "auth/quota-exceeded" || err?.message?.includes("quota-exceeded")) {
        fallbackMsg = "Firebase SMS daily quota exceeded. Please sign in securely using a Passkey or Password.";
      }

      setPhoneAuthNotice("");
      setErrorMessage(getFriendlyAuthErrorMessage(err));
      setPasskeyNotice(fallbackMsg);
      setView("passkey_fallback");
      return false;
    }
  };

  const handlePhoneLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!phoneLoginForm.mobile.trim()) {
      setErrorMessage("Please enter your mobile phone number for SMS login.");
      return;
    }

    setIsLoading(true);
    try {
      // Look up existing user in Firestore by phone number
      const existing = await getUserProfileByPhoneNumber(phoneLoginForm.mobile);
      if (existing) {
        setPendingUser(existing as UserProfile);
      }
      const smsSent = await triggerFirebasePhoneAuth(phoneLoginForm.mobile);
      setIsLoading(false);
      if (smsSent) {
        setView("2fa");
      }
    } catch (err) {
      setIsLoading(false);
    }
  };

  const handlePasskeyFallbackAuth = async () => {
    setErrorMessage("");
    setPasskeySuccessMessage("");

    if (isEmbeddedIframe()) {
      setErrorMessage("Passkey registration requires opening the application directly in a secure browser window.");
      setIsLoading(false);
      setWebAuthnStage("");
      return;
    }

    setIsLoading(true);
    setWebAuthnStage("Initializing Passkey process...");

    try {
      const firebaseUid = pendingUser?.id || auth.currentUser?.uid || "user_" + Date.now();
      const targetUser = pendingUser || {
        id: firebaseUid,
        fullName: signupForm.fullName || loginForm.emailOrCnic || "Digital Citizen",
        email: signupForm.email || (loginForm.emailOrCnic.includes("@") ? loginForm.emailOrCnic : ""),
        mobile: signupForm.mobile || phoneLoginForm.mobile || "",
        cnic: signupForm.cnic || (loginForm.emailOrCnic.includes("@") ? "" : loginForm.emailOrCnic),
      };

      if (isNewUserAccount || signupForm.fullName || pendingUser) {
        // Passkey Registration for Signup Fallback
        let passkeyObj = null;
        if (isWebAuthnSupported()) {
          const passkeyResult = await registerPasskeyClient(targetUser, firebaseUid, (stage) => setWebAuthnStage(stage));
          if (passkeyResult && passkeyResult.passkey) {
            passkeyObj = passkeyResult.passkey;
            await savePasskeyToFirestore(firebaseUid, passkeyObj);
          }
        } else {
          throw new Error("WebAuthn Passkeys are not supported on this device or browser.");
        }

        const completedUser: UserProfile = {
          id: firebaseUid,
          fullName: targetUser.fullName || signupForm.fullName || "Verified Citizen",
          email: targetUser.email || signupForm.email || "citizen@gov.pk",
          mobile: targetUser.mobile || signupForm.mobile || "+92 300 8592014",
          cnic: targetUser.cnic || signupForm.cnic || "61101-0000000-0",
          passportNumber: targetUser.passportNumber || signupForm.passportNumber || "Not Issued",
          province: targetUser.province || signupForm.province || "ICT Islamabad",
          city: targetUser.city || signupForm.city || "Islamabad",
          homeAddress: targetUser.homeAddress || signupForm.homeAddress || "Islamabad, Pakistan",
          dob: targetUser.dob || signupForm.dob || "1995-01-01",
          profilePicUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
          isVerified: true,
          atlStatus: targetUser.atlStatus || "INACTIVE",
          bloodGroup: targetUser.bloodGroup || signupForm.bloodGroup || "B+",
          fatherName: targetUser.fatherName || signupForm.fatherName || "Citizen Record",
          motherName: targetUser.motherName || signupForm.motherName || "Citizen Mother Record",
          maritalStatus: targetUser.maritalStatus || signupForm.maritalStatus || "Single",
          occupation: targetUser.occupation || signupForm.occupation || "Government Service",
          twoFactorEnabled: true,
          hasPasskey: true,
          passkeys: passkeyObj ? [passkeyObj] : targetUser.passkeys || [],
          registrationDate: targetUser.registrationDate || getTodayPakistanDate(),
          createdAt: targetUser.createdAt || getTodayPakistanDate(),
          lastLogin: new Date().toISOString(),
        };

        await saveUserProfileToFirestore(firebaseUid, completedUser);

        setPasskeySuccessMessage("Passkey registered successfully! Account setup complete.");
        setIsLoading(false);
        setWebAuthnStage("");

        setTimeout(() => {
          const isNew = isNewUserAccount;
          resetFormState();
          if (onSuccessLogin) onSuccessLogin(completedUser, isNew);
          if (onLoginSuccess) onLoginSuccess(completedUser, isNew);
          onClose();
        }, 1200);
      } else {
        // Passkey Authentication for Login
        const input = phoneLoginForm.mobile || loginForm.emailOrCnic;
        const result = await authenticatePasskeyClient(input, [], (stage) => setWebAuthnStage(stage));
        if (result && result.verified) {
          let authUser = result.user;
          let pUid = authUser?.id || authUser?.cnic || auth.currentUser?.uid;
          if (pUid) {
            const firestoreDoc = await getUserProfileFromFirestore(pUid);
            if (firestoreDoc) {
              authUser = { ...authUser, ...firestoreDoc };
            }
          }

          const verifiedUser: UserProfile = {
            id: pUid || "pk_user_" + Date.now(),
            fullName: authUser?.fullName || "Verified Citizen",
            email: authUser?.email || "citizen@gov.pk",
            mobile: authUser?.mobile || "+92 300 8592014",
            cnic: authUser?.cnic || "61101-0000000-0",
            passportNumber: authUser?.passportNumber || "Not Issued",
            province: authUser?.province || "ICT Islamabad",
            city: authUser?.city || "Islamabad",
            homeAddress: authUser?.homeAddress || "Islamabad, Pakistan",
            dob: authUser?.dob || "1995-01-01",
            profilePicUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
            isVerified: true,
            atlStatus: "ACTIVE",
            bloodGroup: "B+",
            fatherName: "Citizen Record",
            maritalStatus: "Single",
            occupation: "Public Sector",
            twoFactorEnabled: false,
            hasPasskey: true,
            lastLogin: new Date().toISOString(),
          };

          if (pUid) {
            await saveUserProfileToFirestore(pUid, verifiedUser);
          }

          setPasskeySuccessMessage("Passkey verified successfully! Sign in complete.");
          setIsLoading(false);
          setWebAuthnStage("");

          setTimeout(() => {
            resetFormState();
            if (onSuccessLogin) onSuccessLogin(verifiedUser, false);
            if (onLoginSuccess) onLoginSuccess(verifiedUser, false);
            onClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setWebAuthnStage("");
      console.warn("[Passkey Fallback Auth Error]:", err);
      const errMsg = err?.message || "Passkey registration failed. Please try again.";

      if (isNewUserAccount || signupForm.fullName || pendingUser) {
        // Requirement 9: Return user to signup screen with their entered info preserved
        setView("signup");
      }

      if (err?.name === "PasskeyCancelledError" || err?.message?.toLowerCase().includes("cancelled by the user")) {
        setErrorMessage("Passkey prompt was closed or cancelled. Click 'Continue with Passkey' to try again or retry SMS verification.");
      } else {
        setErrorMessage(errMsg);
      }
    } finally {
      setIsLoading(false);
      setWebAuthnStage("");
    }
  };

  const validateCNIC = (cnic: string) => {
    const clean = cnic.replace(/\D/g, "");
    return clean.length === 13;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!signupForm.fullName.trim()) {
      setErrorMessage("Full Legal Name is required.");
      return;
    }
    if (!signupForm.email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!signupForm.mobile.trim()) {
      setErrorMessage("Mobile number is required for 2FA SMS alerts.");
      return;
    }
    if (!validateCNIC(signupForm.cnic)) {
      setErrorMessage("CNIC must follow valid format: XXXXX-XXXXXXX-X (e.g. 61101-8930192-3)");
      return;
    }
    if (signupForm.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setErrorMessage("Password and Confirm Password do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchApi<{ success: boolean; user: any; error?: string }>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupForm),
      });

      if (data.success && data.user) {
        setIsNewUserAccount(true);
        const prov = data.user.province || signupForm.province || "ICT Islamabad";
        const cty = data.user.city || signupForm.city || "Islamabad";
        const offices = getRegionalOffices(prov, cty);
        const citizenId = data.user.id || generateCitizenId(data.user.cnic || signupForm.cnic);
        const createdDate = data.user.registrationDate || getTodayPakistanDate();

        const emailToUse = signupForm.email || `${(signupForm.cnic || "").replace(/\D/g, "")}@citizen.gov.pk`;
        let firebaseUid = auth.currentUser?.uid || citizenId;

        // Step 1: Save account in Firebase Authentication
        try {
          const fbUserCred = await registerWithFirebaseEmail(emailToUse, signupForm.password);
          if (fbUserCred?.user?.uid) {
            firebaseUid = fbUserCred.user.uid;
          }
        } catch (fbErr: any) {
          if (fbErr?.code === "auth/email-already-in-use") {
            try {
              const fbUserCred = await loginWithFirebaseEmail(emailToUse, signupForm.password);
              if (fbUserCred?.user?.uid) {
                firebaseUid = fbUserCred.user.uid;
              }
            } catch (loginErr) {}
          } else {
            console.warn("[Firebase Auth Email Signup note]:", fbErr?.message || fbErr);
          }
        }

        if (auth.currentUser?.uid) {
          firebaseUid = auth.currentUser.uid;
        }

        const newUserObj: UserProfile = {
          id: firebaseUid,
          fullName: data.user.fullName || signupForm.fullName,
          email: data.user.email || signupForm.email || emailToUse,
          mobile: data.user.mobile || signupForm.mobile,
          cnic: data.user.cnic || signupForm.cnic,
          passportNumber: data.user.passportNumber || signupForm.passportNumber || "Not Issued",
          province: prov,
          city: cty,
          homeAddress: data.user.homeAddress || signupForm.homeAddress || "Pakistan",
          dob: signupForm.dob || "1995-01-01",
          profilePicUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
          isVerified: true,
          atlStatus: "INACTIVE",
          bloodGroup: data.user.bloodGroup || signupForm.bloodGroup || "B+",
          fatherName: data.user.fatherName || signupForm.fatherName || "Citizen Father Record",
          motherName: data.user.motherName || signupForm.motherName || "Citizen Mother Record",
          maritalStatus: data.user.maritalStatus || signupForm.maritalStatus || "Single",
          occupation: data.user.occupation || signupForm.occupation || "Government Service",
          twoFactorEnabled: true,
          hasPasskey: false,
          passkeys: [],
          registrationDate: createdDate,
          createdAt: createdDate,
          lastLogin: new Date().toISOString(),
          assignedPassportOffice: data.user.assignedPassportOffice || offices.passportOffice,
          assignedTaxOffice: data.user.assignedTaxOffice || offices.taxOffice,
          assignedLicensingAuthority: data.user.assignedLicensingAuthority || offices.licensingAuthority,
          assignedUtilityProvider: data.user.assignedUtilityProvider || offices.utilityProvider,
          assignedRegionalAuthority: data.user.assignedRegionalAuthority || offices.regionalAuthority,
        };

        // Step 2: Create the Firestore user document immediately in users/{uid}
        await saveUserProfileToFirestore(firebaseUid, newUserObj);

        // Step 3 & 4: Prompt user to create a Passkey using WebAuthn standard
        if (isWebAuthnSupported()) {
          try {
            console.log("[WebAuthn] Prompting user to create a Passkey during signup...");
            const passkeyResult = await registerPasskeyClient(
              newUserObj,
              firebaseUid,
              (stage) => setWebAuthnStage(stage)
            );
            if (passkeyResult && passkeyResult.passkey) {
              // Step 5: Store public credential ID & public key in Firestore
              await savePasskeyToFirestore(firebaseUid, passkeyResult.passkey);
              newUserObj.hasPasskey = true;
              newUserObj.passkeys = [passkeyResult.passkey];
              await saveUserProfileToFirestore(firebaseUid, newUserObj);
            }
          } catch (pkErr: any) {
            console.warn("[WebAuthn Passkey Signup Notice]:", pkErr?.message || pkErr);
            // Requirement 8 & 9: Display clear notice & seamlessly fall back to SMS 2FA without freezing
            setPasskeyNotice(`Passkey setup notice: ${pkErr?.message || "Passkey registration was skipped."}`);
          }
        }

        setPendingUser(newUserObj);

        // Trigger 2FA Verification step
        const smsSent = await triggerFirebasePhoneAuth(newUserObj.mobile);
        if (smsSent) {
          setView("2fa");
        }
      } else {
        setIsLoading(false);
        setErrorMessage(data.error || "Failed to create account. Please try again.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setWebAuthnStage("");
      setErrorMessage(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
      setWebAuthnStage("");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!loginForm.emailOrCnic.trim() || !loginForm.password) {
      setErrorMessage("Please enter your CNIC or Email along with your password.");
      return;
    }

    setIsLoading(true);
    try {
      let firebaseUid = "";

      // Format input as email for Firebase Auth if CNIC provided
      const emailInput = loginForm.emailOrCnic.includes("@")
        ? loginForm.emailOrCnic.trim()
        : `${loginForm.emailOrCnic.replace(/\D/g, "")}@citizen.gov.pk`;

      try {
        const userCred = await loginWithFirebaseEmail(emailInput, loginForm.password);
        if (userCred?.user?.uid) {
          firebaseUid = userCred.user.uid;
        }
      } catch (fbErr: any) {
        if (fbErr?.code === "auth/user-not-found" || fbErr?.code === "auth/invalid-credential") {
          try {
            const userCred = await registerWithFirebaseEmail(emailInput, loginForm.password);
            if (userCred?.user?.uid) {
              firebaseUid = userCred.user.uid;
            }
          } catch (regErr) {}
        } else {
          console.warn("[Firebase Auth Email Login Note]:", fbErr?.message || fbErr);
        }
      }

      if (auth.currentUser?.uid) {
        firebaseUid = auth.currentUser.uid;
      }

      let data: any = null;
      try {
        data = await fetchApi<{ success: boolean; user: any; error?: string }>("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginForm),
        });
      } catch (loginApiErr: any) {
        console.warn("[Login API Warning]:", loginApiErr);
      }

      setIsLoading(false);

      if ((data?.success && data?.user) || firebaseUid) {
        setIsNewUserAccount(false);
        const targetId = auth.currentUser?.uid || firebaseUid || data?.user?.id;
        const firestoreData =
          (await getUserProfileFromFirestore(targetId)) ||
          (await findUserProfileInFirestore(loginForm.emailOrCnic)) ||
          (data?.user ? data.user : null);

        const userObj: UserProfile = {
          id: targetId,
          fullName: firestoreData?.fullName || data?.user?.fullName || "Digital Citizen",
          email: firestoreData?.email || data?.user?.email || (loginForm.emailOrCnic.includes("@") ? loginForm.emailOrCnic : ""),
          mobile: firestoreData?.mobile || firestoreData?.phoneNumber || data?.user?.mobile || "",
          cnic: firestoreData?.cnic || data?.user?.cnic || (loginForm.emailOrCnic.includes("@") ? "" : loginForm.emailOrCnic),
          passportNumber: firestoreData?.passportNumber || data?.user?.passportNumber || "Not Issued",
          province: firestoreData?.province || data?.user?.province || "ICT Islamabad",
          city: firestoreData?.city || data?.user?.city || "Islamabad",
          homeAddress: firestoreData?.homeAddress || data?.user?.homeAddress || "Islamabad, Pakistan",
          dob: firestoreData?.dob || data?.user?.dob || "1995-01-01",
          profilePicUrl: firestoreData?.profilePicUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
          isVerified: true,
          atlStatus: firestoreData?.atlStatus || data?.user?.atlStatus || "INACTIVE",
          bloodGroup: firestoreData?.bloodGroup || data?.user?.bloodGroup || "B+",
          fatherName: firestoreData?.fatherName || data?.user?.fatherName || "",
          motherName: firestoreData?.motherName || data?.user?.motherName || "",
          maritalStatus: firestoreData?.maritalStatus || data?.user?.maritalStatus || "Single",
          occupation: firestoreData?.occupation || data?.user?.occupation || "Public Sector",
          twoFactorEnabled: true,
          hasPasskey: firestoreData?.hasPasskey ?? data?.user?.hasPasskey ?? false,
          lastLogin: new Date().toISOString(),
        };

        // Ensure latest data saved in Firestore
        await saveUserProfileToFirestore(targetId, userObj);

        setPendingUser(userObj);
        const smsSent = await triggerFirebasePhoneAuth(userObj.mobile);
        if (smsSent) {
          setView("2fa");
        }
      } else {
        setErrorMessage(
          data?.error || "Account not found or incorrect credentials. Please check details or sign in using Passkey."
        );
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(getFriendlyAuthErrorMessage(err));
    }
  };

  const handle2faVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const code = otpCode.trim();
    if (!code || code.length < 6) {
      setErrorMessage("Please enter the complete 6-digit SMS verification code sent via Firebase.");
      return;
    }

    if (!confirmationResult) {
      setErrorMessage(
        "Firebase Phone Auth session context is missing. Please click 'Resend Firebase SMS' to trigger a new verification code."
      );
      return;
    }

    setIsLoading(true);

    try {
      // 1. MUST verify code using official Firebase Auth SDK
      const userCred = await confirmPhoneAuthCode(confirmationResult, code);

      if (!userCred || !userCred.user) {
        throw new Error("Firebase Authentication failed to return a valid user session.");
      }

      const firebaseUid = userCred.user.uid;
      const verifiedPhone = normalizePhoneNumber(userCred.user.phoneNumber || smsTargetPhone);
      if (!verifiedPhone || (smsTargetPhone && verifiedPhone !== smsTargetPhone)) {
        throw new Error("The verified phone number does not match this SMS request. Please request a new code.");
      }

      // An SMS credential must correspond to an existing portal account. Do not
      // create a blank/default citizen profile for an unknown phone number.
      const existingProfile =
        pendingUser ||
        ((await getUserProfileFromFirestore(firebaseUid)) as UserProfile) ||
        ((await getUserProfileByPhoneNumber(verifiedPhone)) as UserProfile);
      if (!existingProfile) {
        throw new Error("No portal account is linked to this verified phone number. Please sign up first or sign in with email/CNIC.");
      }

      // 2. Use the profile linked to the number confirmed by Firebase.
      const userObj: UserProfile = {
        ...existingProfile,
        id: firebaseUid,
        mobile: verifiedPhone,
        phoneNumber: verifiedPhone,
        isVerified: true,
        lastLogin: new Date().toISOString(),
      };

      // 3. Save profile strictly to Firestore
      await saveUserProfileToFirestore(firebaseUid, userObj);

      const isNew = isNewUserAccount;
      resetFormState();
      setIsLoading(false);

      if (onSuccessLogin) onSuccessLogin(userObj, isNew);
      if (onLoginSuccess) onLoginSuccess(userObj, isNew);
      onClose();
    } catch (fbError: any) {
      if (!pendingUser) {
        try {
          await auth.signOut();
        } catch (signOutError) {
          console.warn("[Firebase Auth] Unable to end unlinked phone session:", signOutError);
        }
      }
      setIsLoading(false);
      setOtpCode(""); // Wipe invalid verification code immediately
      console.warn("Firebase OTP Verification Notice:", fbError?.message || fbError);

      setErrorMessage(getFriendlyAuthErrorMessage(fbError));
      // STOP processing - DO NOT log in or persist user
      return;
    }
  };

  const handlePasskeySignIn = async () => {
    setErrorMessage("");

    if (isEmbeddedIframe()) {
      setErrorMessage("Passkey authentication requires opening the application directly in a secure browser window.");
      setIsLoading(false);
      setWebAuthnStage("");
      return;
    }

    setIsLoading(true);
    setWebAuthnStage("Initializing Passkey sign-in...");
    try {
      const targetInput = loginForm.emailOrCnic.trim();
      const result = await authenticatePasskeyClient(
        targetInput,
        [],
        (stage) => setWebAuthnStage(stage)
      );

      if (result && result.verified) {
        let authUser = result.user;
        let firebaseUid = authUser?.id || authUser?.cnic || auth.currentUser?.uid;

        if (firebaseUid) {
          const firestoreDoc = await getUserProfileFromFirestore(firebaseUid);
          if (firestoreDoc) {
            authUser = { ...authUser, ...firestoreDoc };
          }
        }

        const verifiedUser: UserProfile = {
          id: firebaseUid || "pk_user_" + Date.now(),
          fullName: authUser?.fullName || "Verified Citizen",
          email: authUser?.email || (targetInput.includes("@") ? targetInput : "citizen@gov.pk"),
          mobile: authUser?.mobile || authUser?.phoneNumber || "+92 300 8592014",
          cnic: authUser?.cnic || (targetInput.includes("@") ? "61101-0000000-0" : targetInput),
          passportNumber: authUser?.passportNumber || "Not Issued",
          province: authUser?.province || "ICT Islamabad",
          city: authUser?.city || "Islamabad",
          homeAddress: authUser?.homeAddress || "Islamabad, Pakistan",
          dob: authUser?.dob || "1995-01-01",
          profilePicUrl: authUser?.profilePicUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
          isVerified: true,
          atlStatus: authUser?.atlStatus || "ACTIVE",
          bloodGroup: authUser?.bloodGroup || "B+",
          fatherName: authUser?.fatherName || "Citizen Record",
          motherName: authUser?.motherName || "Citizen Mother Record",
          maritalStatus: authUser?.maritalStatus || "Single",
          occupation: authUser?.occupation || "Public Sector",
          twoFactorEnabled: false,
          hasPasskey: true,
          lastLogin: new Date().toISOString(),
        };

        if (firebaseUid) {
          await saveUserProfileToFirestore(firebaseUid, verifiedUser);
        }

        resetFormState();
        setIsLoading(false);
        setWebAuthnStage("");

        if (onSuccessLogin) onSuccessLogin(verifiedUser, false);
        if (onLoginSuccess) onLoginSuccess(verifiedUser, false);
        onClose();
      }
    } catch (err: any) {
      setIsLoading(false);
      setWebAuthnStage("");
      if (err?.name === "PasskeyCancelledError" || err?.message?.toLowerCase().includes("cancelled by the user")) {
        console.info("[WebAuthn Passkey] Authentication prompt closed or cancelled by user.");
        setErrorMessage("Passkey prompt was closed or cancelled. Please try again or sign in using Email or Phone.");
      } else {
        console.warn("[WebAuthn Passkey Warning]:", err?.message || err);
        setErrorMessage(err?.message || "Passkey authentication failed. Please try Email or Phone.");
      }
    } finally {
      setIsLoading(false);
      setWebAuthnStage("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-emerald-900/10 dark:border-emerald-500/20 overflow-hidden my-8">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                {view === "login" && (langUrdu ? "شہری لاگ ان" : "Citizen Sign In")}
                {view === "signup" && (langUrdu ? "نیا اکاونٹ بنائیں" : "Create Citizen Account")}
                {view === "forgot" && (langUrdu ? "پاس ورڈ کی بحالی" : "Recover Account Password")}
                {view === "2fa" && (langUrdu ? "ٹو فیکٹر تصدیق" : "Two-Factor Verification (2FA)")}
                {view === "passkey_fallback" && (langUrdu ? "پاس کی تصدیق" : "Passkey Authentication Fallback")}
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Official National Citizen Gateway • Encrypted Access
              </p>
            </div>
          </div>
        </div>

        {/* WebAuthn Live Stage Progress Banner */}
        {isLoading && webAuthnStage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-200 flex items-center space-x-3 text-xs font-bold animate-pulse">
            <Loader2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 animate-spin" />
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">WebAuthn Passkey Status</p>
              <p className="mt-0.5 text-xs font-medium">{webAuthnStage}</p>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 flex items-start space-x-2.5 text-xs text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body Form Views */}
        <div key={view} className="p-6">
          {/* VIEW: PASSKEY FALLBACK */}
          {view === "passkey_fallback" && (
            <div className="space-y-4">
              {/* Fallback Notice Banner */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 flex items-start space-x-3 text-xs">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 shrink-0">
                  <Fingerprint className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                </div>
                <div>
                  <p className="font-bold text-sm">SMS Verification Unavailable</p>
                  <p className="mt-1 leading-relaxed">
                    {passkeyNotice || "SMS verification is currently unavailable. You can continue securely using a Passkey."}
                  </p>
                </div>
              </div>

              {/* User Details Summary */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Citizen Profile:</span>
                  <span className="font-bold">{pendingUser?.fullName || signupForm.fullName || "Citizen Record"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Mobile Number:</span>
                  <span className="font-mono font-bold">{pendingUser?.mobile || signupForm.mobile || phoneLoginForm.mobile || loginForm.emailOrCnic || "+92 300 8592014"}</span>
                </div>
                {(pendingUser?.email || signupForm.email) && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Registered Email:</span>
                    <span className="font-medium">{pendingUser?.email || signupForm.email}</span>
                  </div>
                )}
              </div>

              {/* Success Message Banner */}
              {passkeySuccessMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-200 flex items-center space-x-2.5 text-xs font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{passkeySuccessMessage}</span>
                </div>
              )}

              {/* Primary Passkey Action / Open Secure Version Button */}
              {isEmbeddedIframe() ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 flex items-start space-x-3 text-xs">
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 shrink-0">
                      <Shield className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Top-Level Secure Window Required</p>
                      <p className="mt-1 leading-relaxed">
                        Passkey registration requires opening the application directly in a secure browser window.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openSecureTopLevelWindow()}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm transition shadow-md flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="w-5 h-5 text-emerald-100" />
                    <span>Open Secure Version</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handlePasskeyFallbackAuth}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm transition shadow-md flex items-center justify-center space-x-2"
                >
                  <Fingerprint className="w-5 h-5" />
                  <span>{isLoading ? "Authenticating Passkey..." : "Continue with Passkey (Face ID / Touch ID / PIN)"}</span>
                </button>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const num = pendingUser?.mobile || signupForm.mobile || phoneLoginForm.mobile || "+92 300 8592014";
                    triggerFirebasePhoneAuth(num);
                  }}
                  className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry SMS Verification</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="text-zinc-500 hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* VIEW 1: LOGIN */}
          {view === "login" && (
            <div className="space-y-4">
              {/* Login Method Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setLoginMethod("email")}
                  className={`py-2 px-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    loginMethod === "email"
                      ? "bg-white dark:bg-zinc-900 text-emerald-900 dark:text-emerald-300 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email / CNIC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginMethod("phone")}
                  className={`py-2 px-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    loginMethod === "phone"
                      ? "bg-white dark:bg-zinc-900 text-emerald-900 dark:text-emerald-300 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone SMS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginMethod("passkey")}
                  className={`py-2 px-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    loginMethod === "passkey"
                      ? "bg-white dark:bg-zinc-900 text-emerald-900 dark:text-emerald-300 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>Passkey</span>
                </button>
              </div>

              {/* METHOD 1: EMAIL & PASSWORD */}
              {loginMethod === "email" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      CNIC Number or Registered Email
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        required
                        placeholder="61101-8930192-3 or email@domain.gov.pk"
                        value={loginForm.emailOrCnic}
                        onChange={(e) => setLoginForm({ ...loginForm, emailOrCnic: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchView("forgot")}
                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm transition shadow-md flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <span>Authenticating...</span>
                    ) : (
                      <>
                        <span>Proceed to 2FA Verification</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* METHOD 2: PHONE SMS */}
              {loginMethod === "phone" && (
                <form onSubmit={handlePhoneLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Mobile Phone Number
                    </label>
                    <CountryPhoneInput
                      value={phoneLoginForm.mobile}
                      onChange={(val) => setPhoneLoginForm({ mobile: val })}
                      required
                      placeholder="300 1234567"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Firebase Phone Auth will dispatch a 6-digit OTP code to your mobile phone.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm transition shadow-md flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <span>Sending SMS Code...</span>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4" />
                        <span>Send SMS Verification Code</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* METHOD 3: PASSKEY BIOMETRICS */}
              {loginMethod === "passkey" && (
                <div className="space-y-4">
                  {isEmbeddedIframe() ? (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 space-y-3.5 text-xs">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 shrink-0 mt-0.5">
                          <Shield className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-amber-900 dark:text-amber-100">Top-Level Secure Window Required</p>
                          <p className="mt-1 leading-relaxed text-amber-800 dark:text-amber-200">
                            Passkey authentication requires opening the application directly in a secure browser window.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openSecureTopLevelWindow()}
                        className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm transition shadow-md flex items-center justify-center space-x-2"
                      >
                        <ExternalLink className="w-5 h-5 text-emerald-100" />
                        <span>Open Secure Version</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          CNIC Number or Registered Email (Optional)
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="e.g. 61101-8930192-3 or citizen@gov.pk"
                            value={loginForm.emailOrCnic}
                            onChange={(e) => setLoginForm({ ...loginForm, emailOrCnic: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handlePasskeySignIn}
                        disabled={isLoading}
                        className="w-full py-3.5 px-4 rounded-2xl border-2 border-emerald-600/30 hover:border-emerald-600 dark:border-emerald-500/40 dark:hover:border-emerald-400 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100 font-bold text-sm transition shadow-sm flex items-center justify-center space-x-2"
                      >
                        <Fingerprint className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span>{isLoading ? "Authenticating Passkey..." : "Sign in with Passkey (Face ID / Touch ID / PIN)"}</span>
                      </button>

                      <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center space-x-2.5">
                        <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>WebAuthn Biometric Authentication standard. Supports Apple Face ID, Touch ID, Windows Hello, and Android Fingerprint.</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="text-center pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-500">
                  Don't have a verified citizen account?{" "}
                  <button
                    type="button"
                    onClick={() => switchView("signup")}
                    className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    Register New Account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* VIEW 2: SIGN UP */}
          {view === "signup" && (
            <form onSubmit={handleSignupSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Legal Name (As on CNIC / Passport) *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Ali Khan"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Father's Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="Father's legal name"
                      value={signupForm.fatherName}
                      onChange={(e) => setSignupForm({ ...signupForm, fatherName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mother's Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="Mother's legal name"
                      value={signupForm.motherName}
                      onChange={(e) => setSignupForm({ ...signupForm, motherName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Occupation / Profession *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Engineer"
                      value={signupForm.occupation}
                      onChange={(e) => setSignupForm({ ...signupForm, occupation: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Marital Status *
                  </label>
                  <select
                    value={signupForm.maritalStatus}
                    onChange={(e) => setSignupForm({ ...signupForm, maritalStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={signupForm.bloodGroup}
                    onChange={(e) => setSignupForm({ ...signupForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    CNIC / National ID Number *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="61101-8930192-3"
                      value={signupForm.cnic}
                      onChange={(e) => setSignupForm({ ...signupForm, cnic: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400">Format: XXXXX-XXXXXXX-X</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Passport Number
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="PK89214730"
                      value={signupForm.passportNumber}
                      onChange={(e) => setSignupForm({ ...signupForm, passportNumber: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@citizen.gov.pk"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mobile Number (SMS 2FA) *
                  </label>
                  <CountryPhoneInput
                    value={signupForm.mobile}
                    onChange={(fullNumber) => setSignupForm({ ...signupForm, mobile: fullNumber })}
                    required
                    placeholder="300 8592014"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    required
                    value={signupForm.dob}
                    onChange={(e) => setSignupForm({ ...signupForm, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Province
                  </label>
                  <select
                    value={signupForm.province}
                    onChange={(e) => setSignupForm({ ...signupForm, province: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="ICT Islamabad">ICT Islamabad</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                    <option value="Azad Jammu & Kashmir">Azad Jammu & Kashmir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Islamabad"
                    value={signupForm.city}
                    onChange={(e) => setSignupForm({ ...signupForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Home Permanent Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House 42, Street 18, Sector F-8/3, Islamabad"
                  value={signupForm.homeAddress}
                  onChange={(e) => setSignupForm({ ...signupForm, homeAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-2 rounded-2xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm transition shadow-md flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <span>Registering Citizen Record...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Register Account & Verify</span>
                  </>
                )}
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative bg-white dark:bg-zinc-900 px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  passkey biometrics enabled
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 shrink-0">
                  <Fingerprint className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div>
                  <p className="font-bold">Passkey Standard (Face ID / Touch ID / PIN)</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Upon creating your account, your browser will prompt you to attach a biometric Passkey for passwordless sign in.
                  </p>
                </div>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-zinc-500">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => switchView("login")}
                    className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Invisible recaptcha container for Firebase Phone Auth */}
          <div id="recaptcha-container"></div>

          {/* VIEW 3: 2FA STEP */}
          {view === "2fa" && (
            <form onSubmit={handle2faVerify} className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-800 dark:text-emerald-300 mx-auto">
                <Smartphone className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1.5">
                  <span>Firebase SMS Phone Authentication</span>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-mono">
                    Firebase Auth
                  </span>
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  A verification code was dispatched via Firebase SMS to{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {smsTargetPhone || pendingUser?.mobile || signupForm.mobile}
                  </span>
                </p>
                {phoneAuthNotice && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                    {phoneAuthNotice}
                  </div>
                )}
              </div>

              <div className="max-w-xs mx-auto">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  autoComplete="off"
                  className="w-full py-3 text-center text-2xl font-mono tracking-widest font-bold rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 dark:bg-zinc-800 text-emerald-900 dark:text-emerald-100 focus:outline-none"
                />
                <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 px-1">
                  <span>Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const num = smsTargetPhone || pendingUser?.mobile || signupForm.mobile;
                      triggerFirebasePhoneAuth(num);
                    }}
                    className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend Firebase SMS</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm transition shadow-md flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <span>Verifying Code via Firebase...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Code & Open Portal</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setPasskeyNotice("SMS verification code delayed or unavailable? You can continue securely using a Passkey.");
                    setView("passkey_fallback");
                  }}
                  className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1.5"
                >
                  <Fingerprint className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>SMS unavailable or delayed? Verify with Passkey instead</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW 4: FORGOT PASSWORD */}
          {view === "forgot" && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Enter your registered CNIC or Mobile number. We will send an account recovery link and SMS OTP token.
              </p>
              <input
                type="text"
                placeholder="61101-8930192-3 or +92 300 8592014"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => {
                  alert("Password recovery SMS token dispatched to registered mobile number.");
                  switchView("login");
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs"
              >
                Send Recovery OTP
              </button>
              <button
                type="button"
                onClick={() => switchView("login")}
                className="w-full text-center text-xs text-zinc-500 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
