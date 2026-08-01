import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

/** Use one comparable E.164 representation for SMS and stored profiles. */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  const value = phoneNumber.trim().replace(/[\s\-()]/g, "");
  if (!value) return "";
  if (value.startsWith("+")) return value;
  if (value.startsWith("00")) return `+${value.slice(2)}`;

  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+92${digits.slice(1)}`;
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  if (digits.length === 10 && /^[2-9]/.test(digits)) return `+1${digits}`;
  return `+92${digits}`;
};

/**
 * Retry helper for Firestore operations to automatically retry recoverable network/database errors once.
 */
export async function retryFirestoreOp<T>(op: () => Promise<T>, retriesLeft = 1): Promise<T> {
  try {
    return await op();
  } catch (err: any) {
    console.error("[Firestore Operation Failed]:", {
      code: err?.code,
      message: err?.message,
      stack: err?.stack,
      rawError: err,
    });
    if (retriesLeft > 0) {
      console.warn(`[Firestore Retry] Retrying operation (retries left: ${retriesLeft})...`);
      await new Promise((res) => setTimeout(res, 500));
      return retryFirestoreOp(op, retriesLeft - 1);
    }
    const formattedErr = new Error(`[Firestore ${err?.code || "error"}]: ${err?.message || "Operation failed"}`);
    (formattedErr as any).code = err?.code;
    throw formattedErr;
  }
}

/**
 * Creates a new user in Firebase Auth with email & password
 */
export const registerWithFirebaseEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await createUserWithEmailAndPassword(auth, email.trim(), password);
  } catch (err: any) {
    console.warn("[Firebase Auth Register Status]:", err?.code || err?.message);
    const formatted = new Error(`[Firebase Auth ${err?.code || "registration_failed"}]: ${err?.message || "User registration failed."}`);
    (formatted as any).code = err?.code;
    throw formatted;
  }
};

/**
 * Signs in user with email & password in Firebase Auth
 */
export const loginWithFirebaseEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (err: any) {
    console.warn("[Firebase Auth Login Status]:", err?.code || err?.message);
    const formatted = new Error(`[Firebase Auth ${err?.code || "auth_failed"}]: ${err?.message || "Authentication failed."}`);
    (formatted as any).code = err?.code;
    throw formatted;
  }
};

/**
 * Recursively removes any keys with `undefined` values from an object.
 * Firestore setDoc/updateDoc fails if any value in the object is undefined.
 */
export const cleanUndefinedFields = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedFields);
  }
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = typeof value === "object" && value !== null ? cleanUndefinedFields(value) : value;
    }
  }
  return clean;
};

/**
 * Saves or updates user passkey metadata in Firestore
 */
export const savePasskeyToFirestore = async (userId: string, passkey: any) => {
  return retryFirestoreOp(async () => {
    const activeUid = auth.currentUser?.uid || userId;
    if (!activeUid) {
      console.warn("[Firestore] savePasskeyToFirestore called without active auth user!");
      return;
    }
    const userRef = doc(db, "users", activeUid);
    const passkeyData = cleanUndefinedFields({
      passkeys: arrayUnion(passkey),
      hasPasskey: true,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(userRef, passkeyData, { merge: true });
    console.log("[Firestore] Passkey metadata saved for UID:", activeUid);
  }).catch((err) => {
    console.error("Error saving passkey to Firestore:", err);
  });
};

/**
 * Retrieves user passkeys from Firestore
 */
export const getPasskeysFromFirestore = async (userId: string) => {
  return retryFirestoreOp(async () => {
    const activeUid = auth.currentUser?.uid || userId;
    if (!activeUid) return [];
    const userRef = doc(db, "users", activeUid);
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().passkeys) {
      return snap.data().passkeys || [];
    }
    return [];
  }).catch((err) => {
    console.error("Error fetching passkeys from Firestore:", err);
    return [];
  });
};

/**
 * Initializes invisible or visible RecaptchaVerifier for SMS Phone Auth
 */
export const initRecaptchaVerifier = (containerId: string, onVerify?: () => void): RecaptchaVerifier => {
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      console.warn("[Firebase Auth] Clearing existing recaptcha verifier failed:", e);
    }
    (window as any).recaptchaVerifier = null;
  }

  // Ensure container element is fresh to prevent "reCAPTCHA has already been rendered in this element"
  const container = document.getElementById(containerId);
  if (container) {
    const parent = container.parentNode;
    if (parent) {
      const newContainer = document.createElement("div");
      newContainer.id = containerId;
      parent.replaceChild(newContainer, container);
    } else {
      container.innerHTML = "";
    }
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: (response: any) => {
      console.log("[Firebase Auth] reCAPTCHA solved successfully.", response);
      if (onVerify) onVerify();
    },
    "expired-callback": () => {
      console.warn("[Firebase Auth] reCAPTCHA expired, please request code again.");
    }
  });

  (window as any).recaptchaVerifier = verifier;
  return verifier;
};

/**
 * Sends SMS verification code via Firebase Phone Auth
 */
export const sendPhoneAuthCode = async (
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  const formattedPhone = normalizePhoneNumber(phoneNumber);

  console.log("[Firebase Auth] Calling signInWithPhoneNumber for:", formattedPhone);

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    console.log("[Firebase Auth] signInWithPhoneNumber succeeded! ConfirmationResult obtained.");
    return confirmationResult;
  } catch (err: any) {
    console.warn("[Firebase Auth Phone Status]:", err?.code || err?.message);
    throw err;
  }
};

/** Sends a genuine Firebase SMS challenge for re-authenticating the active account. */
export const sendPhoneReauthenticationCode = async (
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<string> => {
  if (!auth.currentUser) throw new Error("Please sign in again before confirming this change.");
  const formattedPhone = normalizePhoneNumber(phoneNumber);
  if (!formattedPhone) throw new Error("A registered mobile number is required.");

  const provider = new PhoneAuthProvider(auth);
  return provider.verifyPhoneNumber({ phoneNumber: formattedPhone }, verifier);
};

/** Verifies the actual Firebase SMS code without switching to a different user. */
export const confirmPhoneReauthenticationCode = async (verificationId: string, code: string) => {
  if (!auth.currentUser) throw new Error("Your session has ended. Please sign in again.");
  const credential = PhoneAuthProvider.credential(verificationId, code.trim());
  return reauthenticateWithCredential(auth.currentUser, credential);
};

/** Re-authenticates the active email/password account before a sensitive action. */
export const reauthenticateWithPassword = async (password: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser?.email) {
    throw new Error("This session was not signed in with email and password. Use your registered passkey or SMS instead.");
  }
  const credential = EmailAuthProvider.credential(currentUser.email, password);
  return reauthenticateWithCredential(currentUser, credential);
};

/**
 * Confirms OTP code sent via SMS
 */
export const confirmPhoneAuthCode = async (
  confirmationResult: ConfirmationResult,
  code: string
): Promise<UserCredential> => {
  console.log("[Firebase Auth] Confirming OTP code with Firebase...");
  try {
    const userCredential = await confirmationResult.confirm(code);
    console.log("[Firebase Auth] OTP verified successfully! User UID:", userCredential.user.uid);
    return userCredential;
  } catch (err: any) {
    console.warn("[Firebase Auth Verification Status]:", err?.code || err?.message);
    throw err;
  }
};

/**
 * Saves user profile data to Firestore database
 */
export const saveUserProfileToFirestore = async (userId: string, profileData: any) => {
  return retryFirestoreOp(async () => {
    const targetUid = userId || auth.currentUser?.uid;
    if (!targetUid) {
      console.warn("[Firestore] saveUserProfileToFirestore called without a valid targetUid or active auth user!");
      return;
    }
    const userRef = doc(db, "users", targetUid);
    const dataToSave = cleanUndefinedFields({
      ...profileData,
      mobile: normalizePhoneNumber(profileData?.mobile || profileData?.phoneNumber || ""),
      phoneNumber: normalizePhoneNumber(profileData?.phoneNumber || profileData?.mobile || ""),
      id: targetUid,
      uid: targetUid,
      updatedAt: new Date().toISOString(),
      createdAt: profileData?.createdAt || profileData?.registrationDate || new Date().toISOString()
    });
    await setDoc(userRef, dataToSave, { merge: true });
    console.log("[Firestore] User profile saved successfully to users/" + targetUid);
  });
};

/** Find the portal profile attached to a Firebase-verified phone number. */
export const getUserProfileByPhoneNumber = async (phoneNumber: string) => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone) return null;

  return retryFirestoreOp(async () => {
    const users = collection(db, "users");
    const result = await getDocs(query(users, where("phoneNumber", "==", normalizedPhone), limit(1)));
    return result.empty ? null : { id: result.docs[0].id, ...result.docs[0].data() };
  }).catch((err) => {
    console.error("Error finding profile by verified phone number:", err);
    return null;
  });
};

/**
 * Retrieves user profile data from Firestore database
 */
export const getUserProfileFromFirestore = async (userId: string) => {
  return retryFirestoreOp(async () => {
    const targetUid = userId || auth.currentUser?.uid;
    if (!targetUid) return null;
    const userRef = doc(db, "users", targetUid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      console.log("[Firestore] Retrieved user profile from users/" + targetUid);
      return data;
    } else {
      console.warn("[Firestore] No user document found at users/" + targetUid);
      return null;
    }
  });
};

/**
 * Searches Firestore for an existing user profile by email, phone, CNIC, or ID
 */
export const findUserProfileInFirestore = async (identifier: string) => {
  if (!identifier) return null;
  const clean = identifier.trim();
  if (!clean) return null;

  // 1. Try direct lookup by ID
  try {
    const directSnap = await getDoc(doc(db, "users", clean));
    if (directSnap.exists()) {
      return directSnap.data();
    }
  } catch (e) {}

  // 2. Query Firestore by email, mobile, or cnic
  try {
    const usersRef = collection(db, "users");

    if (clean.includes("@")) {
      const q = query(usersRef, where("email", "==", clean.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0].data();
    }

    const digitsOnly = clean.replace(/\D/g, "");
    if (digitsOnly.length >= 7) {
      const qCnic = query(usersRef, where("cnic", "==", clean));
      const snapCnic = await getDocs(qCnic);
      if (!snapCnic.empty) return snapCnic.docs[0].data();

      const qMobile = query(usersRef, where("mobile", "==", clean));
      const snapMobile = await getDocs(qMobile);
      if (!snapMobile.empty) return snapMobile.docs[0].data();

      // Scan collection documents as fallback
      const allDocs = await getDocs(usersRef);
      for (const d of allDocs.docs) {
        const u = d.data();
        const uMobileDigits = (u.mobile || u.phoneNumber || "").replace(/\D/g, "");
        const uCnicDigits = (u.cnic || "").replace(/\D/g, "");
        if (
          (digitsOnly && (uMobileDigits === digitsOnly || uCnicDigits === digitsOnly)) ||
          (u.email && u.email.toLowerCase() === clean.toLowerCase())
        ) {
          return u;
        }
      }
    }
  } catch (err) {
    console.warn("[Firestore Profile Search Warning]:", err);
  }

  return null;
};
